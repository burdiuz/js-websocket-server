/**
 * Created by Oleg Galaburda on 06.04.16.
 */
'use strict';

function BufferIterator(buffer, frameSize) {
  this._buffer = buffer;
  this._length = buffer.length;
  this._current = 0;
  this._pieces = frameSize > 0 ? Math.ceil(this._length / frameSize) : 1;
  this._frameSize = frameSize;
}

BufferIterator.prototype[Symbol.iterator] = function() {
  return this;
};

BufferIterator.prototype.next = function() {
  var result, size, pos, part;
  var current = this._current++;
  if (current >= this._pieces) {
    result = {value: undefined, done: true};
  } else if (current === 0 && this._pieces === 1) { // special case when buffer should be sent in one frame, covers most communication sets :)
    result = {value: this._buffer, done: false};
  } else {
    pos = current * this._frameSize;
    size = this._frameSize;
    if (this._current * this._frameSize > this._length) {
      size = this._length - pos;
    }
    part = this._buffer.slice(pos, pos + size);
    result = {value: part, done: false};
  }
  return result;
};

var Frame = {
  
  create: function(data, masked) {
    var mask;
    var position = 2;
    var dataLength = data.length;
    var buffer = new Buffer(Frame.length(dataLength, masked));
    buffer[0] = 0; // FIN + RSV1-3 + OPCODE
    buffer[1] = (masked ? 1 : 0) << 7;
    position += Frame.setDataLength(buffer, dataLength);
    /* Messages from server should not be masked
     https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
     */
    if (masked) {
      mask = Frame.mask(buffer, position);
      position += 4;
      for (let entry of data) {
        let index = entry[0];
        let byte = entry[1];
        buffer.writeUInt8(byte ^ mask[index % 4], position++);
      }
    } else {
      data.copy(buffer, position, 0, data.length);
    }
    return buffer;
  },
  
  mask: function(frameBuffer, position) {
    var mask = new Buffer(4);
    //FIXME standard random algorithm is not reliable, please update if looking for further work with this project
    mask.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0);
    mask.copy(frameBuffer, position, 0, 4);
    return mask;
  },
  
  setDataLength: function(frameBuffer, dataLength) {
    var position = 2;
    var shift = 0;
    if (dataLength > 65535) {
      frameBuffer[1] = frameBuffer[1] | 127;
      frameBuffer.writeDoubleBE(dataLength, position);
      shift = 8;
    } else if (dataLength > 125) {
      frameBuffer[1] = frameBuffer[1] | 126;
      frameBuffer.writeUInt16BE(dataLength, position);
      shift = 2;
    } else {
      frameBuffer[1] = frameBuffer[1] | dataLength;
    }
    return shift;
  },
  
  length: function(dataLength, masked) {
    var length = 2;
    if (masked) {
      length += 4;
    }
    if (dataLength > 65535) {
      length += 8;
    } else if (dataLength > 125) {
      length += 2;
    }
    return length + dataLength;
  },
  
  bounds: function(list, type) {
    var last = list.length - 1;
    // init first frame, set type opcode
    list[0][0] = list[0][0] >> 4 << 4 | type;
    // init last frame, set FIN
    list[last][0] = list[last][0] | 1 << 7;
  },
  
  BufferIterator: BufferIterator,
  
  splitData: function(data, frameSize, masked) {
    var list = [];
    var iterator = new BufferIterator(data, frameSize);
    for (let buffer of iterator) {
      list.push(Frame.create(buffer, Boolean(masked)));
    }
    return list;
  }
};

module.exports = Frame;
