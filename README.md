node-risport70
===========

The RisPort70 (Real-Time Information Port) service provides an API for querying the current connection status of phones, devices, and applications connected to Cisco Unified Communications Manager (Unified CM). Details provided by RisPort70 include last known connection and registration state, IP address, and model information. The API provides queries, for example by name, for single device or application instances, and wildcard queries which return the status of multiple devices at once.

The RisPort70 API is SOAP based, node-risport70 project provides an easier way of accessing this API from Node JS applications. The results are converted into JSON objects.

[RisPort70 API Reference](https://developer.cisco.com/docs/sxml/#!risport70-api-reference/risport70-api-reference)

Installation
============

`npm install node-risport70`

Sample Usage
=====



```javascript
const RisPort70 =  require('node-risport70');

const serviceOptions = {
    host: '198.18.133.3' || process.env.CUCM,
    user: 'administrator' || process.env.UCUSER,
    pass: 'C1sco12345' || process.env.UCPASS,
    timeout: 8000
};

//Disable SSL Certificate Check  (most are self signed)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const RisPort70Service = new RisPort70.RisPort70(serviceOptions);
const testPhone = 'SEPEC1D8B2B6DEC';

RisPort70Service.getPhoneByName(testPhone)
    .then(phone => {
        console.log('phone =', phone);
    })
    .catch(console.error);

RisPort70Service.selectCMDevice({
    MaxReturnedDevices: 10000,
    DeviceClass: RisPort70.DeviceClass.Any,
    Model: RisPort70.Models.All,
    Status: RisPort70.Status.Any,
    NodeName: '',
    SelectBy: RisPort70.SelectBy.Name,
    Protocol: RisPort70.Protocol.Any,
    DownloadStatus: RisPort70.DownloadStatus.Any,
    items: ['SEPEC1D8B2B6DEC', 'SEP70C9C6694624', 'cxout_7167'],
}).then(devices => {
    console.log(`returned devices = ${JSON.stringify(devices)} `);
})
    .catch(console.error);

```


Project Sponsor
===============
This project has been created thanks to support of: 
Call Record Analyzer (CRA) https://www.callrecordanalyzer.com/ 


Disclaimer
===============
Many ideas in this came from: https://github.com/levensailor/node-cisco-axl
# node-risport70