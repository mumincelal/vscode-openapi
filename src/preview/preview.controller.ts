import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";
import { BaseController } from "../base/base.controller";
import { hashString } from "../utils/hash.util";
import { parseFileContent } from "../utils/parser.util";
import { PreviewServer } from "./preview.server";

export class PreviewController extends BaseController {
  private readonly previewServer: PreviewServer;

  constructor(protected context: vscode.ExtensionContext) {
    super(context);

    this.previewServer = new PreviewServer("localhost", 99999);
  }

  async execute(uri?: vscode.Uri): Promise<void> {
    this.previewServer.initialize(this.context.extensionPath);

    let fileName = "";
    let fileHash = null;
    let parsedFileContent = "";

    if (uri) {
      const filePath = uri.fsPath;
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

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        const fileName = event.document.fileName;
        const fileHash = hashString(fileName.toLowerCase());
        const fileContent = event.document.getText();
        const parsedContent = parseFileContent(
          fileContent,
          event.document.languageId
        );
        this.previewServer.update(fileName, fileHash, parsedContent);
      }
    });
  }
}

class InlinePreview implements vscode.TextDocumentContentProvider {
  disposable!: vscode.Disposable;

  onDidChange?: vscode.Event<vscode.Uri>;

  constructor(
    private previewUrl: string,
    private fileName: string
  ) {
    const previewPanel = vscode.window.createWebviewPanel(
      "previewPanel",
      `OpenApi/Swagger Preview - ${path.basename(this.fileName)}`,
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    previewPanel.webview.html = this.provideTextDocumentContent();
  }

  provideTextDocumentContent(): string {
    return `
      <html lang="en">
        <body>
          <iframe src="${this.previewUrl}" frameborder="0" style="width:100%;height:100%;"></iframe>
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
