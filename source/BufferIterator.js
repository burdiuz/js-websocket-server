/**
 * Created by Oleg Galaburda on 07.04.16.
 */

'use strict';

class BufferIterator {
  constructor(buffer, frameSize) {
    this._buffer = buffer;
    this._length = buffer.length;
    this._current = 0;
    this._pieces = frameSize > 0 ? Math.ceil(this._length / frameSize) : 1;
    this._frameSize = frameSize;
  }

  next() {
    const current = this._current++;
    if (current >= this._pieces) {
      return {
        value: undefined,
        done: true,
      };
    } else if (current === 0 && this._pieces === 1) {
      // special case when buffer should be sent in one frame, covers most communication sets :)
      return {
        value: this._buffer,
        done: false,
      };
    }

    let size = this._frameSize;
    const pos = current * this._frameSize;
    if (this._current * this._frameSize > this._length) {
      size = this._length - pos;
    }
    return {
      value: this._buffer.slice(pos, pos + size),
      done: false,
    };
  }

  [Symbol.iterator] = () => this;
}

export default BufferIterator;
