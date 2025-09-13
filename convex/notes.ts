import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      notes.map(async (note) => {
        let imageIds = note.imageIds ?? [];
        if ((!imageIds || imageIds.length === 0) && note.imageId) {
          imageIds = [note.imageId];
        }
        return {
          _id: note._id,
          _creationTime: note._creationTime,
          title: note.title ?? "",
          description: note.description ?? "",
          content: note.content,
          tags: note.tags,
          imageIds,
          imageUrls: imageIds.length > 0 ? await Promise.all(imageIds.map((id: any) => ctx.storage.getUrl(id))) : [],
          userId: note.userId,
        };
      })
    );
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (!args.query.trim()) {
      const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      notes.map(async (note) => {
        let imageIds = note.imageIds ?? [];
        if ((!imageIds || imageIds.length === 0) && note.imageId) {
          imageIds = [note.imageId];
        }
        return {
          _id: note._id,
          _creationTime: note._creationTime,
          title: note.title ?? "",
          description: note.description ?? "",
          content: note.content,
          tags: note.tags,
          imageIds,
          imageUrls: imageIds.length > 0 ? await Promise.all(imageIds.map((id: any) => ctx.storage.getUrl(id))) : [],
          userId: note.userId,
        };
      })
    );
    }

    const notes = await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.query).eq("userId", userId)
      )
      .collect();

    return Promise.all(
      notes.map(async (note) => {
        let imageIds = note.imageIds ?? [];
        if ((!imageIds || imageIds.length === 0) && note.imageId) {
          imageIds = [note.imageId];
        }
        return {
          ...note,
          imageIds,
          imageUrls: imageIds.length > 0 ? await Promise.all(imageIds.map((id: any) => ctx.storage.getUrl(id))) : [],
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    tags: v.array(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("notes", {
      title: args.title,
      description: args.description ?? "",
      content: args.content,
      tags: args.tags,
      imageIds: args.imageIds ?? [],
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    tags: v.array(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    return await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description ?? "",
      content: args.content,
      tags: args.tags,
      imageIds: args.imageIds ?? [],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});
