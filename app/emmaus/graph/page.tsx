import KnowledgeGraphSearch from "@/components/emmaus/KnowledgeGraphSearch";

export default function EmmausKnowledgeGraphPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <KnowledgeGraphSearch />
      </div>
    </main>
  );
}
