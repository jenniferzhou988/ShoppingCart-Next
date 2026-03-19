'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { getAuthState, logout, isAuthenticated, getCurrentUser, type AuthState } from "../lib/auth-client";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>({ token: null, user: null, isAuthenticated: false });

  useEffect(() => {
    // Check auth state on component mount
    setAuthState(getAuthState());
  }, []);

  const handleLogout = () => {
    logout();
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Next.js Auth App
          </h1>

          {authState.isAuthenticated ? (
            <div className="space-y-4">
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Welcome back, <span className="font-semibold">{authState.user?.email}</span>!
                You are logged in as a <span className="font-semibold">{authState.user?.role}</span>.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Please sign in to access your account.
              </p>
              <div className="flex gap-4">
                <a
                  href="/login"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Sign Up
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
