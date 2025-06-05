import http, { type Server as HttpServer } from "node:http";
import express from "express";
import { Logger } from "./logger";

export class Server {
  private readonly port: number;
  private readonly server: HttpServer;

  constructor(port: number, extensionPath: string) {
    this.port = port;

    const app = express();
    this.server = http.createServer(app);

    app.use(express.static(extensionPath));
  }

  public getServer(): HttpServer {
    return this.server;
  }

  public start(): void {
    this.server.listen(this.port, () => {
      Logger.log(`Server started on port ${this.port}`);
    });
  }

  public async shutdown(): Promise<void> {
    this.server.close(() => {
      Logger.log("Server closed");
    });
  }
}
