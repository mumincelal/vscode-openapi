import { window } from "vscode";

export class Logger {
  private static readonly instance =
    window.createOutputChannel("VsCode OpenAPI");

  private constructor() {}

  public static log(message: string): void {
    Logger.instance.appendLine(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  public static error(message: string): void {
    Logger.instance.appendLine(
      `[ERROR] ${new Date().toISOString()}: ${message}`
    );
  }

  public static info(message: string): void {
    Logger.instance.appendLine(
      `[INFO] ${new Date().toISOString()}: ${message}`
    );
  }

  public static warn(message: string): void {
    Logger.instance.appendLine(
      `[WARN] ${new Date().toISOString()}: ${message}`
    );
  }
}
