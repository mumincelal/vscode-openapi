import { Uri } from "vscode";

export type Command = {
  execute(uri?: Uri): Promise<void>;
};
