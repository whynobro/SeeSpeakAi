import type { PlanStep, PracticePlan } from '@/lib/types';
import { isTargetSound } from '@/lib/scoring/constants';
import { CheckCircleIcon, ClipboardIcon, EyeIcon, SparkleIcon } from './Icons';
import { Button, Card, IconTile } from './ui';

/** One sound in the plan. Scored sounds get a practice button; other sounds are "show how, no score". */
function StepCard({
  step,
  index,
  first,
  planId,
}: {
  step: PlanStep;
  index: number;
  first: boolean;
  planId: string;
}) {
  const preview = step.words
    .slice(0, 4)
    .map((w) => w.text)
    .join(', ');
  return (
    <Card
      as="li"
      highlight={first}
      className="flex flex-col gap-4 motion-safe:animate-rise"
      style={{ animationDelay: `${450 + index * 120}ms` }}
    >
      <div className="flex items-start gap-4">
        <IconTile tone={step.scored ? 'accent' : 'violet-soft'} size="lg" className="text-2xl font-extrabold">
          {step.sound}
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-bold text-muted">Step {index + 1}</p>
          <h3 className="text-xl font-bold">The &ldquo;{step.sound}&rdquo; sound</h3>
          {step.scored ? (
            <p className="inline-flex items-center gap-1.5 text-base font-bold text-hit-strong">
              <CheckCircleIcon className="h-5 w-5" />
              The app checks this sound
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-base font-bold text-violet-edge">
              <EyeIcon className="h-5 w-5" />
              Show how, no score
            </p>
          )}
        </div>
      </div>
      <p className="text-lg leading-relaxed">{step.why}</p>
      <div className="flex flex-col gap-1 rounded-2xl bg-accent-soft p-4">
        <p className="text-sm font-bold text-accent-edge">Goal</p>
        <p className="text-lg">{step.goal}</p>
        {preview && <p className="pt-1 text-base text-muted">Words: {preview}</p>}
      </div>
      {step.scored && isTargetSound(step.sound) && (
        <Button
          href={`/practice?sound=${step.sound}&plan=${encodeURIComponent(planId)}&step=${index}`}
          variant={first ? 'primary' : 'secondary'}
        >
          {first ? 'Start practicing' : `Practice "${step.sound}"`}
        </Button>
      )}
    </Card>
  );
}

/** The curated plan from POST /api/plan: a short summary, then one card per sound. */
export function PlanView({ plan }: { plan: PracticePlan }) {
  const firstScored = plan.steps.findIndex((s) => s.scored);
  return (
    <div className="flex flex-col gap-6">
      <Card tone="accent" className="flex flex-col gap-2 motion-safe:animate-wipe-in">
        {/* Honest source label: "Made by Claude" only when the AI really made it. Word plus icon. */}
        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-accent-edge">
          {plan.source === 'ai' ? (
            <>
              <SparkleIcon className="h-4 w-4" />
              Made by Claude
            </>
          ) : (
            <>
              <ClipboardIcon className="h-4 w-4" />
              Built-in plan
            </>
          )}
        </p>
        <p className="text-lg leading-relaxed">{plan.summary}</p>
      </Card>
      <ol className="flex flex-col gap-5">
        {plan.steps.map((step, i) => (
          <StepCard key={step.sound} step={step} index={i} first={i === firstScored} planId={plan.id} />
        ))}
      </ol>
    </div>
  );
}
