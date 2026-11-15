/**
 * A headline whose words rise into place one after another, each from behind its own mask.
 * With reduced motion turned on, the text simply appears. Screen readers read it as one normal sentence.
 */
export function RisingText({
  text,
  delayMs = 0,
  stepMs = 60,
}: {
  text: string;
  delayMs?: number;
  stepMs?: number;
}) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span
              className="inline-block motion-safe:animate-word-rise"
              style={{ animationDelay: `${delayMs + i * stepMs}ms` }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}
