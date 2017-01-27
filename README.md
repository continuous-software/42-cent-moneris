[![Build Status](https://travis-ci.org/continuous-software/42-cent-moneris.svg?branch=master)](https://travis-ci.org/continuous-software/42-cent-moneris)

![node-moneris](https://upload.wikimedia.org/wikipedia/en/6/6b/Moneris_Logo.svg)

## Installation ##

    $ npm install -s 42-cent-moneris

## Usage

```javascript
var moneris = require('node-moneris');
var client = new MonerisMerchant({
    store_id: '<PLACEHOLDER>',
    api_token: '<PLACEHOLDER>',
    country: '<PLACEHOLDER>',
    testMode: '<PLACEHOLDER>'
});
```

## Gateway API

This SDK is natively compatible with [42-cent](https://github.com/continuous-software/42-cent).  
It implements the [BaseGateway](https://github.com/continuous-software/42-cent-base) API.


## Test Values


```javascript
var moneris = require('node-moneris');
var client = new MonerisMerchant({
    store_id: 'store5',
    api_token: 'yesguy',
    country: 'CA',
    testMode: true
});
```

MasterCard
5454545454545454

Make sure testing transaction amounts are less than $11
For specific return messages, check the Penny Value Simulator -- https://developer.moneris.com/More/Testing/Penny%20Value%20Simulator
