/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

import EventDispatcher from 'event-dispatcher';
import * as Frame from './Frame';
import Message from './Message';
import IncomingStream from './IncomingStream';

const clients = new Map();
const SOCKET_KEY = Symbol('client::socket');
/**
 * @param {net.Socket } socket
 * @constructor
 */
class Client extends EventDispatcher {
  constructor(socket) {
    super();
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
  _dataHandler = (data) => {
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

  /**
   * @param frame
   * @private
   */
  _addFrameToIncomingStream = (frame) => {
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
  _errorHandler = (error) => {
    if (this.hasEventListener(Client.ERROR)) {
      this.dispatchEvent(Client.ERROR, error);
    }
  };

  /**
   * @private
   */
  _endHandler = () => {
    if (this.hasEventListener(Client.END)) {
      this.dispatchEvent(Client.END, this);
    }
  };

  /**
   * @private
   */
  _closeHandler = () => {
    clients.delete(this[SOCKET_KEY]);
    if (this.hasEventListener(Client.CLOSE)) {
      this.dispatchEvent(Client.CLOSE, this);
    }
  };

  send(message) {
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

  static CLOSE = 'close';
  static END = 'end';
  static ERROR = 'error';
  static MESSAGE_RECEIVED = 'messageReceived';
  static MESSAGE_SENT = 'messageSent';
}

/**
 * @returns {Iterator.<Client>}
 * @private
 */
Client[Symbol.iterator] = () => clients.values();

export default Client;