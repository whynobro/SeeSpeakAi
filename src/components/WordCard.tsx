import type { PracticeWord } from '@/lib/types';

/** Split the word so the target letters ("s", "sh", "z" or "ch") can be marked. */
function splitTarget(word: PracticeWord): { before: string; mark: string; after: string } {
  const text = word.text;
  const lower = text.toLowerCase();
  let index = -1;
  let length = 1;
  // The sound on its own ("sss", "shhh"): every letter is the sound.
  if (lower.length > 0 && [...lower].every((c) => word.target.includes(c))) {
    return { before: '', mark: text, after: '' };
  }
  if (word.target === 'sh' || word.target === 'ch') {
    length = 2;
    index = word.position === 'start' ? lower.indexOf(word.target) : lower.lastIndexOf(word.target);
  } else if (word.target === 'z') {
    // Spelled "z" ("zoo", "buzz") or with an "s" spoken as "z" ("dogs", "nose").
    const letter = lower.includes('z') ? 'z' : 's';
    index = word.position === 'start' ? lower.indexOf(letter) : lower.lastIndexOf(letter);
    if (letter === 'z' && lower.endsWith('zz') && word.position !== 'start') {
      index = lower.length - 2;
      length = 2;
    }
  } else if (word.position === 'start') {
    index = lower.indexOf('s');
  } else if (word.position === 'end') {
    index = lower.lastIndexOf('s');
  } else {
    // Middle: the first "s" after the first letter that is not part of "sh".
    for (let i = 1; i < lower.length; i++) {
      if (lower[i] === 's' && lower[i + 1] !== 'h') {
        index = i;
        break;
      }
    }
  }
  if (index < 0) return { before: text, mark: '', after: '' };
  return {
    before: text.slice(0, index),
    mark: text.slice(index, index + length),
    after: text.slice(index + length),
  };
}

export function WordCard({ word, showSign }: { word: PracticeWord; showSign: boolean }) {
  const { before, mark, after } = splitTarget(word);
  const sign = showSign ? word.sign : null;

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-5 text-center">
      <p className="text-6xl leading-tight font-bold tracking-wide break-words">
        {before}
        {mark && (
          <strong className="font-extrabold text-accent-edge underline decoration-accent decoration-[6px] underline-offset-[10px]">
            {mark}
          </strong>
        )}
        {after}
      </p>
      {word.baseWord && (
        <p className="mt-2 text-xl text-muted">
          {word.baseWord} → {word.text}
        </p>
      )}
      {sign && (
        <div className="mt-4 border-t-2 border-line pt-4 text-left">
          {sign.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sign.imageUrl} alt={`Sign for ${sign.gloss}`} className="mx-auto max-h-48" />
          )}
          <p className="mt-2 font-bold">Sign: {sign.gloss}</p>
          <p className="text-sm text-muted">Source: {sign.credit}</p>
          {!sign.reviewed && <p className="text-sm font-bold">Not yet reviewed by a signer.</p>}
        </div>
      )}
    </div>
  );
}
