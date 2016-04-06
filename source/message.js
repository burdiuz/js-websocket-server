/**
 * Created by Oleg Galaburda on 05.04.16.
 */
'use strict';
var Frame = require('./frame.js');

var BUFFER_KEY = Symbol('message::buffer');

/**
 * @param {Buffer} data
 * @param {Number} type
 * @constructor
 */
function Message(data, type) {
  this[BUFFER_KEY] = data;
  this.type = type;
  this.masked = Message.maskedDefault;
  this.frameSize = Message.frameSizeDefault;
}

function valueOf() {
  var list = Frame.splitData(this[BUFFER_KEY], this.frameSize, this.masked);
  Frame.bounds(list, this.type);
  return list;
}

Message.prototype.valueOf = valueOf;

function iteratorFactory() {
  return new MessageIterator(this);
}

Message.prototype[Symbol.iterator] = iteratorFactory;
/**
 * it will get all packages of valueOf and iterate through them
 *
 */
function MessageIterator(message) {
  this._list = message.valueOf();
  this._length = this._list.length;
  this._index = 0;
}

MessageIterator.prototype.next = function() {
  var currentIndex = this._index++;
  var result;
  if (currentIndex >= this._length) {
    result = {value: undefined, done: true};
  } else {
    result = {value: this._list[currentIndex], done: false};
  }
  return result;
};

// ------------------ static

/**
 * @param {*} data
 * @returns {Buffer}
 */
function Message_createBuffer(data) {
  var result;
  if (data === null || data === undefined) {
    result = new Buffer(0);
  } else {
    if (data instanceof Buffer) {
      result = data;
    } else if (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer) {
      result = data.buffer;
    } else if (typeof(data) === 'string') {
      result = new Buffer(data);
    } else {
      result = new Buffer(JSON.stringify(data));
    }
  }
  return result;
}

/**
 * @param {*} data
 * @returns {number}
 * @constructor
 */
function Message_getType(data) {
  if (data === null || data === undefined || data instanceof Buffer || (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer)) {
    return Message.BINARY_TYPE;
  }
  return Message.TEXT_TYPE;
}

/**
 * @param {*} data
 * @param {Number} [type]
 * @returns {Message}
 */
function Message_create(data, type) {
  if (isNaN(type)) {
    type = Message.getType(data);
  }
  return new Message(Message.createBuffer(data), type);
}

Message.createBuffer = Message_createBuffer;
Message.create = Message_create;
Message.getType = Message_getType;
Message.maskedDefault = false;
Message.frameSizeDefault = 0;

Message.CONTINUATION_TYPE = 0x0;
Message.TEXT_TYPE = 0x1;
Message.BINARY_TYPE = 0x2;
Message.CLOSE_TYPE = 0x8;
Message.PING_TYPE = 0x9;
Message.PONG_TYPE = 0xA;

module.exports = Message;
