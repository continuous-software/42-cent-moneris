[![Build Status](https://travis-ci.org/continuous-software/node-moneris.svg?branch=master)](https://travis-ci.org/continuous-software/node-moneris)

![node-moneris](https://upload.wikimedia.org/wikipedia/en/6/6b/Moneris_Logo.svg)

## Installation ##

    $ npm install -s node-moneris

## Usage

```javascript
var moneris = require('node-moneris');
var client = new MonerisMerchant({
    MERCHANT_ID: '<PLACEHOLDER>',
    USER_ID: '<PLACEHOLDER>',
    SSL_PIN: '<PLACEHOLDER>'
});
```

## Gateway API

This SDK is natively compatible with [42-cent](https://github.com/continuous-software/42-cent).  
It implements the [BaseGateway](https://github.com/continuous-software/42-cent-base) API.


## Test Values

string processing_country_code = "CA";
mpgReq.setTestMode(true);
String store_id = "store5";
String api_token = "yesguy";

MasterCard
5454545454545454

Make sure testing transaction amounts are less than $11
For specific return messages, check the Penny Value Simulator -- https://developer.moneris.com/More/Testing/Penny%20Value%20Simulator
