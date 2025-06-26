import { Server as SocketIoServer } from "socket.io";
import { HttpServer } from "../http-server";
import { Logger } from "../logger";

export class ServerController {
  private readonly httpServer: HttpServer;
  private readonly socket: SocketIoServer;

  public constructor(public extensionPath: string) {
    this.httpServer = new HttpServer(9999, extensionPath);
    this.socket = new SocketIoServer(this.httpServer.getServer());
  }

  public start(): void {
    this.httpServer.start();
  }

  public async stop(): Promise<void> {
    await this.socket.close();
    Logger.log("Socket server closed");
    await this.httpServer.shutdown();
    Logger.log("HTTP server closed");
  }

  public getSocket(): SocketIoServer {
    return this.socket;
  }
}
