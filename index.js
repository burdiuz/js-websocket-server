module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splitData = exports.bounds = exports.isFinal = exports.getType = exports.length = exports.readPayloadLength = exports.readFrameLength = exports.parseStream = exports.parse = exports.readMask = exports.create = exports.setDataLength = exports.mask = exports.PONG_TYPE = exports.PING_TYPE = exports.CLOSE_TYPE = exports.BINARY_TYPE = exports.TEXT_TYPE = exports.CONTINUATION_TYPE = undefined;

var _BufferIterator = __webpack_require__(5);

var _BufferIterator2 = _interopRequireDefault(_BufferIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CONTINUATION_TYPE = exports.CONTINUATION_TYPE = 0x0;
const TEXT_TYPE = exports.TEXT_TYPE = 0x1;
const BINARY_TYPE = exports.BINARY_TYPE = 0x2;
const CLOSE_TYPE = exports.CLOSE_TYPE = 0x8;
const PING_TYPE = exports.PING_TYPE = 0x9;
const PONG_TYPE = exports.PONG_TYPE = 0xA;

const mask = exports.mask = (frameBuffer, position) => {
  const maskData = Buffer.allocUnsafe(4);
  //FIXME standard random algorithm is not reliable, please update if looking for further work with this project
  maskData.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0);
  maskData.copy(frameBuffer, position, 0, 4);
  return maskData;
};

const setDataLength = exports.setDataLength = (frameBuffer, dataLength) => {
  const position = 2;
  let shift = 0;
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
};

const create = exports.create = (data, masked) => {
  let maskData;
  let index;
  let position = 2;
  const dataLength = data.length;
  const buffer = Buffer.allocUnsafe(length(dataLength, masked));
  buffer[0] = 0; // FIN + RSV1-3 + OPCODE
  buffer[1] = (masked ? 1 : 0) << 7;
  position += setDataLength(buffer, dataLength);
  /* Messages from server should not be masked
   https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
   */
  if (masked) {
    maskData = mask(buffer, position);
    position += 4;
    index = 0;
    for (let entry of data) {
      let byte = entry[1];
      buffer[position++] = byte ^ maskData[index++ % 4];
    }
  } else {
    data.copy(buffer, position, 0, data.length);
  }
  return buffer;
};

const readMask = exports.readMask = (frameBuffer, position) => {
  const maskData = Buffer.allocUnsafe(4);
  frameBuffer.copy(maskData, 0, position, position + 4);
  return maskData;
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {?Buffer}
 */
const parse = exports.parse = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || !data.length) return null;
  let result;
  const masked = data[startPosition + 1] >>> 7;
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
  let position = startPosition + 2;
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
    const mask = readMask(data, position);
    position += 4;
    for (let index = 0; index < length; index++, position++) {
      result[index] = data[position] ^ mask[index % 4];
    }
  } else {
    result = data.slice(position, length);
  }
  return result;
};

/**
 * @param {Buffer[]} list
 */
const parseStream = exports.parseStream = list => {
  const result = [];
  const length = list.length;
  for (let index = 0; index < length; index++) {
    result.push(parse(list[index]));
  }
  return Buffer.concat(result);
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {Number}
 */
const readFrameLength = exports.readFrameLength = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || data.length <= startPosition) return 0;
  const position = startPosition + 2;
  let size = 2 + (data[startPosition + 1] >>> 7 && 4);
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
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
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {Number}
 */
const readPayloadLength = exports.readPayloadLength = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || data.length <= startPosition + 2) return 0;
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
  const position = startPosition + 2;
  if (length > 125) {
    if (length == 126) {
      length = data.readUInt16BE(position);
    } else {
      length = data.readDoubleBE(position);
    }
  }
  return length;
};

const length = exports.length = (dataLength, masked) => {
  let length = 2;
  if (masked) {
    length += 4;
  }
  if (dataLength > 65535) {
    length += 8;
  } else if (dataLength > 125) {
    length += 2;
  }
  return length + dataLength;
};

const getType = exports.getType = buffer => buffer[0] & Math.pow(2, 4) - 1;

const isFinal = exports.isFinal = buffer => Boolean(buffer[0] >>> 7);

const bounds = exports.bounds = (list, type) => {
  const last = list.length - 1;
  // init first frame, set type opcode
  list[0][0] = list[0][0] >>> 4 << 4 | type;
  // init last frame, set FIN
  list[last][0] = list[last][0] | 1 << 7;
};

const splitData = exports.splitData = (data, frameSize, masked) => {
  const list = [];
  const iterator = new _BufferIterator2.default(data, frameSize);
  for (let buffer of iterator) {
    list.push(create(buffer, Boolean(masked)));
  }
  return list;
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});

var _eventDispatcher = __webpack_require__(2);

var _eventDispatcher2 = _interopRequireDefault(_eventDispatcher);

var _Frame = __webpack_require__(0);

var Frame = _interopRequireWildcard(_Frame);

var _Message = __webpack_require__(3);

var _Message2 = _interopRequireDefault(_Message);

var _IncomingStream = __webpack_require__(6);

var _IncomingStream2 = _interopRequireDefault(_IncomingStream);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const clients = new Map();
const SOCKET_KEY = Symbol('client::socket');
/**
 * @param {net.Socket } socket
 * @constructor
 */
class Client extends _eventDispatcher2.default {
  constructor(socket) {
    super();
    /**
     * @type {net.Socket}
     */

    this._dataHandler = data => {
      let position = 0;
      do {
        const frameLength = Frame.readFrameLength(data, position);
        if (!frameLength) break;
        const frame = Buffer.allocUnsafe(frameLength);
        data.copy(frame, 0, position, position + frameLength);
        this._addFrameToIncomingStream(frame);
        position += frameLength;
      } while (position < data.length && frameLength);
    };

    this._addFrameToIncomingStream = frame => {
      if (!this._incoming) {
        // don't bother looking for data if developer not interested in it
        if (!this.hasEventListener(Client.MESSAGE_RECEIVED)) return;
        this._incoming = new _IncomingStream2.default();
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
            this.send(_Message2.default.create(this._incoming.valueOf(), Frame.PONG_TYPE));
            break;
        }
        this._incoming = null;
      }
    };

    this._errorHandler = error => {
      if (this.hasEventListener(Client.ERROR)) {
        this.dispatchEvent(Client.ERROR, error);
      }
    };

    this._endHandler = () => {
      if (this.hasEventListener(Client.END)) {
        this.dispatchEvent(Client.END, this);
      }
    };

    this._closeHandler = () => {
      clients.delete(this[SOCKET_KEY]);
      if (this.hasEventListener(Client.CLOSE)) {
        this.dispatchEvent(Client.CLOSE, this);
      }
    };

    this[SOCKET_KEY] = socket;
    /**
     * @type {?IncomingMessage}
     * @private
     */
    this._incoming = null;

    //TODO handle incoming messages
    socket.on('data', this._dataHandler);
    socket.on('error', this._errorHandler);
    socket.on('end', this._endHandler);
    socket.on('close', this._closeHandler);
  }

  /**
   * @member {Number} Client.count
   */
  get count() {
    return clients.size;
  }

  /**
   * @private
   */


  /**
   * @param frame
   * @private
   */


  /**
   * @private
   */


  /**
   * @private
   */


  /**
   * @private
   */


  send(message) {
    if (message) {
      if (!(message instanceof _Message2.default)) {
        message = _Message2.default.create(message);
      }
    } else {
      throw new Error('Message cannot be empty.');
    }
    /**
     * @var {net.Socket}
     */
    const socket = this[SOCKET_KEY];
    for (let frame of message) {
      socket.write(frame);
    }
    if (this.hasEventListener(Client.MESSAGE_SENT)) {
      this.dispatchEvent(Client.MESSAGE_SENT);
    }
  }

  /**
   * @method Client.create
   * @param {net.Socket} socket
   * @returns {Client}
   */
  static create(socket) {
    const client = new Client(socket);
    clients.set(socket, client);
    return client;
  }

  /**
   * @method Client.get
   * @param {net.Socket} socket
   * @returns {Client}
   */
  static get(socket) {
    let client = clients.get(socket);
    if (!client) {
      client = Client.create(socket);
    }
    return client;
  }

}

/**
 * @returns {Iterator.<Client>}
 * @private
 */
Client.CLOSE = 'close';
Client.END = 'end';
Client.ERROR = 'error';
Client.MESSAGE_RECEIVED = 'messageReceived';
Client.MESSAGE_SENT = 'messageSent';
Client[Symbol.iterator] = () => clients.values();

exports.default = Client;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("event-dispatcher");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessageIterator = undefined;

var _Frame = __webpack_require__(0);

var Frame = _interopRequireWildcard(_Frame);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const BUFFER_KEY = Symbol('message::buffer');

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
    const currentIndex = this._index++;
    let result;
    if (currentIndex >= this._length) {
      result = { value: undefined, done: true };
    } else {
      result = { value: this._list[currentIndex], done: false };
    }
    return result;
  }
}

exports.MessageIterator = MessageIterator; /**
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
    const list = Frame.splitData(this[BUFFER_KEY], this.frameSize, this.masked);
    Frame.bounds(list, this.type);
    return list;
  }

  [Symbol.iterator]() {
    return new MessageIterator(this);
  }

  /**
   * @param {*} data
   * @returns {Buffer}
   */
  static createBuffer(data) {
    if (data === null || data === undefined) {
      return Buffer.allocUnsafe(0);
    } else {
      if (data instanceof Buffer) {
        return data;
      } else if (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer) {
        return data.buffer;
      } else if (typeof data !== 'string') {
        data = JSON.stringify(data);
      }

      const buffer = Buffer.allocUnsafe(data.length);
      buffer.write(data);
      return buffer;
    }
  }

  /**
   * @param {*} data
   * @returns {number}
   * @constructor
   */
  static getType(data) {
    if (data === null || data === undefined || data instanceof Buffer || data.hasOwnProperty('buffer') && data.buffer instanceof Buffer) {
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
exports.default = Message;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebSocketServer = exports.Frame = exports.Message = exports.Client = undefined;

var _Client = __webpack_require__(1);

var _Client2 = _interopRequireDefault(_Client);

var _Frame = __webpack_require__(0);

var Frame = _interopRequireWildcard(_Frame);

var _Message = __webpack_require__(3);

var _Message2 = _interopRequireDefault(_Message);

var _WebSocketServer = __webpack_require__(8);

var _WebSocketServer2 = _interopRequireDefault(_WebSocketServer);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const wsServer = new _WebSocketServer2.default();

/*
 * @param {http.Server|http.ClientRequest} requestOrServer
 * @param {net.Socket} [socket=null]
 * @param {Object} [head=null]
 */
const init = (requestOrServer, socket = null, head = null) => {
  wsServer.init(requestOrServer, socket, head);
};

Object.assign(init, {
  Client: _Client2.default,
  Message: _Message2.default,
  Frame,
  CLIENT_CONNECTED: _WebSocketServer.CLIENT_CONNECTED,
  CLIENT_DISCONNECTED: _WebSocketServer.CLIENT_DISCONNECTED,
  addEventListener: (type, handler) => wsServer.addEventListener(type, handler),
  hasEventListener: type => wsServer.hasEventListener(type),
  removeEventListener: (type, handler) => wsServer.removeEventListener(type, handler),
  removeAllEventListeners: type => wsServer.removeAllEventListeners(type)
});

exports.Client = _Client2.default;
exports.Message = _Message2.default;
exports.Frame = Frame;
exports.WebSocketServer = _WebSocketServer2.default;
exports.default = init;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});
class BufferIterator {
  constructor(buffer, frameSize) {
    this[Symbol.iterator] = () => this;

    this._buffer = buffer;
    this._length = buffer.length;
    this._current = 0;
    this._pieces = frameSize > 0 ? Math.ceil(this._length / frameSize) : 1;
    this._frameSize = frameSize;
  }

  next() {
    const current = this._current++;
    if (current >= this._pieces) {
      return {
        value: undefined,
        done: true
      };
    } else if (current === 0 && this._pieces === 1) {
      // special case when buffer should be sent in one frame, covers most communication sets :)
      return {
        value: this._buffer,
        done: false
      };
    }

    let size = this._frameSize;
    const pos = current * this._frameSize;
    if (this._current * this._frameSize > this._length) {
      size = this._length - pos;
    }
    return {
      value: this._buffer.slice(pos, pos + size),
      done: false
    };
  }

}

exports.default = BufferIterator;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Frame = __webpack_require__(0);

var Frame = _interopRequireWildcard(_Frame);

var _IncomingMessage = __webpack_require__(7);

var _IncomingMessage2 = _interopRequireDefault(_IncomingMessage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
    return this.isFinal() ? new _IncomingMessage2.default(this) : null;
  }

  getType() {
    return this._list.length ? Frame.getType(this._list[0]) : 0;
  }

  isFinal() {
    return Boolean(this._list.length && Frame.isFinal(this._list[0]));
  }
}

exports.default = IncomingStream;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Frame = __webpack_require__(0);

var Frame = _interopRequireWildcard(_Frame);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class IncomingMessage {
  constructor(stream) {
    this.stream = stream;
    this.rawData = stream.valueOf();
    this.type = stream.getType();
    this.value = this.type === Frame.TEXT_TYPE ? this.rawData.toString() : this.rawData;
  }
}

exports.default = IncomingMessage;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Created by Oleg Galaburda on 07.04.16.
 */



Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CLIENT_DISCONNECTED = exports.CLIENT_CONNECTED = undefined;

var _http = __webpack_require__(9);

var _http2 = _interopRequireDefault(_http);

var _crypto = __webpack_require__(10);

var _crypto2 = _interopRequireDefault(_crypto);

var _eventDispatcher = __webpack_require__(2);

var _eventDispatcher2 = _interopRequireDefault(_eventDispatcher);

var _Client = __webpack_require__(1);

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const UUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const SUPPORTED_VERSIONS = {
  '13': true
};

const createKeyResponse = key => _crypto2.default.createHash('SHA1').update(key + UUID).digest('base64');

const CLIENT_CONNECTED = exports.CLIENT_CONNECTED = 'clientConnected';
const CLIENT_DISCONNECTED = exports.CLIENT_DISCONNECTED = 'clientDisconnected';

/**
 * @var {WSSHandler|EventDispatcher} WebSocketServer
 */
class WebSocketServer extends _eventDispatcher2.default {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this._upgradeHandler = (request, socket, head) => {
      if (this._acceptConnection(request, socket)) {
        const client = _Client2.default.get(socket);
        client.addEventListener(_Client2.default.CLOSE, this._clientCloseHandler);
        if (this.hasEventListener(CLIENT_CONNECTED)) {
          this.dispatchEvent(CLIENT_CONNECTED, client);
        }
      }
    }, this._clientCloseHandler = event => {
      const client = event.data;
      client.removeEventListener(_Client2.default.CLOSE, this._clientCloseHandler);
      if (this.hasEventListener(CLIENT_DISCONNECTED)) {
        this.dispatchEvent(CLIENT_DISCONNECTED, client);
      }
    }, this._acceptConnection = (request, socket) => {
      let response;
      let result = false;
      const upgrade = request.headers['upgrade'];
      const key = request.headers['sec-websocket-key'];
      const version = request.headers['sec-websocket-version'];
      if (upgrade && upgrade.toLowerCase() === 'websocket' && version && SUPPORTED_VERSIONS[version]) {
        response = 'HTTP/1.1 101 Web Socket Protocol Handshake' + '\r\n' + 'Upgrade: websocket' + '\r\n' + 'Connection: Upgrade' + '\r\n' + 'Sec-WebSocket-Accept: ' + createKeyResponse(key) + '\r\n' +
        // skip message compression for now
        //'Sec-WebSocket-Extensions: permessage-deflate' + '\r\n' +
        '\r\n';
        result = true;
      } else {
        response = 'HTTP/1.1 400 Bad Request' + '\r\n' + '\r\n';
      }
      socket.write(response);
      return result;
    }, _temp;
  }

  init(requestOrServer, socket = null, head = null) {
    if (requestOrServer instanceof _http2.default.Server) {
      requestOrServer.on('upgrade', this._upgradeHandler);
    } else {
      this._upgradeHandler(requestOrServer, socket, head);
    }
  }

  /**
   * @param {http.ClientRequest} request
   * @param {net.Socket} [socket=null]
   * @param {Object} [head=null]
   */
}

exports.default = WebSocketServer;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map