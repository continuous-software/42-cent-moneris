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


  it('should refund a transaction', function () {
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

        options.response = {
          ReceiptId: [transaction._original.ReceiptId[0]]
        };
        options.amount = transaction._original.TransAmount;
        return service.refundTransaction(transId, options);
      })
      .then(function (transaction) {
        assert.ok(transaction._original, '_original should be defined');
        assert.equal(transaction._original.Message[0].slice(0,8), 'APPROVED');
        assert.notEqual(transaction._original.ReceiptId, null);
      })

  });

  it('should reject the promise when the gateway returns error for refund', function () {
    var transId = '666';
    var options = {};
    options.response = {
      ReceiptId: ['777']
    };
    options.amount = '8.99';


    return service.refundTransaction(transId, options)
      .then(function () {
      throw new Error('Was not rejected.');
    }).catch(function (err) {
      assert.ok(err instanceof GatewayError, 'expected instance of GatewayError');
      assert.ok(err._original, '_original should be defined');
    });
  });



});



