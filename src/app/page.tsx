import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <section>
        <span className="eyebrow">For local service businesses</span>
        <h1>One link. Every useful next action.</h1>
        <p>
          Give customers a focused way to call, request a quote, check service
          details, and trust your business—without building a website.
        </p>
        <div className="actions">
          <Link className="button" href="/signup">
            Build your toolkit
          </Link>
          <Link className="button secondary" href="/login">
            Log in
          </Link>
        </div>
      </section>
      <aside className="preview">
        <span>ABC Plumbing</span>
        <strong>How can we help?</strong>
        <div>Get a Quote</div>
        <div>Emergency Call</div>
        <div>Check Service Area</div>
      </aside>
    </main>
  );
}
