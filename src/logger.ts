import { OutputChannel, window } from "vscode";

export class Logger {
  private static readonly instance =
    window.createOutputChannel("VsCode OpenAPI");

  private constructor() {}

  public static log(message: string): void {
    Logger.instance.appendLine(`[log] ${message}`);
  }

  public static error(message: string): void {
    Logger.instance.appendLine(`[error] ${message}`);
  }

  public static warn(message: string): void {
    Logger.instance.appendLine(`[warn] ${message}`);
  }
}
