import { Uri } from "vscode";
import { BaseServiceType } from "../services/base-service";
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
