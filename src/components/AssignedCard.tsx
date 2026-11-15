'use client';

import { useEffect, useState } from 'react';
import { ASSIGN } from '@/content/therapist';
import { levelById } from '@/lib/levels';
import {
  assignmentStartHref,
  loadAssignment,
  quotedSounds,
  scoredSounds,
  type Assignment,
} from './assignmentStore';
import { Button, Card } from './ui';

/** Home: the practice a speech therapist set with a link. Shows nothing until one is saved on this device. */
export function AssignedCard() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  // Saved data is read after the page is on screen, never during render.
  useEffect(() => {
    const id = setTimeout(() => setAssignment(loadAssignment()), 0);
    return () => clearTimeout(id);
  }, []);

  if (!assignment) return null;
  const level = levelById(assignment.level);
  const canScore = scoredSounds(assignment).length > 0;

  return (
    <Card as="section" highlight aria-labelledby="assigned-heading" className="flex flex-col gap-3">
      <h2 id="assigned-heading" className="text-[15px] font-bold text-accent-edge">
        {ASSIGN.cardTitle}
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-[20px] leading-snug font-bold">{quotedSounds(assignment.sounds)}</p>
        <p className="text-[15px] text-muted">
          {ASSIGN.level(level.number, level.title)}
          {assignment.days !== null && ` · ${ASSIGN.days(assignment.days)}`}
        </p>
      </div>
      <Button href={assignmentStartHref(assignment)}>
        {canScore ? ASSIGN.cardStart : ASSIGN.cardOpenPlan}
      </Button>
    </Card>
  );
}
