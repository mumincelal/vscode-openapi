import * as vscode from "vscode";
import { Logger } from "../logger";
import { OpenApiTreeDataProvider } from "./openapi.treeview";

/**
 * Controller for managing the OpenAPI tree view.
 */
export class TreeViewController {
  private readonly treeDataProvider: OpenApiTreeDataProvider;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new OpenApiTreeDataProvider();

    // Register the tree view
    const treeView = vscode.window.createTreeView("openapiExplorer", {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: true,
    });

    // Register the "Go to Line" command
    const goToLineCommand = vscode.commands.registerCommand(
      "vscode-openapify.goToLine",
      (line: number) => this.goToLine(line)
    );

    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand(
      "vscode-openapify.refreshTreeView",
      () => this.refresh()
    );

    // Register event listeners
    this.registerEventListeners(context);

    // Update with current active document
    this.updateActiveDocument();

    // Add disposables
    this.disposables.push(treeView, goToLineCommand, refreshCommand);
    context.subscriptions.push(...this.disposables);

    Logger.info("OpenAPI Tree View initialized");
  }

  /**
   * Registers event listeners for document changes.
   */
  private registerEventListeners(context: vscode.ExtensionContext): void {
    // Update tree view when active editor changes
    const activeEditorDisposable = vscode.window.onDidChangeActiveTextEditor(
      async (editor) => {
        await this.treeDataProvider.updateDocument(editor?.document);
      }
    );

    // Update tree view when document is saved
    const saveDisposable = vscode.workspace.onDidSaveTextDocument(
      async (document) => {
        if (vscode.window.activeTextEditor?.document === document) {
          await this.treeDataProvider.updateDocument(document);
        }
      }
    );

    // Update tree view when document changes (with debounce)
    let changeTimeout: ReturnType<typeof setTimeout> | undefined;
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(
      async (event) => {
        if (vscode.window.activeTextEditor?.document === event.document) {
          if (changeTimeout) {
            clearTimeout(changeTimeout);
          }
          changeTimeout = setTimeout(async () => {
            await this.treeDataProvider.updateDocument(event.document);
          }, 500);
        }
      }
    );

    // Clear tree view when document is closed
    const closeDisposable = vscode.workspace.onDidCloseTextDocument(
      async (document) => {
        if (vscode.window.activeTextEditor?.document === document) {
          await this.treeDataProvider.updateDocument(undefined);
        }
      }
    );

    this.disposables.push(
      activeEditorDisposable,
      saveDisposable,
      changeDisposable,
      closeDisposable
    );
  }

  /**
   * Updates the tree view with the currently active document.
   */
  private async updateActiveDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    await this.treeDataProvider.updateDocument(editor?.document);
  }

  /**
   * Navigates to a specific line in the active editor.
   */
  private goToLine(line: number): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const position = new vscode.Position(line, 0);
      const selection = new vscode.Selection(position, position);
      editor.selection = selection;
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }

  /**
   * Refreshes the tree view manually.
   */
  private async refresh(): Promise<void> {
    await this.updateActiveDocument();
  }

  /**
   * Disposes of the controller and its resources.
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
