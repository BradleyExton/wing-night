type ResolveHostSecretRequestOptions = {
  getHostSecret: () => string | null;
  onMissingHostSecret?: () => void;
  canEmit?: () => boolean;
};

export const resolveHostSecretRequest = ({
  getHostSecret,
  onMissingHostSecret,
  canEmit
}: ResolveHostSecretRequestOptions): string | null => {
  const hostSecret = getHostSecret();

  if (!hostSecret) {
    onMissingHostSecret?.();
    return null;
  }

  if (canEmit && !canEmit()) {
    return null;
  }

  return hostSecret;
};
