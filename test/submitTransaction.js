var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var MonerisGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var Order = require('42-cent-model').Order;
var casual = require('casual');

describe('Canada submitTransaction', function () {
  var service;

  beforeEach(function () {
    service = MonerisGateway(conf);
  });


  it('should submit transaction request', function () {
    var creditCard = new CreditCard()
      .withCreditCardNumber('5454545454545454')
      .withExpirationYear(2017)
      .withExpirationMonth(1)
      .withCvv2('666');

    var order = new Order()
      .withAmount('7.00');

    return service.submitTransaction(order, creditCard).then(function (transaction) {
      assert.equal(transaction._original.order_id, transaction.result.ReceiptId);
      assert.equal(transaction._original.amount, transaction.result.TransAmount);
      assert.equal(transaction.result.Message[0].slice(0,8), 'APPROVED');
      assert.notEqual(transaction.transactionId, null);
    });
  });

});
