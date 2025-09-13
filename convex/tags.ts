import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if tag already exists
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_user_and_name", (q) => 
        q.eq("userId", userId).eq("name", args.name)
      )
      .first();

    if (existing) {
      throw new Error("Tag already exists");
    }

    return await ctx.db.insert("tags", {
      name: args.name,
      color: args.color,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Tag not found or unauthorized");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Tag not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
