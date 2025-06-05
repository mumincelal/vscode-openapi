// biome-ignore lint/style/noNamespaceImport: <explanation>
import * as vscode from "vscode";

export const openInWebview = (commandName: string, title: string) => {
  const panel = vscode.window.createWebviewPanel(
    `vscode-openapi.${commandName}`,
    title,
    vscode.ViewColumn.Beside
  );

  panel.webview.html = getWebviewContent();
};
const getWebviewContent = () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenAPI Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    button {
      background-color: #007acc;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #005f99;
    }
    .content {
      margin-top: 20px;
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    pre {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code {
      font-family: monospace;
      color: #d63384;
    }
  </style>
</head>
<body>
  <div class="content">
    <h1>OpenAPI Preview</h1>
    <p>This is a placeholder for the OpenAPI preview.</p>
    <button id="previewButton">Preview</button>
    <pre id="output"></pre>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('previewButton').addEventListener('click', () => {
      vscode.postMessage({ command: 'preview' });
    }
    );
    window.addEventListener('message', event => {
      const message = event.data; // The JSON data that the extension sent
      switch (message.command) {
        case 'preview':
          document.getElementById('output').textContent = 'Previewing OpenAPI document...';
          break;
        default:
          console.error('Unknown command:', message.command);
      }
    }
    );
  </script>
</body>
</html>`;
};
