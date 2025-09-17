import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Edit2, Trash2, Calendar, Wand2, X, Save, Loader2 } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";

interface Note {
  _id: Id<"notes">;
  content: string;
  title?: string;
  _creationTime: number;
  userId?: Id<"users">;
  imageUrls?: (string | null)[];
  aiGeneratedImages?: any[];
}

interface SimpleNotesListProps {
  notes: Note[];
  onEditNote?: (note: Note) => void;
}

export function SimpleNotesList({ notes, onEditNote }: SimpleNotesListProps) {
  const [editingNoteId, setEditingNoteId] = useState<Id<"notes"> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const deleteNote = useMutation(api.notes.remove);
  const generateImageAction = useAction(api.openrouter.generateImage);
  const addAiImageToNote = useMutation(api.aiImages.addAiImageToNote);

  const handleDelete = async (noteId: Id<"notes">) => {
    if (confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
      try {
        await deleteNote({ id: noteId });
        toast.success("Đã xóa ghi chú!");
      } catch (error) {
        toast.error("Không thể xóa ghi chú");
      }
    }
  };

  const handleEdit = (note: Note) => {
    if (onEditNote) {
      onEditNote(note);
    } else {
      // Fallback to old inline editing if onEditNote not provided
      setEditingNoteId(note._id);
      setGeneratedImageUrl(null);
    }
  };

  const handleCancel = () => {
    setEditingNoteId(null);
    setGeneratedImageUrl(null);
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const result = await generateImageAction({
        prompt: prompt,
        model: "google/imagen-2"
      });

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        toast.success("Đã tạo ảnh AI thành công!");
      } else {
        throw new Error("Tạo ảnh thất bại");
      }
    } catch (error) {
      console.error("Lỗi tạo ảnh AI:", error);
      toast.error("Không thể tạo ảnh AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (noteId: Id<"notes">) => {
    if (!generatedImageUrl) {
      toast.error("Không có ảnh để lưu");
      return;
    }

    try {
      const note = notes.find(n => n._id === noteId);
      if (!note) return;

      await addAiImageToNote({
        noteId: noteId,
        imageUrl: generatedImageUrl,
        prompt: note.content,
        provider: "openrouter",
      });

      toast.success("Đã lưu ảnh vào ghi chú!");
      setEditingNoteId(null);
      setGeneratedImageUrl(null);
    } catch (error) {
      console.error("Lỗi lưu ảnh:", error);
      toast.error("Không thể lưu ảnh");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-slate-400 mb-6">
          <Calendar className="w-20 h-20 mx-auto" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-700 mb-3">Chưa có ghi chú nào</h3>
        <p className="text-slate-500 text-lg">Tạo ghi chú đầu tiên để bắt đầu!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => {
        const isEditing = !onEditNote && editingNoteId === note._id;

        return (
          <div
            key={note._id}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/80 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group flex flex-col"
          >
            {/* Nội dung ghi chú */}
            <div className="flex-1 mb-4">
              <p className="text-slate-800 font-semibold text-lg mb-4 line-clamp-3 leading-relaxed">
                {note.title || note.content}
              </p>

              {/* Hiển thị ảnh hiện có */}
              {note.imageUrls && note.imageUrls.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {note.imageUrls.filter(Boolean).map((url, idx) => (
                      <img
                        key={idx}
                        src={url!}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hiển thị ảnh AI đã tạo */}
              {note.aiGeneratedImages && note.aiGeneratedImages.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {note.aiGeneratedImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`AI ảnh ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-purple-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Hiển thị ảnh preview khi đang generate */}
              {isEditing && generatedImageUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Ảnh vừa tạo:</p>
                  <img
                    src={generatedImageUrl}
                    alt="Ảnh AI vừa tạo"
                    className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                  />
                </div>
              )}
            </div>

            {/* Phần hành động */}
            {!isEditing ? (
              // Chế độ xem thường - hiện nút edit/delete khi hover
              <div className="flex justify-between items-center">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(note._creationTime)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => handleEdit(note)}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 h-auto text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                    title="Chỉnh sửa ghi chú"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(note._id)}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
                    title="Xóa ghi chú"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Chế độ edit - hiện nút Generate/Cancel/Save
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleGenerate(note.content)}
                    disabled={isGenerating}
                    variant="default"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {generatedImageUrl && (
                  <Button
                    onClick={() => handleSave(note._id)}
                    variant="default"
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}