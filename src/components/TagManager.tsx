import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

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
      toast.success("Tạo thẻ thành công!");
    } catch (error) {
      toast.error("Không thể tạo thẻ");
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
      toast.success("Cập nhật thẻ thành công!");
    } catch (error) {
      toast.error("Không thể cập nhật thẻ");
    }
  };

  const handleDelete = async (tagId: Id<"tags">) => {
    if (confirm("Bạn có chắc chắn muốn xóa thẻ này?")) {
      try {
        await deleteTag({ id: tagId });
        toast.success("Xóa thẻ thành công!");
      } catch (error) {
        toast.error("Không thể xóa thẻ");
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
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Quản lý thẻ</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Existing Tags */}
      <div className="space-y-3 mb-6">
        {tags.map((tag) => (
          <div
            key={tag._id}
            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg hover:bg-slate-100/80 transition-colors border border-slate-200/60"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium text-gray-700">{tag.name}</span>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => startEdit(tag)}
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-400 hover:text-blue-500"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleDelete(tag._id)}
                variant="ghost"
                size="sm"
                className="p-1.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTag) && (
        <form onSubmit={editingTag ? handleUpdate : handleCreate} className="space-y-4 p-4 bg-slate-50/60 rounded-lg border border-slate-200/60">
          <h4 className="font-medium text-gray-700">
            {editingTag ? "Chỉnh sửa thẻ" : "Tạo thẻ mới"}
          </h4>
          
          <input
            type="text"
            placeholder="Tên thẻ"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewTagColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all p-0 ${
                    newTagColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!newTagName.trim()}
              variant="default"
              className="px-4 py-2"
            >
              {editingTag ? "Cập nhật" : "Tạo"}
            </Button>
            <Button
              type="button"
              onClick={editingTag ? cancelEdit : () => setShowCreateForm(false)}
              variant="ghost"
              className="px-4 py-2"
            >
              Hủy
            </Button>
          </div>
        </form>
      )}

      {/* Create Button */}
      {!showCreateForm && !editingTag && (
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="default"
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          Tạo thẻ mới
        </Button>
      )}
    </div>
  );
}
