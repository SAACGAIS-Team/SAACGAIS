export const ROLE_UPDATE_EVENT = 'userRolesUpdated';

export const triggerRoleUpdate = () => {
  window.dispatchEvent(new CustomEvent(ROLE_UPDATE_EVENT));
};

export const listenForRoleUpdates = (callback) => {
  window.addEventListener(ROLE_UPDATE_EVENT, callback);
  return () => window.removeEventListener(ROLE_UPDATE_EVENT, callback);
};