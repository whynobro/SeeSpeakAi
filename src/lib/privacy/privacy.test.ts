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
