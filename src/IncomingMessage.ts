import { FrameType } from './FrameType';
import { IncomingStream } from './IncomingStream';

export class IncomingMessage {
  readonly rawData: Uint8Array;
  readonly type: FrameType;
  readonly value: string | Uint8Array;
  
  constructor(private readonly stream: IncomingStream) {
    this.rawData = this.stream.valueOf();
    this.type = this.stream.getType();
    this.value =
      this.type === FrameType.TEXT ? this.rawData.toString() : this.rawData;
  }
}
