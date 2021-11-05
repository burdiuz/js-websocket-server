import { BufferIterator } from './BufferIterator.js';
export const mask = (frameBuffer, position) => {
    const maskData = Buffer.allocUnsafe(4);
    //FIXME standard random algorithm is not reliable, please update if looking for further work with this project
    maskData.writeUInt32BE((Math.random() * Math.pow(2, 32)) >>> 0);
    maskData.copy(frameBuffer, position, 0, 4);
    return maskData;
};
// Returns data shift
export const setDataLength = (frameBuffer, dataLength) => {
    const position = 2;
    if (dataLength > 65535) {
        frameBuffer[1] = frameBuffer[1] | 127;
        frameBuffer.writeDoubleBE(dataLength, position);
        return 8;
    }
    if (dataLength > 125) {
        frameBuffer[1] = frameBuffer[1] | 126;
        frameBuffer.writeUInt16BE(dataLength, position);
        return 2;
    }
    frameBuffer[1] = frameBuffer[1] | dataLength;
    return 0;
};
export const create = (data, masked) => {
    let maskData;
    let index;
    let position = 2;
    const dataLength = data.length;
    const buffer = Buffer.allocUnsafe(length(dataLength, masked));
    buffer[0] = 0; // FIN + RSV1-3 + OPCODE
    buffer[1] = (masked ? 1 : 0) << 7;
    position += setDataLength(buffer, dataLength);
    /*
      Messages from server should not be masked
      https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
     */
    if (!masked) {
        data.copy(buffer, position, 0, data.length);
        return buffer;
    }
    maskData = mask(buffer, position);
    position += 4;
    index = 0;
    /*
    // FIXME why am I getting index out of number?
    // did I confuse it with buffer.entries()?
    for (let entry of data) {
      let byte = entry[1];
      buffer[position++] = byte ^ maskData[index++ % 4];
    }
    */
    for (let byte of data) {
        buffer[position++] = byte ^ maskData[index++ % 4];
    }
    return buffer;
};
export const readMask = (frameBuffer, position) => {
    const maskData = Buffer.allocUnsafe(4);
    frameBuffer.copy(maskData, 0, position, position + 4);
    return maskData;
};
export const parse = (data, startPosition = 0) => {
    let result;
    const masked = data[startPosition + 1] >>> 7;
    let length = data[startPosition + 1] & (Math.pow(2, 7) - 1);
    let position = startPosition + 2;
    if (length > 125) {
        if (length == 126) {
            length = data.readUInt16BE(position);
            position += 2;
        }
        else {
            length = data.readDoubleBE(position);
            position += 8;
        }
    }
    if (position + (masked && 4) + length < data.length) {
        throw new Error('Cannot parse incomplete or broken? frame package.');
    }
    if (!masked) {
        return data.slice(position, length);
    }
    result = Buffer.allocUnsafe(length);
    const mask = readMask(data, position);
    position += 4;
    for (let index = 0; index < length; index++, position++) {
        result[index] = data[position] ^ mask[index % 4];
    }
    return result;
};
export const parseStream = (list) => Buffer.concat(list
    //.filter((item) => item && item.length)
    .map((part) => parse(part)));
export const readFrameLength = (data, startPosition = 0) => {
    if (data.length <= startPosition) {
        return 0;
    }
    const position = startPosition + 2;
    const size = 2 + (data[startPosition + 1] >>> 7 && 4);
    const length = data[startPosition + 1] & (Math.pow(2, 7) - 1);
    if (length < 126) {
        return size + length;
    }
    if (length == 126) {
        return size + data.readUInt16BE(position) + 2;
    }
    return size + data.readDoubleBE(position) + 8;
};
// TODO unused helper function
export const readPayloadLength = (data, startPosition = 0) => {
    if (data.length <= startPosition + 2) {
        return 0;
    }
    /* 0x7F = (Math.pow(2, 7) - 1) */
    let length = data[startPosition + 1] & 0x7f;
    const position = startPosition + 2;
    if (length < 126) {
        return length;
    }
    if (length == 126) {
        return data.readUInt16BE(position);
    }
    return data.readDoubleBE(position);
};
export const length = (dataLength, masked) => {
    let length = 2;
    if (masked) {
        length += 4;
    }
    if (dataLength > 65535) {
        length += 8;
    }
    else if (dataLength > 125) {
        length += 2;
    }
    return length + dataLength;
};
export const getType = (buffer) => 
/* 0xF = (Math.pow(2, 4) - 1) */
buffer[0] & 0xf;
export const isFinal = (buffer) => Boolean(buffer[0] >>> 7);
export const bounds = (list, type) => {
    const last = list.length - 1;
    // init first frame, set type opcode
    list[0][0] = ((list[0][0] >>> 4) << 4) | type;
    // init last frame, set FIN
    list[last][0] = list[last][0] | (1 << 7);
};
export const splitData = (data, frameSize, masked) => {
    const list = [];
    const iterator = new BufferIterator(data, frameSize);
    for (let buffer of iterator) {
        list.push(create(buffer, Boolean(masked)));
    }
    return list;
};
//# sourceMappingURL=frame.js.map