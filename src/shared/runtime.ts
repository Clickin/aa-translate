export const isBrowserDeployTarget = (): boolean => {
  return import.meta.env?.VITE_DEPLOY_TARGET === 'browser';
};
