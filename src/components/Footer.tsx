export default function Footer() {
  return (
    <footer className="border-t border-card-border max-w-[900px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row justify-between items-center gap-3">
      <span className="font-mono text-[10px] text-dim tracking-wider">
        &copy; 2026 deadletter &middot; all letters anonymized
      </span>
      <span className="font-display text-[13px] italic text-dim">
        &ldquo;Some letters are meant to be lost.&rdquo;
      </span>
    </footer>
  );
}
