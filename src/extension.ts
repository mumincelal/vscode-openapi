/**
 * The module 'vscode' contains the VS Code extensibility API
 * Import the module and reference it with the alias vscode in your code below
 */
import * as vscode from "vscode";
import { Command } from "./commands/base.command";
import { PreviewCommand } from "./commands/preview.commad";
import { PreviewController } from "./controllers/preview.controller";

export function activate(context: vscode.ExtensionContext): void {
  const previewService = new PreviewController(
    context,
    "vscode-openapi://preview",
    9999
  );
  register(context, new PreviewCommand(previewService), "preview");
}

/**
 * Registers a command with the given context and command name.
 * The command will execute the provided command's execute method and handle errors.
 *
 * @param context - The extension context to register the command with.
 * @param command - The command to register.
 * @param commandName - The name of the command to register.
 */
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

/**
 * Handles errors by displaying an error message in the VS Code window.
 * If the error has a message, it will be shown to the user.
 *
 * @param error - The error to handle.
 * @returns The error that was passed in.
 */
const handleError = (error: Error) => {
  if (error?.message) {
    vscode.window.showErrorMessage(error.message);
  }

  return error;
};

export function deactivate(): void {
  // Clean up any resources or connections
}
