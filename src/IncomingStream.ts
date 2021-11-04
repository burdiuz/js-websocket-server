import * as Frame from './frame';
import { IncomingMessage } from './IncomingMessage';

export class IncomingStream {
  private list: Buffer[] = [];

  constructor() {}

  append(buffer: Buffer) {
    this.list.push(buffer);
  }

  valueOf() {
    return Frame.parseStream(this.list);
  }

  createMessage() {
    return this.isFinal() ? new IncomingMessage(this) : null;
  }

  getType() {
    return this.list.length ? Frame.getType(this.list[0]) : 0;
  }

  isFinal() {
    return Boolean(this.list.length && Frame.isFinal(this.list[0]));
  }
}
