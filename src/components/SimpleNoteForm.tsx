import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface UploadedImageInfo {
  storageId: Id<"_storage">;
  previewUrl: string;
}

export function SimpleNoteForm() {
  const [content, setContent] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImageInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNote = useMutation(api.notes.create);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);

  // Giải phóng Object URL để tránh rò rỉ bộ nhớ
  useEffect(() => {
    const urlsToRevoke = uploadedImages.map(img => img.previewUrl);
    return () => {
      urlsToRevoke.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [uploadedImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createNote({
        title: content.trim(),
        content: content.trim(),
        tags: [],
        imageIds: uploadedImages.map(img => img.storageId),
      });

      setContent("");
      setUploadedImages([]);
      toast.success("Ghi chú đã được tạo!");
    } catch (error) {
      toast.error("Không thể tạo ghi chú");
      console.error(error);
    }
  };

  // Upload image function
  const handleImageUpload = async (file: File, previewUrl: string) => {
    try {
      setIsUploading(true);

      // Kiểm tra nếu ảnh đã được tải lên (dựa trên previewUrl)
      if (uploadedImages.some(img => img.previewUrl === previewUrl)) {
        toast.warning("Ảnh này đã được chọn.");
        return;
      }
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Image record will be stored with the note

      setUploadedImages(prev => [...prev, { storageId, previewUrl }]);
      toast.success("Ảnh đã được tải lên!");
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Tạo URL xem trước tạm thời
      const previewUrl = URL.createObjectURL(file);
      handleImageUpload(file, previewUrl);
    }
  };


  const removeImage = (previewUrlToRemove: string) => {
    const imageToRemove = uploadedImages.find(img => img.previewUrl === previewUrlToRemove);
    if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl);
    setUploadedImages(prev => prev.filter(img => img.previewUrl !== previewUrlToRemove));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn. Tối đa 5MB.`);
          return;
        }
        const previewUrl = URL.createObjectURL(file);
        handleImageUpload(file, previewUrl);
      } else {
        toast.error(`${file.name} không phải là file ảnh`);
      }
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 mb-6 transition-all duration-200 relative ${
      dragActive
        ? 'border-blue-400 border-2 bg-blue-50'
        : 'border-gray-200'
    }`}
    onDragEnter={handleDragEnter}
    onDragLeave={handleDragLeave}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Input Row */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Nhập nội dung ghi chú..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
          <Button
            type="submit"
            disabled={!content.trim()}
            variant={content.trim() ? "default" : "outline"}
            size="default"
            className={`transition-all duration-300 ${content.trim() ? 'shadow-lg hover:shadow-xl' : ''}`}
          >
            Tạo ghi chú
          </Button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2 items-center">
          {/* Upload Image Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isUploading
                ? 'hover:bg-yellow-50 hover:border-yellow-300'
                : 'hover:bg-green-50 hover:border-green-300'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {isUploading ? "Đang tải lên..." : "Tải ảnh"}
          </Button>
        </div>


        {/* Uploaded Images Display */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((image, index) => (
              <div key={image.previewUrl} className="relative group">
                <img
                  src={image.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  onLoad={() => URL.revokeObjectURL(image.previewUrl)} // Tối ưu bộ nhớ
                />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(image.previewUrl)}
                  title="Xóa ảnh"
                  className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>

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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

    </div>
  );
}