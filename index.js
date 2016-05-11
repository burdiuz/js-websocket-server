/**
 * Created by Oleg Galaburda on 07.04.16.
 */
'use strict';
var http = require('http');
var EventDispatcher = require('event-dispatcher');

// -------------------------- Frame

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
    var mask, index;
    var position = 2;
    var dataLength = data.length;
    var buffer = Buffer.allocUnsafe(Frame.length(dataLength, masked));
    buffer[0] = 0; // FIN + RSV1-3 + OPCODE
    buffer[1] = (masked ? 1 : 0) << 7;
    position += Frame.setDataLength(buffer, dataLength);
    /* Messages from server should not be masked
     https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
     */
    if (masked) {
      mask = Frame.mask(buffer, position);
      position += 4;
      index = 0;
      for (let entry of data) {
        let byte = entry[1];
        buffer[position++] = byte ^ mask[index++ % 4];
      }
    } else {
      data.copy(buffer, position, 0, data.length);
    }
    return buffer;
  },

  mask: function(frameBuffer, position) {
    var mask = Buffer.allocUnsafe(4);
    //FIXME standard random algorithm is not reliable, please update if looking for further work with this project
    mask.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0);
    mask.copy(frameBuffer, position, 0, 4);
    return mask;
  },

  readMask: function(frameBuffer, position) {
    var mask = Buffer.allocUnsafe(4);
    frameBuffer.copy(mask, 0, position, position + 4);
    return mask;
  },

  /**
   *
   * @param {Buffer} data
   * @param {Number} [startPosition=0]
   * @returns {Number}
   */
  readFrameLength: function(data, startPosition) {
    startPosition = startPosition || 0;
    if (!data || data.length <= startPosition) return 0;
    var position = startPosition + 2;
    var size = 2 + ((data[startPosition + 1] >>> 7) && 4);
    var length = data[startPosition + 1] & Math.pow(2, 7) - 1;
    if (length > 125) {
      if (length == 126) {
        length = data.readUInt16BE(position);
        size += 2;
      } else {
        length = data.readDoubleBE(position);
        size += 8;
      }
    }
    return size + length;
  },

  /**
   *
   * @param {Buffer} data
   * @param {Number} [startPosition=0]
   * @returns {Number}
   */
  readPayloadLength: function(data, startPosition) {
    startPosition = startPosition || 0;
    if (!data || data.length <= startPosition + 2) return 0;
    var length = data[startPosition + 1] & Math.pow(2, 7) - 1;
    var position = startPosition + 2;
    if (length > 125) {
      if (length == 126) {
        length = data.readUInt16BE(position);
      } else {
        length = data.readDoubleBE(position);
      }
    }
    return length;
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
  getType: function(buffer) {
    return buffer[0] & (Math.pow(2, 4) - 1);
  },
  isFinal: function(buffer) {
    return Boolean(buffer[0] >>> 7);
  },
  bounds: function(list, type) {
    var last = list.length - 1;
    // init first frame, set type opcode
    list[0][0] = list[0][0] >>> 4 << 4 | type;
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
  },

  /**
   *
   * @param {Buffer} data
   * @param {Number} [startPosition=0]
   * @returns {?Buffer}
   */
  parse: function(data, startPosition) {
    startPosition = startPosition || 0;
    if (!data || !data.length) return null;
    var result;
    var masked = data[startPosition + 1] >>> 7;
    var length = data[startPosition + 1] & Math.pow(2, 7) - 1;
    var position = startPosition + 2;
    if (length > 125) {
      if (length == 126) {
        length = data.readUInt16BE(position);
        position += 2;
      } else {
        length = data.readDoubleBE(position);
        position += 8;
      }
    }
    if (position + (masked && 4) + length < data.length) {
      throw new Error('Cannot parse incomplete or broken? frame package.');
    }
    if (masked) {
      result = Buffer.allocUnsafe(length);
      var mask = this.readMask(data, position);
      position += 4;
      for (let index = 0; index < length; index++, position++) {
        result[index] = data[position] ^ mask[index % 4];
      }
    } else {
      result = data.slice(position, length);
    }
    return result;
  },
  /**
   * @param {Buffer[]} list
   */
  parseStream: function(list) {
    var result = [];
    var length = list.length;
    for (var index = 0; index < length; index++) {
      result.push(this.parse(list[index]));
    }
    return Buffer.concat(result);
  },
  CONTINUATION_TYPE: 0x0,
  TEXT_TYPE: 0x1,
  BINARY_TYPE: 0x2,
  CLOSE_TYPE: 0x8,
  PING_TYPE: 0x9,
  PONG_TYPE: 0xA
};

// -------------------------- IncomingStream

function IncomingMessage(stream) {
  this.stream = stream;
  this.rawData = stream.valueOf();
  this.type = stream.getType();
  this.value = this.type === Frame.TEXT_TYPE ? this.rawData.toString() : this.rawData;
}

function IncomingStream() {
  var _list = [];
  this.append = function(buffer) {
    _list.push(buffer);
  }
  this.valueOf = function() {
    return Frame.parseStream(_list);
  };
  this.createMessage = function() {
    return this.isFinal() ? new IncomingMessage(this) : null;
  };
  this.getType = function() {
    return _list.length ? Frame.getType(_list[0]) : 0;
  };
  this.isFinal = function() {
    return Boolean(_list.length && Frame.isFinal(_list[0]));
  };
}

// -------------------------- Message

var Message = (function() {
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
  function Message_getType(data) {
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

  return Message;
})();

// -------------------------- Client

/**
 * @private
 */
var Client = (function() {

  var clients = new Map();

  var SOCKET_KEY = Symbol('client::socket');

  /**
   * @param {net.Socket} socket
   * @constructor
   */
  function Client(socket) {
    EventDispatcher.call(this);
    /**
     * @type {net.Socket}
     */
    this[SOCKET_KEY] = socket;
    /**
     * @type {?IncomingMessage}
     * @private
     */
    this._incoming = null;

    //TODO handle incoming messages
    socket.on('data', this._dataHandler.bind(this));
    socket.on('error', this._errorHandler.bind(this));
    socket.on('end', this._endHandler.bind(this));
    socket.on('close', this._closeHandler.bind(this));
  }

  Client.prototype = EventDispatcher.createNoInitPrototype();
  Client.prototype.constructor = Client;

  /**
   * @private
   */
  Client.prototype._dataHandler = function(data) {
    var position = 0;
    do {
      var frameLength = Frame.readFrameLength(data, position);
      if (!frameLength) break;
      var frame = Buffer.allocUnsafe(frameLength);
      data.copy(frame, 0, position, frameLength);
      this._addFrameToIncomingStream(frame);
      position += frameLength;
    } while (position >= data.length && frameLength);
  };

  /**
   * @param frame
   * @private
   */
  Client.prototype._addFrameToIncomingStream = function(frame) {
    if (!this._incoming) {
      // don't bother looking for data if developer not interested in it
      if (!this.hasEventListener(Client.MESSAGE_RECEIVED)) return;
      this._incoming = new IncomingStream();
    }
    //FIXME client may send multiple frames in one data chunk, data receiver should check this
    this._incoming.append(frame);
    if (this._incoming.isFinal()) {
      switch (this._incoming.getType()) {
        case Frame.BINARY_TYPE:
        case Frame.TEXT_TYPE:
          this.dispatchEvent(Client.MESSAGE_RECEIVED, this._incoming.createMessage());
          break;
        case Frame.CLOSE_TYPE:
          this[SOCKET_KEY].end();
          break;
        case Frame.PING_TYPE:
          this.send(Message.create(this._incoming.valueOf(), Frame.PONG_TYPE));
          break;
      }
      this._incoming = null;
    }
  };

  /**
   * @private
   */
  Client.prototype._errorHandler = function(error) {
    if (this.hasEventListener(Client.ERROR)) {
      this.dispatchEvent(Client.ERROR, error);
    }
  };

  /**
   * @private
   */
  Client.prototype._endHandler = function() {
    if (this.hasEventListener(Client.END)) {
      this.dispatchEvent(Client.END, this);
    }
  };

  /**
   * @private
   */
  Client.prototype._closeHandler = function() {
    clients.delete(this[SOCKET_KEY]);
    if (this.hasEventListener(Client.CLOSE)) {
      this.dispatchEvent(Client.CLOSE, this);
    }
  };

  function send(message) {
    if (message) {
      if (!(message instanceof Message)) {
        message = Message.create(message);
      }
    } else {
      throw new Error('Message cannot be empty.');
    }
    /**
     * @var {net.Socket}
     */
    var socket = this[SOCKET_KEY];
    for (let frame of message) {
      socket.write(frame);
    }
    if (this.hasEventListener(Client.MESSAGE_SENT)) {
      this.dispatchEvent(Client.MESSAGE_SENT);
    }
  }

  Client.prototype.send = send;

// --------------------- static
  /**
   * @method Client.create
   * @param {net.Socket} socket
   * @returns {Client}
   */
  function Client_create(socket) {
    var client = new Client(socket);
    clients.set(socket, client);
    return client;
  }

  /**
   * @method Client.get
   * @param {net.Socket} socket
   * @returns {Client}
   */
  function Client_get(socket) {
    var client = clients.get(socket);
    if (!client) {
      client = Client.create(socket);
    }
    return client;
  }

  Client.create = Client_create;

  Client.get = Client_get;

  Object.defineProperties(Client, {
    /**
     * @member {Number} Client.count
     */
    count: {
      get: function() {
        return clients.size;
      }
    }
  });
  /**
   * @returns {Iterator.<Client>}
   * @private
   */
  function Client_iterator() {
    return clients.values();
  }

  Client[Symbol.iterator] = Client_iterator;

  Client.CLOSE = 'close';
  Client.END = 'end';
  Client.ERROR = 'error';
  Client.MESSAGE_RECEIVED = 'messageReceived';
  Client.MESSAGE_SENT = 'messageSent';

  return Client;
})();

// -------------------------- WebSocketServer

/**
 * @private
 */
var WebSocketServer = (function() {
  const UUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

  const SUPPORTED_VERSIONS = {
    '13': true
  };

  function createKeyResponse(key) {
    return require('crypto').createHash('SHA1').update(key + UUID).digest('base64');
  }

  /**
   * @callback WSSHandler
   * @param {http.Server|http.ClientRequest} arg1
   * @param {net.Socket} [arg2]
   * @param {Object} [arg3]
   */

  /**
   * @var {WSSHandler|EventDispatcher} WebSocketServer
   */
  function WebSocketServer(arg1, arg2, arg3) {
    if (this instanceof WebSocketServer) {
      throw new Error('WebSocketServer cannot be instantiated.');
    }
    if (arg1 instanceof http.Server) {
      arg1.on('upgrade', WebSocketServer.onUpgrade);
    } else {
      WebSocketServer.onUpgrade(arg1, arg2, arg3);
    }
  }

  function acceptConnection(request, socket) {
    var result = false;
    var upgrade = request.headers['upgrade'];
    var key = request.headers['sec-websocket-key'];
    var version = request.headers['sec-websocket-version'];
    if (upgrade && upgrade.toLowerCase() === 'websocket' && version && SUPPORTED_VERSIONS[version]) {
      var response = 'HTTP/1.1 101 Web Socket Protocol Handshake' + '\r\n' +
        'Upgrade: websocket' + '\r\n' +
        'Connection: Upgrade' + '\r\n' +
        'Sec-WebSocket-Accept: ' + createKeyResponse(key) + '\r\n' +
        // skip message compression for now
        //'Sec-WebSocket-Extensions: permessage-deflate' + '\r\n' +
        '\r\n';
      result = true;
    } else {
      var response = 'HTTP/1.1 400 Bad Request' + '\r\n' +
        '\r\n';
    }
    socket.write(response);
    return result;
  }

  function upgradeHandler(request, socket, head) {
    if (acceptConnection(request, socket)) {
      var client = Client.get(socket);
      client.addEventListener(Client.CLOSE, clientCloseHandler);
      if (WebSocketServer.hasEventListener(WebSocketServer.CLIENT_CONNECTED)) {
        WebSocketServer.dispatchEvent(WebSocketServer.CLIENT_CONNECTED, client);
      }
    }
  }

  function clientCloseHandler(event) {
    var client = event.data;
    client.removeEventListener(Client.CLOSE, clientCloseHandler);
    if (WebSocketServer.hasEventListener(WebSocketServer.CLIENT_DISCONNECTED)) {
      WebSocketServer.dispatchEvent(WebSocketServer.CLIENT_DISCONNECTED, client);
    }
  }


  EventDispatcher.apply(WebSocketServer);

  WebSocketServer.addEventListener = EventDispatcher.prototype.addEventListener;
  WebSocketServer.hasEventListener = EventDispatcher.prototype.hasEventListener;
  WebSocketServer.removeEventListener = EventDispatcher.prototype.removeEventListener;
  WebSocketServer.removeAllEventListeners = EventDispatcher.prototype.removeAllEventListeners;
  WebSocketServer.dispatchEvent = EventDispatcher.prototype.dispatchEvent;
  WebSocketServer.onUpgrade = upgradeHandler;

  return WebSocketServer;
})();


WebSocketServer.CLIENT_CONNECTED = 'clientConnected';
WebSocketServer.CLIENT_DISCONNECTED = 'clientDisconnected';
WebSocketServer.Client = Client;
WebSocketServer.Frame = Frame;
WebSocketServer.Message = Message;

module.exports = WebSocketServer;
