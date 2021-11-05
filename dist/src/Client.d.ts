/// <reference types="node" />
import { EventEmitter } from 'events';
import { Socket } from 'net';
export declare class Client extends EventEmitter {
    readonly socket: Socket;
    private incomingStream;
    constructor(socket: Socket);
    private handleData;
    private addFrameToIncomingStream;
    private handleError;
    private handleEnd;
    private handleClose;
    send(messageData: any): void;
}
