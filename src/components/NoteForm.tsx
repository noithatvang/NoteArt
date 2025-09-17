// Fix TypeScript for Google Picker
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Plus, Upload, X } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
}

interface NoteFormProps {
  tags: Tag[];
}

export function NoteForm({ tags }: NoteFormProps) {
  // Fix TypeScript for Google Picker
  declare global {
    interface Window {
      google: any;
      gapi: any;
    }
  }
  const [title, setTitle] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [desc, setDesc] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showQuickTagInput, setShowQuickTagInput] = useState(false);
  const [quickTagName, setQuickTagName] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputTagRef = useRef<HTMLInputElement>(null);

  const createNote = useMutation(api.notes.create);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);
  const createTag = useMutation(api.tags.create);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.slice(0, 5 - selectedImages.length);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  if (!title.trim()) return;

    try {
      let imageIds: Id<"_storage">[] = [];
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
        imageIds.push(json.storageId);
      }

      await createNote({
  title: title.trim(),
  description: desc.trim(),
  content: title.trim(), // content khởi tạo bằng title
  tags: selectedTags,
  imageIds,
      });

  setTitle("");
  setDesc("");
  setShowDesc(false);
      setSelectedTags([]);
      setSelectedImages([]);
      setImagePreviews([]);
      setShowTagSelector(false);
      setShowQuickTagInput(false);
      setQuickTagName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Note created successfully!");
    } catch (error) {
      toast.error("Failed to create note");
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

  const handleQuickTagCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTagName.trim()) return;

    try {
      // Tạo màu ngẫu nhiên cho tag mới
      const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      await createTag({
        name: quickTagName.trim(),
        color: randomColor,
      });
      // Thêm tag mới vào danh sách đã chọn
      setSelectedTags(prev => [...prev, quickTagName.trim()]);
      setQuickTagName("");
      setShowQuickTagInput(false);
      toast.success("Tag created and added!");
      // Focus lại vào textarea ghi chú
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    } catch (error) {
      toast.error("Failed to create tag");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input & Create Button */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Tiêu đề..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          <Button
            type="submit"
            disabled={!title.trim()}
            variant={title.trim() ? "default" : "outline"}
            size="default"
            className={`self-start transition-all duration-300 ${title.trim() ? 'shadow-lg hover:shadow-xl' : ''}`}
          >
            Tạo ghi chú
          </Button>
        </div>
        {/* Description toggle & input (chỉ hiển thị khi đã nhập title) */}
        {title.trim() && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDesc}
                onChange={e => setShowDesc(e.target.checked)}
              />
              <span className="font-medium">description</span>
            </label>
            {showDesc && (
              <textarea
                placeholder="Nhập mô tả kỹ hơn nếu muốn"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={8}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-y max-h-64 overflow-auto"
              />
            )}
          </div>
        )}

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="flex gap-2 mb-2">
            {imagePreviews.map((preview, idx) => (
              <div key={idx} className="relative inline-block">
                <img
                  src={preview}
                  alt={`Preview ${idx+1}`}
                  className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                />
                <Button
                  type="button"
                  onClick={() => removeImageAt(idx)}
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 items-center flex-wrap">
          {/* Quick Tag Creator */}
          <div className="relative">
            <div
              className="group relative"
              tabIndex={0}
            >
              <Button
                type="button"
                onClick={() => {
                  setShowQuickTagInput((prev) => {
                    const next = !prev;
                    if (next) {
                      setTimeout(() => {
                        inputTagRef.current?.focus();
                      }, 0);
                    }
                    return next;
                  });
                }}
                variant="outline"
                size="default"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm thẻ
              </Button>
              {showQuickTagInput && (
                <div
                  className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[220px]"
                  onMouseDown={e => e.stopPropagation()}
                >
                  <div className="mb-2">
                    <div className="font-medium text-gray-700 mb-1">Thẻ:</div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {tags.length === 0 && <span className="text-gray-400 text-sm">Chưa có thẻ nào</span>}
                      {tags.map(tag => (
                        <Button
                          key={tag._id}
                          type="button"
                          onClick={() => { toggleTag(tag.name); setShowQuickTagInput(false); }}
                          variant="ghost"
                          size="sm"
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag.name) ? "ring-2 ring-offset-1" : "hover:scale-105"}`}
                          style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}` }}
                        >
                          {tag.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={handleQuickTagCreate} className="space-y-2">
                    <input
                      ref={inputTagRef}
                      type="text"
                      placeholder="Tạo thẻ mới"
                      value={quickTagName}
                      onChange={(e) => setQuickTagName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                      autoFocus
                    />
                    <Button
                      type="button"
                      disabled={!quickTagName.trim()}
                      variant="default"
                      size="sm"
                      className="w-full text-sm"
                      onClick={handleQuickTagCreate}
                    >
                      Tạo thẻ
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={selectedImages.length >= 5}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="default"
            className="flex items-center gap-2"
            disabled={selectedImages.length >= 5}
          >
            <Upload className="w-4 h-4" />
            {selectedImages.length >= 5 ? "Tối đa 5 ảnh" : "Thêm ảnh"}
          </Button>
          {/* Google Drive Button */}
          <Button
            type="button"
            variant="outline"
            size="default"
            className="flex items-center gap-2"
            onClick={handleGoogleDriveClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16"><path fill="#2196F3" d="M17.7 8.1L24 19.1 30.3 8.1z"/><path fill="#4CAF50" d="M6 40h36l-6-10H12z"/><path fill="#FFC107" d="M41.7 38.1L30.3 8.1 24 19.1z"/><path fill="#FF3D00" d="M6.3 38.1L17.7 8.1 24 19.1z"/></svg>
            Google Drive
          </Button>
          {/* Camera Button */}
          <Button
            type="button"
            variant="outline"
            size="default"
            className="flex items-center gap-2"
            onClick={handleCameraClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17a4.978 4.978 0 0 1-4.9-4H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.1l.83-1.66A1 1 0 0 1 8.83 5h6.34a1 1 0 0 1 .9.34L17.9 7H20a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2.1a4.978 4.978 0 0 1-4.9 4zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
            Máy ảnh
          </Button>

          {/* Selected Tags Display */}
          <div className="flex gap-2 flex-wrap">
            {selectedTags.map(tagName => {
              const tag = tags.find(t => t.name === tagName);
              return (
                <span
                  key={tagName}
                  className="px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: tag?.color + "20",
                    color: tag?.color || "#666",
                    border: `1px solid ${tag?.color || "#ccc"}`,
                  }}
                  onClick={() => toggleTag(tagName)}
                >
                  {tagName} ×
                </span>
              );
            })}
          </div>
        </div>

        {/* Tag Selector */}
        {showTagSelector && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Chọn thẻ:</h4>
            <div className="flex gap-2 flex-wrap">
              {tags.map(tag => (
                <Button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  variant="ghost"
                  size="sm"
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
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* Drag & Drop Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-80 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <ImagePlus className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Thả ảnh vào đây</p>
              <p className="text-blue-600 text-sm">Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 5MB)</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
