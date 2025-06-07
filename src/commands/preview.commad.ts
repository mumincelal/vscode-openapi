import { PreviewController } from "../controllers/preview.controller";
import { BaseCommand } from "./base.command";

export class PreviewCommand extends BaseCommand<PreviewController> {
  constructor(controller: PreviewController) {
    super(controller);
  }

  public async execute(): Promise<void> {
    await this.controller.execute();
  }
}
