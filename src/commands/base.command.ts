import { Uri } from "vscode";
import { BaseControllerInterface } from "../controllers/base.controller";

export interface Command {
  execute(uri?: Uri): Promise<void>;
}

export abstract class BaseCommand<T extends BaseControllerInterface>
  implements Command
{
  constructor(protected controller: T) {}

  public abstract execute(uri?: Uri): Promise<void>;
}
