import { describe, expect, it } from 'vitest';
import { removeNames } from '@/lib/privacy';

describe('removeNames', () => {
  it('replaces capitalised words inside a sentence', () => {
    expect(removeNames('I want to talk with Maya and Mr Jones at school.')).toBe(
      'I want to talk with [name] and [name] [name] at school.',
    );
  });
  it('keeps the first word of each sentence, I, days and languages', () => {
    expect(removeNames("Presentations scare me. On Friday I'm talking in English.")).toBe(
      "Presentations scare me. On Friday I'm talking in English.",
    );
  });
  it('keeps possessive endings after a removed name', () => {
    expect(removeNames("my friend Sam's party")).toBe("my friend [name]'s party");
  });
  it('removes emails and phone numbers', () => {
    expect(removeNames('write me at kid.name+1@example.com or 555-123-4567')).toBe(
      'write me at [email] or [number]',
    );
  });
  it('leaves plain text alone', () => {
    expect(removeNames('people ask me to repeat "price" on calls')).toBe(
      'people ask me to repeat "price" on calls',
    );
  });
});

describe('removeNames on therapist report text', () => {
  // All text below is made up for tests. No real people.
  const report = [
    'Name: Testa Exampleton',
    'DOB: 03/14/2014',
    'Student: Pat Sample',
    '',
    'Evaluation notes for Testa Exampleton.',
    'Parent contact: parent@example.test, (555) 010-0199.',
    'Goal: produce /s/ in word-initial position with 80% accuracy.',
  ].join('\n');

  it('replaces label lines, emails and phone numbers', () => {
    const out = removeNames(report);
    expect(out).toContain('Name: [name]');
    expect(out).toContain('DOB: [date of birth]');
    expect(out).toContain('Student: [name]');
    expect(out).toContain('[email]');
    expect(out).toContain('[number]');
    expect(out).not.toMatch(/Testa|Exampleton|Pat Sample|2014|parent@/);
  });
  it('keeps the goal text', () => {
    expect(removeNames(report)).toContain('produce /s/ in word-initial position with 80% accuracy');
  });
  it('removes the label line for "Date of birth" and inline born dates', () => {
    expect(removeNames('Date of birth: March 3, 2015')).toBe('Date of birth: [date of birth]');
    expect(removeNames('She was born on 3/4/2015 and works on s.')).toBe(
      'She was [date of birth] and works on s.',
    );
  });
  it('removes a first and last name after patient, client or for, even at a sentence start', () => {
    expect(removeNames('Seen today. Patient Jordan Testwell needs help with sh.')).toBe(
      'Seen today. Patient [name] needs help with sh.',
    );
    expect(removeNames('A plan for Riley Placeholder this term.')).toBe('A plan for [name] this term.');
    expect(removeNames('Client Lee Fakename met the goal.')).toBe('Client [name] met the goal.');
  });
  it('removes extra names the caller passes, in any case, as whole words', () => {
    expect(removeNames('zed likes soccer. Ask ZED about it, not zedd.', ['Zed'])).toBe(
      '[name] likes soccer. Ask [name] about it, not zedd.',
    );
  });
  it('handles names with regex characters and blank extras', () => {
    expect(removeNames('Hello a.b (x)', ['a.b', ' ', ''])).toBe('Hello [name] (x)');
  });
});
