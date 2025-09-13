import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
  onClose: () => void;
}

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6366F1", "#14B8A6", "#F43F5E"
];

export function TagManager({ tags, onClose }: TagManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const createTag = useMutation(api.tags.create);
  const updateTag = useMutation(api.tags.update);
  const deleteTag = useMutation(api.tags.remove);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      setShowCreateForm(false);
      toast.success("Tag created successfully!");
    } catch (error) {
      toast.error("Failed to create tag");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !newTagName.trim()) return;

    try {
      await updateTag({
        id: editingTag._id,
        name: newTagName.trim(),
        color: newTagColor,
      });
      setEditingTag(null);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
      toast.success("Tag updated successfully!");
    } catch (error) {
      toast.error("Failed to update tag");
    }
  };

  const handleDelete = async (tagId: Id<"tags">) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      try {
        await deleteTag({ id: tagId });
        toast.success("Tag deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete tag");
      }
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Manage Tags</h3>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Existing Tags */}
      <div className="space-y-3 mb-6">
        {tags.map((tag) => (
          <div
            key={tag._id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium text-gray-700">{tag.name}</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => startEdit(tag)}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(tag._id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTag) && (
        <form onSubmit={editingTag ? handleUpdate : handleCreate} className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700">
            {editingTag ? "Edit Tag" : "Create New Tag"}
          </h4>
          
          <input
            type="text"
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    newTagColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
            >
              {editingTag ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={editingTag ? cancelEdit : () => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Create Button */}
      {!showCreateForm && !editingTag && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Tag
        </button>
      )}
    </div>
  );
}
