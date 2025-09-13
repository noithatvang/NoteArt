import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Edit2, Trash2, Calendar, Sparkles } from "lucide-react";
import { ImageGallery } from "./ImageGallery";
import { Id } from "../../convex/_generated/dataModel";
import { NoteEditModal } from "./NoteEditModal";

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
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Calendar className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No notes yet</h3>
        <p className="text-gray-500">Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            {/* Note Header */}
            <div className="flex justify-end items-start mb-3">
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingNote(note)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Image */}
            {note.imageUrls && note.imageUrls.length > 0 && (
                <div>
                  <ImageGallery imageUrls={note.imageUrls} />
                  <button
                    onClick={() => toast.info("AI image generation coming soon!")}
                    className="mt-2 self-end bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm border border-gray-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </button>
                </div>
            )}

            {/* Note Content */}
            <p className="text-gray-800 font-semibold text-lg mb-4 line-clamp-2">{note.title || note.content}</p>

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
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
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
