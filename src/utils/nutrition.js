/**
 * Science-based nutrition calculations using Mifflin-St Jeor equation
 */

function bmrMifflinStJeor(weightKg, heightCm, age, sex) {
  if (sex === 'Male') return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

export function calculateTargets({ age, sex, weight, weightUnit, goal, calAdjust = 0 }) {
  const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight
  const heightCm = sex === 'Male' ? 175 : 162
  const bmr = bmrMifflinStJeor(weightKg, heightCm, age, sex)
  const tdee = Math.round(bmr * 1.55)

  let targetCalories, proteinG, carbsG, fatG

  switch (goal) {
    case 'Lose Fat':
      targetCalories = Math.round(tdee - 400)
      proteinG = Math.round(weightKg * 2.0)
      fatG = Math.round(targetCalories * 0.25 / 9)
      carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4)
      break
    case 'Build Muscle':
      targetCalories = Math.round(tdee + 300)
      proteinG = Math.round(weightKg * 2.2)
      fatG = Math.round(targetCalories * 0.25 / 9)
      carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4)
      break
    default:
      targetCalories = tdee
      proteinG = Math.round(weightKg * 1.8)
      fatG = Math.round(targetCalories * 0.25 / 9)
      carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4)
      break
  }

  targetCalories = Math.round(targetCalories + calAdjust)
  fatG = Math.round(targetCalories * 0.25 / 9)
  carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4)
  if (carbsG < 20) carbsG = 20
  if (fatG < 20) fatG = 20
  if (proteinG < 40) proteinG = 40
  return { targetCalories, proteinG, carbsG, fatG }
}

// Freezer-friendly keywords
const freezerKeywords = ['soup', 'chili', 'stew', 'meatball', 'casserole', 'curry', 'marinara',
  'bolognese', 'stir fry', 'lasagna', 'meatloaf', 'chicken thigh', 'pulled', 'braise',
  'slow cook', 'enchilada', 'casserole', 'chowder', 'goulash', 'shepherd']

function isFreezerFriendly(meal) {
  if (meal.freezerFriendly === true) return true
  if (meal.freezerFriendly === false) return false
  const text = (meal.name + ' ' + meal.instructions).toLowerCase()
  return freezerKeywords.some(kw => text.includes(kw))
}

function pickRandom(arr, recentList, disliked, maxRecent = 5, preferFreezer = false) {
  let pool = arr.filter(m => {
    if (recentList.includes(m.name)) return false
    return !m.ingredients.some(ing => disliked.some(d => ing.toLowerCase().includes(d)))
  })

  if (preferFreezer) {
    const freezerMeals = pool.filter(m => isFreezerFriendly(m))
    if (freezerMeals.length > 0) pool = freezerMeals
  }

  if (pool.length === 0) {
    pool = arr.filter(m => !m.ingredients.some(ing => disliked.some(d => ing.toLowerCase().includes(d))))
    if (preferFreezer) {
      const freezerMeals = pool.filter(m => isFreezerFriendly(m))
      if (freezerMeals.length > 0) pool = freezerMeals
    }
  }
  if (pool.length === 0) return arr[Math.floor(Math.random() * arr.length)]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function generateMeals(mealDb, dessertsDb, preferences, targets, calAdjust = 0) {
  const { dietType, dislikedFoods, mealsPerDay, sweetTooth, allergies, freezerFriendly } = preferences
  const diet = mealDb[dietType] || mealDb['No restrictions']

  const disliked = [
    ...(dislikedFoods ? dislikedFoods.split(',').map(f => f.trim().toLowerCase()) : []),
    ...(allergies ? allergies.split(',').map(a => a.trim().toLowerCase()) : []),
  ]

  const mealsByDay = []
  const recentMeals = { breakfast: [], lunch: [], dinner: [], snack: [], dessert: [] }

  const mealSlots = ['breakfast', 'lunch', 'dinner']
  if (mealsPerDay >= 4) mealSlots.push('snack')
  if (mealsPerDay === 5) mealSlots.push('snack')
  const dessertOptions = dessertsDb[dietType] || dessertsDb['No restrictions']

  for (let day = 0; day < 7; day++) {
    const dayPlan = { day: day + 1, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } }

    for (const slot of mealSlots) {
      const options = diet[slot] || diet.breakfast
      if (!options || options.length === 0) continue
      const meal = pickRandom(options, recentMeals[slot], disliked, 5, freezerFriendly)
      recentMeals[slot].push(meal.name)
      if (recentMeals[slot].length > 7) recentMeals[slot].shift()
      const calories = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
      dayPlan.meals.push({ slot, ...meal, calories })
      dayPlan.totals.calories += calories
      dayPlan.totals.protein += meal.protein
      dayPlan.totals.carbs += meal.carbs
      dayPlan.totals.fat += meal.fat
    }

    if (sweetTooth && dessertOptions && dessertOptions.length > 0) {
      const dessert = pickRandom(dessertOptions, recentMeals.dessert, disliked, 5, freezerFriendly)
      recentMeals.dessert.push(dessert.name)
      if (recentMeals.dessert.length > 7) recentMeals.dessert.shift()
      const cal = Math.round(dessert.protein * 4 + dessert.carbs * 4 + dessert.fat * 9)
      dayPlan.meals.push({ slot: 'dessert', ...dessert, calories: cal })
      dayPlan.totals.calories += cal
      dayPlan.totals.protein += dessert.protein
      dayPlan.totals.carbs += dessert.carbs
      dayPlan.totals.fat += dessert.fat
    }

    dayPlan.totals.calories = Math.round(dayPlan.totals.calories)
    dayPlan.totals.protein = Math.round(dayPlan.totals.protein)
    dayPlan.totals.carbs = Math.round(dayPlan.totals.carbs)
    dayPlan.totals.fat = Math.round(dayPlan.totals.fat)
    mealsByDay.push(dayPlan)
  }

  // Grocery list (with quantity multiplication for "number of people")
  const multiplier = parseInt(preferences.people) || 1
  const allMap = {}
  for (const day of mealsByDay) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const clean = ing.replace(/^\d+\s*\w*\s*/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase()
        if (clean && !allMap[clean]) {
          // Multiply quantities for extra people
          const scaled = multiplier > 1 ? ing.replace(/^(\d+)\s*/, (_, num) => `${parseInt(num) * multiplier} `) : ing
          allMap[clean] = scaled
        }
      }
    }
  }

  const groceryList = Object.values(allMap).sort()

  return { mealsByDay, targets, groceryList }
}

export function swapMeal(mealDb, dessertsDb, dietType, slot, currentName, disliked, recentNames, preferFreezer) {
  const diet = mealDb[dietType] || mealDb['No restrictions']
  let options
  if (slot === 'dessert') {
    options = dessertsDb[dietType] || dessertsDb['No restrictions']
  } else {
    options = diet[slot] || diet.breakfast
  }
  if (!options) return null

  const available = options.filter(m => m.name !== currentName)
  const clean = available.filter(m => {
    if (recentNames.includes(m.name)) return false
    return !m.ingredients.some(ing => disliked.some(d => ing.toLowerCase().includes(d)))
  })
  let pool = clean.length > 0 ? clean : available
  
  if (preferFreezer && pool.length > 0) {
    const freezer = pool.filter(m => isFreezerFriendly(m))
    if (freezer.length > 0) pool = freezer
  }
  
  if (pool.length === 0) return options[Math.floor(Math.random() * options.length)]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function isFreezerFriendlyCheck(meal) {
  return isFreezerFriendly(meal)
}