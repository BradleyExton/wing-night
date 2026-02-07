export function getConnectionStatus(isConnected: boolean): {
  label: string;
  containerClass: string;
  dotClass: string;
} {
  return {
    label: isConnected ? 'Connected' : 'Reconnecting...',
    containerClass: isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400',
    dotClass: isConnected ? 'bg-green-500' : 'bg-red-500',
  };
}
