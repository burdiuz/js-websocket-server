import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
export declare const hasListeners: (emitter: EventEmitter, type: string) => boolean;
export declare const createKeyResponse: (key: string) => string;
export declare const acceptHTTPConnection: (request: IncomingMessage, socket: Socket) => boolean;
