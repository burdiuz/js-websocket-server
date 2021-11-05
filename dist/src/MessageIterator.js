export class MessageIterator {
    constructor(list) {
        this.list = list;
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
//# sourceMappingURL=MessageIterator.js.map