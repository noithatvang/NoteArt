import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBar } from "./SearchBar";
import { NoteForm } from "./NoteForm";
import { NotesList } from "./NotesList";
import { TagManager } from "./TagManager";
import { Button } from "./ui/button";

interface NotesAppProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function NotesApp({ searchQuery, setSearchQuery }: NotesAppProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  
  const searchNotes = useQuery(
    api.notes.search,
    searchQuery.trim() ? { query: searchQuery } : "skip"
  );
  
  const allNotes = useQuery(api.notes.list);
  
  const notes = searchQuery.trim() ? searchNotes : allNotes;
  
  const tags = useQuery(api.tags.list);

  return (
    <div className="space-y-6">
      {/* Note Creation Form */}
      <NoteForm tags={tags || []} />

      {/* Header with Tag Manager Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Your Notes</h2>
        <Button
          onClick={() => setShowTagManager(!showTagManager)}
          variant="outline"
          className="text-sm font-medium"
        >
          {showTagManager ? "Đóng" : "Quản lý Tags"}
        </Button>
      </div>

      {/* Tag Manager - Only show when button is clicked */}
      {showTagManager && (
        <TagManager 
          tags={tags || []}
          onClose={() => setShowTagManager(false)}
        />
      )}

      {/* Notes List */}
      <NotesList notes={notes || []} tags={tags || []} />
    </div>
  );
}
