'use strict';
var http = require('http');
var EventDispatcher = require('event-dispatcher');
var Client = require('./client.js');
var Message = require('./message.js');

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
    throw new Error('WebSocketServer cannot be instantiated,');
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
    if (WebSocketServer.hasEventListener(WebSocketServer.CLIENT_CONNECTED)) {
      WebSocketServer.dispatchEvent(WebSocketServer.CLIENT_CONNECTED, client);
    }
  }
}


EventDispatcher.apply(WebSocketServer);

WebSocketServer.addEventListener = EventDispatcher.prototype.addEventListener;
WebSocketServer.hasEventListener = EventDispatcher.prototype.hasEventListener;
WebSocketServer.removeEventListener = EventDispatcher.prototype.removeEventListener;
WebSocketServer.removeAllEventListeners = EventDispatcher.prototype.removeAllEventListeners;
WebSocketServer.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

WebSocketServer.onUpgrade = upgradeHandler;
WebSocketServer.CLIENT_CONNECTED = 'clientConnected';
WebSocketServer.CLIENT_DISCONNECTED = 'clientDisconnected';
WebSocketServer.Client = Client;
WebSocketServer.Message = Message;
module.exports = WebSocketServer;

/*
 //FIXME add protocol version validation
 if () {
 var client = Client.accept(request, socket);
 console.log('Client connection accepted.');
 Message.send(client, new Buffer('Hello world! What if data will be something truly big, let\'s say BIG DATA! hundred times:  BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! ok, enough :) or not  BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA! BIG DATA!, just a massive message...', 'utf8'));

 client.addEventListener(Client.Events.CLOSE, function() {
 console.log('Client closed connection.');
 });
 }


 socket.on('connect', loggerFactory('connect'));
 socket.on('error', loggerFactory('error'));
 socket.on('data', loggerFactory('data'));
 socket.on('end', loggerFactory('end'));
 socket.on('close', loggerFactory('close'));
 */
