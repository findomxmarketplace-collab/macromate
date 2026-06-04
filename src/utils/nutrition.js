/**
 * Science-based nutrition calculations using Mifflin-St Jeor equation
 */

function bmrMifflinStJeor(weightKg, heightCm, age, sex) {
  if (sex === 'Male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

export function calculateTargets({ age, sex, weight, weightUnit, goal }) {
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
    case 'Maintain Weight':
    default:
      targetCalories = tdee
      proteinG = Math.round(weightKg * 1.8)
      fatG = Math.round(targetCalories * 0.25 / 9)
      carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4)
      break
  }

  if (carbsG < 20) carbsG = 20
  if (fatG < 20) fatG = 20
  if (proteinG < 40) proteinG = 40

  return { targetCalories, proteinG, carbsG, fatG }
}

export function generateMeals(mealDb, preferences, targets) {
  const { dietType, dislikedFoods, mealsPerDay } = preferences
  const diet = mealDb[dietType] || mealDb['No restrictions']

  const disliked = dislikedFoods
    ? dislikedFoods.split(',').map(f => f.trim().toLowerCase())
    : []

  const mealsByDay = []
  const recentMeals = { breakfast: [], lunch: [], dinner: [], snack: [] }

  const mealSlots = ['breakfast', 'lunch', 'dinner']
  if (mealsPerDay >= 4) mealSlots.push('snack')
  if (mealsPerDay === 5) mealSlots.push('snack') // second snack

  for (let day = 0; day < 7; day++) {
    const dayPlan = { day: day + 1, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } }

    const slotsForDay = [...mealSlots]
    
    for (const slot of slotsForDay) {
      const options = diet[slot] || diet.breakfast
      
      const available = options.filter(m => {
        const hasDisliked = m.ingredients.some(ing =>
          disliked.some(d => ing.toLowerCase().includes(d))
        )
        if (hasDisliked) return false
        // Avoid same meal within last 5 days
        if (recentMeals[slot] && recentMeals[slot].includes(m.name)) return false
        return true
      })

      const pool = available.length > 0 ? available : options.filter(m => {
        return !m.ingredients.some(ing =>
          disliked.some(d => ing.toLowerCase().includes(d))
        )
      })

      const meal = pool[Math.floor(Math.random() * pool.length)]

      if (!recentMeals[slot]) recentMeals[slot] = []
      recentMeals[slot].push(meal.name)
      if (recentMeals[slot].length > 7) recentMeals[slot].shift()

      const calories = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)

      dayPlan.meals.push({ slot, ...meal, calories })
      dayPlan.totals.calories += calories
      dayPlan.totals.protein += meal.protein
      dayPlan.totals.carbs += meal.carbs
      dayPlan.totals.fat += meal.fat
    }

    dayPlan.totals.calories = Math.round(dayPlan.totals.calories)
    dayPlan.totals.protein = Math.round(dayPlan.totals.protein)
    dayPlan.totals.carbs = Math.round(dayPlan.totals.carbs)
    dayPlan.totals.fat = Math.round(dayPlan.totals.fat)

    mealsByDay.push(dayPlan)
  }

  // Grocery list
  const allMap = {}
  for (const day of mealsByDay) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const clean = ing.replace(/^\d+\s*\w*\s*/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase()
        if (clean && !allMap[clean]) {
          allMap[clean] = ing
        }
      }
    }
  }

  const groceryList = Object.values(allMap).sort()

  return { mealsByDay, targets, groceryList }
}