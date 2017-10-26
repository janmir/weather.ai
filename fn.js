'use strict';

const yaml = require('js-yaml');
const aws = require('aws-sdk');
const fs = require('fs');
const moment = require('moment-timezone');
const transform = require('moment-transform');
const now = require("performance-now");
const request = require("request");
const $ = require('fast-html-parser');
const sync = require('deasync');
const _var = require('./var').var;

module.exports.fn =  {
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
      this.fn.callback = callback;  
    },
    sexyback: (events, response) => {
      if(this.fn.callback !== null){
        console.log("---------Response-----------");            
  
        //add performance
        response.execution = this.fn.perfEnd();
  
        //Log only if deployed
        if(_var.DEPLOY){
          console.log(response);
        }
        
        this.fn.callback(null, response);
      }else{
        console.error("Error: Callback is Null.")
      }
    },
    log: (str)=>{
      if(_var.DEBUG){
        console.log(str);
      }
    },
    perfStart:() => {
      this.fn.data.performance.start = now();
    },
    perfEnd:() => {
      this.fn.data.performance.end = now();
      this.fn.data.performance.execution = parseFloat((this.fn.data.performance.end - this.fn.data.performance.start).toFixed(2));
  
      return this.fn.data.performance.execution;
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
      if(_var.SEND_MAIL){
        //Send email
        if(email !== ""){
          
          let ses = new aws.SES({
            region:EMAIL_REGION
          });
    
          message = this.fn.formatMessage(message);
    
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
    
          this.fn.log("-----------Email------------");
          this.fn.log(message);
          
          if(DEPLOY){
            ses.sendEmail(params, (err, data) => {
              if (err) this.fn.log(err, err.stack)
              else this.fn.log(data)
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
    s3YamlJson: (bucket, yaml_file)=>{
      var obj = null;
      let s3 = new aws.S3();
      var params = {
          Bucket: bucket,
          Key: yaml_file
      }
      var done = false;
      s3.getObject(params, function(err, data) {
          if(!err){ 
              let file = this.fn.data.Body.toString('utf-8');
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
    localYamlJson: (yaml_file)=>{
      //Get from local file
      let file = fs.readFileSync(__dirname +'/' + yaml_file, 'utf8')
      let config = yaml.safeLoad(file);
      let indentedJson = JSON.stringify(config, null, 4);
  
      return JSON.parse(indentedJson);
    },
    handleErrors: (error) => {
      this.fn.sendMail(_var.EMAIL, "<span style='color:red;font-weight:bold'>An Error Occured:</span> <br/>" +  error.message);
      this.fn.sexyback(null, {result: false, error:error.message});
    },
    clone: (old) => {
        return JSON.parse(JSON.stringify(error));
    },
    keys: (obj) => {
        return Object.keys(obj);
    }
  };