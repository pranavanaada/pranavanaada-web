import { Link, Navigate, useParams } from 'react-router-dom';
import { useLang } from '../i18n/useLang';
import { useSeo } from '../lib/seo';
import SEO_PAGES from '../seo-pages.json';
import { findPolicy, POLICIES, POLICIES_UPDATED } from '../content/policies';

/** /policies/:slug — Returns & Refunds, Shipping, Cancellation, Terms, Privacy (see src/content/policies.ts). */
export default function Policy() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const policy = findPolicy(lang, slug);
  const path = `/policies/${slug}`;
  const seo = (SEO_PAGES as Record<string, { title: string; description: string }>)[path];
  useSeo(policy && seo ? { ...seo, path } : null);

  if (!policy) return <Navigate to="/policies/returns" replace />;

  const updated = new Date(`${POLICIES_UPDATED}T00:00:00`).toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-IN', {
    dateStyle: 'long',
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 md:py-16 grid md:grid-cols-[200px_1fr] gap-8 md:gap-12">
      {/* Other policies */}
      <nav aria-label={t('policies')} className="md:sticky md:top-24 self-start min-w-0">
        <div className="text-xs uppercase tracking-wider text-cream/40 mb-3">{t('policies')}</div>
        <ul className="flex md:flex-col gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {POLICIES[lang].map((p) => (
            <li key={p.slug} className="shrink-0">
              <Link
                to={`/policies/${p.slug}`}
                aria-current={p.slug === policy.slug ? 'page' : undefined}
                className={`block text-sm px-3 py-2 rounded-md border transition-colors ${
                  p.slug === policy.slug
                    ? 'border-gold/60 bg-gold/10 text-gold'
                    : 'border-emerald-800 text-cream/65 hover:text-gold hover:border-gold/40'
                }`}
              >
                {p.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="min-w-0">
        <h1 className="font-heading text-gold text-2xl md:text-3xl mb-2">{policy.title}</h1>
        <p className="text-xs text-cream/40 mb-8">{t('policyUpdated', { date: updated })}</p>
        {policy.intro && <p className="text-cream/80 leading-relaxed mb-8">{policy.intro}</p>}
        <div className="space-y-8">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-cream font-semibold text-lg mb-3">{s.heading}</h2>
              <div className="space-y-3 text-cream/70 leading-relaxed text-[15px]">
                {s.body.map((b, i) =>
                  Array.isArray(b) ? (
                    <ul key={i} className="space-y-2">
                      {b.map((li) => (
                        <li key={li} className="flex gap-3">
                          <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{b}</p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
