export const openInviteModal = () => {
  window.dispatchEvent(new Event('invite:open'));
};

export const closeInviteModal = () => {
  window.dispatchEvent(new Event('invite:close'));
};
