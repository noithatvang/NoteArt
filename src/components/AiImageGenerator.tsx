import { useState, useEffect, useRef } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Sparkles, Wand2, Loader2, Download, Edit, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Id } from "../../convex/_generated/dataModel";

interface AiImageGeneratorProps {
  noteId: Id<"notes">;
  // Pass the full note object to access its images
  note: {
    _id: Id<"notes">;
    content: string;
    description?: string;
    imageUrls: (string | null)[];
    imageIds?: Id<"_storage">[];
    aiGeneratedImages: any[]; // Simplified for this component
  };
  onImageGenerated?: (imageUrl: string) => void;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  generatedAt: string;
  provider: string;
  metadata?: {
    size?: string;
    quality?: string;
    style?: string;
  };
}

export function AiImageGenerator({ note, onImageGenerated }: AiImageGeneratorProps) {
  const { _id: noteId, description, content, imageUrls, imageIds, aiGeneratedImages } = note;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [prompt, setPrompt] = useState(description || content || "");
  const [editingImage, setEditingImage] = useState<string | null>(null); // URL of image to edit

  // File input ref for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the new OpenRouter actions
  const generateImageAction = useAction(api.openrouter.generateImage);
  const editImageAction = useAction(api.openrouter.editImage);
  const addAiImageToNote = useMutation(api.aiImages.addAiImageToNote);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const updateNoteWithImage = useMutation(api.notes.update);

  const allImages = [...(imageUrls || []), ...(aiGeneratedImages?.map(img => img.url) || [])].filter(Boolean) as string[];

  useEffect(() => {
    if (editingImage) {
      setPrompt(`A vibrant, artistic version of the selected image...`);
    } else {
      setPrompt(description || content || "");
    }
  }, [editingImage, description, content]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image.");
      return;
    }
    if (editingImage) {
      await generateAiImage(prompt, editingImage);
    } else {
      await generateAiImage(prompt);
    }
  };

  const generateAiImage = async (promptText: string, baseImageUrl?: string) => {
    setIsGenerating(true);

    try {
      const result = baseImageUrl
        ? await editImageAction({ prompt: promptText, imageUrl: baseImageUrl })
        // Use Google's Imagen 2 model via OpenRouter for generation
        : await generateImageAction({ prompt: promptText, model: "google/imagen-2" });

      if (result.success && result.imageUrl) {
        // Add to note in database
        await addAiImageToNote({
          noteId: noteId,
          imageUrl: result.imageUrl,
          prompt: promptText,
          provider: "openrouter",
        });

        toast.success("AI image successfully generated and added to note!");

        // Notify parent component
        onImageGenerated?.(result.imageUrl);
        setEditingImage(null); // Reset editing state
      } else {
        throw new Error("Image generation failed.");
      }
    } catch (error) {
      console.error("AI image generation error:", error);
      toast.error("Failed to generate AI image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Could not download image.");
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Create image record
      await createImage({
        storageId,
        format: file.type.split('/')[1] as "png" | "jpg" | "jpeg" | "gif" | "webp"
      });

      // Add image to note's imageIds array
      const currentImageIds = imageIds || [];
      await updateNoteWithImage({
        id: noteId,
        imageIds: [...currentImageIds, storageId],
      });

      toast.success("Ảnh đã được tải lên và thêm vào ghi chú!");

      // Notify parent component that a new image was added
      if (onImageGenerated) {
        // Create a temporary URL for the uploaded image
        const imageUrl = URL.createObjectURL(file);
        onImageGenerated(imageUrl);
      }

    } catch (error) {
      toast.error("Không thể tải ảnh lên");
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  // Trigger file input
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-800">
          {editingImage ? "Edit Image with AI" : "AI Image Generator"}
        </h3>
      </div>

      {/* Image to Edit Selector */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {editingImage ? "Editing this image:" : "Or edit an existing image:"}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {allImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Note image ${idx + 1}`}
                  className={`w-full h-16 object-cover rounded-md cursor-pointer border-2 ${editingImage === url ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent'}`}
                  onClick={() => setEditingImage(editingImage === url ? null : url)}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                  <Edit className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
          {editingImage && (
            <Button variant="link" size="sm" onClick={() => setEditingImage(null)}>
              Clear selection and generate new image instead
            </Button>
          )}
        </div>
      )}

      {/* Editable Description/Prompt */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {editingImage ? "Describe the changes you want:" : "Describe the image you want to create:"}
        </label>
        {!editingImage && description && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
            <strong>Original description from note:</strong> {description}
          </div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A detailed description of the image..."
          className="w-full p-3 rounded-lg border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none min-h-[80px]"
          rows={4}
        />
        {/* Upload Image Button */}
        <Button
          onClick={handleUploadClick}
          disabled={isUploading}
          variant="outline"
          size="sm"
          className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 mb-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Tải ảnh lên
            </>
          )}
        </Button>

        {/* Generate Image Button */}
        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating || !prompt.trim()}
          variant="default"
          size="sm"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              {editingImage ? "Apply Edits" : "Generate Image"}
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 bg-white/50 rounded-lg p-2">
        💡 <strong>Tip:</strong> Detailed descriptions produce higher quality images.
        Example: "A majestic lion in a lush jungle, golden hour lighting, hyperrealistic."
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}