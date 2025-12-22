import { v } from 'convex/values';
import { mutation } from '../_generated/server';

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

export const shareCalendar = mutation({
	args: {
		calendarId: v.id('calendars'),
		emails: v.array(v.id('users')),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const calendar = await ctx.db.get(args.calendarId);
		if (!calendar) return null;

		const existingShares = await ctx.db
			.query('shares')
			.withIndex('by_calendar', (q) => q.eq('calendarId', args.calendarId))
			.collect();

		const existingUserIds = new Set(
			existingShares.map((share) => share.sharedWithUserId),
		);

		await Promise.all(
			args.emails
				.filter((userId) => !existingUserIds.has(userId))
				.map((userId) =>
					ctx.db.insert('shares', {
						calendarId: args.calendarId,
						sharedWithUserId: userId,
						ownerId: calendar.userId,
						show: false,
					}),
				),
		);
	},
});

export const unshareCalendar = mutation({
	args: {
		calendarId: v.id('calendars'),
		userId: v.id('users'),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const calendar = await ctx.db.get(args.calendarId);
		if (!calendar) return null;

		const share = await ctx.db
			.query('shares')
			.withIndex('by_calendar', (q) => q.eq('calendarId', args.calendarId))
			.filter((q) => q.eq(q.field('sharedWithUserId'), args.userId))
			.first();

		if (share) {
			await ctx.db.delete(share._id);
		}
	},
});
