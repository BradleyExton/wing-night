import prisma from './prisma.js';

const THEMATIC_CODES = [
  'FIRE', 'HEAT', 'BURN', 'SPCY', 'WING', 'BLAZ', 'SCOV',
  'PIKA', 'ZEST', 'KICK', 'MILD', 'BOMB', 'VOLT', 'FURY',
  'SEAR', 'CHAR', 'GLOW', 'ZING', 'SNAP', 'BOOM', 'FLAM',
  'HOTS', 'PPRR', 'CHLI', 'SZZL', 'HAWK', 'TUAH'
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function generateRoomCode(): Promise<string> {
  // Try thematic codes first
  const shuffledCodes = shuffleArray(THEMATIC_CODES);
  for (const code of shuffledCodes) {
    const exists = await prisma.room.findUnique({ where: { code } });
    if (!exists) return code;
  }

  // Fall back to random 4-letter code
  for (let attempts = 0; attempts < 100; attempts++) {
    const code = generateRandomCode(4);
    const exists = await prisma.room.findUnique({ where: { code } });
    if (!exists) return code;
  }

  throw new Error('Failed to generate unique room code');
}

export function generateEditCode(): string {
  return generateRandomCode(12);
}

export function generateSessionId(): string {
  return generateRandomCode(16);
}
