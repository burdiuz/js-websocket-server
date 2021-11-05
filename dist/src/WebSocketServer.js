import { Server } from 'http';
import { EventEmitter } from 'events';
import { HTTPServerEvent } from './HTTPServerEvent.js';
import { ClientEvent } from './ClientEvent.js';
import { WebSocketEvent } from './WebSocketEvent.js';
import { addClient, getClient, removeClient } from './clients.js';
import { acceptHTTPConnection } from './utils.js';
/*
  FIXME think on how to make it universal andfilter endpoints
  createWebSocketServer(onClientAdd, onClientRemove) => (requestOrServer, socket, head)
  or
  server.on('upgrade', createWebSocketServer(onClientAdd, onClientRemove))
  or...?
*/
export const createUpgradeHandler = (onConnect, onDisconnect, guard = () => true) => {
    const server = new WebSocketServer();
    onConnect && server.on(WebSocketEvent.CLIENT_CONNECTED, onConnect);
    onDisconnect && server.on(WebSocketEvent.CLIENT_DISCONNECTED, onDisconnect);

    return (request, socket, head) => {
        if(!guard(request, socket, head)) {
            return;
        }

        server.upgrade(request, socket, head);
    };
};

export class WebSocketServer extends EventEmitter {
    constructor(server) {
        super();
        this.handleUpgrade = (request, socket, head) => {
            if (!acceptHTTPConnection(request, socket)) {
                return;
            }
            
            const client = getClient(socket);
            addClient(client);
            client.on(ClientEvent.CLOSE, this.handleClientClose);
            console.log(' - client created');
            this.emit(WebSocketEvent.CLIENT_CONNECTED, client);
        };
        this.handleClientClose = (client) => {
            removeClient(client);
            client.off(ClientEvent.CLOSE, this.handleClientClose);
            this.emit(WebSocketEvent.CLIENT_DISCONNECTED, client);
        };

        if (server) {
            server.on(HTTPServerEvent.UPGRADE, this.handleUpgrade);
        }
    }

    upgrade(request, socket, head) {
        this.handleUpgrade(request, socket, head);
    }
}
//# sourceMappingURL=WebSocketServer.js.map