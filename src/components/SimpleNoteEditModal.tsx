import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, Plus, Save, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Chỉnh sửa ghi chú</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Input Fields */}
          <div className="space-y-4">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Tiêu đề ghi chú..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg font-medium"
            />

            {/* Description Input */}
            <textarea
              placeholder="Mô tả chi tiết (tùy chọn)..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
            />

            {/* Content Input */}
            <textarea
              placeholder="Nội dung ghi chú..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateTag(true)}
              disabled={showCreateTag || editingTag}
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <Plus className="w-4 h-4" />
              Quản lý thẻ
            </Button>

            <div className="flex-1" />

            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={!title.trim()}
              variant="default"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-300 ${title.trim() ? 'shadow-lg hover:shadow-xl' : ''}`}
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </Button>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tagName => {
                const tag = tags.find(t => t.name === tagName);
                return tag ? (
                  <span
                    key={tag._id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border"
                    style={{
                      backgroundColor: tag.color + '15',
                      borderColor: tag.color + '40',
                      color: tag.color
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Tags Management Section */}
          {(showCreateTag || editingTag) && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">
                {editingTag ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
              </h4>

              {/* Create/Edit Tag Form */}
              <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="space-y-3">
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
                    <Button
                      type="button"
                      onClick={editingTag ? cancelTagEdit : () => {
                        setShowCreateTag(false);
                        setNewTagName("");
                        setNewTagColor(PRESET_COLORS[0]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={!newTagName.trim()}
                      variant="default"
                      size="sm"
                    >
                      {editingTag ? "Cập nhật" : "Tạo"}
                    </Button>
                    {editingTag && (
                      <Button
                        type="button"
                        onClick={finishTagEdit}
                        variant="default"
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Xong
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              {/* Existing Tags */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Chọn thẻ từ danh sách:</h5>
                <div className="flex gap-2 flex-wrap">
                  {tags.map(tag => (
                    <div key={tag._id} className="relative group">
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.name)}
                        className={`px-3 py-1 pr-8 rounded-full text-sm font-medium transition-all ${
                          selectedTags.includes(tag.name)
                            ? "ring-2 ring-offset-1 shadow-sm"
                            : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.name)
                            ? tag.color + "25"
                            : tag.color + "10",
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
                {tags.length === 0 && (
                  <p className="text-gray-500 text-sm">Chưa có thẻ nào. Hãy tạo thẻ mới ở trên.</p>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    );
  } catch (error) {
    console.error('SimpleNoteEditModal: Error rendering:', error);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-600">Lỗi chỉnh sửa ghi chú</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-gray-600 mb-4">
          Đã xảy ra lỗi: {error instanceof Error ? error.message : 'Lỗi không xác định'}
        </p>
        <Button onClick={onClose} variant="default">
          Đóng
        </Button>
      </div>
    );
  }
}