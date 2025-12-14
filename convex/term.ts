import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getTerms = query({
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return [];

    const terms = await ctx.db
      .query('terms')
      .withIndex('by_user', (q) => q.eq('userId', user.subject))
      .collect();

    return terms;
  },
});

export const createTerm = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    const existingTerm = await ctx.db
      .query('terms')
      .withIndex('by_name', (q) => q.eq('termName', args.name))
      .filter((q) => q.eq(q.field('userId'), user.subject))
      .unique();

    if (existingTerm) throw new Error('this term already exists');

    const userTerms = await ctx.db
      .query('terms')
      .withIndex('by_user', (q) => q.eq('userId', user.subject))
      .collect();
    await Promise.all(
      userTerms
        .filter((term) => term.termName !== args.name && term.isActive)
        .map((term) => ctx.db.patch(term._id, { isActive: false }))
    );

    await ctx.db.insert('terms', {
      userId: user.subject,
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
    const user = await ctx.auth.getUserIdentity();
    if (!user) return null;

    const userTerms = await ctx.db
      .query('terms')
      .withIndex('by_user', (q) => q.eq('userId', user.subject))
      .collect();

    await Promise.all(
      userTerms
        .filter((term) => term._id !== args.id)
        .map((term) => ctx.db.patch(term._id, { isActive: false }))
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

    await ctx.db.delete(args.id);
  },
});
