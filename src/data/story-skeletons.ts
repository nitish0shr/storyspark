export interface StorySkeletonPage {
  pageNumber: number;
  template: string;
  dualTemplate?: string;
  sceneDescription: string;
  dualCharacterSceneDescription?: string;
}

export function getSceneDescription(
  page: StorySkeletonPage,
  hasTwoChildren: boolean
): string {
  if (hasTwoChildren && page.dualCharacterSceneDescription) {
    return page.dualCharacterSceneDescription;
  }
  return page.sceneDescription;
}

export function getTemplate(
  page: StorySkeletonPage,
  hasTwoChildren: boolean
): string {
  if (hasTwoChildren && page.dualTemplate) {
    return page.dualTemplate;
  }
  return page.template;
}

export const storySkeletons: Record<string, StorySkeletonPage[]> = {
  "space-adventure": [
    {
      pageNumber: 1,
      template:
        "Every night, {name} looked up at the sky and counted the stars. One, two, three... so many! The moon winked down like an old friend. \"Someday,\" {name} whispered, \"I'm going to visit every single one.\" Little did {name} know, someday was closer than {pronoun} thought.",
      dualTemplate:
        "Every night, {name} and {name2} looked up at the sky and counted the stars together. One, two, three... so many! The moon winked down like an old friend. \"Someday,\" {name} whispered, \"we're going to visit every single one.\" {name2} squeezed {name}'s hand. \"Together!\" Little did they know, someday was closer than they thought.",
      sceneDescription:
        "Child standing in their backyard at night, gazing up at a sky full of twinkling stars, wearing pajamas with little rocket ships on them",
      dualCharacterSceneDescription:
        "Two children standing together in their backyard at night, gazing up at a sky full of twinkling stars, wearing pajamas with little rocket ships on them",
    },
    {
      pageNumber: 2,
      template:
        "The very next morning, something extraordinary appeared in the backyard. A gleaming rocket ship sat right between the swing set and the old oak tree! It sparkled like silver rain and hummed a gentle tune. A note on the door read: \"For {name} -- Captain of {spaceship_name}.\"",
      dualTemplate:
        "The very next morning, something extraordinary appeared in the backyard. A gleaming rocket ship sat right between the swing set and the old oak tree! It sparkled like silver rain and hummed a gentle tune. A note on the door read: \"For {name} and {name2} -- Co-Captains of {spaceship_name}.\"",
      sceneDescription:
        "A shiny, colorful rocket ship parked in a cozy backyard next to a swing set, morning sunlight glinting off its surface",
    },
    {
      pageNumber: 3,
      template:
        "{name} climbed inside {spaceship_name} and gasped. The cockpit was full of blinking buttons in every color -- red, blue, green, and one big sparkly gold one. {name} pressed the gold button. WHOOOOSH! The rocket lifted off the ground, up past the clouds, up past the birds, up, up, up into the great dark sky!",
      dualTemplate:
        "{name} and {name2} climbed inside {spaceship_name} together and gasped. The cockpit was full of blinking buttons in every color. {name} pressed the big sparkly gold one while {name2} held on tight. WHOOOOSH! The rocket lifted off the ground, up past the clouds, up past the birds, up, up, up into the great dark sky!",
      sceneDescription:
        "Child inside a colorful rocket ship cockpit, pressing a big gold button, looking amazed as Earth shrinks in the window behind them",
      dualCharacterSceneDescription:
        "Two children inside a colorful rocket ship cockpit, one pressing a big gold button while the other watches amazed, Earth shrinking in the window behind them",
    },
    {
      pageNumber: 4,
      template:
        "Stars zoomed past the windows like fireflies in a jar. {name} flew past the Moon, which waved with a dusty gray hand. \"Where are you going?\" the Moon asked. \"To {planet}!\" {name} called back. \"Give it my best!\" the Moon replied, and {name} zoomed onward through the glittering dark.",
      dualTemplate:
        "Stars zoomed past the windows like fireflies in a jar. {name} and {name2} flew past the Moon, which waved with a dusty gray hand. \"Where are you going?\" the Moon asked. \"To {planet}!\" they called back together. \"Give it my best!\" the Moon replied, and the two friends zoomed onward through the glittering dark.",
      sceneDescription:
        "Rocket ship flying past a friendly smiling Moon, stars streaking by like ribbons of light against deep blue space",
    },
    {
      pageNumber: 5,
      template:
        "{planet} was even more amazing than {name} had imagined. The ground shimmered in swirls of color, and the sky had not one but two suns! Strange, beautiful flowers sang soft melodies, and tiny glowing creatures floated like living lanterns. Everything smelled like warm cinnamon and starlight.",
      dualTemplate:
        "{planet} was even more amazing than {name} and {name2} had imagined. The ground shimmered in swirls of color, and the sky had not one but two suns! Strange, beautiful flowers sang soft melodies, and tiny glowing creatures floated like living lanterns. {name2} reached out and caught one gently. \"It's warm!\" {name2} whispered.",
      sceneDescription:
        "Child stepping out of the rocket onto a beautiful alien planet with swirling colorful ground, two suns in the sky, and glowing floating creatures",
      dualCharacterSceneDescription:
        "Two children stepping out of the rocket together onto a beautiful alien planet with swirling colorful ground, two suns in the sky, and glowing floating creatures",
    },
    {
      pageNumber: 6,
      template:
        "A round, friendly creature bounced over. It was soft like a pillow and purple like a plum, with three big sparkly eyes. \"Welcome!\" it squeaked. \"We've been waiting for you, {name}! We need your help. Our Star Garden has gone dark, and only someone brave can bring back the light.\"",
      dualTemplate:
        "A round, friendly creature bounced over. It was soft like a pillow and purple like a plum, with three big sparkly eyes. \"Welcome!\" it squeaked. \"We've been waiting for you, {name} and {name2}! We need your help. Our Star Garden has gone dark, and only someone brave can bring back the light.\"",
      sceneDescription:
        "Child meeting a cute round purple alien creature with three sparkly eyes on the colorful alien planet surface",
    },
    {
      pageNumber: 7,
      template:
        "{name} followed the little creature to the Star Garden. It was a field of crystal flowers that used to glow, but now they were dim and quiet. In the very center sat a sleeping star, curled up like a kitten. \"It forgot how to shine,\" the creature whispered. {name} knelt down gently.",
      dualTemplate:
        "{name} and {name2} followed the little creature to the Star Garden. It was a field of crystal flowers that used to glow, but now they were dim and quiet. In the very center sat a sleeping star, curled up like a kitten. \"It forgot how to shine,\" the creature whispered. {name} and {name2} knelt down gently side by side.",
      sceneDescription:
        "Child kneeling beside a sleeping star in a garden of dim crystal flowers, the purple alien creature watching hopefully nearby",
    },
    {
      pageNumber: 8,
      template:
        "\"You can do it,\" {name} said softly to the little star. \"I believe in you. Even when things feel dark, there's always light inside.\" {name} placed {possessive} hands around the star and hummed a gentle lullaby. Slowly, warmly, the star began to glow -- first a flicker, then a blaze of golden light!",
      dualTemplate:
        "\"You can do it,\" {name} said softly to the little star. {name2} nodded and added, \"We believe in you. Even when things feel dark, there's always light inside.\" Together they placed their hands around the star and hummed a gentle lullaby. Slowly, warmly, the star began to glow -- first a flicker, then a blaze of golden light!",
      sceneDescription:
        "Child cradling a glowing star in their hands, golden light spreading outward, crystal flowers beginning to light up all around",
      dualCharacterSceneDescription:
        "Two children cradling a glowing star together in their hands, golden light spreading outward, crystal flowers beginning to light up all around",
    },
    {
      pageNumber: 9,
      template:
        "One by one, every crystal flower burst into brilliant light -- blue, pink, gold, and green! The Star Garden was alive again, and all the little creatures cheered and bounced and sang. \"You did it, {name}!\" they cried. \"You brought back our light!\" The whole planet seemed to shimmer with gratitude.",
      dualTemplate:
        "One by one, every crystal flower burst into brilliant light -- blue, pink, gold, and green! The Star Garden was alive again, and all the little creatures cheered and bounced and sang. \"You did it, {name} and {name2}!\" they cried. \"You brought back our light!\" The whole planet seemed to shimmer with gratitude.",
      sceneDescription:
        "A dazzling garden of glowing crystal flowers in brilliant colors, happy alien creatures bouncing and celebrating around the child",
    },
    {
      pageNumber: 10,
      template:
        "The creatures gave {name} a tiny star in a glass jar. \"So you'll always have a piece of our sky,\" they said. {name} hugged each one goodbye, climbed back into {spaceship_name}, and set a course for home. The stars outside the window seemed to wave as {pronoun} passed.",
      dualTemplate:
        "The creatures gave {name} and {name2} each a tiny star in a glass jar. \"So you'll always have a piece of our sky,\" they said. The two friends hugged each creature goodbye, climbed back into {spaceship_name}, and set a course for home. The stars outside the window seemed to wave as they passed.",
      sceneDescription:
        "Child holding a small glowing star in a jar, waving goodbye to alien friends from the rocket ship door",
      dualCharacterSceneDescription:
        "Two children each holding a tiny star in a glass jar, waving goodbye to alien friends from the rocket ship door",
    },
    {
      pageNumber: 11,
      template:
        "{spaceship_name} landed softly in the backyard just as the sun was setting. {name} hopped out, holding the star jar close. The rocket ship hummed one last gentle song, then disappeared in a shimmer of silver dust, leaving only a trail of sparkles on the grass.",
      dualTemplate:
        "{spaceship_name} landed softly in the backyard just as the sun was setting. {name} and {name2} hopped out, holding their star jars close. The rocket ship hummed one last gentle song, then disappeared in a shimmer of silver dust, leaving only a trail of sparkles on the grass.",
      sceneDescription:
        "Rocket ship landing in the backyard at sunset, leaving a trail of silver sparkles, child climbing out holding a glowing jar",
    },
    {
      pageNumber: 12,
      template:
        "That night, {name} placed the tiny star on the nightstand. It glowed softly, filling the room with a warm golden light. \"Goodnight, stars,\" {name} whispered. And somewhere far, far away on {planet}, a little purple creature whispered back, \"Goodnight, {name}. Thank you for believing.\"",
      dualTemplate:
        "That night, {name} and {name2} placed their tiny stars on the nightstand between them. The stars glowed softly, filling the room with a warm golden light. \"Goodnight, stars,\" they whispered together. And somewhere far, far away on {planet}, a little purple creature whispered back, \"Goodnight, {name} and {name2}. Thank you for believing.\"",
      sceneDescription:
        "Child tucked in bed, a glowing star jar on the nightstand casting warm golden light across a cozy bedroom",
      dualCharacterSceneDescription:
        "Two children tucked in bed together, a glowing star jar on the nightstand casting warm golden light across a cozy bedroom",
    },
  ],

  "dinosaur-discovery": [
    {
      pageNumber: 1,
      template:
        "{name} loved dinosaurs more than anything in the whole wide world. {possessive} room was full of dinosaur books, dinosaur toys, and even dinosaur pajamas. But {name} had a secret wish -- to meet a real, living dinosaur. \"If only,\" {pronoun} sighed, hugging {possessive} stuffed {favorite_dinosaur}.",
      dualTemplate:
        "{name} and {name2} loved dinosaurs more than anything in the whole wide world. Their room was full of dinosaur books, dinosaur toys, and even dinosaur pajamas. But they had a secret wish -- to meet a real, living dinosaur. \"If only,\" they sighed together, hugging a stuffed {favorite_dinosaur}.",
      sceneDescription:
        "Child in a bedroom filled with dinosaur posters, toys, and books, hugging a stuffed dinosaur while looking wistfully out the window",
      dualCharacterSceneDescription:
        "Two children in a bedroom filled with dinosaur posters, toys, and books, one hugging a stuffed dinosaur while both look wistfully out the window",
    },
    {
      pageNumber: 2,
      template:
        "One sunny morning, {name} was digging in the garden when {possessive} shovel hit something hard. Scrape, scrape, brush, brush -- and there it was: a giant egg! It was speckled green and gold and warm to the touch. It trembled, then wobbled, then CRACK! A tiny head poked out.",
      dualTemplate:
        "One sunny morning, {name} and {name2} were digging in the garden together when their shovels hit something hard. Scrape, scrape, brush, brush -- and there it was: a giant egg! It was speckled green and gold and warm to the touch. It trembled, then wobbled, then CRACK! A tiny head poked out.",
      sceneDescription:
        "Child kneeling in a garden, brushing dirt off a large speckled green and gold egg that is beginning to crack open",
    },
    {
      pageNumber: 3,
      template:
        "Out tumbled a baby {favorite_dinosaur}, no bigger than a puppy! It blinked its big round eyes at {name} and let out a squeaky little roar. Then it nuzzled right into {name}'s arms. \"I'll call you Pebble,\" {name} laughed as the baby dinosaur licked {possessive} cheek.",
      dualTemplate:
        "Out tumbled a baby {favorite_dinosaur}, no bigger than a puppy! It blinked its big round eyes at {name} and {name2} and let out a squeaky little roar. Then it nuzzled into both their arms. \"I'll call you Pebble,\" {name} laughed as the baby dinosaur licked {name2}'s cheek.",
      sceneDescription:
        "Child holding a tiny adorable baby dinosaur that is licking their cheek, both surrounded by garden flowers and sunshine",
      dualCharacterSceneDescription:
        "Two children holding a tiny adorable baby dinosaur together, both laughing as it licks their cheeks, surrounded by garden flowers and sunshine",
    },
    {
      pageNumber: 4,
      template:
        "Pebble sneezed, and a swirl of sparkly dust filled the air. When {name} opened {possessive} eyes, the backyard was GONE. In its place stood a prehistoric jungle with trees as tall as buildings and ferns the size of cars. Enormous dragonflies buzzed overhead. They had traveled back in time!",
      dualTemplate:
        "Pebble sneezed, and a swirl of sparkly dust filled the air. When {name} and {name2} opened their eyes, the backyard was GONE. In its place stood a prehistoric jungle with trees as tall as buildings and ferns the size of cars. Enormous dragonflies buzzed overhead. They had traveled back in time -- together!",
      sceneDescription:
        "Child and baby dinosaur standing in a lush prehistoric jungle with enormous ferns, towering trees, and giant dragonflies",
    },
    {
      pageNumber: 5,
      template:
        "A friendly Brontosaurus lowered its long, long neck and blinked at {name}. \"Hop on,\" it seemed to say. {name} climbed up carefully, settling between the great dinosaur's shoulders. Pebble scrambled up too. Together they rode above the treetops, seeing rivers of silver and mountains of green stretching on forever.",
      dualTemplate:
        "A friendly Brontosaurus lowered its long, long neck and blinked at them. \"Hop on,\" it seemed to say. {name} climbed up first and helped {name2} up carefully. Pebble scrambled up too. Together they rode above the treetops, seeing rivers of silver and mountains of green stretching on forever.",
      sceneDescription:
        "Child riding high on a gentle Brontosaurus above the treetops of a prehistoric jungle, baby dinosaur sitting beside them, vast landscape visible",
      dualCharacterSceneDescription:
        "Two children riding high on a gentle Brontosaurus above the treetops of a prehistoric jungle, baby dinosaur sitting beside them, vast landscape visible",
    },
    {
      pageNumber: 6,
      template:
        "By a sparkling stream, they found a family of Triceratops munching on bright red berries. The littlest one waddled over and nudged {name}'s hand. {name} giggled and shared some berries. \"You're just like Pebble -- friendly and hungry!\" The baby Triceratops snorted happily.",
      dualTemplate:
        "By a sparkling stream, they found a family of Triceratops munching on bright red berries. The littlest one waddled over and nudged {name}'s hand. {name2} giggled and shared some berries with another. \"They're just like Pebble -- friendly and hungry!\" The baby Triceratops snorted happily.",
      sceneDescription:
        "Child sitting by a sparkling stream sharing berries with a baby Triceratops, while a family of Triceratops grazes peacefully nearby",
    },
    {
      pageNumber: 7,
      template:
        "A shadow swept over the clearing. {name} looked up and saw a magnificent Pterodactyl gliding across the sky, its wings wide as a rainbow. It circled down and landed gently. {name} reached out and touched its warm, leathery wing. \"You're beautiful,\" {name} breathed.",
      dualTemplate:
        "A shadow swept over the clearing. {name} and {name2} looked up and saw a magnificent Pterodactyl gliding across the sky, its wings wide as a rainbow. It circled down and landed gently. {name2} reached out and touched its warm, leathery wing. \"You're beautiful,\" {name} breathed.",
      sceneDescription:
        "Child reaching up to touch the wing of a magnificent Pterodactyl that has landed beside them, sunlight filtering through its outstretched wings",
    },
    {
      pageNumber: 8,
      template:
        "But then the ground began to rumble. BOOM. BOOM. BOOM. Through the trees came the biggest dinosaur of all -- a towering T-Rex! {name}'s heart beat fast. But the T-Rex looked down with soft, kind eyes and let out a low, gentle rumble. It wasn't scary at all. It was saying hello!",
      dualTemplate:
        "But then the ground began to rumble. BOOM. BOOM. BOOM. Through the trees came the biggest dinosaur of all -- a towering T-Rex! {name2}'s heart beat fast, but {name} squeezed {name2}'s hand. The T-Rex looked down with soft, kind eyes and let out a low, gentle rumble. It was saying hello!",
      sceneDescription:
        "A massive but gentle-looking T-Rex bending down toward the child, who stands bravely looking up with wonder rather than fear",
      dualCharacterSceneDescription:
        "A massive but gentle-looking T-Rex bending down toward two children, who stand bravely together looking up with wonder rather than fear",
    },
    {
      pageNumber: 9,
      template:
        "The T-Rex led {name} and Pebble to a hidden valley where all the dinosaurs gathered together. There were dinosaurs of every shape and size, playing and splashing and munching. \"This is your home, Pebble,\" {name} said softly, as the baby dinosaur looked around with wonder.",
      dualTemplate:
        "The T-Rex led {name}, {name2}, and Pebble to a hidden valley where all the dinosaurs gathered together. There were dinosaurs of every shape and size, playing and splashing and munching. \"This is your home, Pebble,\" {name} said softly, as {name2} petted the baby dinosaur one last time.",
      sceneDescription:
        "A magical hidden valley filled with diverse dinosaurs playing peacefully, child standing at the entrance with baby dinosaur, golden light flooding in",
    },
    {
      pageNumber: 10,
      template:
        "Pebble looked at {name}, then at the other dinosaurs, then back at {name}. The little dinosaur pressed its head against {name}'s chest and rumbled softly. \"I know,\" {name} whispered, hugging Pebble tight. \"This is where you belong. But I'll never forget you. Not ever.\"",
      dualTemplate:
        "Pebble looked at {name} and {name2}, then at the other dinosaurs, then back at them. The little dinosaur pressed its head against both their chests and rumbled softly. \"We know,\" {name2} whispered. {name} hugged Pebble tight. \"This is where you belong. But we'll never forget you. Not ever.\"",
      sceneDescription:
        "Emotional scene of child hugging the baby dinosaur close, both looking at each other with love, other dinosaurs watching gently in the background",
      dualCharacterSceneDescription:
        "Emotional scene of two children hugging the baby dinosaur close together, other dinosaurs watching gently in the background",
    },
    {
      pageNumber: 11,
      template:
        "Pebble sneezed one more time, and the sparkly dust swirled again. When {name} opened {possessive} eyes, {pronoun} was back in the garden. The sun was warm. The birds were singing. And right there in the dirt, where the egg had been, lay a single green and gold speckle -- a tiny piece of Pebble's shell.",
      dualTemplate:
        "Pebble sneezed one more time, and the sparkly dust swirled again. When {name} and {name2} opened their eyes, they were back in the garden. The sun was warm. The birds were singing. And right there in the dirt, where the egg had been, lay two green and gold speckles -- tiny pieces of Pebble's shell, one for each of them.",
      sceneDescription:
        "Child back in the familiar garden, kneeling down to pick up a small speckled eggshell fragment, sunlight streaming down warmly",
    },
    {
      pageNumber: 12,
      template:
        "{name} put the little shell on {possessive} nightstand, right next to the stuffed {favorite_dinosaur}. \"Goodnight, Pebble,\" {name} whispered. And if {pronoun} listened very, very carefully through the open window, {pronoun} could almost hear a tiny, happy roar carried on the evening breeze.",
      dualTemplate:
        "{name} and {name2} put the little shells on their nightstand, right next to the stuffed {favorite_dinosaur}. \"Goodnight, Pebble,\" they whispered together. And if they listened very, very carefully through the open window, they could almost hear a tiny, happy roar carried on the evening breeze.",
      sceneDescription:
        "Child in bed, a small green eggshell on the nightstand next to a stuffed dinosaur toy, window open to a starry night sky",
      dualCharacterSceneDescription:
        "Two children in bed together, a small green eggshell on the nightstand next to a stuffed dinosaur toy, window open to a starry night sky",
    },
  ],

  "under-the-sea": [
    {
      pageNumber: 1,
      template:
        "{name} stood at the edge of the ocean, letting the waves tickle {possessive} toes. The water was the bluest blue {pronoun} had ever seen -- bluer than the sky, bluer than blueberries. \"I wonder what's down there,\" {name} said, peering into the sparkling sea. Something shimmered just below the surface.",
      dualTemplate:
        "{name} and {name2} stood at the edge of the ocean, letting the waves tickle their toes. The water was the bluest blue they had ever seen. \"I wonder what's down there,\" {name} said. {name2} pointed excitedly. Something shimmered just below the surface.",
      sceneDescription:
        "Child standing barefoot at the water's edge on a beautiful sunny beach, peering curiously into crystal-clear turquoise water",
      dualCharacterSceneDescription:
        "Two children standing barefoot at the waters edge on a beautiful sunny beach, both peering curiously into crystal-clear turquoise water",
    },
    {
      pageNumber: 2,
      template:
        "A beautiful {sea_creature} popped its head above the waves and smiled. Yes, smiled! \"Come swim with me, {name}!\" it called in a voice like bubbles. It tossed {name} a glowing pearl necklace. The moment {name} put it on, something amazing happened -- {pronoun} could breathe underwater!",
      dualTemplate:
        "A beautiful {sea_creature} popped its head above the waves and smiled. \"Come swim with me, {name} and {name2}!\" it called. It tossed them each a glowing pearl necklace. The moment they put them on, something amazing happened -- they could breathe underwater!",
      sceneDescription:
        "A friendly sea creature emerging from the waves offering a glowing pearl necklace to the delighted child on the beach",
    },
    {
      pageNumber: 3,
      template:
        "SPLASH! {name} dove in. The ocean wrapped around {object} like a warm blanket. Fish in every color of the rainbow swam past -- orange and purple and electric blue. The {sea_creature} swam beside {name}, and together they glided through a coral reef that looked like an underwater garden.",
      dualTemplate:
        "SPLASH! {name} and {name2} dove in together. The ocean wrapped around them like a warm blanket. Fish in every color of the rainbow swam past. The {sea_creature} swam beside them, and together they glided through a coral reef that looked like an underwater garden.",
      sceneDescription:
        "Child swimming joyfully underwater beside their sea creature friend, surrounded by colorful coral reef and tropical fish",
      dualCharacterSceneDescription:
        "Two children swimming joyfully underwater beside their sea creature friend, surrounded by colorful coral reef and tropical fish",
    },
    {
      pageNumber: 4,
      template:
        "They swam through an archway of pink coral into a hidden cove. There, a family of seahorses danced in a circle, their tiny tails curling like ribbons. \"Welcome, {name}!\" they chimed. A baby seahorse floated over and perched on {name}'s finger. It was no bigger than a thumb.",
      dualTemplate:
        "They swam through an archway of pink coral into a hidden cove. There, a family of seahorses danced in a circle. \"Welcome, {name} and {name2}!\" they chimed. A baby seahorse floated over and perched on {name}'s finger while another nestled against {name2}'s palm.",
      sceneDescription:
        "Child in an underwater cove with dancing seahorses, a tiny baby seahorse perched on their finger, pink coral archway behind them",
    },
    {
      pageNumber: 5,
      template:
        "Deeper they swam, past jellyfish that glowed like floating lanterns and starfish that waved from every rock. An old wise turtle paddled up slowly. \"Young {name},\" it said, \"there's trouble below. The Sunken Palace has lost its light. Will you help us find it again?\"",
      dualTemplate:
        "Deeper they swam, past jellyfish that glowed like floating lanterns. An old wise turtle paddled up slowly. \"Young {name} and brave {name2},\" it said, \"there's trouble below. The Sunken Palace has lost its light. Will you help us find it again?\" They looked at each other and nodded.",
      sceneDescription:
        "Child floating beside a large wise sea turtle, surrounded by glowing jellyfish and waving starfish in deeper blue water",
      dualCharacterSceneDescription:
        "Two children floating beside a large wise sea turtle, surrounded by glowing jellyfish and waving starfish in deeper blue water",
    },
    {
      pageNumber: 6,
      template:
        "The {sea_creature} led {name} down, down, down to the Sunken Palace. It was a castle made of shells and sea glass, but it was dark and quiet. The pearl at its very top had gone missing. Without it, the whole ocean floor was losing its glow. \"We need to find that pearl,\" {name} said bravely.",
      dualTemplate:
        "The {sea_creature} led them down, down, down to the Sunken Palace. It was a castle made of shells and sea glass, but it was dark and quiet. The pearl at its very top had gone missing. \"We need to find that pearl,\" {name} said. \"Together,\" {name2} agreed.",
      sceneDescription:
        "Child and sea creature friend approaching a dim but beautiful underwater palace made of shells and sea glass on the ocean floor",
    },
    {
      pageNumber: 7,
      template:
        "{name} searched through underwater caves and seaweed forests. {pronoun} looked inside giant clamshells and behind sleeping whales. Finally, deep in a dark grotto, {name} spotted something: a faint, golden glow, hidden under a pile of smooth stones. The missing pearl!",
      dualTemplate:
        "{name} and {name2} searched through underwater caves and seaweed forests. {name} looked inside giant clamshells while {name2} checked behind sleeping whales. Finally, deep in a dark grotto, {name2} spotted something: a faint, golden glow, hidden under a pile of smooth stones. The missing pearl!",
      sceneDescription:
        "Child discovering a faintly glowing golden pearl hidden under stones in a dark underwater grotto, light illuminating their excited face",
    },
    {
      pageNumber: 8,
      template:
        "But a grumpy octopus was guarding it, arms crossed and frowning. \"That's MY shiny thing,\" it huffed. {name} sat down on the sandy floor. \"I understand,\" {name} said gently. \"It IS beautiful. But the whole ocean needs its light. What if we find you something even shinier?\"",
      dualTemplate:
        "But a grumpy octopus was guarding it, arms crossed and frowning. \"That's MY shiny thing,\" it huffed. {name} sat down on the sandy floor. \"I understand,\" {name} said gently. {name2} added, \"It IS beautiful. But the whole ocean needs its light. What if we find you something even shinier?\"",
      sceneDescription:
        "Child sitting on the ocean floor having a friendly conversation with a grumpy but cute octopus who is hugging the golden pearl",
      dualCharacterSceneDescription:
        "Two children sitting on the ocean floor having a friendly conversation with a grumpy but cute octopus who is hugging the golden pearl",
    },
    {
      pageNumber: 9,
      template:
        "{name} took the glowing pearl necklace from {possessive} own neck and offered it to the octopus. The octopus's eyes went wide. \"For me? Really?\" it whispered. \"Really,\" {name} smiled. The octopus hugged {name} with all eight arms and handed over the palace pearl. \"You're the kindest person in the whole ocean!\"",
      dualTemplate:
        "{name} took the glowing pearl necklace and {name2} offered theirs too -- both to the octopus. Its eyes went wide. \"For me? Really?\" it whispered. \"Really,\" they both smiled. The octopus hugged them with all eight arms and handed over the palace pearl. \"You're the kindest pair in the whole ocean!\"",
      sceneDescription:
        "Octopus happily hugging the child with all eight arms while exchanging the palace pearl for the glowing necklace, both smiling",
    },
    {
      pageNumber: 10,
      template:
        "{name} swam up to the Sunken Palace and placed the pearl on top. WHOOOOSH! Light exploded outward like an underwater sunrise. The whole ocean floor lit up in gold and blue and green. Every creature cheered -- the fish, the seahorses, the turtle, even the octopus wearing its new sparkly necklace.",
      dualTemplate:
        "{name} and {name2} swam up to the Sunken Palace together and placed the pearl on top. WHOOOOSH! Light exploded outward like an underwater sunrise. Every creature cheered -- the fish, the seahorses, the turtle, even the octopus wearing its new sparkly necklaces.",
      sceneDescription:
        "Child placing the golden pearl on top of the palace, brilliant light radiating outward, sea creatures celebrating all around",
      dualCharacterSceneDescription:
        "Two children together placing the golden pearl on top of the palace, brilliant light radiating outward, sea creatures celebrating all around",
    },
    {
      pageNumber: 11,
      template:
        "The {sea_creature} nuzzled {name} gently. \"Thank you for saving our home,\" it said. \"You'll always be welcome here.\" It pressed a tiny shell into {name}'s palm. \"Hold this to your ear, and you'll hear us singing.\" {name} hugged {possessive} friend one last time.",
      dualTemplate:
        "The {sea_creature} nuzzled them both gently. \"Thank you for saving our home,\" it said. It pressed a tiny shell into each of their palms. \"Hold these to your ears, and you'll hear us singing.\" {name} and {name2} hugged their friend one last time.",
      sceneDescription:
        "Child and sea creature friend sharing a tender goodbye, the sea creature pressing a small shell into the child's hand, glowing palace behind them",
    },
    {
      pageNumber: 12,
      template:
        "Back on the shore, {name} held the little shell to {possessive} ear. Sure enough -- the sound of the ocean was there, but also something more: tiny voices, singing {name}'s name. {name} smiled, toes in the warm sand, watching the waves sparkle. The sea would always hold a special place in {possessive} heart.",
      dualTemplate:
        "Back on the shore, {name} and {name2} held their little shells to their ears. Sure enough -- the sound of the ocean was there, but also something more: tiny voices, singing both their names. They smiled, toes in the warm sand, watching the waves sparkle. The sea would always hold a special place in their hearts.",
      sceneDescription:
        "Child sitting on the beach at sunset, holding a shell to their ear and smiling, waves sparkling with magical light in the background",
      dualCharacterSceneDescription:
        "Two children sitting on the beach at sunset, each holding a shell to their ear and smiling, waves sparkling with magical light in the background",
    },
  ],

  "royal-quest": [
    {
      pageNumber: 1,
      template:
        "Once upon a time, in a kingdom where sunflowers grew as tall as houses and rivers sparkled like diamonds, there lived a young {role} named {name}. {name} was kind to every creature, brave in every storm, and had a laugh that made flowers bloom. But today, the kingdom needed {object} more than ever.",
      dualTemplate:
        "Once upon a time, in a kingdom where sunflowers grew as tall as houses, there lived two young royals named {name} and {name2}. They were kind to every creature, brave in every storm, and had laughs that made flowers bloom. But today, the kingdom needed them more than ever.",
      sceneDescription:
        "Child wearing a royal crown and cape standing in a magical kingdom with oversized sunflowers and sparkling rivers, a grand castle in the distance",
      dualCharacterSceneDescription:
        "Two children wearing royal crowns and capes standing together in a magical kingdom with oversized sunflowers and sparkling rivers",
    },
    {
      pageNumber: 2,
      template:
        "The Royal Messenger arrived at dawn, out of breath. \"Your Highness! The Enchanted Crystal that keeps our kingdom bright has been taken to the top of Moonpeak Mountain! Without it, darkness will cover the land by sundown.\" {name} stood tall. \"Then I shall go and bring it back.\"",
      dualTemplate:
        "The Royal Messenger arrived at dawn. \"Your Highnesses! The Enchanted Crystal has been taken to the top of Moonpeak Mountain! Without it, darkness will cover the land by sundown.\" {name} and {name2} exchanged determined looks. \"Then we shall go and bring it back -- together.\"",
      sceneDescription:
        "A small messenger bird delivering an urgent scroll to the child in a grand castle hallway, morning light streaming through stained glass windows",
    },
    {
      pageNumber: 3,
      template:
        "{name} put on {possessive} finest traveling cloak and packed a bag with bread, cheese, and a compass that always pointed toward home. At the castle gate, a beautiful white horse waited, its mane braided with tiny bells. \"Let's ride, friend,\" {name} said, and off they galloped into the Enchanted Forest.",
      dualTemplate:
        "{name} and {name2} put on their finest traveling cloaks and packed a bag with bread, cheese, and a compass. At the castle gate, a beautiful white horse waited. \"Let's ride, friend,\" {name} said, and with {name2} behind, they galloped into the Enchanted Forest.",
      sceneDescription:
        "Child in a royal traveling cloak mounting a beautiful white horse with bells in its mane, at the gates of a sparkling castle",
      dualCharacterSceneDescription:
        "Two children in royal traveling cloaks mounting a beautiful white horse with bells in its mane, at the gates of a sparkling castle",
    },
    {
      pageNumber: 4,
      template:
        "The Enchanted Forest was full of wonders. Trees whispered secrets, mushrooms glowed in jewel tones, and fireflies spelled out words of encouragement: \"YOU CAN DO IT, {name}!\" A family of foxes bowed as {pronoun} passed. Even the forest believed in {object}.",
      dualTemplate:
        "The Enchanted Forest was full of wonders. Trees whispered secrets, mushrooms glowed in jewel tones, and fireflies spelled out: \"YOU CAN DO IT, {name} AND {name2}!\" A family of foxes bowed as they passed. Even the forest believed in them.",
      sceneDescription:
        "Child riding through an enchanted forest with glowing mushrooms, whispering trees, and fireflies forming encouraging words in the air",
    },
    {
      pageNumber: 5,
      template:
        "But the path ended at a deep, rushing river with no bridge. {name} looked around thoughtfully. Then {pronoun} remembered {possessive} special gift -- {magical_power}! {name} closed {possessive} eyes, took a deep breath, and used {possessive} power. The river calmed, and stepping stones rose from the water, one by one.",
      dualTemplate:
        "The path ended at a deep, rushing river with no bridge. {name} and {name2} looked at each other thoughtfully. Then together they used their {magical_power}! The river calmed, and stepping stones rose from the water, one by one. {name2} went first and {name} followed close behind.",
      sceneDescription:
        "Child using magical power at the edge of a rushing river, glowing stepping stones rising from the water, magical energy swirling around them",
      dualCharacterSceneDescription:
        "Two children using magical power together at the edge of a rushing river, glowing stepping stones rising from the water",
    },
    {
      pageNumber: 6,
      template:
        "On the other side, a grumpy troll sat on a rock, arms folded. \"Nobody passes!\" it growled. But {name} wasn't afraid. \"You look cold and lonely,\" {name} said, and offered the troll some bread and cheese. The troll's eyes softened. \"Nobody's ever been kind to me before,\" it sniffled. \"Go ahead, Your Highness.\"",
      dualTemplate:
        "On the other side, a grumpy troll sat on a rock. \"Nobody passes!\" it growled. But {name} wasn't afraid. \"You look cold and lonely,\" {name2} said, and {name} offered bread and cheese. The troll's eyes softened. \"Nobody's ever been kind to me before. Go ahead, Your Highnesses.\"",
      sceneDescription:
        "Child offering bread and cheese to a grumpy but softening troll sitting on a mossy rock beside the path, the troll starting to smile",
    },
    {
      pageNumber: 7,
      template:
        "The path climbed higher and higher up Moonpeak Mountain. The wind blew harder and the sky grew darker. But {name} kept climbing, step by step. {possessive} horse nickered encouragement. \"We're almost there,\" {name} said. And then {pronoun} saw it -- the peak, glowing faintly under the last light of day.",
      dualTemplate:
        "The path climbed higher up Moonpeak Mountain. The wind blew harder and the sky grew darker. But {name} and {name2} kept climbing together, step by step, encouraging each other. \"We're almost there,\" {name2} said. And then they saw it -- the peak, glowing faintly under the last light of day.",
      sceneDescription:
        "Child climbing a steep mountain path with their white horse, wind blowing their cloak, a faintly glowing peak visible above through dark clouds",
    },
    {
      pageNumber: 8,
      template:
        "At the very top sat the Enchanted Crystal on a stone pedestal. It pulsed with a warm, golden light. But wrapped around it was a shadow creature, dark and swirling. \"This crystal is mine now,\" it hissed. {name}'s heart beat fast, but {pronoun} did not run. A true {role} never gives up.",
      dualTemplate:
        "At the very top sat the Enchanted Crystal on a stone pedestal. Wrapped around it was a shadow creature. \"This crystal is mine now,\" it hissed. {name} and {name2}'s hearts beat fast, but they did not run. They stood together, hand in hand. True royals never give up.",
      sceneDescription:
        "Child facing a dark swirling shadow creature wrapped around a golden glowing crystal on a mountain peak, standing brave and determined",
      dualCharacterSceneDescription:
        "Two children facing a dark swirling shadow creature wrapped around a golden glowing crystal on a mountain peak, standing brave together",
    },
    {
      pageNumber: 9,
      template:
        "{name} stepped forward and spoke in a clear, steady voice: \"Darkness cannot stay where there is kindness.\" {pronoun} used {possessive} {magical_power} once more, pouring all {possessive} courage and love into it. A blinding flash of light burst from {name}'s hands, and the shadow creature dissolved like morning fog.",
      dualTemplate:
        "{name} and {name2} stepped forward together and spoke in clear, steady voices: \"Darkness cannot stay where there is kindness.\" They combined their {magical_power}, pouring all their courage and love into it. A blinding flash of light burst from their joined hands, and the shadow creature dissolved like morning fog.",
      sceneDescription:
        "Child using their magical power to blast brilliant light at the shadow creature, which is dissolving into wisps, the crystal blazing with renewed energy",
    },
    {
      pageNumber: 10,
      template:
        "{name} lifted the Enchanted Crystal high above {possessive} head. Its light streamed down the mountainside like liquid gold, racing across the kingdom. Flowers opened. Stars appeared. The rivers sparkled again. From far below, {name} could hear the people cheering. The kingdom was saved!",
      dualTemplate:
        "{name} and {name2} lifted the Enchanted Crystal high together. Its light streamed down the mountainside like liquid gold, racing across the kingdom. Flowers opened. Stars appeared. From far below, they could hear the people cheering. The kingdom was saved!",
      sceneDescription:
        "Child holding the glowing crystal triumphantly above their head on the mountain peak, golden light streaming down across the entire kingdom below",
      dualCharacterSceneDescription:
        "Two children together holding the glowing crystal triumphantly above their heads on the mountain peak, golden light streaming down",
    },
    {
      pageNumber: 11,
      template:
        "The ride home was full of celebration. The troll waved a tiny flag. The foxes lined the path. The fireflies spelled out \"HOORAY!\" The whole kingdom had gathered at the castle gates, tossing flower petals into the air. The Royal Messenger announced: \"{name}, the Brave and Kind!\"",
      dualTemplate:
        "The ride home was full of celebration. The troll waved a tiny flag. The foxes lined the path. The fireflies spelled out \"HOORAY!\" The whole kingdom had gathered at the castle gates. The Royal Messenger announced: \"{name} and {name2}, the Brave and Kind!\"",
      sceneDescription:
        "Grand celebration scene with the child riding back into the kingdom on their white horse, flower petals in the air, cheering crowds and friendly creatures",
    },
    {
      pageNumber: 12,
      template:
        "That night, the Enchanted Crystal glowed from the highest tower, bathing the kingdom in warm light. And in the coziest room of the castle, {name} curled up under a blanket of stars. \"Being brave isn't about not being scared,\" {name} thought. \"It's about being kind even when things are hard.\" And with that, the bravest {role} in the land fell fast asleep.",
      dualTemplate:
        "That night, the Enchanted Crystal glowed from the highest tower. And in the coziest room of the castle, {name} and {name2} curled up under a blanket of stars. \"Being brave isn't about not being scared,\" {name} said. {name2} nodded. \"It's about being kind even when things are hard -- and having a friend beside you.\" And with that, the bravest pair in the land fell fast asleep.",
      sceneDescription:
        "Child curled up in a cozy castle bedroom, warm starlight from the crystal tower spilling through the window, looking peaceful and content",
      dualCharacterSceneDescription:
        "Two children curled up together in a cozy castle bedroom, warm starlight from the crystal tower spilling through the window",
    },
  ],

  "superhero-origin": [
    {
      pageNumber: 1,
      template:
        "{name} was an ordinary kid who did ordinary things: ate cereal in the morning, played outside after school, and always remembered to brush {possessive} teeth. But sometimes, late at night, {name} felt a tiny buzz in {possessive} fingers and wondered: \"What if I'm meant for something... extraordinary?\"",
      dualTemplate:
        "{name} and {name2} had a secret. While other kids played ordinary games, they dreamed of saving the world. Their rooms were covered in superhero posters and comic books. \"One day,\" {name} always said. {name2} always replied, \"Together.\" They didn't know that one day was about to arrive.",
      sceneDescription:
        "Child in their everyday bedroom looking at their hands with curiosity, a faint sparkle visible at their fingertips in the evening light",
      dualCharacterSceneDescription:
        "Two children sitting together on a bedroom floor reading comic books, superhero posters covering the walls, both looking dreamy",
    },
    {
      pageNumber: 2,
      template:
        "One evening, a shooting star streaked across the sky -- but instead of disappearing, it curved, turned, and flew straight through {name}'s open window! It landed softly on the pillow: a glowing, star-shaped gem, warm and humming with power. When {name} picked it up, it flashed so bright the whole room turned golden.",
      dualTemplate:
        "It happened on a regular Tuesday. A strange, glowing meteorite landed in the park with a soft WHOMP! {name} and {name2} were the first to find it. When they both touched it at the same time, a warm tingle raced through their fingers, up their arms, and into their hearts. They looked at each other with wide eyes.",
      sceneDescription:
        "A glowing star-shaped gem landing on a child's pillow through an open window, the room filling with golden light, child reaching toward it in wonder",
    },
    {
      pageNumber: 3,
      template:
        "{name} felt the power flow through {possessive} whole body like warm sunshine. {pronoun} jumped -- and floated! {pronoun} stretched {possessive} hands -- and they glowed! {name} had a superpower: {superpower}! \"This is AMAZING!\" {name} laughed, spinning around the room. Every superhero needs a beginning, and this was {possessive}.",
      dualTemplate:
        "The next morning, {name} accidentally lifted the entire breakfast table with one finger. {name2} sneezed and accidentally flew across the room! They had SUPERPOWERS! {name} could {superpower} and {name2} had incredible speed! They looked at each other and grinned. \"We're a superhero TEAM!\"",
      sceneDescription:
        "Child floating in their bedroom, hands glowing with power, laughing with pure joy, bedroom items gently floating around them",
      dualCharacterSceneDescription:
        "Two children in matching superhero costumes discovering their powers together, energy glowing around their hands",
    },
    {
      pageNumber: 4,
      template:
        "Every superhero needs a look. {name} found an old red blanket and tied it into the perfect cape. {pronoun} added goggles from the costume box and boots that made a satisfying STOMP with every step. {name} looked in the mirror and struck a pose. \"Watch out, world. Here I come!\"",
      dualTemplate:
        "They needed costumes! {name} designed a brilliant cape and mask, while {name2} added the perfect boots and belt. Together they created matching emblems -- two stars intertwined. When they put on their costumes, they felt like they could do anything. \"Ready, partner?\" \"Ready!\"",
      sceneDescription:
        "Child in a homemade superhero costume -- red cape, fun goggles, boots -- striking a confident pose in front of a mirror, looking heroic and adorable",
    },
    {
      pageNumber: 5,
      template:
        "{name} zoomed into town just in time. The sky had turned a funny shade of green, and a mischievous villain called the Jelly Giant was bouncing through the streets! It was made entirely of wobbly, jiggly purple jelly, and it was bumping into everything, making a sticky mess of the whole town square.",
      dualTemplate:
        "Their first mission came quickly. A kitten was stuck on top of the tallest building in town! {name} flew up while {name2} made sure everyone below was safe. Working as a team, they rescued the kitten in seconds. The crowd below gasped and then CHEERED! \"Who are you?\" they called.",
      sceneDescription:
        "A silly purple jelly giant bouncing through a colorful town square, knocking things around, people looking up in surprise, child arriving heroically",
      dualCharacterSceneDescription:
        "Two young superheroes flying together over a colorful city skyline, capes billowing in the wind, working as a team",
    },
    {
      pageNumber: 6,
      template:
        "\"Stop right there, Jelly Giant!\" {name} called out bravely. The Jelly Giant turned around and wobbled. \"Make me!\" it giggled, launching a glob of jelly into the air. But {name} used {possessive} {superpower} to dodge it perfectly! The crowd gasped. A real superhero!",
      dualTemplate:
        "But not everyone was cheering. The mischievous Shadow Trickster was causing problems downtown -- making traffic lights go haywire and turning park fountains into bubble machines. \"Time for the real test,\" {name} said. {name2} nodded. \"Let's go.\"",
      sceneDescription:
        "Child in superhero cape using their superpower to dodge a glob of jelly, crowd watching in amazement, the jelly giant looking surprised",
    },
    {
      pageNumber: 7,
      template:
        "But being a hero isn't just about power. {name} noticed something: the Jelly Giant wasn't mean -- it was crying jelly tears! \"Wait,\" {name} said, landing gently. \"What's wrong?\" The Giant sniffled. \"Nobody wants to play with me because I'm too sticky and I break everything!\"",
      dualTemplate:
        "They found the Shadow Trickster on the roof of City Hall, laughing and juggling stolen stars from the sky. \"You can't stop me!\" it cackled. {name} and {name2} looked at each other. They didn't need to speak -- they already knew the plan.",
      sceneDescription:
        "Child approaching the jelly giant gently, the giant sitting down looking sad with jelly tears, child showing compassion and concern",
    },
    {
      pageNumber: 8,
      template:
        "{name} thought for a moment. \"What if we find a place where being big and bouncy is perfect?\" {name} led the Jelly Giant to the empty park, where it could bounce all it wanted without bumping into anything. BOING! BOING! BOING! The Giant laughed with joy. Soon other kids came to bounce with it too!",
      dualTemplate:
        "{name} used {superpower} to create a dazzling distraction while {name2} zoomed around behind the Trickster at incredible speed. Together they caught every falling star and placed them back in the sky. The Trickster's shadows melted in the combined light of their courage.",
      sceneDescription:
        "Child leading the happy jelly giant to a park, children bouncing and playing with it, everyone laughing and having fun together",
      dualCharacterSceneDescription:
        "Two children in superhero costumes facing a challenge together, combining their powers to create a brilliant beam of light",
    },
    {
      pageNumber: 9,
      template:
        "But there was still one more thing to do. {name} heard a tiny sound: \"Mew! Mew!\" It was {rescue_target}, in trouble! Stuck, scared, and needing help right now. {name} didn't hesitate for even one second. {pronoun} used {possessive} {superpower} with all {possessive} might and -- WHOOSH -- the rescue was a success!",
      dualTemplate:
        "The Shadow Trickster shrank down to the size of a mouse. \"I... I just wanted someone to notice me,\" it squeaked. {name} knelt down gently. \"Everyone wants to be seen,\" {name} said. {name2} offered a tiny hand. \"You could use your powers for good -- like us.\" The little shadow smiled for the first time.",
      sceneDescription:
        "Child using their superpower dramatically to rescue someone/something in need, action lines and energy effects surrounding the heroic moment",
    },
    {
      pageNumber: 10,
      template:
        "The whole town gathered in the square. The mayor stepped forward. \"Today, we witnessed something truly special. Not just {superpower}, but something greater -- kindness, bravery, and heart.\" The crowd cheered: \"{name}! {name}! {name}!\" Confetti rained down like colorful snow.",
      dualTemplate:
        "The Mayor gave {name} and {name2} the Golden Star Medal -- the highest honor in the city. \"For bravery, teamwork, and showing us that true heroes lead with kindness,\" she said. The crowd cheered as the two heroes stood side by side, medals gleaming.",
      sceneDescription:
        "Child standing on a small stage in the town square, mayor presenting them to cheering crowds, colorful confetti falling from the sky",
      dualCharacterSceneDescription:
        "Two children being celebrated as heroes by grateful citizens, standing together on a stage with medals around their necks",
    },
    {
      pageNumber: 11,
      template:
        "The Jelly Giant gave {name} a wobbly salute. The rescued {rescue_target} nuzzled close. The townspeople clapped and waved. {name} waved back, cape fluttering in the breeze. It had been the most incredible day. But {name} knew the best part wasn't the cheering -- it was knowing {pronoun} had helped.",
      dualTemplate:
        "As they flew home across the sunset sky, {name} and {name2} high-fived mid-air. Below them, the city twinkled with lights and gratitude. \"Same time tomorrow?\" {name} asked. \"Wouldn't miss it,\" {name2} grinned. Being a hero was great. Being a hero team was even better.",
      sceneDescription:
        "Child waving to the crowd with cape fluttering, jelly giant saluting in the background, warm sunset light across the town square",
    },
    {
      pageNumber: 12,
      template:
        "Back in {possessive} room, {name} placed the star gem on the windowsill. It pulsed gently, like a heartbeat. {name} knew that being a superhero wasn't really about the powers. It was about choosing to be kind, choosing to be brave, and always, always standing up for others. And that's a power everyone has inside.",
      dualTemplate:
        "That night, {name} and {name2} hung their costumes on the closet door and climbed into bed. Their matching emblem nightlights cast hero-shaped shadows on the wall. \"Goodnight, partner,\" {name} whispered. \"Goodnight, hero,\" {name2} whispered back. Outside, the stars they'd saved twinkled extra bright -- just for them.",
      sceneDescription:
        "Child in their cozy bedroom, star gem glowing on the windowsill, child smiling peacefully as stars twinkle outside, cape folded neatly on a chair",
      dualCharacterSceneDescription:
        "Two children in bed, superhero costumes hanging on the closet door, a glowing emblem nightlight casting hero-shaped shadows",
    },
  ],

  "kindness-courage": [
    {
      pageNumber: 1,
      template:
        "This is the story of {name}, who is {age} years old and already one of the most remarkable people in the world. You might wonder: how can someone so young be so remarkable? Well, it's not because of magic powers or special gadgets. It's because of something even better. Let me show you.",
      dualTemplate:
        "{name} and {name2} believed in something powerful: that small acts of kindness could change the whole world. Every day they did something nice together -- helping a neighbor, feeding the birds, or leaving drawings on people's doorsteps. Today would be their most special adventure yet.",
      sceneDescription:
        "Child sitting under a big sunlit tree in a meadow full of wildflowers, looking warm and content, holding a small glowing heart in their hands",
      dualCharacterSceneDescription:
        "Two children walking together through their neighborhood, one helping carry groceries for a neighbor, the other petting a friendly dog",
    },
    {
      pageNumber: 2,
      template:
        "{name} has a heart that notices things. When someone looks sad, {name} sees it. When someone needs help, {name} feels it. Not long ago, {name} did something truly kind: {kind_act}. It might sound small, but small kindnesses are like seeds -- they grow into something beautiful.",
      dualTemplate:
        "While walking through the park together, {name} and {name2} found a tiny golden key lying on a bed of clover. It was shaped like a heart. When {name} picked it up, it glowed warm in their hand. {name2} spotted something in the old oak tree: a tiny golden keyhole!",
      sceneDescription:
        "Child performing an act of kindness, helping someone with a warm smile, golden light radiating softly from their hands",
    },
    {
      pageNumber: 3,
      template:
        "Did you know that every act of kindness sends a little ripple out into the world? Like a pebble dropped in a pond, one kind thing leads to another, and another, and another. When {name} was kind, it made someone else feel brave enough to be kind too. And on it went, rippling outward.",
      dualTemplate:
        "{name} placed the key in the lock and turned it. CLICK! A hidden door swung open in the tree trunk, revealing a shimmering path of light. {name2} grabbed {name}'s hand. \"Shall we?\" \"Together,\" {name} smiled. And together they stepped through into a world made of kindness.",
      sceneDescription:
        "Beautiful visual of golden ripples spreading outward from the child like rings in a pond, touching other people who then glow warmly too",
      dualCharacterSceneDescription:
        "Two children discovering a magical garden gate together, both reaching for the handle with excitement, flowers blooming around them",
    },
    {
      pageNumber: 4,
      template:
        "But being kind isn't always easy. Sometimes it takes courage. And {name} knows about courage too. Right now, {name} is learning to be brave about something important: {brave_thing}. That takes a special kind of bravery -- the quiet kind that doesn't always get noticed.",
      dualTemplate:
        "The Kindness Kingdom was beautiful but... something was wrong. The flowers were drooping, the rivers were quiet, and the little creatures looked sad. A small rabbit hopped up to them. \"Oh {name} and {name2}! The Kindness Crystals have gone dim. Without them, everyone has forgotten how to be kind.\"",
      sceneDescription:
        "Child standing at the edge of something that represents their challenge, taking a deep breath with determination, soft encouraging light around them",
    },
    {
      pageNumber: 5,
      template:
        "Courage doesn't mean you're not scared. It means you feel the butterflies in your tummy, the wobble in your knees, and the racing of your heart -- and you take a deep breath and try anyway. {name} knows this feeling. And every time {pronoun} tries, {pronoun} gets a little bit braver.",
      dualTemplate:
        "{name} and {name2} found the first Crystal near a group of arguing squirrels. \"You take it!\" \"No, YOU take it!\" {name} knelt down. \"What if you share it?\" {name2} showed them how to take turns. As the squirrels shared, the Crystal blazed back to life! Two down, three to go.",
      sceneDescription:
        "Child with a determined expression, visible butterflies around their tummy area transforming into little golden stars as they step forward bravely",
      dualCharacterSceneDescription:
        "Two children comforting a sad creature together in a magical garden, one offering a hug while the other offers a flower",
    },
    {
      pageNumber: 6,
      template:
        "One day, {name} saw someone who was having a really hard time. They looked lonely and a little bit lost. Some people walked right past. But not {name}. {name} walked over, sat down, and said the most powerful words in any language: \"Hi. I'm {name}. Do you want to be friends?\"",
      dualTemplate:
        "The second Crystal was guarded by a lonely dragon who blew smoke rings sadly. \"Nobody wants to be my friend,\" it sniffed. {name2} walked right up and hugged the dragon's snout. {name} said, \"We'll be your friends!\" They played together until the dragon laughed, and the Crystal glowed bright.",
      sceneDescription:
        "Child sitting down next to another child who looks lonely on a bench, extending a hand in friendship, warm light between them",
    },
    {
      pageNumber: 7,
      template:
        "And just like that, a friendship was born. Because kindness is a superpower that doesn't need a cape or a mask. It just needs someone willing to notice, willing to care, and willing to try. {name} is that someone. {pronoun} has always been that someone.",
      dualTemplate:
        "The third Crystal was at the bottom of a deep well. {name} and {name2} couldn't reach it alone. But the squirrels and the dragon came to help! Working together, they formed a chain and lowered {name2} down while {name} held tight. Teamwork lit the Crystal brighter than ever.",
      sceneDescription:
        "The two children playing together happily, laughing, a trail of golden sparkles connecting them, other children drawn toward the warmth",
    },
    {
      pageNumber: 8,
      template:
        "There are so many ways {name} makes the world brighter. A smile in the morning. A hug when someone's sad. Saying \"thank you\" and really meaning it. Sharing the last cookie. Picking a flower for someone just because. These aren't little things -- they're everything.",
      dualTemplate:
        "The last two Crystals were held by the Shadow of Selfishness -- a cold, gray cloud that had settled over the palace. \"Kindness is weakness!\" it boomed. {name} and {name2} stood together, unafraid. \"Kindness is the bravest thing there is,\" they said in unison, and the Shadow flinched.",
      sceneDescription:
        "A montage-style scene of the child doing various kind things -- hugging, sharing, picking flowers -- each act creating little bursts of warm light",
      dualCharacterSceneDescription:
        "Two children working together to build a bridge for lost animals, teamwork and determination on their faces",
    },
    {
      pageNumber: 9,
      template:
        "And when {name} faces something hard? {pronoun} remembers this: being brave doesn't mean doing it perfectly. It means doing it scared. It means falling down and getting back up. It means saying \"I can't do it yet\" instead of \"I can't do it.\" That little word -- yet -- changes everything.",
      dualTemplate:
        "{name} and {name2} each raised a glowing Crystal high. The light from all five Crystals merged into a brilliant rainbow that cut through the Shadow. It dissolved into nothing, and warmth flooded the kingdom. Flowers bloomed, rivers sang, and every creature smiled again. They had done it -- together!",
      sceneDescription:
        "Child getting back up after a stumble, dusting off their knees with a small smile, the word 'yet' glowing in golden letters in the sky above",
    },
    {
      pageNumber: 10,
      template:
        "If you could see {name} the way I see {object}, you'd see something incredible. Not just a {age}-year-old kid. But a person who is already changing the world, one kind moment and one brave step at a time. And that is the most extraordinary thing of all.",
      dualTemplate:
        "The King and Queen of the Kindness Kingdom crowned {name} and {name2} as Champions of Kindness. Every creature they had helped -- the squirrels, the dragon, the rabbit -- cheered and celebrated. \"You taught us that kindness is strongest when shared,\" the Queen said.",
      sceneDescription:
        "Child looking at their reflection in a calm pond, but the reflection shows them wearing a crown of golden light, looking noble and strong",
      dualCharacterSceneDescription:
        "Two children being thanked by all the magical creatures they helped, standing together surrounded by flowers and grateful friends",
    },
    {
      pageNumber: 11,
      template:
        "So tonight, as {name} closes {possessive} eyes, I hope {pronoun} knows this: you are enough, exactly as you are. Your kindness matters. Your courage matters. Your laugh, your tears, your hugs, your tries -- they all matter so much. The world is lucky to have you in it.",
      dualTemplate:
        "{name} and {name2} walked back through the golden door in the old oak tree. It closed softly behind them, and the key dissolved into a shower of sparkles. But they didn't need a key anymore. The kindness was inside them -- it always had been.",
      sceneDescription:
        "Child surrounded by loved ones -- family and friends -- in a warm living room, everyone smiling and wrapping the child in a group hug",
    },
    {
      pageNumber: 12,
      template:
        "Goodnight, sweet {name}. Tomorrow there will be new chances to be kind, new chances to be brave, and new chances to be exactly the wonderful person you already are. And no matter what, you are loved -- bigger than the sky, deeper than the ocean, and more than all the stars you can count. Always and forever.",
      dualTemplate:
        "That night, as {name} and {name2} drifted off to sleep, a warm glow lingered in their room. On the windowsill sat two tiny golden flowers that hadn't been there before. \"The kingdom is saying thank you,\" {name2} whispered. {name} smiled. \"Goodnight, friend.\" \"Goodnight, hero.\" The flowers glowed softly all night long.",
      sceneDescription:
        "Child tucked into bed, warm golden light surrounding them, stars visible through the window, looking peaceful and deeply loved",
      dualCharacterSceneDescription:
        "Two children tucked into bed together, a warm glow from their kindness still lingering in the room, both smiling in their sleep",
    },
  ],

  "pirate-treasure": [
    {
      pageNumber: 1,
      template:
        "{name} had always dreamed of the open sea. Every night, {pronoun} would sit by the window and imagine sailing to faraway islands full of treasure and adventure. \"Someday,\" {name} whispered to {possessive} toy telescope, \"I'll be the greatest pirate captain the world has ever seen!\"",
      dualTemplate:
        "{name} and {name2} loved playing pirates more than anything! They had matching bandanas, toy telescopes, and a cardboard box ship in the backyard. \"Someday we'll find REAL treasure,\" {name} said. {name2} adjusted their eye patch. \"Someday is today!\" Because right there, half-buried in the sandbox, was a real treasure map.",
      sceneDescription:
        "Child sitting by a window at sunset, holding a toy telescope, looking out at a distant ocean with a dreamy expression",
      dualCharacterSceneDescription:
        "Two children playing pirates together on a beach, one looking through a toy telescope while the other holds a toy sword",
    },
    {
      pageNumber: 2,
      template:
        "One morning, {name} found a dusty old bottle washed up on the shore. Inside was a rolled-up map with faded golden ink and a note that read: \"For the bravest captain of all -- the treasure of {ship_name} awaits!\" {name}'s eyes went wide. A real treasure map!",
      dualTemplate:
        "The map was old and crinkly, with a big red X on an island called Starfish Cove. As soon as {name} and {name2} unrolled it, the backyard started to shimmer. The sandbox became sand dunes, the garden hose became a river, and their cardboard box became a magnificent pirate ship! \"All aboard, Captain {name2}!\" \"Aye aye, Captain {name}!\"",
      sceneDescription:
        "Child on a beach holding up an old treasure map from a glass bottle, golden ink glittering in the sunlight",
    },
    {
      pageNumber: 3,
      template:
        "At the harbor, a magnificent ship bobbed in the water, its sails shimmering like silk. A banner on the mast read \"{ship_name}\" in gold letters. {pirate_pet} was already on deck, waiting with a pirate hat. \"Welcome aboard, Captain {name}!\" {pirate_pet} seemed to say. Together, they raised the anchor and set sail!",
      dualTemplate:
        "Their ship sailed across a sparkling sea of blue and green. Dolphins leaped alongside, and a friendly pelican landed on the mast. {name} steered while {name2} read the map. \"Sharp left at the Singing Rocks!\" {name2} called. {name} spun the wheel just in time as the rocks hummed a jolly tune.",
      sceneDescription:
        "Child dressed as a pirate captain boarding a colorful wooden ship at a sunny harbor, their animal sidekick waiting on deck",
      dualCharacterSceneDescription:
        "Two young pirates aboard a colorful ship together, one at the helm and the other climbing the rigging, seas sparkling",
    },
    {
      pageNumber: 4,
      template:
        "The ocean sparkled like a million diamonds. Dolphins raced alongside {ship_name}, leaping and splashing. {name} stood at the helm, the salty breeze in {possessive} hair, feeling brave and free. {pirate_pet} perched beside {object}, keeping watch for islands on the horizon.",
      dualTemplate:
        "They spotted a bottle floating in the waves. Inside was a note: \"Beware the Grumpy Kraken at Whirlpool Cove! -- A Friend.\" {name} and {name2} looked at each other. \"Should we be scared?\" {name2} asked. {name} grinned. \"We're the bravest pirates on the seven seas!\" And onward they sailed.",
      sceneDescription:
        "Child at the helm of a pirate ship on sparkling open ocean, dolphins jumping alongside, their animal friend beside them",
    },
    {
      pageNumber: 5,
      template:
        "\"Land ho!\" {name} called out. A tropical island appeared, covered in palm trees and ringed by white sand beaches. But as they got closer, they heard music -- someone was singing! A crew of friendly pirates was having a beach party, roasting marshmallows and dancing a silly jig.",
      dualTemplate:
        "Starfish Cove was beautiful -- white sand, palm trees, and parrots in every color. But the X on the map pointed to the middle of a dark jungle. {name} and {name2} tied up the ship and stepped onto the beach. \"Into the jungle?\" \"Into the jungle.\" They grabbed hands and marched forward together.",
      sceneDescription:
        "Child arriving at a tropical island where friendly pirates are dancing around a campfire on the beach, palm trees swaying",
      dualCharacterSceneDescription:
        "Two children on a tropical island together following a treasure map, pointing in different directions and laughing",
    },
    {
      pageNumber: 6,
      template:
        "\"Ahoy, Captain {name}!\" called a jolly pirate with a big red beard. \"We've been waiting for you! The treasure of {ship_name} is real, but to find it, you'll need to solve three riddles. Are you clever enough?\" {name} grinned. \"I was born ready!\"",
      dualTemplate:
        "The jungle was full of surprises! Monkeys swung down to show them the path, and butterflies as big as plates led the way. {name2} spotted golden footprints in the mud. \"The treasure path!\" they gasped. Together they followed the prints deeper and deeper until they heard... rumbling.",
      sceneDescription:
        "Child meeting a friendly bearded pirate on the beach, both smiling, the pirate holding up three fingers",
    },
    {
      pageNumber: 7,
      template:
        "The first riddle led to a waterfall that flowed upward! {name} had to walk through it backwards to find a golden key hidden behind the curtain of water. The second riddle pointed to a cave where shadows danced on the walls. {name} followed the shadows and found a silver compass that always pointed to treasure.",
      dualTemplate:
        "The footprints led to a cave blocked by a snoring Kraken! Its tentacles were everywhere. \"Not so grumpy,\" {name} whispered. \"Just sleepy.\" {name2} had an idea: \"What if we sing it a lullaby?\" So together, very softly, {name} and {name2} sang the sweetest pirate lullaby ever. The Kraken smiled in its sleep and rolled aside.",
      sceneDescription:
        "Child walking through a magical upward-flowing waterfall in a jungle, reaching for a golden key, light sparkling through the water",
    },
    {
      pageNumber: 8,
      template:
        "The third riddle was the trickiest of all. \"What treasure is worth more than gold?\" {name} thought and thought. Then {pronoun} looked at {pirate_pet}, at the friendly pirates, at the beautiful island. \"Friendship!\" {name} shouted. \"The treasure worth more than gold is friendship!\" The ground beneath them began to glow.",
      dualTemplate:
        "Inside the cave, they found ancient puzzles carved into the walls -- riddles about friendship. \"What has two hearts but beats as one?\" {name} looked at {name2}. \"Best friends!\" they said together. The wall slid open to reveal a chamber filled with golden light.",
      sceneDescription:
        "Child having a moment of realization on a glowing hilltop, arms spread wide, their animal friend beside them, pirates cheering below",
      dualCharacterSceneDescription:
        "Two children working together to solve a treasure puzzle in a cave, torchlight illuminating ancient symbols on the walls",
    },
    {
      pageNumber: 9,
      template:
        "The glowing ground opened to reveal a hidden treasure cave filled with sparkling gems, golden coins, and the most beautiful seashells {name} had ever seen. But in the very center sat a crystal globe that showed the faces of everyone {name} loved. THAT was the real treasure.",
      dualTemplate:
        "There it was: the legendary treasure chest of Starfish Cove! {name} and {name2} lifted the lid together. Inside wasn't gold or jewels -- it was something better. Two matching golden compasses that always pointed to each other. \"So we'll always find our way back to each other,\" {name2} said. \"Best treasure ever,\" {name} agreed.",
      sceneDescription:
        "Child in a treasure cave surrounded by gold and gems, holding a crystal globe that glows with warmth, looking amazed",
    },
    {
      pageNumber: 10,
      template:
        "{name} shared the treasure with every pirate on the island. They divided the gems and coins fairly, and each pirate got a beautiful seashell to remember the day. The jolly pirate with the red beard wiped a tear from his eye. \"You're the best captain we've ever met, {name}.\"",
      dualTemplate:
        "On the sail home, {name} and {name2} watched the sunset paint the sky in orange and pink. The dolphins jumped extra high, the pelican did a happy dance, and even the Singing Rocks played them a farewell song. \"That was the best adventure ever,\" {name2} said. \"The best so far,\" {name} corrected with a wink.",
      sceneDescription:
        "Child sharing treasure with the friendly pirate crew on the beach, everyone smiling and holding seashells and gems",
      dualCharacterSceneDescription:
        "Two children opening a treasure chest together, golden light spilling onto both their amazed faces, jewels glittering",
    },
    {
      pageNumber: 11,
      template:
        "As the sun began to set, painting the sky in oranges and pinks, {name} set sail for home. {pirate_pet} curled up beside {object} as {ship_name} glided across the calm, golden water. The friendly pirates waved from the shore, their voices carrying across the waves: \"Come back anytime, Captain {name}!\"",
      dualTemplate:
        "The ship sailed right back into the backyard as the first stars appeared. The magnificent vessel became a cardboard box again, the sea became grass, and the treasure map crumbled into golden dust. But the golden compasses were still in their hands -- real, warm, and glowing softly.",
      sceneDescription:
        "Child sailing away from the island at sunset, the friendly pirates waving from the beach, golden light on the water",
    },
    {
      pageNumber: 12,
      template:
        "That night, {name} placed the crystal globe on {possessive} nightstand. It glowed softly, showing tiny images of {pirate_pet}, the friendly pirates, and the beautiful island. \"Goodnight, crew,\" {name} whispered. And if {pronoun} listened carefully, {pronoun} could hear the gentle sound of waves and a distant pirate song, just for {object}.",
      dualTemplate:
        "{name} and {name2} put their golden compasses on the nightstand between their beds. The needles pointed at each other, glowing like tiny suns. \"Goodnight, Captain {name2}.\" \"Goodnight, Captain {name}.\" Outside, the stars seemed to arrange themselves into the shape of a pirate ship sailing across the sky.",
      sceneDescription:
        "Child tucked in bed, a glowing crystal globe on the nightstand showing tiny pirate scenes, moonlight streaming through the window",
      dualCharacterSceneDescription:
        "Two children asleep on a porch swing together, treasure map spread between them, the ocean twinkling in the background",
    },
  ],

  "fairy-garden": [
    {
      pageNumber: 1,
      template:
        "{name} loved the garden more than any place in the world. Every flower was a friend, every butterfly a visitor, and every raindrop a tiny gift from the sky. But {name} had always wondered: what if the garden had secrets too small for human eyes to see?",
      dualTemplate:
        "{name} and {name2} were exploring the backyard when {name2} noticed something strange: a tiny door at the base of the old oak tree! It was no bigger than a thumb, with a doorknob made of a dewdrop. \"Do you see that?\" {name2} whispered. {name} knelt down. \"It's... a fairy door!\"",
      sceneDescription:
        "Child kneeling in a beautiful garden full of colorful flowers, peering curiously at the base of a large sunflower",
      dualCharacterSceneDescription:
        "Two children discovering a tiny fairy door together at the base of a tree, both kneeling down and peering inside with wonder",
    },
    {
      pageNumber: 2,
      template:
        "One dewy morning, {name} noticed something strange at the bottom of the oldest rosebush -- a tiny door, no bigger than a thumb! It was painted {fairy_wing_color} and had a doorknob made from a single dewdrop. {name} reached out and touched it. WHOOOOSH! A swirl of sparkles lifted {object} off the ground.",
      dualTemplate:
        "A soft chime rang out and the door swung open. A trail of glittering dust floated up to their noses. {name} and {name2} leaned closer and closer... and WHOOSH! They felt themselves shrinking! Down, down, smaller and smaller until the blades of grass towered above them like trees!",
      sceneDescription:
        "Child touching a tiny glowing door at the base of a rosebush, sparkles beginning to swirl around them, their expression full of wonder",
    },
    {
      pageNumber: 3,
      template:
        "When the sparkles cleared, everything was ENORMOUS. The rosebush towered like a skyscraper. Blades of grass reached high above {name}'s head. A ladybug the size of a car trundled by. {name} looked down and gasped -- {pronoun} had wings! Beautiful {fairy_wing_color} wings that shimmered in the sunlight.",
      dualTemplate:
        "Now the size of ladybugs, {name} and {name2} stepped through the fairy door into a world of wonder. Flowers were like buildings, mushrooms were like houses, and a butterfly the size of a bus landed beside them. \"Hop on!\" sang a tiny voice. Together they climbed aboard and soared over the Fairy Garden.",
      sceneDescription:
        "Child fairy-sized with beautiful wings, standing among towering blades of grass and enormous flowers, looking amazed at their tiny hands",
      dualCharacterSceneDescription:
        "Two children shrunk to fairy size together, riding on a butterfly through a garden of enormous flowers",
    },
    {
      pageNumber: 4,
      template:
        "\"Welcome to the Fairy Garden!\" chimed a tiny voice. A fairy no taller than {name}'s pinky finger floated down on a dandelion puff. She had sparkly silver hair and a dress made of petals. \"I'm Dewdrop. We've been waiting for you, {name}! Our garden needs someone with the gift of {fairy_power}.\"",
      dualTemplate:
        "Below them, the garden was alive with fairies. They were painting flower petals, conducting bee orchestras, and growing new stars for the night sky. But something was wrong -- all the colors were fading. \"The Rainbow Root is sick,\" a fairy said sadly. \"Without it, all color will disappear.\"",
      sceneDescription:
        "Child meeting a tiny fairy named Dewdrop who floats on a dandelion puff, both surrounded by giant flowers and sparkling light",
    },
    {
      pageNumber: 5,
      template:
        "Dewdrop led {name} through the Fairy Garden -- and oh, what a garden it was! Mushroom houses glowed with warm light. Snail-shell slides spiraled between the roots. Fairy children played tag on spider-silk trampolines, and a caterpillar band played the tiniest music {name} had ever heard.",
      dualTemplate:
        "{name} and {name2} found the Rainbow Root at the center of the garden. It was a beautiful tree with branches in every color -- but they were turning gray. The Fairy Queen floated down from her mushroom throne. \"Only children with pure hearts can heal it,\" she said, looking hopefully at both of them.",
      sceneDescription:
        "A magical miniature fairy village among flower roots with mushroom houses, glowing windows, fairy children playing, and a caterpillar band",
      dualCharacterSceneDescription:
        "Two tiny children meeting a fairy queen together on a mushroom throne, both curtsying and bowing respectfully",
    },
    {
      pageNumber: 6,
      template:
        "But something was wrong. The heart of the garden -- the Great Blossom Tree -- was wilting. Its petals were falling, and its glow was fading. \"Without the Great Blossom, our whole garden will disappear,\" Dewdrop said sadly. \"But your gift of {fairy_power} might be the key to saving it.\"",
      dualTemplate:
        "\"How?\" asked {name}. The Queen smiled. \"Each of you must find one magical ingredient: a sunbeam's laugh and a raindrop's tear.\" {name} went to find the sunbeam while {name2} searched for the raindrop. Even apart, they knew they could count on each other.",
      sceneDescription:
        "Child and Dewdrop standing before a large wilting flower tree, its petals falling softly, fairy folk looking worried around them",
    },
    {
      pageNumber: 7,
      template:
        "{name} flew to the Great Blossom Tree on {possessive} new wings, wobbling a little at first but growing steadier. Up close, {pronoun} could see the tree was sad. Its roots were tangled and its branches drooped. \"Don't worry,\" {name} whispered, placing {possessive} small hands on the bark. \"I'm here to help.\"",
      dualTemplate:
        "{name} found a sunbeam napping on a rose petal. \"Will you laugh for me?\" {name} asked, and told it the funniest joke. The sunbeam giggled so hard it glowed! Meanwhile, {name2} found a raindrop on a spider's web. \"Will you cry a happy tear?\" {name2} told it the sweetest story. A single diamond tear dropped into {name2}'s palm.",
      sceneDescription:
        "Child with fairy wings flying up to the wilting Great Blossom Tree, gently placing hands on its bark, a warm glow beginning",
    },
    {
      pageNumber: 8,
      template:
        "{name} closed {possessive} eyes and used {possessive} gift of {fairy_power}. Magic flowed from {possessive} fingertips like warm honey. The tree's roots untangled. Its branches lifted. Color rushed back into every petal -- pink, gold, blue, and violet. The whole garden held its breath.",
      dualTemplate:
        "Together, {name} and {name2} poured the sunbeam's laugh and the raindrop's tear onto the Rainbow Root. The tree shuddered, then burst into magnificent color! Red, orange, yellow, green, blue, indigo, violet -- ribbons of color raced across the garden, painting everything vibrant and alive again!",
      sceneDescription:
        "Child pouring magical energy into the Great Blossom Tree, colorful magic flowing from their hands, the tree beginning to bloom brilliantly",
      dualCharacterSceneDescription:
        "Two children working with fairies to repair a broken rainbow, each holding different colored light in their hands",
    },
    {
      pageNumber: 9,
      template:
        "POP! POP! POP! The Great Blossom Tree burst into the most magnificent bloom anyone had ever seen! Flowers of every color erupted from every branch. Seeds of light drifted down like snow, landing on every corner of the garden. Everywhere they touched, new flowers sprang up instantly.",
      dualTemplate:
        "The fairies erupted in celebration! They threw petals in the air, the bee orchestra played a triumphant tune, and fireflies spelled out \"{name} & {name2}\" in the sky. The Fairy Queen granted them each a pair of gossamer fairy wings. {name} and {name2} lifted off the ground together, laughing with delight!",
      sceneDescription:
        "The Great Blossom Tree in full spectacular bloom, seeds of light drifting down everywhere, new flowers springing up, fairies cheering",
    },
    {
      pageNumber: 10,
      template:
        "The fairies threw the grandest party the garden had ever seen. They danced on lily pads, ate honeycomb cake, and drank dewdrop lemonade. {name} was the guest of honor, wearing a crown of living flowers that Dewdrop had woven. \"You saved our home,\" Dewdrop said, hugging {name} tight.",
      dualTemplate:
        "They flew together through the garden, looping around flowers and racing butterflies. {name} did a perfect spiral while {name2} did a loop-de-loop. The fairies cheered from below. \"You'll always have fairy friends,\" the Queen promised, pressing a tiny flower seed into each of their hands.",
      sceneDescription:
        "Grand fairy celebration on lily pads with fairy lights, child wearing a flower crown, eating tiny cakes with fairy friends",
      dualCharacterSceneDescription:
        "Two children being given fairy wings by grateful fairies, both lifting off the ground with delighted expressions",
    },
    {
      pageNumber: 11,
      template:
        "As the sun began to set in the giant-sized sky, {name}'s wings started to shimmer and fade. \"It's time to go back,\" Dewdrop said gently. She pressed a tiny seed into {name}'s palm. \"Plant this, and you'll always have a little piece of our magic.\" {name} hugged every fairy friend goodbye.",
      dualTemplate:
        "As the sun set in the fairy world, {name} and {name2} flew back through the tiny door. WHOOSH! They grew back to their normal size in a sparkle of dust. The fairy door was still there, glowing faintly. In their hands, the flower seeds were now full-sized and pulsing with gentle magic.",
      sceneDescription:
        "Child's fairy wings beginning to shimmer, Dewdrop pressing a glowing seed into their palm, other fairies waving goodbye with tears",
    },
    {
      pageNumber: 12,
      template:
        "{name} was back to full size in the garden, the sun warm on {possessive} face. Was it all a dream? But there in {possessive} palm was the tiny seed, glowing faintly. {name} planted it right there by the rosebush. And every morning after that, {pronoun} would check on it -- and sometimes, just sometimes, {pronoun} could hear tiny fairy laughter on the breeze.",
      dualTemplate:
        "That night, {name} and {name2} planted the seeds in little pots by the window and climbed into bed. By morning, two extraordinary flowers had bloomed -- one glowed like a sunrise, the other like a moonrise. And if they leaned close, they could hear tiny fairy voices singing: \"Thank you, {name} and {name2}. You are forever part of our garden.\"",
      sceneDescription:
        "Child back to normal size, planting a tiny glowing seed beside the rosebush, a faint sparkle visible at the base of the flowers",
      dualCharacterSceneDescription:
        "Two children back to normal size, asleep under a tree together, tiny fairy lights twinkling around them like a blessing",
    },
  ],

  "safari-adventure": [
    {
      pageNumber: 1,
      template:
        "{name} had a map on {possessive} bedroom wall with all the places {pronoun} dreamed of visiting. But one place had a golden star next to it, circled three times: Africa. {name} wanted to see the great wide savanna where {favorite_animal}s roamed free under endless blue skies.",
      dualTemplate:
        "{name} and {name2} had always dreamed of going on a real safari. They had binoculars, matching safari hats, and a poster of every African animal on their wall. \"Imagine seeing a REAL elephant!\" {name} said. \"Or a REAL lion!\" {name2} added. Little did they know, a magical adventure was about to begin.",
      sceneDescription:
        "Child in their bedroom pointing at a colorful world map on the wall, a golden star marking Africa, safari books on the bed",
      dualCharacterSceneDescription:
        "Two children looking through binoculars together on an African savanna, both wearing safari hats, giraffes visible in the distance",
    },
    {
      pageNumber: 2,
      template:
        "One morning, a mysterious package arrived with no return address. Inside was a safari hat, a pair of tiny binoculars, and a golden ticket that read: \"Safari Adventure -- One Explorer. Departing immediately.\" Before {name} could even blink, the bedroom floor turned to soft, warm sand.",
      dualTemplate:
        "The next morning, their bedroom window opened onto an impossible sight: a golden savanna stretching to the horizon! Tall grass swayed in a warm breeze, and in the distance, a giraffe nibbled the top of an acacia tree. \"Are you seeing this?\" {name2} gasped. \"Let's GO!\" {name} pulled {name2} through the window.",
      sceneDescription:
        "Child opening a mysterious package to find a safari hat and golden ticket, the floor transforming into sandy ground beneath them",
    },
    {
      pageNumber: 3,
      template:
        "{name} was standing on a vast golden savanna! Tall grass swayed in the warm breeze as far as {pronoun} could see. The sky was the biggest sky {name} had ever imagined, painted in soft blues and golds. A colorful safari jeep waited nearby with a note on the steering wheel: \"For {name} -- the bravest explorer.\"",
      dualTemplate:
        "A magnificent elephant was waiting for them, its kind eyes twinkling. A colorful blanket lay across its back, and a little ladder hung from its side. {name} and {name2} climbed up together and settled between the elephant's ears. With a gentle trumpet, they set off across the savanna!",
      sceneDescription:
        "Child standing on a golden African savanna wearing a safari hat, a colorful jeep nearby, vast grasslands stretching to the horizon",
      dualCharacterSceneDescription:
        "Two children riding on the back of a gentle elephant together, crossing a river on the savanna, birds flying alongside",
    },
    {
      pageNumber: 4,
      template:
        "The first friend {name} met was a baby {favorite_animal}, no bigger than a dog. It bumbled over on wobbly legs and nuzzled {name}'s hand. Its mother watched nearby, her eyes gentle and warm. \"Hello, little one,\" {name} whispered. The baby {favorite_animal} followed {name} everywhere after that, like a loyal puppy.",
      dualTemplate:
        "The savanna was bursting with life! Zebras raced alongside them in black-and-white streaks. A tower of giraffes nodded hello. Flamingos turned a lake bright pink. {name} sketched everything while {name2} took notes. \"We're real explorers!\" they said together, grinning from ear to ear.",
      sceneDescription:
        "Child gently petting a baby safari animal while its mother watches approvingly nearby, golden savanna grass all around",
    },
    {
      pageNumber: 5,
      template:
        "Together, {name} and the baby {favorite_animal} drove across the savanna in the jeep. They saw zebras painted in perfect stripes, flamingos standing in a pink lake, and hippos blowing bubbles in a muddy river. Every animal waved or nodded as {name} passed. This was the friendliest place on Earth!",
      dualTemplate:
        "At the edge of a rocky hill, they met a family of lions basking in the golden sun. The lioness purred as {name} and {name2} approached. Her cubs tumbled over and playfully batted at their shoes. \"They like us!\" {name2} laughed. {name} gently scratched a cub behind its ears, and it purred right back.",
      sceneDescription:
        "Child driving a colorful jeep across the savanna with their baby animal friend, zebras and flamingos visible nearby, a warm golden scene",
      dualCharacterSceneDescription:
        "Two children meeting a family of lions together, one reaching out while the other watches in awe, golden savanna light",
    },
    {
      pageNumber: 6,
      template:
        "But near {safari_discovery}, {name} heard a worried sound. A young bird had fallen from its nest high up in an acacia tree. The nest was so far up that no animal could reach it. \"Don't worry,\" {name} said, looking up at the tall tree. \"I'll figure this out.\"",
      dualTemplate:
        "A worried meerkat popped up from a hole. \"Oh, thank goodness you're here! Little Stripe, our baby zebra, is lost near the watering hole, and we can't find her!\" {name} and {name2} exchanged looks. \"We'll find her!\" they promised. The meerkat hugged their ankles gratefully.",
      sceneDescription:
        "Child looking up at a tall acacia tree where a baby bird has fallen from its nest, other animals gathered around looking concerned",
    },
    {
      pageNumber: 7,
      template:
        "{name} had an idea! {pronoun} asked the tallest giraffe to bend its long neck. Then {name} climbed up, step by step, gently holding the baby bird in one hand. Higher and higher {pronoun} went, the baby {favorite_animal} cheering from below. Finally, {name} reached the nest and placed the little bird safely home.",
      dualTemplate:
        "{name} used the binoculars while {name2} followed the tiny hoofprints in the dust. They worked together, tracking through tall grass and around termite mounds. Finally, {name2} heard a soft whinny. \"There!\" Behind a bush, a frightened baby zebra stood shivering. {name} and {name2} approached slowly, softly.",
      sceneDescription:
        "Child climbing a giraffe's long neck to reach a high nest in an acacia tree, gently placing a baby bird back home, animals watching below",
    },
    {
      pageNumber: 8,
      template:
        "The mother bird sang the most beautiful song {name} had ever heard -- a thank-you melody that echoed across the whole savanna. Every animal stopped to listen. Even the wind seemed to pause. {name} felt warm inside, like the sun was glowing right in {possessive} chest.",
      dualTemplate:
        "{name} held out a handful of sweet grass while {name2} hummed a gentle tune. Little Stripe's ears perked up. She took one step forward... then another... and nuzzled right into their arms. Together, {name} and {name2} walked her back to the herd. The mother zebra whinnied with joy!",
      sceneDescription:
        "Child standing beneath the acacia tree as a beautiful bird sings above, musical notes floating through the air, all animals listening peacefully",
      dualCharacterSceneDescription:
        "Two children helping a baby animal together, one holding it gently while the other prepares food, under an acacia tree",
    },
    {
      pageNumber: 9,
      template:
        "As a reward, the savanna animals invited {name} to a sunset celebration at the Great Watering Hole. Elephants sprayed water into rainbow arcs. Monkeys served mango smoothies. Lions told funny stories, and the baby {favorite_animal} danced the silliest dance anyone had ever seen. {name} laughed until {possessive} belly ached.",
      dualTemplate:
        "That evening, the animals threw a celebration under the baobab tree. Elephants trumpeted, monkeys drummed, and fireflies lit up like a thousand tiny lanterns. {name} and {name2} danced with the meerkats and shared fruit with the giraffes. \"You are always welcome in our savanna,\" the elephant said.",
      sceneDescription:
        "Grand celebration at a watering hole at sunset, elephants spraying rainbow water, monkeys and lions and the child all laughing and dancing",
    },
    {
      pageNumber: 10,
      template:
        "The oldest elephant, wise and gentle, placed a necklace of colorful beads around {name}'s neck. \"This is the Explorer's Heart,\" she said in a voice like a warm rumble. \"It means you carry the spirit of kindness wherever you go. The savanna will always remember you, {name}.\"",
      dualTemplate:
        "As the African sun set in blazing oranges and purples, {name} and {name2} sat on the hilltop together, the entire savanna spread before them. Silhouettes of migrating animals crossed the horizon. \"This is the most beautiful thing I've ever seen,\" {name} whispered. {name2} nodded. \"And we got to see it together.\"",
      sceneDescription:
        "A wise old elephant placing a colorful beaded necklace around the child's neck, other animals watching respectfully in golden light",
      dualCharacterSceneDescription:
        "Two children watching a spectacular African sunset together from a hilltop, silhouettes of animals migrating in the distance",
    },
    {
      pageNumber: 11,
      template:
        "The baby {favorite_animal} walked {name} back to the safari jeep, nuzzling {possessive} hand one last time. {name} hugged the little animal tight. \"I'll miss you so much,\" {name} whispered. The baby {favorite_animal} blinked its big eyes and made a soft sound that clearly meant, \"I'll miss you too.\"",
      dualTemplate:
        "The elephant carried them back to the magical window as stars filled the African sky. One by one, the animals lined up to say goodbye. The lion cubs pawed at the window. Little Stripe gave them each a nuzzle. \"Come back soon,\" the meerkat called. \"We promise,\" {name} and {name2} said together.",
      sceneDescription:
        "Tender goodbye scene of child hugging the baby safari animal beside the jeep, the setting sun painting everything in warm orange",
    },
    {
      pageNumber: 12,
      template:
        "Back in {possessive} bedroom, {name} found the colorful bead necklace still around {possessive} neck. It was real! {name} hung it on the bedpost and looked at the map on the wall. The golden star over Africa glowed a little brighter now. \"Goodnight, savanna,\" {name} whispered. And far away, a baby {favorite_animal} looked up at the same stars and seemed to whisper back.",
      dualTemplate:
        "That night, {name} and {name2} climbed into bed. On their nightstand sat two gifts: a tiny carved elephant and a miniature acacia tree, both glowing faintly with savanna magic. Through the window, they could see the first star of evening. \"Goodnight, Africa,\" they whispered. And far away, a lion roared softly in reply.",
      sceneDescription:
        "Child in bed wearing the bead necklace, the map on the wall glowing softly over Africa, stars visible through the window",
      dualCharacterSceneDescription:
        "Two children asleep in a safari tent together, animal friends peeking through the tent flap, stars visible above the savanna",
    },
  ],

  "time-travel": [
    {
      pageNumber: 1,
      template:
        "{name} loved two things more than anything: questions and clocks. {possessive} bedroom had clocks of every kind -- digital ones, cuckoo clocks, even a sundial made from a paper plate. But {name}'s biggest question was one no clock could answer: \"What was yesterday REALLY like? And what will tomorrow bring?\"",
      dualTemplate:
        "{name} and {name2} found something incredible in the attic: a strange machine covered in a dusty tarp! It had dials, switches, and a big glowing screen. A note was stuck to it: \"TIME MACHINE -- For brave travelers only.\" {name} and {name2} looked at each other with the biggest grins. \"Are you thinking what I'm thinking?\"",
      sceneDescription:
        "Child in a bedroom filled with clocks of all kinds, holding a magnifying glass and looking curiously at an old pocket watch",
      dualCharacterSceneDescription:
        "Two children discovering a time machine together in an attic, both examining the strange device with curiosity and excitement",
    },
    {
      pageNumber: 2,
      template:
        "One rainy afternoon, {name} found a dusty trunk in {possessive} grandparent's attic. Inside, beneath old photographs and lace, lay a golden pocket watch. But this was no ordinary watch -- its hands spun backwards AND forwards, and it hummed with a warm, golden glow. A tiny engraving read: \"For the curious. Press the crown.\"",
      dualTemplate:
        "They dusted it off, climbed inside together, and {name} turned the biggest dial. The machine hummed, rattled, and then -- FLASH! Colors swirled around them like a kaleidoscope. When the spinning stopped, they tumbled out into... a prehistoric jungle! A massive dinosaur blinked down at them. \"WHOA!\" they both shouted.",
      sceneDescription:
        "Child in a dusty attic opening an old trunk, discovering a glowing golden pocket watch that illuminates their amazed face",
    },
    {
      pageNumber: 3,
      template:
        "{name} pressed the tiny crown on top of the watch. WHOOOOSH! The room dissolved into ribbons of light -- gold and silver and every color in between. {name} felt like {pronoun} was flying through a tunnel made of clocks and calendars. Then everything went still, and {name} was standing somewhere completely different.",
      dualTemplate:
        "The friendly dinosaur was a plant-eater and let {name} and {name2} ride on its back. They saw erupting volcanoes (from a safe distance), enormous dragonflies, and forests of giant ferns. {name2} found a fossilized leaf. \"A souvenir from 65 million years ago!\" {name} carefully tucked it into their pocket.",
      sceneDescription:
        "Child being pulled into a time portal made of swirling clockwork gears, golden light, and calendar pages flying around them",
      dualCharacterSceneDescription:
        "Two children emerging from the time machine together into a dinosaur era, looking around in amazement at the prehistoric world",
    },
    {
      pageNumber: 4,
      template:
        "{name} had landed in {time_period}! Everything was incredible. The air smelled different. The sounds were different. People wore amazing clothes and spoke with wonder in their voices. A friendly person noticed {name} and smiled. \"You look lost, young traveler. Welcome! Let me show you around.\"",
      dualTemplate:
        "Back in the time machine, {name} turned the dial again. FLASH! Now they were in ancient Egypt! The Great Pyramid was being built right before their eyes. Workers waved them over and handed them small bricks. {name} and {name2} helped place stones side by side. \"We're building history -- literally!\" {name2} laughed.",
      sceneDescription:
        "Child arriving in a historical setting, greeted by a friendly person in period clothing, amazing architecture and scenery behind them",
    },
    {
      pageNumber: 5,
      template:
        "{name}'s guide showed {object} extraordinary things -- inventions that changed the world, buildings that reached for the sky, and art that made {possessive} heart sing. \"Every person here has a dream,\" the guide said. \"And every dream matters.\" {name} felt inspired. What would {possessive} own dream change someday?",
      dualTemplate:
        "FLASH! Next stop: ancient China! They walked along the Great Wall as dragons (real ones!) soared overhead. A kind emperor invited them to a feast of noodles and dumplings. {name} tried chopsticks while {name2} made friends with a baby dragon. It sneezed tiny sparks and made them both giggle.",
      sceneDescription:
        "Child being shown amazing inventions and architecture by their guide, eyes wide with wonder, taking in the incredible sights",
      dualCharacterSceneDescription:
        "Two children in ancient Egypt together, helping build alongside workers, pyramids towering behind them",
    },
    {
      pageNumber: 6,
      template:
        "But {name} noticed something: a child about {possessive} age, sitting alone and looking sad. \"What's wrong?\" {name} asked. \"Nobody believes in my idea,\" the child said quietly. \"They say it's impossible.\" {name} sat down beside them. \"Tell me about it,\" {pronoun} said. \"I love impossible things.\"",
      dualTemplate:
        "FLASH! Medieval times! Knights jousted, flags flew, and a castle loomed against the sky. {name} tried on a suit of armor (too big!) while {name2} pulled a sword from a stone (it was stuck in the castle garden for fun). The knights laughed and made them honorary members of the Round Table.",
      sceneDescription:
        "Child sitting beside a sad young person from the time period, offering comfort, a half-built invention or project visible nearby",
    },
    {
      pageNumber: 7,
      template:
        "The young inventor's idea was brilliant. {name} helped them build it, using skills {pronoun} had learned at home. Together, they tinkered, adjusted, and tried again and again. When it finally worked, the young inventor's face lit up like sunrise. \"You believed in me,\" they whispered. \"That made all the difference.\"",
      dualTemplate:
        "FLASH! The golden age of pirates! {name} and {name2} found themselves on the deck of a pirate ship with a friendly crew. They helped navigate using stars, swabbed the deck (while sliding around on the soap suds), and {name2} spotted a treasure island. But the best treasure was the parrot that landed on {name}'s shoulder!",
      sceneDescription:
        "Child and the young inventor celebrating as their creation works, sparks of light and joy all around them, tools and parts scattered about",
    },
    {
      pageNumber: 8,
      template:
        "The pocket watch hummed again. It was time to move on. {name} hugged the young inventor goodbye. \"Remember,\" {name} said, \"impossible things are just things that haven't happened YET.\" The watch glowed, and WHOOOOSH -- {name} was pulled through the time tunnel once more, spinning through stars and clockwork.",
      dualTemplate:
        "FLASH! Into the future! Flying cars zoomed overhead, robots waved hello, and buildings touched the clouds. A friendly robot guide showed {name} and {name2} around. \"In the future, kindness is the most advanced technology,\" it said. {name} and {name2} high-fived. \"We already knew that!\"",
      sceneDescription:
        "Child waving goodbye to the inventor friend as golden time-portal light begins to swirl around them again",
      dualCharacterSceneDescription:
        "Two children in a medieval castle together, one trying on armor while the other examines a sword, knights watching",
    },
    {
      pageNumber: 9,
      template:
        "This time, {name} landed in the far future! Flying cars hummed overhead. Buildings were made of crystal and grew like flowers. Robots and people walked side by side, laughing together. A friendly robot offered {name} a cup of something that tasted like sunshine and bubbles. Everything was amazing!",
      dualTemplate:
        "Suddenly the time machine started beeping. \"Low power! Return to base!\" flashed on the screen. {name} and {name2} jumped in and held on tight as the machine spun through all the eras at once -- dinosaurs, pyramids, castles, ships, robots, all whirling past the windows in a dazzling spiral.",
      sceneDescription:
        "Child in a dazzling futuristic city with crystal buildings, flying cars, and friendly robots, holding a glowing cup, mouth open in awe",
    },
    {
      pageNumber: 10,
      template:
        "In the future city's museum, {name} saw something incredible -- a display about {time_souvenir}! Next to it was a tiny plaque: \"Inspired by a time traveler named {name}, who taught the world that believing in others changes everything.\" {name}'s eyes filled with happy tears. {possessive} kindness had echoed through time.",
      dualTemplate:
        "FLASH! They were home. The attic looked the same, but their pockets were full of souvenirs: the fossilized leaf, an Egyptian bead, a Chinese dragon scale, a knight's pin, a pirate's compass, and a tiny robot figure. Each one glowed faintly with the magic of time.",
      sceneDescription:
        "Child standing in a futuristic museum looking at a display with their name on it, golden light illuminating a plaque, tears of joy on their face",
      dualCharacterSceneDescription:
        "Two children back in the time machine together, a collage of all the eras they visited swirling in the windows",
    },
    {
      pageNumber: 11,
      template:
        "The pocket watch gave one final hum. {name} closed {possessive} eyes and felt the warm rush of time flowing around {object}. When {pronoun} opened them, {pronoun} was back in the attic, the rain still tapping on the window. The trunk was there. The pocket watch glowed softly in {possessive} hand.",
      dualTemplate:
        "The time machine powered down with a happy hum and went quiet. {name2} patted it gently. \"Thank you for the adventure.\" The screen flickered one last message: \"Same time tomorrow, travelers?\" {name} and {name2} grinned at each other. \"DEFINITELY.\"",
      sceneDescription:
        "Child back in the attic, holding the glowing pocket watch, rain on the window, a peaceful smile on their face",
    },
    {
      pageNumber: 12,
      template:
        "That night, {name} placed the golden pocket watch on {possessive} nightstand. Its hands moved gently -- forward, backward, always in motion. \"Goodnight, yesterday,\" {name} whispered. \"Goodnight, tomorrow.\" And as {pronoun} drifted off to sleep, {name} knew that every moment -- past, present, and future -- was a gift worth treasuring.",
      dualTemplate:
        "That night, {name} and {name2} arranged their time-travel souvenirs on the nightstand. Each one glowed a different color, like a tiny rainbow of history. A clock on the wall ticked softly. \"Where should we go next?\" {name} whispered. \"Everywhere,\" {name2} whispered back. And in their dreams, the time machine hummed, ready for another journey.",
      sceneDescription:
        "Child asleep in bed, the golden pocket watch glowing on the nightstand, tiny clockwork gears reflected on the ceiling like stars",
      dualCharacterSceneDescription:
        "Two children in bed together, souvenirs from different time periods scattered on their nightstand, a clock ticking nearby",
    },
  ],

  "christmas-magic": [
    {
      pageNumber: 1,
      template:
        "It was Christmas Eve, and {name}'s house smelled like gingerbread and cinnamon. The tree sparkled with lights, stockings hung by the fireplace, and snowflakes danced outside the window. But {name} had something on {possessive} mind -- a wish so big, {pronoun} hadn't told anyone. Not even Santa.",
      dualTemplate:
        "{name} and {name2} loved Christmas more than any other time of year. The tree was decorated, the stockings were hung, and cookies were baked. But something was different this Christmas Eve. As the clock struck midnight, a gentle knock came at the window. Outside, hovering in the moonlight... was a flying reindeer!",
      sceneDescription:
        "Child in cozy pajamas looking at a beautiful Christmas tree in a warm living room, snow falling outside the window",
      dualCharacterSceneDescription:
        "Two children decorating a Christmas tree together, one placing a star on top while the other hangs ornaments, warm glow",
    },
    {
      pageNumber: 2,
      template:
        "\"Dear Santa,\" {name} wrote in {possessive} neatest handwriting. \"My Christmas wish is {christmas_wish}. I know it's a big wish, but I've been working really hard to be good.\" {name} folded the letter carefully, tucked it into an envelope, and placed it under the tree. Then something magical happened.",
      dualTemplate:
        "The reindeer nuzzled them both and knelt down. On its back was a tiny envelope sealed with a snowflake stamp. Inside was a letter: \"Dear {name} and {name2}, Santa needs your help tonight. Please come to the North Pole immediately. -- Chief Elf Jingles.\" They looked at each other. \"Let's GO!\"",
      sceneDescription:
        "Child writing a letter to Santa at a desk, a warm lamp and Christmas decorations around them, the letter beginning to glow",
    },
    {
      pageNumber: 3,
      template:
        "The letter began to GLOW! It floated up from under the tree, swirled around the room leaving a trail of golden sparkles, and zoomed straight up the chimney! {name} raced to the window and watched it fly into the snowy sky like a tiny shooting star, heading north.",
      dualTemplate:
        "They climbed onto the reindeer and WHOOSH -- they were flying! Over snow-covered rooftops, past the twinkling Northern Lights, through cotton-candy clouds. {name} held on tight while {name2} pointed out constellations. The cold air sparkled with magic. And then they saw it: the North Pole, blazing with light!",
      sceneDescription:
        "Child watching a glowing letter fly up the chimney trailing golden sparkles, eyes wide with amazement, Christmas tree behind them",
      dualCharacterSceneDescription:
        "Two children riding in Santas sleigh together through a snowy sky, reindeer leading the way, Northern Lights above",
    },
    {
      pageNumber: 4,
      template:
        "WHOOOOSH! A sleigh appeared outside the window, pulled by eight magnificent reindeer! And there in the driver's seat was Santa himself, rosy-cheeked and smiling. \"Ho ho ho! {name}! I got your letter before it even arrived! Hop in -- I need your help tonight!\"",
      dualTemplate:
        "The North Pole was even more wonderful than they'd imagined. Candy-cane lampposts, gingerbread houses, and elves EVERYWHERE. Chief Elf Jingles rushed up. \"Thank goodness you're here! Santa's sleigh has a broken runner and he can't deliver presents! Can you help us fix it?\"",
      sceneDescription:
        "Santa's magical sleigh landing on the snowy roof, reindeer with glowing noses, Santa waving to the child from the driver's seat",
    },
    {
      pageNumber: 5,
      template:
        "{name} climbed into the sleigh, which was warmer than it looked -- like sitting in a cup of hot cocoa. {reindeer_friend} the reindeer turned and winked. \"Hold on tight!\" Santa called. The sleigh shot into the sky, zooming over snowy rooftops and twinkling towns. {name} could see the whole world below!",
      dualTemplate:
        "{name} and {name2} rolled up their sleeves and got to work in the workshop. {name} held the runner steady while {name2} tightened the magic bolts. The elves cheered and brought them hot chocolate with extra marshmallows. \"Perfect teamwork!\" Jingles declared, testing the runner. Good as new!",
      sceneDescription:
        "Child sitting beside Santa in the flying sleigh high above a snowy village, reindeer galloping through starry sky, the child's face full of joy",
      dualCharacterSceneDescription:
        "Two children in Santas workshop together, both helping elves wrap presents, surrounded by toys and colorful wrapping paper",
    },
    {
      pageNumber: 6,
      template:
        "They landed at the North Pole, and it was even more magical than {name} had imagined. Candy-cane lampposts lined the streets. Gingerbread houses puffed warm smoke. Elves in colorful outfits bustled about, wrapping presents, painting toys, and singing carols in squeaky, happy voices.",
      dualTemplate:
        "Santa himself walked in -- rosy cheeks, twinkling eyes, and the jolliest laugh ever. \"Ho ho ho! So YOU'RE my heroes tonight!\" He shook their hands warmly. \"How would you two like to help me deliver presents?\" {name} and {name2}'s jaws dropped. \"YES! YES! A THOUSAND TIMES YES!\"",
      sceneDescription:
        "Child walking through Santa's North Pole village with candy-cane lampposts, gingerbread houses, and bustling elves everywhere",
    },
    {
      pageNumber: 7,
      template:
        "\"Here's the problem,\" Santa said, leading {name} to the Great Gift Machine. \"This machine fills every present with a little bit of Christmas magic. But the Magic Meter is running low! We need more kindness and joy to power it up. And you, {name}, have one of the kindest hearts I've ever seen.\"",
      dualTemplate:
        "Mrs. Claus bundled them up in the coziest scarves and mittens. Santa loaded the sleigh -- it was ENORMOUS, piled high with presents in every color. {name} and {name2} squeezed in beside Santa. \"Dasher! Dancer!\" Santa called. The reindeer leaped into the sky, and the sleigh soared over the world!",
      sceneDescription:
        "Child and Santa standing before an enormous sparkling gift machine with a meter showing low, elves looking worried around them",
    },
    {
      pageNumber: 8,
      template:
        "{name} thought about all the kind things {pronoun} had done this year. Helping friends, sharing toys, giving hugs when someone was sad, being brave when things were hard. With every memory, {name}'s heart glowed a little brighter. {pronoun} placed {possessive} hands on the Great Gift Machine and poured all that kindness in.",
      dualTemplate:
        "Down chimneys they went! {name} passed presents to Santa while {name2} kept the list organized. They visited every continent: snowy villages, tropical islands, big cities, and tiny farms. {name} left a teddy bear for a sleeping toddler. {name2} arranged a toy train under a tree just right. Santa smiled. \"You're naturals!\"",
      sceneDescription:
        "Child placing glowing hands on the Great Gift Machine, golden light streaming from their heart, memories appearing as floating images around them",
      dualCharacterSceneDescription:
        "Two children meeting Santa Claus together, sitting with him while Mrs Claus brings cookies, a cozy North Pole cabin",
    },
    {
      pageNumber: 9,
      template:
        "The Magic Meter shot up -- past green, past gold, all the way to sparkling diamond! The Great Gift Machine hummed with joy. Every present on every shelf burst with a warm, golden glow. The elves cheered, Santa laughed his biggest ho-ho-ho, and {reindeer_friend} did a happy reindeer dance.",
      dualTemplate:
        "Over a small village, they noticed a house with no chimney and no tree inside. \"Santa, what about that one?\" {name} asked. Santa's eyes twinkled. \"That's where the magic of Christmas spirit comes in.\" {name} and {name2} held hands, closed their eyes, and wished with all their hearts. A warm glow surrounded the house, and a tiny tree appeared inside, fully decorated!",
      sceneDescription:
        "The Great Gift Machine glowing brilliantly, all presents sparkling with golden light, elves dancing and Santa laughing heartily",
    },
    {
      pageNumber: 10,
      template:
        "As a thank-you, Santa gave {name} a very special gift -- the first present off the Great Gift Machine. It was wrapped in paper that changed colors and had a bow made of starlight. \"Don't open it until Christmas morning,\" Santa whispered with a wink. \"I think you'll like what's inside.\"",
      dualTemplate:
        "As the last present was delivered, the sky turned pink with the first light of dawn. \"We did it!\" {name} and {name2} cheered. Santa laughed his biggest laugh. \"I couldn't have done it without you two. You have the true spirit of Christmas -- generosity, teamwork, and love.\"",
      sceneDescription:
        "Santa handing the child a beautiful color-changing present with a starlight bow, both smiling warmly, the workshop glowing behind them",
      dualCharacterSceneDescription:
        "Two children delivering presents together to houses below, flying over a snowy village with sacks of gifts",
    },
    {
      pageNumber: 11,
      template:
        "The sleigh ride home was peaceful. Snow fell gently, and Christmas lights twinkled below like earthbound stars. {reindeer_friend} hummed a carol. {name} snuggled into the warm sleigh, holding {possessive} special present close. \"Thank you, Santa,\" {name} murmured. \"Thank YOU, {name},\" Santa replied. \"You saved Christmas.\"",
      dualTemplate:
        "The reindeer flew them home as snow began to fall gently. Santa waved from the sleigh. \"Merry Christmas, {name} and {name2}! You'll always be honorary elves!\" He tossed them each a tiny golden bell that rang with the purest sound. \"As long as you believe, you'll hear it ring.\"",
      sceneDescription:
        "Child snuggled in Santa's sleigh flying home through gently falling snow, holding the special present, twinkling lights below",
    },
    {
      pageNumber: 12,
      template:
        "{name} woke up on Christmas morning, warm and cozy in bed. Was it a dream? But there, under the tree, sat the color-changing present with the starlight bow. {name} opened it and smiled the biggest smile. Inside was exactly {christmas_wish} -- and a note in Santa's handwriting: \"For the child who saved Christmas. With love, S.C.\"",
      dualTemplate:
        "On Christmas morning, {name} and {name2} woke up in their beds. Was it a dream? But there, on the pillow, were the golden bells -- still warm, still ringing softly. And in the stockings hung by the fireplace, each found a note in Santa's handwriting: \"Thank you, my little helpers. See you next year. -- S.C.\" Best Christmas ever.",
      sceneDescription:
        "Child on Christmas morning opening the magical present under the tree, a look of pure joy and wonder, warm morning light streaming in",
      dualCharacterSceneDescription:
        "Two children asleep by the fireplace on Christmas Eve, stockings hung above them, cookies half-eaten, snow falling outside",
    },
  ],

  "halloween-adventure": [
    {
      pageNumber: 1,
      template:
        "It was the best night of the year -- Halloween! The air smelled like fallen leaves and candy corn. Jack-o'-lanterns grinned from every porch, and the full moon hung low and orange in the sky. {name} was almost ready. {possessive} costume was perfect: {costume}. Tonight was going to be AMAZING.",
      dualTemplate:
        "It was Halloween night, and {name} and {name2} were ready! {name} was dressed as a {costume} and {name2} had the best matching outfit. Their candy bags were empty but their excitement was FULL. The streets were lined with glowing jack-o'-lanterns, and the moon hung like a big orange ball in the sky.",
      sceneDescription:
        "Child putting on their Halloween costume in front of a mirror, a carved pumpkin glowing on the windowsill, twilight sky outside",
      dualCharacterSceneDescription:
        "Two children in Halloween costumes together, walking down a spooky but fun street lined with jack-o-lanterns",
    },
    {
      pageNumber: 2,
      template:
        "{name} stepped outside and gasped. The street looked... different. The houses had grown taller and wigglier. The trees had faces that winked and grinned. And floating down the moonlit sidewalk came {halloween_friend}, waving cheerfully. \"Happy Halloween, {name}! Ready for the REAL adventure?\"",
      dualTemplate:
        "At the end of Maple Street, they spotted the biggest jack-o'-lantern they had ever seen -- as tall as a house! Its carved mouth flickered with swirling orange and purple light. \"Is that... a portal?\" {name2} asked. {name} grinned. \"Only one way to find out!\" They grabbed hands and jumped inside!",
      sceneDescription:
        "Child stepping outside into a magically transformed Halloween street with wiggly houses and face-bearing trees, a friendly spooky creature approaching",
    },
    {
      pageNumber: 3,
      template:
        "\"The real adventure?\" {name} asked. {halloween_friend} grinned. \"Every Halloween, a magical portal opens behind the oldest jack-o'-lantern on Boo Lane. It leads to Monster Town, where all the friendly monsters celebrate together. And this year, YOU'RE invited!\" {name}'s eyes went wide. \"Let's GO!\"",
      dualTemplate:
        "WHOOOOSH! They tumbled through swirling colors and landed on their feet in... Monster Town! It was like a regular town, except EVERYTHING was Halloween. The houses were haunted mansions, the trees had googly eyes, and the streetlights were made of giant candy corn. \"This. Is. AWESOME!\" they said together.",
      sceneDescription:
        "Child and their friendly spooky friend running toward a glowing jack-o'-lantern at the end of a spooky but fun-looking street",
      dualCharacterSceneDescription:
        "Two children stepping through a glowing portal together inside a giant jack-o-lantern, both looking excited and brave",
    },
    {
      pageNumber: 4,
      template:
        "They found the oldest jack-o'-lantern -- it was as big as a car and glowed purple and green! Its mouth opened wiiiiide, and inside was a swirling portal of orange and black sparkles. {name} took {halloween_friend}'s hand, took a deep breath, and JUMPED IN!",
      dualTemplate:
        "A friendly {halloween_friend} bounced over. \"Welcome to Monster Town! I'm your guide!\" it said. \"We've been waiting for brave trick-or-treaters like you two!\" It led {name} and {name2} past a skeleton skateboard park, a mummy library, and a vampire bakery that sold bat-shaped cookies.",
      sceneDescription:
        "Child and their spooky friend jumping into a giant glowing jack-o'-lantern portal, swirling with orange and purple light",
    },
    {
      pageNumber: 5,
      template:
        "Monster Town was the most wonderfully spooky place {name} had ever seen! Cobblestone streets wound between crooked houses. Bat-shaped streetlights flickered with purple flames. A skeleton played the xylophone on his own ribs, and a group of mummies were trying to wrap each other up -- very badly.",
      dualTemplate:
        "{name} and {name2} met all sorts of friendly monsters. A vampire with braces. A werewolf who was actually a puppy in a costume. A ghost who was shy but gave the BEST high-fives (even though their hand went right through). {name2} helped the shy ghost practice waving, and {name} traded jokes with the vampire.",
      sceneDescription:
        "Child arriving in a colorful, fun Monster Town with crooked buildings, bat streetlights, a skeleton musician, and silly mummies",
      dualCharacterSceneDescription:
        "Two children meeting friendly monsters in Monster Town together, shaking hands with a vampire while a mummy waves",
    },
    {
      pageNumber: 6,
      template:
        "\"Welcome, welcome!\" called the Mayor of Monster Town -- a very jolly Frankenstein with flowers in his bolts. \"We have a problem! Our Great Cauldron of Candy has stopped bubbling! Without it, there'll be no treats for anyone -- monster or human!\" The crowd of friendly monsters looked worried.",
      dualTemplate:
        "\"Welcome, welcome!\" called the Mayor of Monster Town -- a very jolly Frankenstein with flowers in his bolts. \"We have a problem! Our Great Cauldron of Candy has stopped bubbling! Without it, there'll be no treats for anyone -- monster or human!\" {name} and {name2} exchanged determined looks.",
      sceneDescription:
        "A friendly Frankenstein mayor addressing the child and a crowd of worried but cute monsters, a large empty cauldron visible behind him",
    },
    {
      pageNumber: 7,
      template:
        "{name} peeked into the Great Cauldron. It was dark and cold inside. But wait -- something was stuck at the bottom! A tiny candy corn had gotten wedged in the magic spout. \"I can fix this!\" {name} said. {pronoun} reached in bravely and wiggled the candy corn free. BUBBLEEEE!",
      dualTemplate:
        "{name} and {name2} peeked into the Great Cauldron together. It was dark and cold inside. But wait -- something was stuck at the bottom! A tiny candy corn had gotten wedged in the magic spout. \"I can reach it!\" {name} said. \"I'll hold your feet!\" {name2} replied. {name} reached in and wiggled the candy corn free. BUBBLEEEE!",
      sceneDescription:
        "Child reaching bravely into a large cauldron, wiggling free a stuck candy corn, the cauldron beginning to glow and bubble",
    },
    {
      pageNumber: 8,
      template:
        "The Great Cauldron EXPLODED with candy! Chocolate bats, gummy eyeballs, lollipop skulls, and candy pumpkins flew into the air like a candy firework show! Every monster caught handfuls, cheering and laughing. {halloween_friend} caught a giant chocolate spider and shared half with {name}.",
      dualTemplate:
        "The Great Cauldron EXPLODED with candy! Chocolate bats, gummy eyeballs, lollipop skulls, and candy pumpkins flew into the air like a candy firework show! Every monster caught handfuls, cheering and laughing. {halloween_friend} caught a giant chocolate spider and shared pieces with both {name} and {name2}.",
      sceneDescription:
        "Candy exploding from the cauldron like fireworks, all kinds of Halloween candy flying through the air, monsters and the child catching them joyfully",
      dualCharacterSceneDescription:
        "Two children working together to fix the Great Cauldron of Candy, one reaching inside while the other holds a flashlight",
    },
    {
      pageNumber: 9,
      template:
        "The monsters threw the greatest Halloween party in Monster Town history! They bobbed for apples (the vampire kept popping them with his fangs), danced the Monster Mash, and had a costume contest. {name}'s {costume} costume won first place! The trophy was a golden pumpkin that glowed in the dark.",
      dualTemplate:
        "The monsters threw the greatest Halloween party in Monster Town history! {name} and {name2} bobbed for apples together (the vampire kept popping them), danced the Monster Mash side by side, and entered the costume contest as a team. Their costumes won first place! The trophy was a golden pumpkin that glowed in the dark.",
      sceneDescription:
        "Grand Monster Town Halloween party with monsters dancing, bobbing for apples, the child holding a golden glowing pumpkin trophy",
    },
    {
      pageNumber: 10,
      template:
        "\"You're the bravest human we've ever met!\" the Mayor declared. All the monsters agreed -- the mummies clapped (though their bandages got tangled), the ghost did a happy loop-de-loop, and {halloween_friend} gave {name} the biggest, warmest hug. \"You'll always be an honorary monster, {name}.\"",
      dualTemplate:
        "\"You're the bravest humans we've ever met!\" the Mayor declared. All the monsters agreed -- the mummies clapped (bandages tangled), the ghost did a happy loop-de-loop, and {halloween_friend} gave {name} and {name2} the biggest, warmest group hug. \"You'll always be honorary monsters!\"",
      sceneDescription:
        "All the friendly monsters hugging and celebrating the child, the Mayor giving a speech, monsters with tangled bandages and happy ghosts spinning",
      dualCharacterSceneDescription:
        "Two children being crowned honorary monsters together by the Mayor, all the friendly monsters cheering and hugging them",
    },
    {
      pageNumber: 11,
      template:
        "The portal home opened in the mouth of the great jack-o'-lantern. {name} waved goodbye to every monster, every ghost, every skeleton and mummy and vampire. \"Same time next year?\" {halloween_friend} called. \"DEFINITELY!\" {name} shouted back, and jumped through the swirling orange light.",
      dualTemplate:
        "The portal home opened in the mouth of the great jack-o'-lantern. {name} and {name2} waved goodbye to every monster, every ghost, every skeleton and mummy and vampire. \"Same time next year?\" {halloween_friend} called. \"DEFINITELY!\" {name} and {name2} shouted together, and jumped through the swirling orange light.",
      sceneDescription:
        "Child waving goodbye through the glowing portal, all the Monster Town citizens waving back, orange and purple light swirling",
    },
    {
      pageNumber: 12,
      template:
        "Back on {possessive} own street, the moon was still full and the jack-o'-lanterns still glowed. {name} walked home with a candy bag bulging and a golden pumpkin trophy tucked under {possessive} arm. Best Halloween EVER. As {pronoun} drifted off to sleep, {name} could swear {pronoun} heard a friendly monster voice whisper: \"Happy Halloween, {name}. Sweet dreams.\"",
      dualTemplate:
        "Back on their own street, the moon was still full and the jack-o'-lanterns still glowed. {name} and {name2} walked home with candy bags bulging and a golden pumpkin trophy between them. Best Halloween EVER. As they drifted off to sleep, they could swear they heard a friendly monster voice whisper: \"Happy Halloween, {name} and {name2}. Sweet dreams.\"",
      sceneDescription:
        "Child in bed on Halloween night, golden pumpkin trophy glowing on the nightstand, candy bag nearby, a friendly monster shadow waving in the moonlight",
      dualCharacterSceneDescription:
        "Two children in bed on Halloween night together, golden pumpkin trophy glowing on the nightstand, candy bags nearby",
    },
  ],
};
