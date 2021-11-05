import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { Client } from './Client';
import { HTTPServerEvent } from './HTTPServerEvent';
import { ClientEvent } from './ClientEvent';
import { WebSocketEvent } from './WebSocketEvent';
import { addClient, getClient, removeClient } from './clients';
import { acceptHTTPConnection } from './utils';

export const createUpgradeHandler = (
  onConnect: (client: Client) => void,
  onDisconnect: (client: Client) => void,
  guard: (
    request: IncomingMessage,
    socket: Socket,
    head?: any
  ) => boolean = () => true
) => {
  const server = new WebSocketServer();
  onConnect && server.on(WebSocketEvent.CLIENT_CONNECTED, onConnect);
  onDisconnect && server.on(WebSocketEvent.CLIENT_DISCONNECTED, onDisconnect);

  return (request: IncomingMessage, socket: Socket, head?: any) => {
    if (!guard(request, socket, head)) {
      return;
    }

    server.upgrade(request, socket, head);
  };
};

export class WebSocketServer extends EventEmitter {
  constructor(server?: Server) {
    super();
    if (server) {
      server.on(HTTPServerEvent.UPGRADE, this.upgrade);
    }
  }

  upgrade = (request: IncomingMessage, socket: Socket, head?: any) => {
    if (!acceptHTTPConnection(request, socket)) {
      return;
    }

    const client = getClient(socket);
    addClient(client);

    client.on(ClientEvent.CLOSE, this.handleClientClose);
    this.emit(WebSocketEvent.CLIENT_CONNECTED, client);
  };

  handleClientClose = (client: Client) => {
    removeClient(client);

    client.off(ClientEvent.CLOSE, this.handleClientClose);
    this.emit(WebSocketEvent.CLIENT_DISCONNECTED, client);
  };
}
