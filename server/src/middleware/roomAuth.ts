import type { Request, Response, NextFunction } from 'express';
import type { Room } from '@prisma/client';
import prisma from '../lib/prisma.js';

declare global {
  namespace Express {
    interface Request {
      room?: Room;
    }
  }
}

export function getEditCodeFromRequest(req: Request): string | null {
  const header = req.get('x-edit-code');
  if (header && typeof header === 'string') return header;

  const query = req.query.editCode;
  if (typeof query === 'string' && query.trim()) return query;

  return null;
}

export function isRoomHostOrEditCode(req: Request, room: Room): boolean {
  const editCode = getEditCodeFromRequest(req);
  const isEditCodeValid = !!editCode && editCode === room.editCode;
  const isHostUser = !!req.dbUser && !!room.hostUserId && req.dbUser.id === room.hostUserId;

  return isEditCodeValid || isHostUser;
}

export async function requireRoomHostOrEditCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Room code required' });
    }

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!isRoomHostOrEditCode(req, room)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.room = room;
    next();
  } catch (error) {
    console.error('Room auth error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
}
