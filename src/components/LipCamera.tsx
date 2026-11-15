import type { ReactNode, RefObject } from 'react';
import { frameShape } from '@/lib/lips/features';
import type { LipTrackerStatus } from '@/hooks/useLipTracker';
import type { LipFrame, LipShape, LipSummary } from '@/lib/lips/types';
import type { TargetSound } from '@/lib/types';
import { MouthPictures } from './MouthPictures';
import { Card } from './ui';

/*
 * The optional lip camera on the practice screen: a switch (off by default), a big mirrored preview with a badge
 * on it for the lips right now, and the lips for the try that just ended. The picture never leaves the device: only
 * lip numbers are used, for a tip after the try. If the camera fails, practice carries on with voice only.
 * To restyle: change the classes here. The logic lives in `useLipCamera`, so nothing else needs to move.
 */

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function CameraIcon() {
  return (
    <Svg>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Svg>
  );
}
/** A wide smile: lips pulled back. */
function SmileIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 14c1.2 2 2.7 3 4.5 3s3.3-1 4.5-3" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </Svg>
  );
}
/** A small round "o" mouth: lips rounded and forward. */
function RoundLipsIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="15.5" rx="2" ry="2.5" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </Svg>
  );
}

/** The words for each shape. Always a word and an icon, never color alone. */
const SHAPE_LABEL: Record<LipShape, { text: string; icon: ReactNode }> = {
  spread: { text: 'Lips: smile', icon: <SmileIcon /> },
  rounded: { text: 'Lips: round', icon: <RoundLipsIcon /> },
  neutral: { text: 'Lips: in between', icon: <CameraIcon /> },
  unknown: { text: 'No face seen', icon: <CameraIcon /> },
};

export function LipBadge({ shape, className = '' }: { shape: LipShape; className?: string }) {
  const { text, icon } = SHAPE_LABEL[shape];
  return (
    <p
      className={`flex items-center gap-2 rounded-xl border border-line bg-accent-soft px-3 py-2 text-lg font-bold ${className}`}
    >
      {icon}
      <span>{text}</span>
    </p>
  );
}

const PRIVACY =
  'The camera stays on your phone. Only lip numbers, like "lips rounded", are used for the tip.';

export function LipCamera({
  enabled,
  onEnabledChange,
  status,
  error,
  latest,
  videoRef,
  target,
  lastTry,
}: {
  enabled: boolean;
  onEnabledChange: (on: boolean) => void;
  status: LipTrackerStatus;
  error: string | null;
  /** The newest camera frame, for the live badge. */
  latest: LipFrame | null;
  /** Attach to the preview video. It stays mounted even while the camera is off. */
  videoRef: RefObject<HTMLVideoElement | null>;
  target: TargetSound;
  /** The lips over the try that just ended, or null. */
  lastTry: LipSummary | null;
}) {
  const watching = status === 'watching';
  const starting = enabled && status === 'starting';
  const failed = enabled && status === 'error';
  const live = frameShape(latest);

  return (
    <Card className="flex flex-col gap-2 p-4">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg font-bold">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-6 w-6 shrink-0 accent-accent-edge"
        />
        <CameraIcon />
        Use camera for lip tips
      </label>
      <p className="text-sm text-muted">
        Optional. {PRIVACY} {enabled ? '' : 'Voice alone works fine.'}
      </p>

      {starting && <p className="text-base font-bold">Starting the camera...</p>}
      {failed && (
        <p role="status" className="rounded-xl border-2 border-dashed border-miss p-3 text-base font-bold">
          Camera off, voice only. {error}
        </p>
      )}

      {/* Always mounted, so the camera can attach to it. Hidden until it is watching. */}
      <div className={watching ? 'mt-1 flex flex-col gap-3' : 'hidden'}>
        <div className="relative overflow-hidden rounded-xl border border-line bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Camera preview, mirrored. It stays on this device."
            className="block aspect-[4/3] w-full -scale-x-100 object-cover"
          />
          <LipBadge shape={live} className="absolute bottom-2 left-2 py-1.5 text-base shadow-sm" />
        </div>
        {/* One compact row: the small picture, then the label and what the picture shows. */}
        <MouthPictures sound={target} only="front" label="Aim for this look" />
        {/* Polite live region: said once per try, not 10 times a second. */}
        <div aria-live="polite" className="empty:hidden">
          {watching && lastTry && (
            <p className="text-base">
              {lastTry.shape === 'unknown'
                ? 'No face seen in that try, so no lip tip. Voice still counts.'
                : `This try: ${SHAPE_LABEL[lastTry.shape].text.replace('Lips: ', 'lips ')}.`}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
