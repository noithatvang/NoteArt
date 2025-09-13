"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to homepage after successful signout
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );
}
