'use strict';

const yaml = require('js-yaml');
const aws = require('aws-sdk');
const fs = require('fs');
const request = require("request");
const moment = require('moment-timezone');
const transform = require('moment-transform');
const now = require("performance-now");
const $ = require('fast-html-parser');
const sync = require('deasync');

//Invironment variables initialization
const URL = process.env.URL || "";
const EMAIL = process.env.EMAIL || "";
const EMAIL_REGION = process.env.EMAIL_REGION || "";
const DEPLOY = process.env.DEPLOY === "true" || false;
const DEBUG = process.env.DEBUG === "true" || false;
const YAML_FILE = process.env.YAML_FILE || "";
const BUCKET = process.env.BUCKET || "";
const JSON_FILE = process.env.JSON_FILE || "untitled"
const SEND_MAIL = process.env.SEND_MAIL === "true" || false;

//Object prototype extends
Array.prototype.last = function(offset = 1) {
  return this[this.length - offset];
}
String.prototype.padStart = function(len, padding) {
  if(this.length < len){
    let diff = len - this.length;

    var arr = Array(diff).fill(padding);
    arr.push(this);
    return arr.join("");
  }else{
    return this;
  }
}

//Master Function
const fn = {
  //The callback itself
  callback: null,
  //Global data
  data: {
    performance:{
      start: 0,
      end: 0,
      execution: 0
    }
  },
  init: (callback)=>{
    fn.callback = callback;  
  },
  sexyback: (events, response) => {
    if(fn.callback !== null){
      console.log("---------Response-----------");            

      //add performance
      response.execution = fn.perfEnd();

      //Log only if deployed
      if(DEPLOY){
        console.log(response);
      }
      
      fn.callback(null, response);
    }else{
      console.error("Error: Callback is Null.")
    }
  },
  log: (str)=>{
    if(DEBUG){
      console.log(str);
    }
  },
  perfStart:() => {
    fn.data.performance.start = now();
  },
  perfEnd:() => {
    fn.data.performance.end = now();
    fn.data.performance.execution = parseFloat((fn.data.performance.end - fn.data.performance.start).toFixed(2));

    return fn.data.performance.execution;
  },
  s3SaveFile: (bucket, filenane, data) => {
    var s3 = new aws.S3();
    var params = {
      Bucket : bucket,
      Key : filenane,
      Body : data
    }

    s3.putObject(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  },
  formatMessage: (message)=>{
    return "<html><body><div>" + message + "</div></body></html>";
  },
  sendMail: (email, message)=>{
    if(SEND_MAIL){
      //Send email
      if(email !== ""){
        
        let ses = new aws.SES({
          region:EMAIL_REGION
        });
  
        message = fn.formatMessage(message);
  
        let params = {
          Destination: {
              ToAddresses: [email]
          },
          Message: {
              Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: message
                }
              },
              Subject: {
              Charset: 'UTF-8',
              Data: 'SES Mail'
              }
          },
          ReturnPath: email,
          Source: email
        }
  
        fn.log("-----------Email------------");
        fn.log(message);
        
        if(DEPLOY){
          ses.sendEmail(params, (err, data) => {
            if (err) fn.log(err, err.stack)
            else fn.log(data)
          });
        }
      }
    }
  },
  stringifierBaby: (which, value)=>{
    switch(which){
      case "time":{
      }break;
      case "day":{
      }break;
      case "month":{
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][value-1] || value;
      }break;
      case "date":{
      }break;
      case "week":{
      }break;
    }

    return value;
  },
  now: (which, separator=':', offset = '+0')=>{
    let value = -1;
    let mom = moment().tz('Asia/Tokyo');
    switch(which){
      case "time":{
        value = mom.format('hh'+separator+'mm A');
      }break;
      case "day":{
        value = mom.transform(offset,'DD').format('DD');
      }break;
      case "month":{
        value = mom.transform(offset,'MM').format('MM');
      }break;
      case "date":{
        value = mom.transform('MM' + separator + offset,'MM'+separator+'DD').format('MM'+separator+'DD');
      }break;
      case "week":{
        value = mom.format('e');
        value = parseInt(value);                                    
        if(value == 0){
            value = 7;
        }
      }break;
    }

    return value;
  },
  s3YamlJson: (bucket, yaml)=>{
    var obj = null;
    let s3 = new aws.S3();
    var params = {
        Bucket: bucket,
        Key: yaml
    }
    var done = false;
    s3.getObject(params, function(err, data) {
        if(!err){ 
            let file = fn.data.Body.toString('utf-8');
            let config = yaml.safeLoad(file);
            let indentedJson = JSON.stringify(config, null, 4);

            obj = JSON.parse(indentedJson);

            //End Wait loop
            done = true;
          }else{
            throw {message:err.message};
        } 
    });

    //Wait for s3 task to finish
    while(!done) {
        sync.runLoopOnce();
    }

    //return parsed yaml
    return obj;
  },
  localYamlJson: (yaml)=>{
    //Get from local file
    let file = fs.readFileSync(__dirname +'/' + yaml, 'utf8')
    let config = yaml.safeLoad(file);
    let indentedJson = JSON.stringify(config, null, 4);

    return JSON.parse(indentedJson);
  }
};

//Main
module.exports.main = (events, context, callback) => {
  console.log("----------Request-----------");
  console.log(events);
  console.log("-----------Logs-------------");      
  
  //performance check start
  fn.perfStart();

  //Set Callback function
  fn.init(callback)
  
  //inits
  let action = events.action || "";
  let query = decodeURIComponent(events.query) || null;
  
  //Log parameters
  let actionStr = "Action: '"+ action + "'";
  console.log(actionStr);
  
  try{
    switch(action.toUpperCase()){
      case "ACTION":{
        //call stuff here
      }break;
      default:{
        throw {message: "Nothing performed, incorrect or invalid action maybe?"};
      }
    }
  }catch(error){
    fn.sendMail(EMAIL, "<span style='color:red;font-weight:bold'>An Error Occured:</span> <br/>" +  error.message);
    fn.sexyback(null, {result: false, error:error.message});
  }
};