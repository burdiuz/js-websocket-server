/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

const Frame = require('./Frame');
const IncomingMessage = require('./IncomingMessage');

class IncomingStream {
  constructor() {
    this._list = [];
  }

  append(buffer) {
    this._list.push(buffer);
  }

  valueOf() {
    return Frame.parseStream(this._list);
  }

  createMessage() {
    return this.isFinal() ? new IncomingMessage(this) : null;
  }

  getType() {
    return this._list.length ? Frame.getType(this._list[0]) : 0;
  }

  isFinal() {
    return Boolean(this._list.length && Frame.isFinal(this._list[0]));
  }
}

module.exports = IncomingStream;