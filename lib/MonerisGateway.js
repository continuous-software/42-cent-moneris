var assert = require('assert');
var util = require('util');
var BaseGateway = require('42-cent-base').BaseGateway;
var mapKeys = require('42-cent-util').mapKeys;
var GatewayError = require('42-cent-base').GatewayError;
var request = require('request');
var xml2js = require('xml2js');

var rp = require('request-promise');
var Q = require('q');


var assign = require('object-assign');

var xmlBuilder = new xml2js.Builder();
xmlBuilder.options.rootName = "request";



/**
 *
 * @param options
 * @constructor
 * @augments BaseGateway
 */
function MonerisGateway (options) {

  assert.ok(options.STORE_ID, 'STORE_ID must be provided');
  assert.ok(options.API_TOKEN, 'API_TOKEN must be provided');
  assert.ok(options.COUNTRY, 'country must be provided');

  this.STORE_ID = options.store_id;
  this.API_TOKEN = options.API_TOKEN;
  this.COUNTRY = options.COUNTRY;

  if(options.COUNTRY == 'CA'){
    // Canada endpoints
    this.endpoint = options.testMode === true ? 'https://esqa.moneris.com' : 'https://www3.moneris.com';
  } else {
    // USA endpoints
    this.endpoint = options.testMode === true ? 'https://esplusqa.moneris.com' : 'https://esplus.moneris.com';
  }

  BaseGateway.call(this, options);
}

util.inherits(MonerisGateway, BaseGateway);

MonerisGateway.prototype.resolveEndpoint = function (path) {
  return this.endpoint + path;
};


MonerisGateway.prototype._post = function (type, body) {
  var self = this;

  var data = {
    store_id: self.STORE_ID,
    api_token: self.API_TOKEN
  };
  data[type] = body;
  data = xmlBuilder.buildObject(data);

  var options = {
    uri: self.endpoint + '/gateway2/servlet/MpgRequest',
    method: 'POST',
    body: data
  };

  return rp(options)
    .then(function (res) {
      var deferred = Q.defer();

      xml2js.parseString(res, function (err, result) {
        var response = result.response;
        var receipt = util.isArray(response.receipt) ?
          response.receipt[0] : response.receipt;

        return deferred.resolve(receipt);

      });
      return deferred.promise.nodeify();
    })
    .then(function (receipt){
      if(receipt && receipt.Message[0].slice(0,8) == 'APPROVED'){
        return receipt;
      } else {
        throw receipt;
      }
    })
    .catch(function (err) {
      throw err;
    });
};



/**
 * @inheritDoc
 * order_id - string - limits: 50 character alphanumeric string created by the merchant and sent to Moneris
 * amount - string - limits: 9 character decimal -- $0.00 is not allowed
 * pan - string - limits: 20 character
 * expdate - string - limits: 4 character numeric - YYMM format
 * crypt_type - string - limtis: 1 character alphanumeric (7 - non-authenticated transaction / ecommerce)
 *
 */
MonerisGateway.prototype.submitTransaction = function submitTransaction (order, creditcard, prospect, other) {

  var self = this;

  var expiryYear = creditcard.expirationYear.toString().slice(-2);
  var expiryMonth = ("0" + creditcard.expirationMonth).slice(-2);

  var lastfour = creditcard.creditCardNumber.toString().substr(creditcard.creditCardNumber.toString().length - 4);
  var date = new Date();

  var decimalAmount = parseFloat(Math.round(order.amount * 100) / 100).toFixed(2);

  var body = assign({
    order_id: 'order' + Math.floor(date.getTime()) + lastfour,
    amount: decimalAmount,
    pan: creditcard.creditCardNumber,
    expdate: expiryYear + expiryMonth,
    crypt_type: 7
  });


  return self._post('purchase', assign(body, other || {}))
    .then(function (result) {
      /*console.log("CardType = " + result.CardType);
      console.log("TransAmount = " + result.TransAmount);
      console.log("TxnNumber = " + result.TxnNumber);
      console.log("ReceiptId = " + result.ReceiptId);
      console.log("TransType = " + result.TransType);
      console.log("ReferenceNum = " + result.ReferenceNum);
      console.log("ResponseCode = " + result.ResponseCode);
      console.log("ISO = " + result.ISO);
      console.log("Message = " + result.Message);
      console.log("IsVisaDebit = " + result.IsVisaDebit);
      console.log("AuthCode = " + result.AuthCode);
      console.log("Complete = " + result.Complete);
      console.log("TransDate = " + result.TransDate);
      console.log("TransTime = " + result.TransTime);
      console.log("Ticket = " + result.Ticket);
      console.log("TimedOut = " + result.TimedOut);
      console.log("StatusCode = " + result.StatusCode);
      console.log("StatusMessage = " + result.StatusMessage);
      console.log("TransID = " + result.TransID);*/
      return {
        _original: result,
        transactionId: result.TransID[0],
        order_id: body.order_id
      };
    })
    .catch(function (receipt){
      if(receipt && receipt.Message && receipt.Message[0].slice(0,8) == 'DECLINED'){
        throw new GatewayError('DECLINED - ' + receipt.Message[0], receipt);
      } else {
        throw new Error('Can not parse answer from gateway');
      }

    });
};


/**
 * @inheritDoc
 * order_id - string - limits: 50 character alphanumeric string created by the merchant and sent to Moneris
 * txn_number - string - limits: 255 var character
 * crypt_type - string - limtis: 1 character alphanumeric (7 - non-authenticated transaction / ecommerce)
 *
 */
MonerisGateway.prototype.voidTransaction = function voidTransaction (transactionId, options) {
  var self = this;

  var body = assign({
    order_id: options.response.ReceiptId[0],
    txn_number: transactionId,
    crypt_type: 7
  });

  return self._post('purchasecorrection', assign(body, {}))
    .then(function (result) {
      return {
        _original: result,
        transactionId: result.TransID[0]
      };
    })
    .catch(function (result){
      throw new GatewayError('Can not parse answer from gateway', result);
    });
};


/**
 * @inheritDoc
 * order_id - string - limits: 50 character alphanumeric string created by the merchant and sent to Moneris
 * amount - string - limits: 9 character decimal -- $0.00 is not allowed
 * txn_number - string - limits: 255 var character
 * crypt_type - string - limtis: 1 character alphanumeric (7 - non-authenticated transaction / ecommerce)
 *
 */
MonerisGateway.prototype.refundTransaction = function refundTransaction (transactionId, options) {
  var self = this;

  var body = assign({
    order_id: options.response.ReceiptId[0],
    txn_number: transactionId,
    amount: options.amount,
    crypt_type: 7
  });

  return self._post('refund', assign(body, {}))
    .then(function (result) {
      return {
        _original: result,
        transactionId: result.TransID[0]
      };
    })
    .catch(function (result){
      throw new GatewayError('Can not parse answer from gateway', result);
    });

};
















/*
MonerisGateway.prototype.authorizeTransaction = function authorizeTransaction (order, creditCard, prospect, other) {

};

MonerisGateway.prototype.getSettledBatchList = function getSettledTransactionsList (from, to) {

};


MonerisGateway.prototype.getTransactionList = function getTransactionList (batchId) {

};

MonerisGateway.prototype.getTransactionDetails = function getTransactionDetails (transId) {

};


MonerisGateway.prototype.createCustomerProfile = function (payment, billing, shipping, options) {


};

MonerisGateway.prototype.chargeCustomer = function (order, prospect, other) {

};

MonerisGateway.prototype.getCustomerProfile = function getCustomerProfile (profileId) {


};

MonerisGateway.prototype.createSubscription = function createSubscription (cc, prospect, subscriptionPlan, other) {

};
*/


module.exports = MonerisGateway;


