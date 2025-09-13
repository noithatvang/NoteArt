"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{flow === "signIn" ? "Login" : "Sign Up"}</CardTitle>
          <CardDescription>
            {flow === "signIn"
              ? "Enter your email below to login to your account"
              : "Enter your email below to create an account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);

              try {
                await signIn("password", formData);
                // Success - navigate to notes dashboard
                toast.success(flow === "signIn" ? "Signed in successfully!" : "Account created successfully!");
                navigate('/notes');
              } catch (error: any) {
                let toastTitle = "";
                if (error.message.includes("Invalid password")) {
                  toastTitle = "Invalid password. Please try again.";
                } else {
                  toastTitle =
                    flow === "signIn"
                      ? "Could not sign in, did you mean to sign up?"
                      : "Could not sign up, did you mean to sign in?";
                }
                toast.error(toastTitle);
                setSubmitting(false);
              }
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {flow === "signIn" && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {flow === "signIn" ? "Sign in" : "Sign up"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={async () => {
                  try {
                    await signIn("anonymous");
                    toast.success("Signed in anonymously!");
                    navigate('/notes');
                  } catch (error) {
                    toast.error("Could not sign in anonymously. Please try again.");
                  }
                }}
              >
                Sign in anonymously
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              <span>
                {flow === "signIn"
                  ? "Don't have an account? "
                  : "Already have an account? "}
              </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}