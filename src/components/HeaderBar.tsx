import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Authenticated } from "convex/react";
import { SignOutButton } from "../SignOutButton";

interface HeaderBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function HeaderBar({ searchQuery, setSearchQuery }: HeaderBarProps) {
  const [showInput, setShowInput] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when showInput
  const handleShowInput = () => {
    setShowInput(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleHideInput = () => {
    setShowInput(false);
    setSearchQuery("");
    setSearchActive(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchActive(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      handleHideInput();
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm h-16 flex justify-between items-center border-b border-gray-200 shadow-sm px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">🎨 NoteArt</h2>
        <div className="relative flex items-center">
          <Search
            className="w-6 h-6 text-gray-500 cursor-pointer transition-colors hover:text-blue-500"
            onClick={handleShowInput}
          />
          {(showInput || searchActive) && (
            <div className="flex items-center ml-2" tabIndex={-1}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white w-[400px] shadow-lg"
                maxLength={128}
                onKeyDown={handleInputKeyDown}
              />
              {searchQuery.trim() && !searchActive && (
                <button
                  className="ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow"
                  onMouseDown={e => { e.preventDefault(); handleSearch(); }}
                >
                  Search
                </button>
              )}
              {searchActive && (
                <button
                  className="ml-2 px-2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full font-bold text-lg flex items-center justify-center"
                  onClick={handleHideInput}
                  title="Clear search"
                  tabIndex={-1}
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <Authenticated>
        <SignOutButton />
      </Authenticated>
    </header>
  );
}