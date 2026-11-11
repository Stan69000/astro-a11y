/* global window, document, Node -- callbacks passed to page.evaluate run in the browser */
/**
 * Keyboard checks that axe-core cannot do, because they need real key presses:
 *
 * - keyboard-trap (RGAA 12.9): Tab keeps cycling through a few elements and
 *   never reaches the rest of the page.
 * - keyboard-focus-visible (RGAA 10.7): an element receives keyboard focus without any
 *   visible change (no outline, no style difference).
 * - keyboard-skip-link (RGAA 12.7): the first focusable element is an in-page link whose
 *   target is missing, or that does not move keyboard navigation to its target.
 *
 * They complement a manual audit: a visible focus can still be too faint, and
 * a coherent tab order (RGAA 12.8) needs a human judgement.
 */

import { criterionTitle } from './rgaa.js';

export const KEYBOARD_RULES = Object.freeze({
  'keyboard-trap': {
    rgaa: '12.9',
    severity: 'critical',
    en: {
      title: 'Keyboard trap',
      why: 'Keyboard users get stuck: pressing Tab never reaches the rest of the page.',
      howToFix:
        'Let Tab and Shift+Tab leave the component. For modal dialogs, trap focus only while the dialog is open and close it with Escape.',
      help: 'Focus must be able to move away from every element with the Tab key.'
    },
    fr: {
      title: 'Piège au clavier',
      why: 'Au clavier, on reste bloqué : la touche Tab n’atteint jamais le reste de la page.',
      howToFix:
        'Laisser Tab et Maj+Tab sortir du composant. Pour une fenêtre modale, ne retenir le focus que pendant qu’elle est ouverte, et la fermer avec Échap.',
      help: 'Le focus doit toujours pouvoir quitter un élément avec la touche Tab.'
    }
  },
  'keyboard-focus-visible': {
    rgaa: '10.7',
    severity: 'minor',
    en: {
      title: 'Keyboard focus is not visible',
      why: 'Sighted keyboard users cannot see which element they are on.',
      howToFix:
        'Do not remove the browser outline without a replacement: add a :focus-visible style (outline, border or background change) with enough contrast. Check the result manually.',
      help: 'Every element that receives keyboard focus must show a visible focus indicator.'
    },
    fr: {
      title: 'Focus clavier invisible',
      why: 'En naviguant au clavier, on ne voit pas sur quel élément on se trouve.',
      howToFix:
        'Ne pas supprimer le contour du navigateur sans le remplacer : ajouter un style :focus-visible (contour, bordure ou fond) bien contrasté. Vérifier le résultat à l’œil.',
      help: 'Chaque élément qui reçoit le focus clavier doit le montrer visiblement.'
    },
    before: 'a:focus { outline: none; }',
    after: 'a:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }'
  },
  'keyboard-skip-link': {
    rgaa: '12.7',
    severity: 'major',
    en: {
      title: 'Skip link does not work',
      why: 'Keyboard users must go through every navigation link again to reach the content.',
      howToFix:
        'Point the skip link to the id of the main content (e.g. href="#main" and <main id="main" tabindex="-1">) and do not cancel the link with JavaScript.',
      help: 'A link at the top of the page must take keyboard navigation to the main content.'
    },
    fr: {
      title: 'Lien d’évitement inopérant',
      why: 'Au clavier, il faut retraverser tous les liens de navigation pour atteindre le contenu.',
      howToFix:
        'Faire pointer le lien vers l’id du contenu principal (href="#contenu" et <main id="contenu" tabindex="-1">) et ne pas l’annuler en JavaScript.',
      help: 'Un lien en haut de page doit emmener la navigation clavier au contenu principal.'
    },
    before: '<a href="#contenu">Aller au contenu</a> … <main>',
    after: '<a href="#contenu">Aller au contenu</a> … <main id="contenu" tabindex="-1">'
  }
});

const MESSAGES = {
  en: {
    trap: (count) =>
      `Tab cycles between ${count} element(s) and never reaches the rest of the page.`,
    invisible: 'No outline and no style change when the element receives keyboard focus.',
    missingTarget: (id) => `No element with id "${id}".`,
    notMoved: 'After activating the link, Tab does not continue from its target.'
  },
  fr: {
    trap: (count) => `Tab tourne entre ${count} élément(s) sans atteindre le reste de la page.`,
    invisible: 'Ni contour ni changement de style quand l’élément reçoit le focus clavier.',
    missingTarget: (id) => `Aucun élément avec l’id « ${id} ».`,
    notMoved: 'Après activation du lien, Tab ne repart pas de sa cible.'
  }
};

const MAX_TABS = 60;
const RULE_IDS = Object.keys(KEYBOARD_RULES);

/** Runs inside the page: shared helpers, injected once per check. */
const PAGE_HELPERS = `
  window.__astroA11yKeyboard = {
    ids: new WeakMap(),
    nextId: 0,
    uid(el) {
      if (!this.ids.has(el)) this.ids.set(el, ++this.nextId);
      return this.ids.get(el);
    },
    deepActive() {
      let el = document.activeElement;
      while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
      return el;
    },
    selector(el) {
      if (!el || el === document.body || el === document.documentElement) return 'body';
      if (el.id && /^[A-Za-z][\\w-]*$/.test(el.id)) return '#' + el.id;
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node !== document.body && parts.length < 6) {
        let part = node.localName;
        if (node.id && /^[A-Za-z][\\w-]*$/.test(node.id)) { parts.unshift('#' + node.id); break; }
        const parent = node.parentElement;
        if (parent) {
          const same = Array.from(parent.children).filter((c) => c.localName === node.localName);
          if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
        }
        parts.unshift(part);
        node = parent;
      }
      return parts.join(' > ');
    },
    snapshot(el) {
      const props = ['outlineStyle', 'outlineWidth', 'outlineColor', 'boxShadow', 'borderTopColor',
        'borderBottomColor', 'borderBottomWidth', 'backgroundColor', 'color', 'textDecorationLine', 'opacity'];
      const snap = (e, pseudo) => { const cs = getComputedStyle(e, pseudo); return props.map((p) => cs[p]).join('|'); };
      return [snap(el), snap(el, '::before'), snap(el, '::after'), el.parentElement ? snap(el.parentElement) : ''].join('#');
    },
    hasVisibleOutline(el) {
      const cs = getComputedStyle(el);
      const width = parseFloat(cs.outlineWidth) || 0;
      const transparent = /rgba\\([^)]*,\\s*0\\)|transparent/.test(cs.outlineColor);
      return cs.outlineStyle !== 'none' && width > 0 && !transparent;
    },
    tabbableCount() {
      const candidates = document.querySelectorAll(
        'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable=""], [contenteditable="true"], audio[controls], video[controls]'
      );
      return Array.from(candidates).filter((el) => {
        if (el.disabled || el.tabIndex < 0 || el.closest('[inert]')) return false;
        if (el.localName === 'input' && el.type === 'hidden') return false;
        const style = getComputedStyle(el);
        return el.getClientRects().length > 0 && style.visibility !== 'hidden';
      }).length;
    }
  };
`;

function makeIssue(ruleId, page, mode, nodes, lang) {
  const rule = KEYBOARD_RULES[ruleId];
  const text = rule[lang] ?? rule.en;
  return {
    id: ruleId,
    rgaa: rule.rgaa,
    rgaaTitle: criterionTitle(rule.rgaa),
    page,
    severity: rule.severity,
    title: text.title,
    why: text.why,
    howToFix: text.howToFix,
    nodes,
    help: text.help,
    helpUrl: `https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#${rule.rgaa}`,
    mode,
    before: rule.before,
    after: rule.after,
    source: 'keyboard'
  };
}

async function pressTab(page) {
  await page.keyboard.press('Tab');
  return page.evaluateHandle(() => window.__astroA11yKeyboard.deepActive());
}

async function describe(handle) {
  return handle.evaluate((el) => ({
    uid: el ? window.__astroA11yKeyboard.uid(el) : 0,
    target: window.__astroA11yKeyboard.selector(el),
    html: el.outerHTML.slice(0, 300),
    isBody: el === document.body || el === document.documentElement || el === null,
    isFrame: el.localName === 'iframe' || el.localName === 'frame'
  }));
}

/**
 * Walks the page with the Tab key and reports keyboard issues.
 * Must run after the page is loaded; it moves focus and may change the URL hash.
 *
 * @param {import('playwright').Page} page
 * @param {string} url Page URL used in the issues.
 * @param {string} mode Scan mode recorded in the issues.
 * @param {{ lang?: string }} [options]
 * @returns {Promise<{ issues: object[], outcomes: Record<string, 'failed'|'passed'|'inapplicable'> }>}
 */
export async function runKeyboardChecks(page, url, mode, { lang = 'en' } = {}) {
  const messages = MESSAGES[lang] ?? MESSAGES.en;
  await page.evaluate(PAGE_HELPERS);
  // Transitions would make computed styles lag behind the focus change.
  // A strict Content-Security-Policy can refuse the style: the checks still run.
  await page
    .addStyleTag({
      content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
    })
    .catch(() => {});
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
  });

  const tabbables = await page.evaluate(() => window.__astroA11yKeyboard.tabbableCount());
  if (tabbables === 0) {
    return { issues: [], outcomes: Object.fromEntries(RULE_IDS.map((id) => [id, 'inapplicable'])) };
  }

  const issues = [];
  const visited = []; // { handle, info, focusedStyle, outline }
  let trap = null;

  for (let i = 0; i < Math.min(tabbables + 5, MAX_TABS); i++) {
    const handle = await pressTab(page);
    const info = await describe(handle);
    if (info.isBody) break; // Focus left the content: end of the tab sequence.

    const index = visited.findIndex((entry) => entry.info.uid === info.uid);
    if (index !== -1) {
      // Focus moving inside a frame keeps the frame as the active element of this page.
      if (info.isFrame) {
        await handle.dispose();
        continue;
      }
      // Back on an element already visited without passing through the end of the page.
      if (visited.length < tabbables) {
        trap = visited.slice(index).map((entry) => entry.info);
      }
      await handle.dispose();
      break;
    }

    const [focusedStyle, outline] = await handle.evaluate((el) => [
      window.__astroA11yKeyboard.snapshot(el),
      window.__astroA11yKeyboard.hasVisibleOutline(el)
    ]);
    visited.push({ handle, info, focusedStyle, outline });
  }

  if (trap) {
    issues.push(
      makeIssue(
        'keyboard-trap',
        url,
        mode,
        trap.map((info) => ({
          target: info.target,
          html: info.html,
          failureSummary: messages.trap(trap.length)
        })),
        lang
      )
    );
  }

  await page.evaluate(() => document.activeElement?.blur?.());
  const invisible = [];
  for (const entry of visited) {
    if (entry.outline || entry.info.isFrame) continue;
    const unfocusedStyle = await entry.handle.evaluate((el) =>
      window.__astroA11yKeyboard.snapshot(el)
    );
    if (unfocusedStyle === entry.focusedStyle) invisible.push(entry.info);
  }
  if (invisible.length > 0) {
    issues.push(
      makeIssue(
        'keyboard-focus-visible',
        url,
        mode,
        invisible.map((info) => ({
          target: info.target,
          html: info.html,
          failureSummary: messages.invisible
        })),
        lang
      )
    );
  }

  const skipLink = visited[0]
    ? await checkSkipLink(page, visited[0].handle, messages)
    : { applicable: false, problem: null };
  if (skipLink.problem) {
    issues.push(makeIssue('keyboard-skip-link', url, mode, [skipLink.problem], lang));
  }

  await Promise.all(visited.map((entry) => entry.handle.dispose()));
  return {
    issues,
    outcomes: {
      'keyboard-trap': trap ? 'failed' : 'passed',
      'keyboard-focus-visible': invisible.length > 0 ? 'failed' : 'passed',
      'keyboard-skip-link': !skipLink.applicable
        ? 'inapplicable'
        : skipLink.problem
          ? 'failed'
          : 'passed'
    }
  };
}

/**
 * When the first focusable element is an in-page link, checks that its target
 * exists and that activating it moves keyboard navigation there.
 */
async function checkSkipLink(page, firstHandle, messages) {
  const link = await firstHandle.evaluate((el) => {
    const href = el.localName === 'a' ? el.getAttribute('href') : null;
    if (!href || !href.startsWith('#') || href.length < 2) return null;
    let id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // Keep the raw fragment.
    }
    const target = document.getElementById(id) || document.getElementsByName(id)[0] || null;
    return {
      target: window.__astroA11yKeyboard.selector(el),
      html: el.outerHTML.slice(0, 300),
      href,
      hasTarget: Boolean(target)
    };
  });
  if (!link) return { applicable: false, problem: null };
  if (!link.hasTarget) {
    return {
      applicable: true,
      problem: {
        target: link.target,
        html: link.html,
        failureSummary: messages.missingTarget(link.href.slice(1))
      }
    };
  }

  await firstHandle.focus();
  await page.keyboard.press('Enter');
  const reached = await page.evaluate((href) => {
    const id = decodeURIComponent(href.slice(1));
    const target = document.getElementById(id) || document.getElementsByName(id)[0];
    const active = window.__astroA11yKeyboard.deepActive();
    const onTarget = (el) =>
      el === target ||
      target.contains(el) ||
      Boolean(target.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (active && active !== document.body && onTarget(active)) return true;
    return null; // Decide after the next Tab.
  }, link.href);
  if (reached) return { applicable: true, problem: null };

  const next = await pressTab(page);
  const afterTarget = await next.evaluate((el, href) => {
    const id = decodeURIComponent(href.slice(1));
    const target = document.getElementById(id) || document.getElementsByName(id)[0];
    if (!el || el === document.body) return true; // Nothing focusable after the target.
    return (
      el === target ||
      target.contains(el) ||
      Boolean(target.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
    );
  }, link.href);
  await next.dispose();
  if (afterTarget) return { applicable: true, problem: null };
  return {
    applicable: true,
    problem: { target: link.target, html: link.html, failureSummary: messages.notMoved }
  };
}
