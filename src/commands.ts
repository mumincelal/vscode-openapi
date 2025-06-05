// biome-ignore lint/style/noNamespaceImport: <explanation>
import * as vscode from "vscode";

export const preview = async (uri?: vscode.Uri) => {
  let currentUri = uri;
  console.log("🚀 ~ preview ~ currentUri:", currentUri);

  if (!currentUri) {
    const editor = vscode.window.activeTextEditor;
    console.log("🚀 ~ preview ~ editor:", editor);
    if (!editor) {
      throw new Error("No active text editor found.");
    }
    currentUri = editor.document.uri;
  }

  const document = await vscode.workspace.openTextDocument(currentUri);
  console.log("🚀 ~ preview ~ document:", document);
  if (document.languageId !== "yaml" && document.languageId !== "json") {
    throw new Error(
      "Unsupported file type. Only YAML and JSON files are supported."
    );
  }

  // Here you would implement the logic to preview the OpenAPI document.
  // For example, you could use a webview to display the rendered OpenAPI spec.
  console.log(`Previewing OpenAPI document: ${document.fileName}`);
};
