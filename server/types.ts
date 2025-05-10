import { Request } from 'express';
import { User } from '@shared/schema';

// Express extends Request type to include user property
// This is already handled by the declaration in auth.ts
// where the User interface is extended from SelectUser

// Helper function to ensure user is present and return their ID
export function getUserId(req: Request): number {
  const userId = req.user?.id;
  if (userId === undefined) {
    throw new Error('User ID not found in request');
  }
  return userId;
}

// Helper function to safely get user ID, returning undefined if not present
export function safeGetUserId(req: Request): number | undefined {
  return req.user?.id;
}