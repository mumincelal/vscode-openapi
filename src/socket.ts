import { type Server as HttpServer } from "node:http";
import { Server as SocketIoServer, Socket as SocketIoSocket } from "socket.io";
import { Logger } from "./logger";

export class Socket {
  private readonly socket: SocketIoServer;
  private socketConnections = new Map<string, SocketIoSocket>();

  constructor(server: HttpServer) {
    this.socket = new SocketIoServer(server);
  }

  public connect(): void {
    this.socket.on("connection", (socket) => {
      Logger.log("A client connected");

      const key = crypto.randomUUID();
      this.socketConnections.set(key, socket);

      socket.on("disconnect", () => {
        Logger.log("A client disconnected");
        this.socketConnections.delete(key);
      });
    });
  }

  public emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  public getSocketConnections(): Map<string, SocketIoSocket> {
    return this.socketConnections;
  }

  public async shutdown(): Promise<void> {
    for (const [key, socket] of this.socketConnections.entries()) {
      socket.disconnect();
      this.socketConnections.delete(key);
      Logger.log(`Socket with key ${key} disconnected`);
    }

    this.socketConnections.clear();

    Logger.log("All sockets disconnected");
    await this.socket.close();
    Logger.log("Socket server closed");
  }
}
