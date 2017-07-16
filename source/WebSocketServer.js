/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

import http from 'http';
import crypto from 'crypto';
import Client from './Client';
import Frame from './Frame';
import Message from './Message';

const UUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const SUPPORTED_VERSIONS = {
  '13': true,
};

const createKeyResponse = (key) => crypto.createHash('SHA1').update(key + UUID).digest('base64');

export const CLIENT_CONNECTED = 'clientConnected';
export const CLIENT_DISCONNECTED = 'clientDisconnected';


/**
 * @var {WSSHandler|EventDispatcher} WebSocketServer
 */
class WebSocketServer extends EventDispatcher {

  init = (requestOrServer, socket = null, head = null) => {
    if (requestOrServer instanceof http.Server) {
      requestOrServer.on('upgrade', this.upgradeHandler);
    } else {
      this.upgradeHandler(requestOrServer, socket, head);
    }
  };

  /**
   * @param {http.ClientRequest} request
   * @param {net.Socket} [socket=null]
   * @param {Object} [head=null]
   */
  upgradeHandler(request, socket, head) {
    if (this.acceptConnection(request, socket)) {
      const client = Client.get(socket);
      client.addEventListener(Client.CLOSE, this.clientCloseHandler);
      if (WebSocketServer.hasEventListener(CLIENT_CONNECTED)) {
        WebSocketServer.dispatchEvent(CLIENT_CONNECTED, client);
      }
    }
  }

  clientCloseHandler(event) {
    const client = event.data;
    client.removeEventListener(Client.CLOSE, this.clientCloseHandler);
    if (WebSocketServer.hasEventListener(CLIENT_DISCONNECTED)) {
      WebSocketServer.dispatchEvent(CLIENT_DISCONNECTED, client);
    }
  }

  acceptConnection(request, socket) {
    let response;
    let result = false;
    const upgrade = request.headers['upgrade'];
    const key = request.headers['sec-websocket-key'];
    const version = request.headers['sec-websocket-version'];
    if (upgrade && upgrade.toLowerCase() === 'websocket' && version && SUPPORTED_VERSIONS[version]) {
      response = 'HTTP/1.1 101 Web Socket Protocol Handshake' + '\r\n' +
        'Upgrade: websocket' + '\r\n' +
        'Connection: Upgrade' + '\r\n' +
        'Sec-WebSocket-Accept: ' + createKeyResponse(key) + '\r\n' +
        // skip message compression for now
        //'Sec-WebSocket-Extensions: permessage-deflate' + '\r\n' +
        '\r\n';
      result = true;
    } else {
      response = 'HTTP/1.1 400 Bad Request' + '\r\n' +
        '\r\n';
    }
    socket.write(response);
    return result;
  }
}

/**
 * @param {http.Server|http.ClientRequest} requestOrServer
 * @param {net.Socket} [socket=null]
 * @param {Object} [head=null]
 */
const init = (requestOrServer, socket = null, head = null) => {
  wsServer.init(requestOrServer, socket, head);
  return init;
};

init.addEventListener = wsServer.addEventListener;
init.hasEventListener = wsServer.hasEventListener;
init.removeEventListener = wsServer.removeEventListener;
init.removeAllEventListeners = wsServer.removeAllEventListeners;

export default init;
