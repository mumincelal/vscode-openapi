import { Server } from "../server";
import { Socket } from "../socket";

export class InitializeService {
  private readonly server: Server;
  private readonly socket: Socket;

  constructor(protected extensionPath: string) {
    this.server = new Server(9999, extensionPath);
    this.socket = new Socket(this.server.getServer());
  }

  public start(): void {
    this.socket.connect();
    this.server.start();
  }

  public async stop(): Promise<void> {
    await this.socket.shutdown();
    await this.server.shutdown();
  }
}
