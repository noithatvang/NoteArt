import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Edit2, Trash2, Calendar, Sparkles } from "lucide-react";
import { ImageGallery } from "./ImageGallery";
import { Id } from "../../convex/_generated/dataModel";
import { NoteEditModal } from "./NoteEditModal";
import { Button } from "./ui/button";

interface Note {
  _id: Id<"notes">;
  content: string;
  tags: string[];
  imageId?: Id<"_storage"> | null;
  imageIds: Id<"_storage">[];
  imageUrl?: string | null;
  imageUrls: (string | null)[];
  _creationTime: number;
  title?: string;
  userId?: Id<"users">;
}

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
}

interface NotesListProps {
  notes: Note[];
  tags: Tag[];
}

export function NotesList({ notes, tags }: NotesListProps) {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const deleteNote = useMutation(api.notes.remove);

  const handleDelete = async (noteId: Id<"notes">) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote({ id: noteId });
        toast.success("Note deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete note");
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
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
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note._id}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/80 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 group hover:-translate-y-1"
          >
            {/* Note Header */}
            <div className="flex justify-end items-start mb-3">
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => setEditingNote(note)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-auto text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(note._id)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Note Image */}
            {note.imageUrls && note.imageUrls.length > 0 && (
                <div>
                  <ImageGallery imageUrls={note.imageUrls} />
                  <Button
                    onClick={() => toast.info("Tính năng tạo hình ảnh AI đang phát triển!")}
                    variant="outline"
                    size="sm"
                    className="mt-2 self-end bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 text-xs font-medium shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tạo ảnh AI
                  </Button>
                </div>
            )}

            {/* Note Content */}
            <p className="text-slate-800 font-semibold text-lg mb-4 line-clamp-2 leading-relaxed">{note.title || note.content}</p>

            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-4">
                {note.tags.map((tagName) => {
                  const tag = tags.find((t) => t.name === tagName);
                  return (
                    <span
                      key={tagName}
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag?.color + "20" || "#f3f4f6",
                        color: tag?.color || "#6b7280",
                        border: `1px solid ${tag?.color || "#d1d5db"}`,
                      }}
                    >
                      {tagName}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(note._creationTime)}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <NoteEditModal
          note={{
            ...editingNote,
            imageId: editingNote.imageId ?? null,
            imageUrl: editingNote.imageUrl ?? null,
            imageUrls: (editingNote.imageUrls ?? []).filter((url): url is string => typeof url === "string")
          }}
          tags={tags}
          onClose={() => setEditingNote(null)}
        />
      )}
    </>
  );
}
