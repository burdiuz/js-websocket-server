import { FrameType } from './FrameType';
import { IncomingStream } from './IncomingStream';
export declare class IncomingMessage {
    private readonly stream;
    readonly rawData: Uint8Array;
    readonly type: FrameType;
    readonly value: string | Uint8Array;
    constructor(stream: IncomingStream);
}
