import { v } from 'convex/values';
import { mutation } from '../_generated/server';

export const createCalendar = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated call to mutation');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error('Unauthenticated call to mutation');

		const existingCalendar = await ctx.db
			.query('calendars')
			.withIndex('by_name', (q) => q.eq('calendarName', args.name))
			.filter((q) => q.eq(q.field('userId'), user._id))
			.unique();

		if (existingCalendar) throw new Error('this calendar already exists');

		const userCalendars = await ctx.db
			.query('calendars')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();
		await Promise.all(
			userCalendars
				.filter(
					(calendar) =>
						calendar.calendarName !== args.name && calendar.isActive,
				)
				.map((calendar) => ctx.db.patch(calendar._id, { isActive: false })),
		);

		await ctx.db.insert('calendars', {
			userId: user._id,
			calendarName: args.name,
			isActive: true,
		});
	},
});

export const setActiveCalendar = mutation({
	args: {
		id: v.id('calendars'),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated call to mutation');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error('Unauthenticated call to mutation');

		const userCalendars = await ctx.db
			.query('calendars')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		await Promise.all(
			userCalendars
				.filter((calendar) => calendar._id !== args.id)
				.map((calendar) => ctx.db.patch(calendar._id, { isActive: false })),
		);

		await ctx.db.patch(args.id, { isActive: true });
	},
});

export const deleteCalendar = mutation({
	args: {
		id: v.id('calendars'),
	},
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) return null;

		const calendar = await ctx.db.get(args.id);
		if (calendar?.isActive) return null;

		// Delete all calendar events associated with this calendar
		const calendarEvents = await ctx.db
			.query('calendarEvents')
			.filter((q) => q.eq(q.field('calendarId'), args.id))
			.collect();

		await Promise.all(calendarEvents.map((event) => ctx.db.delete(event._id)));

		const shares = await ctx.db
			.query('shares')
			.withIndex('by_calendar', (q) => q.eq('calendarId', args.id))
			.collect();

		await Promise.all(shares.map((share) => ctx.db.delete(share._id)));

		await ctx.db.delete(args.id);
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
