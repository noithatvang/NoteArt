import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, Upload, Plus } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface Note {
  _id: Id<"notes">;
  title?: string;
  description?: string;
  content: string;
  tags: string[];
  imageId: Id<"_storage"> | null;
  imageIds: Id<"_storage">[];
  imageUrl: string | null;
  imageUrls: string[];
}

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
}

interface NoteEditModalProps {
  note: Note;
  tags: Tag[];
  onClose: () => void;
}

export function NoteEditModal({ note, tags, onClose }: NoteEditModalProps) {
  const [title, setTitle] = useState(note.title ?? "");
  const [desc, setDesc] = useState(note.description ?? "");
  const [content, setContent] = useState(note.content ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(note.tags);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<Id<"_storage">[]>(note.imageIds ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(note.imageUrls ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đảm bảo khi note thay đổi (mở modal mới), luôn giữ lại ảnh cũ
  useEffect(() => {
  setTitle(note.title ?? "");
  setDesc(note.description ?? "");
  setContent(note.content ?? "");
  setSelectedTags(note.tags);
  setImagePreviews([]);
  setSelectedImages([]);
  setImageIds(note.imageIds ?? []);
  setImageUrls(note.imageUrls ?? []);
  }, [note]);

  const updateNote = useMutation(api.notes.update);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const max = 5 - imageIds.length - selectedImages.length;
    const newFiles = files.slice(0, max);
    if (newFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreviews(prev => [...prev, ev.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImageAt = (idx: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeOldImageAt = (idx: number) => {
    setImageIds(prev => prev.filter((_, i) => i !== idx));
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      let newImageIds: Id<"_storage">[] = [...imageIds];
      for (const file of selectedImages) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const json = await result.json();
        if (!result.ok) {
          throw new Error(`Upload failed: ${JSON.stringify(json)}`);
        }
        newImageIds.push(json.storageId);
      }

      await updateNote({
  id: note._id,
  title: title.trim(),
  description: desc.trim(),
  content: content.trim(),
  tags: selectedTags,
  imageIds: newImageIds,
      });

      toast.success("Note updated successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Edit Note</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input (bắt buộc) */}
            <input
              type="text"
              placeholder="Tiêu đề..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
            {/* Description Input (tùy chọn) */}
            <textarea
              placeholder="Nhập mô tả kỹ hơn nếu muốn"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y max-h-64 overflow-auto"
            />

            {/* Old Images Preview */}
            {imageUrls.length > 0 && (
              <div className="flex gap-2 mb-2">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={url}
                      alt={`Old Preview ${idx+1}`}
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeOldImageAt(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* New Images Preview */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mb-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={preview}
                      alt={`New Preview ${idx+1}`}
                      className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageAt(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tags
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                disabled={imageIds.length + selectedImages.length >= 5}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={imageIds.length + selectedImages.length >= 5}
              >
                <Upload className="w-4 h-4" />
                {imageIds.length + selectedImages.length >= 5 ? "Max 5 Images" : "Add Image"}
              </button>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedTags.map(tagName => {
                    const tag = tags.find(t => t.name === tagName);
                    return (
                      <span
                        key={tagName}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: tag?.color + "20",
                          color: tag?.color || "#666",
                          border: `1px solid ${tag?.color || "#ccc"}`,
                        }}
                      >
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tag Selector */}
            {showTagSelector && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Select Tags:</h4>
                <div className="flex gap-2 flex-wrap">
                  {tags.map(tag => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
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
                  ))}
                </div>
              </div>
            )}

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
}
