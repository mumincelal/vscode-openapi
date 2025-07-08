import * as vscode from "vscode";
import { BaseController } from "./base.controller";

export interface Command {
  execute(uri?: vscode.Uri): Promise<void>;
}

export abstract class BaseCommand<T extends BaseController> implements Command {
  constructor(protected controller: T) {}

  /**
   * Executes the command with the provided URI.
   * @param uri - The URI to execute the command with.
   * @returns A promise that resolves when the command execution is complete.
   */
  execute(uri?: vscode.Uri): Promise<void> {
    return this.controller.execute(uri);
  }
}
