import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { NotesApp } from "./components/NotesApp";
import { HeaderBar } from "./components/HeaderBar";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="flex-1">
        <Content searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function Content({ searchQuery, setSearchQuery }: { searchQuery: string, setSearchQuery: (q: string) => void }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Authenticated>
        <NotesApp searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to NoteArt</h1>
            <p className="text-xl text-gray-600">Sign in to start taking notes</p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
