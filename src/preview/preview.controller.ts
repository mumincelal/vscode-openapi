import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";
import { BaseController } from "../base/base.controller";
import { Logger } from "../logger";
import { hashString } from "../utils/hash.util";
import { parseFileContent } from "../utils/parser.util";
import { PreviewServer } from "./preview.server";

export class PreviewController extends BaseController {
  private readonly previewServer: PreviewServer;

  constructor(protected context: vscode.ExtensionContext) {
    super(context);
    this.previewServer = new PreviewServer("localhost", 9999);
  }

  async execute(uri?: vscode.Uri): Promise<void> {
    this.previewServer.initialize(this.context.extensionPath);

    let fileName = "";
    let fileHash = null;
    let parsedFileContent = "";

    if (uri) {
      const filePath = uri.fsPath;
      fileName = filePath;
      const fileExt = path.extname(filePath);
      const fileContent = fs.readFileSync(filePath).toString();
      parsedFileContent = parseFileContent(fileContent, fileExt);
    } else {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return;
      }

      const document = editor.document;
      fileName = document.fileName;
      parsedFileContent = parseFileContent(
        document.getText(),
        document.languageId
      );
    }

    fileHash = hashString(fileName.toLowerCase());
    this.previewServer.update(fileName, fileHash, parsedFileContent);

    const previewUrl = await vscode.env.asExternalUri(
      vscode.Uri.parse(this.previewServer.getUrl(fileHash))
    );

    const inlinePreview = new InlinePreview(previewUrl.toString(), fileName);
    this.context.subscriptions.push(inlinePreview.disposable);

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        path.dirname(fileName),
        path.basename(fileName)
      )
    );

    watcher.onDidChange(async (event) => {
      Logger.info(`File changed: ${event.fsPath}`);

      try {
        const filePath = event.fsPath;
        const fileExt = path.extname(filePath);
        const fileHash = hashString(filePath.toLowerCase());
        const fileContent = fs.readFileSync(filePath).toString();
        const parsedContent = parseFileContent(fileContent, fileExt);

        this.previewServer.update(filePath, fileHash, parsedContent);
      } catch (error) {
        Logger.error(`Error reading file: ${error}`);
      }
    });

    inlinePreview.disposable = vscode.Disposable.from(
      inlinePreview.disposable,
      watcher
    );
  }
}

class InlinePreview implements vscode.TextDocumentContentProvider {
  disposable!: vscode.Disposable;

  onDidChange?: vscode.Event<vscode.Uri>;

  constructor(
    private previewUrl: string,
    private filePath: string
  ) {
    const previewPanel = vscode.window.createWebviewPanel(
      "previewPanel",
      `OpenApi/Swagger Preview - ${path.basename(this.filePath)}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    previewPanel.webview.html = this.provideTextDocumentContent();

    previewPanel.onDidDispose(() => {
      Logger.info(`Preview closed for file: ${this.filePath}`);
      this.disposable.dispose();
    });
    this.disposable = vscode.Disposable.from(previewPanel);
  }

  provideTextDocumentContent(): string {
    return `
      <html lang="en">
        <body>
          <div style="position:fixed;height:100%;width:100%;">
            <iframe src="${this.previewUrl}" frameborder="0" style="width:100%;height:100%;"></iframe>
          </div>
        </body>
      </html>
    `;
  }
}

class BrowserPreview {
  constructor(private previewUrl: string) {
    vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.parse(this.previewUrl)
    );
  }
}
