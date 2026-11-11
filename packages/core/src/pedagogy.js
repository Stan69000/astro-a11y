/**
 * Plain-language content for the "learning" mode (workshops, first audits, non-developers):
 * for each RGAA criterion checked by astro-a11y, who is affected and how to experience the
 * problem yourself. A test checks that every mapped criterion has an entry.
 */

/**
 * @typedef {{ who: string[], tryIt: string }} LessonText
 * @typedef {{ en: LessonText, fr: LessonText }} Lesson
 */

const SCREEN_READER = {
  en: 'Blind people using a screen reader',
  fr: 'Personnes aveugles qui utilisent un lecteur d’écran'
};
const LOW_VISION = { en: 'People with low vision', fr: 'Personnes malvoyantes' };
const KEYBOARD = {
  en: 'People who navigate with the keyboard only (motor disability, power users)',
  fr: 'Personnes qui naviguent uniquement au clavier (handicap moteur, utilisateurs avancés)'
};
const VOICE = {
  en: 'People using voice control',
  fr: 'Personnes qui pilotent leur ordinateur à la voix'
};
const COLOR_BLIND = {
  en: 'People who do not perceive some colors',
  fr: 'Personnes qui distinguent mal certaines couleurs'
};
const DEAF = { en: 'Deaf and hard-of-hearing people', fr: 'Personnes sourdes ou malentendantes' };
const COGNITIVE = {
  en: 'People with attention or cognitive disorders',
  fr: 'Personnes avec des troubles de l’attention ou cognitifs'
};
const DYS = { en: 'People with dyslexia', fr: 'Personnes dyslexiques' };
const EVERYONE = {
  en: 'Everyone, on a phone or in bright sunlight',
  fr: 'Tout le monde, sur téléphone ou en plein soleil'
};
const SEIZURE = {
  en: 'People sensitive to motion or epilepsy',
  fr: 'Personnes sensibles aux mouvements ou épileptiques'
};
const MOTOR = {
  en: 'People with a fixed device (wheelchair mount)',
  fr: 'Personnes dont l’appareil est fixé (support de fauteuil roulant)'
};

function lesson(groups, tryEn, tryFr) {
  return Object.freeze({
    en: { who: groups.map((g) => g.en), tryIt: tryEn },
    fr: { who: groups.map((g) => g.fr), tryIt: tryFr }
  });
}

const SCREEN_READER_TRY = [
  'Turn on the screen reader of your device (VoiceOver: Cmd+F5 on Mac; NVDA, free, on Windows) and listen to the element.',
  'Activez le lecteur d’écran de votre appareil (VoiceOver : Cmd+F5 sur Mac ; NVDA, gratuit, sous Windows) et écoutez l’élément.'
];
const KEYBOARD_TRY = [
  'Put the mouse aside and browse the page with Tab, Shift+Tab and Enter.',
  'Posez la souris et parcourez la page avec Tab, Maj+Tab et Entrée.'
];

/** @type {Readonly<Record<string, Lesson>>} */
export const LESSONS = Object.freeze({
  1.1: lesson(
    [SCREEN_READER],
    'Disable images in your browser (or read the page with a screen reader): is the information still there?',
    'Désactivez les images dans le navigateur (ou écoutez la page avec un lecteur d’écran) : l’information est-elle toujours là ?'
  ),
  1.3: lesson([SCREEN_READER], ...SCREEN_READER_TRY),
  2.1: lesson([SCREEN_READER], ...SCREEN_READER_TRY),
  2.2: lesson([SCREEN_READER], ...SCREEN_READER_TRY),
  3.1: lesson(
    [COLOR_BLIND, LOW_VISION],
    'Look at the page in grayscale (accessibility settings of your phone or computer): can you still spot the information?',
    'Affichez l’écran en niveaux de gris (réglages d’accessibilité du téléphone ou de l’ordinateur) : repérez-vous encore l’information ?'
  ),
  3.2: lesson(
    [LOW_VISION, EVERYONE],
    'Read the page on your phone outdoors, or lower the screen brightness.',
    'Lisez la page sur votre téléphone en extérieur, ou baissez la luminosité de l’écran.'
  ),
  4.3: lesson(
    [DEAF],
    'Watch the video with the sound off: do you understand what is said?',
    'Regardez la vidéo sans le son : comprenez-vous ce qui est dit ?'
  ),
  '4.10': lesson(
    [SCREEN_READER, COGNITIVE],
    'Open the page with a screen reader running: can you still hear it over the sound?',
    'Ouvrez la page avec un lecteur d’écran actif : l’entendez-vous encore par-dessus le son ?'
  ),
  5.4: lesson([SCREEN_READER], ...SCREEN_READER_TRY),
  5.6: lesson(
    [SCREEN_READER],
    'Move through the table with a screen reader (Ctrl+Alt+arrows with VoiceOver or NVDA): are the headers announced with each value?',
    'Parcourez le tableau avec un lecteur d’écran (Ctrl+Alt+flèches avec VoiceOver ou NVDA) : les en-têtes sont-ils annoncés avec chaque valeur ?'
  ),
  5.7: lesson(
    [SCREEN_READER],
    'Move through the table with a screen reader (Ctrl+Alt+arrows with VoiceOver or NVDA): are the headers announced with each value?',
    'Parcourez le tableau avec un lecteur d’écran (Ctrl+Alt+flèches avec VoiceOver ou NVDA) : les en-têtes sont-ils annoncés avec chaque valeur ?'
  ),
  6.2: lesson(
    [SCREEN_READER, VOICE],
    'List the links of the page with a screen reader (rotor: Ctrl+Option+U with VoiceOver): can you tell where each one leads?',
    'Affichez la liste des liens avec un lecteur d’écran (rotor : Ctrl+Option+U avec VoiceOver) : savez-vous où mène chacun ?'
  ),
  7.1: lesson([SCREEN_READER, VOICE], ...SCREEN_READER_TRY),
  8.2: lesson([SCREEN_READER], ...SCREEN_READER_TRY),
  8.3: lesson(
    [SCREEN_READER],
    'Listen to the page with a screen reader: is the French read with an English accent?',
    'Écoutez la page avec un lecteur d’écran : le français est-il lu avec un accent anglais ?'
  ),
  8.4: lesson(
    [SCREEN_READER],
    'Listen to the page with a screen reader: is the French read with an English accent?',
    'Écoutez la page avec un lecteur d’écran : le français est-il lu avec un accent anglais ?'
  ),
  8.5: lesson(
    [SCREEN_READER, COGNITIVE],
    'Open several tabs: can you tell which tab is this page?',
    'Ouvrez plusieurs onglets : savez-vous lequel correspond à cette page ?'
  ),
  8.7: lesson(
    [SCREEN_READER],
    'Listen to the passage in another language with a screen reader: is it pronounced correctly?',
    'Écoutez le passage en langue étrangère avec un lecteur d’écran : est-il bien prononcé ?'
  ),
  9.1: lesson(
    [SCREEN_READER, COGNITIVE],
    'Use the free HeadingsMap extension: does the list of headings read like a table of contents?',
    'Utilisez l’extension gratuite HeadingsMap : la liste des titres se lit-elle comme une table des matières ?'
  ),
  9.2: lesson(
    [SCREEN_READER],
    'List the regions of the page with a screen reader (rotor with VoiceOver, D key with NVDA): header, navigation, main content, footer?',
    'Affichez les zones de la page avec un lecteur d’écran (rotor avec VoiceOver, touche D avec NVDA) : en-tête, navigation, contenu, pied de page ?'
  ),
  9.3: lesson(
    [SCREEN_READER],
    'Listen to the list with a screen reader: is the number of items announced?',
    'Écoutez la liste avec un lecteur d’écran : le nombre d’éléments est-il annoncé ?'
  ),
  10.4: lesson(
    [LOW_VISION],
    'On your phone, try to zoom in with two fingers.',
    'Sur votre téléphone, essayez d’agrandir la page avec deux doigts.'
  ),
  10.7: lesson([KEYBOARD, LOW_VISION], ...KEYBOARD_TRY),
  10.12: lesson(
    [DYS, LOW_VISION],
    'Apply a "text spacing" bookmarklet: does the text stay readable and complete?',
    'Appliquez un bookmarklet « espacement du texte » : le texte reste-t-il lisible et complet ?'
  ),
  11.1: lesson(
    [SCREEN_READER, VOICE, COGNITIVE],
    'Click on the text next to the field: if the cursor does not move into the field, the label is not linked.',
    'Cliquez sur le texte à côté du champ : si le curseur ne va pas dans le champ, l’étiquette n’est pas reliée.'
  ),
  11.9: lesson([SCREEN_READER, VOICE], ...SCREEN_READER_TRY),
  11.13: lesson(
    [COGNITIVE, MOTOR],
    'Let your browser autofill the form: are your name, e-mail and address suggested?',
    'Laissez le navigateur remplir le formulaire : vos nom, e-mail et adresse sont-ils proposés ?'
  ),
  12.6: lesson(
    [SCREEN_READER, KEYBOARD],
    'List the regions of the page with a screen reader: is all the content inside one of them?',
    'Affichez les zones de la page avec un lecteur d’écran : tout le contenu est-il rangé dans l’une d’elles ?'
  ),
  12.7: lesson(
    [KEYBOARD, SCREEN_READER],
    'Reload the page and press Tab once: does a "Skip to content" link appear and work?',
    'Rechargez la page et appuyez une fois sur Tab : un lien « Aller au contenu » apparaît-il, et fonctionne-t-il ?'
  ),
  12.8: lesson([KEYBOARD], ...KEYBOARD_TRY),
  12.9: lesson([KEYBOARD], ...KEYBOARD_TRY),
  13.1: lesson(
    [SCREEN_READER, COGNITIVE],
    'Stay on the page without touching anything: does it reload or move to another page by itself?',
    'Restez sur la page sans rien toucher : se recharge-t-elle ou change-t-elle de page toute seule ?'
  ),
  13.8: lesson(
    [COGNITIVE, SEIZURE],
    'Try to read the moving text, then look for a way to stop it.',
    'Essayez de lire le texte qui bouge, puis cherchez comment l’arrêter.'
  ),
  13.9: lesson(
    [MOTOR],
    'Turn your phone or tablet: does the page follow?',
    'Tournez votre téléphone ou votre tablette : la page suit-elle ?'
  )
});

/**
 * @param {string} criterion
 * @param {string} [lang]
 * @returns {LessonText | undefined}
 */
export function lessonFor(criterion, lang = 'en') {
  const lessonEntry = Object.hasOwn(LESSONS, criterion) ? LESSONS[criterion] : undefined;
  return lessonEntry ? (lessonEntry[lang] ?? lessonEntry.en) : undefined;
}
