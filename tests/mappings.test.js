import test from 'node:test';
import assert from 'node:assert/strict';
import { mapAxeToRgaa } from '../packages/core/src/mappings.js';

test('maps known axe rules to RGAA metadata', () => {
  const mapping = mapAxeToRgaa('image-alt');
  assert.equal(mapping.rgaa, '1.1');
  assert.equal(mapping.severity, 'major');
});

test('returns fallback mapping for unknown rules', () => {
  const mapping = mapAxeToRgaa('unknown-rule');
  assert.equal(mapping.rgaa, 'manual-check');
});

// Expected criteria checked against the official RGAA 4.1 reference (criteres.json).
const EXPECTED_CRITERIA = {
  'image-alt': '1.1', // 1.1.1 image porteuse d'information
  'input-image-alt': '1.1', // 1.1.3 bouton de type image
  'frame-title': '2.1', // cadre sans titre
  'color-contrast': '3.2', // contraste du texte
  'link-name': '6.2', // lien sans intitulé (6.1 = lien explicite)
  'aria-valid-attr': '7.1', // usage de WAI-ARIA (note technique du 7.1)
  'aria-roles': '7.1', // rôle pertinent (7.1.3)
  'focus-order-semantics': '7.1', // rôle pertinent (7.1.3)
  'html-has-lang': '8.3', // langue par défaut présente
  'html-lang-valid': '8.4', // code de langue pertinent
  'document-title': '8.5', // titre de page
  list: '9.3', // listes (9.3.1 / 9.3.2)
  dlitem: '9.3', // listes de description (9.3.3) — 9.4 concerne les citations
  label: '11.1', // champ sans étiquette
  'button-name': '11.9', // intitulé de bouton
  region: '12.6', // zones de regroupement atteignables ou évitables
  bypass: '12.7' // lien d'évitement
};

for (const [ruleId, criterion] of Object.entries(EXPECTED_CRITERIA)) {
  test(`maps ${ruleId} to RGAA ${criterion}`, () => {
    assert.equal(mapAxeToRgaa(ruleId).rgaa, criterion);
  });
}

test('never maps to the data tables theme (5.x) for non-table rules', () => {
  for (const ruleId of Object.keys(EXPECTED_CRITERIA)) {
    assert.ok(!mapAxeToRgaa(ruleId).rgaa.startsWith('5.'), `${ruleId} is not a table rule`);
  }
});
