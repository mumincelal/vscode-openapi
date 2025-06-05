import { PreviewService } from "../services/preview.service";
import { BaseCommand } from "./base.command";

export class PreviewCommand extends BaseCommand<PreviewService> {
  constructor(service: PreviewService) {
    super(service);
  }

  public async execute(): Promise<void> {
    await this.service.execute();
  }
}
