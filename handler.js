'use strict';
const request = require("request");
const $ = require('fast-html-parser');
const n = require('numjs');

//Import Function
const _fn = require('./fn').fn;

//Invironment variables initialization
const _var = require('./var').var;

//Master Function
const m = {
  source: null,
  initSources: ()=>{
    if(m.source === null){
      if(_var.DEPLOY){
        _fn.log("//From S3");
        m.source = _fn.s3YamlJson(_var.BUCKET, _var.YAML_FILE);
      }else{
        _fn.log("//From Local");
        m.source = _fn.localYamlJson(_var.YAML_FILE);
      }
    }else{
      _fn.log("//From Cache");
    }
  },
  pullWebsite: ()=>{

  },
}

//Main
module.exports.main = (events, context, callback) => {
  console.log("----------Request-----------");
  console.log(events);
  console.log("-----------Logs-------------");      
  
  //performance check start
  _fn.perfStart();
  
  //Set Callback function
  _fn.init(callback)
  
  try{
    //inits
    let action = events.action || "DAILY";
    let format = events.format || "WORDLY";
    let query = decodeURIComponent(events.query) || null;
    
    //Load the sources
    m.initSources();

    //format: color, wordly, numly
    switch(action.toUpperCase()){
      case "PULL":{
        //first clone the source object
        let keys = _fn.keys(m.source);

        //Loop all listed sources
        keys.forEach((key)=>{
          let obj = m.source[key];

          //[ 'api', 'website', 'video', 'image' ]
          switch(key){
            case "api":{
              //Handle locally
            }break;
            case "website":{
              //Handle locally
            }break;
            case "video":{
              //Pass to other lambda via sns
            }break;
            case "image":{
              //Pass to other lambda via sns
            }break;
          }
        });
      }break;
      case "DAILY":{
      }break;
      case "HOURLY":{
      }break;
      case "MINUTELY":{
      }break;
      default:{
        throw {
          message: "Nothing performed, you may have entered an incorrect or invalid action."
        };
      }break;
    }
  }catch(error){
    _fn.handleErrors(error);
  }

  //temp
  _fn.sexyback(null,{})
};