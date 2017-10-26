'use strict';
const request = require("request");
const moment = require('moment-timezone');
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

      //swap templates
      let keys = _fn.keys(m.source);
      //Loop all listed sources
      keys.forEach((key)=>{
        m.leaf(m.source, key);
      });

      console.log(m.source);
    }else{
      _fn.log("//From Cache");
    }

    _fn.log(m.source);
  },
  pullWebsite: (obj)=>{
    obj.forEach((element)=>{
      
    });
  },
  leaf: (base, key, depth='')=>{
    let obj = base[key];

    if(obj instanceof Array){
      console.log(depth + "Array");

      var index = 0;
      obj.forEach((element)=>{
        m.leaf(obj, index++, depth+'-');
      });
    }else if(obj instanceof Object){
      console.log(depth + "Object");
      
      _fn.keys(obj).forEach((element)=>{
        m.leaf(obj, element, depth+'-');
      });
    }else if(typeof obj === "string"){
      console.log(depth + "String");
      let str = base[key];
      
      //check if match
      var mtch = str.match(/{([^{}]*)}/g);
      if(mtch !== null){
        mtch.forEach((element)=>{
          let base_element = element;
          element = element.replace(/[{}]+/g, "");

          var value = "????";
          let splt = element.split("#");
          if(splt.length > 1){ //Function call
            console.log(depth  + '-' + "fn:" + splt[0] + ", args:" + splt[1]);

            let fn = splt[0];
            let arg = splt[1];

            switch(fn){
              case 'date':{
                value = moment().tz('Asia/Tokyo').format(arg);
              }break;
            }
          }else{ //Sibling value
            console.log(depth  + '-' + "sibling:" + splt[0]);

            //Assign value
            value = base[splt[0]] || value;
          }

          //assign new value
          base[key] = base[key].replace(base_element,value);
        });
      }
    }
  }
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
  
  var sync = true;
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
              //set sync to false
              sync = false;

              //Handle locally
              m.pullWebsite(obj);
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

  if(sync){
    //For sync tasks
    _fn.sexyback(null,{})
  }
};