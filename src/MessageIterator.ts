export class MessageIterator implements Iterator<Uint8Array, undefined> {
  private readonly length: number;
  private index: number;

  constructor(private readonly list: Uint8Array[]) {
    this.length = this.list.length;
    this.index = 0;
  }

  next(): IteratorResult<Uint8Array, undefined> {
    const currentIndex = this.index++;

    if (currentIndex >= this.length) {
      return { value: undefined, done: true };
    }

    return { value: this.list[currentIndex], done: false };
  }
}
