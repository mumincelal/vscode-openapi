import path from "node:path";
import {
  EventEmitter,
  ExtensionContext,
  FileSystemWatcher,
  ProviderResult,
  RelativePattern,
  TextDocumentContentProvider,
  Uri,
  ViewColumn,
  WebviewPanel,
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
  private previewPanel: WebviewPanel | undefined;
  private readonly port: number;
  private readonly server: ServerController;
  private fileWatchers: Map<string, FileSystemWatcher> = new Map();

  public constructor(
    protected context: ExtensionContext,
    protected previewUrl: string,
    protected serverPort: number
  ) {
    super(context);

    this.uri = Uri.parse(previewUrl);
    this.eventEmitter = new EventEmitter();
    this.previewPanel = undefined;
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

    const socket = this.server.getSocket();

    socket.onClientConnected((clientSocket) => {
      clientSocket.on("prepare-ui", async () => {
        try {
          const bundledSchema = await bundle(activeFile);
          if (!bundledSchema) {
            throw new Error("Bundled schema is empty or undefined.");
          }
          clientSocket.emit("update-ui", bundledSchema);
        } catch (error) {
          clientSocket.emit("error", error);
          Logger.error(`Error bundling schema: ${error}`);
        }
      });
    });

    const watcher = workspace.createFileSystemWatcher(
      new RelativePattern(path.dirname(activeFile), path.basename(activeFile))
    );

    watcher.onDidChange(async () => {
      Logger.info(`File changed: ${activeFile}`);

      try {
        const bundledSchema = await bundle(activeFile);
        if (!bundledSchema) {
          throw new Error("Bundled schema is empty or undefined.");
        }
        socket.send("update-ui", bundledSchema);
      } catch (error) {
        socket.send("error", error);
        Logger.error(`Error bundling schema: ${error}`);
      }
    });

    this.fileWatchers.set(activeFile, watcher);

    this.display();
    this.update();
  }

  private display(): void {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage("No active text editor found.");
      return;
    }

    this.previewPanel = window.createWebviewPanel(
      "openApiPreview",
      `OpenApi Preview: ${path.basename(editor.document.fileName)}`,
      ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.previewPanel.webview.html = `
      <html>
        <body style="margin:0px;padding:0px;background:#fafafa;">
          <div style="position:fixed;height:100%;width:100%;">
            <iframe src="http://localhost:${this.port}" frameborder="0" style="overflow:hidden;height:100%;width:100%" height="100%" width="100%"></iframe>
          </div>
        </body>
      </html>`;

    this.previewPanel.onDidDispose(() => {
      this.previewPanel = undefined;
    }, null);
  }

  private update(): void {
    if (this.previewPanel) {
      this.previewPanel.reveal(ViewColumn.Active);
    } else {
      this.display();
    }

    this.eventEmitter.fire(this.uri);
  }
}
