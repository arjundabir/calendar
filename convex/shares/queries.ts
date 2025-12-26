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

		// Build a map from calendarId to ownerId
		const calendarToOwnerMap = new Map(
			sharedCalendars.map((share) => [share.calendarId, share.ownerId]),
		);

		const calendarIds = sharedCalendars.map((share) => share.calendarId);

		const allEvents = await Promise.all(
			calendarIds.map((calendarId) =>
				ctx.db
					.query('events')
					.withIndex('by_calendar', (q) => q.eq('calendarId', calendarId))
					.collect(),
			),
		);

		// Add ownerId to each event
		return allEvents.flat().map((event) => ({
			...event,
			ownerId: calendarToOwnerMap.get(event.calendarId),
		}));
	},
});
