import { createHash } from 'crypto';
// constant used in WebSocket handshake, https://www.rfc-editor.org/rfc/rfc6455
const UUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const SUPPORTED_VERSIONS = {
    '13': true,
};
export const hasListeners = (emitter, type) => emitter.listenerCount(type) > 0;
export const createKeyResponse = (key) => createHash('SHA1')
    .update(key + UUID)
    .digest('base64');
const generateUpgradeResponse = (key) => [
    'HTTP/1.1 101 Web Socket Protocol Handshake',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${createKeyResponse(key)}`,
    // skip message compression for now
    //'Sec-WebSocket-Extensions: permessage-deflate' + '\r\n',
    '',
    '',
].join('\r\n');
export const acceptHTTPConnection = (request, socket) => {
    let response;
    let result = false;
    console.log(request.headers);
    const upgrade = request.headers['upgrade'] || '';
    const key = request.headers['sec-websocket-key'] || '';
    const version = request.headers['sec-websocket-version'] || '';
    if (upgrade &&
        upgrade.toLowerCase() === 'websocket' &&
        version in SUPPORTED_VERSIONS) {
        response = generateUpgradeResponse(key);
        result = true;
    }
    else {
        response = 'HTTP/1.1 400 Bad Request\r\n\r\n';
    }
    console.log(response);
    socket.write(response);
    return result;
};
//# sourceMappingURL=utils.js.map