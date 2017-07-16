/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

const Frame = require('./Frame');

const BUFFER_KEY = Symbol('message::buffer');

/**
 * @param {Buffer} data
 * @param {Number} type
 * @constructor
 */
class Message {
  constructor(data, type) {
    this[BUFFER_KEY] = data;
    this.type = type;
    this.masked = Message.maskedDefault;
    this.frameSize = Message.frameSizeDefault;
  }

  valueOf() {
    var list = Frame.splitData(this[BUFFER_KEY], this.frameSize, this.masked);
    Frame.bounds(list, this.type);
    return list;
  }

  [Symbol.iterator]() {
    return new MessageIterator(this);
  }
}


/**
 * it will get all packages of valueOf and iterate through them
 *
 */
class MessageIterator {
  constructor(message) {
    this._list = message.valueOf();
    this._length = this._list.length;
    this._index = 0;
  }

  next() {
    var currentIndex = this._index++;
    var result;
    if (currentIndex >= this._length) {
      result = { value: undefined, done: true };
    } else {
      result = { value: this._list[currentIndex], done: false };
    }
    return result;
  }

  /**
   * @param {*} data
   * @returns {Buffer}
   */
  static createBuffer(data) {
    var result;
    if (data === null || data === undefined) {
      result = Buffer.allocUnsafe(0);
    } else {
      if (data instanceof Buffer) {
        result = data;
      } else if (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer) {
        result = data.buffer;
      } else if (typeof(data) === 'string') {
        result = Buffer.allocUnsafe(data);
      } else {
        result = Buffer.allocUnsafe(JSON.stringify(data));
      }
    }
    return result;
  }

  /**
   * @param {*} data
   * @returns {number}
   * @constructor
   */
  static getType(data) {
    if (data === null || data === undefined || data instanceof Buffer || (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer)) {
      return Frame.BINARY_TYPE;
    }
    return Frame.TEXT_TYPE;
  }

  /**
   * @param {*} data
   * @param {Number} [type]
   * @returns {Message}
   */
  static create(data, type) {
    if (isNaN(type)) {
      type = Message.getType(data);
    }
    return new Message(Message.createBuffer(data), type);
  }
}

Message.maskedDefault = false;
Message.frameSizeDefault = 0;