// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { PreviewCommand } from "./commands/preview.commad";
import { Server } from "./server";
import { InitializeService } from "./services/initialize.service";
import { PreviewService } from "./services/preview.service";
import { Command } from "./types";

let server: Server;

const handleError = (error: Error) => {
  if (error?.message) {
    vscode.window.showErrorMessage(error.message);
  }

  return error;
};

const register = (
  context: vscode.ExtensionContext,
  command: Command,
  commandName: string
) => {
  const proxy = (...args: never[]) =>
    command.execute(...args).catch(handleError);

  const disposable = vscode.commands.registerCommand(
    `vscode-openapi.${commandName}`,
    proxy
  );

  context.subscriptions.push(disposable);
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const previewService = new PreviewService(context);
  register(context, new PreviewCommand(previewService), "preview");

  // const webviewService = new WebViewService(context);
  // register(context, new WebViewCommand(webviewService), "preview");
}

// This method is called when your extension is deactivated
export function deactivate() {
  const initializeService = new InitializeService("");
  initializeService.stop();
}
