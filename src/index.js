#!/usr/bin/env node

const RisPort70 =  require('./RisPort70');

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








