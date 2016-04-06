/**
 * Created by Oleg Galaburda on 05.04.16.
 */
'use strict';
var EventDispatcher = require('event-dispatcher');
var Message = require('./message.js');
var IncomingStream = require('./incomingstream.js');
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
  socket.on('close', this._closeHandler.bind(this));
}

Client.prototype = EventDispatcher.createNoInitPrototype();
Client.prototype.constructor = Client;
/**
 * @private
 */
Client.prototype._dataHandler = function(data) {
  if (!this._incoming) {
    // don't bother looking for data if developer not interested in it
    if (!this.hasEventListener(Client.MESSAGE_RECEIVED)) return;
    this._incoming = new IncomingStream();
  }
  this._incoming.append(data);
  if (this._incoming.isFinished()) {
    this.dispatchEvent(Client.MESSAGE_RECEIVED, this._incoming.valueOf());
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
Client.prototype._closeHandler = function() {
  clients.delete(this[SOCKET_KEY]);
  if (this.hasEventListener(Client.CLOSE)) {
    this.dispatchEvent(Client.CLOSE);
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
  //TODO if Buffer pack to binary message, if string pack -- text message, if object pack to json message
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

module.exports = Client;
