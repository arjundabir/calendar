import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { eventValidator } from './validators';

export const createCalendarEvent = mutation({
	args: {
		event: eventValidator.extend({
			calendarId: v.id('calendars'),
		}),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated call to mutation');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error('Unauthenticated call to mutation');

		// Extract calendarId from event and remove it from the nested event object
		const { calendarId, ...eventData } = args.event;

		const id = await ctx.db.insert('events', {
			userId: user._id,
			calendarId,
			event: eventData,
		});
		return id;
	},
});

export const deleteCalendarEvent = mutation({
	args: {
		sectionCode: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) throw new Error('no user detected');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();

		if (!user) throw new Error('no user detected');

		// Query events by user, then filter by sectionCode in the nested event object
		const events = await ctx.db
			.query('events')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		const eventToDelete = events.find(
			(e) => e.event.sectionCode === args.sectionCode,
		);

		if (eventToDelete) {
			await ctx.db.delete(eventToDelete._id);
		}
	},
});
