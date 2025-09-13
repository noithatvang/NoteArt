import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  notes: defineTable({
  title: v.optional(v.string()), // Tạm thời optional để tương thích với dữ liệu cũ
  description: v.optional(v.string()),
  content: v.string(),
  imageId: v.optional(v.id("_storage")), // giữ lại để tương thích dữ liệu cũ
  imageIds: v.optional(v.array(v.id("_storage"))),
  tags: v.array(v.string()),
  userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId"],
    }),

  tags: defineTable({
    name: v.string(),
    color: v.string(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
