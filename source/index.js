import Client from './Client';
import * as Frame from './Frame';
import Message from './Message';
import WebSocketServer, { CLIENT_CONNECTED, CLIENT_DISCONNECTED } from './WebSocketServer';

const wsServer = new WebSocketServer();

/*
 * @param {http.Server|http.ClientRequest} requestOrServer
 * @param {net.Socket} [socket=null]
 * @param {Object} [head=null]
 */
const init = (requestOrServer, socket = null, head = null) => {
  wsServer.init(requestOrServer, socket, head);
};

Object.assign(init, {
  Client,
  Message,
  Frame,
  CLIENT_CONNECTED,
  CLIENT_DISCONNECTED,
  addEventListener: (type, handler) => wsServer.addEventListener(type, handler),
  hasEventListener: (type) => wsServer.hasEventListener(type),
  removeEventListener: (type, handler) => wsServer.removeEventListener(type, handler),
  removeAllEventListeners: (type) => wsServer.removeAllEventListeners(type),
});

export { Client, Message, Frame, WebSocketServer };
export default init;
