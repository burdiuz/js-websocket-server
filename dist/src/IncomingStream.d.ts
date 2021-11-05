/// <reference types="node" />
import { IncomingMessage } from './IncomingMessage';
export declare class IncomingStream {
    private list;
    constructor();
    append(buffer: Buffer): void;
    valueOf(): Buffer;
    createMessage(): IncomingMessage | null;
    getType(): number;
    isFinal(): boolean;
}
