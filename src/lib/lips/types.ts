/** Lip measurements for one camera frame. Numbers only. */
export interface LipFrame {
  tMs: number;
  faceSeen: boolean;
  rounded: number;
  spread: number;
  jawOpen: number;
}

export type LipShape = 'spread' | 'rounded' | 'neutral' | 'unknown';

/** The lips over one try. This is the only thing that may ever leave the device. */
export interface LipSummary {
  frames: number;
  faceSeenShare: number; // 0 to 1
  rounded: number; // means over frames with a face, 0 to 1
  spread: number;
  jawOpen: number;
  roundedEnd: number; // means over the last third (where an end-of-word sound sits)
  spreadEnd: number;
  shape: LipShape; // overall call
  shapeEnd: LipShape;
}
