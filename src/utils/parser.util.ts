import YAML from "js-yaml";

export const parseFileContent = (content: string, ext: string) => {
  try {
    switch (ext) {
      case ".json":
        return JSON.parse(content);
      case ".yaml":
      case ".yml":
        return YAML.load(content);
      case ".plaintext":
        if (content.match(/^\s*[{[]/)) {
          return JSON.parse(content);
        }

        return YAML.load(content);
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to parse content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
