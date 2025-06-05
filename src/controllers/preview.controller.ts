import {
  CancellationToken,
  EventEmitter,
  ExtensionContext,
  ProviderResult,
  TextDocumentContentProvider,
  Uri,
  ViewColumn,
  WebviewPanel,
  window,
  workspace
} from "vscode";
import { BaseController } from "./base.controller";
import { ServerController } from "./server.controller";

export class PreviewController extends BaseController {
  private readonly uri: Uri;
  private readonly eventEmitter: EventEmitter<any>;
  private previewPanel: WebviewPanel | undefined;
  private readonly port: number;

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

    this.register();

    // const server = new ServerController(context.extensionPath);
    // server.start();
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

  private display(): void {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage("No active text editor found.");
      return;
    }

    this.previewPanel = window.createWebviewPanel(
      "openApiPreview",
      "OpenApi Preview",
      ViewColumn.Beside,
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

  public async execute(): Promise<void> {
    if (this.previewPanel) {
      this.previewPanel.reveal(ViewColumn.Beside);
    } else {
      this.display();
    }

    this.eventEmitter.fire(this.uri);
  }
}
