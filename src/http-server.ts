import { type Server, createServer } from "node:http";
import express from "express";
import { Logger } from "./logger";

export class HttpServer {
  private readonly port: number;
  private readonly server: Server;

  public constructor(port: number, extensionPath: string) {
    this.port = port;
    const app = express();
    this.server = createServer(app);
    app.use(express.static(extensionPath));
  }

  /**
   * Returns the underlying HTTP server instance.
   * @returns The HTTP server instance.
   */
  public getServer(): Server {
    return this.server;
  }

  /**
   * Starts the HTTP server.
   */
  public start(): void {
    this.server.listen(this.port, () => {
      Logger.log(`Server started on port ${this.port}`);
    });
  }

  /**
   * Shuts down the HTTP server.
   */
  public async shutdown(): Promise<void> {
    this.server.close(() => {
      Logger.log("Server closed");
    });
  }
}
