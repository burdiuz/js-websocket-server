export declare class MessageIterator implements Iterator<Uint8Array, undefined> {
    private readonly list;
    private readonly length;
    private index;
    constructor(list: Uint8Array[]);
    next(): IteratorResult<Uint8Array, undefined>;
}
