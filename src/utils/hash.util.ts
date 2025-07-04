export const hashString = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash += Math.pow(data.charCodeAt(i) * 31, data.length - i);
    hash = hash & hash;
  }
  return hash.toString();
};
