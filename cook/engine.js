/* Fridge Chef — offline recipe engine (free tier, zero AI cost).
   Matches the ingredients a user picked against a built-in recipe book. */
(function (root) {
  // id, name, emoji, category
  const CATALOG = [
    ["eggs","Eggs","🥚","protein"],["chicken","Chicken","🍗","protein"],["beef","Beef","🥩","protein"],
    ["bacon","Bacon","🥓","protein"],["sausage","Sausage","🌭","protein"],["tuna","Tuna","🐟","protein"],
    ["shrimp","Shrimp","🍤","protein"],["tofu","Tofu","🍢","protein"],["beans","Beans","🫘","protein"],
    ["onion","Onion","🧅","veg"],["garlic","Garlic","🧄","veg"],["tomato","Tomato","🍅","veg"],
    ["potato","Potato","🥔","veg"],["carrot","Carrot","🥕","veg"],["spinach","Spinach","🥬","veg"],
    ["broccoli","Broccoli","🥦","veg"],["bellpepper","Bell pepper","🫑","veg"],["mushroom","Mushrooms","🍄","veg"],
    ["corn","Corn","🌽","veg"],["cucumber","Cucumber","🥒","veg"],["lettuce","Lettuce","🥗","veg"],["avocado","Avocado","🥑","veg"],
    ["rice","Rice","🍚","carbs"],["pasta","Pasta","🍝","carbs"],["bread","Bread","🍞","carbs"],
    ["tortilla","Tortillas","🌯","carbs"],["noodles","Noodles","🍜","carbs"],["oats","Oats","🥣","carbs"],
    ["cheese","Cheese","🧀","dairy"],["milk","Milk","🥛","dairy"],["butter","Butter","🧈","dairy"],["yogurt","Yogurt","🍦","dairy"],
    ["banana","Banana","🍌","fruit"],["apple","Apple","🍎","fruit"],["lemon","Lemon","🍋","fruit"],["berries","Berries","🍓","fruit"],
    ["soy","Soy sauce","🥫","pantry"],["sauce","Tomato sauce","🍅","pantry"],["pb","Peanut butter","🥜","pantry"],["honey","Honey","🍯","pantry"],
  ].map(([id, name, emoji, cat]) => ({ id, name, emoji, cat }));
  const BY_ID = Object.fromEntries(CATALOG.map(c => [c.id, c]));
  CATALOG.find(c => c.id === "sauce").emoji = "🥫";
  CATALOG.find(c => c.id === "soy").emoji = "🍶";

  const CATS = [["protein","🍗 Protein"],["veg","🥕 Veggies"],["carbs","🍚 Carbs"],["dairy","🧀 Dairy"],["fruit","🍌 Fruit"],["pantry","🥫 Pantry"]];
  const VEGG = ["onion","carrot","broccoli","bellpepper","mushroom","spinach","tomato","potato","corn"];
  const MEAT = ["chicken","beef","bacon","sausage","tuna","shrimp"];
  const BLOCK = {
    none: [],
    vegetarian: MEAT,
    vegan: [...MEAT, "eggs", "cheese", "milk", "butter", "yogurt", "honey"],
    "gluten-free": ["bread", "pasta", "tortilla", "noodles", "oats", "soy"],
    "dairy-free": ["cheese", "milk", "butter", "yogurt"],
    "high-protein": [],
  };

  /* Recipe format:
     req: slots — each slot is a list of interchangeable ingredient ids (one must be present)
     opt: nice-to-have ids that get used if picked
     ing: [ids|"*staple", amount] — a line shows if any id in the list is available (staples always show)
     steps: [text, timerSec]; {0}/{1} = chosen item for req slot; {o} = chosen optional extras (step is dropped if none) */
  const R = [
    { t:"Fluffy Omelette", e:"🍳", m:10, d:"Easy", c:340, req:[["eggs"]], opt:["cheese","spinach","mushroom","bellpepper","onion","tomato"],
      ing:[[["eggs"],"3"],[["cheese","spinach","mushroom","bellpepper","onion","tomato"],"a handful of extras"],[["*oil"],"1 tsp oil or butter"]],
      steps:[["Crack 3 eggs into a bowl, add a pinch of salt and whisk with a fork until fully yellow.",0],
             ["Chop {v} small. Heat a pan on medium with a little oil and cook it 2 minutes until soft.",120],
             ["Pour in the eggs. Let them set without stirring until the edges are firm and the top looks slightly wet.",90],
             ["Add cheese now if you have it, fold the omelette in half, cook 20 more seconds, and slide onto a plate.",0]],
      tip:"Medium heat, not high — it keeps eggs soft instead of rubbery." },
    { t:"Egg Fried Rice", e:"🍚", m:15, d:"Easy", c:520, req:[["rice"],["eggs"]], opt:["carrot","corn","onion","chicken","shrimp","soy","garlic","broccoli","bellpepper"],
      ing:[[["rice"],"2 cups cooked"],[["eggs"],"2"],[["carrot","corn","onion","chicken","shrimp","garlic","broccoli","bellpepper"],"1 cup chopped extras"],[["soy"],"1 tbsp soy sauce"],[["*oil"],"1 tbsp oil"]],
      steps:[["Chop {o} into small pieces. Heat 1 tbsp oil in a big pan on medium-high.",0],
             ["Cook {o} for 3 minutes, stirring, until they start to soften (cook any meat until no pink remains).",180],
             ["Push everything aside and scramble the eggs in the empty space until just set.",60],
             ["Add the rice, breaking up clumps, and stir for 3 minutes until piping hot.",180],
             ["Season with salt, pepper and soy sauce if you have it, then taste and adjust.",0]],
      tip:"Day-old cold rice fries best — fresh rice turns mushy." },
    { t:"Garlic Pasta", e:"🍝", m:15, d:"Easy", c:480, req:[["pasta"],["garlic"]], opt:["butter","cheese","spinach","tomato","mushroom","lemon"],
      ing:[[["pasta"],"200 g / 2 handfuls"],[["garlic"],"3 cloves, sliced"],[["butter"],"1 tbsp butter"],[["cheese"],"a handful grated"],[["spinach","tomato","mushroom"],"extras, chopped"],[["*oil"],"2 tbsp olive oil"],[["*salt"],"salt for the water"]],
      steps:[["Boil a big pot of water with a big pinch of salt. Add the pasta and cook as the packet says.",600],
             ["Meanwhile warm 2 tbsp oil on LOW heat and add sliced garlic. Cook gently 1–2 minutes until it smells great but isn't brown.",90],
             ["Add {o} if you have it and cook 2 minutes. Scoop out a cup of pasta water, then drain the pasta.",120],
             ["Toss the pasta in the garlic pan with a splash of pasta water until glossy. Top with cheese.",0]],
      tip:"Burnt garlic is bitter — keep the heat low." },
    { t:"Quick Tomato Pasta", e:"🍅", m:20, d:"Easy", c:510, req:[["pasta"],["tomato","sauce"]], opt:["onion","garlic","cheese","sausage","mushroom","spinach"],
      ing:[[["pasta"],"200 g"],[["tomato","sauce"],"3 tomatoes chopped or 1 cup sauce"],[["onion","garlic","sausage","mushroom","spinach"],"extras, chopped"],[["cheese"],"to top"],[["*oil"],"1 tbsp oil"]],
      steps:[["Boil pasta in salted water as the packet says.",600],
             ["In a pan on medium, heat oil and cook {o} for 3–4 minutes (cook sausage until no pink).",210],
             ["Add the {1} and simmer 8 minutes, stirring now and then, until saucy. Season with salt and pepper.",480],
             ["Drain the pasta, toss it in the sauce, and top with cheese.",0]],
      tip:"Add a splash of pasta water if the sauce gets too thick." },
    { t:"Stovetop Mac & Cheese", e:"🧀", m:20, d:"Easy", c:620, req:[["pasta"],["cheese"],["milk","butter"]], opt:["broccoli","bacon"],
      ing:[[["pasta"],"200 g"],[["cheese"],"1.5 cups grated"],[["milk","butter"],"½ cup milk or 2 tbsp butter"],[["broccoli","bacon"],"extras"]],
      steps:[["Cook the pasta in salted water as the packet says, then drain.",600],
             ["Put the pot back on LOW heat. Add the {2} and stir for 30 seconds.",30],
             ["Add the cheese a handful at a time, stirring until melted and creamy.",90],
             ["Stir the pasta back in with {o}. Season with salt and pepper.",0]],
      tip:"Low heat only — high heat makes cheese grainy." },
    { t:"Chicken Veggie Stir-Fry", e:"🥘", m:20, d:"Easy", c:430, req:[["chicken","beef","tofu","shrimp"],VEGG], opt:["garlic","soy","rice","noodles","onion","broccoli","bellpepper","carrot","mushroom"],
      ing:[[["chicken","beef","tofu","shrimp"],"250 g, bite-size pieces"],[VEGG,"2 cups chopped veg"],[["garlic"],"2 cloves"],[["soy"],"2 tbsp soy sauce"],[["rice","noodles"],"to serve"],[["*oil"],"2 tbsp oil"]],
      steps:[["Cut the {0} and veg into small, even pieces. Small pieces cook fast.",0],
             ["Heat 1 tbsp oil in a big pan on high. Cook the {0} 4–6 minutes, stirring, until fully cooked with no pink. Move to a plate.",300],
             ["Add the rest of the oil and the veg. Stir-fry 4 minutes until bright and slightly tender.",240],
             ["Return the {0}, add {o} and soy sauce if you have it, toss for 1 minute. Serve over rice or noodles.",60]],
      tip:"Get the pan hot first — veg should sizzle, not steam." },
    { t:"Loaded Quesadilla", e:"🌮", m:12, d:"Easy", c:480, req:[["tortilla"],["cheese"]], opt:["chicken","beans","bellpepper","onion","tomato","spinach","avocado"],
      ing:[[["tortilla"],"2 tortillas"],[["cheese"],"1 cup grated"],[["chicken","beans","bellpepper","onion","tomato","spinach"],"fillings, chopped small"]],
      steps:[["Chop {o} small (cooked chicken or canned beans are ideal).",0],
             ["Lay a tortilla in a dry pan on medium. Cover with cheese and the fillings, then top with the second tortilla.",0],
             ["Cook 2–3 minutes until golden underneath, flip carefully with a big spatula, cook 2 more minutes.",300],
             ["Let it rest 1 minute, then cut into triangles.",0]],
      tip:"Less filling than you think — it makes flipping easier." },
    { t:"Grilled Cheese", e:"🥪", m:10, d:"Easy", c:450, req:[["bread"],["cheese"]], opt:["tomato","bacon","butter","onion"],
      ing:[[["bread"],"2 slices"],[["cheese"],"2 slices or a handful"],[["butter"],"butter for the outside"],[["tomato","bacon","onion"],"extras"]],
      steps:[["Butter one side of each slice (or brush with a little oil).",0],
             ["Place one slice butter-side-down in a pan on medium-low. Add cheese and {o}, then top with the other slice, butter-side-up.",0],
             ["Cook 3 minutes until golden, flip, and cook 3 more until the cheese is melted.",360]],
      tip:"Low and slow melts the cheese before the bread burns." },
    { t:"Crispy Pan Potatoes", e:"🥔", m:30, d:"Easy", c:380, req:[["potato"]], opt:["onion","bacon","cheese","eggs","garlic","bellpepper"],
      ing:[[["potato"],"2 medium, diced small"],[["onion","bacon","garlic","bellpepper"],"extras, chopped"],[["eggs"],"1–2 to fry on top"],[["cheese"],"to top"],[["*oil"],"2 tbsp oil"]],
      steps:[["Dice the potatoes into 1 cm cubes (small = faster). Pat dry.",0],
             ["Heat 2 tbsp oil in a pan on medium. Add potatoes in one layer, season with salt, and cook without stirring for 5 minutes.",300],
             ["Stir, then cook 10–12 more minutes, stirring every few minutes, until golden and a fork goes in easily.",660],
             ["Add {o} for the last 3 minutes. Top with cheese or a fried egg if you have them.",180]],
      tip:"Dry potatoes + no crowding = crispy." },
    { t:"Chicken & Rice Bowl", e:"🍗", m:30, d:"Easy", c:560, req:[["chicken"],["rice"]], opt:["broccoli","carrot","onion","garlic","soy","bellpepper","corn"],
      ing:[[["chicken"],"250 g, diced"],[["rice"],"1 cup uncooked"],[["broccoli","carrot","onion","garlic","bellpepper","corn"],"veg, chopped"],[["soy"],"1 tbsp soy sauce"],[["*oil"],"1 tbsp oil"]],
      steps:[["Rinse the rice, then cook it: 1 cup rice + 2 cups water, boil, cover, lowest heat for 15 minutes.",900],
             ["Season the diced chicken with salt and pepper. Heat oil in a pan on medium-high.",0],
             ["Cook the chicken 6–7 minutes, turning, until golden and no pink inside.",400],
             ["Add {o} and cook 4 minutes. Serve over the rice with soy sauce if you have it.",240]],
      tip:"Don't lift the lid on the rice while it cooks." },
    { t:"Creamy Tuna Pasta", e:"🐟", m:18, d:"Easy", c:540, req:[["tuna"],["pasta"]], opt:["tomato","garlic","onion","cheese","lemon","spinach"],
      ing:[[["tuna"],"1 can, drained"],[["pasta"],"200 g"],[["tomato","garlic","onion","spinach"],"extras, chopped"],[["cheese","lemon"],"to finish"],[["*oil"],"1 tbsp oil"]],
      steps:[["Boil pasta in salted water as the packet says. Save a cup of pasta water before draining.",600],
             ["While it cooks, warm oil in a pan on medium and soften {o} for 3 minutes.",180],
             ["Add the tuna and 3 tbsp pasta water, then stir in the drained pasta until coated. Season and taste.",0]],
      tip:"Lemon juice at the end makes tuna taste fresh." },
    { t:"Tuna Melt", e:"🥪", m:12, d:"Easy", c:470, req:[["tuna"],["bread"],["cheese"]], opt:["tomato","onion","lemon"],
      ing:[[["tuna"],"1 can, drained"],[["bread"],"2 slices"],[["cheese"],"2 slices"],[["tomato","onion","lemon"],"extras"]],
      steps:[["Mash the tuna in a bowl with a pinch of salt, pepper and {o}.",0],
             ["Toast the bread. Pile on the tuna and top with cheese.",0],
             ["Grill/broil (or microwave 30 seconds) until the cheese melts.",120]],
      tip:"No mayo? A spoon of yogurt works." },
    { t:"Cozy Fruit Oatmeal", e:"🥣", m:8, d:"Easy", c:320, req:[["oats"]], opt:["banana","apple","berries","milk","honey","pb"],
      ing:[[["oats"],"½ cup"],[["milk"],"1 cup milk (or water)"],[["banana","apple","berries"],"fruit, sliced"],[["honey","pb"],"drizzle or spoonful"]],
      steps:[["Add oats and 1 cup of milk or water to a pot with a pinch of salt.",0],
             ["Heat on medium, stirring, until it bubbles, then lower the heat and cook 4–5 minutes until creamy.",300],
             ["Top with {o}.",0]],
      tip:"Stir in peanut butter at the end for extra staying power." },
    { t:"Peanut Butter Banana Toast", e:"🍌", m:5, d:"Easy", c:360, req:[["bread"],["pb"],["banana"]], opt:["honey"],
      ing:[[["bread"],"2 slices"],[["pb"],"2 tbsp"],[["banana"],"1, sliced"],[["honey"],"a drizzle"]],
      steps:[["Toast the bread until golden.",120],["Spread peanut butter on while it's warm, add banana slices, and finish with {o}.",0]],
      tip:"A pinch of salt makes it taste like dessert." },
    { t:"2-Ingredient Banana Pancakes", e:"🥞", m:15, d:"Easy", c:280, req:[["banana"],["eggs"]], opt:["oats","berries","honey"],
      ing:[[["banana"],"1 ripe"],[["eggs"],"2"],[["oats"],"¼ cup (optional)"],[["berries","honey"],"to top"],[["*oil"],"a little butter or oil"]],
      steps:[["Mash the banana really well in a bowl with a fork, then whisk in the eggs (and oats if using).",0],
             ["Heat a lightly oiled pan on medium-low. Spoon in small pancakes (palm-sized).",0],
             ["Cook 2 minutes until bubbles form and edges look set, flip, and cook 1 more minute.",180],
             ["Top with {o}.",0]],
      tip:"Keep them small — they're delicate to flip." },
    { t:"Banana Smoothie", e:"🥤", m:5, d:"Easy", c:260, req:[["banana"],["milk","yogurt"]], opt:["berries","honey","oats","pb","spinach"],
      ing:[[["banana"],"1"],[["milk","yogurt"],"1 cup"],[["berries","honey","oats","pb","spinach"],"a handful of extras"]],
      steps:[["Peel the banana and add everything to a blender (or a tall cup with a stick blender).",0],["Blend 45 seconds until smooth. Add a splash of liquid if too thick.",45]],
      tip:"Freeze the banana first for a thick, cold shake." },
    { t:"Avocado Toast", e:"🥑", m:6, d:"Easy", c:340, req:[["avocado"],["bread"]], opt:["eggs","tomato","lemon"],
      ing:[[["avocado"],"1 ripe"],[["bread"],"2 slices"],[["eggs","tomato","lemon"],"extras"],[["*salt"],"salt, pepper"]],
      steps:[["Toast the bread until crisp.",120],["Mash the avocado with a fork, a pinch of salt, pepper and lemon if you have it.",0],["Spread on the toast and top with {o}.",0]],
      tip:"Fry an egg on top to turn it into a real meal." },
    { t:"Crunchy Cucumber Tomato Salad", e:"🥗", m:8, d:"Easy", c:150, req:[["cucumber"],["tomato"]], opt:["onion","cheese","lemon","lettuce","avocado"],
      ing:[[["cucumber"],"1, sliced"],[["tomato"],"2, chopped"],[["onion","cheese","lemon","lettuce","avocado"],"extras"],[["*oil"],"1 tbsp oil, salt, pepper"]],
      steps:[["Chop the cucumber and tomato into bite-size pieces. Slice a little onion thinly if using.",0],["Toss in a bowl with {o}, oil, salt and pepper (or lemon juice).",0],["Let it sit 5 minutes so the flavors mingle.",300]],
      tip:"Salt the tomatoes lightly — it brings out their sweetness." },
    { t:"Chicken Garden Salad", e:"🥗", m:15, d:"Easy", c:380, req:[["lettuce"],["chicken","eggs","tuna","beans"]], opt:["tomato","cucumber","carrot","cheese","avocado"],
      ing:[[["lettuce"],"big handful"],[["chicken","eggs","tuna","beans"],"protein, cooked"],[["tomato","cucumber","carrot","cheese","avocado"],"toppings"],[["*oil"],"oil + lemon or vinegar to dress"]],
      steps:[["Cook the {1} if it's raw: chicken 6 minutes per side until no pink; eggs 10 minutes in boiling water.",600],["Tear the lettuce into a big bowl and add {o}.",0],["Slice the {1} on top, drizzle with oil, salt and pepper, and toss.",0]],
      tip:"Dress the salad right before eating so it stays crisp." },
    { t:"Garlic Butter Shrimp", e:"🍤", m:12, d:"Easy", c:320, req:[["shrimp"],["garlic"]], opt:["butter","lemon","rice","pasta","spinach"],
      ing:[[["shrimp"],"250 g, peeled"],[["garlic"],"3 cloves"],[["butter"],"2 tbsp butter"],[["lemon"],"juice of ½"],[["rice","pasta"],"to serve"],[["*oil"],"1 tbsp oil if no butter"]],
      steps:[["Pat the shrimp dry and season with salt and pepper. Mince the garlic.",0],["Heat butter or oil in a pan on medium-high. Add shrimp in one layer, cook 2 minutes without moving.",120],["Flip, add garlic, and cook 1–2 minutes until the shrimp are pink and curled. Don't overcook.",90],["Finish with {o} and serve.",0]],
      tip:"Shrimp go from perfect to rubbery fast — pull them as soon as they're pink." },
    { t:"Bean & Cheese Burrito", e:"🌯", m:10, d:"Easy", c:520, req:[["beans"],["tortilla"]], opt:["rice","cheese","avocado","tomato","onion","bellpepper"],
      ing:[[["beans"],"1 cup, drained"],[["tortilla"],"2"],[["rice","cheese","avocado","tomato","onion","bellpepper"],"fillings"]],
      steps:[["Warm the beans in a small pot on medium for 3 minutes, mashing some with a fork. Season with salt and pepper.",180],["Warm the tortilla 15 seconds per side in a dry pan so it folds without cracking.",30],["Fill with beans and {o}. Fold in the sides, then roll tightly.",0]],
      tip:"Seared seam-side down for 1 minute keeps it closed." },
    { t:"Sausage & Peppers Skillet", e:"🌭", m:25, d:"Easy", c:480, req:[["sausage"],["bellpepper","onion"]], opt:["onion","bellpepper","garlic","bread","pasta","tomato"],
      ing:[[["sausage"],"2–3, sliced"],[["bellpepper"],"1–2, sliced"],[["onion"],"1, sliced"],[["garlic","tomato"],"extras"],[["bread","pasta"],"to serve"],[["*oil"],"1 tbsp oil"]],
      steps:[["Slice the sausage into coins and the veg into strips.",0],["Cook sausage in a pan on medium 5–6 minutes until browned and no pink remains.",360],["Add the veg and {o}. Cook 8 minutes, stirring, until soft and slightly charred.",480],["Serve in bread or over pasta.",0]],
      tip:"Browning the sausage first builds the flavor for everything else." },
    { t:"Breakfast Sandwich", e:"🥓", m:12, d:"Easy", c:480, req:[["bacon","sausage"],["eggs"],["bread"]], opt:["cheese","tomato","spinach","butter"],
      ing:[[["bacon","sausage"],"2 slices / 1 patty"],[["eggs"],"1–2"],[["bread"],"2 slices"],[["cheese","tomato","spinach"],"extras"]],
      steps:[["Cook the {0} in a pan on medium 4–5 minutes until crisp and fully cooked. Set aside.",300],["In the same pan, fry the egg 2–3 minutes until the white is firm (flip for a firm yolk).",150],["Toast the bread, then stack the egg, {0} and {o}.",0]],
      tip:"Use the bacon fat to fry the egg — it tastes amazing." },
    { t:"Garlicky Mushroom Sauté", e:"🍄", m:12, d:"Easy", c:200, req:[["mushroom"],["garlic","spinach","onion"]], opt:["butter","eggs","bread","pasta","spinach"],
      ing:[[["mushroom"],"250 g, sliced"],[["garlic"],"2 cloves"],[["spinach","onion"],"a handful"],[["butter"],"1 tbsp butter"],[["eggs","bread","pasta"],"to serve"],[["*oil"],"1 tbsp oil"]],
      steps:[["Slice the mushrooms. Heat oil or butter in a pan on medium-high until hot.",0],["Add mushrooms in one layer. Leave alone for 3 minutes until browned underneath.",180],["Stir, add {1}, and cook 3 more minutes. Season with salt and pepper.",180]],
      tip:"Don't crowd or salt early — mushrooms need to brown, not steam." },
    { t:"Garlic Butter Noodles", e:"🍜", m:12, d:"Easy", c:480, req:[["noodles"],["garlic","butter"]], opt:["eggs","soy","onion","spinach","corn"],
      ing:[[["noodles"],"1 packet / 150 g"],[["garlic","butter"],"2 cloves garlic or 2 tbsp butter"],[["eggs","soy","onion","spinach","corn"],"extras"],[["*oil"],"1 tbsp oil"]],
      steps:[["Boil noodles as the packet says, then drain, saving a splash of water.",300],["Warm oil/butter on medium. Cook the garlic (and {o}) 2 minutes until fragrant.",120],["Toss the noodles in with a splash of water until glossy. Season with soy sauce or salt.",0]],
      tip:"Crack an egg into the hot pan for a quick runny-yolk sauce." },
    { t:"Upgraded Ramen Bowl", e:"🍜", m:12, d:"Easy", c:450, req:[["noodles"],["eggs"]], opt:["spinach","corn","chicken","soy","onion","mushroom"],
      ing:[[["noodles"],"1 pack"],[["eggs"],"1–2"],[["spinach","corn","chicken","soy","onion","mushroom"],"toppings"]],
      steps:[["Boil 2 cups water. Gently lower in the eggs and set a timer for 7 minutes for jammy yolks.",420],["Add the noodles (and any raw veg) to the same pot for the last 3 minutes.",180],["Peel and halve the eggs. Serve with {o}.",0]],
      tip:"Ice-cold water for the eggs makes them easy to peel." },
    { t:"Tofu Scramble", e:"🍳", m:15, d:"Easy", c:260, req:[["tofu"]], opt:["spinach","onion","bellpepper","tomato","mushroom","garlic"],
      ing:[[["tofu"],"1 block, crumbled"],[["spinach","onion","bellpepper","tomato","mushroom","garlic"],"veg, chopped"],[["*oil"],"1 tbsp oil"],[["*salt"],"salt, pepper"]],
      steps:[["Drain the tofu and press with paper towels. Crumble it with your fingers.",0],["Cook {o} in oil on medium for 4 minutes.",240],["Add the tofu, season well with salt and pepper, and cook 5 minutes until lightly golden.",300]],
      tip:"Turmeric turns it egg-yellow if you have it." },
    { t:"Sheet-Pan Roasted Veggies", e:"🥦", m:35, d:"Easy", c:220, req:[["broccoli","carrot","potato","bellpepper","onion","mushroom"]], opt:["garlic","cheese"],
      ing:[[["broccoli","carrot","potato","bellpepper","onion","mushroom"],"4 cups chopped veg"],[["garlic","cheese"],"extras"],[["*oil"],"2 tbsp oil, salt, pepper"]],
      steps:[["Heat the oven to 220°C / 425°F. Cut all veg into similar-size pieces (potato smaller).",0],["Toss on a tray with the oil, salt and pepper. Spread in a single layer.",0],["Roast 25 minutes, stirring once halfway, until edges are browned.",1500],["Finish with {o} if you like.",0]],
      tip:"Crowded pans steam — use two trays if needed." },
    { t:"French Toast", e:"🍞", m:12, d:"Easy", c:400, req:[["bread"],["eggs"],["milk"]], opt:["banana","berries","honey","butter"],
      ing:[[["bread"],"4 slices"],[["eggs"],"2"],[["milk"],"¼ cup"],[["banana","berries","honey"],"to top"],[["butter"],"butter for the pan"]],
      steps:[["Whisk eggs and milk in a shallow dish with a pinch of salt.",0],["Soak each bread slice about 10 seconds per side.",0],["Cook in a buttered pan on medium 2–3 minutes per side until golden.",300],["Top with {o}.",0]],
      tip:"Slightly stale bread soaks better." },
    { t:"Hearty Veggie Soup", e:"🍲", m:35, d:"Easy", c:200, req:[["potato","carrot","tomato"],["onion","garlic"]], opt:["carrot","potato","spinach","beans","broccoli","tomato","noodles"],
      ing:[[["potato","carrot","tomato"],"2 cups chopped"],[["onion","garlic"],"1 onion or 3 cloves"],[["carrot","potato","spinach","beans","broccoli","noodles"],"extras"],[["*oil"],"1 tbsp oil"],[["*water"],"4 cups water, salt, pepper"]],
      steps:[["Chop everything into small, even pieces.",0],["Cook the {1} in oil on medium for 4 minutes until soft.",240],["Add the {0}, {o} and 4 cups of water with a good pinch of salt. Bring to a boil.",0],["Reduce to a gentle simmer for 20 minutes until everything is tender. Taste and adjust.",1200]],
      tip:"Mash a few potatoes into the soup to thicken it." },
  ];

  const clean = (sel, diet) => {
    const block = new Set(BLOCK[diet] || []);
    return sel.filter(id => !block.has(id));
  };
  const nameOf = id => (BY_ID[id] ? BY_ID[id].name.toLowerCase() : id);
  const fill = (txt, ctx) => txt.replace(/\{(\d|o|v)\}/g, (_, k) => ctx[k] || "");

  function build(r, have, missingId) {
    const picks = r.req.map(slot => slot.find(id => have.has(id)) || null);
    if (missingId != null) picks[missingId.slot] = missingId.id;
    const extras = r.opt.filter(id => have.has(id) && !picks.includes(id));
    const ctx = { o: extras.slice(0, 4).map(nameOf).join(", "), v: extras.filter(id => BY_ID[id].cat === "veg").slice(0, 4).map(nameOf).join(", ") };
    picks.forEach((id, i) => (ctx[i] = nameOf(id)));
    const ing = [];
    r.ing.forEach(([ids, amt]) => {
      if (ids[0][0] === "*") { ing.push({ item: ids[0].slice(1), amount: amt }); return; }
      const found = ids.filter(id => have.has(id) || (missingId && id === missingId.id));
      if (!found.length) return;
      const shown = ids.length > 4 ? found.slice(0, 3).map(nameOf).join(", ") : found.map(nameOf).join(" / ");
      ing.push({ item: shown, amount: amt });
    });
    const steps = r.steps.filter(s => !((s[0].includes("{o}") && !ctx.o) || (s[0].includes("{v}") && !ctx.v))).map(s => ({ text: fill(s[0], ctx).replace(/\s{2,}/g, " ").replace(/ ,/g, ","), timer_sec: s[1] }));
    return { title: r.t, emoji: r.e, time_min: r.m, difficulty: r.d, calories: r.c,
      missing: missingId ? [nameOf(missingId.id)] : [], ingredients: ing, steps, tip: r.tip, local: true, _score: 0, _extras: extras.length };
  }

  /* Generic fallback so any sensible combo still gets a meal. */
  function skillet(have) {
    const all = [...have].map(id => BY_ID[id]).filter(Boolean);
    const pro = all.filter(c => c.cat === "protein"), veg = all.filter(c => c.cat === "veg"), carb = all.filter(c => ["carbs"].includes(c.cat));
    if (!(pro.length || veg.length) ) return null;
    const names = a => a.map(c => c.name.toLowerCase()).join(", ");
    const steps = [];
    steps.push({ text: "Chop everything into small, similar-size pieces so it cooks evenly.", timer_sec: 0 });
    if (pro.length) steps.push({ text: `Heat 1 tbsp oil in a large pan on medium-high. Cook the ${names(pro)} 5–7 minutes until browned and cooked through (no pink in meat, firm eggs). Move to a plate.`, timer_sec: 360 });
    if (veg.length) steps.push({ text: `Add a little more oil, then cook the ${names(veg)} for 5–6 minutes, stirring, until tender and lightly browned.`, timer_sec: 330 });
    steps.push({ text: `Return the ${pro.length ? "protein" : "pan contents"} to the pan, season with salt and pepper, and toss for 1 minute.`, timer_sec: 60 });
    if (carb.length) steps.push({ text: `Serve over or with your ${names(carb)}, cooked as the packet says.`, timer_sec: 0 });
    return { title: "Kitchen-Sink Skillet", emoji: "🍳", time_min: 20, difficulty: "Easy", calories: 450, missing: [],
      ingredients: [...all.slice(0, 8).map(c => ({ item: c.name.toLowerCase(), amount: "as much as you like" })), { item: "oil", amount: "2 tbsp" }, { item: "salt & pepper", amount: "to taste" }],
      steps, tip: "Add a squeeze of lemon or a splash of soy sauce at the end to brighten it.", local: true, _score: -1, _extras: 0 };
  }

  function suggest(selected, { diet = "none", maxTime = 45, limit = 8 } = {}) {
    const have = new Set(clean(selected, diet));
    const out = [];
    R.forEach(r => {
      if (r.m > maxTime) return;
      const unmet = [];
      r.req.forEach((slot, i) => { if (!slot.some(id => have.has(id))) unmet.push(i); });
      if (unmet.length === 0) {
        const b = build(r, have); b._score = 10 + b._extras * 1.2 + (diet === "high-protein" && /egg|chicken|tuna|beef|shrimp|tofu|bean/.test(JSON.stringify(r.req)) ? 2 : 0) - r.m / 60; out.push(b);
      } else if (unmet.length === 1 && r.req.length > 1) {
        const block = new Set(BLOCK[diet] || []);
        const alt = r.req[unmet[0]].find(id => !block.has(id));
        if (!alt || have.size < 2) return;
        const b = build(r, have, { slot: unmet[0], id: alt }); b._score = 4 + b._extras * .8 - r.m / 60; out.push(b);
      }
    });
    out.sort((a, b) => b._score - a._score);
    let near = 0;
    const res = out.filter(r => !r.missing.length || ++near <= 3).slice(0, limit);
    if (res.filter(r => !r.missing.length).length < 2) { const s = skillet(have); if (s) res.push(s); }
    return res;
  }

  function random(diet = "none") {
    const pool = R.filter(r => r.req.every(slot => clean(slot, diet).length));
    const r = pool[Math.floor(Math.random() * pool.length)];
    const have = new Set();
    r.req.forEach(slot => have.add(clean(slot, diet)[0]));
    r.opt.slice(0, 2).forEach(id => clean([id], diet).length && have.add(id));
    return build(r, have);
  }

  const api = { CATALOG, CATS, BY_ID, RECIPES: R, suggest, random };
  if (typeof module !== "undefined") module.exports = api; else root.FC = api;
})(typeof window !== "undefined" ? window : globalThis);
