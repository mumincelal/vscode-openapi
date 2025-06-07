import { ExtensionContext } from "vscode";

export interface BaseControllerInterface {
  execute: () => Promise<void>;
}

export abstract class BaseController implements BaseControllerInterface {
  constructor(protected context: ExtensionContext) {}

  public abstract execute(): Promise<void>;
}
