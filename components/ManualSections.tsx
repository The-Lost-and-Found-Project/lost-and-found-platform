import Link from "next/link";

export type ManualSection = {
  title: string;
  paragraphs: string[];
};

// Shared layout for all three manuals (member / prayer team / admin) so
// they stay visually consistent and only need their content passed in.
export default function ManualSections({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: ManualSection[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/help" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        &larr; Back to Help
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{intro}</p>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900">
              {section.title}
            </h2>
            <div className="mt-2 space-y-2">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-gray-600">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
