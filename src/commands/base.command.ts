import { Uri } from "vscode";
import { BaseServiceType } from "../controllers/base.controller";
import { Command } from "../types";

export abstract class BaseCommand<T extends BaseServiceType>
  implements Command
{
  constructor(protected service: T) {}

  public abstract execute(uri?: Uri): Promise<void>;

  protected async executeService(): Promise<void> {
    await this.service.execute();
  }
}
