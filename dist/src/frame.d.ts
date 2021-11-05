import { FrameType } from './FrameType';
export declare const mask: (frameBuffer: Uint8Array, position: number) => Buffer;
export declare const setDataLength: (frameBuffer: Buffer, dataLength: number) => 0 | 2 | 8;
export declare const create: (data: Buffer, masked: boolean) => Buffer;
export declare const readMask: (frameBuffer: Buffer, position: number) => Buffer;
export declare const parse: (data: Buffer, startPosition?: number) => Buffer;
export declare const parseStream: (list: Buffer[]) => Buffer;
export declare const readFrameLength: (data: Buffer, startPosition?: number) => number;
export declare const readPayloadLength: (data: Buffer, startPosition?: number) => number;
export declare const length: (dataLength: number, masked: boolean) => number;
export declare const getType: (buffer: Uint8Array) => number;
export declare const isFinal: (buffer: Uint8Array) => boolean;
export declare const bounds: (list: Uint8Array[], type: FrameType) => void;
export declare const splitData: (data: Buffer, frameSize: number, masked: boolean) => Uint8Array[];