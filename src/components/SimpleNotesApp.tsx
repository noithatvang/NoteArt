import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SimpleNoteForm } from "./SimpleNoteForm";
import { SimpleNotesList } from "./SimpleNotesList";
import { SimpleNoteEditModal } from "./SimpleNoteEditModal";
import { Id } from "../../convex/_generated/dataModel";

interface SimpleNotesAppProps {
  searchQuery: string;
}

export function SimpleNotesApp({ searchQuery }: SimpleNotesAppProps) {
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const searchNotes = useQuery(
    api.notes.search,
    searchQuery.trim() ? { query: searchQuery } : "skip"
  );

  const allNotes = useQuery(api.notes.list);
  const tags = useQuery(api.tags.list) || [];

  const notes = searchQuery.trim() ? searchNotes : allNotes;

  const handleEditNote = (note: any) => {
    setEditingNote(note);
  };

  const handleCloseEdit = () => {
    setEditingNote(null);
  };

  return (
    <div className="space-y-6">
      {/* Form tạo ghi chú đơn giản */}
      <SimpleNoteForm />

      {/* Form chỉnh sửa ghi chú (hiện khi có note được edit) */}
      {editingNote && (
        <SimpleNoteEditModal
          note={editingNote}
          tags={tags}
          onClose={handleCloseEdit}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Ghi chú của bạn</h2>
        <div className="text-sm text-gray-500">
          {notes ? `${notes.length} ghi chú` : 'Đang tải...'}
        </div>
      </div>

      {/* Danh sách ghi chú với workflow mới */}
      <SimpleNotesList
        notes={notes || []}
        onEditNote={handleEditNote}
      />
    </div>
  );
}