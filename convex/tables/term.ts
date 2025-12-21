import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const termsTable = defineTable({
	userId: v.id('users'),
	termName: v.string(),
	isActive: v.boolean(),
	sharedWith: v.optional(v.array(v.id('users'))),
})
	.index('by_user', ['userId'])
	.index('by_name', ['termName']);
