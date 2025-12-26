import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { eventValidator } from '../events/validators';

export const eventsTable = defineTable({
	userId: v.id('users'),
	calendarId: v.id('calendars'),
	event: eventValidator,
})
	.index('by_user', ['userId'])
	.index('by_calendar', ['calendarId']);
