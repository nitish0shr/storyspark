export interface StorySkeletonPage {
  pageNumber: number;
  template: string;
  sceneDescription: string;
}

export const storySkeletons: Record<string, StorySkeletonPage[]> = {
  "space-adventure": [
    {
      pageNumber: 1,
      template:
        "Every night, {name} looked up at the sky and counted the stars. One, two, three... so many! The moon winked down like an old friend. \"Someday,\" {name} whispered, \"I'm going to visit every single one.\" Little did {name} know, someday was closer than {pronoun} thought.",
      sceneDescription:
        "Child standing in their backyard at night, gazing up at a sky full of twinkling stars, wearing pajamas with little rocket ships on them",
    },
    {
      pageNumber: 2,
      template:
        "The very next morning, something extraordinary appeared in the backyard. A gleaming rocket ship sat right between the swing set and the old oak tree! It sparkled like silver rain and hummed a gentle tune. A note on the door read: \"For {name} -- Captain of {spaceship_name}.\"",
      sceneDescription:
        "A shiny, colorful rocket ship parked in a cozy backyard next to a swing set, morning sunlight glinting off its surface",
    },
    {
      pageNumber: 3,
      template:
        "{name} climbed inside {spaceship_name} and gasped. The cockpit was full of blinking buttons in every color -- red, blue, green, and one big sparkly gold one. {name} pressed the gold button. WHOOOOSH! The rocket lifted off the ground, up past the clouds, up past the birds, up, up, up into the great dark sky!",
      sceneDescription:
        "Child inside a colorful rocket ship cockpit, pressing a big gold button, looking amazed as Earth shrinks in the window behind them",
    },
    {
      pageNumber: 4,
      template:
        "Stars zoomed past the windows like fireflies in a jar. {name} flew past the Moon, which waved with a dusty gray hand. \"Where are you going?\" the Moon asked. \"To {planet}!\" {name} called back. \"Give it my best!\" the Moon replied, and {name} zoomed onward through the glittering dark.",
      sceneDescription:
        "Rocket ship flying past a friendly smiling Moon, stars streaking by like ribbons of light against deep blue space",
    },
    {
      pageNumber: 5,
      template:
        "{planet} was even more amazing than {name} had imagined. The ground shimmered in swirls of color, and the sky had not one but two suns! Strange, beautiful flowers sang soft melodies, and tiny glowing creatures floated like living lanterns. Everything smelled like warm cinnamon and starlight.",
      sceneDescription:
        "Child stepping out of the rocket onto a beautiful alien planet with swirling colorful ground, two suns in the sky, and glowing floating creatures",
    },
    {
      pageNumber: 6,
      template:
        "A round, friendly creature bounced over. It was soft like a pillow and purple like a plum, with three big sparkly eyes. \"Welcome!\" it squeaked. \"We've been waiting for you, {name}! We need your help. Our Star Garden has gone dark, and only someone brave can bring back the light.\"",
      sceneDescription:
        "Child meeting a cute round purple alien creature with three sparkly eyes on the colorful alien planet surface",
    },
    {
      pageNumber: 7,
      template:
        "{name} followed the little creature to the Star Garden. It was a field of crystal flowers that used to glow, but now they were dim and quiet. In the very center sat a sleeping star, curled up like a kitten. \"It forgot how to shine,\" the creature whispered. {name} knelt down gently.",
      sceneDescription:
        "Child kneeling beside a sleeping star in a garden of dim crystal flowers, the purple alien creature watching hopefully nearby",
    },
    {
      pageNumber: 8,
      template:
        "\"You can do it,\" {name} said softly to the little star. \"I believe in you. Even when things feel dark, there's always light inside.\" {name} placed {possessive} hands around the star and hummed a gentle lullaby. Slowly, warmly, the star began to glow -- first a flicker, then a blaze of golden light!",
      sceneDescription:
        "Child cradling a glowing star in their hands, golden light spreading outward, crystal flowers beginning to light up all around",
    },
    {
      pageNumber: 9,
      template:
        "One by one, every crystal flower burst into brilliant light -- blue, pink, gold, and green! The Star Garden was alive again, and all the little creatures cheered and bounced and sang. \"You did it, {name}!\" they cried. \"You brought back our light!\" The whole planet seemed to shimmer with gratitude.",
      sceneDescription:
        "A dazzling garden of glowing crystal flowers in brilliant colors, happy alien creatures bouncing and celebrating around the child",
    },
    {
      pageNumber: 10,
      template:
        "The creatures gave {name} a tiny star in a glass jar. \"So you'll always have a piece of our sky,\" they said. {name} hugged each one goodbye, climbed back into {spaceship_name}, and set a course for home. The stars outside the window seemed to wave as {pronoun} passed.",
      sceneDescription:
        "Child holding a small glowing star in a jar, waving goodbye to alien friends from the rocket ship door",
    },
    {
      pageNumber: 11,
      template:
        "{spaceship_name} landed softly in the backyard just as the sun was setting. {name} hopped out, holding the star jar close. The rocket ship hummed one last gentle song, then disappeared in a shimmer of silver dust, leaving only a trail of sparkles on the grass.",
      sceneDescription:
        "Rocket ship landing in the backyard at sunset, leaving a trail of silver sparkles, child climbing out holding a glowing jar",
    },
    {
      pageNumber: 12,
      template:
        "That night, {name} placed the tiny star on the nightstand. It glowed softly, filling the room with a warm golden light. \"Goodnight, stars,\" {name} whispered. And somewhere far, far away on {planet}, a little purple creature whispered back, \"Goodnight, {name}. Thank you for believing.\"",
      sceneDescription:
        "Child tucked in bed, a glowing star jar on the nightstand casting warm golden light across a cozy bedroom",
    },
  ],

  "dinosaur-discovery": [
    {
      pageNumber: 1,
      template:
        "{name} loved dinosaurs more than anything in the whole wide world. {possessive} room was full of dinosaur books, dinosaur toys, and even dinosaur pajamas. But {name} had a secret wish -- to meet a real, living dinosaur. \"If only,\" {pronoun} sighed, hugging {possessive} stuffed {favorite_dinosaur}.",
      sceneDescription:
        "Child in a bedroom filled with dinosaur posters, toys, and books, hugging a stuffed dinosaur while looking wistfully out the window",
    },
    {
      pageNumber: 2,
      template:
        "One sunny morning, {name} was digging in the garden when {possessive} shovel hit something hard. Scrape, scrape, brush, brush -- and there it was: a giant egg! It was speckled green and gold and warm to the touch. It trembled, then wobbled, then CRACK! A tiny head poked out.",
      sceneDescription:
        "Child kneeling in a garden, brushing dirt off a large speckled green and gold egg that is beginning to crack open",
    },
    {
      pageNumber: 3,
      template:
        "Out tumbled a baby {favorite_dinosaur}, no bigger than a puppy! It blinked its big round eyes at {name} and let out a squeaky little roar. Then it nuzzled right into {name}'s arms. \"I'll call you Pebble,\" {name} laughed as the baby dinosaur licked {possessive} cheek.",
      sceneDescription:
        "Child holding a tiny adorable baby dinosaur that is licking their cheek, both surrounded by garden flowers and sunshine",
    },
    {
      pageNumber: 4,
      template:
        "Pebble sneezed, and a swirl of sparkly dust filled the air. When {name} opened {possessive} eyes, the backyard was GONE. In its place stood a prehistoric jungle with trees as tall as buildings and ferns the size of cars. Enormous dragonflies buzzed overhead. They had traveled back in time!",
      sceneDescription:
        "Child and baby dinosaur standing in a lush prehistoric jungle with enormous ferns, towering trees, and giant dragonflies",
    },
    {
      pageNumber: 5,
      template:
        "A friendly Brontosaurus lowered its long, long neck and blinked at {name}. \"Hop on,\" it seemed to say. {name} climbed up carefully, settling between the great dinosaur's shoulders. Pebble scrambled up too. Together they rode above the treetops, seeing rivers of silver and mountains of green stretching on forever.",
      sceneDescription:
        "Child riding high on a gentle Brontosaurus above the treetops of a prehistoric jungle, baby dinosaur sitting beside them, vast landscape visible",
    },
    {
      pageNumber: 6,
      template:
        "By a sparkling stream, they found a family of Triceratops munching on bright red berries. The littlest one waddled over and nudged {name}'s hand. {name} giggled and shared some berries. \"You're just like Pebble -- friendly and hungry!\" The baby Triceratops snorted happily.",
      sceneDescription:
        "Child sitting by a sparkling stream sharing berries with a baby Triceratops, while a family of Triceratops grazes peacefully nearby",
    },
    {
      pageNumber: 7,
      template:
        "A shadow swept over the clearing. {name} looked up and saw a magnificent Pterodactyl gliding across the sky, its wings wide as a rainbow. It circled down and landed gently. {name} reached out and touched its warm, leathery wing. \"You're beautiful,\" {name} breathed.",
      sceneDescription:
        "Child reaching up to touch the wing of a magnificent Pterodactyl that has landed beside them, sunlight filtering through its outstretched wings",
    },
    {
      pageNumber: 8,
      template:
        "But then the ground began to rumble. BOOM. BOOM. BOOM. Through the trees came the biggest dinosaur of all -- a towering T-Rex! {name}'s heart beat fast. But the T-Rex looked down with soft, kind eyes and let out a low, gentle rumble. It wasn't scary at all. It was saying hello!",
      sceneDescription:
        "A massive but gentle-looking T-Rex bending down toward the child, who stands bravely looking up with wonder rather than fear",
    },
    {
      pageNumber: 9,
      template:
        "The T-Rex led {name} and Pebble to a hidden valley where all the dinosaurs gathered together. There were dinosaurs of every shape and size, playing and splashing and munching. \"This is your home, Pebble,\" {name} said softly, as the baby dinosaur looked around with wonder.",
      sceneDescription:
        "A magical hidden valley filled with diverse dinosaurs playing peacefully, child standing at the entrance with baby dinosaur, golden light flooding in",
    },
    {
      pageNumber: 10,
      template:
        "Pebble looked at {name}, then at the other dinosaurs, then back at {name}. The little dinosaur pressed its head against {name}'s chest and rumbled softly. \"I know,\" {name} whispered, hugging Pebble tight. \"This is where you belong. But I'll never forget you. Not ever.\"",
      sceneDescription:
        "Emotional scene of child hugging the baby dinosaur close, both looking at each other with love, other dinosaurs watching gently in the background",
    },
    {
      pageNumber: 11,
      template:
        "Pebble sneezed one more time, and the sparkly dust swirled again. When {name} opened {possessive} eyes, {pronoun} was back in the garden. The sun was warm. The birds were singing. And right there in the dirt, where the egg had been, lay a single green and gold speckle -- a tiny piece of Pebble's shell.",
      sceneDescription:
        "Child back in the familiar garden, kneeling down to pick up a small speckled eggshell fragment, sunlight streaming down warmly",
    },
    {
      pageNumber: 12,
      template:
        "{name} put the little shell on {possessive} nightstand, right next to the stuffed {favorite_dinosaur}. \"Goodnight, Pebble,\" {name} whispered. And if {pronoun} listened very, very carefully through the open window, {pronoun} could almost hear a tiny, happy roar carried on the evening breeze.",
      sceneDescription:
        "Child in bed, a small green eggshell on the nightstand next to a stuffed dinosaur toy, window open to a starry night sky",
    },
  ],

  "under-the-sea": [
    {
      pageNumber: 1,
      template:
        "{name} stood at the edge of the ocean, letting the waves tickle {possessive} toes. The water was the bluest blue {pronoun} had ever seen -- bluer than the sky, bluer than blueberries. \"I wonder what's down there,\" {name} said, peering into the sparkling sea. Something shimmered just below the surface.",
      sceneDescription:
        "Child standing barefoot at the water's edge on a beautiful sunny beach, peering curiously into crystal-clear turquoise water",
    },
    {
      pageNumber: 2,
      template:
        "A beautiful {sea_creature} popped its head above the waves and smiled. Yes, smiled! \"Come swim with me, {name}!\" it called in a voice like bubbles. It tossed {name} a glowing pearl necklace. The moment {name} put it on, something amazing happened -- {pronoun} could breathe underwater!",
      sceneDescription:
        "A friendly sea creature emerging from the waves offering a glowing pearl necklace to the delighted child on the beach",
    },
    {
      pageNumber: 3,
      template:
        "SPLASH! {name} dove in. The ocean wrapped around {object} like a warm blanket. Fish in every color of the rainbow swam past -- orange and purple and electric blue. The {sea_creature} swam beside {name}, and together they glided through a coral reef that looked like an underwater garden.",
      sceneDescription:
        "Child swimming joyfully underwater beside their sea creature friend, surrounded by colorful coral reef and tropical fish",
    },
    {
      pageNumber: 4,
      template:
        "They swam through an archway of pink coral into a hidden cove. There, a family of seahorses danced in a circle, their tiny tails curling like ribbons. \"Welcome, {name}!\" they chimed. A baby seahorse floated over and perched on {name}'s finger. It was no bigger than a thumb.",
      sceneDescription:
        "Child in an underwater cove with dancing seahorses, a tiny baby seahorse perched on their finger, pink coral archway behind them",
    },
    {
      pageNumber: 5,
      template:
        "Deeper they swam, past jellyfish that glowed like floating lanterns and starfish that waved from every rock. An old wise turtle paddled up slowly. \"Young {name},\" it said, \"there's trouble below. The Sunken Palace has lost its light. Will you help us find it again?\"",
      sceneDescription:
        "Child floating beside a large wise sea turtle, surrounded by glowing jellyfish and waving starfish in deeper blue water",
    },
    {
      pageNumber: 6,
      template:
        "The {sea_creature} led {name} down, down, down to the Sunken Palace. It was a castle made of shells and sea glass, but it was dark and quiet. The pearl at its very top had gone missing. Without it, the whole ocean floor was losing its glow. \"We need to find that pearl,\" {name} said bravely.",
      sceneDescription:
        "Child and sea creature friend approaching a dim but beautiful underwater palace made of shells and sea glass on the ocean floor",
    },
    {
      pageNumber: 7,
      template:
        "{name} searched through underwater caves and seaweed forests. {pronoun} looked inside giant clamshells and behind sleeping whales. Finally, deep in a dark grotto, {name} spotted something: a faint, golden glow, hidden under a pile of smooth stones. The missing pearl!",
      sceneDescription:
        "Child discovering a faintly glowing golden pearl hidden under stones in a dark underwater grotto, light illuminating their excited face",
    },
    {
      pageNumber: 8,
      template:
        "But a grumpy octopus was guarding it, arms crossed and frowning. \"That's MY shiny thing,\" it huffed. {name} sat down on the sandy floor. \"I understand,\" {name} said gently. \"It IS beautiful. But the whole ocean needs its light. What if we find you something even shinier?\"",
      sceneDescription:
        "Child sitting on the ocean floor having a friendly conversation with a grumpy but cute octopus who is hugging the golden pearl",
    },
    {
      pageNumber: 9,
      template:
        "{name} took the glowing pearl necklace from {possessive} own neck and offered it to the octopus. The octopus's eyes went wide. \"For me? Really?\" it whispered. \"Really,\" {name} smiled. The octopus hugged {name} with all eight arms and handed over the palace pearl. \"You're the kindest person in the whole ocean!\"",
      sceneDescription:
        "Octopus happily hugging the child with all eight arms while exchanging the palace pearl for the glowing necklace, both smiling",
    },
    {
      pageNumber: 10,
      template:
        "{name} swam up to the Sunken Palace and placed the pearl on top. WHOOOOSH! Light exploded outward like an underwater sunrise. The whole ocean floor lit up in gold and blue and green. Every creature cheered -- the fish, the seahorses, the turtle, even the octopus wearing its new sparkly necklace.",
      sceneDescription:
        "Child placing the golden pearl on top of the palace, brilliant light radiating outward, sea creatures celebrating all around",
    },
    {
      pageNumber: 11,
      template:
        "The {sea_creature} nuzzled {name} gently. \"Thank you for saving our home,\" it said. \"You'll always be welcome here.\" It pressed a tiny shell into {name}'s palm. \"Hold this to your ear, and you'll hear us singing.\" {name} hugged {possessive} friend one last time.",
      sceneDescription:
        "Child and sea creature friend sharing a tender goodbye, the sea creature pressing a small shell into the child's hand, glowing palace behind them",
    },
    {
      pageNumber: 12,
      template:
        "Back on the shore, {name} held the little shell to {possessive} ear. Sure enough -- the sound of the ocean was there, but also something more: tiny voices, singing {name}'s name. {name} smiled, toes in the warm sand, watching the waves sparkle. The sea would always hold a special place in {possessive} heart.",
      sceneDescription:
        "Child sitting on the beach at sunset, holding a shell to their ear and smiling, waves sparkling with magical light in the background",
    },
  ],

  "royal-quest": [
    {
      pageNumber: 1,
      template:
        "Once upon a time, in a kingdom where sunflowers grew as tall as houses and rivers sparkled like diamonds, there lived a young {role} named {name}. {name} was kind to every creature, brave in every storm, and had a laugh that made flowers bloom. But today, the kingdom needed {object} more than ever.",
      sceneDescription:
        "Child wearing a royal crown and cape standing in a magical kingdom with oversized sunflowers and sparkling rivers, a grand castle in the distance",
    },
    {
      pageNumber: 2,
      template:
        "The Royal Messenger arrived at dawn, out of breath. \"Your Highness! The Enchanted Crystal that keeps our kingdom bright has been taken to the top of Moonpeak Mountain! Without it, darkness will cover the land by sundown.\" {name} stood tall. \"Then I shall go and bring it back.\"",
      sceneDescription:
        "A small messenger bird delivering an urgent scroll to the child in a grand castle hallway, morning light streaming through stained glass windows",
    },
    {
      pageNumber: 3,
      template:
        "{name} put on {possessive} finest traveling cloak and packed a bag with bread, cheese, and a compass that always pointed toward home. At the castle gate, a beautiful white horse waited, its mane braided with tiny bells. \"Let's ride, friend,\" {name} said, and off they galloped into the Enchanted Forest.",
      sceneDescription:
        "Child in a royal traveling cloak mounting a beautiful white horse with bells in its mane, at the gates of a sparkling castle",
    },
    {
      pageNumber: 4,
      template:
        "The Enchanted Forest was full of wonders. Trees whispered secrets, mushrooms glowed in jewel tones, and fireflies spelled out words of encouragement: \"YOU CAN DO IT, {name}!\" A family of foxes bowed as {pronoun} passed. Even the forest believed in {object}.",
      sceneDescription:
        "Child riding through an enchanted forest with glowing mushrooms, whispering trees, and fireflies forming encouraging words in the air",
    },
    {
      pageNumber: 5,
      template:
        "But the path ended at a deep, rushing river with no bridge. {name} looked around thoughtfully. Then {pronoun} remembered {possessive} special gift -- {magical_power}! {name} closed {possessive} eyes, took a deep breath, and used {possessive} power. The river calmed, and stepping stones rose from the water, one by one.",
      sceneDescription:
        "Child using magical power at the edge of a rushing river, glowing stepping stones rising from the water, magical energy swirling around them",
    },
    {
      pageNumber: 6,
      template:
        "On the other side, a grumpy troll sat on a rock, arms folded. \"Nobody passes!\" it growled. But {name} wasn't afraid. \"You look cold and lonely,\" {name} said, and offered the troll some bread and cheese. The troll's eyes softened. \"Nobody's ever been kind to me before,\" it sniffled. \"Go ahead, Your Highness.\"",
      sceneDescription:
        "Child offering bread and cheese to a grumpy but softening troll sitting on a mossy rock beside the path, the troll starting to smile",
    },
    {
      pageNumber: 7,
      template:
        "The path climbed higher and higher up Moonpeak Mountain. The wind blew harder and the sky grew darker. But {name} kept climbing, step by step. {possessive} horse nickered encouragement. \"We're almost there,\" {name} said. And then {pronoun} saw it -- the peak, glowing faintly under the last light of day.",
      sceneDescription:
        "Child climbing a steep mountain path with their white horse, wind blowing their cloak, a faintly glowing peak visible above through dark clouds",
    },
    {
      pageNumber: 8,
      template:
        "At the very top sat the Enchanted Crystal on a stone pedestal. It pulsed with a warm, golden light. But wrapped around it was a shadow creature, dark and swirling. \"This crystal is mine now,\" it hissed. {name}'s heart beat fast, but {pronoun} did not run. A true {role} never gives up.",
      sceneDescription:
        "Child facing a dark swirling shadow creature wrapped around a golden glowing crystal on a mountain peak, standing brave and determined",
    },
    {
      pageNumber: 9,
      template:
        "{name} stepped forward and spoke in a clear, steady voice: \"Darkness cannot stay where there is kindness.\" {pronoun} used {possessive} {magical_power} once more, pouring all {possessive} courage and love into it. A blinding flash of light burst from {name}'s hands, and the shadow creature dissolved like morning fog.",
      sceneDescription:
        "Child using their magical power to blast brilliant light at the shadow creature, which is dissolving into wisps, the crystal blazing with renewed energy",
    },
    {
      pageNumber: 10,
      template:
        "{name} lifted the Enchanted Crystal high above {possessive} head. Its light streamed down the mountainside like liquid gold, racing across the kingdom. Flowers opened. Stars appeared. The rivers sparkled again. From far below, {name} could hear the people cheering. The kingdom was saved!",
      sceneDescription:
        "Child holding the glowing crystal triumphantly above their head on the mountain peak, golden light streaming down across the entire kingdom below",
    },
    {
      pageNumber: 11,
      template:
        "The ride home was full of celebration. The troll waved a tiny flag. The foxes lined the path. The fireflies spelled out \"HOORAY!\" The whole kingdom had gathered at the castle gates, tossing flower petals into the air. The Royal Messenger announced: \"{name}, the Brave and Kind!\"",
      sceneDescription:
        "Grand celebration scene with the child riding back into the kingdom on their white horse, flower petals in the air, cheering crowds and friendly creatures",
    },
    {
      pageNumber: 12,
      template:
        "That night, the Enchanted Crystal glowed from the highest tower, bathing the kingdom in warm light. And in the coziest room of the castle, {name} curled up under a blanket of stars. \"Being brave isn't about not being scared,\" {name} thought. \"It's about being kind even when things are hard.\" And with that, the bravest {role} in the land fell fast asleep.",
      sceneDescription:
        "Child curled up in a cozy castle bedroom, warm starlight from the crystal tower spilling through the window, looking peaceful and content",
    },
  ],

  "superhero-origin": [
    {
      pageNumber: 1,
      template:
        "{name} was an ordinary kid who did ordinary things: ate cereal in the morning, played outside after school, and always remembered to brush {possessive} teeth. But sometimes, late at night, {name} felt a tiny buzz in {possessive} fingers and wondered: \"What if I'm meant for something... extraordinary?\"",
      sceneDescription:
        "Child in their everyday bedroom looking at their hands with curiosity, a faint sparkle visible at their fingertips in the evening light",
    },
    {
      pageNumber: 2,
      template:
        "One evening, a shooting star streaked across the sky -- but instead of disappearing, it curved, turned, and flew straight through {name}'s open window! It landed softly on the pillow: a glowing, star-shaped gem, warm and humming with power. When {name} picked it up, it flashed so bright the whole room turned golden.",
      sceneDescription:
        "A glowing star-shaped gem landing on a child's pillow through an open window, the room filling with golden light, child reaching toward it in wonder",
    },
    {
      pageNumber: 3,
      template:
        "{name} felt the power flow through {possessive} whole body like warm sunshine. {pronoun} jumped -- and floated! {pronoun} stretched {possessive} hands -- and they glowed! {name} had a superpower: {superpower}! \"This is AMAZING!\" {name} laughed, spinning around the room. Every superhero needs a beginning, and this was {possessive}.",
      sceneDescription:
        "Child floating in their bedroom, hands glowing with power, laughing with pure joy, bedroom items gently floating around them",
    },
    {
      pageNumber: 4,
      template:
        "Every superhero needs a look. {name} found an old red blanket and tied it into the perfect cape. {pronoun} added goggles from the costume box and boots that made a satisfying STOMP with every step. {name} looked in the mirror and struck a pose. \"Watch out, world. Here I come!\"",
      sceneDescription:
        "Child in a homemade superhero costume -- red cape, fun goggles, boots -- striking a confident pose in front of a mirror, looking heroic and adorable",
    },
    {
      pageNumber: 5,
      template:
        "{name} zoomed into town just in time. The sky had turned a funny shade of green, and a mischievous villain called the Jelly Giant was bouncing through the streets! It was made entirely of wobbly, jiggly purple jelly, and it was bumping into everything, making a sticky mess of the whole town square.",
      sceneDescription:
        "A silly purple jelly giant bouncing through a colorful town square, knocking things around, people looking up in surprise, child arriving heroically",
    },
    {
      pageNumber: 6,
      template:
        "\"Stop right there, Jelly Giant!\" {name} called out bravely. The Jelly Giant turned around and wobbled. \"Make me!\" it giggled, launching a glob of jelly into the air. But {name} used {possessive} {superpower} to dodge it perfectly! The crowd gasped. A real superhero!",
      sceneDescription:
        "Child in superhero cape using their superpower to dodge a glob of jelly, crowd watching in amazement, the jelly giant looking surprised",
    },
    {
      pageNumber: 7,
      template:
        "But being a hero isn't just about power. {name} noticed something: the Jelly Giant wasn't mean -- it was crying jelly tears! \"Wait,\" {name} said, landing gently. \"What's wrong?\" The Giant sniffled. \"Nobody wants to play with me because I'm too sticky and I break everything!\"",
      sceneDescription:
        "Child approaching the jelly giant gently, the giant sitting down looking sad with jelly tears, child showing compassion and concern",
    },
    {
      pageNumber: 8,
      template:
        "{name} thought for a moment. \"What if we find a place where being big and bouncy is perfect?\" {name} led the Jelly Giant to the empty park, where it could bounce all it wanted without bumping into anything. BOING! BOING! BOING! The Giant laughed with joy. Soon other kids came to bounce with it too!",
      sceneDescription:
        "Child leading the happy jelly giant to a park, children bouncing and playing with it, everyone laughing and having fun together",
    },
    {
      pageNumber: 9,
      template:
        "But there was still one more thing to do. {name} heard a tiny sound: \"Mew! Mew!\" It was {rescue_target}, in trouble! Stuck, scared, and needing help right now. {name} didn't hesitate for even one second. {pronoun} used {possessive} {superpower} with all {possessive} might and -- WHOOSH -- the rescue was a success!",
      sceneDescription:
        "Child using their superpower dramatically to rescue someone/something in need, action lines and energy effects surrounding the heroic moment",
    },
    {
      pageNumber: 10,
      template:
        "The whole town gathered in the square. The mayor stepped forward. \"Today, we witnessed something truly special. Not just {superpower}, but something greater -- kindness, bravery, and heart.\" The crowd cheered: \"{name}! {name}! {name}!\" Confetti rained down like colorful snow.",
      sceneDescription:
        "Child standing on a small stage in the town square, mayor presenting them to cheering crowds, colorful confetti falling from the sky",
    },
    {
      pageNumber: 11,
      template:
        "The Jelly Giant gave {name} a wobbly salute. The rescued {rescue_target} nuzzled close. The townspeople clapped and waved. {name} waved back, cape fluttering in the breeze. It had been the most incredible day. But {name} knew the best part wasn't the cheering -- it was knowing {pronoun} had helped.",
      sceneDescription:
        "Child waving to the crowd with cape fluttering, jelly giant saluting in the background, warm sunset light across the town square",
    },
    {
      pageNumber: 12,
      template:
        "Back in {possessive} room, {name} placed the star gem on the windowsill. It pulsed gently, like a heartbeat. {name} knew that being a superhero wasn't really about the powers. It was about choosing to be kind, choosing to be brave, and always, always standing up for others. And that's a power everyone has inside.",
      sceneDescription:
        "Child in their cozy bedroom, star gem glowing on the windowsill, child smiling peacefully as stars twinkle outside, cape folded neatly on a chair",
    },
  ],

  "kindness-courage": [
    {
      pageNumber: 1,
      template:
        "This is the story of {name}, who is {age} years old and already one of the most remarkable people in the world. You might wonder: how can someone so young be so remarkable? Well, it's not because of magic powers or special gadgets. It's because of something even better. Let me show you.",
      sceneDescription:
        "Child sitting under a big sunlit tree in a meadow full of wildflowers, looking warm and content, holding a small glowing heart in their hands",
    },
    {
      pageNumber: 2,
      template:
        "{name} has a heart that notices things. When someone looks sad, {name} sees it. When someone needs help, {name} feels it. Not long ago, {name} did something truly kind: {kind_act}. It might sound small, but small kindnesses are like seeds -- they grow into something beautiful.",
      sceneDescription:
        "Child performing an act of kindness, helping someone with a warm smile, golden light radiating softly from their hands",
    },
    {
      pageNumber: 3,
      template:
        "Did you know that every act of kindness sends a little ripple out into the world? Like a pebble dropped in a pond, one kind thing leads to another, and another, and another. When {name} was kind, it made someone else feel brave enough to be kind too. And on it went, rippling outward.",
      sceneDescription:
        "Beautiful visual of golden ripples spreading outward from the child like rings in a pond, touching other people who then glow warmly too",
    },
    {
      pageNumber: 4,
      template:
        "But being kind isn't always easy. Sometimes it takes courage. And {name} knows about courage too. Right now, {name} is learning to be brave about something important: {brave_thing}. That takes a special kind of bravery -- the quiet kind that doesn't always get noticed.",
      sceneDescription:
        "Child standing at the edge of something that represents their challenge, taking a deep breath with determination, soft encouraging light around them",
    },
    {
      pageNumber: 5,
      template:
        "Courage doesn't mean you're not scared. It means you feel the butterflies in your tummy, the wobble in your knees, and the racing of your heart -- and you take a deep breath and try anyway. {name} knows this feeling. And every time {pronoun} tries, {pronoun} gets a little bit braver.",
      sceneDescription:
        "Child with a determined expression, visible butterflies around their tummy area transforming into little golden stars as they step forward bravely",
    },
    {
      pageNumber: 6,
      template:
        "One day, {name} saw someone who was having a really hard time. They looked lonely and a little bit lost. Some people walked right past. But not {name}. {name} walked over, sat down, and said the most powerful words in any language: \"Hi. I'm {name}. Do you want to be friends?\"",
      sceneDescription:
        "Child sitting down next to another child who looks lonely on a bench, extending a hand in friendship, warm light between them",
    },
    {
      pageNumber: 7,
      template:
        "And just like that, a friendship was born. Because kindness is a superpower that doesn't need a cape or a mask. It just needs someone willing to notice, willing to care, and willing to try. {name} is that someone. {pronoun} has always been that someone.",
      sceneDescription:
        "The two children playing together happily, laughing, a trail of golden sparkles connecting them, other children drawn toward the warmth",
    },
    {
      pageNumber: 8,
      template:
        "There are so many ways {name} makes the world brighter. A smile in the morning. A hug when someone's sad. Saying \"thank you\" and really meaning it. Sharing the last cookie. Picking a flower for someone just because. These aren't little things -- they're everything.",
      sceneDescription:
        "A montage-style scene of the child doing various kind things -- hugging, sharing, picking flowers -- each act creating little bursts of warm light",
    },
    {
      pageNumber: 9,
      template:
        "And when {name} faces something hard? {pronoun} remembers this: being brave doesn't mean doing it perfectly. It means doing it scared. It means falling down and getting back up. It means saying \"I can't do it yet\" instead of \"I can't do it.\" That little word -- yet -- changes everything.",
      sceneDescription:
        "Child getting back up after a stumble, dusting off their knees with a small smile, the word 'yet' glowing in golden letters in the sky above",
    },
    {
      pageNumber: 10,
      template:
        "If you could see {name} the way I see {object}, you'd see something incredible. Not just a {age}-year-old kid. But a person who is already changing the world, one kind moment and one brave step at a time. And that is the most extraordinary thing of all.",
      sceneDescription:
        "Child looking at their reflection in a calm pond, but the reflection shows them wearing a crown of golden light, looking noble and strong",
    },
    {
      pageNumber: 11,
      template:
        "So tonight, as {name} closes {possessive} eyes, I hope {pronoun} knows this: you are enough, exactly as you are. Your kindness matters. Your courage matters. Your laugh, your tears, your hugs, your tries -- they all matter so much. The world is lucky to have you in it.",
      sceneDescription:
        "Child surrounded by loved ones -- family and friends -- in a warm living room, everyone smiling and wrapping the child in a group hug",
    },
    {
      pageNumber: 12,
      template:
        "Goodnight, sweet {name}. Tomorrow there will be new chances to be kind, new chances to be brave, and new chances to be exactly the wonderful person you already are. And no matter what, you are loved -- bigger than the sky, deeper than the ocean, and more than all the stars you can count. Always and forever.",
      sceneDescription:
        "Child tucked into bed, warm golden light surrounding them, stars visible through the window, looking peaceful and deeply loved",
    },
  ],
};
