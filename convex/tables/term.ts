import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const termsTable = defineTable({
	userId: v.id('users'),
	termName: v.string(),
	isActive: v.boolean(),
})
	.index('by_user', ['userId'])
	.index('by_name', ['termName']);
