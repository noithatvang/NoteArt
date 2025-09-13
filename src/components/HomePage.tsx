import { useState } from "react";
import { NotesApp } from "./NotesApp";
import { Sidebar } from "./modern-side-bar";

interface HomePageProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function HomePage({ searchQuery, setSearchQuery }: HomePageProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile top padding for hamburger button */}
        <div className="lg:hidden h-16" />

        {/* Content Container sát sidebar */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            <NotesApp searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>
      </div>
    </div>
  );
}