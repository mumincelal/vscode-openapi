import * as vscode from "vscode";

export interface Controller {
  /**
   * Executes the controller's main functionality.
   * @param uri - An optional URI that may be used by the controller.
   * @returns A promise that resolves when the execution is complete.
   */
  execute(uri?: vscode.Uri): Promise<void>;
}

export abstract class BaseController implements Controller {
  constructor(protected context: vscode.ExtensionContext) {}

  /**
   * Executes the controller's main functionality.
   * @param uri - An optional URI that may be used by the controller.
   * @returns A promise that resolves when the execution is complete.
   */
  abstract execute(uri?: vscode.Uri): Promise<void>;
}
