let hasManualSignOutIntent = false;

export const markManualSignOutIntent = () => {
  hasManualSignOutIntent = true;
};

export const consumeManualSignOutIntent = () => {
  const hadIntent = hasManualSignOutIntent;
  hasManualSignOutIntent = false;
  return hadIntent;
};
