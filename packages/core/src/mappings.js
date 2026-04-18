/**
 * @typedef {Object} RgaaMapping
 * @property {string} rgaa
 * @property {"critical"|"major"|"minor"|"info"} severity
 * @property {string} title
 * @property {string} why
 * @property {string} howToFix
 * @property {string} [before]
 * @property {string} [after]
 */

/**
 * @type {Object.<string, RgaaMapping>}
 */
const AXE_TO_RGAA = {
  'image-alt': {
    rgaa: '1.1',
    severity: 'major',
    title: 'Alternative text missing on image',
    why: 'Screen reader users cannot understand the purpose of the image.',
    howToFix: 'Add a meaningful alt attribute, or alt="" for decorative images.',
    before: '<img src="/team.jpg">',
    after: '<img src="/team.jpg" alt="Team gathered in the Lyon office">'
  },
  'input-image-alt': {
    rgaa: '1.2',
    severity: 'major',
    title: 'Image button missing alternative text',
    why: 'Screen reader users cannot understand the function of the image button.',
    howToFix: 'Add an alt attribute describing the button action.',
    before: '<input type="image" src="submit.png">',
    after: '<input type="image" src="submit.png" alt="Submit form">'
  },
  'button-name': {
    rgaa: '11.9',
    severity: 'critical',
    title: 'Button has no accessible name',
    why: 'Assistive technologies cannot announce the purpose of the button.',
    howToFix: 'Add visible text, aria-label, or an accessible name linked to the button.',
    before: '<button><svg aria-hidden="true"></svg></button>',
    after: '<button aria-label="Close dialog"><svg aria-hidden="true"></svg></button>'
  },
  'link-name': {
    rgaa: '6.1',
    severity: 'critical',
    title: 'Link has no accessible name',
    why: 'Users navigating links cannot understand where the link leads.',
    howToFix: 'Ensure the link has visible text or an accessible name.',
    before: '<a href="/pricing"><svg aria-hidden="true"></svg></a>',
    after: '<a href="/pricing" aria-label="See pricing"><svg aria-hidden="true"></svg></a>'
  },
  label: {
    rgaa: '11.1',
    severity: 'critical',
    title: 'Form control is missing a label',
    why: 'Form fields without labels are difficult or impossible to understand with assistive technologies.',
    howToFix: 'Associate a visible or programmatic label with each form control.',
    before: '<input id="email" type="email">',
    after: '<label for="email">Email</label><input id="email" type="email">'
  },
  'color-contrast': {
    rgaa: '3.2',
    severity: 'major',
    title: 'Insufficient color contrast',
    why: 'Low contrast makes text difficult to read for many users, including people with low vision.',
    howToFix: 'Increase the contrast ratio between foreground and background colors.',
    before: '.muted { color: #777; background: #888; }',
    after: '.muted { color: #1f2937; background: #ffffff; }'
  },
  'frame-title': {
    rgaa: '2.1',
    severity: 'major',
    title: 'Iframe has no title',
    why: 'Users need a clear title to understand embedded content.',
    howToFix: 'Add a concise and meaningful title attribute to the iframe.',
    before: '<iframe src="https://example.com/embed"></iframe>',
    after: '<iframe src="https://example.com/embed" title="Video player"></iframe>'
  },
  'html-has-lang': {
    rgaa: '8.3',
    severity: 'major',
    title: 'HTML element has no lang attribute',
    why: 'Assistive technologies need the page language to pronounce content correctly.',
    howToFix: 'Set the lang attribute on the root html element.',
    before: '<html>',
    after: '<html lang="fr">'
  },
  'html-lang-valid': {
    rgaa: '8.4',
    severity: 'major',
    title: 'Language attribute has invalid value',
    why: 'Screen readers may fail to detect the language correctly.',
    howToFix: 'Use a valid BCP 47 language code.',
    before: '<html lang="xx">',
    after: '<html lang="fr">'
  },
  'document-title': {
    rgaa: '8.5',
    severity: 'major',
    title: 'Document has no title',
    why: 'A meaningful page title helps users understand where they are.',
    howToFix: 'Ensure each page has a descriptive title element.',
    before: '<title></title>',
    after: '<title>Contact – Example Company</title>'
  },
  bypass: {
    rgaa: '12.7',
    severity: 'major',
    title: 'No bypass block / skip link',
    why: 'Keyboard users should be able to skip repeated content blocks.',
    howToFix: 'Add a visible-on-focus skip link targeting the main content.',
    before: '<body>...</body>',
    after: '<a class="skip-link" href="#main">Skip to content</a>'
  },
  list: {
    rgaa: '9.3',
    severity: 'minor',
    title: 'List structure is invalid',
    why: 'Improper list markup reduces structural comprehension for assistive technologies.',
    howToFix: 'Use ul/ol with only li children and keep semantic structure intact.',
    before: '<ul><div>Item</div></ul>',
    after: '<ul><li>Item</li></ul>'
  },
  dlitem: {
    rgaa: '9.4',
    severity: 'minor',
    title: 'Definition list item not wrapped in dt or dd',
    why: 'Definition list must use proper dt/dd elements.',
    howToFix: 'Wrap each term in <dt> and each definition in <dd>.',
    before: '<dl><span>Term</span><span>Definition</span></dl>',
    after: '<dl><dt>Term</dt><dd>Definition</dd></dl>'
  },
  'aria-valid-attr': {
    rgaa: '5.1',
    severity: 'critical',
    title: 'Invalid ARIA attribute',
    why: 'Invalid ARIA attributes are ignored by assistive technologies.',
    howToFix: 'Use only valid ARIA attribute names.',
    before: '<div role="button" aria-valu="">Click</div>',
    after: '<div role="button" aria-label="Click">Click</div>'
  },
  'aria-roles': {
    rgaa: '5.2',
    severity: 'critical',
    title: 'Invalid ARIA role',
    why: 'Invalid or abstract roles confuse assistive technologies.',
    howToFix: 'Use valid roles from the ARIA specification.',
    before: '<div role="invalid-role">Content</div>',
    after: '<div role="region" aria-label="Content">Content</div>'
  },
  'focus-order-semantics': {
    rgaa: '7.2',
    severity: 'major',
    title: 'Interactive elements have no accessible name',
    why: 'Focusable elements without accessible names cannot be understood by screen readers.',
    howToFix: 'Add text content, aria-label, or aria-labelledby to the element.',
    before: '<div tabindex="0">Action</div>',
    after: '<button>Action</button>'
  },
  region: {
    rgaa: '12.2',
    severity: 'major',
    title: 'Page regions not identified',
    why: 'Screen reader users need landmarks to navigate the page.',
    howToFix: 'Use HTML5 elements (header, nav, main, footer) or ARIA landmark roles.',
    before: '<div class="header">...</div>',
    after: '<header>...</header>'
  }
};

export const RGAA_VERSION = '4.1';

export function mapAxeToRgaa(ruleId) {
  return (
    AXE_TO_RGAA[ruleId] ?? {
      rgaa: 'manual-check',
      severity: 'major',
      title: 'Accessibility issue detected',
      why: 'An accessibility engine detected a potential issue that should be reviewed.',
      howToFix:
        'Review the affected element and validate the fix with keyboard and assistive technology testing.'
    }
  );
}

export function enrichViolation(violation, page, mode) {
  const mapping = mapAxeToRgaa(violation.id);
  return {
    id: violation.id,
    rgaa: mapping.rgaa,
    page,
    severity: mapping.severity,
    title: mapping.title,
    why: mapping.why,
    howToFix: mapping.howToFix,
    nodes: violation.nodes.map((node) => ({
      target: Array.isArray(node.target) ? node.target.join(' ') : String(node.target ?? ''),
      html: node.html ?? '',
      failureSummary: node.failureSummary ?? ''
    })),
    help: violation.help,
    helpUrl: violation.helpUrl,
    mode,
    before: mapping.before,
    after: mapping.after
  };
}
