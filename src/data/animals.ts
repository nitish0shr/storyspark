/**
 * Canonical creature catalogue for Starmee.
 *
 * The customer picks a creature in the create wizard (stored loosely in
 * books.contextual_answers). Before this file existed the selection was passed
 * to the image model as free text inside a scene description, so "Dolphin"
 * could come back as a generic sea monster. Every creature here carries the
 * anatomy that MUST be visible and the anatomy that must NOT appear, and those
 * constraints are injected into both the story and the illustration prompt and
 * re-checked by the validator.
 */

export type CreatureKind = "animal" | "dinosaur" | "fantasy";

export interface CreatureSpec {
  /** Canonical lowercase key. */
  id: string;
  /** Customer-facing name, used verbatim in prompts. */
  label: string;
  /** Option strings (lowercased) from themes.ts that resolve to this creature. */
  aliases: string[];
  kind: CreatureKind;
  /** Anatomy that must be clearly visible in the illustration. */
  mustHave: string[];
  /** Anatomy that must NOT appear - the anti-hallucination guard. */
  mustNotHave: string[];
  /** Creatures this one is commonly confused with, called out explicitly. */
  confusedWith: string[];
}

/** Monster/mythical traits that are never acceptable outside a fantasy pick. */
export const MONSTER_TRAITS = [
  "long serpentine neck",
  "loch ness monster silhouette",
  "dragon features",
  "sea monster features",
  "fangs or claws intended to look scary",
  "reptilian scales on a mammal",
  "horns on an animal that has none",
  "multiple heads",
  "glowing red eyes",
];

const SEA: Record<string, CreatureSpec> = {
  dolphin: {
    id: "dolphin",
    label: "Dolphin",
    aliases: ["dolphin", "a friendly dolphin", "friendly dolphin"],
    kind: "animal",
    mustHave: [
      "a smooth streamlined grey-blue body with no scales",
      "one curved dorsal fin on the back",
      "exactly two side flippers",
      "a distinct beak-like rostrum (snout) with a gentle smile",
      "horizontal tail flukes",
      "a single blowhole on top of the head",
    ],
    mustNotHave: [
      "a long serpentine or swan-like neck",
      "a shell",
      "scales",
      "horns or spikes",
      "legs, claws or webbed feet",
      "a vertical fish-style tail fin",
      "any sea-monster or Loch Ness silhouette",
    ],
    confusedWith: ["Loch Ness monster", "sea serpent", "shark", "whale", "fish"],
  },
  turtle: {
    id: "turtle",
    label: "Turtle",
    aliases: ["turtle", "sea turtle", "tortoise"],
    kind: "animal",
    mustHave: [
      "a clearly visible domed patterned shell covering the back",
      "four flippers (sea turtle) or four short legs",
      "a small scaly head on a short neck",
      "a beaked mouth",
    ],
    mustNotHave: [
      "a dorsal fin",
      "a dolphin or whale snout",
      "a long serpentine neck",
      "a smooth shell-less back",
      "horizontal tail flukes",
      "any sea-monster silhouette",
    ],
    confusedWith: ["dolphin", "Loch Ness monster", "sea serpent", "frog"],
  },
  octopus: {
    id: "octopus",
    label: "Octopus",
    aliases: ["octopus"],
    kind: "animal",
    mustHave: [
      "a single soft rounded bulbous head or mantle",
      "exactly eight arms with suckers underneath",
      "two large friendly eyes",
    ],
    mustNotHave: [
      "a shell",
      "fins",
      "a beak-like dolphin snout",
      "legs or feet",
      "fewer or more than eight arms",
      "a scary kraken or monster look",
    ],
    confusedWith: ["squid", "kraken", "jellyfish"],
  },
  whale: {
    id: "whale",
    label: "Whale",
    aliases: ["whale", "humpback whale"],
    kind: "animal",
    mustHave: [
      "a very large smooth body many times bigger than the child",
      "a broad rounded head with no long beak",
      "long side flippers",
      "wide horizontal tail flukes",
      "a blowhole with a friendly water spout",
    ],
    mustNotHave: [
      "a dolphin-style pointed beak",
      "a shell",
      "scales",
      "a serpentine neck",
      "sharp teeth",
    ],
    confusedWith: ["dolphin", "shark", "sea monster"],
  },
};

const SAFARI: Record<string, CreatureSpec> = {
  elephant: {
    id: "elephant",
    label: "Elephant",
    aliases: ["elephant"],
    kind: "animal",
    mustHave: [
      "a long flexible trunk",
      "two large fan-shaped ears",
      "thick grey wrinkled legs",
      "a small tufted tail",
    ],
    mustNotHave: ["a mane", "stripes", "a long giraffe neck", "spots"],
    confusedWith: ["mammoth", "rhino"],
  },
  lion: {
    id: "lion",
    label: "Lion",
    aliases: ["lion"],
    kind: "animal",
    mustHave: [
      "a golden-tan coat",
      "a full rounded mane framing the face (male) or a smooth head (female)",
      "a tufted tail tip",
      "a friendly non-threatening expression",
    ],
    mustNotHave: ["stripes", "spots", "a trunk", "horns", "bared fangs"],
    confusedWith: ["tiger", "leopard", "house cat"],
  },
  giraffe: {
    id: "giraffe",
    label: "Giraffe",
    aliases: ["giraffe"],
    kind: "animal",
    mustHave: [
      "a very long neck",
      "brown patchwork patches on a cream coat",
      "two small ossicone horns on the head",
      "long thin legs",
    ],
    mustNotHave: ["a trunk", "a mane", "black-and-white stripes"],
    confusedWith: ["zebra", "camel"],
  },
  zebra: {
    id: "zebra",
    label: "Zebra",
    aliases: ["zebra"],
    kind: "animal",
    mustHave: [
      "bold black-and-white stripes over the whole body",
      "a short upright mane",
      "a horse-like body and hooves",
    ],
    mustNotHave: ["spots", "a trunk", "a long giraffe neck", "horns"],
    confusedWith: ["horse", "giraffe", "donkey"],
  },
};

const COMPANIONS: Record<string, CreatureSpec> = {
  parrot: {
    id: "parrot",
    label: "Parrot",
    aliases: ["a parrot", "parrot"],
    kind: "animal",
    mustHave: [
      "bright multicoloured feathers",
      "a strong curved hooked beak",
      "two wings and clawed feet gripping a perch or shoulder",
      "a long tail of feathers",
    ],
    mustNotHave: ["fur", "four legs", "a mammal snout", "bat wings"],
    confusedWith: ["owl", "chicken", "toy bird"],
  },
  monkey: {
    id: "monkey",
    label: "Monkey",
    aliases: ["a monkey", "monkey"],
    kind: "animal",
    mustHave: [
      "brown fur",
      "a long curling tail",
      "grasping hands with fingers",
      "a small expressive face",
    ],
    mustNotHave: ["feathers", "a beak", "hooves", "a mane"],
    confusedWith: ["gorilla", "sloth"],
  },
  cat: {
    id: "cat",
    label: "Ship's cat",
    aliases: ["a ship's cat", "ship's cat", "a kitten", "kitten", "cat"],
    kind: "animal",
    mustHave: [
      "a small domestic cat body with soft fur",
      "pointed triangular ears",
      "whiskers",
      "a long expressive tail",
      "four paws",
    ],
    mustNotHave: ["a mane", "tiger stripes", "feathers", "a beak"],
    confusedWith: ["lion", "tiger", "dog"],
  },
};

const REINDEER: Record<string, CreatureSpec> = {
  reindeer: {
    id: "reindeer",
    label: "Reindeer",
    aliases: ["rudolph", "dasher", "prancer", "comet", "reindeer"],
    kind: "animal",
    mustHave: [
      "branching antlers",
      "a brown furry coat",
      "hooves",
      "a warm friendly face",
    ],
    mustNotHave: ["a lion mane", "stripes", "a trunk", "wings"],
    confusedWith: ["horse", "moose", "donkey"],
  },
};

const DINOSAURS: Record<string, CreatureSpec> = {
  trex: {
    id: "trex",
    label: "T-Rex",
    aliases: ["t-rex", "trex", "tyrannosaurus", "ride a t-rex"],
    kind: "dinosaur",
    mustHave: [
      "a large head on a thick neck",
      "two tiny front arms",
      "two powerful hind legs",
      "a long balancing tail",
      "a cartoon-friendly closed or smiling mouth",
    ],
    mustNotHave: [
      "wings",
      "a neck frill",
      "horns",
      "a long sauropod neck",
      "bared bloody teeth or any frightening menace",
    ],
    confusedWith: ["dragon", "raptor", "brontosaurus"],
  },
  triceratops: {
    id: "triceratops",
    label: "Triceratops",
    aliases: ["triceratops"],
    kind: "dinosaur",
    mustHave: [
      "a large bony neck frill",
      "exactly three facial horns (two brow, one nose)",
      "four sturdy legs",
      "a beaked mouth",
    ],
    mustNotHave: ["wings", "tiny T-Rex arms", "a long sauropod neck", "fire breath"],
    confusedWith: ["rhino", "dragon", "T-Rex"],
  },
  brontosaurus: {
    id: "brontosaurus",
    label: "Brontosaurus",
    aliases: ["brontosaurus", "brachiosaurus", "sauropod"],
    kind: "dinosaur",
    mustHave: [
      "a very long neck and a very long tail",
      "a small head",
      "four thick pillar-like legs",
      "a gentle herbivore expression",
    ],
    mustNotHave: ["wings", "horns", "a neck frill", "sharp teeth", "a two-legged stance"],
    confusedWith: ["Loch Ness monster", "dragon", "T-Rex"],
  },
  pterodactyl: {
    id: "pterodactyl",
    label: "Pterodactyl",
    aliases: ["pterodactyl", "pterosaur", "fly on a pterodactyl"],
    kind: "dinosaur",
    mustHave: [
      "large leathery wings spanning from the arms",
      "a long pointed head crest",
      "a slender beak",
      "clawed feet",
    ],
    mustNotHave: ["feathers", "four walking legs with no wings", "a neck frill", "fire breath"],
    confusedWith: ["dragon", "bird", "bat"],
  },
};

/**
 * Fantasy picks. These are only ever allowed because the customer explicitly
 * chose them (Halloween theme, mermaid friend). They still must stay gentle
 * and child-friendly - "friendly", "silly", "giggly", "cuddly" is the register.
 */
const FANTASY: Record<string, CreatureSpec> = {
  ghost: {
    id: "ghost",
    label: "Friendly ghost",
    aliases: ["a friendly ghost", "friendly ghost", "ghost"],
    kind: "fantasy",
    mustHave: ["a soft rounded white floating shape", "a smiling friendly face"],
    mustNotHave: ["gore", "blood", "a frightening or menacing expression", "skulls"],
    confusedWith: ["cloud", "sheet"],
  },
  vampire: {
    id: "vampire",
    label: "Silly vampire",
    aliases: ["a silly vampire", "silly vampire", "vampire"],
    kind: "fantasy",
    mustHave: ["a cartoon cape", "a comically goofy friendly expression"],
    mustNotHave: ["blood", "sharp menacing fangs", "any frightening imagery"],
    confusedWith: ["bat", "horror vampire art"],
  },
  witch: {
    id: "witch",
    label: "Giggly witch",
    aliases: ["a giggly witch", "giggly witch", "witch"],
    kind: "fantasy",
    mustHave: ["a pointed hat", "a cheerful laughing friendly face"],
    mustNotHave: ["a frightening or evil expression", "warts played for menace", "cauldron gore"],
    confusedWith: ["wizard", "scary hag"],
  },
  werewolf: {
    id: "werewolf",
    label: "Cuddly werewolf",
    aliases: ["a cuddly werewolf", "cuddly werewolf", "werewolf"],
    kind: "fantasy",
    mustHave: ["soft fluffy fur", "a round cuddly teddy-bear-like friendly face"],
    mustNotHave: ["bared fangs", "claws shown as weapons", "blood", "any frightening menace"],
    confusedWith: ["wolf", "horror werewolf"],
  },
  mermaid: {
    id: "mermaid",
    label: "Mermaid friend",
    aliases: ["make a mermaid friend", "mermaid"],
    kind: "fantasy",
    mustHave: ["a child-friendly mermaid with a colourful fish tail", "a kind smiling face"],
    mustNotHave: ["a sea-monster look", "anything frightening"],
    confusedWith: ["siren", "sea monster"],
  },
};

export const CREATURES: Record<string, CreatureSpec> = {
  ...SEA,
  ...SAFARI,
  ...COMPANIONS,
  ...DINOSAURS,
  ...REINDEER,
  ...FANTASY,
};

/** Every alias, longest first, so "a friendly dolphin" wins over "dolphin". */
const ALIAS_INDEX: Array<{ alias: string; spec: CreatureSpec }> = Object.values(CREATURES)
  .flatMap((spec) => spec.aliases.map((alias) => ({ alias: alias.toLowerCase(), spec })))
  .sort((a, b) => b.alias.length - a.alias.length);

/**
 * Resolve a raw customer answer ("A friendly dolphin") to a creature spec.
 * Returns null when the answer is not a creature at all (e.g. "Find treasure").
 */
export function resolveCreature(raw: string | null | undefined): CreatureSpec | null {
  if (!raw) return null;
  const text = String(raw).toLowerCase().trim();
  if (!text) return null;
  const exact = ALIAS_INDEX.find((entry) => entry.alias === text);
  if (exact) return exact.spec;
  const contained = ALIAS_INDEX.find((entry) => text.includes(entry.alias));
  return contained ? contained.spec : null;
}

/** Scan a blob of contextual answers for the first recognisable creature. */
export function resolveCreatureFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): CreatureSpec | null {
  if (!answers) return null;
  for (const value of Object.values(answers)) {
    if (typeof value !== "string") continue;
    const spec = resolveCreature(value);
    if (spec) return spec;
  }
  return null;
}

/**
 * The hard constraint block injected into the illustration prompt.
 * Written as an explicit requirement, never as a creative suggestion.
 */
export function buildCreatureBlock(spec: CreatureSpec): string {
  const lines = [
    'REQUIRED CHARACTER - ' + spec.label + ':',
    'The ' + spec.label + ' is a mandatory character in this illustration and must be immediately recognisable as a ' + spec.label + '. Do not substitute, rename, or replace it with any other creature.',
    'It MUST clearly show: ' + spec.mustHave.join('; ') + '.',
    'It MUST NOT have: ' + spec.mustNotHave.join('; ') + '.',
    'Do not draw it as a ' + spec.confusedWith.join(', ') + ', or any other look-alike.',
  ];
  if (spec.kind === 'fantasy') {
    lines.push('This is a gentle, friendly, storybook-cute character for young children. Nothing frightening, menacing, or gory.');
  } else {
    const noun = spec.kind === 'dinosaur' ? 'dinosaur' : 'animal';
    lines.push('This is a real ' + noun + '. Do not add mythical or monster features: ' + MONSTER_TRAITS.join('; ') + '.');
  }
  return lines.join('\n');
}

/** The same constraint, phrased for the story text model. */
export function buildCreatureStoryRule(spec: CreatureSpec): string {
  const noun = spec.kind === 'dinosaur' ? 'dinosaur' : 'animal';
  return [
    'The child companion creature in this story is a ' + spec.label + '.',
    'Refer to it as a ' + spec.label.toLowerCase() + ' (or a name the child gives it) - never as a different animal, and never as a generic "creature", "sea creature" or "monster".',
    'Every scene description you produce must name the ' + spec.label + ' explicitly so the illustrator draws the correct animal.',
    spec.kind === 'fantasy'
      ? 'Keep it gentle, silly and friendly - never frightening.'
      : 'It is a real ' + noun + ' and must not be given mythical or monstrous features.',
  ].join(' ');
}
