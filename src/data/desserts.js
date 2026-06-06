const dessertsDb = {
  'No restrictions': [
    { name: 'Dark Chocolate & Berry Bowl', ingredients: ['1 oz dark chocolate (70%+)', '1/2 cup mixed berries', '1 tbsp chopped almonds'], instructions: 'Melt chocolate, drizzle over berries. Top with almonds.', protein: 4, carbs: 18, fat: 12, cost: '💰', prepTime: '5 min' },
    { name: 'Greek Yogurt with Honey & Walnuts', ingredients: ['1/2 cup Greek yogurt', '1 tbsp honey', '1 tbsp crushed walnuts'], instructions: 'Top yogurt with honey and walnuts.', protein: 10, carbs: 16, fat: 8, cost: '💰', prepTime: '2 min' },
    { name: 'Banana Nice Cream', ingredients: ['2 frozen bananas', '1 tbsp cocoa powder', '1 tbsp peanut butter'], instructions: 'Blend frozen bananas, cocoa, and peanut butter until creamy.', protein: 6, carbs: 34, fat: 8, cost: '💰', prepTime: '5 min' },
    { name: 'Apple Cinnamon Baked', ingredients: ['1 apple', '1 tsp cinnamon', '1 tsp honey', '1 tbsp chopped pecans'], instructions: 'Core apple, fill with cinnamon, honey, pecans. Bake 375°F 15 min.', protein: 2, carbs: 28, fat: 6, cost: '💰', prepTime: '18 min' },
    { name: 'Chia Pudding', ingredients: ['3 tbsp chia seeds', '3/4 cup coconut milk', '1 tsp vanilla', '1 tbsp maple syrup'], instructions: 'Mix all ingredients. Refrigerate 2+ hours.', protein: 6, carbs: 16, fat: 14, cost: '💰', prepTime: '5 min + chill' },
  ],
  Keto: [
    { name: 'Keto Chocolate Mousse', ingredients: ['1/2 cup heavy cream', '1 oz dark chocolate (90%)', '1 tbsp cocoa powder', '1 tsp vanilla'], instructions: 'Melt chocolate. Whip cream. Fold together with cocoa and vanilla. Chill.', protein: 4, carbs: 6, fat: 34, cost: '💰💰', prepTime: '10 min + chill' },
    { name: 'Strawberries & Cream', ingredients: ['1/2 cup strawberries', '1/4 cup heavy cream', '1 tsp vanilla'], instructions: 'Whip cream with vanilla. Serve over sliced strawberries.', protein: 2, carbs: 6, fat: 22, cost: '💰', prepTime: '5 min' },
    { name: 'Keto Fat Bomb Bites', ingredients: ['2 tbsp coconut oil', '2 tbsp almond butter', '1 tbsp cocoa powder', '1 tbsp coconut flakes'], instructions: 'Mix, form into balls. Freeze 20 min.', protein: 4, carbs: 4, fat: 24, cost: '💰', prepTime: '5 min + freeze' },
    { name: 'Avocado Cocoa Pudding', ingredients: ['1/2 avocado', '2 tbsp cocoa powder', '2 tbsp almond milk'], instructions: 'Blend all until smooth. Chill.', protein: 3, carbs: 6, fat: 16, cost: '💰', prepTime: '5 min' },
  ],
  Vegan: [
    { name: 'Coconut Mango Nice Cream', ingredients: ['2 frozen bananas', '1/2 cup frozen mango', '1/4 cup coconut milk'], instructions: 'Blend all until creamy.', protein: 4, carbs: 36, fat: 6, cost: '💰', prepTime: '5 min' },
    { name: 'Vegan Chocolate Mousse', ingredients: ['1 avocado', '2 tbsp cocoa powder', '2 tbsp maple syrup', '1 tsp vanilla', '1/4 cup oat milk'], instructions: 'Blend all until silky. Chill.', protein: 4, carbs: 24, fat: 14, cost: '💰', prepTime: '5 min + chill' },
    { name: 'Date & Nut Energy Balls', ingredients: ['6 dates', '1/4 cup almonds', '2 tbsp cocoa powder', '1 tbsp coconut'], instructions: 'Blend dates, almonds, cocoa. Roll into balls.', protein: 6, carbs: 32, fat: 10, cost: '💰💰', prepTime: '10 min' },
    { name: 'Berry Coconut Chia', ingredients: ['3 tbsp chia seeds', '3/4 cup coconut milk', '1/2 cup berries', '1 tbsp maple syrup'], instructions: 'Mix chia, milk, maple. Chill 2+ hrs. Top with berries.', protein: 6, carbs: 22, fat: 16, cost: '💰', prepTime: '5 min + chill' },
  ],
  Vegetarian: [
    { name: 'Ricotta & Berry Toast', ingredients: ['1 slice sourdough', '1/4 cup ricotta', '1/4 cup berries', '1 tsp honey'], instructions: 'Toast. Spread ricotta. Top with berries and honey.', protein: 8, carbs: 24, fat: 6, cost: '💰', prepTime: '5 min' },
    { name: 'Dark Chocolate Banana Bites', ingredients: ['1 banana', '1 oz dark chocolate melted', '1 tbsp pistachios'], instructions: 'Slice banana, dip in chocolate, top with pistachios. Freeze 15 min.', protein: 4, carbs: 28, fat: 10, cost: '💰', prepTime: '10 min + freeze' },
    { name: 'Yogurt Berry Parfait', ingredients: ['1/2 cup Greek yogurt', '1/4 cup granola', '1/4 cup berries', '1 tsp honey'], instructions: 'Layer yogurt, granola, berries. Drizzle honey.', protein: 10, carbs: 24, fat: 4, cost: '💰', prepTime: '3 min' },
    { name: 'Baked Apples with Oats', ingredients: ['1 apple', '2 tbsp rolled oats', '1 tbsp butter', '1 tsp cinnamon', '1 tsp brown sugar'], instructions: 'Mix oats, butter, cinnamon, sugar. Stuff apple. Bake 375°F 18 min.', protein: 4, carbs: 32, fat: 8, cost: '💰', prepTime: '20 min' },
  ],
  Paleo: [
    { name: 'Paleo Berry Crumble', ingredients: ['1 cup berries', '1/4 cup almond flour', '1 tbsp coconut oil', '1 tbsp maple syrup', '1/4 tsp cinnamon'], instructions: 'Toss berries in dish. Mix topping. Sprinkle over. Bake 375°F 15 min.', protein: 4, carbs: 20, fat: 12, cost: '💰💰', prepTime: '18 min' },
    { name: 'Baked Pear with Almond Butter', ingredients: ['1 pear halved', '1 tbsp almond butter', '1 tsp cinnamon', '1 tbsp almonds'], instructions: 'Top pear with almond butter, cinnamon. Bake 375°F 15 min.', protein: 4, carbs: 24, fat: 10, cost: '💰', prepTime: '18 min' },
    { name: 'Paleo Chocolate Mousse', ingredients: ['1 avocado', '2 tbsp cocoa powder', '2 tbsp maple syrup', '2 tbsp coconut milk'], instructions: 'Blend all until silky. Chill.', protein: 3, carbs: 18, fat: 16, cost: '💰', prepTime: '5 min + chill' },
    { name: 'Frozen Banana Almond Bites', ingredients: ['1 banana sliced', '2 tbsp almond butter', '1 oz dark chocolate', 'Sea salt'], instructions: 'Spread almond butter on banana. Dip in chocolate. Freeze 20 min.', protein: 6, carbs: 24, fat: 14, cost: '💰', prepTime: '10 min + freeze' },
  ],
  'Gluten-Free': [
    { name: 'Flourless Chocolate Cake', ingredients: ['3 oz dark chocolate', '2 tbsp butter', '2 eggs', '1 tbsp maple syrup', '1 tsp vanilla'], instructions: 'Melt chocolate & butter. Whisk eggs, maple, vanilla. Fold together. Bake 350°F 12 min.', protein: 8, carbs: 16, fat: 22, cost: '💰💰', prepTime: '20 min' },
    { name: 'GF Berry Crisp', ingredients: ['1 cup berries', '1/4 cup GF oats', '1 tbsp coconut oil', '1 tbsp maple syrup', '1/4 tsp cinnamon'], instructions: 'Mix all, bake 375°F 15 min.', protein: 3, carbs: 24, fat: 10, cost: '💰', prepTime: '18 min' },
    { name: 'GF Yogurt & Berry Bowl', ingredients: ['1/2 cup Greek yogurt (GF)', '1/4 cup berries', '1 tbsp honey', '1 tbsp GF granola'], instructions: 'Top yogurt with berries, honey, granola.', protein: 10, carbs: 20, fat: 4, cost: '💰', prepTime: '2 min' },
    { name: 'Chocolate Banana Pops', ingredients: ['1 banana', '2 tbsp dark chocolate melted', '1 tbsp crushed almonds'], instructions: 'Insert stick, dip in chocolate, roll in almonds. Freeze 30 min.', protein: 4, carbs: 26, fat: 10, cost: '💰', prepTime: '10 min + freeze' },
  ],
}

// Premium ingredient keywords for cost estimation
const premiumKeywords = ['steak', 'salmon', 'shrimp', 'scallop', 'ribeye', 'lamb', 'beef strip', 'halloumi', 'cauliflower pizza', 'acai', 'sushi rice']

export function getCostTier(ingredients) {
  const joined = ingredients.join(' ').toLowerCase()
  for (const kw of premiumKeywords) {
    if (joined.includes(kw)) return '💰💰'
  }
  // Count ingredients — more ingredients = potentially pricier
  if (ingredients.length > 7) return '💰💰'
  return '💰'
}

export function getPrepTime(instructions) {
  const lower = instructions.toLowerCase()
  if (lower.includes('bake') || lower.includes('roast')) return '25 min'
  if (lower.includes('grill')) return '20 min'
  if (lower.includes('simmer')) return '30 min'
  if (lower.includes('overnight') || lower.includes('refrigerate')) return '10 min + chill'
  if (lower.includes('freeze')) return '10 min + freeze'
  return '15 min'
}

// Supermarket recommendations based on budget
export function getSupermarkets(weeklyBudget) {
  if (!weeklyBudget) return ['Aldi', 'Lidl']
  const budget = parseInt(weeklyBudget)
  if (budget < 60) return ['Aldi', 'Lidl']
  if (budget < 90) return ['Tesco', 'Aldi']
  if (budget < 130) return ['Tesco', 'Walmart']
  return ['Whole Foods', 'Waitrose']
}

export function getCostBreakdown(mealsByDay) {
  let total = 0
  let cheapCount = 0
  let midCount = 0
  let premiumCount = 0
  for (const day of mealsByDay) {
    for (const meal of day.meals) {
      const cost = meal.cost || getCostTier(meal.ingredients)
      if (cost === '💰') { cheapCount++; total += 2 }
      else if (cost === '💰💰') { midCount++; total += 4 }
      else { premiumCount++; total += 6 }
    }
  }
  return { total: total * mealSlots(mealsByDay.length), cheapCount, midCount, premiumCount }
}

function mealSlots(dayCount) {
  return 7 // rough average
}

// Motivation quotes
export const motivationalQuotes = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Food is fuel, not therapy. But sometimes it can be both.", author: "MacroMate" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "The scale is just a number. How you feel matters more.", author: "MacroMate" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Progress, not perfection. One meal at a time.", author: "MacroMate" },
  { text: "Eat to nourish your body, not to punish it.", author: "Unknown" },
  { text: "Every healthy meal is a vote for the person you want to become.", author: "MacroMate" },
  { text: "Strength does not come from the body. It comes from the will.", author: "Unknown" },
]

export default dessertsDb