export const ensureSlash = (url: string | undefined): string => {
  return url?.endsWith('/') ? url : `${url}/`;
};
