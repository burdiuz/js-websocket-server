export class BufferIterator {
  private length: number;
  private current: number;
  private pieces: number;
  
  // Uint8Array is a base type of Buffer and this iterator does not use Buffer API
  constructor(private readonly buffer: Uint8Array, private frameSize: number) {
    this.length = buffer.length;
    this.current = 0;
    this.pieces = frameSize > 0 ? Math.ceil(this.length / frameSize) : 1;
  }

  next() {
    const current = this.current++;
    if (current >= this.pieces) {

      return {
        value: undefined,
        done: true,
      };
    } else if (current === 0 && this.pieces === 1) {
      // special case when buffer should be sent in one frame, covers most communication sets :)
      return {
        value: this.buffer,
        done: false,
      };
    }

    const pos = current * this.frameSize;
    const size = this.current * this.frameSize > this.length ? this.length - pos : this.frameSize;

    return {
      value: this.buffer.slice(pos, pos + size),
      done: false,
    };
  }

  [Symbol.iterator]() {
    return this;
  }
}
