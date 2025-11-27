import { QRCodeSVG } from 'qrcode.react';

interface RoomCodeProps {
  code: string;
  showQR?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RoomCode({ code, showQR = false, size = 'md' }: RoomCodeProps) {
  const joinUrl = `${window.location.origin}/play/${code}`;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const qrSizes = {
    sm: 80,
    md: 120,
    lg: 180,
  };

  return (
    <div className="flex items-center gap-4">
      {showQR && (
        <div className="bg-white p-2 rounded-lg">
          <QRCodeSVG value={joinUrl} size={qrSizes[size]} />
        </div>
      )}
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Room Code</div>
        <div className={`font-mono font-bold ${sizeClasses[size]} tracking-widest neon-glow`}>
          {code}
        </div>
      </div>
    </div>
  );
}
