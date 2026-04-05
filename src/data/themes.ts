import { Theme } from "../types/theme";

export const themes: Theme[] = [
  {
    id: "space-adventure",
    name: "Space Adventure",
    titleTemplate: "[Child] Explores the Galaxy",
    description:
      "Blast off on an interstellar journey through stars, planets, and cosmic wonders!",
    icon: "Rocket",
    colorScheme: {
      gradient: "from-indigo-600 via-purple-600 to-blue-800",
      bg: "bg-indigo-50",
      border: "border-indigo-300",
      accent: "text-indigo-600",
      coverGradient: "from-indigo-900 via-purple-900 to-blue-950",
    },
    ageRange: "3-8",
    scenes: [
      "Child standing in their backyard at night, gazing up at a sky full of twinkling stars",
      "Child inside a colorful rocket ship cockpit, pressing buttons and looking out the window at Earth below",
      "Child floating in space near Saturn's rings, wearing a cute space suit with a glass helmet",
      "Child meeting friendly, round alien creatures on a glowing purple planet with two moons",
      "Child planting a glowing flag on a new planet, rocket ship parked behind them under a starry sky",
    ],
    contextualQuestions: [
      {
        id: "planet",
        question: "What planet would {name} most want to visit?",
        type: "select",
        options: ["Mars", "Jupiter", "Saturn", "A made-up one"],
      },
      {
        id: "spaceship_name",
        question: "What would {name} name their spaceship?",
        type: "text",
      },
    ],
  },
  {
    id: "dinosaur-discovery",
    name: "Dinosaur Discovery",
    titleTemplate: "[Child] and the Dinosaur Discovery",
    description:
      "Travel back in time to meet gentle giants and roaring friends from the age of dinosaurs!",
    icon: "Egg",
    colorScheme: {
      gradient: "from-green-600 via-emerald-600 to-lime-600",
      bg: "bg-green-50",
      border: "border-green-300",
      accent: "text-green-600",
      coverGradient: "from-green-900 via-emerald-900 to-lime-950",
    },
    ageRange: "3-8",
    scenes: [
      "Child discovering a glowing dinosaur egg half-buried in a mossy forest floor",
      "Child riding on the back of a friendly Brontosaurus through a lush prehistoric jungle",
      "Child sharing fruit with a baby Triceratops beside a sparkling stream with ferns all around",
      "Child watching a Pterodactyl soar overhead while standing on a cliff above a misty valley",
      "Child hugging a gentle T-Rex who is bending down, with a volcano glowing softly in the background",
    ],
    contextualQuestions: [
      {
        id: "favorite_dinosaur",
        question: "What's {name}'s favorite dinosaur?",
        type: "select",
        options: ["T-Rex", "Triceratops", "Brontosaurus", "Pterodactyl"],
      },
      {
        id: "dino_ride",
        question:
          "Would {name} rather ride a T-Rex or fly on a Pterodactyl?",
        type: "select",
        options: ["Ride a T-Rex", "Fly on a Pterodactyl"],
      },
    ],
  },
  {
    id: "under-the-sea",
    name: "Under the Sea",
    titleTemplate: "[Child]'s Underwater Adventure",
    description:
      "Dive into a sparkling ocean world filled with friendly sea creatures and hidden treasures!",
    icon: "Fish",
    colorScheme: {
      gradient: "from-cyan-500 via-blue-500 to-teal-600",
      bg: "bg-cyan-50",
      border: "border-cyan-300",
      accent: "text-cyan-600",
      coverGradient: "from-cyan-900 via-blue-900 to-teal-950",
    },
    ageRange: "3-8",
    scenes: [
      "Child wading into glowing turquoise water at a magical beach with seashells and starfish",
      "Child swimming alongside a smiling dolphin through a coral reef bursting with color",
      "Child sitting inside a giant open clamshell, surrounded by curious fish and floating bubbles",
      "Child discovering a sunken treasure chest on the sandy ocean floor, light beams filtering down",
      "Child waving goodbye to sea friends from the shore as a rainbow arcs over the ocean",
    ],
    contextualQuestions: [
      {
        id: "sea_creature",
        question: "What's {name}'s favorite sea creature?",
        type: "select",
        options: ["Dolphin", "Turtle", "Octopus", "Whale"],
      },
      {
        id: "sea_choice",
        question:
          "Would {name} rather find treasure or make a mermaid friend?",
        type: "select",
        options: ["Find treasure", "Make a mermaid friend"],
      },
    ],
  },
  {
    id: "royal-quest",
    name: "Royal Quest",
    titleTemplate: "[Child] and the Royal Quest",
    description:
      "Enter a magical kingdom of castles, enchanted forests, and a quest only a true royal can complete!",
    icon: "Crown",
    colorScheme: {
      gradient: "from-amber-500 via-yellow-500 to-orange-500",
      bg: "bg-amber-50",
      border: "border-amber-300",
      accent: "text-amber-600",
      coverGradient: "from-amber-900 via-yellow-900 to-orange-950",
    },
    ageRange: "3-10",
    scenes: [
      "Child wearing a royal crown and cape, standing at the gates of a magnificent sparkling castle",
      "Child riding a gentle white horse through an enchanted forest with glowing fireflies",
      "Child crossing a stone bridge over a shimmering moat while friendly woodland creatures watch",
      "Child using their magical power to light up a dark crystal cave with dazzling colors",
      "Child seated on a golden throne in a grand hall, cheered by a crowd of kingdom friends",
    ],
    contextualQuestions: [
      {
        id: "role",
        question: "Is {name} a prince, princess, or knight?",
        type: "select",
        options: ["Prince", "Princess", "Knight"],
      },
      {
        id: "magical_power",
        question: "What magical power would {name} want?",
        type: "select",
        options: [
          "Flying",
          "Invisibility",
          "Talking to animals",
          "Super strength",
        ],
      },
    ],
  },
  {
    id: "superhero-origin",
    name: "Superhero Origin",
    titleTemplate: "[Child]: The Superhero Story",
    description:
      "Every hero has an origin story. Discover the superpower within and save the day!",
    icon: "Zap",
    colorScheme: {
      gradient: "from-red-500 via-rose-500 to-pink-600",
      bg: "bg-red-50",
      border: "border-red-300",
      accent: "text-red-600",
      coverGradient: "from-red-900 via-rose-900 to-pink-950",
    },
    ageRange: "4-10",
    scenes: [
      "Child discovering a glowing star-shaped gem in their bedroom that pulses with light",
      "Child in a homemade superhero cape, striking a heroic pose on a rooftop at sunset",
      "Child using their superpower to help people in a colorful, friendly city",
      "Child facing a silly but harmless villain made of jelly in the town square",
      "Child celebrated by a cheering crowd in a parade, wearing their hero cape proudly",
    ],
    contextualQuestions: [
      {
        id: "superpower",
        question: "What superpower would {name} have?",
        type: "select",
        options: ["Flying", "Super strength", "Speed", "Glow power"],
      },
      {
        id: "rescue_target",
        question: "Who do they rescue first?",
        type: "select",
        options: ["A kitten", "Their best friend", "The whole town"],
      },
    ],
  },
  {
    id: "kindness-courage",
    name: "Kindness & Courage",
    titleTemplate: "[Child]'s Book of Kindness and Courage",
    description:
      "A heartfelt story celebrating the real-life bravery and kindness that makes your child special.",
    icon: "Heart",
    colorScheme: {
      gradient: "from-pink-400 via-rose-400 to-fuchsia-500",
      bg: "bg-pink-50",
      border: "border-pink-300",
      accent: "text-pink-600",
      coverGradient: "from-pink-900 via-rose-900 to-fuchsia-950",
    },
    ageRange: "3-12",
    scenes: [
      "Child sitting under a big tree in a sunny meadow, holding a small glowing heart in their hands",
      "Child helping a younger child who has fallen down, extending a hand with a warm smile",
      "Child standing bravely at the edge of something new, like a stage or a tall slide, taking a deep breath",
      "Child surrounded by friends and family in a warm living room, everyone smiling and laughing",
      "Child looking at their reflection in a pond, seeing a crown of golden light around their head",
    ],
    contextualQuestions: [
      {
        id: "kind_act",
        question: "What's a kind thing {name} did recently?",
        type: "text",
      },
      {
        id: "brave_thing",
        question: "What is {name} learning to be brave about?",
        type: "text",
      },
    ],
  },
];

export function getThemeById(themeId: string): Theme | undefined {
  return themes.find((t) => t.id === themeId);
}
