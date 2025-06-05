import { HttpServer } from "../http-server";
import { Socket } from "../socket";

export class ServerController {
  private readonly httpServer: HttpServer;
  private readonly socket: Socket;

  public constructor(public extensionPath: string) {
    this.httpServer = new HttpServer(9999, extensionPath);
    this.socket = new Socket(this.httpServer.getServer());
  }

  public start(): void {
    this.socket.connect();
    this.httpServer.start();
  }

  public async stop(): Promise<void> {
    await this.socket.shutdown();
    await this.httpServer.shutdown();
  }
}
