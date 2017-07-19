/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

import * as Frame from './Frame';

class IncomingMessage {
  constructor (stream) {
    this.stream = stream;
    this.rawData = stream.valueOf();
    this.type = stream.getType();
    this.value = this.type === Frame.TEXT_TYPE ? this.rawData.toString() : this.rawData;
  }
}

export default IncomingMessage;