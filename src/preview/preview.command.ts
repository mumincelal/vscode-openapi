import { Uri } from "vscode";
import { BaseCommand } from "../base/base.command";
import { PreviewController } from "./preview.controller";

export class PreviewCommand extends BaseCommand<PreviewController> {
  constructor(controller: PreviewController) {
    super(controller);
  }
}
