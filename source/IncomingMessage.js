/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

class IncomingMessage {
  constructor (stream) {
    this.stream = stream;
    this.rawData = stream.valueOf();
    this.type = stream.getType();
    this.value = this.type === Frame.TEXT_TYPE ? this.rawData.toString() : this.rawData;
  }
}
