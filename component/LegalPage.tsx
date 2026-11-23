// component/LegalPage.tsx
// The privacy policy and the terms (lib/legal.ts), as a plain readable page.
import { Link } from '@/i18n/navigation';
import { LEGAL_CONTACT, type LegalDocument } from '@/lib/legal';

export default function LegalPage({ doc, other }: { doc: LegalDocument; other: { href: string; label: string } }) {
  return (
    <main className="bg-canvas px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
      <article className="border-line bg-surface rounded-card mx-auto max-w-3xl border p-6 shadow-sm sm:p-10">
        <header className="border-line border-b pb-6">
          <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{doc.title}</h1>
          <p className="text-muted mt-2 text-sm">{doc.updated}</p>
          <p className="text-body mt-4 leading-8">{doc.intro}</p>
        </header>

        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-ink text-lg font-extrabold">{section.heading}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text} className="text-body mt-3 leading-8">
                {withEmailLink(text)}
              </p>
            ))}
            {section.points && (
              <ul className="text-body marker:text-brand mt-3 list-disc space-y-2 ps-5 leading-8">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <footer className="border-line text-muted mt-10 border-t pt-6 text-sm">
          <Link href={other.href} className="text-brand font-bold hover:underline">
            {other.label}
          </Link>
        </footer>
      </article>
    </main>
  );
}

/** The contact address as a mailto link wherever it appears in the text. */
function withEmailLink(text: string) {
  const at = text.indexOf(LEGAL_CONTACT);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <a href={`mailto:${LEGAL_CONTACT}`} dir="ltr" className="text-brand font-bold hover:underline">
        {LEGAL_CONTACT}
      </a>
      {text.slice(at + LEGAL_CONTACT.length)}
    </>
  );
}
