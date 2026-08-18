import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="emmaus-title">
        <p className="eyebrow">The Lost and Found Project</p>
        <h1 id="emmaus-title">Emmaus</h1>
        <p className="lede">
          Scripture reading, guided discovery, and deeper study in one focused place.
        </p>
        <div className="actions">
          <Link className="primary-action" href="/login?next=/study">
            Sign in to Emmaus
          </Link>
        </div>
        <p className="status">
          Standalone migration checkpoint. Authentication is isolated; Bible and discovery features are next.
        </p>
      </section>
    </main>
  );
}
