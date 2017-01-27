var assert = require('assert');
var util = require('util');
var BaseGateway = require('42-cent-base').BaseGateway;
var mapKeys = require('42-cent-util').mapKeys;
var GatewayError = require('42-cent-base').GatewayError;
var request = require('request');
var xml2js = require('xml2js');

var assign = require('object-assign');

var Q = require('q');

var xmlBuilder = new xml2js.Builder();
xmlBuilder.options.rootName = "request";



/**
 *
 * @param options
 * @constructor
 * @augments BaseGateway
 */
function MonerisGateway (options) {

  assert.ok(options.store_id, 'store_id must be provided');
  assert.ok(options.api_token, 'api_token must be provided');
  assert.ok(options.country, 'country must be provided');

  this.store_id = options.store_id;
  this.api_token = options.api_token;
  this.country = options.country;

  if(options.country == 'CA'){
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
  var deferred = Q.defer();

  var data = {
    store_id: self.store_id,
    api_token: self.api_token
  };
  data[type] = body;

  data = xmlBuilder.buildObject(data);
  //console.log("Sending\n" + data);

  var options = {
    uri: self.endpoint + '/gateway2/servlet/MpgRequest',
    method: 'POST',
    body: data
  };

  request(options, function (error, res, body) {
    if (error) {
      console.log(error);
      return deferred.reject(error);
    }

    // Convert to JSON
    xml2js.parseString(body, function (err, result) {
      var response = result.response;
      var receipt = util.isArray(response.receipt) ?
        response.receipt[0] : response.receipt;

      return deferred.resolve(receipt);
    });
  });

  return deferred.promise.nodeify();

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

  var expiryYear = creditcard.expirationYear.toString().slice(2);
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
        _original: body,
        result: result,
        transactionId: result.TransID
      };
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
    order_id: options.order_id,
    txn_number: transactionId,
    crypt_type: 7
  });

  return self._post('purchasecorrection', assign(body, {}))
    .then(function (result) {
      return {
        _original: body,
        result: result
      };
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
    order_id: options.order_id,
    txn_number: transactionId,
    amount: options.amount,
    crypt_type: 7
  });

  return self._post('refund', assign(body, {}))
    .then(function (result) {
      return {
        _original: body,
        result: result
      };
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


