import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { calendarEventValidator } from './calendar';
import type { Id } from './_generated/dataModel';

const localTermValidator = v.object({
	userId: v.id('users'),
	termName: v.string(),
	isActive: v.boolean(),
});

const localCalendarEventValidator = calendarEventValidator
	.extend({
		termName: v.string(),
	})
	.omit('userId');

export const store = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Called storeUser without authentication present');
		}

		// Check if we've already stored this identity before.
		// Note: If you don't want to define an index right away, you can use
		// ctx.db.query("users")
		//  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
		//  .unique();
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (user !== null) {
			// If we've seen this identity before but the name has changed, patch the value.
			if (user.name !== identity.name) {
				await ctx.db.patch(user._id, { name: identity.name });
			}
			return user._id;
		}
		// If it's a new identity, create a new `User`.
		return await ctx.db.insert('users', {
			name: identity.name ?? 'Anonymous',
			email: identity.email!,
			pictureUrl: identity.pictureUrl!,
			clerkId: identity.tokenIdentifier,
		});
	},
});

export const getUser = query({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query('users')
			.filter((q) => q.eq(q.field('email'), args.email))
			.first();
		return user;
	},
});
