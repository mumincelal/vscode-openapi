import fs from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import SwaggerParser from "@apidevtools/swagger-parser";
import express from "express";
import { Server as SocketIoServer } from "socket.io";
import { BaseServer } from "../base/base.server";
import { Logger } from "../logger";

const FILE_CONTENT: Record<string, any> = {};

export class PreviewServer extends BaseServer {
  constructor(host: string, port: number) {
    super(host, port);
  }

  /**
   * Initializes the server.
   */
  async initialize(rootPath: string): Promise<void> {
    if (this.isServerRunning) {
      return;
    }

    const app = express();
    app.use(express.static(rootPath));
    app.use(
      "/node_modules",
      express.static(path.join(rootPath, "node_modules"))
    );
    app.use("/:fileHash", (req, res) => {
      const htmlContent = fs
        .readFileSync(path.join(rootPath, "index.html"))
        .toString("utf-8")
        .replace("%FILE_HASH%", req.params.fileHash);

      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    });

    this.server = createServer(app);
    this.io = new SocketIoServer(this.server);

    app.set("host", this.host);
    app.set("port", this.port);

    this.startServer();
    this.startSocketIo();
  }

  /**
   * Updates the file content.
   * @param filePath
   * @param fileHash
   * @param content
   * @return A promise that resolves when the update is complete.
   * @throws Error if the update fails.
   */
  async update(
    filePath: string,
    fileHash: string,
    content: any
  ): Promise<void> {
    try {
      FILE_CONTENT[fileHash] = await SwaggerParser.bundle(
        filePath,
        content,
        {}
      );

      this.io?.to(fileHash).emit("UPDATE", content);
    } catch (error) {
      throw new Error("Failed to update file content");
    }
  }

  /**
   * Gets the URL for the specified file hash.
   * @param fileHash The hash of the file.
   * @returns The URL for the file.
   */
  getUrl(fileHash: string): string {
    return `http://${this.host}:${this.port}/${fileHash}`;
  }

  /**
   * Starts the server.
   */
  private startServer(): void {
    if (this.server) {
      this.server.listen(this.port, this.host, () => {
        this.isServerRunning = true;
        Logger.log(`Server running at http://${this.host}:${this.port}`);
      });
    } else {
      throw new Error("Server is not initialized.");
    }
  }

  /**
   * Starts the Socket.IO server and sets up event listeners.
   */
  private startSocketIo(): void {
    if (this.io) {
      this.io.on("connection", (socket) => {
        Logger.log("Client connected");

        socket.on("INITIALIZE", (data, fn) => {
          Logger.log("Received INITIALIZE event");

          const fileHash = data.fileHash;
          socket.join(fileHash);
          fn(FILE_CONTENT[fileHash]);
        });

        socket.on("disconnect", () => {
          Logger.log("Client disconnected");
        });
      });
    } else {
      throw new Error("Socket.IO server is not initialized.");
    }
  }
}
