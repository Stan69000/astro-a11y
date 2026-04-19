# astro-a11y report

- **Target:** /Users/stanbouchet/astro-a11y/examples/static-site/dist
- **Mode:** learning
- **Generated:** 2026-04-19T12:02:04.910Z
- **Pages scanned:** 2

| Severity | Rule | RGAA | Page | Title |
|---|---|---|---|---|
| major | document\-title | 8.5 | http://127.0.0.1:56615/contact/ | Document has no title |
| major | html\-has\-lang | 8.3 | http://127.0.0.1:56615/contact/ | HTML element has no lang attribute |
| critical | label | 11.1 | http://127.0.0.1:56615/contact/ | Form control is missing a label |
| critical | button\-name | 11.9 | http://127.0.0.1:56615/ | Button has no accessible name |
| major | color\-contrast | 3.2 | http://127.0.0.1:56615/ | Insufficient color contrast |
| major | frame\-title | 2.1 | http://127.0.0.1:56615/ | Iframe has no title |
| major | image\-alt | 1.1 | http://127.0.0.1:56615/ | Alternative text missing on image |

## Document has no title

- Severity: **major**
- Rule: `document-title`
- RGAA: **8.5**
- Page: http://127.0.0.1:56615/contact/
- Why: A meaningful page title helps users understand where they are.
- Fix: Ensure each page has a descriptive title element.

## HTML element has no lang attribute

- Severity: **major**
- Rule: `html-has-lang`
- RGAA: **8.3**
- Page: http://127.0.0.1:56615/contact/
- Why: Assistive technologies need the page language to pronounce content correctly.
- Fix: Set the lang attribute on the root html element.

## Form control is missing a label

- Severity: **critical**
- Rule: `label`
- RGAA: **11.1**
- Page: http://127.0.0.1:56615/contact/
- Why: Form fields without labels are difficult or impossible to understand with assistive technologies.
- Fix: Associate a visible or programmatic label with each form control.

## Button has no accessible name

- Severity: **critical**
- Rule: `button-name`
- RGAA: **11.9**
- Page: http://127.0.0.1:56615/
- Why: Assistive technologies cannot announce the purpose of the button.
- Fix: Add visible text, aria-label, or an accessible name linked to the button.

## Insufficient color contrast

- Severity: **major**
- Rule: `color-contrast`
- RGAA: **3.2**
- Page: http://127.0.0.1:56615/
- Why: Low contrast makes text difficult to read for many users, including people with low vision.
- Fix: Increase the contrast ratio between foreground and background colors.

## Iframe has no title

- Severity: **major**
- Rule: `frame-title`
- RGAA: **2.1**
- Page: http://127.0.0.1:56615/
- Why: Users need a clear title to understand embedded content.
- Fix: Add a concise and meaningful title attribute to the iframe.

## Alternative text missing on image

- Severity: **major**
- Rule: `image-alt`
- RGAA: **1.1**
- Page: http://127.0.0.1:56615/
- Why: Screen reader users cannot understand the purpose of the image.
- Fix: Add a meaningful alt attribute, or alt="" for decorative images.
