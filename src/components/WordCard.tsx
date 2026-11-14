import type { PracticeWord } from '@/lib/types';

/** Split the word so the target letters ("s" or "sh") can be marked. */
function splitTarget(word: PracticeWord): { before: string; mark: string; after: string } {
  const text = word.text;
  const lower = text.toLowerCase();
  let index = -1;
  if (word.target === 'sh') {
    index = word.position === 'start' ? lower.indexOf('sh') : lower.lastIndexOf('sh');
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
  const length = word.target === 'sh' ? 2 : 1;
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
    <div className="rounded-2xl border-2 border-current p-6 text-center">
      <p className="text-6xl tracking-wide">
        {before}
        {mark && <strong className="font-extrabold underline decoration-4 underline-offset-8">{mark}</strong>}
        {after}
      </p>
      {word.baseWord && (
        <p className="mt-3 text-xl">
          {word.baseWord} → {word.text}
        </p>
      )}
      {sign && (
        <div className="mt-4 border-t border-current/30 pt-4 text-left">
          {sign.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sign.imageUrl} alt={`Sign for ${sign.gloss}`} className="mx-auto max-h-48" />
          )}
          <p className="mt-2 font-bold">Sign: {sign.gloss}</p>
          <p className="text-sm">Source: {sign.credit}</p>
          {!sign.reviewed && <p className="text-sm font-bold">Not yet reviewed by a signer.</p>}
        </div>
      )}
    </div>
  );
}
