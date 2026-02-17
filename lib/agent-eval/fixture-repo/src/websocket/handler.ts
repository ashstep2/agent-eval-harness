import { EventEmitter } from 'events';

type SocketEvent = 'message' | 'close';
type SocketListener = (data?: string) => void;

export interface WebSocketLike {
  on(event: SocketEvent, cb: SocketListener): void;
  off?(event: SocketEvent, cb: SocketListener): void;
  removeListener?(event: SocketEvent, cb: SocketListener): void;
  send(data: string): void;
}

const events = new EventEmitter();
const socketCleanups = new WeakMap<WebSocketLike, () => void>();

function removeEventListener(
  emitter: EventEmitter,
  event: string,
  cb: (...args: unknown[]) => void,
) {
  if (typeof emitter.off === 'function') {
    emitter.off(event, cb);
    return;
  }
  emitter.removeListener(event, cb);
}

export function registerSocket(socket: WebSocketLike) {
  const existingCleanup = socketCleanups.get(socket);
  if (existingCleanup) {
    return existingCleanup;
  }

  const onMessage: SocketListener = (data) => {
    events.emit('message', data);
  };

  const onBroadcast = (message?: string) => {
    if (typeof message === 'string') {
      socket.send(message);
    }
  };

  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) {
      return;
    }
    isCleanedUp = true;

    socket.off?.('message', onMessage);
    socket.off?.('close', onClose);
    socket.removeListener?.('message', onMessage);
    socket.removeListener?.('close', onClose);
    removeEventListener(events, 'broadcast', onBroadcast);

    if (socketCleanups.get(socket) === cleanup) {
      socketCleanups.delete(socket);
    }
  };

  const onClose: SocketListener = () => {
    cleanup();
    events.emit('disconnect');
  };

  socketCleanups.set(socket, cleanup);
  socket.on('message', onMessage);
  socket.on('close', onClose);
  if (!isCleanedUp) {
    events.on('broadcast', onBroadcast);
  }

  return cleanup;
}

export function broadcast(message: string) {
  events.emit('broadcast', message);
}

export function onBroadcast(cb: (message: string) => void) {
  events.on('broadcast', cb);
  return () => {
    removeEventListener(events, 'broadcast', cb);
  };
}
