#! /usr/bin/env node

'use strict'
// const config = require('./web.config.js');
const useEval = !false;//config.useEval;
const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;
var accepturl = '/price';

var createKey = function(callback, justkey){
  var key = "" + (Math.floor((+new Date)/10000));
  if(justkey){
    return key;
  }
  var source = `
      (function(){
        var key = ${JSON.stringify( key.split('').map((item) => { return item.charCodeAt() }) )};
        var result = key.map( (item)=>String.fromCharCode(item) ).join('');
        ${callback}(result);
      })();
  `;
  if(useEval){
    var code = JSON.stringify( source.split('').map((item) =>{ return item.charCodeAt() }) );
    return `
        eval(${code}.map(item=>String.fromCharCode(item)).join(''));
    `;
  }
  return source;
}

var regKey = /[?]key=(.*)?/;
var getKey = function(input){
  var result = regKey.exec(input);
  return result && result[1];
};

var regCallback = /[?]callback=([^&]*)?/;
var getCallback = function(input){
  var result = regCallback.exec(input);
  return result && result[1];
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;

  var url = req.url === '/' ? '/index.html' : req.url;
  res.setHeader('Content-Type', 'text/html');
  var filename = path.resolve(__dirname, 'content' + url);

  console.log(filename)
  console.log(fs.existsSync(filename))
  if(fs.existsSync(filename)){
    fs.readFile(filename, (err, data) => {
      res.end(data);
    });
    return;
  }
  else{
    if(req.url.startsWith('/key')){
      res.setHeader('Content-Type', 'application/javascript');
      res.end(createKey(getCallback(req.url)));
      return;
    }
    if(req.url.startsWith('/price')){
      var key = getKey(req.url);
      var acceptKey = createKey('', true);
      if(key === acceptKey || key === acceptKey -1){
        res.end('rel price\n');
      }else{
        res.end('fake price\n');
      }
    }
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
})
