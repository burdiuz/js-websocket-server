/**
 * Created by Oleg Galaburda on 06.04.16.
 */
'use strict';
var Frame = require('./frame.js');

function IncomingStream() {
  var _list = [];
  this.append = function(buffer) {
    _list.push(buffer);
  }
  this.valueOf = function() {
    //Frame.extract(list);
  };
  this.getType = function() {
    return _list.length ? _list[0][0] & (Math.pow(2, 4) - 1) : 0;
  };
  this.isFinished = function() {
    return Boolean(_list.length && _list[0][0] >>> 7);
  };
}

module.exports = IncomingStream;
