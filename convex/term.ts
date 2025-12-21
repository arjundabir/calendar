import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getTerms = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return [];

		const terms = await ctx.db
			.query('terms')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		return terms;
	},
});

export const createTerm = mutation({
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

		const existingTerm = await ctx.db
			.query('terms')
			.withIndex('by_name', (q) => q.eq('termName', args.name))
			.filter((q) => q.eq(q.field('userId'), user._id))
			.unique();

		if (existingTerm) throw new Error('this term already exists');

		const userTerms = await ctx.db
			.query('terms')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();
		await Promise.all(
			userTerms
				.filter((term) => term.termName !== args.name && term.isActive)
				.map((term) => ctx.db.patch(term._id, { isActive: false })),
		);

		await ctx.db.insert('terms', {
			userId: user._id,
			termName: args.name,
			isActive: true,
		});
	},
});

export const setActiveTerm = mutation({
	args: {
		id: v.id('terms'),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error('Unauthenticated call to mutation');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) throw new Error('Unauthenticated call to mutation');

		const userTerms = await ctx.db
			.query('terms')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.collect();

		await Promise.all(
			userTerms
				.filter((term) => term._id !== args.id)
				.map((term) => ctx.db.patch(term._id, { isActive: false })),
		);

		await ctx.db.patch(args.id, { isActive: true });
	},
});

export const deleteTerm = mutation({
	args: {
		id: v.id('terms'),
	},
	handler: async (ctx, args) => {
		const user = await ctx.auth.getUserIdentity();
		if (!user) return null;

		const term = await ctx.db.get(args.id);
		if (term?.isActive) return null;

		// Delete all calendar events associated with this term
		const calendarEvents = await ctx.db
			.query('calendarEvents')
			.filter((q) => q.eq(q.field('termId'), args.id))
			.collect();

		await Promise.all(calendarEvents.map((event) => ctx.db.delete(event._id)));

		await ctx.db.delete(args.id);
	},
});

export const getActiveTerm = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.tokenIdentifier))
			.unique();
		if (!user) return null;

		const term = await ctx.db
			.query('terms')
			.withIndex('by_user', (q) => q.eq('userId', user._id))
			.filter((q) => q.eq(q.field('isActive'), true))
			.first();
		if (!term) return null;
		if (!term.sharedWith || term.sharedWith.length === 0)
			return { ...term, sharedWith: [] };

		const sharedUsers = await Promise.all(
			term.sharedWith.map((userId) => ctx.db.get(userId)),
		);
		return { ...term, sharedWith: sharedUsers };
	},
});

export const shareTerm = mutation({
	args: {
		termId: v.id('terms'),
		emails: v.array(v.id('users')),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const term = await ctx.db.get(args.termId);
		if (!term) return null;

		ctx.db.patch(args.termId, {
			sharedWith: [...(term.sharedWith ?? []), ...args.emails],
		});
	},
});

export const unshareTerm = mutation({
	args: {
		termId: v.id('terms'),
		userId: v.id('users'),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const term = await ctx.db.get(args.termId);
		if (!term) return null;

		await ctx.db.patch(args.termId, {
			sharedWith: term.sharedWith?.filter((userId) => userId !== args.userId),
		});
	},
});
