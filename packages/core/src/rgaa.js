/**
 * RGAA reference shared with rgaa-audit (https://github.com/Stan69000/rgaa-audit):
 * version, topics and official titles of the 106 criteria, generated from the
 * DINUM source. `rgaa-criteria.cjs` is a byte-for-byte copy of rgaa-audit's
 * extension/shared/rgaa-criteria.js: update it with
 * `node scripts/sync-rgaa-reference.js`, never by hand.
 */
import reference from './rgaa-criteria.cjs';

export const RGAA_VERSION = reference.RGAA_VERSION;
export const RGAA_TOPICS = Object.freeze({ ...reference.RGAA_TOPICS });
export const RGAA_CRITERIA = Object.freeze({ ...reference.RGAA_CRITERIA });

/** Official title of a criterion ("1.1"), or undefined when it does not exist. */
export function criterionTitle(criterion) {
  return RGAA_CRITERIA[criterion];
}

/** Topic name of a criterion ("1.1" → "Images"), or undefined. */
export function criterionTopic(criterion) {
  const topic = String(criterion).split('.')[0];
  return criterionTitle(criterion) ? RGAA_TOPICS[topic] : undefined;
}
