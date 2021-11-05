import { Buffer } from 'buffer';
import * as Frame from './frame.js';
import { FrameType } from './FrameType.js';
import { MessageIterator } from './MessageIterator.js';
export const getMessageType = (data) => {
    if (data === null ||
        data === undefined ||
        data instanceof Buffer ||
        (data.hasOwnProperty('buffer') && data.buffer instanceof Buffer)) {
        return FrameType.BINARY;
    }
    return FrameType.TEXT;
};
export const createMessage = (data, type) => {
    let messageType = isNaN(type)
        ? getMessageType(data)
        : type;
    return new Message(Message.createBuffer(data), messageType);
};
export class Message {
    constructor(buffer, type, masked = false, frameSize = 0) {
        this.buffer = buffer;
        this.type = type;
        this.masked = masked;
        this.frameSize = frameSize;
    }
    valueOf() {
        const list = Frame.splitData(this.buffer, this.frameSize, this.masked);
        Frame.bounds(list, this.type);
        return list;
    }
    [Symbol.iterator]() {
        return new MessageIterator(this.valueOf());
    }
    static createBuffer(data) {
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
//# sourceMappingURL=Message.js.map