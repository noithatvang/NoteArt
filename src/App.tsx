import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { HeaderBar } from "./components/HeaderBar";
import { HomePage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { Hero } from "./components/ui/animated-hero";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 overflow-hidden">
        <AppContent />
        <Toaster
          position="top-right"
          className="sm:top-4 sm:right-4"
          toastOptions={{
            className: "text-sm",
          }}
        />
      </div>
    </Router>
  );
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route
          path="/notes"
          element={
            <Authenticated>
              <HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </Authenticated>
          }
        />
        <Route
          path="/login"
          element={
            <Unauthenticated>
              <LoginPage />
            </Unauthenticated>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
