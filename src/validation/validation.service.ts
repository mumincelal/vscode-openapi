import SwaggerParser from "@apidevtools/swagger-parser";
import type * as vscode from "vscode";
import { Logger } from "../logger";
import { parseFileContent } from "../utils/parser.util";
import type { ValidationError } from "./diagnostics.service";

interface ParsedSpec {
  swagger?: string;
  openapi?: string;
  info?: object;
  paths?: object;
}

export class ValidationService {
  /**
   * Validates a text document containing an OpenAPI/Swagger specification.
   * @param document - The text document to validate.
   * @returns An array of validation errors, or an empty array if valid.
   */
  async validate(document: vscode.TextDocument): Promise<ValidationError[]> {
    // Only validate JSON and YAML files
    if (!this.isValidLanguage(document.languageId)) {
      return [];
    }

    // Only validate file:// scheme documents
    if (document.uri.scheme !== "file") {
      return [];
    }

    try {
      const content = document.getText();
      const parsed = this.parseContent(content, document.languageId);

      // Check if this is an OpenAPI/Swagger document
      if (!this.isOpenApiDocument(parsed)) {
        return [];
      }

      // Pre-validation checks
      const preCheckErrors = this.preCheck(parsed);
      if (preCheckErrors.length > 0) {
        return preCheckErrors;
      }

      // Full validation using SwaggerParser
      return await this.validateWithParser(document.uri.fsPath);
    } catch (error) {
      return this.handleParseError(error);
    }
  }

  /**
   * Checks if the document language is supported for validation.
   * @param languageId - The language identifier.
   * @returns True if the language is supported.
   */
  private isValidLanguage(languageId: string): boolean {
    return ["json", "yaml", "yml", "plaintext"].includes(languageId);
  }

  /**
   * Parses the document content based on the language.
   * @param content - The document content.
   * @param languageId - The language identifier.
   * @returns The parsed content.
   */
  private parseContent(content: string, languageId: string): ParsedSpec {
    let ext: string;

    switch (languageId) {
      case "json":
        ext = ".json";
        break;
      case "yaml":
      case "yml":
        ext = ".yaml";
        break;
      default:
        ext = ".plaintext";
    }

    return parseFileContent(content, ext) as ParsedSpec;
  }

  /**
   * Checks if the parsed content is an OpenAPI/Swagger document.
   * @param parsed - The parsed content.
   * @returns True if it's an OpenAPI/Swagger document.
   */
  private isOpenApiDocument(parsed: ParsedSpec | null): boolean {
    if (!parsed || typeof parsed !== "object") {
      return false;
    }

    return !!(parsed.swagger || parsed.openapi);
  }

  /**
   * Performs pre-validation checks for common issues.
   * @param parsed - The parsed specification.
   * @returns An array of validation errors.
   */
  private preCheck(parsed: ParsedSpec): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check Swagger 2.0 version
    if (parsed.swagger && parsed.swagger !== "2.0") {
      errors.push({
        message:
          'Unrecognized Swagger version. Expected "2.0" (must be a string type)',
      });
    }

    // Check OpenAPI version (3.0.x or 3.1.x)
    if (parsed.openapi) {
      const openApiVersionRegex = /^3\.[01]\.\d+(-.+)?$/;
      if (!openApiVersionRegex.test(parsed.openapi)) {
        errors.push({
          message: `Unsupported OpenAPI version "${parsed.openapi}". Supported versions are 3.0.x and 3.1.x`,
        });
      }
    }

    // Check for required 'info' property
    if (!parsed.info) {
      errors.push({
        message: 'Missing required property "info"',
      });
    }

    // Check for required 'paths' property (OpenAPI 3.0.x and Swagger 2.0)
    // Note: paths is optional in OpenAPI 3.1.x with webhooks
    if (!parsed.paths && parsed.swagger) {
      errors.push({
        message: 'Missing required property "paths"',
      });
    }

    if (!parsed.paths && parsed.openapi?.startsWith("3.0")) {
      errors.push({
        message: 'Missing required property "paths"',
      });
    }

    return errors;
  }

  /**
   * Validates the specification using SwaggerParser.
   * @param filePath - The file path of the specification.
   * @returns An array of validation errors.
   */
  private async validateWithParser(filePath: string): Promise<ValidationError[]> {
    try {
      // Dereference and validate the spec (handles multi-file specs)
      const dereferenced = await SwaggerParser.dereference(filePath);
      await SwaggerParser.validate(dereferenced);

      Logger.info(`Validation successful for: ${filePath}`);
      return [];
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  /**
   * Handles validation errors from SwaggerParser.
   * @param error - The error from SwaggerParser.
   * @returns An array of validation errors.
   */
  private handleValidationError(error: unknown): ValidationError[] {
    if (error instanceof Error) {
      const message = error.message;
      const lineMatch = message.match(/at line (\d+)/i);
      const line = lineMatch ? Number.parseInt(lineMatch[1], 10) - 1 : undefined;

      Logger.warn(`Validation error: ${message}`);

      return [
        {
          message: message,
          line: line,
        },
      ];
    }

    return [
      {
        message: String(error),
      },
    ];
  }

  /**
   * Handles parse errors when the document cannot be parsed.
   * @param error - The parse error.
   * @returns An array of validation errors.
   */
  private handleParseError(error: unknown): ValidationError[] {
    if (error instanceof Error) {
      // Check if it's a YAML/JSON parse error
      if (error.message.includes("Failed to parse")) {
        Logger.warn(`Parse error: ${error.message}`);
        return [
          {
            message: error.message,
          },
        ];
      }
    }

    // If it's not a parse error, return empty (file might not be OpenAPI)
    return [];
  }
}
