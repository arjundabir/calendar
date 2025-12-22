import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const calendarsTable = defineTable({
	userId: v.id('users'),
	calendarName: v.string(),
	isActive: v.boolean(),
})
	.index('by_user', ['userId'])
	.index('by_name', ['calendarName']);
