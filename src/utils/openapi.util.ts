import refParser, {
  type JSONSchema
} from "@apidevtools/json-schema-ref-parser";
import { Logger } from "../logger";

export const bundle = async (file: string): Promise<JSONSchema> => {
  try {
    const schema = await refParser.dereference(file, {
      mutateInputSchema: false
    });

    return schema;
  } catch (error) {
    Logger.error(`Error bundling schema: ${error}`);
    throw error;
  }
};
