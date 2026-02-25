"use client";
import { useAuth } from "@clerk/clerk-react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/chat");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen flex ">
      <div className="min-h-screen w-full md:w-1/2 text-slate-800 flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 w-full max-w-md px-6">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center mb-8 shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <div className="w-full flex flex-col gap-5 justify-center items-center">
            <SignInButton mode="modal">
              <button className="w-full py-3 max-w-70 cursor-pointer bg-linear-to-b from-slate-600 to-slate-900 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="w-full py-3 max-w-70 cursor-pointer rounded-xl bg-white border-2 border-slate-800 text-slate-800 font-semibold text-lg transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]">
                Sign Up
              </button>
            </SignUpButton>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="underline hover:text-slate-400 transition-colors"
            >
              Terms
            </a>{" "}
            &amp;{" "}
            <a
              href="#"
              className="underline hover:text-slate-400 transition-colors"
            >
              Privacy
            </a>
          </p>
        </div>
      </div>
      <div className="w-1/2 hidden md:flex h-screen bg-white text-slate-800 relative overflow-hidden border-l border-slate-200">
        {/* Subtle background accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-105 h-105 bg-indigo-100 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-105 h-105 bg-pink-100 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-xl">
          {/* Heading */}
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Connect. Chat. Collaborate.
          </h2>

          {/* Description */}
          <p className="text-slate-600 text-lg mb-10 leading-relaxed">
            A modern real-time chat platform built for teams and communities.
            Stay connected with seamless messaging, smart notifications, and
            powerful collaboration tools.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                💬
              </div>
              <div>
                <p className="font-semibold">Real-time Messaging</p>
                <p className="text-slate-500 text-sm">
                  Instant conversations with zero delay.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                🔒
              </div>
              <div>
                <p className="font-semibold">Secure & Private</p>
                <p className="text-slate-500 text-sm">
                  End-to-end protected communication.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                ⚡
              </div>
              <div>
                <p className="font-semibold">Fast & Responsive</p>
                <p className="text-slate-500 text-sm">
                  Built for performance and scalability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
