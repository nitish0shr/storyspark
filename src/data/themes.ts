import { Theme } from "../types/theme";

export const themes: Theme[] = [
  {
    id: "space-adventure",
    name: "Space Adventure",
    titleTemplate: "[Child] Explores the Galaxy",
    description:
      "Blast off on an interstellar journey through stars, planets, and cosmic wonders!",
    icon: "Rocket",
    category: "adventure",
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
    category: "adventure",
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
    category: "adventure",
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
    category: "fantasy",
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
    category: "adventure",
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
    category: "heartfelt",
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
  {
    id: "pirate-treasure",
    name: "Pirate Treasure Hunt",
    titleTemplate: "Captain [Child] and the Lost Treasure",
    description:
      "Set sail on the high seas to discover hidden islands, friendly pirates, and buried treasure!",
    icon: "Compass",
    category: "adventure",
    colorScheme: {
      gradient: "from-yellow-600 via-amber-600 to-orange-700",
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      accent: "text-yellow-700",
      coverGradient: "from-yellow-900 via-amber-900 to-orange-950",
    },
    ageRange: "3-9",
    scenes: [
      "Child dressed as a pirate captain standing on a dock beside a colorful wooden ship",
      "Child at the helm of a pirate ship sailing across sparkling turquoise waters",
      "Child and a parrot friend studying an old treasure map on a sandy tropical island",
      "Child digging up a glowing treasure chest on a beach with palm trees",
      "Child sharing treasure with friendly pirates around a campfire on the beach at sunset",
    ],
    contextualQuestions: [
      {
        id: "ship_name",
        question: "What would {name} name their pirate ship?",
        type: "text",
      },
      {
        id: "pirate_pet",
        question: "What animal sidekick should sail with {name}?",
        type: "select",
        options: ["A parrot", "A monkey", "A friendly dolphin", "A ship's cat"],
      },
    ],
  },
  {
    id: "fairy-garden",
    name: "Fairy Garden",
    titleTemplate: "[Child] and the Secret Fairy Garden",
    description:
      "Shrink down to fairy size and discover a magical world hidden among the flowers!",
    icon: "Flower2",
    category: "fantasy",
    colorScheme: {
      gradient: "from-violet-400 via-fuchsia-400 to-pink-400",
      bg: "bg-violet-50",
      border: "border-violet-300",
      accent: "text-violet-600",
      coverGradient: "from-violet-900 via-fuchsia-900 to-pink-950",
    },
    ageRange: "3-8",
    scenes: [
      "Child discovering a tiny glowing door at the base of a garden flower",
      "Child shrunk to fairy size, standing on a giant daisy petal with sparkly wings",
      "Child riding a friendly ladybug through a forest of enormous flowers",
      "Child having tea with tiny fairies inside a mushroom house with glowing windows",
      "Child flying with fairy friends over a magical garden at sunset, trailing sparkles",
    ],
    contextualQuestions: [
      {
        id: "fairy_wing_color",
        question: "What color wings would {name} like?",
        type: "select",
        options: ["Rainbow sparkle", "Blue butterfly", "Pink glitter", "Golden shimmer"],
      },
      {
        id: "fairy_power",
        question: "What fairy magic would {name} have?",
        type: "select",
        options: ["Making flowers bloom", "Talking to butterflies", "Creating rainbows", "Healing animals"],
      },
    ],
  },
  {
    id: "safari-adventure",
    name: "Safari Adventure",
    titleTemplate: "[Child]'s Wild Safari Adventure",
    description:
      "Explore the African savanna and make friends with amazing animals on a magical safari!",
    icon: "Binoculars",
    category: "adventure",
    colorScheme: {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      bg: "bg-orange-50",
      border: "border-orange-300",
      accent: "text-orange-600",
      coverGradient: "from-orange-900 via-amber-900 to-yellow-950",
    },
    ageRange: "3-8",
    scenes: [
      "Child wearing a safari hat looking through binoculars at a vast golden savanna",
      "Child walking alongside a gentle baby elephant on a dusty path",
      "Child sitting with a family of lions at sunset, a lion cub in their lap",
      "Child feeding a tall giraffe who bends its long neck down to say hello",
      "Child riding in a colorful safari jeep with animal friends waving goodbye",
    ],
    contextualQuestions: [
      {
        id: "favorite_animal",
        question: "What's {name}'s favorite safari animal?",
        type: "select",
        options: ["Elephant", "Lion", "Giraffe", "Zebra"],
      },
      {
        id: "safari_discovery",
        question: "What would {name} most want to discover on safari?",
        type: "select",
        options: ["A hidden waterfall", "A baby animal", "An ancient tree", "A secret cave"],
      },
    ],
  },
  {
    id: "time-travel",
    name: "Time Travel",
    titleTemplate: "[Child] and the Time Travel Machine",
    description:
      "Journey through time to meet amazing people and see incredible things from history and the future!",
    icon: "Clock",
    category: "adventure",
    colorScheme: {
      gradient: "from-teal-500 via-cyan-500 to-sky-600",
      bg: "bg-teal-50",
      border: "border-teal-300",
      accent: "text-teal-600",
      coverGradient: "from-teal-900 via-cyan-900 to-sky-950",
    },
    ageRange: "4-10",
    scenes: [
      "Child finding a glowing pocket watch in their grandparent's attic, swirling with golden light",
      "Child stepping through a shimmering time portal made of clockwork gears and light",
      "Child meeting friendly people in an ancient setting with pyramids or castles in the background",
      "Child zooming into the future with flying cars and crystal buildings all around",
      "Child back home, placing the magical pocket watch on a shelf, glowing softly",
    ],
    contextualQuestions: [
      {
        id: "time_period",
        question: "Where in time would {name} most like to visit?",
        type: "select",
        options: ["Age of dinosaurs", "Ancient Egypt", "Medieval castles", "The far future"],
      },
      {
        id: "time_souvenir",
        question: "What souvenir would {name} bring back from their trip?",
        type: "text",
      },
    ],
  },
  {
    id: "christmas-magic",
    name: "Christmas Magic",
    titleTemplate: "[Child]'s Magical Christmas Eve",
    description:
      "A heartwarming Christmas Eve adventure with Santa, reindeer, and the true magic of giving!",
    icon: "Snowflake",
    category: "seasonal",
    badge: "Limited Edition",
    seasonal: { startMonth: 11, startDay: 15, endMonth: 12, endDay: 31 },
    colorScheme: {
      gradient: "from-red-600 via-red-500 to-green-700",
      bg: "bg-red-50",
      border: "border-red-400",
      accent: "text-red-600",
      coverGradient: "from-red-950 via-red-900 to-green-950",
    },
    ageRange: "3-10",
    scenes: [
      "Child in cozy pajamas looking out a frosty window at a snowy Christmas Eve sky",
      "Child riding in Santa's sleigh through a starry sky with reindeer pulling them along",
      "Child in Santa's workshop surrounded by cheerful elves and colorful toys",
      "Child hanging a special ornament on a giant glowing Christmas tree",
      "Child waking up on Christmas morning to find a magical gift under the tree",
    ],
    contextualQuestions: [
      {
        id: "christmas_wish",
        question: "What is {name}'s biggest Christmas wish this year?",
        type: "text",
      },
      {
        id: "reindeer_friend",
        question: "Which reindeer would {name} want as a friend?",
        type: "select",
        options: ["Rudolph", "Dasher", "Prancer", "Comet"],
      },
    ],
  },
  {
    id: "halloween-adventure",
    name: "Halloween Adventure",
    titleTemplate: "[Child]'s Spooky Halloween Night",
    description:
      "A not-too-scary Halloween adventure with friendly monsters, candy, and magical jack-o'-lanterns!",
    icon: "Moon",
    category: "seasonal",
    badge: "Limited Edition",
    seasonal: { startMonth: 9, startDay: 15, endMonth: 11, endDay: 5 },
    colorScheme: {
      gradient: "from-orange-600 via-amber-600 to-purple-800",
      bg: "bg-orange-50",
      border: "border-orange-400",
      accent: "text-orange-600",
      coverGradient: "from-orange-950 via-amber-950 to-purple-950",
    },
    ageRange: "3-9",
    scenes: [
      "Child in a fun Halloween costume standing outside a spooky but colorful haunted house",
      "Child trick-or-treating on a moonlit street with friendly ghosts floating alongside",
      "Child at a Halloween party with friendly monster friends dancing and eating candy",
      "Child carving a magical glowing jack-o'-lantern that winks back at them",
      "Child flying on a friendly witch's broomstick over a moonlit village with candy-colored houses",
    ],
    contextualQuestions: [
      {
        id: "costume",
        question: "What Halloween costume would {name} wear?",
        type: "text",
      },
      {
        id: "halloween_friend",
        question: "What friendly spooky creature should join the adventure?",
        type: "select",
        options: ["A friendly ghost", "A silly vampire", "A giggly witch", "A cuddly werewolf"],
      },
    ],
  },
];

export function getThemeById(themeId: string): Theme | undefined {
  return themes.find((t) => t.id === themeId);
}
