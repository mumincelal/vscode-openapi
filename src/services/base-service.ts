import { ExtensionContext } from "vscode";

export type BaseServiceType = {
  execute: () => Promise<void>;
};

export abstract class BaseService implements BaseServiceType {
  constructor(protected context: ExtensionContext) {}

  public abstract execute(): Promise<void>;
}
