/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

import BufferIterator from './BufferIterator';

export const CONTINUATION_TYPE = 0x0;
export const TEXT_TYPE = 0x1;
export const BINARY_TYPE = 0x2;
export const CLOSE_TYPE = 0x8;
export const PING_TYPE = 0x9;
export const PONG_TYPE = 0xA;

export const mask = (frameBuffer, position) => {
  const maskData = Buffer.allocUnsafe(4);
  //FIXME standard random algorithm is not reliable, please update if looking for further work with this project
  maskData.writeUInt32BE(Math.random() * Math.pow(2, 32) >>> 0);
  maskData.copy(frameBuffer, position, 0, 4);
  return maskData;
};

export const setDataLength = (frameBuffer, dataLength) => {
  const position = 2;
  let shift = 0;
  if (dataLength > 65535) {
    frameBuffer[1] = frameBuffer[1] | 127;
    frameBuffer.writeDoubleBE(dataLength, position);
    shift = 8;
  } else if (dataLength > 125) {
    frameBuffer[1] = frameBuffer[1] | 126;
    frameBuffer.writeUInt16BE(dataLength, position);
    shift = 2;
  } else {
    frameBuffer[1] = frameBuffer[1] | dataLength;
  }
  return shift;
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
  /* Messages from server should not be masked
   https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
   */
  if (masked) {
    maskData = mask(buffer, position);
    position += 4;
    index = 0;
    for (let entry of data) {
      let byte = entry[1];
      buffer[position++] = byte ^ maskData[index++ % 4];
    }
  } else {
    data.copy(buffer, position, 0, data.length);
  }
  return buffer;
};

export const readMask = (frameBuffer, position) => {
  const maskData = Buffer.allocUnsafe(4);
  frameBuffer.copy(maskData, 0, position, position + 4);
  return maskData;
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {?Buffer}
 */
export const parse = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || !data.length) return null;
  let result;
  const masked = data[startPosition + 1] >>> 7;
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
  let position = startPosition + 2;
  if (length > 125) {
    if (length == 126) {
      length = data.readUInt16BE(position);
      position += 2;
    } else {
      length = data.readDoubleBE(position);
      position += 8;
    }
  }
  if (position + (masked && 4) + length < data.length) {
    throw new Error('Cannot parse incomplete or broken? frame package.');
  }
  if (masked) {
    result = Buffer.allocUnsafe(length);
    const mask = readMask(data, position);
    position += 4;
    for (let index = 0; index < length; index++, position++) {
      result[index] = data[position] ^ mask[index % 4];
    }
  } else {
    result = data.slice(position, length);
  }
  return result;
};

/**
 * @param {Buffer[]} list
 */
export const parseStream = (list) => {
  const result = [];
  const length = list.length;
  for (let index = 0; index < length; index++) {
    result.push(parse(list[index]));
  }
  return Buffer.concat(result);
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {Number}
 */
export const readFrameLength = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || data.length <= startPosition) return 0;
  const position = startPosition + 2;
  let size = 2 + ((data[startPosition + 1] >>> 7) && 4);
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
  if (length > 125) {
    if (length == 126) {
      length = data.readUInt16BE(position);
      size += 2;
    } else {
      length = data.readDoubleBE(position);
      size += 8;
    }
  }
  return size + length;
};

/**
 *
 * @param {Buffer} data
 * @param {Number} [startPosition=0]
 * @returns {Number}
 */
export const readPayloadLength = (data, startPosition) => {
  startPosition = startPosition || 0;
  if (!data || data.length <= startPosition + 2) return 0;
  let length = data[startPosition + 1] & Math.pow(2, 7) - 1;
  const position = startPosition + 2;
  if (length > 125) {
    if (length == 126) {
      length = data.readUInt16BE(position);
    } else {
      length = data.readDoubleBE(position);
    }
  }
  return length;
};

export const length = (dataLength, masked) => {
  let length = 2;
  if (masked) {
    length += 4;
  }
  if (dataLength > 65535) {
    length += 8;
  } else if (dataLength > 125) {
    length += 2;
  }
  return length + dataLength;
};

export const getType = (buffer) => (buffer[0] & (Math.pow(2, 4) - 1));

export const isFinal = (buffer) => Boolean(buffer[0] >>> 7);

export const bounds = (list, type) => {
  const last = list.length - 1;
  // init first frame, set type opcode
  list[0][0] = list[0][0] >>> 4 << 4 | type;
  // init last frame, set FIN
  list[last][0] = list[last][0] | 1 << 7;
};

export const splitData = (data, frameSize, masked) => {
  const list = [];
  const iterator = new BufferIterator(data, frameSize);
  for (let buffer of iterator) {
    list.push(create(buffer, Boolean(masked)));
  }
  return list;
};
