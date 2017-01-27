var MonerisGateway = require('./lib/MonerisGateway.js');

module.exports = function gatewayFactory(conf) {
  return new MonerisGateway(conf);
};
