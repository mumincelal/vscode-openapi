import * as vscode from "vscode";

const API_KEYWORDS = ["swagger", '"swagger"', "openapi", '"openapi"'];

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
}

export class DiagnosticsService {
  private readonly diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(
      "openapi-validator"
    );
  }

  /**
   * Updates the diagnostics for a document based on validation errors.
   * @param document - The text document to update diagnostics for.
   * @param errors - The validation errors to display.
   */
  updateDiagnostics(
    document: vscode.TextDocument,
    errors: ValidationError[]
  ): void {
    if (errors.length === 0) {
      this.clearDiagnostics(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = errors.map((error) =>
      this.createDiagnostic(document, error)
    );

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Clears diagnostics for a specific document.
   * @param uri - The URI of the document to clear diagnostics for.
   */
  clearDiagnostics(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  /**
   * Clears all diagnostics.
   */
  clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Creates a diagnostic from a validation error.
   * @param document - The text document.
   * @param error - The validation error.
   * @returns A VS Code diagnostic.
   */
  private createDiagnostic(
    document: vscode.TextDocument,
    error: ValidationError
  ): vscode.Diagnostic {
    let range: vscode.Range;

    if (error.line !== undefined && error.line >= 0) {
      // Use the specific line from the error
      const lineIndex = Math.min(error.line, document.lineCount - 1);
      const lineText = document.lineAt(lineIndex);
      const column = error.column ?? 0;
      range = new vscode.Range(
        lineIndex,
        column,
        lineIndex,
        lineText.text.length
      );
    } else {
      // Find the swagger/openapi keyword line to show the error
      range = this.findApiKeywordRange(document);
    }

    const diagnostic = new vscode.Diagnostic(
      range,
      error.message,
      vscode.DiagnosticSeverity.Error
    );

    diagnostic.source = "OpenAPI Validator";
    diagnostic.code = "openapi-validation";

    return diagnostic;
  }

  /**
   * Finds the range of the swagger/openapi keyword in the document.
   * @param document - The text document to search.
   * @returns The range of the keyword or the first line.
   */
  private findApiKeywordRange(document: vscode.TextDocument): vscode.Range {
    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
      const lineText = document.lineAt(lineIndex);

      for (const keyword of API_KEYWORDS) {
        const index = lineText.text.indexOf(keyword);
        if (index !== -1) {
          return new vscode.Range(
            lineIndex,
            index,
            lineIndex,
            index + keyword.length
          );
        }
      }
    }

    // Default to the first line if no keyword found
    return new vscode.Range(0, 0, 0, document.lineAt(0).text.length);
  }

  /**
   * Disposes of the diagnostic collection.
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
