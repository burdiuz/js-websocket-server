export var FrameType;
(function (FrameType) {
    FrameType[FrameType["CONTINUATION"] = 0] = "CONTINUATION";
    FrameType[FrameType["TEXT"] = 1] = "TEXT";
    FrameType[FrameType["BINARY"] = 2] = "BINARY";
    FrameType[FrameType["CLOSE"] = 8] = "CLOSE";
    FrameType[FrameType["PING"] = 9] = "PING";
    FrameType[FrameType["PONG"] = 10] = "PONG";
})(FrameType || (FrameType = {}));
//# sourceMappingURL=FrameType.js.map