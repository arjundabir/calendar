import { query } from '../_generated/server';

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
