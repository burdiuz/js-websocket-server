/// <reference types="node" />
import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { Client } from './Client';
export declare const createWebSocketServer: (requestOrServer: Server | IncomingMessage, socket: Socket, head?: any) => WebSocketServer;
export declare class WebSocketServer extends EventEmitter {
    constructor(requestOrServer: Server | IncomingMessage, socket: Socket, head?: any);
    private handleUpgrade;
    handleClientClose: (client: Client) => void;
}
