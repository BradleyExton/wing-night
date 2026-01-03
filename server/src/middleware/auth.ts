import { clerkMiddleware, getAuth, clerkClient } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';

// Extend Express Request to include auth and user
declare global {
  namespace Express {
    interface Request {
      dbUser?: {
        id: string;
        clerkId: string;
        email: string;
        name: string | null;
        imageUrl: string | null;
      };
    }
  }
}

// Base Clerk middleware - adds auth to all requests
export const clerkAuth = clerkMiddleware();

// Require authentication - returns 401 JSON error for API routes (not redirect)
export function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// Sync Clerk user to database and attach to request
export async function syncUserToDb(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return next();
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    // If user doesn't exist, fetch from Clerk API and create
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          user = await prisma.user.upsert({
            where: { clerkId: auth.userId },
            update: {
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              imageUrl: clerkUser.imageUrl || null,
            },
            create: {
              clerkId: auth.userId,
              email: email,
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
              imageUrl: clerkUser.imageUrl || null,
            },
          });
        }
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError);
      }
    }

    if (user) {
      req.dbUser = user;
    }

    next();
  } catch (error) {
    console.error('Error syncing user:', error);
    next();
  }
}

// Combined middleware: require auth + sync user
export const authenticatedUser = [requireAuthentication, syncUserToDb];

// Optional auth: sync user if authenticated, but don't require it
export const optionalAuth = [clerkAuth, syncUserToDb];
