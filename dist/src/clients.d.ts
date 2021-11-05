import { Socket } from 'net';
import { Client } from './Client';
export declare const addClient: (client: Client) => void;
export declare const removeClient: (client: Client) => void;
export declare const removeClientBySocket: (socket: Socket) => void;
export declare const getClientCount: () => number;
export declare const enumerateClients: () => IterableIterator<Client>;
export declare const createClient: (socket: Socket) => Client;
export declare const getClient: (socket: Socket) => Client;
