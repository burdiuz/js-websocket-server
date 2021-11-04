/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

import * as Frame from './Frame';
import { IncomingMessage } from './IncomingMessage';

export class IncomingStream {
  private list: Uint8Array[] = [];

  constructor() {}

  append(buffer: Uint8Array) {
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
