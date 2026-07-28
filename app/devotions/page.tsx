import DevotionsClient from "@/components/DevotionsClient";

export default function DevotionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Devotions</h1>
      <p className="mt-2 text-gray-600">
        Start your day rooted in God&rsquo;s Word, encouraged by truth, and
        reminded that you are never too far gone for God&rsquo;s grace. Work
        through the 7-Day Devotional Journey below, in any order.
      </p>

      <DevotionsClient />
    </div>
  );
}
