import Link from "next/link";

export default function InstallIosPage() {
  const steps = [
    {
      title: "Open the app in Safari",
      body: "The install option only shows up in Safari — it won't appear in Chrome or another browser on iPhone/iPad.",
    },
    {
      title: "Tap the Share button",
      body: "It's the square with an arrow pointing up, in the bar at the bottom of the screen (or the top, on iPad).",
    },
    {
      title: "Tap “Add to Home Screen”",
      body: "Scroll down the share menu if you don't see it right away.",
    },
    {
      title: "Tap “Add”",
      body: "The app icon will appear on your Home Screen, just like any other app. Open it from there from now on.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/help" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        &larr; Back to Help
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
        Install on iPhone / iPad
      </h1>
      <p className="mt-2 text-gray-600">
        Adding the app to your Home Screen makes it open full-screen, like a
        normal app, and lets you turn on notifications.
      </p>

      <ol className="mt-8 space-y-5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">{step.title}</span>
              <span className="mt-1 block text-sm text-gray-600">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
