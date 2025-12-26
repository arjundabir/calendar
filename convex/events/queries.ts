import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getUserEvents = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();

		if (!user) return [];

		// Get the active calendar (there will always be only 1 active calendar)
		const activeCalendar = await ctx.db
			.query('calendars')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.filter((q) => q.eq(q.field('isActive'), true))
			.first();

		if (!activeCalendar) return [];

		// Query events using by_calendar index
		const events = await ctx.db
			.query('events')
			.withIndex('by_calendar', (q) => q.eq('calendarId', activeCalendar._id))
			.collect();

		return events;
	},
});

export const getCalendarEventsByCalendarIds = query({
	args: {
		calendarIds: v.array(v.id('calendars')),
	},
	handler: async (ctx, args) => {
		if (args.calendarIds.length === 0) return [];

		const allEvents = await Promise.all(
			args.calendarIds.map((calendarId) =>
				ctx.db
					.query('events')
					.withIndex('by_calendar', (q) => q.eq('calendarId', calendarId))
					.collect(),
			),
		);

		return allEvents.flat();
	},
});
