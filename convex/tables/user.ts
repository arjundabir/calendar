import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usersTable = defineTable({
  name: v.string(),
  clerkId: v.string(),
}).index('by_clerkId', ['clerkId']);
