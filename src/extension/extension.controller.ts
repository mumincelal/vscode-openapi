import YAML from "js-yaml";
import * as vscode from "vscode";
import { Logger } from "../logger";
import * as OpenAPI30Schema from "../schemas/openapi-3.0.json";
import * as Swagger20Schema from "../schemas/swagger-2.0.json";

export class ExtensionController {
  public async loadRedhatExtension() {
    const extensionId = "redhat.vscode-yaml";
    const extension = vscode.extensions.getExtension(extensionId);

    if (!extension) {
      await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        extensionId
      );
      Logger.info(`Extension ${extensionId} installed.`);
    } else {
      Logger.info(`Extension ${extensionId} is already installed.`);

      if (!extension.isActive) {
        await extension.activate();
        Logger.info(`Extension ${extensionId} activated.`);
      }

      try {
        const extensionContributorId = "openapiviewer";
        extension.exports.registerContributor(
          extensionContributorId,
          (uri: string) => {
            for (const document of vscode.workspace.textDocuments) {
              if (document.uri.toString() === uri.toString()) {
                const yaml = YAML.load(document.getText()) as {
                  swagger?: string;
                  openapi?: string;
                };

                if (yaml) {
                  Logger.info(`YAML content parsed from ${uri.toString()}`);
                  if (yaml.swagger === "2.0") {
                    return `${extensionContributorId}:swagger`;
                  }

                  if (yaml.openapi?.match(/^3\.0\.\d(-.+)?$/)) {
                    return `${extensionContributorId}:openapi`;
                  }
                }
              }
            }

            return null;
          },
          (uri: string) => {
            if (uri === `${extensionContributorId}:swagger`) {
              return JSON.stringify(Swagger20Schema);
            }

            if (uri === `${extensionContributorId}:openapi`) {
              return JSON.stringify(OpenAPI30Schema);
            }
            return null;
          }
        );
      } catch (error) {
        Logger.error(`Failed to activate extension ${extensionId}: ${error}`);
      }
    }
  }
}
