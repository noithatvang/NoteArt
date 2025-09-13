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
  // Google Drive Picker
  const handleGoogleDriveClick = async () => {
    window.open("https://drive.google.com/drive/my-drive", "_blank");
    toast.info("Vui lòng tải ảnh về từ Google Drive và chọn lại bằng nút Add Image. Để tích hợp trực tiếp, cần cấu hình Google Picker API.");
  };

  // Camera capture UI
  const handleCameraClick = async () => {
    if (!('mediaDevices' in navigator)) {
      toast.error("Trình duyệt không hỗ trợ camera");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.7)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.innerHTML = `
        <div style="background:#fff;padding:24px;border-radius:16px;box-shadow:0 2px 16px #0002;text-align:center;max-width:90vw;">
          <video id="camera-video" autoplay playsinline style="width:400px;height:300px;border-radius:12px;"></video>
          <br/>
          <button id="camera-capture" style="margin:16px 8px 0 0;padding:8px 24px;border-radius:8px;background:#1976d2;color:#fff;font-weight:bold;border:none;">Chụp ảnh</button>
          <button id="camera-cancel" style="margin:16px 0 0 8px;padding:8px 24px;border-radius:8px;background:#eee;color:#333;font-weight:bold;border:none;">Đóng</button>
        </div>
      `;
      document.body.appendChild(modal);
      const video = modal.querySelector('#camera-video') as HTMLVideoElement;
      video.srcObject = stream;
      video.play();
      modal.querySelector('#camera-cancel')?.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });
      modal.querySelector('#camera-capture')?.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 300;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.png`, { type: 'image/png' });
            setSelectedImages(prev => [...prev, file]);
            const reader = new FileReader();
            reader.onload = (ev) => {
              setImagePreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
          }
        }, 'image/png');
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });
    } catch (err) {
      toast.error("Không thể truy cập camera");
    }
  };
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
              {/* Google Drive Button */}
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                onClick={handleGoogleDriveClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20"><path fill="#2196F3" d="M17.7 8.1L24 19.1 30.3 8.1z"/><path fill="#4CAF50" d="M6 40h36l-6-10H12z"/><path fill="#FFC107" d="M41.7 38.1L30.3 8.1 24 19.1z"/><path fill="#FF3D00" d="M6.3 38.1L17.7 8.1 24 19.1z"/></svg>
                Google Drive
              </button>
              {/* Camera Button */}
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors"
                onClick={handleCameraClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="#E91E63" d="M12 17a4.978 4.978 0 0 1-4.9-4H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.1l.83-1.66A1 1 0 0 1 8.83 5h6.34a1 1 0 0 1 .9.34L17.9 7H20a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2.1a4.978 4.978 0 0 1-4.9 4zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                Camera
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
