"use client";

import Link from "next/link";
import TestimonyTicker from "@/components/TestimonyTicker";

export default function TestimonyBoardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Testimony Board
          </h1>
          <p className="mt-2 text-gray-600">
            Stories of how God is working in the lives of people in our
            community.
          </p>
        </div>
        <Link
          href="/testimonies/submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Share Your Testimony
        </Link>
      </div>

      <TestimonyTicker emptyMessage="No testimonies yet. Be the first to share one." />
    </div>
  );
}
