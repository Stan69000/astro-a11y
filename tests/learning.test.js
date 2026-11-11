import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, lessonFor } from '../packages/core/src/pedagogy.js';
import { AXE_RULES } from '../packages/core/src/axe-rules.js';
import { KEYBOARD_RULES } from '../packages/core/src/keyboard.js';
import { criterionTitle } from '../packages/core/src/rgaa.js';
import { groupIssuesByRule } from '../packages/reporters/src/learning.js';
import { renderHtml } from '../packages/reporters/src/html.js';
import { renderMarkdown } from '../packages/reporters/src/markdown.js';

test('every criterion checked by astro-a11y has a lesson in English and French', () => {
  const criteria = new Set(
    [...Object.values(AXE_RULES), ...Object.values(KEYBOARD_RULES)].map((rule) => rule.rgaa)
  );
  for (const criterion of criteria) {
    for (const lang of ['en', 'fr']) {
      const lesson = lessonFor(criterion, lang);
      assert.ok(lesson, `missing lesson ${criterion} (${lang})`);
      assert.ok(
        lesson.who.length > 0 && lesson.tryIt.length > 10,
        `incomplete lesson ${criterion} (${lang})`
      );
    }
  }
  for (const criterion of Object.keys(LESSONS)) assert.ok(criterionTitle(criterion), criterion);
  assert.equal(lessonFor('manual-check'), undefined);
  assert.equal(lessonFor('1.1', 'de').tryIt, LESSONS['1.1'].en.tryIt);
});

const issue = (id, page, targets, severity, extra = {}) => ({
  id,
  page,
  severity,
  rgaa: '1.1',
  title: id,
  why: 'why',
  howToFix: 'fix',
  nodes: targets.map((target) => ({ target })),
  ...extra
});

test('groups issues by rule, most severe and most frequent first', () => {
  const groups = groupIssuesByRule([
    issue('image-alt', 'http://127.0.0.1:1/', ['img.a', 'img.b'], 'major'),
    issue('label', 'http://127.0.0.1:1/contact/', ['input'], 'critical'),
    issue('image-alt', 'http://127.0.0.1:1/blog/', ['img.c'], 'major'),
    issue('heading-order', 'http://127.0.0.1:1/', ['h3'], 'minor')
  ]);
  assert.deepEqual(
    groups.map((group) => group.id),
    ['label', 'image-alt', 'heading-order']
  );
  const images = groups[1];
  assert.equal(images.pages, 2);
  assert.equal(images.elements, 3);
  assert.deepEqual(images.occurrences, [
    { page: '/', targets: ['img.a', 'img.b'] },
    { page: '/blog/', targets: ['img.c'] }
  ]);
});

test('learning reports explain who is affected and list what already works', () => {
  const result = {
    target: '/dist',
    mode: 'learning',
    lang: 'fr',
    rgaaVersion: '4.1.2',
    generatedAt: '2026-01-01T00:00:00.000Z',
    summary: { pagesScanned: 2, issuesBySeverity: { critical: 0, major: 1, minor: 0, info: 0 } },
    issues: [
      issue('image-alt', 'http://x/', ['img'], 'major', {
        learn: lessonFor('1.1', 'fr'),
        title: 'Image sans alternative textuelle'
      })
    ],
    criteria: [
      { criterion: '1.1', title: criterionTitle('1.1'), outcome: 'failed', issues: 1, elements: 1 },
      { criterion: '8.5', title: criterionTitle('8.5'), outcome: 'passed', issues: 0, elements: 0 },
      {
        criterion: '12.7',
        title: criterionTitle('12.7'),
        outcome: 'review',
        issues: 0,
        elements: 0
      }
    ]
  };
  const markdown = renderMarkdown(result);
  assert.match(markdown, /Mode pédagogique/);
  assert.match(markdown, /### 1\. Image sans alternative textuelle \(majeur\)/);
  assert.match(markdown, /\*\*Qui est gêné\.\*\* Personnes aveugles/);
  assert.match(markdown, /\*\*Le constater soi-même\.\*\* Désactivez les images/);
  assert.match(markdown, /## Ce qui fonctionne déjà \(tests automatiques\)\n\n- \*\*8\.5\*\*/);
  assert.match(markdown, /## À vérifier à la main\n\n- \*\*12\.7\*\*/);

  const html = renderHtml(result);
  assert.match(html, /<dt>Qui est gêné<\/dt>/);
  assert.match(html, /Ce qui fonctionne déjà/);
  assert.doesNotMatch(html, /criteria-heading/, 'the full criteria table is replaced by the lists');
});

test('HTML tags in explanations stay visible in Markdown', () => {
  const result = {
    target: '/dist',
    mode: 'balanced',
    generatedAt: '2026-01-01T00:00:00.000Z',
    summary: { pagesScanned: 1, issuesBySeverity: { critical: 0, major: 1, minor: 0, info: 0 } },
    issues: [
      issue('marquee', 'http://x/', ['marquee'], 'major', {
        title: 'Scrolling text (<marquee>)',
        howToFix: 'Replace <marquee> with static text.'
      })
    ]
  };
  const markdown = renderMarkdown(result);
  assert.doesNotMatch(markdown, /<marquee>/);
  assert.match(markdown, /- Fix: Replace &lt;marquee&gt; with static text\./);
  assert.match(markdown, /\| Scrolling text \\\(&lt;marquee&gt;\\\) \|/);
  const learning = renderMarkdown({ ...result, mode: 'learning' });
  assert.doesNotMatch(learning, /<marquee>/);
});
