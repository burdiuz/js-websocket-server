import { Client } from './Client.js';
const clients = new Map();
export const addClient = (client) => {
    clients.set(client.socket, client);
};
export const removeClient = (client) => {
    clients.delete(client.socket);
};
export const removeClientBySocket = (socket) => {
    clients.delete(socket);
};
export const getClientCount = () => clients.size;
export const enumerateClients = () => clients.values();
export const createClient = (socket) => new Client(socket);
export const getClient = (socket) => clients.get(socket) || createClient(socket);
//# sourceMappingURL=clients.js.map