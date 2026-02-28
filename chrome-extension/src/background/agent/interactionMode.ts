import type { InteractionMode } from './types';

const GUIDED_INTENT_PATTERNS: RegExp[] = [
  /\bwhere\b.*\b(find|locate|is|button|menu|setting|option|click)\b/i,
  /\bhow\s+(do|to)\s+i\b/i,
  /\bwhich\b.*\b(click|button|menu|option|setting)\b/i,
  /\bshow\s+me\s+(where|how)\b/i,
  /\bguide\s+me\b/i,
  /\bwalk\s+me\s+through\b/i,
  /\bstep[- ]by[- ]step\b/i,
];

const NON_GUIDED_HINTS: RegExp[] = [
  /\bresearch\b/i,
  /\bsummarize\b/i,
  /\bextract\b/i,
  /\banalyze\b/i,
  /\bcompare\b/i,
  /\bfind information\b/i,
];

export function detectInteractionMode(task: string): InteractionMode {
  const normalizedTask = task.trim();
  if (!normalizedTask) {
    return 'default';
  }

  if (NON_GUIDED_HINTS.some(pattern => pattern.test(normalizedTask))) {
    return 'default';
  }

  if (GUIDED_INTENT_PATTERNS.some(pattern => pattern.test(normalizedTask))) {
    return 'guided';
  }

  return 'default';
}
