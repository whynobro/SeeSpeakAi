import { CheckCircleIcon, EarIcon, EyeIcon, SpeakIcon } from '@/components/Icons';
import { SECTION_TITLE } from '@/components/PageHeader';
import { Card, IconTile } from '@/components/ui';
import { LANDING } from '@/content/landing';

const WHO_ICONS = [SpeakIcon, EarIcon, EyeIcon];

/**
 * Home page sections under the start choices: who it is for, privacy, for parents and therapists, FAQ.
 * Section order and patterns from the design review (issue #59): one idea per block, big type, no
 * scroll effects. The FAQ uses native details/summary, so the whole row is the tap target.
 */
export function LandingSections() {
  return (
    <>
      <section aria-labelledby="who-heading" className="flex flex-col gap-4">
        <h2 id="who-heading" className={SECTION_TITLE}>
          {LANDING.whoTitle}
        </h2>
        <ul className="flex flex-col gap-3">
          {LANDING.who.map(({ title, body }, i) => {
            const Icon = WHO_ICONS[i % WHO_ICONS.length];
            return (
              <Card as="li" key={title} className="flex items-start gap-4">
                <IconTile tone="soft" size="sm">
                  <Icon className="h-5 w-5" />
                </IconTile>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-bold">{title}</span>
                  <span className="text-base leading-relaxed text-muted">{body}</span>
                </span>
              </Card>
            );
          })}
        </ul>
      </section>

      <Card as="section" tone="accent" aria-labelledby="privacy-heading" className="flex flex-col gap-3">
        <h2 id="privacy-heading" className={SECTION_TITLE}>
          {LANDING.privacyTitle}
        </h2>
        <ul className="flex flex-col gap-2">
          {LANDING.privacy.map((line) => (
            <li key={line} className="flex gap-3 text-lg leading-relaxed">
              <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-accent-edge" />
              {line}
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="pro-heading" className="flex flex-col gap-3">
        <h2 id="pro-heading" className={SECTION_TITLE}>
          {LANDING.proTitle}
        </h2>
        <ul className="flex flex-col gap-2">
          {LANDING.pro.map((line) => (
            <li key={line} className="flex gap-3 text-lg leading-relaxed">
              <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-accent-edge" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="flex flex-col gap-3">
        <h2 id="faq-heading" className={SECTION_TITLE}>
          {LANDING.faqTitle}
        </h2>
        {LANDING.faq.map(({ q, a }) => (
          <details key={q} className="group rounded-xl border border-line bg-surface">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-lg font-bold">
              {q}
              <span aria-hidden="true" className="text-2xl text-accent-edge group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-4 pb-4 text-lg leading-relaxed">{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
