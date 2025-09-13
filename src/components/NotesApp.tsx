import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBar } from "./SearchBar";
import { NoteForm } from "./NoteForm";
import { NotesList } from "./NotesList";
import { TagManager } from "./TagManager";

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
        <button
          onClick={() => setShowTagManager(!showTagManager)}
          className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
        >
          {showTagManager ? "Close" : "Manage Tags"}
        </button>
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
