/**
 * Emergency Recipe Generator
 * Given a list of available ingredients, generates instant recipe ideas
 */

// Quick recipes indexed by key ingredient
const QUICK_RECIPES = {
  'chicken': [
    { name: 'Pan-Seared Chicken Thighs', time: '15 min', calories: 320, protein: 34, carbs: 2, fat: 20, servings: 1,
      ingredients: ['2 chicken thighs', '1 tbsp olive oil', 'Salt & pepper to taste', 'Garlic powder'],
      instructions: 'Season chicken with salt, pepper, and garlic powder. Heat oil in a skillet over medium-high. Cook chicken 6-7 min per side until golden and cooked through (165°F internal).' },
    { name: 'Quick Chicken Stir-Fry', time: '12 min', calories: 380, protein: 36, carbs: 18, fat: 18, servings: 1,
      ingredients: ['1 chicken breast (cubed)', '2 cups mixed veggies', '2 tbsp soy sauce', '1 tbsp oil', '1 tsp ginger'],
      instructions: 'Cube chicken. Heat oil in wok/pan. Stir-fry chicken 4 min. Add veggies, soy sauce, ginger. Cook 3-4 min until veggies are tender-crisp.' },
  ],
  'eggs': [
    { name: '3-Minute Scrambled Eggs', time: '3 min', calories: 280, protein: 22, carbs: 3, fat: 20, servings: 1,
      ingredients: ['3 eggs', '1 tbsp butter', 'Salt & pepper', 'Dash of milk (optional)'],
      instructions: 'Whisk eggs with a splash of milk. Melt butter in a non-stick pan over medium-low. Pour eggs and stir gently with a spatula. Remove from heat when still slightly soft — they keep cooking.' },
    { name: 'Loaded Omelette', time: '8 min', calories: 340, protein: 28, carbs: 5, fat: 24, servings: 1,
      ingredients: ['3 eggs', 'Fillings: cheese, spinach, mushrooms', '1 tbsp oil', 'Salt & pepper'],
      instructions: 'Beat eggs with salt and pepper. Heat oil in a non-stick pan. Pour eggs, tilt to cover. When nearly set, add fillings on one half. Fold omelette over and slide onto plate.' },
  ],
  'rice': [
    { name: '5-Minute Fried Rice', time: '5 min', calories: 350, protein: 12, carbs: 52, fat: 10, servings: 1,
      ingredients: ['1 cup cooked rice (day-old is best)', '1 egg', '1 tbsp soy sauce', 'Mixed veggies', '1 tbsp oil'],
      instructions: 'Heat oil in a wok over high heat. Scramble egg, set aside. Stir-fry veggies 1 min. Add rice and soy sauce, toss 2 min. Return egg, mix, serve.' },
  ],
  'pasta': [
    { name: 'Garlic Olive Oil Pasta (Aglio e Olio)', time: '10 min', calories: 420, protein: 12, carbs: 55, fat: 16, servings: 1,
      ingredients: ['2 oz pasta', '3 cloves garlic (sliced)', '2 tbsp olive oil', 'Red pepper flakes', 'Parsley', 'Parmesan'],
      instructions: 'Cook pasta per package directions. While it cooks, heat olive oil over medium-low. Add garlic and red pepper flakes — cook 1-2 min until fragrant (don\'t burn). Toss with drained pasta, parsley, and Parmesan.' },
  ],
  'potato': [
    { name: '5-Minute Microwave Baked Potato', time: '5 min', calories: 290, protein: 7, carbs: 55, fat: 5, servings: 1,
      ingredients: ['1 large potato', 'Butter/sour cream', 'Salt & pepper', 'Chives (optional)'],
      instructions: 'Pierce potato several times with a fork. Microwave 4-5 min (flip halfway). Let rest 1 min. Split open, fluff with fork. Top with butter, salt, pepper, and chives.' },
  ],
  'salmon': [
    { name: 'Pan-Seared Salmon', time: '10 min', calories: 400, protein: 38, carbs: 1, fat: 26, servings: 1,
      ingredients: ['1 salmon fillet (6 oz)', '1 tbsp oil', 'Salt & pepper', 'Lemon wedge'],
      instructions: 'Season salmon with salt and pepper. Heat oil in a non-stick skillet over medium-high. Cook skin-side down 4 min. Flip and cook 2-3 min more. Squeeze lemon on top.' },
  ],
  'beef': [
    { name: 'Quick Beef Stir-Fry', time: '10 min', calories: 420, protein: 35, carbs: 12, fat: 24, servings: 1,
      ingredients: ['1/2 lb beef strips', '2 cups veggies', '2 tbsp soy sauce', '1 tbsp oil', '1 clove garlic'],
      instructions: 'Slice beef thin. Heat oil in wok over high heat. Cook beef 2 min, remove. Stir-fry garlic and veggies 2 min. Return beef, add soy sauce. Toss 1 min and serve.' },
  ],
  'tofu': [
    { name: 'Crispy Pan-Fried Tofu', time: '12 min', calories: 280, protein: 22, carbs: 8, fat: 18, servings: 1,
      ingredients: ['1 block firm tofu (pressed)', '2 tbsp soy sauce', '1 tbsp oil', 'Cornstarch for dusting'],
      instructions: 'Press tofu 5 min to remove moisture. Cube and toss gently with cornstarch. Heat oil in a non-stick pan over medium-high. Cook cubes 3-4 min per side until golden. Drizzle soy sauce and serve.' },
  ],
  'tuna': [
    { name: '5-Minute Tuna Salad Wrap', time: '5 min', calories: 310, protein: 28, carbs: 20, fat: 12, servings: 1,
      ingredients: ['1 can tuna (drained)', '2 tbsp mayo', '1 tortilla wrap', 'Lettuce', 'Salt & pepper'],
      instructions: 'Mix tuna with mayo, salt, and pepper. Lay lettuce on tortilla. Spread tuna mixture. Roll up tightly and slice in half.' },
  ],
  'avocado': [
    { name: '3-Minute Avocado Toast', time: '3 min', calories: 290, protein: 8, carbs: 22, fat: 20, servings: 1,
      ingredients: ['1 slice bread (toasted)', '1/2 avocado', 'Salt & pepper', 'Red pepper flakes', 'Lemon juice'],
      instructions: 'Toast bread. Mash avocado with a fork. Spread on toast. Season with salt, pepper, red pepper flakes, and a squeeze of lemon.' },
  ],
  'beans': [
    { name: 'Quick Bean & Cheese Quesadilla', time: '5 min', calories: 340, protein: 16, carbs: 32, fat: 16, servings: 1,
      ingredients: ['1 tortilla', '1/4 cup canned beans (mashed)', '1/4 cup shredded cheese', 'Salsa for dipping'],
      instructions: 'Spread mashed beans on half the tortilla. Sprinkle cheese on top. Fold over. Cook in a dry skillet over medium heat 2-3 min per side until golden. Cut into wedges. Serve with salsa.' },
  ],
  'shrimp': [
    { name: 'Garlic Butter Shrimp (5 min)', time: '5 min', calories: 280, protein: 32, carbs: 2, fat: 16, servings: 1,
      ingredients: ['1/2 lb shrimp (peeled)', '1 tbsp butter', '2 cloves garlic (minced)', 'Lemon wedge', 'Parsley'],
      instructions: 'Melt butter in a skillet over medium-high. Add garlic and cook 30 seconds. Add shrimp, cook 1-2 min per side until pink. Squeeze lemon, garnish with parsley.' },
  ],
  'oats': [
    { name: '3-Minute Microwave Oatmeal', time: '3 min', calories: 260, protein: 12, carbs: 45, fat: 4, servings: 1,
      ingredients: ['1/2 cup rolled oats', '1 cup milk or water', 'Pinch of salt', 'Toppings: fruit, honey, nuts'],
      instructions: 'Combine oats, milk, and salt in a microwave-safe bowl. Microwave 2-3 min (stir halfway). Top with fruit, a drizzle of honey, or nuts.' },
  ],
  'bread': [
    { name: '2-Minute Grilled Cheese', time: '2 min', calories: 320, protein: 14, carbs: 28, fat: 18, servings: 1,
      ingredients: ['2 slices bread', '1-2 slices cheese', '1 tbsp butter', 'Optional: ham or tomato'],
      instructions: 'Butter one side of each bread slice. Place cheese (and optional fillings) between unbuttered sides. Cook in a skillet over medium heat 1-2 min per side until golden and cheese melts.' },
  ],
  'ground beef': [
    { name: 'Quick Beef Tacos', time: '10 min', calories: 380, protein: 32, carbs: 24, fat: 18, servings: 1,
      ingredients: ['1/2 lb ground beef', '2 corn tortillas', 'Taco seasoning', 'Lettuce, tomato, salsa'],
      instructions: 'Brown ground beef in a skillet 5 min. Add taco seasoning and 1/4 cup water. Simmer 3 min until thick. Warm tortillas. Fill with beef, lettuce, tomato, salsa.' },
  ],
  'canned tomatoes': [
    { name: '10-Minute Tomato Basil Soup', time: '10 min', calories: 200, protein: 6, carbs: 24, fat: 10, servings: 1,
      ingredients: ['1 can crushed tomatoes', '1 clove garlic', '2 tbsp cream or milk', 'Basil leaves', 'Salt & pepper', '1 tbsp oil'],
      instructions: 'Sauté garlic in oil 1 min. Add tomatoes, simmer 5 min. Stir in cream. Season with salt and pepper. Top with fresh basil.' },
  ],
}

export function findEmergencyRecipes(ingredientsText) {
  if (!ingredientsText || !ingredientsText.trim()) {
    // Return some default quick recipes if no ingredients given
    return [
      QUICK_RECIPES['eggs'][0],
      QUICK_RECIPES['bread'][0],
      QUICK_RECIPES['oats'][0],
      QUICK_RECIPES['avocado'][0],
      QUICK_RECIPES['tuna'][0],
    ]
  }

  const words = ingredientsText.toLowerCase().split(/[\s,]+/).filter(Boolean)
  const matched = new Set()
  const results = []

  // Check each key ingredient against user's input
  for (const [key, recipes] of Object.entries(QUICK_RECIPES)) {
    const keyWords = key.split(/\s+/)
    const found = keyWords.some(kw => words.some(w => w.includes(kw) || kw.includes(w)))
    if (found && !matched.has(key)) {
      matched.add(key)
      // Add up to 2 recipes for this ingredient
      recipes.slice(0, 2).forEach(r => results.push(r))
    }
  }

  // If nothing matched, suggest from common pantry staples
  if (results.length === 0) {
    const fallbackKeys = ['eggs', 'bread', 'rice', 'oats', 'potato', 'canned tomatoes']
    for (const key of fallbackKeys) {
      if (QUICK_RECIPES[key]) {
        QUICK_RECIPES[key].slice(0, 1).forEach(r => results.push(r))
      }
    }
  }

  return results.slice(0, 6)
}

export function findLeftoverIdeas(planMeals) {
  if (!planMeals || planMeals.length === 0) return []

  // Collect all ingredients used across the week
  const allIngredients = new Set()
  const allMealNames = []
  for (const day of planMeals) {
    for (const meal of day.meals) {
      allMealNames.push(meal.name)
      for (const ing of (meal.ingredients || [])) {
        allIngredients.add(ing.replace(/^\d+\s*\w*\s*/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase())
      }
    }
  }

  const ideas = []

  // Check for common leftover scenarios in the user's meal plan
  if (allMealNames.some(n => n.toLowerCase().includes('chicken'))) {
    ideas.push({
      from: 'Cooked chicken',
      idea: 'Shred leftover chicken and make chicken salad wraps for lunch. Mix with mayo, celery, salt & pepper.',
      time: '5 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('rice'))) {
    ideas.push({
      from: 'Leftover rice',
      idea: 'Turn it into quick fried rice! Just toss with an egg, soy sauce, and any veggies in your fridge.',
      time: '5 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('roast') || n.toLowerCase().includes('bake') || n.toLowerCase().includes('potato'))) {
    ideas.push({
      from: 'Leftover roasted veggies',
      idea: 'Blend roasted veggies with broth for a creamy vegetable soup. Or toss into a frittata with eggs.',
      time: '10 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('pasta'))) {
    ideas.push({
      from: 'Leftover pasta',
      idea: 'Pan-fry leftover pasta in a little olive oil until crispy — called "pasta frittata" or crispy pasta cakes.',
      time: '5 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('salmon') || n.toLowerCase().includes('fish'))) {
    ideas.push({
      from: 'Leftover cooked fish',
      idea: 'Flake leftover fish into tacos with slaw, or mix into a quick fish cake with breadcrumbs and an egg.',
      time: '8 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('bean'))) {
    ideas.push({
      from: 'Leftover beans',
      idea: 'Mash leftover beans with garlic and cumin for a quick dip. Serve with tortilla chips or in a wrap.',
      time: '5 min',
    })
  }

  if (allMealNames.some(n => n.toLowerCase().includes('beef') || n.toLowerCase().includes('steak'))) {
    ideas.push({
      from: 'Leftover beef/steak',
      idea: 'Slice thin and serve over a salad, or make quick beef tacos with salsa and avocado.',
      time: '5 min',
    })
  }

  // Always add a general suggestion
  ideas.push({
    from: 'Any leftovers',
    idea: 'Turn any leftover proteins + veggies into a frittata: whisk eggs, pour over leftovers in an oven-safe pan, bake at 375°F for 12-15 min.',
    time: '15 min',
  })

  return ideas.slice(0, 5)
}