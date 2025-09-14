import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface SimpleNote {
  _id: Id<"notes">;
  title?: string;
  description?: string;
  content: string;
  tags: string[];
}

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
}

interface SimpleNoteEditModalProps {
  note: SimpleNote;
  tags: Tag[];
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6366F1", "#14B8A6", "#F43F5E"
];

export function SimpleNoteEditModal({ note, tags, onClose }: SimpleNoteEditModalProps) {
  console.log('SimpleNoteEditModal rendered with note:', note);

  const [title, setTitle] = useState(note.title ?? "");
  const [desc, setDesc] = useState(note.description ?? "");
  const [content, setContent] = useState(note.content ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(note.tags);

  // Tag creation states
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const updateNote = useMutation(api.notes.update);
  const createTag = useMutation(api.tags.create);
  const updateTag = useMutation(api.tags.update);

  useEffect(() => {
    console.log('SimpleNoteEditModal: Note changed, updating state:', note);
    setTitle(note.title ?? "");
    setDesc(note.description ?? "");
    setContent(note.content ?? "");
    setSelectedTags(note.tags);
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await updateNote({
        id: note._id,
        title: title.trim(),
        description: desc.trim(),
        content: content.trim(),
        tags: selectedTags,
        imageIds: [], // Simplified - no images
      });

      toast.success("Note updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };

  // Focus management
  const focusTagInput = useCallback(() => {
    if (tagInputRef.current) {
      tagInputRef.current.focus();
      tagInputRef.current.select();
    }
  }, []);

  useEffect(() => {
    if (showCreateTag || editingTag) {
      setTimeout(focusTagInput, 100);
    }
  }, [showCreateTag, editingTag, focusTagInput]);

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const result = await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });

      // Add the new tag to selected tags
      setSelectedTags(prev => [...prev, newTagName.trim()]);

      // After creating, immediately switch to edit mode for the new tag
      const newTag: Tag = {
        _id: result, // The ID returned from createTag
        name: newTagName.trim(),
        color: newTagColor
      };

      setEditingTag(newTag);
      // Keep the same values in inputs for editing
      // setNewTagName(""); // Don't reset - keep for editing
      // setNewTagColor(PRESET_COLORS[0]); // Don't reset - keep for editing
      setShowCreateTag(false); // Hide create form, show edit form

      toast.success("Tạo thẻ thành công! Bạn có thể chỉnh sửa tiếp.");
    } catch (error: any) {
      console.error("Error creating tag:", error);
      if (error?.message?.includes?.("already exists")) {
        toast.error("Thẻ đã tồn tại!");
      } else {
        toast.error("Không thể tạo thẻ");
      }
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !newTagName.trim()) return;

    try {
      await updateTag({
        id: editingTag._id,
        name: newTagName.trim(),
        color: newTagColor,
      });

      // Update selected tags if the name changed
      setSelectedTags(prev =>
        prev.map(tagName =>
          tagName === editingTag.name ? newTagName.trim() : tagName
        )
      );

      // Reset state
      setEditingTag(null);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);

      toast.success("Cập nhật thẻ thành công!");
    } catch (error: any) {
      console.error("Error updating tag:", error);
      if (error?.message?.includes?.("already exists")) {
        toast.error("Tên thẻ đã tồn tại!");
      } else {
        toast.error("Không thể cập nhật thẻ");
      }
    }
  };

  const startEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setShowCreateTag(false);
  };

  const cancelTagEdit = () => {
    setEditingTag(null);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
    // Stay in edit note modal - don't close
  };

  const finishTagEdit = () => {
    // User can call this when they're done editing tags
    setEditingTag(null);
    setShowCreateTag(false);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  const openCreateTagForm = () => {
    setShowCreateTag(true);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  try {
    console.log('SimpleNoteEditModal: About to render UI');

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Edit Note (Simple)</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <input
                type="text"
                placeholder="Tiêu đề..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />

              {/* Description Input */}
              <textarea
                placeholder="Nhập mô tả kỹ hơn nếu muốn"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y"
              />

              {/* Content Input */}
              <textarea
                placeholder="Nội dung..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y"
              />

              {/* Tags Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Thẻ:</h4>
                  <button
                    type="button"
                    onClick={openCreateTagForm}
                    disabled={showCreateTag || editingTag}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo thẻ mới
                  </button>
                </div>

                {/* Create/Edit Tag Form */}
                {(showCreateTag || editingTag) && (
                  <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700">
                        {editingTag ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
                      </h5>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên thẻ
                        </label>
                        <input
                          ref={tagInputRef}
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Nhập tên thẻ..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Màu sắc
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewTagColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                newTagColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={editingTag ? cancelTagEdit : () => {
                            setShowCreateTag(false);
                            setNewTagName("");
                            setNewTagColor(PRESET_COLORS[0]);
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={!newTagName.trim()}
                          className="px-4 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded text-sm font-medium transition-colors"
                        >
                          {editingTag ? "Cập nhật" : "Tạo"}
                        </button>
                        {editingTag && (
                          <button
                            type="button"
                            onClick={finishTagEdit}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded transition-colors"
                          >
                            Xong
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                )}

                {/* Existing Tags */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Thẻ có sẵn:</h5>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map(tag => (
                      <div key={tag._id} className="relative group">
                        <button
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`px-3 py-1 pr-8 rounded-full text-sm font-medium transition-all ${
                            selectedTags.includes(tag.name)
                              ? "ring-2 ring-offset-1"
                              : "hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                            border: `1px solid ${tag.color}`,
                          }}
                        >
                          {tag.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditTag(tag)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 w-5 h-5 text-gray-400 hover:text-blue-500 transition-all"
                          title="Chỉnh sửa thẻ"
                        >
                          ✏️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  Update Note
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('SimpleNoteEditModal: Error rendering:', error);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Simple Modal Error</h2>
          <p className="text-gray-600 mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}