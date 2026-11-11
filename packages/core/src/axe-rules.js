/**
 * axe-core rule → RGAA 4.1.2 criterion, with explanations in English and French.
 *
 * Criterion numbers follow the official RGAA tests
 * (https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/), shared with
 * rgaa-audit through rgaa.js; a test checks that every criterion exists.
 * WAI-ARIA usage (valid attributes and roles, name and role of components) belongs to
 * criterion 7.1, as stated in its technical note.
 *
 * Rules that have no clear RGAA counterpart (AAA, WCAG 2.2, informational rules) are
 * left out on purpose: they are reported as "manual-check" with axe's own severity.
 */

/** @typedef {{ title: string, why: string, howToFix: string }} RuleText */
/**
 * @typedef {Object} AxeRuleMapping
 * @property {string} rgaa Criterion number.
 * @property {"critical"|"major"|"minor"|"info"} severity
 * @property {RuleText} en
 * @property {RuleText} fr
 * @property {string} [before] Failing HTML example.
 * @property {string} [after] Fixed HTML example.
 */

/** @type {Readonly<Record<string, AxeRuleMapping>>} */
export const AXE_RULES = Object.freeze({
  // ── 1. Images ────────────────────────────────────────────────
  'image-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'Alternative text missing on image',
      why: 'Screen reader users cannot understand the purpose of the image.',
      howToFix: 'Add a meaningful alt attribute, or alt="" for decorative images.'
    },
    fr: {
      title: 'Image sans alternative textuelle',
      why: 'Une personne aveugle ne sait pas ce que montre ou apporte l’image.',
      howToFix:
        'Ajouter un attribut alt qui transmet l’information, ou alt="" si l’image est décorative.'
    },
    before: '<img src="/team.jpg">',
    after: '<img src="/team.jpg" alt="Team gathered in the Lyon office">'
  },
  'input-image-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'Image button missing alternative text',
      why: 'Screen reader users cannot understand the function of the image button.',
      howToFix: 'Add an alt attribute describing the button action.'
    },
    fr: {
      title: 'Bouton image sans alternative textuelle',
      why: 'Un lecteur d’écran annonce un bouton sans dire ce qu’il fait.',
      howToFix:
        'Ajouter un attribut alt qui décrit l’action du bouton (« Rechercher », « Envoyer »).'
    },
    before: '<input type="image" src="submit.png">',
    after: '<input type="image" src="submit.png" alt="Submit form">'
  },
  'area-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'Image map area missing alternative text',
      why: 'Screen reader users cannot tell where each clickable area of the image leads.',
      howToFix: 'Give every <area> an alt attribute describing its destination.'
    },
    fr: {
      title: 'Zone d’image réactive sans alternative',
      why: 'Une personne aveugle ne sait pas où mène chaque zone cliquable de l’image.',
      howToFix: 'Donner à chaque balise <area> un attribut alt qui décrit sa destination.'
    },
    before: '<area href="/lyon" coords="0,0,50,50">',
    after: '<area href="/lyon" coords="0,0,50,50" alt="Antenne de Lyon">'
  },
  'role-img-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'Element with role="img" has no alternative text',
      why: 'The element is announced as an image, but without any description.',
      howToFix:
        'Add aria-label or aria-labelledby, or remove role="img" if the element is decorative.'
    },
    fr: {
      title: 'Élément role="img" sans alternative',
      why: 'L’élément est annoncé comme une image, mais sans description.',
      howToFix:
        'Ajouter aria-label ou aria-labelledby, ou retirer role="img" si l’élément est décoratif.'
    },
    before: '<div role="img" class="logo"></div>',
    after: '<div role="img" class="logo" aria-label="Le Singe du Numérique"></div>'
  },
  'svg-img-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'SVG image has no alternative text',
      why: 'An informative SVG is silent for screen reader users.',
      howToFix:
        'Add role="img" with aria-label or a <title> child, or aria-hidden="true" if it is decorative.'
    },
    fr: {
      title: 'Image SVG sans alternative',
      why: 'Un SVG porteur d’information reste muet pour un lecteur d’écran.',
      howToFix:
        'Ajouter role="img" et aria-label (ou un <title>), ou aria-hidden="true" s’il est décoratif.'
    },
    before: '<svg role="img">…</svg>',
    after: '<svg role="img" aria-label="Graphique des adhésions 2026">…</svg>'
  },
  'object-alt': {
    rgaa: '1.1',
    severity: 'major',
    en: {
      title: 'Embedded object has no alternative text',
      why: 'Content embedded with <object> is not described to assistive technologies.',
      howToFix:
        'Give the <object> an accessible name (aria-label, title) or fallback text inside it.'
    },
    fr: {
      title: 'Objet intégré sans alternative',
      why: 'Le contenu intégré avec <object> n’est pas décrit aux technologies d’assistance.',
      howToFix:
        'Donner un nom accessible à <object> (aria-label, title) ou un texte de remplacement à l’intérieur.'
    }
  },
  'image-redundant-alt': {
    rgaa: '1.3',
    severity: 'minor',
    en: {
      title: 'Image alternative repeats the text next to it',
      why: 'Screen reader users hear the same information twice.',
      howToFix: 'Use alt="" when the adjacent text already says the same thing.'
    },
    fr: {
      title: 'Alternative qui répète le texte voisin',
      why: 'Un lecteur d’écran lit deux fois la même information.',
      howToFix: 'Mettre alt="" quand le texte à côté dit déjà la même chose.'
    }
  },
  'server-side-image-map': {
    rgaa: '1.1',
    severity: 'minor',
    en: {
      title: 'Server-side image map',
      why: 'Clickable zones computed by the server cannot be reached with a keyboard.',
      howToFix: 'Replace it with a client-side <map> or with regular links.'
    },
    fr: {
      title: 'Image réactive côté serveur',
      why: 'Les zones cliquables calculées par le serveur sont inaccessibles au clavier.',
      howToFix: 'La remplacer par une image réactive <map> ou par de simples liens.'
    }
  },

  // ── 2. Cadres ────────────────────────────────────────────────
  'frame-title': {
    rgaa: '2.1',
    severity: 'major',
    en: {
      title: 'Iframe has no title',
      why: 'Users need a clear title to understand embedded content.',
      howToFix: 'Add a concise and meaningful title attribute to the iframe.'
    },
    fr: {
      title: 'Cadre sans titre',
      why: 'Sans titre, impossible de savoir ce que contient le cadre (vidéo, carte, formulaire…).',
      howToFix: 'Ajouter à l’iframe un attribut title court et explicite.'
    },
    before: '<iframe src="https://example.com/embed"></iframe>',
    after: '<iframe src="https://example.com/embed" title="Video player"></iframe>'
  },
  'frame-title-unique': {
    rgaa: '2.2',
    severity: 'minor',
    en: {
      title: 'Several iframes share the same title',
      why: 'Identical titles do not let users tell the frames apart.',
      howToFix: 'Give each iframe a title that describes its own content.'
    },
    fr: {
      title: 'Plusieurs cadres ont le même titre',
      why: 'Des titres identiques ne permettent pas de distinguer les cadres.',
      howToFix: 'Donner à chaque iframe un titre qui décrit son propre contenu.'
    }
  },

  // ── 3. Couleurs ──────────────────────────────────────────────
  'color-contrast': {
    rgaa: '3.2',
    severity: 'major',
    en: {
      title: 'Insufficient color contrast',
      why: 'Low contrast makes text difficult to read for many users, including people with low vision.',
      howToFix: 'Increase the contrast ratio between foreground and background colors.'
    },
    fr: {
      title: 'Contraste de couleur insuffisant',
      why: 'Un texte peu contrasté est difficile à lire, en particulier pour les personnes malvoyantes ou en plein soleil.',
      howToFix: 'Atteindre un rapport de contraste d’au moins 4,5:1 (3:1 pour les grands textes).'
    },
    before: '.muted { color: #777; background: #888; }',
    after: '.muted { color: #1f2937; background: #ffffff; }'
  },
  'link-in-text-block': {
    rgaa: '3.1',
    severity: 'major',
    en: {
      title: 'Link only distinguished by its color',
      why: 'People who do not perceive colors cannot spot the link in the paragraph.',
      howToFix: 'Underline links inside text, or add another visual cue than color.'
    },
    fr: {
      title: 'Lien repéré uniquement par sa couleur',
      why: 'Une personne qui distingue mal les couleurs ne voit pas le lien dans le paragraphe.',
      howToFix:
        'Souligner les liens dans le texte, ou ajouter un autre repère visuel que la couleur.'
    },
    before: 'p a { text-decoration: none; }',
    after: 'p a { text-decoration: underline; }'
  },

  // ── 4. Multimédia ────────────────────────────────────────────
  'video-caption': {
    rgaa: '4.3',
    severity: 'major',
    en: {
      title: 'Video without captions',
      why: 'Deaf and hard-of-hearing people miss everything that is said.',
      howToFix: 'Add synchronised captions with <track kind="captions">.'
    },
    fr: {
      title: 'Vidéo sans sous-titres',
      why: 'Une personne sourde ou malentendante perd tout ce qui est dit.',
      howToFix: 'Ajouter des sous-titres synchronisés avec <track kind="captions">.'
    },
    before: '<video src="atelier.mp4" controls></video>',
    after:
      '<video src="atelier.mp4" controls><track kind="captions" src="atelier.vtt" srclang="fr"></video>'
  },
  'no-autoplay-audio': {
    rgaa: '4.10',
    severity: 'major',
    en: {
      title: 'Sound plays automatically',
      why: 'Automatic sound covers the voice of screen readers.',
      howToFix: 'Do not autoplay sound longer than 3 seconds, or provide a control to stop it.'
    },
    fr: {
      title: 'Son lancé automatiquement',
      why: 'Un son automatique couvre la voix du lecteur d’écran.',
      howToFix:
        'Ne pas lancer automatiquement un son de plus de 3 secondes, ou proposer un bouton pour l’arrêter.'
    }
  },

  // ── 5. Tableaux ──────────────────────────────────────────────
  'td-headers-attr': {
    rgaa: '5.7',
    severity: 'major',
    en: {
      title: 'Table cell refers to missing headers',
      why: 'Screen readers cannot announce which headers a cell belongs to.',
      howToFix: 'Make every id listed in headers="…" point to a <th> of the same table.'
    },
    fr: {
      title: 'Cellule liée à des en-têtes introuvables',
      why: 'Le lecteur d’écran ne peut pas annoncer à quels en-têtes la cellule se rattache.',
      howToFix: 'Faire pointer chaque id de l’attribut headers vers un <th> du même tableau.'
    }
  },
  'th-has-data-cells': {
    rgaa: '5.7',
    severity: 'minor',
    en: {
      title: 'Table header without data cells',
      why: 'A header that applies to no cell makes the table structure confusing.',
      howToFix: 'Check that each <th> heads a row or column of data, or use <td>.'
    },
    fr: {
      title: 'En-tête de tableau sans cellule',
      why: 'Un en-tête qui ne s’applique à aucune cellule brouille la structure du tableau.',
      howToFix:
        'Vérifier que chaque <th> est bien l’en-tête d’une ligne ou d’une colonne de données, sinon utiliser <td>.'
    }
  },
  'td-has-header': {
    rgaa: '5.6',
    severity: 'minor',
    en: {
      title: 'Data cell without header',
      why: 'In a large table, screen reader users lose track of what each value means.',
      howToFix: 'Declare column and row headers with <th> (and scope when needed).'
    },
    fr: {
      title: 'Cellule de données sans en-tête',
      why: 'Dans un grand tableau, on ne sait plus à quoi correspond chaque valeur.',
      howToFix: 'Déclarer les en-têtes de colonnes et de lignes avec <th> (et scope si besoin).'
    }
  },
  'empty-table-header': {
    rgaa: '5.6',
    severity: 'minor',
    en: {
      title: 'Empty table header',
      why: 'An empty header gives no context to the cells it heads.',
      howToFix: 'Write a header text, or use <td> if the cell is not a header.'
    },
    fr: {
      title: 'En-tête de tableau vide',
      why: 'Un en-tête vide ne donne aucun contexte aux cellules qu’il couvre.',
      howToFix: 'Écrire un intitulé d’en-tête, ou utiliser <td> si la cellule n’est pas un en-tête.'
    }
  },
  'scope-attr-valid': {
    rgaa: '5.7',
    severity: 'minor',
    en: {
      title: 'Invalid scope attribute',
      why: 'A wrong scope links cells to the wrong headers.',
      howToFix: 'Use scope="col" or scope="row", only on <th>.'
    },
    fr: {
      title: 'Attribut scope incorrect',
      why: 'Un scope erroné associe les cellules aux mauvais en-têtes.',
      howToFix: 'Utiliser scope="col" ou scope="row", uniquement sur <th>.'
    }
  },
  'table-fake-caption': {
    rgaa: '5.4',
    severity: 'minor',
    en: {
      title: 'Table title written in a cell',
      why: 'The title is read as data instead of being announced as the table title.',
      howToFix: 'Move the title into a <caption> element.'
    },
    fr: {
      title: 'Titre de tableau écrit dans une cellule',
      why: 'Le titre est lu comme une donnée au lieu d’être annoncé comme titre du tableau.',
      howToFix: 'Placer le titre dans une balise <caption>.'
    }
  },

  // ── 6. Liens ─────────────────────────────────────────────────
  'link-name': {
    rgaa: '6.2',
    severity: 'critical',
    en: {
      title: 'Link has no accessible name',
      why: 'Users navigating links cannot understand where the link leads.',
      howToFix: 'Ensure the link has visible text or an accessible name.'
    },
    fr: {
      title: 'Lien sans intitulé',
      why: 'Un lecteur d’écran annonce « lien » sans dire où il mène.',
      howToFix:
        'Donner au lien un texte visible, ou un nom accessible (aria-label) pour un lien-icône.'
    },
    before: '<a href="/pricing"><svg aria-hidden="true"></svg></a>',
    after: '<a href="/pricing" aria-label="See pricing"><svg aria-hidden="true"></svg></a>'
  },

  // ── 7. Scripts (WAI-ARIA) ────────────────────────────────────
  'aria-valid-attr': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'Invalid ARIA attribute',
      why: 'Invalid ARIA attributes are ignored by assistive technologies.',
      howToFix: 'Use only valid ARIA attribute names.'
    },
    fr: {
      title: 'Attribut ARIA inexistant',
      why: 'Un attribut ARIA mal orthographié est ignoré : l’information ne parvient pas aux technologies d’assistance.',
      howToFix: 'Corriger le nom de l’attribut (liste des attributs WAI-ARIA).'
    },
    before: '<input type="checkbox" aria-requried="true">',
    after: '<input type="checkbox" aria-required="true">'
  },
  'aria-valid-attr-value': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Invalid ARIA attribute value',
      why: 'An invalid value is ignored, so the state or relation is not conveyed.',
      howToFix: 'Use a value allowed by the specification (true/false, an existing id…).'
    },
    fr: {
      title: 'Valeur d’attribut ARIA invalide',
      why: 'Une valeur invalide est ignorée : l’état ou la relation n’est pas transmis.',
      howToFix: 'Utiliser une valeur autorisée (true/false, un id qui existe…).'
    },
    before: '<button aria-expanded="oui">Menu</button>',
    after: '<button aria-expanded="false">Menu</button>'
  },
  'aria-roles': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'Invalid ARIA role',
      why: 'Invalid or abstract roles confuse assistive technologies.',
      howToFix: 'Use valid roles from the ARIA specification.'
    },
    fr: {
      title: 'Rôle ARIA invalide',
      why: 'Un rôle inexistant ou abstrait brouille la restitution du composant.',
      howToFix: 'Utiliser un rôle WAI-ARIA valide, ou mieux, l’élément HTML natif.'
    },
    before: '<div role="invalid-role">Content</div>',
    after: '<div role="region" aria-label="Content">Content</div>'
  },
  'aria-allowed-attr': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA attribute not allowed on this element',
      why: 'Unsupported attributes are ignored or misread.',
      howToFix: 'Remove the attribute or use a role that supports it.'
    },
    fr: {
      title: 'Attribut ARIA non autorisé sur cet élément',
      why: 'Un attribut non pris en charge est ignoré ou mal restitué.',
      howToFix: 'Retirer l’attribut ou utiliser un rôle qui l’accepte.'
    }
  },
  'aria-prohibited-attr': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA attribute prohibited on this element',
      why: 'Naming an element that cannot be named makes screen readers behave inconsistently.',
      howToFix: 'Remove the attribute, or give the element an appropriate role.'
    },
    fr: {
      title: 'Attribut ARIA interdit sur cet élément',
      why: 'Nommer un élément qui ne peut pas l’être donne une restitution incohérente.',
      howToFix: 'Retirer l’attribut, ou donner à l’élément un rôle adapté.'
    }
  },
  'aria-required-attr': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'Required ARIA attribute missing',
      why: 'The component state is not conveyed (e.g. a checkbox without aria-checked).',
      howToFix: 'Add the attributes required by the role, or use the native HTML element.'
    },
    fr: {
      title: 'Attribut ARIA obligatoire manquant',
      why: 'L’état du composant n’est pas transmis (par exemple une case à cocher sans aria-checked).',
      howToFix: 'Ajouter les attributs exigés par le rôle, ou utiliser l’élément HTML natif.'
    },
    before: '<div role="checkbox">Newsletter</div>',
    after: '<div role="checkbox" aria-checked="false" tabindex="0">Newsletter</div>'
  },
  'aria-conditional-attr': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA attribute used incorrectly for the role',
      why: 'The announced state contradicts the real state of the component.',
      howToFix: 'Follow the role’s rules (e.g. no aria-checked on a native checkbox).'
    },
    fr: {
      title: 'Attribut ARIA mal utilisé pour ce rôle',
      why: 'L’état annoncé contredit l’état réel du composant.',
      howToFix: 'Respecter les règles du rôle (par exemple pas d’aria-checked sur une case native).'
    }
  },
  'aria-deprecated-role': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'Deprecated ARIA role',
      why: 'Deprecated roles may not be supported by assistive technologies.',
      howToFix: 'Replace it with a current role or a native element.'
    },
    fr: {
      title: 'Rôle ARIA obsolète',
      why: 'Un rôle obsolète peut ne plus être pris en charge.',
      howToFix: 'Le remplacer par un rôle actuel ou un élément natif.'
    }
  },
  'aria-allowed-role': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'ARIA role not appropriate for the element',
      why: 'Overriding the native role can break the expected behaviour.',
      howToFix: 'Remove the role or use an element that matches it.'
    },
    fr: {
      title: 'Rôle ARIA inadapté à l’élément',
      why: 'Écraser le rôle natif peut casser le comportement attendu.',
      howToFix: 'Retirer le rôle ou utiliser un élément qui lui correspond.'
    }
  },
  'aria-required-children': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'ARIA role missing its required children',
      why: 'A list, menu or tab list without its items is announced incorrectly.',
      howToFix: 'Add the expected child roles (listitem, menuitem, tab…).'
    },
    fr: {
      title: 'Rôle ARIA sans ses enfants obligatoires',
      why: 'Une liste, un menu ou des onglets sans leurs éléments sont mal restitués.',
      howToFix: 'Ajouter les rôles enfants attendus (listitem, menuitem, tab…).'
    }
  },
  'aria-required-parent': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'ARIA role outside its required parent',
      why: 'An item outside its container is announced out of context.',
      howToFix: 'Place it inside the expected parent role (list, menu, tablist…).'
    },
    fr: {
      title: 'Rôle ARIA hors de son parent obligatoire',
      why: 'Un élément hors de son conteneur est restitué hors contexte.',
      howToFix: 'Le placer dans le rôle parent attendu (list, menu, tablist…).'
    }
  },
  'aria-hidden-body': {
    rgaa: '7.1',
    severity: 'critical',
    en: {
      title: 'Whole page hidden with aria-hidden',
      why: 'The page becomes empty for screen reader users.',
      howToFix: 'Remove aria-hidden="true" from <body>.'
    },
    fr: {
      title: 'Page entière masquée par aria-hidden',
      why: 'La page devient vide pour un lecteur d’écran.',
      howToFix: 'Retirer aria-hidden="true" de la balise <body>.'
    }
  },
  'aria-hidden-focus': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Hidden element can receive focus',
      why: 'Keyboard users land on elements that screen readers do not announce.',
      howToFix: 'Remove aria-hidden, or make the content unfocusable (tabindex="-1", inert).'
    },
    fr: {
      title: 'Élément masqué qui reçoit le focus',
      why: 'Au clavier, on arrive sur des éléments que le lecteur d’écran n’annonce pas.',
      howToFix: 'Retirer aria-hidden, ou rendre le contenu non focusable (tabindex="-1", inert).'
    }
  },
  'aria-command-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA button, link or menu item has no name',
      why: 'Screen readers announce the control without saying what it does.',
      howToFix: 'Add visible text, aria-label or aria-labelledby.'
    },
    fr: {
      title: 'Bouton, lien ou menu ARIA sans nom',
      why: 'Le lecteur d’écran annonce la commande sans dire ce qu’elle fait.',
      howToFix: 'Ajouter un texte visible, aria-label ou aria-labelledby.'
    }
  },
  'aria-input-field-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA input field has no name',
      why: 'Users do not know what to type in the field.',
      howToFix: 'Name it with aria-label or aria-labelledby (or use a native field with <label>).'
    },
    fr: {
      title: 'Champ ARIA sans nom',
      why: 'On ne sait pas quoi saisir dans le champ.',
      howToFix:
        'Le nommer avec aria-label ou aria-labelledby (ou utiliser un champ natif avec <label>).'
    }
  },
  'aria-toggle-field-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'ARIA toggle has no name',
      why: 'A checkbox or switch is announced without its label.',
      howToFix: 'Add visible text, aria-label or aria-labelledby.'
    },
    fr: {
      title: 'Interrupteur ARIA sans nom',
      why: 'Une case ou un interrupteur est annoncé sans son intitulé.',
      howToFix: 'Ajouter un texte visible, aria-label ou aria-labelledby.'
    }
  },
  'aria-tooltip-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Tooltip has no name',
      why: 'The tooltip content is not conveyed.',
      howToFix: 'Put the text inside the tooltip or name it with aria-label.'
    },
    fr: {
      title: 'Infobulle sans nom',
      why: 'Le contenu de l’infobulle n’est pas transmis.',
      howToFix: 'Mettre le texte dans l’infobulle ou la nommer avec aria-label.'
    }
  },
  'aria-meter-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Meter has no name',
      why: 'A value is announced without saying what it measures.',
      howToFix: 'Name it with aria-label or aria-labelledby.'
    },
    fr: {
      title: 'Jauge sans nom',
      why: 'Une valeur est annoncée sans dire ce qu’elle mesure.',
      howToFix: 'La nommer avec aria-label ou aria-labelledby.'
    }
  },
  'aria-progressbar-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Progress bar has no name',
      why: 'Progress is announced without saying what is loading.',
      howToFix: 'Name it with aria-label or aria-labelledby.'
    },
    fr: {
      title: 'Barre de progression sans nom',
      why: 'Une progression est annoncée sans dire ce qui se charge.',
      howToFix: 'La nommer avec aria-label ou aria-labelledby.'
    }
  },
  'aria-dialog-name': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'Dialog has no name',
      why: 'Screen reader users do not know what the window that just opened is about.',
      howToFix: 'Point aria-labelledby to the dialog title.'
    },
    fr: {
      title: 'Fenêtre de dialogue sans nom',
      why: 'On ne sait pas à quoi sert la fenêtre qui vient de s’ouvrir.',
      howToFix: 'Relier aria-labelledby au titre de la fenêtre.'
    }
  },
  'aria-tab-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Tab has no name',
      why: 'Tabs are announced without their labels.',
      howToFix: 'Put visible text in each tab.'
    },
    fr: {
      title: 'Onglet sans nom',
      why: 'Les onglets sont annoncés sans leur intitulé.',
      howToFix: 'Mettre un texte visible dans chaque onglet.'
    }
  },
  'aria-treeitem-name': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'Tree item has no name',
      why: 'Items of the tree are announced without their labels.',
      howToFix: 'Put visible text in each tree item.'
    },
    fr: {
      title: 'Élément d’arborescence sans nom',
      why: 'Les éléments de l’arborescence sont annoncés sans intitulé.',
      howToFix: 'Mettre un texte visible dans chaque élément.'
    }
  },
  'aria-braille-equivalent': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'Braille attribute without spoken equivalent',
      why: 'aria-braillelabel or aria-brailleroledescription needs a regular name or description.',
      howToFix: 'Add the matching aria-label or aria-roledescription.'
    },
    fr: {
      title: 'Attribut braille sans équivalent vocal',
      why: 'aria-braillelabel ou aria-brailleroledescription demande un nom ou une description classique.',
      howToFix: 'Ajouter l’aria-label ou l’aria-roledescription correspondant.'
    }
  },
  'presentation-role-conflict': {
    rgaa: '7.1',
    severity: 'minor',
    en: {
      title: 'Presentational element is still exposed',
      why: 'role="none" is ignored because the element is focusable or has global ARIA attributes.',
      howToFix: 'Remove the focusability or the ARIA attributes, or drop role="none".'
    },
    fr: {
      title: 'Élément « de présentation » toujours exposé',
      why: 'role="none" est ignoré car l’élément est focusable ou porte des attributs ARIA globaux.',
      howToFix: 'Retirer le focus ou les attributs ARIA, ou supprimer role="none".'
    }
  },
  'nested-interactive': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Interactive controls are nested',
      why: 'A button inside a link (or the reverse) is announced and focused unpredictably.',
      howToFix: 'Keep interactive elements side by side, never one inside another.'
    },
    fr: {
      title: 'Éléments interactifs imbriqués',
      why: 'Un bouton dans un lien (ou l’inverse) est annoncé et atteint de façon imprévisible.',
      howToFix: 'Placer les éléments interactifs côte à côte, jamais l’un dans l’autre.'
    }
  },
  'label-content-name-mismatch': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Accessible name does not contain the visible text',
      why: 'Voice control users say what they see, and the command does not work.',
      howToFix: 'Start the aria-label with the visible text, or remove it.'
    },
    fr: {
      title: 'Nom accessible différent du texte visible',
      why: 'Avec la commande vocale, on prononce ce que l’on voit… et rien ne se passe.',
      howToFix: 'Faire commencer l’aria-label par le texte visible, ou le supprimer.'
    },
    before: '<button aria-label="Valider le formulaire">Envoyer</button>',
    after: '<button>Envoyer</button>'
  },
  'summary-name': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Disclosure summary has no text',
      why: 'The expandable section is announced without a label.',
      howToFix: 'Put visible text in <summary>.'
    },
    fr: {
      title: 'Résumé de section dépliable vide',
      why: 'La section dépliable est annoncée sans intitulé.',
      howToFix: 'Mettre un texte visible dans <summary>.'
    }
  },
  'focus-order-semantics': {
    rgaa: '7.1',
    severity: 'major',
    en: {
      title: 'Focusable element has no interactive role',
      why: 'Screen readers announce a focusable element without an interactive role as plain content, so users cannot tell it can be activated.',
      howToFix:
        'Use a native interactive element (button, a, input) or give the element an appropriate ARIA role.'
    },
    fr: {
      title: 'Élément focusable sans rôle interactif',
      why: 'Il est annoncé comme du texte : on ne sait pas qu’on peut l’activer.',
      howToFix:
        'Utiliser un élément interactif natif (button, a, input) ou lui donner un rôle ARIA adapté.'
    },
    before: '<div tabindex="0">Action</div>',
    after: '<button>Action</button>'
  },

  // ── 8. Éléments obligatoires ─────────────────────────────────
  'html-has-lang': {
    rgaa: '8.3',
    severity: 'major',
    en: {
      title: 'HTML element has no lang attribute',
      why: 'Assistive technologies need the page language to pronounce content correctly.',
      howToFix: 'Set the lang attribute on the root html element.'
    },
    fr: {
      title: 'Langue de la page absente',
      why: 'Sans langue, la synthèse vocale lit le français avec un accent anglais.',
      howToFix: 'Ajouter lang="fr" sur la balise <html>.'
    },
    before: '<html>',
    after: '<html lang="fr">'
  },
  'html-lang-valid': {
    rgaa: '8.4',
    severity: 'major',
    en: {
      title: 'Language attribute has invalid value',
      why: 'Screen readers may fail to detect the language correctly.',
      howToFix: 'Use a valid BCP 47 language code.'
    },
    fr: {
      title: 'Code de langue invalide',
      why: 'La synthèse vocale ne reconnaît pas la langue.',
      howToFix: 'Utiliser un code de langue valide (fr, en, fr-FR…).'
    },
    before: '<html lang="xx">',
    after: '<html lang="fr">'
  },
  'html-xml-lang-mismatch': {
    rgaa: '8.4',
    severity: 'minor',
    en: {
      title: 'lang and xml:lang disagree',
      why: 'Two different languages are declared for the same page.',
      howToFix: 'Use the same language in lang and xml:lang, or remove xml:lang.'
    },
    fr: {
      title: 'lang et xml:lang différents',
      why: 'Deux langues différentes sont déclarées pour la même page.',
      howToFix: 'Mettre la même langue dans lang et xml:lang, ou supprimer xml:lang.'
    }
  },
  'valid-lang': {
    rgaa: '8.7',
    severity: 'minor',
    en: {
      title: 'Invalid language change',
      why: 'A passage in another language is pronounced with the wrong voice.',
      howToFix: 'Use a valid language code in the lang attribute of the passage.'
    },
    fr: {
      title: 'Changement de langue invalide',
      why: 'Un passage dans une autre langue est prononcé avec la mauvaise voix.',
      howToFix: 'Utiliser un code de langue valide dans l’attribut lang du passage.'
    }
  },
  'document-title': {
    rgaa: '8.5',
    severity: 'major',
    en: {
      title: 'Document has no title',
      why: 'A meaningful page title helps users understand where they are.',
      howToFix: 'Ensure each page has a descriptive title element.'
    },
    fr: {
      title: 'Page sans titre',
      why: 'Le titre est la première chose annoncée : sans lui, on ne sait pas où l’on est.',
      howToFix: 'Donner à chaque page un <title> qui la décrit.'
    },
    before: '<title></title>',
    after: '<title>Contact – Example Company</title>'
  },
  'duplicate-id-aria': {
    rgaa: '8.2',
    severity: 'major',
    en: {
      title: 'Duplicate id used by ARIA or a label',
      why: 'A label or description can point to the wrong element.',
      howToFix: 'Make every id unique in the page.'
    },
    fr: {
      title: 'Identifiant en double utilisé par ARIA ou une étiquette',
      why: 'Une étiquette ou une description peut viser le mauvais élément.',
      howToFix: 'Rendre chaque id unique dans la page.'
    }
  },

  // ── 9. Structuration ─────────────────────────────────────────
  'heading-order': {
    rgaa: '9.1',
    severity: 'minor',
    en: {
      title: 'Heading levels skip a level',
      why: 'Screen reader users navigate by headings and get a broken outline.',
      howToFix: 'Increase heading levels one at a time (h2 after h1, h3 after h2).'
    },
    fr: {
      title: 'Niveaux de titres sautés',
      why: 'Les personnes qui naviguent par titres obtiennent un plan incohérent.',
      howToFix: 'Descendre d’un niveau à la fois (h2 après h1, h3 après h2).'
    }
  },
  'empty-heading': {
    rgaa: '9.1',
    severity: 'minor',
    en: {
      title: 'Empty heading',
      why: 'An empty heading appears in the page outline without meaning.',
      howToFix: 'Write the heading text or remove the heading tag.'
    },
    fr: {
      title: 'Titre vide',
      why: 'Un titre vide apparaît dans le plan de la page sans rien dire.',
      howToFix: 'Écrire le texte du titre ou retirer la balise de titre.'
    }
  },
  'page-has-heading-one': {
    rgaa: '9.1',
    severity: 'minor',
    en: {
      title: 'No level-one heading',
      why: 'Users cannot jump straight to the main heading of the page.',
      howToFix: 'Add one <h1> describing the page content.'
    },
    fr: {
      title: 'Aucun titre de niveau 1',
      why: 'On ne peut pas aller directement au titre principal de la page.',
      howToFix: 'Ajouter un <h1> qui décrit le contenu de la page.'
    }
  },
  'p-as-heading': {
    rgaa: '9.1',
    severity: 'minor',
    en: {
      title: 'Paragraph styled as a heading',
      why: 'It looks like a heading but is missing from the page outline.',
      howToFix: 'Use a real heading tag (<h2>, <h3>…).'
    },
    fr: {
      title: 'Paragraphe déguisé en titre',
      why: 'Il ressemble à un titre mais n’apparaît pas dans le plan de la page.',
      howToFix: 'Utiliser une vraie balise de titre (<h2>, <h3>…).'
    }
  },
  'landmark-one-main': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'No main landmark',
      why: 'Users cannot jump straight to the main content.',
      howToFix: 'Wrap the main content in a <main> element.'
    },
    fr: {
      title: 'Pas de zone de contenu principal',
      why: 'On ne peut pas aller directement au contenu principal.',
      howToFix: 'Entourer le contenu principal d’une balise <main>.'
    }
  },
  'landmark-no-duplicate-main': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Several main landmarks',
      why: 'Users do not know which one holds the main content.',
      howToFix: 'Keep a single visible <main> per page.'
    },
    fr: {
      title: 'Plusieurs zones de contenu principal',
      why: 'On ne sait pas laquelle contient le contenu principal.',
      howToFix: 'Garder une seule balise <main> visible par page.'
    }
  },
  'landmark-no-duplicate-banner': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Several page headers',
      why: 'The page header landmark is repeated.',
      howToFix: 'Keep one top-level <header>; nested headers inside sections are fine.'
    },
    fr: {
      title: 'Plusieurs en-têtes de page',
      why: 'La zone d’en-tête de la page est répétée.',
      howToFix: 'Garder un seul <header> de premier niveau (ceux des sections ne comptent pas).'
    }
  },
  'landmark-no-duplicate-contentinfo': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Several page footers',
      why: 'The page footer landmark is repeated.',
      howToFix: 'Keep one top-level <footer>.'
    },
    fr: {
      title: 'Plusieurs pieds de page',
      why: 'La zone de pied de page est répétée.',
      howToFix: 'Garder un seul <footer> de premier niveau.'
    }
  },
  'landmark-banner-is-top-level': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Page header nested in another landmark',
      why: 'The page structure is announced in a confusing order.',
      howToFix: 'Place the page <header> at the top level of <body>.'
    },
    fr: {
      title: 'En-tête de page imbriqué',
      why: 'La structure de la page est annoncée dans un ordre déroutant.',
      howToFix: 'Placer le <header> de la page directement dans <body>.'
    }
  },
  'landmark-contentinfo-is-top-level': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Page footer nested in another landmark',
      why: 'The page structure is announced in a confusing order.',
      howToFix: 'Place the page <footer> at the top level of <body>.'
    },
    fr: {
      title: 'Pied de page imbriqué',
      why: 'La structure de la page est annoncée dans un ordre déroutant.',
      howToFix: 'Placer le <footer> de la page directement dans <body>.'
    }
  },
  'landmark-main-is-top-level': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Main landmark nested in another landmark',
      why: 'The main content is hard to reach directly.',
      howToFix: 'Place <main> at the top level of <body>.'
    },
    fr: {
      title: 'Contenu principal imbriqué',
      why: 'Le contenu principal est difficile à atteindre directement.',
      howToFix: 'Placer <main> directement dans <body>.'
    }
  },
  'landmark-unique': {
    rgaa: '9.2',
    severity: 'minor',
    en: {
      title: 'Landmarks cannot be told apart',
      why: 'Two navigation areas with the same name look identical in the landmark list.',
      howToFix:
        'Give each landmark of the same type a distinct aria-label ("Main menu", "Footer links").'
    },
    fr: {
      title: 'Zones impossibles à distinguer',
      why: 'Deux zones de navigation de même nom se confondent dans la liste des zones.',
      howToFix:
        'Donner à chaque zone du même type un aria-label distinct (« Menu principal », « Liens de pied de page »).'
    }
  },
  list: {
    rgaa: '9.3',
    severity: 'minor',
    en: {
      title: 'List structure is invalid',
      why: 'Improper list markup reduces structural comprehension for assistive technologies.',
      howToFix: 'Use ul/ol with only li children and keep semantic structure intact.'
    },
    fr: {
      title: 'Liste mal structurée',
      why: 'Le lecteur d’écran annonce un nombre d’éléments faux ou pas de liste du tout.',
      howToFix: 'Dans <ul> ou <ol>, ne mettre que des <li>.'
    },
    before: '<ul><div>Item</div></ul>',
    after: '<ul><li>Item</li></ul>'
  },
  listitem: {
    rgaa: '9.3',
    severity: 'minor',
    en: {
      title: 'List item outside a list',
      why: 'The item is not announced as part of a list.',
      howToFix: 'Put every <li> inside <ul> or <ol>.'
    },
    fr: {
      title: 'Élément de liste hors d’une liste',
      why: 'L’élément n’est pas annoncé comme faisant partie d’une liste.',
      howToFix: 'Placer chaque <li> dans un <ul> ou un <ol>.'
    }
  },
  dlitem: {
    rgaa: '9.3',
    severity: 'minor',
    en: {
      title: 'Definition list item not wrapped in dt or dd',
      why: 'Definition list must use proper dt/dd elements.',
      howToFix: 'Wrap each term in <dt> and each definition in <dd>.'
    },
    fr: {
      title: 'Terme ou définition hors d’une liste de définitions',
      why: 'Le couple terme/définition n’est pas restitué.',
      howToFix: 'Placer les <dt> et <dd> dans une balise <dl>.'
    },
    before: '<dl><span>Term</span><span>Definition</span></dl>',
    after: '<dl><dt>Term</dt><dd>Definition</dd></dl>'
  },
  'definition-list': {
    rgaa: '9.3',
    severity: 'minor',
    en: {
      title: 'Invalid definition list',
      why: 'Terms and definitions are not paired for assistive technologies.',
      howToFix: 'Inside <dl>, use only <dt>/<dd> groups (optionally wrapped in <div>).'
    },
    fr: {
      title: 'Liste de définitions mal structurée',
      why: 'Les termes et leurs définitions ne sont pas associés.',
      howToFix: 'Dans <dl>, n’utiliser que des groupes <dt>/<dd> (éventuellement dans des <div>).'
    }
  },

  // ── 10. Présentation ─────────────────────────────────────────
  'meta-viewport': {
    rgaa: '10.4',
    severity: 'critical',
    en: {
      title: 'Zoom is disabled',
      why: 'People with low vision cannot enlarge the text on mobile.',
      howToFix: 'Remove user-scalable=no and any maximum-scale below 2 from the viewport meta tag.'
    },
    fr: {
      title: 'Zoom bloqué',
      why: 'Une personne malvoyante ne peut pas agrandir le texte sur mobile.',
      howToFix:
        'Retirer user-scalable=no et tout maximum-scale inférieur à 2 de la balise meta viewport.'
    },
    before: '<meta name="viewport" content="width=device-width, user-scalable=no">',
    after: '<meta name="viewport" content="width=device-width, initial-scale=1">'
  },
  'meta-viewport-large': {
    rgaa: '10.4',
    severity: 'minor',
    en: {
      title: 'Zoom limited',
      why: 'Users cannot zoom enough to read comfortably.',
      howToFix: 'Allow zooming up to at least 5 times (or remove maximum-scale).'
    },
    fr: {
      title: 'Zoom limité',
      why: 'On ne peut pas zoomer assez pour lire confortablement.',
      howToFix: 'Autoriser un zoom d’au moins 5 fois (ou retirer maximum-scale).'
    }
  },
  'avoid-inline-spacing': {
    rgaa: '10.12',
    severity: 'major',
    en: {
      title: 'Text spacing locked with !important',
      why: 'People with dyslexia cannot increase line or letter spacing.',
      howToFix:
        'Do not set line-height, letter-spacing or word-spacing with !important in style attributes.'
    },
    fr: {
      title: 'Espacement du texte verrouillé par !important',
      why: 'Une personne dyslexique ne peut pas augmenter l’interlignage ou l’espacement des lettres.',
      howToFix:
        'Ne pas fixer line-height, letter-spacing ou word-spacing avec !important dans les attributs style.'
    }
  },

  // ── 11. Formulaires ──────────────────────────────────────────
  label: {
    rgaa: '11.1',
    severity: 'critical',
    en: {
      title: 'Form control is missing a label',
      why: 'Form fields without labels are difficult or impossible to understand with assistive technologies.',
      howToFix: 'Associate a visible or programmatic label with each form control.'
    },
    fr: {
      title: 'Champ de formulaire sans étiquette',
      why: 'Le lecteur d’écran annonce « zone de saisie » sans dire quoi saisir.',
      howToFix: 'Relier chaque champ à une étiquette <label for="…"> visible.'
    },
    before: '<input id="email" type="email">',
    after: '<label for="email">Email</label><input id="email" type="email">'
  },
  'select-name': {
    rgaa: '11.1',
    severity: 'critical',
    en: {
      title: 'Select list has no label',
      why: 'Users do not know what the list is for.',
      howToFix: 'Associate a <label> with the <select>.'
    },
    fr: {
      title: 'Liste déroulante sans étiquette',
      why: 'On ne sait pas à quoi sert la liste.',
      howToFix: 'Relier une étiquette <label> à la balise <select>.'
    },
    before: '<select id="pays">…</select>',
    after: '<label for="pays">Pays</label><select id="pays">…</select>'
  },
  'button-name': {
    rgaa: '11.9',
    severity: 'critical',
    en: {
      title: 'Button has no accessible name',
      why: 'Assistive technologies cannot announce the purpose of the button.',
      howToFix: 'Add visible text, aria-label, or an accessible name linked to the button.'
    },
    fr: {
      title: 'Bouton sans intitulé',
      why: 'Le lecteur d’écran annonce « bouton » sans dire ce qu’il fait.',
      howToFix: 'Ajouter un texte visible, ou un aria-label pour un bouton-icône.'
    },
    before: '<button><svg aria-hidden="true"></svg></button>',
    after: '<button aria-label="Close dialog"><svg aria-hidden="true"></svg></button>'
  },
  'input-button-name': {
    rgaa: '11.9',
    severity: 'critical',
    en: {
      title: 'Input button has no text',
      why: 'The button is announced without its action.',
      howToFix: 'Give the button a value attribute ("Send", "Search").'
    },
    fr: {
      title: 'Bouton de formulaire sans texte',
      why: 'Le bouton est annoncé sans son action.',
      howToFix: 'Donner au bouton un attribut value (« Envoyer », « Rechercher »).'
    },
    before: '<input type="submit" value="">',
    after: '<input type="submit" value="Envoyer">'
  },
  'autocomplete-valid': {
    rgaa: '11.13',
    severity: 'major',
    en: {
      title: 'Invalid autocomplete value',
      why: 'Browsers and assistive tools cannot fill in the field for the user.',
      howToFix: 'Use a value from the HTML list (name, email, tel, postal-code…).'
    },
    fr: {
      title: 'Valeur autocomplete invalide',
      why: 'Le navigateur et les aides techniques ne peuvent pas remplir le champ à la place de l’utilisateur.',
      howToFix: 'Utiliser une valeur de la liste HTML (name, email, tel, postal-code…).'
    },
    before: '<input autocomplete="courriel">',
    after: '<input autocomplete="email">'
  },

  // ── 12. Navigation ───────────────────────────────────────────
  region: {
    rgaa: '12.6',
    severity: 'major',
    en: {
      title: 'Page regions not identified',
      why: 'Screen reader users need landmarks to navigate the page.',
      howToFix: 'Use HTML5 elements (header, nav, main, footer) or ARIA landmark roles.'
    },
    fr: {
      title: 'Contenu hors des zones de la page',
      why: 'Les personnes qui naviguent par zones (en-tête, navigation, contenu) manquent ce contenu.',
      howToFix: 'Placer tout le contenu dans header, nav, main ou footer.'
    },
    before: '<div class="header">...</div>',
    after: '<header>...</header>'
  },
  bypass: {
    rgaa: '12.7',
    severity: 'major',
    en: {
      title: 'No bypass block / skip link',
      why: 'Keyboard users should be able to skip repeated content blocks.',
      howToFix: 'Add a visible-on-focus skip link targeting the main content.'
    },
    fr: {
      title: 'Pas de lien d’évitement',
      why: 'Au clavier, il faut traverser tout le menu sur chaque page avant d’atteindre le contenu.',
      howToFix: 'Ajouter en haut de page un lien « Aller au contenu » vers la zone principale.'
    },
    before: '<body>...</body>',
    after: '<a class="skip-link" href="#main">Skip to content</a>'
  },
  'skip-link': {
    rgaa: '12.7',
    severity: 'major',
    en: {
      title: 'Skip link target missing or not focusable',
      why: 'The skip link does not take keyboard users to the content.',
      howToFix: 'Point it to an existing id, e.g. <main id="main" tabindex="-1">.'
    },
    fr: {
      title: 'Cible du lien d’évitement absente',
      why: 'Le lien d’évitement n’emmène pas au contenu.',
      howToFix:
        'Le faire pointer vers un id existant, par exemple <main id="contenu" tabindex="-1">.'
    }
  },
  tabindex: {
    rgaa: '12.8',
    severity: 'major',
    en: {
      title: 'Positive tabindex',
      why: 'It forces a tab order that no longer follows the page.',
      howToFix: 'Use tabindex="0" or "-1" only, and order the HTML as it should be read.'
    },
    fr: {
      title: 'tabindex positif',
      why: 'Il impose un ordre de tabulation qui ne suit plus la page.',
      howToFix: 'N’utiliser que tabindex="0" ou "-1", et ordonner le HTML dans l’ordre de lecture.'
    },
    before: '<input tabindex="3">',
    after: '<input>'
  },

  // ── 13. Consultation ─────────────────────────────────────────
  'meta-refresh': {
    rgaa: '13.1',
    severity: 'major',
    en: {
      title: 'Page refreshes or redirects automatically',
      why: 'Users lose their place, or the content changes before they finish reading.',
      howToFix: 'Remove the timed meta refresh, or let users control it.'
    },
    fr: {
      title: 'Rafraîchissement ou redirection automatique',
      why: 'On perd sa lecture, ou le contenu change avant d’avoir fini de lire.',
      howToFix: 'Supprimer la balise meta refresh minutée, ou laisser l’utilisateur la contrôler.'
    }
  },
  marquee: {
    rgaa: '13.8',
    severity: 'major',
    en: {
      title: 'Scrolling text (<marquee>)',
      why: 'Moving text is hard to read and cannot be paused.',
      howToFix: 'Replace <marquee> with static text.'
    },
    fr: {
      title: 'Texte défilant (<marquee>)',
      why: 'Un texte qui bouge est difficile à lire et ne peut pas être arrêté.',
      howToFix: 'Remplacer <marquee> par un texte fixe.'
    }
  },
  blink: {
    rgaa: '13.8',
    severity: 'major',
    en: {
      title: 'Blinking text (<blink>)',
      why: 'Blinking content distracts and cannot be stopped.',
      howToFix: 'Remove <blink>.'
    },
    fr: {
      title: 'Texte clignotant (<blink>)',
      why: 'Un contenu clignotant distrait et ne peut pas être arrêté.',
      howToFix: 'Supprimer la balise <blink>.'
    }
  },
  'css-orientation-lock': {
    rgaa: '13.9',
    severity: 'major',
    en: {
      title: 'Display locked to one orientation',
      why: 'People with a tablet fixed on a wheelchair cannot rotate it.',
      howToFix: 'Let the content work in portrait and landscape.'
    },
    fr: {
      title: 'Affichage bloqué dans une orientation',
      why: 'Une personne dont la tablette est fixée (fauteuil roulant) ne peut pas la tourner.',
      howToFix: 'Permettre la consultation en portrait comme en paysage.'
    }
  }
});

/** Fallback when an axe rule has no RGAA mapping: axe impact → severity. */
export const IMPACT_TO_SEVERITY = Object.freeze({
  critical: 'critical',
  serious: 'major',
  moderate: 'minor',
  minor: 'minor'
});

export const FALLBACK_TEXT = Object.freeze({
  en: {
    title: 'Accessibility issue detected',
    why: 'An accessibility engine detected a potential issue that should be reviewed.',
    howToFix:
      'Review the affected element and validate the fix with keyboard and assistive technology testing.'
  },
  fr: {
    title: 'Problème d’accessibilité détecté',
    why: 'Le moteur d’analyse a repéré un problème possible, à examiner.',
    howToFix:
      'Examiner l’élément concerné et valider la correction au clavier et avec une technologie d’assistance.'
  }
});
