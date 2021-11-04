import { Buffer } from 'buffer';
import * as Frame from './frame';
import { FrameType } from './FrameType';
import { MessageIterator } from './MessageIterator';

export const getMessageType = (data: any) => {
  if (
    data === null ||
    data === undefined ||
    data instanceof Buffer ||
    (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer)
  ) {
    return FrameType.BINARY;
  }

  return FrameType.TEXT;
};

export const createMessage = (data: any, type?: FrameType) => {
  let messageType = Number.isNaN(type)
    ? getMessageType(data)
    : (type as FrameType);

  return new Message(Message.createBuffer(data), messageType);
};

export class Message {
  constructor(
    private readonly buffer: Buffer,
    private readonly type: FrameType,
    public masked = false,
    public frameSize = 0
  ) {}

  valueOf() {
    const list = Frame.splitData(this.buffer, this.frameSize, this.masked);
    Frame.bounds(list, this.type);
    return list;
  }

  [Symbol.iterator]() {
    return new MessageIterator(this.valueOf());
  }

  static createBuffer(data: any): Buffer {
    if (data === null || data === undefined) {
      return Buffer.allocUnsafe(0);
    }

    if (data instanceof Buffer) {
      return data;
    }

    if (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer) {
      return data.buffer;
    }

    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    const buffer = Buffer.allocUnsafe(data.length);
    buffer.write(data);
    return buffer;
  }
}
