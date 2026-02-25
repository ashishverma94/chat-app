"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Unauthenticated } from "convex/react";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        Convex + Next.js + Clerk
        <UserButton />
      </header>
      <main className="p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">
          Chat App
        </h1>

        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="flex flex-col gap-8 w-96 mx-auto justify-center items-center">
      <Link
        className="bg-[black] w-30 px-2 py-2 flex justify-center items-center rounded-lg text-white"
        href={"/login"}
      >
        Login
      </Link>
    </div>
  );
}
