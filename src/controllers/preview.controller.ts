import path from "node:path";
import type { Socket } from "socket.io";
import {
  EventEmitter,
  type ExtensionContext,
  type FileSystemWatcher,
  type ProviderResult,
  RelativePattern,
  type TextDocumentContentProvider,
  Uri,
  ViewColumn,
  type WebviewPanel,
  window,
  workspace
} from "vscode";
import { Logger } from "../logger";
import { bundle } from "../utils/openapi.util";
import { BaseController } from "./base.controller";
import { FileController } from "./file.controller";
import { ServerController } from "./server.controller";

export class PreviewController extends BaseController {
  private readonly uri: Uri;
  private readonly eventEmitter: EventEmitter<any>;
  private readonly port: number;
  private readonly server: ServerController;
  private previews: Map<
    string,
    { panel: WebviewPanel; watcher: FileSystemWatcher }
  > = new Map();

  public constructor(
    protected context: ExtensionContext,
    protected previewUrl: string,
    protected serverPort: number
  ) {
    super(context);
    this.uri = Uri.parse(previewUrl);
    this.eventEmitter = new EventEmitter();
    this.port = serverPort;
    this.server = new ServerController(context.extensionPath);
    this.server.start();
    this.register();
  }

  private register(): void {
    const provider = new (class implements TextDocumentContentProvider {
      public onDidChangeEmitter = new EventEmitter<Uri>();
      public onDidChange = this.onDidChangeEmitter.event;

      public provideTextDocumentContent(): ProviderResult<string> {
        return "";
      }
    })();

    const disposable = workspace.registerTextDocumentContentProvider(
      "vscode-openapi",
      provider
    );
    this.context.subscriptions.push(disposable);
  }

  public async execute(): Promise<void> {
    const fileController = new FileController(this.context);
    const activeFile = fileController.getActiveFile();
    Logger.log(`Active file: ${activeFile}`);

    if (this.previews.has(activeFile)) {
      this.previews.get(activeFile)!.panel.reveal(ViewColumn.Active);
      return;
    }

    const serverSocket = this.server.getSocket();

    serverSocket.on("connection", (socket) => {
      Logger.log("Connection established");

      Logger.log(`Socket: ${socket.id}`);
      socket.join(socket.id);

      socket.on("prepare-ui", async () => {
        this.emitToRoom(socket, socket.id, activeFile);
      });

      socket.on("disconnect", () => {
        Logger.log("Connection terminated for socket: " + socket.id);
        socket.leave(socket.id);
      });
    });

    const watcher = workspace.createFileSystemWatcher(
      new RelativePattern(path.dirname(activeFile), path.basename(activeFile))
    );

    watcher.onDidChange(async () => {
      Logger.log(`File changed: ${activeFile}`);

      // await this.emitToRoom(
      // 	serverSocket,
      // 	path.basename(activeFile),
      // 	activeFile,
      // );
    });

    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage("No active text editor found.");
      return;
    }

    const panel = window.createWebviewPanel(
      "openApiPreview",
      `OpenApi Preview: ${path.basename(editor.document.fileName)}`,
      ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = `
      <html>
        <body style="margin:0px;padding:0px;background:#fafafa;">
          <div style="position:fixed;height:100%;width:100%;">
            <iframe src="http://localhost:${this.port}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
          </div>
        </body>
      </html>`;

    panel.onDidDispose(() => {
      watcher.dispose();
      this.server.stop();
      this.previews.delete(activeFile);
    }, null);

    this.previews.set(activeFile, { panel, watcher });
    this.update(activeFile);
  }

  private update(filePath: string): void {
    const preview = this.previews.get(filePath);

    if (preview) {
      preview.panel.reveal(ViewColumn.Active);
      this.eventEmitter.fire(this.uri);
    }
  }

  private async emitToRoom(
    socket: Socket,
    room: string,
    activeFile: string
  ): Promise<void> {
    try {
      const bundledSchema = await bundle(activeFile);
      if (!bundledSchema) {
        throw new Error("Bundled schema is empty or undefined.");
      }
      socket.to(room).emit("update-ui", bundledSchema);
    } catch (error) {
      socket.to(room).emit("error", error);
      Logger.error(`Error bundling schema: ${error}`);
    }
  }
}
