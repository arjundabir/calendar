import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const setShareVisibility = mutation({
	args: {
		calendarId: v.id('calendars'),
		show: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const calendar = await ctx.db.get(args.calendarId);
		if (!calendar) return null;

		const existingShare = await ctx.db
			.query('shares')
			.withIndex('by_calendar', (q) => q.eq('calendarId', args.calendarId))
			.first();

		if (existingShare) {
			await ctx.db.patch(existingShare._id, { show: args.show });
		}
	},
});

export const getSharedCalendarEvents = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return [];

		const sharedCalendars = await ctx.db
			.query('shares')
			.withIndex('by_sharedWithUser', (q) => q.eq('sharedWithUserId', user._id))
			.filter((q) => q.eq(q.field('show'), true))
			.collect();
		if (sharedCalendars.length === 0) return [];

		const calendarIds = sharedCalendars.map((share) => share.calendarId);

		const allEvents = await Promise.all(
			calendarIds.map((calendarId) =>
				ctx.db
					.query('calendarEvents')
					.filter((q) => q.eq(q.field('calendarId'), calendarId))
					.collect(),
			),
		);

		return allEvents.flat();
	},
});
