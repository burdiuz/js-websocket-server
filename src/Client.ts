import { EventEmitter } from 'events';
import { Socket } from 'net';
import { Buffer } from 'buffer';
import * as Frame from './Frame';
import { FrameType } from './FrameType';
import { Message, createMessage } from './Message';
import { IncomingStream } from './IncomingStream';
import { SocketEvent } from './SocketEvent';
import { ClientEvent } from './ClientEvent';
import { hasListeners } from './utils';

export class Client extends EventEmitter {
  private incomingStream: IncomingStream | null = null;

  constructor(readonly socket: Socket) {
    super();

    //TODO handle incoming messages
    socket.on(SocketEvent.DATA, this.handleData);
    socket.on(SocketEvent.ERROR, this.handleError);
    socket.on(SocketEvent.END, this.handleEnd);
    socket.on(SocketEvent.CLOSE, this.handleClose);
  }

  private handleData = (data: Buffer) => {
    let position = 0;
    let frameLength = 0;
    do {
      frameLength = Frame.readFrameLength(data, position);
      if (!frameLength) break;
      const frame = Buffer.allocUnsafe(frameLength);
      data.copy(frame, 0, position, position + frameLength);
      this.addFrameToIncomingStream(frame);
      position += frameLength;
    } while (position < data.length && frameLength);
  };

  private addFrameToIncomingStream = (frame: Uint8Array) => {
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
          this.emit(
            ClientEvent.MESSAGE_RECEIVED,
            this.incomingStream.createMessage()
          );
          break;
        case FrameType.TEXT:
          this.emit(
            ClientEvent.MESSAGE_RECEIVED,
            this.incomingStream.createMessage()
          );
          break;
        case FrameType.CLOSE:
          this.socket.end();
          break;
        case FrameType.PING:
          this.send(
            createMessage(this.incomingStream.valueOf(), FrameType.PONG)
          );
          break;
      }
      this.incomingStream = null;
    }
  };

  private handleError = (error: Error) => {
    this.emit(ClientEvent.ERROR, error);
  };

  private handleEnd = () => {
    this.emit(ClientEvent.END, this);
  };

  private handleClose = () => {
    this.emit(ClientEvent.CLOSE, this);
  };

  send(messageData: any) {
    if (!messageData) {
      throw new Error('Message cannot be empty.');
    }

    const message =
      messageData instanceof Message ? messageData : createMessage(messageData);
    const socket = this.socket;

    for (let frame of message) {
      socket.write(frame);
    }

    this.emit(ClientEvent.MESSAGE_SENT);
  }
}
