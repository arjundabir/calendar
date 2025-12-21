import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const setShareVisibility = mutation({
	args: {
		termId: v.id('terms'),
		show: v.boolean(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const term = await ctx.db.get(args.termId);
		if (!term) return null;

		const existingShare = await ctx.db
			.query('shares')
			.withIndex('by_term', (q) => q.eq('termId', args.termId))
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

		const sharedTerms = await ctx.db
			.query('shares')
			.withIndex('by_sharedWithUser', (q) => q.eq('sharedWithUserId', user._id))
			.filter((q) => q.eq(q.field('show'), true))
			.collect();
		if (sharedTerms.length === 0) return [];

		const termIds = sharedTerms.map((share) => share.termId);

		const allEvents = await Promise.all(
			termIds.map((termId) =>
				ctx.db
					.query('calendarEvents')
					.filter((q) => q.eq(q.field('termId'), termId))
					.collect(),
			),
		);

		return allEvents.flat();
	},
});
