export const getPathFromFile = (filePath: string): string => {
  let path = filePath.substring(0, filePath.lastIndexOf("\\"));

  if (!path) {
    path = filePath.substring(0, filePath.lastIndexOf("/"));
  }

  return path;
};
