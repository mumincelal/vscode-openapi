import { PreviewController } from "../controllers/preview.controller";
import { BaseCommand } from "./base.command";

export class PreviewCommand extends BaseCommand<PreviewController> {
  constructor(service: PreviewController) {
    super(service);
  }

  public async execute(): Promise<void> {
    await this.service.execute();
  }
}
