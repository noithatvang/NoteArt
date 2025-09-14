import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Add AI-generated image to a note
export const addAiImageToNote = mutation({
  args: {
    noteId: v.id("notes"),
    imageUrl: v.string(),
    prompt: v.string(),
    provider: v.string(),
    metadata: v.optional(v.object({
      size: v.optional(v.string()),
      quality: v.optional(v.string()),
      style: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { noteId, imageUrl, prompt, provider, metadata }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Verify user owns the note
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    // Create AI image object
    const aiImage = {
      url: imageUrl,
      prompt: prompt,
      generatedAt: new Date().toISOString(),
      provider: provider,
      metadata: metadata,
    };

    // Add to note's AI images array
    const currentAiImages = note.aiGeneratedImages || [];
    const updatedAiImages = [...currentAiImages, aiImage];

    await ctx.db.patch(noteId, {
      aiGeneratedImages: updatedAiImages,
    });

    return {
      success: true,
      imageId: updatedAiImages.length - 1, // Index of the newly added image
      aiImage: aiImage,
    };
  },
});

// Remove AI-generated image from a note
export const removeAiImageFromNote = mutation({
  args: {
    noteId: v.id("notes"),
    imageIndex: v.number(),
  },
  handler: async (ctx, { noteId, imageIndex }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    const currentAiImages = note.aiGeneratedImages || [];
    if (imageIndex < 0 || imageIndex >= currentAiImages.length) {
      throw new Error("Invalid image index");
    }

    // Remove image at specified index
    const updatedAiImages = currentAiImages.filter((_, index) => index !== imageIndex);

    await ctx.db.patch(noteId, {
      aiGeneratedImages: updatedAiImages,
    });

    return { success: true };
  },
});

// Get AI images for a note
export const getAiImagesForNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      return [];
    }

    return note.aiGeneratedImages || [];
  },
});