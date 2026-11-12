# astro-a11y report

> Learning mode: issues are grouped by topic and explained in plain words. Start with the critical ones, then try each problem yourself: it is the best way to understand it.

- **Target:** ./examples/static-site/site
- **Pages scanned:** 2

## What to fix

### 1. Form control is missing a label (critical)

RGAA **11.1** — Chaque champ de formulaire a-t-il une étiquette ?

**Why.** Form fields without labels are difficult or impossible to understand with assistive technologies.

**Who is affected.** Blind people using a screen reader ; People using voice control ; People with attention or cognitive disorders

**See it for yourself.** Click on the text next to the field: if the cursor does not move into the field, the label is not linked.

**Fix.** Associate a visible or programmatic label with each form control.

```html
<!-- Before -->
<input id="email" type="email">
<!-- After -->
<label for="email">Email</label><input id="email" type="email">
```

**Where** (1 page(s), 1 element(s)) :

- /contact/ — `input`

### 2. Button has no accessible name (critical)

RGAA **11.9** — Dans chaque formulaire, l’intitulé de chaque bouton est-il pertinent (hors cas particuliers) ?

**Why.** Assistive technologies cannot announce the purpose of the button.

**Who is affected.** Blind people using a screen reader ; People using voice control

**See it for yourself.** Turn on the screen reader of your device (VoiceOver: Cmd+F5 on Mac; NVDA, free, on Windows) and listen to the element.

**Fix.** Add visible text, aria-label, or an accessible name linked to the button.

```html
<!-- Before -->
<button><svg aria-hidden="true"></svg></button>
<!-- After -->
<button aria-label="Close dialog"><svg aria-hidden="true"></svg></button>
```

**Where** (1 page(s), 1 element(s)) :

- / — `button`

### 3. Document has no title (major)

RGAA **8.5** — Chaque page web a-t-elle un titre de page ?

**Why.** A meaningful page title helps users understand where they are.

**Who is affected.** Blind people using a screen reader ; People with attention or cognitive disorders

**See it for yourself.** Open several tabs: can you tell which tab is this page?

**Fix.** Ensure each page has a descriptive title element.

```html
<!-- Before -->
<title></title>
<!-- After -->
<title>Contact – Example Company</title>
```

**Where** (1 page(s), 1 element(s)) :

- /contact/ — `html`

### 4. HTML element has no lang attribute (major)

RGAA **8.3** — Dans chaque page web, la langue par défaut est-elle présente ?

**Why.** Assistive technologies need the page language to pronounce content correctly.

**Who is affected.** Blind people using a screen reader

**See it for yourself.** Listen to the page with a screen reader: is the French read with an English accent?

**Fix.** Set the lang attribute on the root html element.

```html
<!-- Before -->
<html>
<!-- After -->
<html lang="fr">
```

**Where** (1 page(s), 1 element(s)) :

- /contact/ — `html`

### 5. Insufficient color contrast (major)

RGAA **3.2** — Dans chaque page web, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ?

**Why.** Low contrast makes text difficult to read for many users, including people with low vision.

**Who is affected.** People with low vision ; Everyone, on a phone or in bright sunlight

**See it for yourself.** Read the page on your phone outdoors, or lower the screen brightness.

**Fix.** Increase the contrast ratio between foreground and background colors.

```html
<!-- Before -->
.muted { color: #777; background: #888; }
<!-- After -->
.muted { color: #1f2937; background: #ffffff; }
```

**Where** (1 page(s), 1 element(s)) :

- / — `p`

### 6. Iframe has no title (major)

RGAA **2.1** — Chaque cadre a-t-il un titre de cadre ?

**Why.** Users need a clear title to understand embedded content.

**Who is affected.** Blind people using a screen reader

**See it for yourself.** Turn on the screen reader of your device (VoiceOver: Cmd+F5 on Mac; NVDA, free, on Windows) and listen to the element.

**Fix.** Add a concise and meaningful title attribute to the iframe.

```html
<!-- Before -->
<iframe src="https://example.com/embed"></iframe>
<!-- After -->
<iframe src="https://example.com/embed" title="Video player"></iframe>
```

**Where** (1 page(s), 1 element(s)) :

- / — `iframe`

### 7. Alternative text missing on image (major)

RGAA **1.1** — Chaque image porteuse d’information a-t-elle une alternative textuelle ?

**Why.** Screen reader users cannot understand the purpose of the image.

**Who is affected.** Blind people using a screen reader

**See it for yourself.** Disable images in your browser (or read the page with a screen reader): is the information still there?

**Fix.** Add a meaningful alt attribute, or alt="" for decorative images.

```html
<!-- Before -->
<img src="/team.jpg">
<!-- After -->
<img src="/team.jpg" alt="Team gathered in the Lyon office">
```

**Where** (1 page(s), 1 element(s)) :

- / — `img`

## What already works (automated checks)

- **1.3** Pour chaque image porteuse d’information ayant une alternative textuelle, cette alternative est\-elle pertinente \(hors cas particuliers\) ?
- **7.1** Chaque script est\-il, si nécessaire, compatible avec les technologies d’assistance ?
- **8.4** Pour chaque page web ayant une langue par défaut, le code de langue est\-il pertinent ?
- **9.1** Dans chaque page web, l’information est\-elle structurée par l’utilisation appropriée de titres ?
- **9.2** Dans chaque page web, la structure du document est\-elle cohérente \(hors cas particuliers\) ?
- **10.4** Dans chaque page web, le texte reste\-t\-il lisible lorsque la taille des caractères est augmentée jusqu’à 200 %, au moins \(hors cas particuliers\) ?
- **10.7** Dans chaque page web, pour chaque élément recevant le focus, la prise de focus est\-elle visible ?
- **12.6** Les zones de regroupement de contenus présentes dans plusieurs pages web \(zones d’en\-tête, de navigation principale, de contenu principal, de pied de page et de moteur de recherche\) peuvent\-elles être atteintes ou évitées ?
- **12.9** Dans chaque page web, la navigation ne doit pas contenir de piège au clavier. Cette règle est\-elle respectée ?

## To check by hand

- **12.7** Dans chaque page web, un lien d’évitement ou d’accès rapide à la zone de contenu principal est\-il présent \(hors cas particuliers\) ?

_RGAA 4.1.2. Automated checks only: "No issue detected" does not mean compliant, most criteria also need a manual check._