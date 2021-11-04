import { Socket } from 'net';
import { Client } from './Client';

const clients = new Map<Socket, Client>();

export const addClient = (client: Client) => {
  clients.set(client.socket, client);
};

export const removeClient = (client: Client) => {
  clients.delete(client.socket);
};

export const removeClientBySocket = (socket: Socket) => {
  clients.delete(socket);
};

export const getClientCount = () => clients.size;

export const enumerateClients = () => clients.values();

export const createClient = (socket: Socket) => new Client(socket);

export const getClient = (socket: Socket) => clients.get(socket) || createClient(socket);
