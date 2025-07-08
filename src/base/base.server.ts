import { type Server as HttpServer } from "node:http";
import { type Server as SocketIoServer } from "socket.io";

export interface Server {
  initialize(rootPath: string): Promise<void>;
  stop(): void;
}

export abstract class BaseServer implements Server {
  protected server: HttpServer | null = null;
  protected isServerRunning = false;
  protected host: string;
  protected port: number;
  protected io: SocketIoServer | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  /**
   * Initializes the server.
   *  @returns A promise that resolves when the execution is complete.
   */
  abstract initialize(rootPath: string): Promise<void>;

  /**
   * Stops the server.
   */
  stop(): void {
    this.server?.close();
    this.server = null;
    this.isServerRunning = false;
  }
}
