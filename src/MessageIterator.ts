export class MessageIterator {
  private readonly length: number;
  private index: number;

  constructor(private readonly list: Uint8Array[]) {
    this.length = this.list.length;
    this.index = 0;
  }

  next() {
    const currentIndex = this.index++;

    if (currentIndex >= this.length) {
      return { value: undefined, done: true };
    }

    return { value: this.list[currentIndex], done: false };
  }
}
