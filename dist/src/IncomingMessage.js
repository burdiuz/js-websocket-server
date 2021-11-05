import { FrameType } from './FrameType.js';
export class IncomingMessage {
    constructor(stream) {
        this.stream = stream;
        this.rawData = this.stream.valueOf();
        this.type = this.stream.getType();
        this.value =
            this.type === FrameType.TEXT ? this.rawData.toString() : this.rawData;
    }
}
//# sourceMappingURL=IncomingMessage.js.map