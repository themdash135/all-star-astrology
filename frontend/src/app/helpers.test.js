import test from 'node:test';
import assert from 'node:assert/strict';

import {
  areaExplanation,
  buildShareText,
  getDailyContent,
  getTimeGreeting,
  generateCosmicMessage,
  mergeOracleHistory,
  splitAnswerSentences,
  transliterate,
} from './helpers.js';

const sampleResult = {
  combined: {
    probabilities: {
      love: {
        value: 72,
        confidence: 81,
        sentiment: 'positive',
        agreeing_systems: ['Western', 'Vedic', 'BaZi', 'Chinese'],
        leaders: [{ name: 'Western', value: 78 }],
      },
      career: {
        value: 44,
        confidence: 55,
        sentiment: 'challenging',
        agreeing_systems: ['Western', 'Persian'],
        leaders: [{ name: 'Persian', value: 51 }],
      },
    },
  },
};

test('transliterate maps Latin text to Hebrew characters', () => {
  assert.equal(transliterate('shalom'), '\u05e9\u05d0\u05dc\u05e2\u05de');
});

test('generateCosmicMessage returns the top-area message', () => {
  const message = generateCosmicMessage(sampleResult);
  assert.match(message, /love energy/i);
  assert.match(message, /4 of 8 systems/i);
});

test('getDailyContent prefers the backend daily block when present', () => {
  const content = getDailyContent({
    ...sampleResult,
    daily: {
      date_label: 'Thursday, March 12',
      message: 'Love carries the clearest momentum today.',
      dos: ['Do one', 'Do two', 'Do three'],
      donts: ['Dont one', 'Dont two', 'Dont three'],
      focus: { area: 'love' },
      caution: { area: 'career' },
    },
  });

  assert.equal(content.dateLabel, 'Thursday, March 12');
  assert.equal(content.message, 'Love carries the clearest momentum today.');
  assert.deepEqual(content.dos, ['Do one', 'Do two', 'Do three']);
  assert.equal(content.source, 'backend');
  assert.equal(content.focus.area, 'love');
});

test('getTimeGreeting switches with the local hour and uses first name only', () => {
  assert.equal(getTimeGreeting('Jane Doe', new Date('2026-03-12T09:00:00')), 'Good morning, Jane');
  assert.equal(getTimeGreeting('Jane Doe', new Date('2026-03-12T15:00:00')), 'Good afternoon, Jane');
  assert.equal(getTimeGreeting('Jane Doe', new Date('2026-03-12T20:00:00')), 'Good evening, Jane');
});

test('areaExplanation includes sentiment framing and leader detail', () => {
  const explanation = areaExplanation(sampleResult, 'love');
  assert.match(explanation, /support/i);
  assert.match(explanation, /Western leads at 78%/);
});

test('splitAnswerSentences preserves sentence order', () => {
  assert.deepEqual(splitAnswerSentences('One. Two? Three!'), ['One.', 'Two?', 'Three!']);
});

test('buildShareText formats a shareable oracle block', () => {
  assert.equal(buildShareText('Will it work?', 'Yes.'), '"Will it work?"\n\nYes.\n\n- All Star Astrology');
});

test('mergeOracleHistory prepends, deduplicates, and caps entries', () => {
  const existing = [
    { q: 'One?', a: 'A' },
    { q: 'Two?', a: 'B' },
    { q: 'One?', a: 'A' },
  ];

  assert.deepEqual(
    mergeOracleHistory(existing, { q: 'Three?', a: 'C' }, 3),
    [
      { q: 'Three?', a: 'C' },
      { q: 'One?', a: 'A' },
      { q: 'Two?', a: 'B' },
    ],
  );
});
