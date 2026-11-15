'use client';

import { CheckCircleIcon } from '@/components/Icons';
import { Card } from '@/components/ui';
import { CHECK_COPY, type CheckAge, GOAL_CHIPS } from '@/content/checks';
import { removeNames } from '@/lib/privacy';
import type { LearnerGoals } from '@/lib/types';

/**
 * "What do you want to work on?": quick-tap chips plus free text. Shows the text exactly as it will be sent,
 * with names already removed on the device. The parent owns the state and does the sending.
 */
export function GoalsBox({
  age,
  goals,
  onChange,
}: {
  age: CheckAge;
  goals: LearnerGoals;
  onChange: (next: LearnerGoals) => void;
}) {
  const cleaned = removeNames(goals.text);
  const toggle = (chip: string) =>
    onChange({
      ...goals,
      chips: goals.chips.includes(chip) ? goals.chips.filter((c) => c !== chip) : [...goals.chips, chip],
    });

  return (
    <section aria-labelledby="goals-heading" className="flex flex-col gap-4">
      <h2 id="goals-heading" className="text-2xl font-bold">
        {CHECK_COPY.goalsTitle}
      </h2>
      <p className="text-lg text-muted">{CHECK_COPY.goalsIntro}</p>
      <div className="flex flex-wrap gap-2">
        {GOAL_CHIPS[age].map((chip) => {
          const on = goals.chips.includes(chip);
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(chip)}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-base font-bold transition-[transform,box-shadow] duration-75 active:translate-y-0.5 ${
                on
                  ? 'border-2 border-accent bg-accent-soft text-accent-edge'
                  : 'border border-line bg-surface text-foreground'
              }`}
            >
              {on && <CheckCircleIcon className="h-5 w-5" />}
              {chip}
            </button>
          );
        })}
      </div>
      <label htmlFor="goals-text" className="text-lg font-bold">
        {CHECK_COPY.goalsLabel}
      </label>
      <textarea
        id="goals-text"
        rows={5}
        value={goals.text}
        onChange={(e) => onChange({ ...goals, text: e.target.value })}
        placeholder={CHECK_COPY.goalsPlaceholder}
        className="w-full rounded-xl border border-line bg-surface p-4 text-lg leading-relaxed"
      />
      <p className="text-base text-muted">{CHECK_COPY.goalsNoNames}</p>
      {cleaned.trim() !== '' && cleaned !== goals.text && (
        <Card tone="accent" className="flex flex-col gap-1">
          <p className="text-base font-bold text-accent-edge">This is what will be sent</p>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{cleaned}</p>
        </Card>
      )}
    </section>
  );
}
