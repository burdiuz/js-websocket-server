import { Server, ClientRequest } from 'http';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { Client } from './Client';
import { HTTPServerEvent } from './HTTPServerEvent';
import { ClientEvent } from './ClientEvent';
import { WebSocketEvent } from './WebSocketEvent';
import { addClient, getClient, removeClient } from './clients';
import { acceptHTTPConnection } from './utils';

/*
  FIXME think on how to make it universal andfilter endpoints
  createWebSocketServer(onClientAdd, onClientRemove) => (requestOrServer, socket, head)
  or
  server.on('upgrade', createWebSocketServer(onClientAdd, onClientRemove))
  or...?
*/
export const createWebSocketServer = (
  requestOrServer: Server | ClientRequest,
  socket: Socket,
  head?: any
) => new WebSocketServer(requestOrServer, socket, head);

export class WebSocketServer extends EventEmitter {
  constructor(
    requestOrServer: Server | ClientRequest,
    socket: Socket,
    head?: any
  ) {
    super();
    if (requestOrServer instanceof Server) {
      requestOrServer.on(HTTPServerEvent.UPGRADE, this.handleUpgrade);
    } else {
      this.handleUpgrade(requestOrServer, socket, head);
    }
  }

  private handleUpgrade = (
    request: ClientRequest,
    socket: Socket,
    head?: any
  ) => {
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
