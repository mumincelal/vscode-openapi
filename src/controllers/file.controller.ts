import { ExtensionContext, window } from "vscode";
import { Logger } from "../logger";
import { getPathFromFile } from "../utils/file.util";
import { BaseController } from "./base.controller";

export class FileController extends BaseController {
  public constructor(protected context: ExtensionContext) {
    super(context);
  }

  public async execute(): Promise<void> {
    // Implementation for file-related operations
  }

  public getActiveFile(): string {
    const editor = window.activeTextEditor;

    if (!editor) {
      Logger.error("No active text editor found.");
      throw new Error("No active text editor found.");
    }

    const { fileName } = editor.document;

    Logger.log(`Active file found: ${fileName}`);

    return fileName;
  }

  public getActiveFilePath(): string {
    const activeFile = this.getActiveFile();
    const activeFilePath = getPathFromFile(activeFile);

    Logger.log(`Active file path found: ${activeFilePath}`);

    return activeFilePath;
  }
}
