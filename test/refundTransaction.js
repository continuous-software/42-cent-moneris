var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var MonerisGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var Order = require('42-cent-model').Order;
var casual = require('casual');

describe('Canada refundTransaction', function () {
  var service;

  beforeEach(function () {
    service = MonerisGateway(conf);
  });


  it('should refund a transaction', function (done) {
    var creditCard = new CreditCard()
      .withCreditCardNumber('5454545454545454')
      .withExpirationYear(2017)
      .withExpirationMonth(1)
      .withCvv2('666');

    var order = new Order()
      .withAmount('7.00');

    service.submitTransaction(order, creditCard)
      .then(function (transaction) {
        var transId = transaction.transactionId;
        var options = {};
        options.order_id = transaction.result.ReceiptId[0];
        options.amount = transaction._original.amount;
        return service.refundTransaction(transId, options);
      })
      .then(function (response) {
        assert(response._original, '_original should be defined');
        assert.equal(response._original.order_id, response.result.ReceiptId);
        assert.equal(response.result.Message[0].slice(0,8), 'APPROVED');
        done();
      }).catch(function (err) {
      done(err);
    });

  });

  it('should reject the promise when the gateway returns error for refund', function (done) {
    var transId = '666';
    var options = {};
    options.order_id = '777';
    options.amount = '8.99';

    service.voidTransaction(transId, options)
      .then(function (response) {
        assert.equal(response.result.Complete, 'false');
        done();
      }, function (err) {
        assert(err instanceof GatewayError);
        assert(err.message.indexOf('Transaction not found') !== -1);
        assert(err._original, '_original should be defined');
        done();
      })
  });

});



