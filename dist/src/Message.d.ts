/// <reference types="node" />
import { Buffer } from 'buffer';
import { FrameType } from './FrameType';
import { MessageIterator } from './MessageIterator';
export declare const getMessageType: (data: any) => FrameType.TEXT | FrameType.BINARY;
export declare const createMessage: (data: any, type?: FrameType | undefined) => Message;
export declare class Message {
    private readonly buffer;
    private readonly type;
    masked: boolean;
    frameSize: number;
    constructor(buffer: Buffer, type: FrameType, masked?: boolean, frameSize?: number);
    valueOf(): Uint8Array[];
    [Symbol.iterator](): MessageIterator;
    static createBuffer(data: any): Buffer;
}
