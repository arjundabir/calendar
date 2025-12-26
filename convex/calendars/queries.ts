import { query } from '../_generated/server';

export const getCalendars = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return [];

		const calendars = await ctx.db
			.query('calendars')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		return calendars;
	},
});

export const getActiveCalendar = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return null;

		const calendar = await ctx.db
			.query('calendars')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.filter((q) => q.eq(q.field('isActive'), true))
			.first();
		if (!calendar) return null;

		const shares = await ctx.db
			.query('shares')
			.withIndex('by_calendar', (q) => q.eq('calendarId', calendar._id))
			.collect();

		if (shares.length === 0) return { ...calendar, sharedWith: [] };

		const sharedUsers = await Promise.all(
			shares.map((share) => ctx.db.get(share.sharedWithUserId)),
		);
		return { ...calendar, sharedWith: sharedUsers.filter(Boolean) };
	},
});

export const getCalendarsSharedWithMe = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return [];

		// Find all shares where current user is the recipient
		const shares = await ctx.db
			.query('shares')
			.withIndex('by_sharedWithUser', (q) => q.eq('sharedWithUserId', user._id))
			.collect();

		if (shares.length === 0) return [];

		// Get the calendars and their owners
		const calendarsWithOwners = await Promise.all(
			shares.map(async (share) => {
				const calendar = await ctx.db.get(share.calendarId);
				const owner = await ctx.db.get(share.ownerId);
				if (!calendar || !owner) return null;
				return { calendar, owner, show: share.show };
			}),
		);

		return calendarsWithOwners.filter(
			(
				item,
			): item is {
				calendar: NonNullable<typeof item>['calendar'];
				owner: NonNullable<typeof item>['owner'];
				show: NonNullable<typeof item>['show'];
			} => item !== null,
		);
	},
});
