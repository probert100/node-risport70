'use strict';

/*
Created by Robert Misior
10/23/2019  version 0.0.1
robert@intelligentvisibility.com

Many ideas in this project come from: https://github.com/levensailor/node-cisco-axl

Link to official Cisco SOAP documentation:
https://developer.cisco.com/docs/sxml/#!risport70-api-reference/risport70-api-reference
*/

const _ = require('lodash');
const parser = require('xml2json');
const Axios = require('axios');
const convert = require('xml-js');
const Models = require('./ModelTable');


const DeviceClass = {
    Any: 'Any',
    Phone: 'Phone',
    Gateway: 'Gateway',
    H323: 'H323',
    Cti: 'Cti',
    VoiceMail: 'VoiceMail',
    MediaResources: 'MediaResources',
    HuntList: 'HuntList',
    SIPTrunk: 'SIPTrunk',
    Unknown: 'Unknown'
};

const Status = {
    Any: 'Any',
    Registered: 'Registered',
    UnRegistered: 'UnRegistered',
    Rejected: 'Rejected',
    PartiallyRegistered: 'PartiallyRegistered',
    Unknown: 'Unknown'
};

const SelectBy = {
    Name: 'Name',
    IPV4Address: 'IPV4Address',
    IPV6Address: 'IPV6Address',
    DirNumber: 'DirNumber', /* (directory number) */
    Description: 'Description',
    SIPStatus: {
        InService: 'InService',
        OutOfService: 'OutOfService',
        PartialService: 'PartialService',
        Unknown: 'Unknown'
    }
};

const Protocol = {
    Any: 'Any',
    SCCP: 'SCCP',
    SIP: 'SIP',
    Unknown: 'Unknown'
};

const DownloadStatus = {
    Any: 'Any',
    Upgrading: 'Upgrading',
    Successful: 'Successful',
    Failed: 'Failed',
    Unknown: 'Unknown'
};


const CtiMgrClass = {
    Provider: 'Provider',
    Device: 'Device',
    Line: 'Line'
};


const CtiItemStatus = {
    Any: 'Any',
    Open: 'Open',
    Closed: 'Closed',
    OpenFailed: 'OpenFailed',
    Unknown: 'Unknown'
};

const SelectAppBy = {
    AppId: 'AppId',
    AppIPV4Address: 'AppIPV4Address',
    AppIPV6Address: 'AppIPV6Address',
    UserId: 'UserId'
};

const AppItems = {
    AppName: 'AppName', //The application name, as specifed by the application.
    AppIPAddress: 'AppIPAddress', // The current or last-known IP address of the application.
    AppInstance: 'AppInstance', //A unique ID generated for each application connection which can disambiguate multiple connections from applications that make multiple CTI connections from the save host.
};

/**
 *
 *
 * @class RisPort70
 *
 * @constructor
 * @param {Object.<Options>} options
 * @property {Object.<Options>} options
 *
 * @example
 *
 * const RisPort70 =  require('./RisPort70');
 *
 * const serviceOptions = {
 * host: process.env.CUCM,
 * user: process.env.UCUSER,
 * pass: process.env.UCUSER,
 * timeout: 8000
 * }
 *
 *
 * const RisPort70Service = new RisPort70.RisPort70(serviceOptions);
 *
 * RisPort70Service.getPhoneByName('SEPEC1D8B2B6DEC')
 *    .then(phone => {
 *       console.log('phone =', phone);
 *   })
 *  .catch(console.error);
 *
 *
 *
 */
class RisPort70 {
    constructor({
                    host,
                    user,
                    pass,
                    timeout
                }) {
        this.host = host || '';
        this.user = user || '';
        this.timeout = timeout || 8000;

        this.authToken = new Buffer(user + ':' + pass).toString('base64');
        this.axios = Axios.create({
            baseURL: 'https://' + host + ':8443/realtimeservice2/services/RISService70',
            timeout: this.timeout
        });
        this.soapEnv = 'http://schemas.xmlsoap.org/soap/envelope/';


        this.getSoapEnv = this.getSoapEnv.bind(this);
        this.constructHeaders = this.constructHeaders.bind(this);
        this.callApi = this.callApi.bind(this);
    }

    getSoapEnv() {
        return (
            `<soapenv:Envelope xmlns:soapenv="${this.soapEnv}" xmlns:ns="${this.soapNs}">` +
            '<soapenv:Header/>' +
            '<soapenv:Body>' +
            '{{body}}' +
            '</soapenv:Body>' +
            '</soapenv:Envelope>'
        );
    }

    constructHeaders(func) {
        return {
            headers: {
                'SOAPAction': `${func}`,
                'Authorization': `Basic ${this.authToken}`,
                'Content-Type': 'text/xml; charset=utf-8',
            }
        };
    }

    callApi([body, headers]) {
        return this.axios.post('', body, headers);
    }

    parseResult(result) {
        return result.data;
    };

    convertXml(xml) {
        return parser.toJson(xml, {
            trim: true, object: true, sanitize: true
        });
    }

    trimJson(json, funcResp, func) {
        return _.chain(
            _.chain(json)
                .result('soapenv:Envelope')
                .result('soapenv:Body')
                .result(`ns:${funcResp}`)
                .result('return')
        ).result(func).valueOf() || false;
    }

    genericRISSCall (soapBody, nameSpaceToRemove = '') {
        const getSoapBody = () => new Buffer(
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soap="http://schemas.cisco.com/ast/soap">\n'+
                ' <soapenv:Header/>\n'+
                '<soapenv:Body>'+
                 soapBody +
                '</soapenv:Body>\n'+
                '</soapenv:Envelope>'
        );

        const getSoapHeaders = () => ({
            headers: {
                'Authorization': `Basic ${this.authToken}`,
                'Content-Type': 'text/xml; charset=utf-8',
            }
        });

        const callApi = ([soapBody, soapHeaders]) =>
            this.axios.post('', soapBody, soapHeaders)

        const parseResult = result => result.data;

        const xmltoJSON = xml => parser.toJson(xml, {
            trim: true,
            object: true,
            sanitize: true
        });
        const trimJSON = json => _.chain(json)
            .result('soapenv:Envelope')
            .result('soapenv:Body')
            .valueOf();

        const removeNameSpace = json =>{
            const str = JSON.stringify(json);
            return JSON.parse(str.replace(new RegExp(nameSpaceToRemove, 'g'), ''));
        };

        // TODO: Error handling at this level

        return Promise.all([
            getSoapBody(),
            getSoapHeaders()
        ])
            .then(callApi)
            .then(parseResult)
            .then(xmltoJSON)
            .then(removeNameSpace)
            .then(trimJSON);
    }


     getPhoneByName(phoneName, nameSpaceToRemove = 'ns1:') {
        const soapBody =
            `<soap:selectCmDeviceExt>
         <soap:StateInfo></soap:StateInfo>
         <soap:CmSelectionCriteria>
            <soap:MaxReturnedDevices>10000</soap:MaxReturnedDevices>
            <soap:DeviceClass>Any</soap:DeviceClass>
            <soap:Model>255</soap:Model>
            <soap:Status>Any</soap:Status>
            <soap:NodeName></soap:NodeName>
            <soap:SelectBy>Name</soap:SelectBy>
            <soap:SelectItems>
             
               <soap:item>
                  <soap:Item>${phoneName}</soap:Item>
               </soap:item>
            </soap:SelectItems>
            <soap:Protocol>Any</soap:Protocol>
            <soap:DownloadStatus>Any</soap:DownloadStatus>
         </soap:CmSelectionCriteria>
      </soap:selectCmDeviceExt>`;

      return this.genericRISSCall(soapBody, nameSpaceToRemove);
    }


    getPhonesByName(phoneNames, nameSpaceToRemove = 'ns1:') {
        const soapBody =
            `<soap:selectCmDeviceExt>
         <soap:StateInfo></soap:StateInfo>
         <soap:CmSelectionCriteria>
            <soap:MaxReturnedDevices>10000</soap:MaxReturnedDevices>
            <soap:DeviceClass>Any</soap:DeviceClass>
            <soap:Model>255</soap:Model>
            <soap:Status>Any</soap:Status>
            <soap:NodeName></soap:NodeName>
            <soap:SelectBy>Name</soap:SelectBy>
            
            <soap:SelectItems>
              ${phoneNames.map(phoneName => '<soap:item>'+
                '<soap:Item>'+phoneName+'</soap:Item>'+
                '</soap:item>')}
            </soap:SelectItems>
            
            <soap:Protocol>Any</soap:Protocol>
            <soap:DownloadStatus>Any</soap:DownloadStatus>
         </soap:CmSelectionCriteria>
      </soap:selectCmDeviceExt>`;

        return this.genericRISSCall(soapBody, nameSpaceToRemove);
    }

    selectCMDevice({
                   MaxReturnedDevices,
                   DeviceClass,
                   Model,
                   Status,
                   NodeName,
                   SelectBy,
                   Protocol,
                   DownloadStatus,
                   items,
               }, nameSpaceToRemove = 'ns1:') {
        const soapBody = `<soap:selectCmDevice>
         <soap:StateInfo></soap:StateInfo>
         <soap:CmSelectionCriteria>
            <soap:MaxReturnedDevices>${MaxReturnedDevices}</soap:MaxReturnedDevices>
            <soap:DeviceClass>${DeviceClass}</soap:DeviceClass>
            <soap:Model>${Model}</soap:Model>
            <soap:Status>${Status}</soap:Status>
            <soap:NodeName>${NodeName}</soap:NodeName>
            <soap:SelectBy>${SelectBy}</soap:SelectBy>
            <soap:SelectItems>
             ${items.map(item => '<soap:item>'+
                                  '<soap:Item>'+item+'</soap:Item>'+
                                   '</soap:item>')}
               
            </soap:SelectItems>
            <soap:Protocol>${Protocol}</soap:Protocol>
            <soap:DownloadStatus>${DownloadStatus}</soap:DownloadStatus>
         </soap:CmSelectionCriteria>
      </soap:selectCmDevice>`;

        return this.genericRISSCall(soapBody, nameSpaceToRemove);
    }


    selectCmDeviceExt({
                       MaxReturnedDevices,
                       DeviceClass,
                       Model,
                       Status,
                       NodeName,
                       SelectBy,
                       Protocol,
                       DownloadStatus,
                       items,
                   }, nameSpaceToRemove = 'ns1:') {
        const soapBody = `<soap:selectCmDeviceExt>
         <soap:StateInfo></soap:StateInfo>
         <soap:CmSelectionCriteria>
            <soap:MaxReturnedDevices>${MaxReturnedDevices}</soap:MaxReturnedDevices>
            <soap:DeviceClass>${DeviceClass}</soap:DeviceClass>
            <soap:Model>${Model}</soap:Model>
            <soap:Status>${Status}</soap:Status>
            <soap:NodeName>${NodeName}</soap:NodeName>
            <soap:SelectBy>${SelectBy}</soap:SelectBy>
            <soap:SelectItems>
             ${items.map(item => '<soap:item>'+
            '<soap:Item>'+item+'</soap:Item>'+
            '</soap:item>')}
               
            </soap:SelectItems>
            <soap:Protocol>${Protocol}</soap:Protocol>
            <soap:DownloadStatus>${DownloadStatus}</soap:DownloadStatus>
         </soap:CmSelectionCriteria>
      </soap:selectCmDeviceExt>`;

        return this.genericRISSCall(soapBody, nameSpaceToRemove);
    }

    selectCtiItem({   MaxReturnedItems,
                      CtiMgrClass,
                      CtiItemStatus,
                      NodeName,
                      SelectAppBy,
                      AppItems,
                      DevNames,
                      DirNumbers
                  }, nameSpaceToRemove = 'ns1:') {
        const soapBody = `<soap:selectCtiItem>
         <soap:StateInfo></soap:StateInfo>
         <soap:CtiSelectionCriteria>
            <soap:MaxReturnedItems>${MaxReturnedItems}</soap:MaxReturnedItems>
            <soap:CtiMgrClass>${CtiMgrClass}</soap:CtiMgrClass>
            <soap:Status>${CtiItemStatus}</soap:Status>
            <soap:NodeName>${NodeName}</soap:NodeName>
            <soap:SelectAppBy>${SelectAppBy}</soap:SelectAppBy>
           
            <soap:AppItems>
               <!--Zero or more repetitions:-->
                ${AppItems.map(app => '<soap:item>'+
            '<soap:AppItem>'+app+'</soap:AppItem>'+
            '</soap:item>')}
            </soap:AppItems>
            
            <soap:DevNames>
               <!--Zero or more repetitions:-->
                ${DevNames.map(deviceName => '<soap:item>'+
            '<soap:DevName>'+deviceName+'</soap:DevName>'+
            '</soap:item>')}
            </soap:DevNames>
            
            <soap:DirNumbers>
               <!--Zero or more repetitions:-->
                 ${DirNumbers.map(dirNumber => '<soap:item>'+
            '<soap:DirNumber>'+dirNumber+'</soap:DirNumber>'+
            '</soap:item>')}
            </soap:DirNumbers>
            
         </soap:CtiSelectionCriteria>
      </soap:selectCtiItem>`;

        return this.genericRISSCall(soapBody, nameSpaceToRemove);
    }
}

module.exports = {
    RisPort70: RisPort70,
    DeviceClass: DeviceClass,
    Status: Status,
    SelectBy: SelectBy,
    Protocol: Protocol,
    DownloadStatus: DownloadStatus,
    Models: Models,
    CtiMgrClass: CtiMgrClass,
    CtiItemStatus: CtiItemStatus,
    SelectAppBy: SelectAppBy,
    AppItems: AppItems
};
