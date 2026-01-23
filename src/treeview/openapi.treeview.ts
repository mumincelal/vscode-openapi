import * as vscode from "vscode";
import { Logger } from "../logger";
import { parseFileContent } from "../utils/parser.util";

/**
 * Represents an item in the OpenAPI tree view.
 */
export class OpenApiTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly value?: unknown,
    public readonly path?: string,
    public readonly line?: number
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.iconPath = this.getIconPath();

    if (line !== undefined) {
      this.command = {
        command: "vscode-openapify.goToLine",
        title: "Go to Line",
        arguments: [line],
      };
    }
  }

  private getTooltip(): string {
    if (typeof this.value === "string" || typeof this.value === "number" || typeof this.value === "boolean") {
      return `${this.label}: ${this.value}`;
    }
    return this.path || this.label;
  }

  private getDescription(): string | undefined {
    if (typeof this.value === "string") {
      const truncated = this.value.length > 50 ? `${this.value.substring(0, 50)}...` : this.value;
      return truncated;
    }
    if (typeof this.value === "number" || typeof this.value === "boolean") {
      return String(this.value);
    }
    if (Array.isArray(this.value)) {
      return `[${this.value.length} items]`;
    }
    return undefined;
  }

  private getIconPath(): vscode.ThemeIcon {
    if (this.label === "info") {
      return new vscode.ThemeIcon("info");
    }
    if (this.label === "paths") {
      return new vscode.ThemeIcon("symbol-interface");
    }
    if (this.label === "components" || this.label === "definitions") {
      return new vscode.ThemeIcon("symbol-class");
    }
    if (this.label === "servers") {
      return new vscode.ThemeIcon("server");
    }
    if (this.label === "tags") {
      return new vscode.ThemeIcon("tag");
    }
    if (this.label === "security" || this.label === "securityDefinitions") {
      return new vscode.ThemeIcon("shield");
    }
    if (this.label === "externalDocs") {
      return new vscode.ThemeIcon("link-external");
    }
    if (this.label.startsWith("/")) {
      return new vscode.ThemeIcon("symbol-method");
    }
    if (["get", "post", "put", "delete", "patch", "options", "head", "trace"].includes(this.label.toLowerCase())) {
      return this.getHttpMethodIcon(this.label.toLowerCase());
    }
    if (this.label === "parameters") {
      return new vscode.ThemeIcon("symbol-parameter");
    }
    if (this.label === "responses") {
      return new vscode.ThemeIcon("symbol-event");
    }
    if (this.label === "requestBody") {
      return new vscode.ThemeIcon("symbol-field");
    }
    if (this.label === "schemas") {
      return new vscode.ThemeIcon("symbol-struct");
    }
    if (Array.isArray(this.value)) {
      return new vscode.ThemeIcon("symbol-array");
    }
    if (typeof this.value === "object" && this.value !== null) {
      return new vscode.ThemeIcon("symbol-object");
    }
    if (typeof this.value === "string") {
      return new vscode.ThemeIcon("symbol-string");
    }
    if (typeof this.value === "number") {
      return new vscode.ThemeIcon("symbol-number");
    }
    if (typeof this.value === "boolean") {
      return new vscode.ThemeIcon("symbol-boolean");
    }
    return new vscode.ThemeIcon("symbol-property");
  }

  private getHttpMethodIcon(method: string): vscode.ThemeIcon {
    const methodIcons: Record<string, string> = {
      get: "arrow-down",
      post: "arrow-up",
      put: "arrow-swap",
      delete: "trash",
      patch: "edit",
      options: "settings",
      head: "eye",
      trace: "debug-step-into",
    };
    return new vscode.ThemeIcon(methodIcons[method] || "symbol-method");
  }
}

/**
 * Provides data for the OpenAPI tree view.
 */
export class OpenApiTreeDataProvider implements vscode.TreeDataProvider<OpenApiTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<OpenApiTreeItem | undefined | null | void> =
    new vscode.EventEmitter<OpenApiTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<OpenApiTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private parsedSpec: Record<string, unknown> | null = null;
  private documentContent: string = "";
  private isValidSpec: boolean = false;

  constructor() {}

  /**
   * Refreshes the tree view with the current document.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Updates the tree view with a new document.
   * @param document - The text document to parse.
   */
  async updateDocument(document: vscode.TextDocument | undefined): Promise<void> {
    if (!document) {
      this.parsedSpec = null;
      this.isValidSpec = false;
      this.refresh();
      return;
    }

    // Only process JSON and YAML files
    if (!["json", "yaml", "yml", "plaintext"].includes(document.languageId)) {
      this.parsedSpec = null;
      this.isValidSpec = false;
      this.refresh();
      return;
    }

    // Only process file:// scheme
    if (document.uri.scheme !== "file") {
      this.parsedSpec = null;
      this.isValidSpec = false;
      this.refresh();
      return;
    }

    try {
      const content = document.getText();
      this.documentContent = content;

      let ext: string;
      switch (document.languageId) {
        case "json":
          ext = ".json";
          break;
        case "yaml":
        case "yml":
          ext = ".yaml";
          break;
        default:
          ext = ".plaintext";
      }

      const parsed = parseFileContent(content, ext) as Record<string, unknown>;

      // Check if it's an OpenAPI/Swagger document
      if (parsed && typeof parsed === "object" && (parsed.swagger || parsed.openapi)) {
        this.parsedSpec = parsed;
        this.isValidSpec = true;
        Logger.info(`OpenAPI tree view updated for: ${document.fileName}`);
      } else {
        this.parsedSpec = null;
        this.isValidSpec = false;
      }
    } catch (error) {
      Logger.warn(`Failed to parse document for tree view: ${error instanceof Error ? error.message : String(error)}`);
      this.parsedSpec = null;
      this.isValidSpec = false;
    }

    this.refresh();
  }

  /**
   * Gets the tree item for a given element.
   */
  getTreeItem(element: OpenApiTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Gets the children for a given element.
   */
  getChildren(element?: OpenApiTreeItem): Thenable<OpenApiTreeItem[]> {
    if (!this.isValidSpec || !this.parsedSpec) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - return top-level OpenAPI properties in a logical order
      return Promise.resolve(this.getRootItems());
    }

    // Return children of the element
    return Promise.resolve(this.getChildItems(element));
  }

  /**
   * Gets the root-level items for the tree view.
   */
  private getRootItems(): OpenApiTreeItem[] {
    if (!this.parsedSpec) {
      return [];
    }

    const items: OpenApiTreeItem[] = [];
    const orderedKeys = [
      "openapi",
      "swagger",
      "info",
      "servers",
      "paths",
      "webhooks",
      "components",
      "definitions",
      "security",
      "securityDefinitions",
      "tags",
      "externalDocs",
    ];

    // Add ordered keys first
    for (const key of orderedKeys) {
      if (key in this.parsedSpec) {
        const value = this.parsedSpec[key];
        const collapsibleState = this.getCollapsibleState(value);
        const line = this.findLineNumber(key);
        items.push(new OpenApiTreeItem(key, collapsibleState, value, key, line));
      }
    }

    // Add any remaining keys
    for (const key of Object.keys(this.parsedSpec)) {
      if (!orderedKeys.includes(key)) {
        const value = this.parsedSpec[key];
        const collapsibleState = this.getCollapsibleState(value);
        const line = this.findLineNumber(key);
        items.push(new OpenApiTreeItem(key, collapsibleState, value, key, line));
      }
    }

    return items;
  }

  /**
   * Gets child items for a given parent element.
   */
  private getChildItems(element: OpenApiTreeItem): OpenApiTreeItem[] {
    const value = element.value;

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const label = this.getArrayItemLabel(item, index);
        const collapsibleState = this.getCollapsibleState(item);
        const path = `${element.path}[${index}]`;
        const line = this.findLineNumber(path);
        return new OpenApiTreeItem(label, collapsibleState, item, path, line);
      });
    }

    if (typeof value === "object" && value !== null) {
      return Object.entries(value as Record<string, unknown>).map(([key, val]) => {
        const collapsibleState = this.getCollapsibleState(val);
        const path = element.path ? `${element.path}.${key}` : key;
        const line = this.findLineNumber(key, element.path);
        return new OpenApiTreeItem(key, collapsibleState, val, path, line);
      });
    }

    return [];
  }

  /**
   * Gets a label for an array item.
   */
  private getArrayItemLabel(item: unknown, index: number): string {
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      // Try common identifier properties
      if (obj.name) return String(obj.name);
      if (obj.operationId) return String(obj.operationId);
      if (obj.url) return String(obj.url);
      if (obj.title) return String(obj.title);
      if (obj["$ref"]) return String(obj["$ref"]);
    }
    if (typeof item === "string") {
      return item;
    }
    return `[${index}]`;
  }

  /**
   * Determines the collapsible state for a value.
   */
  private getCollapsibleState(value: unknown): vscode.TreeItemCollapsibleState {
    if (Array.isArray(value) && value.length > 0) {
      return vscode.TreeItemCollapsibleState.Collapsed;
    }
    if (typeof value === "object" && value !== null && Object.keys(value).length > 0) {
      return vscode.TreeItemCollapsibleState.Collapsed;
    }
    return vscode.TreeItemCollapsibleState.None;
  }

  /**
   * Finds the line number for a given key in the document.
   */
  private findLineNumber(key: string, parentPath?: string): number | undefined {
    if (!this.documentContent) {
      return undefined;
    }

    const lines = this.documentContent.split("\n");
    const searchKey = key.replace(/\[(\d+)\]$/, "");

    // Simple search - look for the key in the document
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match JSON format: "key":
      if (line.includes(`"${searchKey}":`)) {
        return i;
      }
      // Match YAML format: key:
      if (line.match(new RegExp(`^\\s*${searchKey}\\s*:`))) {
        return i;
      }
    }

    return undefined;
  }

  /**
   * Returns whether the current document is a valid OpenAPI spec.
   */
  get hasValidSpec(): boolean {
    return this.isValidSpec;
  }
}
