import Link from "next/link";

export default function InstallAndroidPage() {
  const steps = [
    {
      title: "Open the app in Chrome",
      body: "Installing works best in Chrome, which comes on most Android phones by default.",
    },
    {
      title: "Tap the menu button",
      body: "It's the three dots in the top-right corner of the browser.",
    },
    {
      title: "Tap “Install app” or “Add to Home screen”",
      body: "The exact wording depends on your phone and Chrome version.",
    },
    {
      title: "Tap “Install” to confirm",
      body: "The app icon will be added to your Home Screen and app drawer, just like any other app. Open it from there from now on.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/help" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        &larr; Back to Help
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
        Install on Android
      </h1>
      <p className="mt-2 text-gray-600">
        Installing the app makes it open full-screen, like a normal app, and
        lets you turn on notifications (including the little red unread
        badge on the icon).
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
