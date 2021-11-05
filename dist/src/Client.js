import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import * as Frame from './frame.js';
import { FrameType } from './FrameType.js';
import { Message, createMessage } from './Message.js';
import { IncomingStream } from './IncomingStream.js';
import { SocketEvent } from './SocketEvent.js';
import { ClientEvent } from './ClientEvent.js';
import { hasListeners } from './utils.js';
export class Client extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.incomingStream = null;
        this.handleData = (data) => {
            let position = 0;
            let frameLength = 0;
            do {
                frameLength = Frame.readFrameLength(data, position);
                if (!frameLength)
                    break;
                const frame = Buffer.allocUnsafe(frameLength);
                data.copy(frame, 0, position, position + frameLength);
                this.addFrameToIncomingStream(frame);
                position += frameLength;
            } while (position < data.length && frameLength);
        };
        this.addFrameToIncomingStream = (frame) => {
            if (!this.incomingStream) {
                // don't bother looking for data if developer not interested in it
                if (!hasListeners(this, ClientEvent.MESSAGE_RECEIVED)) {
                    return;
                }
                this.incomingStream = new IncomingStream();
            }
            //FIXME client may send multiple frames in one data chunk, data receiver should check this
            this.incomingStream.append(frame);
            if (this.incomingStream.isFinal()) {
                switch (this.incomingStream.getType()) {
                    case FrameType.BINARY:
                        this.emit(ClientEvent.MESSAGE_RECEIVED, this.incomingStream.createMessage());
                        break;
                    case FrameType.TEXT:
                        this.emit(ClientEvent.MESSAGE_RECEIVED, this.incomingStream.createMessage());
                        break;
                    case FrameType.CLOSE:
                        this.socket.end();
                        break;
                    case FrameType.PING:
                        this.send(createMessage(this.incomingStream.valueOf(), FrameType.PONG));
                        break;
                }
                this.incomingStream = null;
            }
        };
        this.handleError = (error) => {
            this.emit(ClientEvent.ERROR, error);
        };
        this.handleEnd = () => {
            this.emit(ClientEvent.END, this);
        };
        this.handleClose = () => {
            this.emit(ClientEvent.CLOSE, this);
        };
        //TODO handle incoming messages
        socket.on(SocketEvent.DATA, this.handleData);
        socket.on(SocketEvent.ERROR, this.handleError);
        socket.on(SocketEvent.END, this.handleEnd);
        socket.on(SocketEvent.CLOSE, this.handleClose);
    }
    send(messageData) {
        if (!messageData) {
            throw new Error('Message cannot be empty.');
        }

        console.log(' --- MESSAGE:', messageData instanceof Message, messageData);

        const message = messageData instanceof Message ? messageData : createMessage(messageData);
        const socket = this.socket;
    
        console.log(message);
        
        for (let frame of message) {
            socket.write(frame);
        }
        this.emit(ClientEvent.MESSAGE_SENT);
    }
}
//# sourceMappingURL=Client.js.map