/// <reference types="node" />
export declare class BufferIterator implements Iterator<Buffer, undefined> {
    private readonly buffer;
    private frameSize;
    private length;
    private current;
    private pieces;
    constructor(buffer: Buffer, frameSize: number);
    next(): IteratorResult<Buffer, undefined>;
    [Symbol.iterator](): this;
}
