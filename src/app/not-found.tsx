import Link from "next/link";
export default function NotFound() {
  return (
    <main className="centered">
      <div>
        <h1>Page not available</h1>
        <p>This business page does not exist or is not published.</p>
        <Link className="button" href="/">
          Go home
        </Link>
      </div>
    </main>
  );
}
