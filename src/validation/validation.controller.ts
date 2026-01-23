import * as vscode from "vscode";
import { Logger } from "../logger";
import { DiagnosticsService } from "./diagnostics.service";
import { ValidationService } from "./validation.service";

export class ValidationController {
  private readonly validationService: ValidationService;
  private readonly diagnosticsService: DiagnosticsService;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.validationService = new ValidationService();
    this.diagnosticsService = new DiagnosticsService();

    this.registerEventListeners(context);
    this.validateActiveDocument();
  }

  /**
   * Registers event listeners for document changes.
   * @param context - The extension context.
   */
  private registerEventListeners(context: vscode.ExtensionContext): void {
    // Validate on active editor change
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(
      async (editor) => {
        if (editor) {
          await this.validateDocument(editor.document);
        }
      }
    );

    // Validate on document save
    const saveDisposable = vscode.workspace.onDidSaveTextDocument(
      async (document) => {
        await this.validateDocument(document);
      }
    );

    // Validate on document change (with debounce)
    let changeTimeout: ReturnType<typeof setTimeout> | undefined;
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(
      async (event) => {
        // Clear previous timeout
        if (changeTimeout) {
          clearTimeout(changeTimeout);
        }

        // Debounce validation to avoid excessive calls during typing
        changeTimeout = setTimeout(async () => {
          await this.validateDocument(event.document);
        }, 500);
      }
    );

    // Clear diagnostics when document is closed
    const closeDisposable = vscode.workspace.onDidCloseTextDocument(
      (document) => {
        this.diagnosticsService.clearDiagnostics(document.uri);
      }
    );

    // Register disposables
    this.disposables.push(
      activeEditorDisposable,
      saveDisposable,
      changeDisposable,
      closeDisposable
    );

    context.subscriptions.push(...this.disposables);
    context.subscriptions.push(this.diagnosticsService);
  }

  /**
   * Validates the currently active document.
   */
  private async validateActiveDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await this.validateDocument(editor.document);
    }
  }

  /**
   * Validates a text document and updates diagnostics.
   * @param document - The text document to validate.
   */
  private async validateDocument(document: vscode.TextDocument): Promise<void> {
    try {
      const errors = await this.validationService.validate(document);
      this.diagnosticsService.updateDiagnostics(document, errors);

      if (errors.length > 0) {
        Logger.info(
          `Found ${errors.length} validation error(s) in ${document.fileName}`
        );
      }
    } catch (error) {
      Logger.error(
        `Validation failed for ${document.fileName}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Disposes of the controller and its resources.
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.diagnosticsService.dispose();
  }
}
