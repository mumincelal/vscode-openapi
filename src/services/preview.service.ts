import { ExtensionContext } from "vscode";
import { BaseService } from "./base-service";
import { InitializeService } from "./initialize.service";

export class PreviewService extends BaseService {
  constructor(context: ExtensionContext) {
    super(context);
    const initializeService = new InitializeService(context.extensionPath);
    initializeService.start();
  }

  public async execute(): Promise<void> {}
}
