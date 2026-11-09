import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>That short link doesn&rsquo;t exist</h1>
      <p>It may have been mistyped, or it was never created.</p>
      <Link href="/">Shorten a link</Link>
    </main>
  );
}
