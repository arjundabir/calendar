import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const sharesTable = defineTable({
	termId: v.id('terms'),
	sharedWithUserId: v.id('users'),
	ownerId: v.id('users'),
	show: v.boolean(),
})
	.index('by_sharedWithUser', ['sharedWithUserId'])
	.index('by_term', ['termId']);
