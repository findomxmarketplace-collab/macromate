import React, { useState, useRef, useEffect, useCallback } from 'react'
import mealDb from './data/meals'
import dessertsDb, { motivationalQuotes, dailyNutritionTips, calculateNutritionScore, getSupermarkets, getDiscountLinks, getCostTier, getMealCost, COUNTRY_OPTIONS } from './data/desserts'
import { getAllergenKeywords, ALLERGEN_OPTIONS } from './data/allergens'
import { calculateTargets, generateMeals, swapMeal } from './utils/nutrition'
import { downloadPDF } from './components/MealPlanPDF'
import './App.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SLOT_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', dessert: '🍫' }
const SLOT_NAMES = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', dessert: 'Dessert' }

// Macro donut chart
function MacroChart({ protein, carbs, fat }) {
  const total = protein + carbs + fat
  if (total === 0) return null
  const pPct = (protein / total) * 100, cPct = (carbs / total) * 100, fPct = (fat / total) * 100
  const R = 36, circ = 2 * Math.PI * R
  const pLen = (pPct / 100) * circ, cLen = (cPct / 100) * circ, fLen = (fPct / 100) * circ
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={R} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="40" cy="40" r={R} fill="none" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${pLen} ${circ - pLen}`} strokeDashoffset={0} transform="rotate(-90 40 40)" />
      <circle cx="40" cy="40" r={R} fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray={`${cLen} ${circ - cLen}`} strokeDashoffset={-pLen} transform="rotate(-90 40 40)" />
      <circle cx="40" cy="40" r={R} fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray={`${fLen} ${circ - fLen}`} strokeDashoffset={-(pLen + cLen)} transform="rotate(-90 40 40)" />
    </svg>
  )
}

// Motivational quote rotator
function QuoteRotator() {
  const [idx, setIdx] = useState(Math.floor(Math.random() * motivationalQuotes.length))
  const [fade, setFade] = useState(true)
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(p => (p + 1) % motivationalQuotes.length); setFade(true) }, 400)
    }, 8000)
    return () => clearInterval(timer)
  }, [])
  const q = motivationalQuotes[idx]
  return (
    <div className="quote-card card" style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.4s' }}>
      <p className="quote-text">"{q.text}"</p>
      <p className="quote-author">— {q.author}</p>
    </div>
  )
}

function App() {
  const [page, setPage] = useState('landing')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    age: '', sex: 'Male', weight: '', weightUnit: 'lbs', goal: 'Lose Fat',
    dietType: 'No restrictions', dislikedFoods: '', allergies: '', allergens: [],
    mealsPerDay: '3', sweetTooth: false, freezerFriendly: false, weeklyBudget: '',
    people: '1', planDuration: '7', cookingMethods: [], pantryIngredients: '',
    snacker: false, country: 'USA',
  })
  const [peopleData, setPeopleData] = useState([])
  const [planData, setPlanData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [targets, setTargets] = useState(null)
  const [allPersonTargets, setAllPersonTargets] = useState([])
  const [calAdjust, setCalAdjust] = useState(0)
  const planRef = useRef(null)

  const updateForm = (k, v) => {
    if (k === 'people') {
      const count = parseInt(v)
      setForm(p => ({ ...p, people: v }))
      setPeopleData(prev => {
        const arr = [...prev]
        while (arr.length < count - 1) arr.push({ age: '', sex: 'Male', weight: '', goal: 'Lose Fat' })
        return arr.slice(0, count - 1)
      })
    } else if (k === 'allergens') {
      // Toggle allergen in the array
      setForm(p => {
        const current = [...(p.allergens || [])]
        const idx = current.indexOf(v)
        if (idx >= 0) current.splice(idx, 1)
        else current.push(v)
        return { ...p, allergens: current }
      })
    } else if (k === 'cookingMethods') {
      setForm(p => {
        const current = [...(p.cookingMethods || [])]
        const idx = current.indexOf(v)
        if (idx >= 0) current.splice(idx, 1)
        else current.push(v)
        return { ...p, cookingMethods: current }
      })
    } else {
      setForm(p => ({ ...p, [k]: v }))
    }
  }

  // Load saved details from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('macromate_saved_form')
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(prev => ({ ...prev, ...parsed }))
      }
    } catch (e) {}
  }, [])
  const updatePerson = (idx, field, val) => {
    setPeopleData(prev => {
      const arr = [...prev]
      if (!arr[idx]) arr[idx] = { age: '', sex: 'Male', weight: '' }
      arr[idx] = { ...arr[idx], [field]: val }
      return arr
    })
  }

  const handleGenerate = useCallback(() => {
    setGenerating(true)
    
    // Expand allergen checkboxes into keyword string
    const allergenKeywords = getAllergenKeywords(form.allergens || [])
    const allergyStr = [...new Set([...(form.allergies || '').split(',').map(s => s.trim()).filter(Boolean), ...allergenKeywords])].join(',')
    
    // Save form to localStorage for next visit
    try {
      localStorage.setItem('macromate_saved_form', JSON.stringify(form))
    } catch (e) {}
    
    setTimeout(() => {
      const prefs = {
        dietType: form.dietType, dislikedFoods: form.dislikedFoods,
        allergies: allergyStr, mealsPerDay: parseInt(form.mealsPerDay),
        sweetTooth: form.sweetTooth, freezerFriendly: form.freezerFriendly,
        snacker: form.snacker,
        weeklyBudget: form.weeklyBudget, people: form.people,
        planDuration: parseInt(form.planDuration) || 7, cookingMethods: form.cookingMethods || [], pantryIngredients: form.pantryIngredients,
      }
      
      // Calculate targets for each person separately (not averaged)
      const personList = [
        { name: 'You', age: parseInt(form.age), sex: form.sex, weight: parseFloat(form.weight), weightUnit: form.weightUnit, goal: form.goal },
        ...peopleData.filter(p => p.age && p.weight).map((p, i) => {
          const pd = peopleData[i] || {}
          return {
            name: pd.goal === form.goal ? `Person ${i + 2}` : `Person ${i + 2} (${pd.goal || form.goal})`,
            age: parseInt(p.age), sex: p.sex, weight: parseFloat(p.weight),
            weightUnit: form.weightUnit, goal: pd.goal || form.goal,
          }
        })
      ]
      
      const calcTargets = personList.map(p => {
        const t = calculateTargets({ age: p.age, sex: p.sex, weight: p.weight, weightUnit: p.weightUnit, goal: p.goal, calAdjust: 0 })
        return { name: p.name, ...t }
      })
      
      // Use primary person's targets for meal generation (meals serve all)
      const primaryT = calcTargets[0]
      setAllPersonTargets(calcTargets)
      
      // Generate meals using primary person's targets (scaled for people count)
      const result = generateMeals(mealDb, dessertsDb, prefs, primaryT, 0)
      setTargets(primaryT)
      setPlanData(result)
      setCalAdjust(0)
      setGenerating(false)
      setPage('results')
    }, 1200)
  }, [form, peopleData])

  const handleCalorieAdjust = (delta) => {
    const na = calAdjust + delta
    setCalAdjust(na)
    const prefs = {
      dietType: form.dietType, dislikedFoods: form.dislikedFoods,
      allergies: form.allergies, mealsPerDay: parseInt(form.mealsPerDay),
      sweetTooth: form.sweetTooth, freezerFriendly: form.freezerFriendly,
      weeklyBudget: form.weeklyBudget, people: form.people,
      planDuration: parseInt(form.planDuration) || 7, cookingMethods: form.cookingMethods || [], pantryIngredients: form.pantryIngredients,
    }
    
    // Recalculate with adjustment using same average approach
    const t = calculateTargets({
      age: parseInt(form.age), sex: form.sex, weight: parseFloat(form.weight),
      weightUnit: form.weightUnit, goal: form.goal, calAdjust: na,
    })
    setTargets(t)
    setPlanData(generateMeals(mealDb, dessertsDb, prefs, t, na))
  }

  const handleSwapMeal = (dayIdx, mealIdx) => {
    if (!planData) return
    const day = planData.mealsByDay[dayIdx]
    const oldMeal = day.meals[mealIdx]
    const disliked = [
      ...(form.dislikedFoods ? form.dislikedFoods.split(',').map(f => f.trim().toLowerCase()) : []),
      ...(form.allergies ? form.allergies.split(',').map(a => a.trim().toLowerCase()) : []),
    ]
    const recentNames = day.meals.map(m => m.name)
    const newMeal = swapMeal(mealDb, dessertsDb, form.dietType, oldMeal.slot, oldMeal.name, disliked, recentNames, form.freezerFriendly)
    if (!newMeal) return
    const calories = Math.round(newMeal.protein * 4 + newMeal.carbs * 4 + newMeal.fat * 9)
    const newDay = { ...day, meals: day.meals.map((m, i) => i === mealIdx ? { slot: oldMeal.slot, ...newMeal, calories } : m) }
    newDay.totals = newDay.meals.reduce((a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    const newMealsByDay = planData.mealsByDay.map((d, i) => i === dayIdx ? newDay : d)
    const allMap = {}
    for (const d of newMealsByDay) for (const m of d.meals) for (const ing of m.ingredients) {
      const clean = ing.replace(/^\d+\s*\w*\s*/g, '').replace(/\(.*?\)/g, '').trim().toLowerCase()
      if (clean && !allMap[clean]) allMap[clean] = ing
    }
    setPlanData({ ...planData, mealsByDay: newMealsByDay, groceryList: Object.values(allMap).sort() })
  }

  const handleDownloadPDF = () => {
    if (planData && targets) {
      downloadPDF(planData, targets, form)
    }
  }
  const canProceed = form.age && form.weight

  // ===== LANDING (Open Access) =====
  if (page === 'landing') {
    return (
      <div className="landing">
        <header className="landing-header">
          <div className="container">
            <div className="logo">MacroMate</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>Not for Resale</span>
          </div>
        </header>
        <section className="hero">
          <div className="container">
            <div className="hero-badge badge badge-green">AI-Powered Meal Planning</div>
            <h1 className="hero-title">Your Personal AI Meal Plan — <span>Ready in 60 Seconds</span></h1>
            <p className="hero-subtitle">
              Science-based 7-day meal plans tailored to your body, goals, diet, and budget.
              Includes desserts, meal swapping, progress tracking, grocery lists, and PDF export.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="price-tag">
                <span className="price-amount">$4.99</span>
                <span className="price-label">one-time · unlimited use</span>
              </div>
              <div className="license-entry" style={{ maxWidth: '360px', width: '100%' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: '0.5rem' }}>Enter Your License Key</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input id="license-input" type="text" placeholder="e.g. MACRO-20270604-0501"
                    style={{ flex: 1, fontSize: '0.85rem', fontFamily: 'monospace', textTransform: 'uppercase' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLicenseSubmit(e.target.value) }} />
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => {
                      const input = document.getElementById('license-input')
                      handleLicenseSubmit(input.value)
                    }}>Unlock</button>
                </div>
                <div id="license-msg" style={{ fontSize: '0.8rem', marginTop: '0.5rem', minHeight: '1.2rem' }}>{licenseMsg}</div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                💳 Purchased through Whop? Your license key is in your confirmation email.
              </p>
            </div>

            {/* Free emergency meal teaser */}
            <div className="emergency-teaser card" style={{ maxWidth: '500px', margin: '0 auto 3rem', padding: '1.5rem', textAlign: 'center', background: '#fffbeb', border: '1px solid #fde68a' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>🔥 Emergency Meal</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>Got random ingredients? Type them in and get a recipe idea instantly — free, no purchase needed.</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input id="emergency-input" placeholder="e.g. chicken, rice, tomato" style={{ flex: 1, fontSize: '0.9rem' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') {
                    const val = e.target.value
                    if (!val) return
                    const ings = val.split(',').map(i => i.trim()).filter(Boolean)
                    if (ings.length < 2) return
                    const found = Object.values(mealDb).flatMap(d => Object.values(d).flat()).filter(m =>
                      m.ingredients.some(i => ings.some(ing => i.toLowerCase().includes(ing.toLowerCase())))
                    )
                    const meal = found.length > 0 ? found[Math.floor(Math.random() * found.length)] : null
                    const result = document.getElementById('emergency-result')
                    if (meal && result) {
                      const cal = Math.round(meal.protein * 4 + meal.carbs * 4 + meal.fat * 9)
                      result.innerHTML = `<div style="background:var(--green-50);padding:0.75rem;border-radius:8px;margin-top:0.75rem"><strong style="font-size:1rem">${meal.name}</strong><br><span style="font-size:0.8rem;color:var(--gray-500)">${cal} cal · P${meal.protein}g C${meal.carbs}g F${meal.fat}g</span><br><span style="font-size:0.8rem;color:var(--gray-500)">${meal.instructions.substring(0, 80)}...</span><br><span style="font-size:0.75rem;color:var(--gray-400);margin-top:0.5rem;display:block">✨ Want 7 days of this? Get the full plan below 👇</span></div>`
                    } else if (result) {
                      result.innerHTML = `<div style="background:#fef2f2;padding:0.75rem;border-radius:8px;margin-top:0.75rem;font-size:0.85rem;color:var(--gray-500)">No exact match found — try different ingredients or <a href="#" onclick="localStorage.setItem('macromate_purchased','true');window.location.reload()" style="color:var(--green-600)">unlock full access</a> for 400+ curated meals!</div>`
                    }
                  }}}
                />
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    const input = document.getElementById('emergency-input')
                    const event = new KeyboardEvent('keydown', { key: 'Enter' })
                    input.dispatchEvent(event)
                  }}>Generate</button>
              </div>
              <div id="emergency-result"></div>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray-300)', marginTop: '0.5rem' }}>Free sample — see what MacroMate can do!</p>
            </div>

            <div className="benefits">
              <div className="benefit-card">
                <div className="benefit-icon">🎯</div>
                <h3>Tailored to Your Goal</h3>
                <p>Lose fat, build muscle, or maintain — calibrated using science-based Mifflin-St Jeor formulas.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🥗</div>
                <h3>6 Diet Types + Desserts</h3>
                <p>Keto, vegan, paleo, gluten-free, vegetarian, or no restrictions. Sweet tooth? We've got healthy desserts.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📊</div>
                <h3>Interactive & Flexible</h3>
                <p>Swap meals, adjust calories, set a budget, freezer-friendly options, shop smart, track weight progress.</p>
              </div>
            </div>
          </div>
                    </section>

                    {/* Sample meal preview on paywall page */}
                    <section className="sample-preview">
                      <div className="container">
                        <h2>👀 See What You'll Get — A Sample Day</h2>
                        <p className="form-desc" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 2rem' }}>
                          Here's one day from a typical 7-day personalized meal plan. Your actual plan will be tailored to your age, weight, goal, diet, and preferences.
                        </p>
                        <div className="sample-day-card card">
                          <div className="sample-day-header">
                            <span className="day-name">Sample Day</span>
                            <div className="day-totals">
                              <span className="day-cal">~1,950 cal</span>
                              <span className="day-macro">P 140g</span>
                              <span className="day-macro">C 220g</span>
                              <span className="day-macro">F 55g</span>
                            </div>
                          </div>
                          <div className="sample-meals">
                            <div className="sample-meal">
                              <span className="sample-slot">🌅 Breakfast</span>
                              <strong>Scrambled Eggs with Avocado Toast</strong>
                              <span className="sample-macros">420 cal · P24g C34g F26g</span>
                            </div>
                            <div className="sample-meal">
                              <span className="sample-slot">☀️ Lunch</span>
                              <strong>Grilled Chicken Salad</strong>
                              <span className="sample-macros">490 cal · P42g C12g F18g</span>
                            </div>
                            <div className="sample-meal">
                              <span className="sample-slot">🌙 Dinner</span>
                              <strong>Lemon Herb Chicken with Quinoa & Broccoli</strong>
                              <span className="sample-macros">540 cal · P40g C34g F20g</span>
                            </div>
                            <div className="sample-meal">
                              <span className="sample-slot">🍎 Snack</span>
                              <strong>Greek Yogurt & Berries</strong>
                              <span className="sample-macros">180 cal · P16g C22g F4g</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>🔑 Enter your license key above to unlock the full plan</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>Purchased through Whop? Your key was sent after purchase.</p>
                        </div>
                      </div>
                    </section>
                    <section className="how-it-works">
                    <div className="container">
                      <h2>What You Get</h2>
            <div className="feature-checklist">
              <div className="feature-item">✅ Personalized 7-day meal plan with exact macros</div>
              <div className="feature-item">✅ Breakfast, lunch, dinner + snacks & desserts</div>
              <div className="feature-item">✅ Grocery list with quantity scaling (cook for 1–10 people)</div>
              <div className="feature-item">✅ Swap any meal with one click</div>
              <div className="feature-item">✅ Calorie adjuster — fine-tune up or down</div>
              <div className="feature-item">✅ Freezer-friendly meal preference toggle</div>
              <div className="feature-item">✅ Weekly budget + supermarket suggestions</div>
              <div className="feature-item">✅ Allergies & disliked foods respected</div>
              <div className="feature-item">✅ Weight progress tracker with auto-recalculation</div>
              <div className="feature-item">✅ PDF download (digital cookbook)</div>
              <div className="feature-item">✅ Regenerate new plans as you progress</div>
              <div className="feature-item">✅ 🔥 Emergency Meal Generator — type any ingredients, get instant recipes</div>
              <div className="feature-item">✅ 🥘 Leftover repurposing ideas to reduce food waste</div>
              <div className="feature-item">✅ One purchase = lifetime access</div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--gray-700)' }}>🔑 Enter your license key at the top of this page to unlock</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>No refunds — all sales final · One purchase = unlimited access</p>
            </div>
          </div>
        </section>
        <footer className="landing-footer">
          <div className="container"><p>MacroMate — Not for Resale. © MacroMate</p></div>
        </footer>
      </div>
    )
  }

  // ===== FORM =====
  if (page === 'form') {
    return (
      <div className="form-page">
        <header className="form-header">
          <div className="container">
            <div className="logo" onClick={() => setPage('landing')} style={{ cursor: 'pointer' }}>MacroMate</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>Not for Resale</span>
          </div>
        </header>
        <div className="container form-container">
          <div className="form-card card">
            <div className="form-progress">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}><div className="progress-circle">1</div><span>Profile</span></div>
              <div className="progress-line" />
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}><div className="progress-circle">2</div><span>Preferences</span></div>
              <div className="progress-line" />
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}><div className="progress-circle">3</div><span>Generate</span></div>
            </div>

            {step === 1 && (
              <div className="form-step fade-in-up">
                <h2>Tell us about yourself</h2>
                <p className="form-desc">We'll use this to calculate your perfect macros.</p>
                <div className="input-group"><label>Age</label><input type="number" placeholder="e.g. 28" value={form.age} onChange={e => updateForm('age', e.target.value)} min="10" max="120" /></div>
                <div className="input-group">
                  <label>Biological Sex</label>
                  <div className="radio-group">
                    <label><input type="radio" name="sex" value="Male" checked={form.sex === 'Male'} onChange={e => updateForm('sex', e.target.value)} /><span>Male</span></label>
                    <label><input type="radio" name="sex" value="Female" checked={form.sex === 'Female'} onChange={e => updateForm('sex', e.target.value)} /><span>Female</span></label>
                  </div>
                </div>
                <div className="input-group">
                  <label>Current Weight</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input type="number" placeholder="e.g. 175" value={form.weight} onChange={e => updateForm('weight', e.target.value)} style={{ flex: 1 }} min="30" max="700" />
                    <select value={form.weightUnit} onChange={e => updateForm('weightUnit', e.target.value)} style={{ width: '100px' }}><option value="lbs">lbs</option><option value="kg">kg</option></select>
                  </div>
                </div>
                <div className="input-group">
                  <label>Your Goal</label>
                  <select value={form.goal} onChange={e => updateForm('goal', e.target.value)}>
                    <option value="Lose Fat">Lose Fat</option>
                    <option value="Build Muscle">Build Muscle</option>
                    <option value="Maintain Weight">Maintain Weight</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Number of People</label>
                  <select value={form.people} onChange={e => updateForm('people', e.target.value)}>
                    <option value="1">Just me (1 person)</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5">5 people</option>
                    <option value="6">6+ people</option>
                  </select>
                  <span className="hint">MacroMate will calculate averages and scale ingredients for everyone.</span>
                </div>
                {parseInt(form.people) > 1 && peopleData.map((person, idx) => (
                  <div key={idx} className="person-card" style={{ background: 'var(--green-50)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--green-200)' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--green-800)' }}>Person {idx + 2}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Age</label>
                        <input type="number" placeholder="e.g. 28" value={person.age || ''} onChange={e => updatePerson(idx, 'age', e.target.value)} min="10" max="120" style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: '1 1 120px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Sex</label>
                        <select value={person.sex || 'Male'} onChange={e => updatePerson(idx, 'sex', e.target.value)} style={{ width: '100%' }}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div style={{ flex: '1 1 100px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Weight</label>
                        <input type="number" placeholder="e.g. 150" value={person.weight || ''} onChange={e => updatePerson(idx, 'weight', e.target.value)} min="30" max="700" style={{ width: '100%' }} />
                      </div>
                      <div style={{ flex: '1 1 140px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Goal</label>
                        <select value={person.goal || 'Lose Fat'} onChange={e => updatePerson(idx, 'goal', e.target.value)} style={{ width: '100%' }}>
                          <option value="Lose Fat">Lose Fat</option>
                          <option value="Build Muscle">Build Muscle</option>
                          <option value="Maintain Weight">Maintain Weight</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="form-nav"><button className="btn btn-primary btn-block btn-lg" disabled={!canProceed} onClick={() => setStep(2)}>Next Step →</button></div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step fade-in-up">
                <h2>What are your preferences?</h2>
                <p className="form-desc">We'll personalize everything around these choices.</p>
                <div className="input-group">
                  <label>Plan Duration</label>
                  <select value={form.planDuration} onChange={e => updateForm('planDuration', e.target.value)}>
                    <option value="7">7 days (weekly)</option>
                    <option value="30">30 days (monthly)</option>
                  </select>
                  <span className="hint">Monthly plans include more variety with 30 unique days of meals.</span>
                </div>
                <div className="input-group">
                  <label>Fitness Goal</label>
                  <select value={form.goal} onChange={e => updateForm('goal', e.target.value)}>
                    <option value="Lose Fat">Lose Fat</option>
                    <option value="Build Muscle">Build Muscle</option>
                    <option value="Maintain Weight">Maintain Weight</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Diet Type</label>
                  <select value={form.dietType} onChange={e => updateForm('dietType', e.target.value)}>
                    <option value="No restrictions">No restrictions</option>
                    <option value="Keto">Keto</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Paleo">Paleo</option>
                    <option value="Gluten-Free">Gluten-Free</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Cooking Methods (pick any that apply)</label>
                  <div className="cooking-checkboxes">
                    {['Stove-Top (Quick)', 'Oven-Baked', 'BBQ & Grilling', 'One-Pan / Sheet Pan', 'Slow Cooker / Casserole', 'No-Cook / Assembly'].map(method => (
                      <label key={method} className="cooking-checkbox-label" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.4rem 0.75rem', border: `2px solid ${(form.cookingMethods || []).includes(method) ? 'var(--green-500)' : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem',
                        background: (form.cookingMethods || []).includes(method) ? 'var(--green-50)' : '#fff',
                        transition: 'all 0.15s', marginBottom: '0.35rem'
                      }}>
                        <input type="checkbox" checked={(form.cookingMethods || []).includes(method)}
                          onChange={() => updateForm('cookingMethods', method)}
                          style={{ accentColor: 'var(--green-600)', width: 'auto' }} />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>
                  <span className="hint" style={{ marginTop: '0.5rem', display: 'block' }}>Pick none for all methods, or select your favorites for targeted meal plans.</span>
                </div>
                <div className="input-group">
                  <label>Meals Per Day</label>
                  <select value={form.mealsPerDay} onChange={e => updateForm('mealsPerDay', e.target.value)}>
                    <option value="2">2 meals</option>
                    <option value="3">3 meals</option>
                    <option value="4">4 meals (includes snack)</option>
                    <option value="5">5 meals (includes 2 snacks)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="toggle-label"><input type="checkbox" checked={form.sweetTooth} onChange={e => updateForm('sweetTooth', e.target.checked)} style={{ width: 'auto', marginRight: '0.5rem', accentColor: 'var(--green-600)' }} /> 🍫 I have a sweet tooth — include healthy desserts!</label>
                </div>
                <div className="input-group">
                  <label className="toggle-label"><input type="checkbox" checked={form.freezerFriendly} onChange={e => updateForm('freezerFriendly', e.target.checked)} style={{ width: 'auto', marginRight: '0.5rem', accentColor: 'var(--green-600)' }} /> 🧊 Prefer freezer-friendly meals (batch cook & freeze)</label>
                </div>
                <div className="input-group">
                  <label className="toggle-label"><input type="checkbox" checked={form.snacker} onChange={e => updateForm('snacker', e.target.checked)} style={{ width: 'auto', marginRight: '0.5rem', accentColor: 'var(--green-600)' }} /> 🍿 I'm a snacker — add portion-controlled snacks each day</label>
                </div>
                <div className="input-group"><label>Foods You Dislike (optional)</label><input type="text" placeholder="e.g. broccoli, salmon" value={form.dislikedFoods} onChange={e => updateForm('dislikedFoods', e.target.value)} /><span className="hint">Separate with commas.</span></div>
                <div className="input-group">
                  <label>Allergies (check all that apply)</label>
                  <div className="allergen-checkboxes">
                    {ALLERGEN_OPTIONS.map(a => (
                      <label key={a} className="allergen-checkbox-label" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.7rem', border: `2px solid ${(form.allergens || []).includes(a) ? 'var(--red-500)' : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem',
                        background: (form.allergens || []).includes(a) ? '#fef2f2' : '#fff',
                        transition: 'all 0.15s', marginBottom: '0.35rem'
                      }}>
                        <input type="checkbox" checked={(form.allergens || []).includes(a)}
                          onChange={() => updateForm('allergens', a)}
                          style={{ accentColor: '#ef4444', width: 'auto' }} />
                        <span>{a}</span>
                      </label>
                    ))}
                  </div>
                  <span className="hint" style={{ marginTop: '0.5rem', display: 'block' }}>Checked allergies will be strictly excluded from all meals.</span>
                </div>
                <div className="input-group"><label>🥩 What's in Your Pantry? (optional)</label><input type="text" placeholder="e.g. chicken breast, eggs, spinach, rice" value={form.pantryIngredients || ''} onChange={e => updateForm('pantryIngredients', e.target.value)} /><span className="hint">Tell us what ingredients you already have — we'll prioritize meals that use them and reduce food waste!</span></div>
                <div className="input-group">
                  <label>Weekly Grocery Budget (optional)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><span>$</span><input type="number" placeholder="e.g. 80" value={form.weeklyBudget} onChange={e => updateForm('weeklyBudget', e.target.value)} min="20" max="300" /></div>
                  <span className="hint">We'll suggest the most affordable supermarkets.</span>
                </div>
                <div className="input-group">
                  <label>Country</label>
                  <select value={form.country} onChange={e => updateForm('country', e.target.value)}>
                    {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="hint">We'll tailor supermarket suggestions and discount links to your location.</span>
                </div>
                <div className="form-nav" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep(3)}>Review →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step fade-in-up">
                <h2>Ready to generate your plan</h2>
                <p className="form-desc">Here's a quick summary — all good?</p>
                <div className="summary-card">
                  <div className="summary-row"><span>Age / Sex</span><strong>{form.age} · {form.sex}</strong></div>
                  <div className="summary-row"><span>Weight</span><strong>{form.weight} {form.weightUnit}</strong></div>
                  <div className="summary-row"><span>People</span><strong>{form.people}</strong></div>
                  <div className="summary-row"><span>Goal</span><strong>{form.goal}</strong></div>
                  <div className="summary-row"><span>Diet</span><strong>{form.dietType}</strong></div>
                  <div className="summary-row"><span>Meals / Day</span><strong>{form.mealsPerDay}</strong></div>
                  {form.sweetTooth && <div className="summary-row"><span>Desserts</span><strong>✅ Yes</strong></div>}
                  {form.freezerFriendly && <div className="summary-row"><span>Freezer-Friendly</span><strong>✅ Yes</strong></div>}
                  {form.dislikedFoods && <div className="summary-row"><span>Dislikes</span><strong>{form.dislikedFoods}</strong></div>}
                  {form.allergies && <div className="summary-row"><span>Allergies</span><strong>{form.allergies}</strong></div>}
                  {form.weeklyBudget && <div className="summary-row"><span>Budget</span><strong>${form.weeklyBudget}/wk</strong></div>}
                </div>
                <div className="form-nav" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)} style={{ flex: 1 }}>← Edit</button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={handleGenerate} disabled={generating}>
                    {generating ? <><span className="spinner" /> Generating...</> : '✨ Generate My Meal Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== RESULTS =====
  if (page === 'results' && planData) {
    const { mealsByDay, groceryList } = planData
    const supermarkets = getSupermarkets(form.weeklyBudget, form.country)
    const discountLinks = getDiscountLinks(form.country)
    const disliked = [
      ...(form.dislikedFoods ? form.dislikedFoods.split(',').map(f => f.trim().toLowerCase()) : []),
      ...(form.allergies ? form.allergies.split(',').map(a => a.trim().toLowerCase()) : []),
    ]

    return (
      <div className="results-page">
        <header className="results-header">
          <div className="container">
            <div className="logo" onClick={() => setPage('landing')} style={{ cursor: 'pointer' }}>MacroMate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>Not for Resale</span>
              <button className="btn btn-primary" onClick={handleDownloadPDF}>📄 Download PDF</button>
            </div>
          </div>
        </header>
        <div className="container results-container" ref={planRef}>
          <QuoteRotator />

          <div className="targets-card card fade-in-up">
            <h2>🎯 Daily Nutrition Targets</h2>
            {allPersonTargets.length > 1 ? (
              <div className="multi-person-targets">
                {allPersonTargets.map((pt, i) => (
                  <div key={i} className="person-target-block">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-800)', marginBottom: '0.5rem' }}>{pt.name}</h4>
                    <div className="targets-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="target-item"><div className="target-value">{pt.targetCalories}</div><div className="target-label">Calories</div></div>
                      <div className="target-item"><div className="target-value">{pt.proteinG}g</div><div className="target-label">Protein</div></div>
                      <div className="target-item"><div className="target-value">{pt.carbsG}g</div><div className="target-label">Carbs</div></div>
                      <div className="target-item"><div className="target-value">{pt.fatG}g</div><div className="target-label">Fat</div></div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
                  🍽️ Meals below are designed to serve {form.people} people. Each person eats the same meals but portion sizes can be adjusted to match their individual targets.
                </p>
              </div>
            ) : (
              <div className="targets-grid">
                <div className="target-item"><div className="target-value">{targets.targetCalories}</div><div className="target-label">Calories</div></div>
                <div className="target-item"><div className="target-value">{targets.proteinG}g</div><div className="target-label">Protein</div></div>
                <div className="target-item"><div className="target-value">{targets.carbsG}g</div><div className="target-label">Carbs</div></div>
                <div className="target-item"><div className="target-value">{targets.fatG}g</div><div className="target-label">Fat</div></div>
              </div>
            )}
            {form.freezerFriendly && <p style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 500 }}>���� Freezer-friendly mode active — meals selected for batch cooking & freezing</p>}
            <div className="macro-chart-container">
              <MacroChart protein={targets.proteinG} carbs={targets.carbsG} fat={targets.fatG} />
              <div className="macro-legend">
                <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#22c55e' }} /> Protein {targets.proteinG}g</div>
                <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#3b82f6' }} /> Carbs {targets.carbsG}g</div>
                <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#f59e0b' }} /> Fat {targets.fatG}g</div>
              </div>
            </div>
            <div className="cal-adjuster">
              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>Adjust Calories:</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => handleCalorieAdjust(-100)} disabled={calAdjust <= -300}>−100</button>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '60px', textAlign: 'center' }}>{calAdjust > 0 ? '+' : ''}{calAdjust}</span>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => handleCalorieAdjust(100)} disabled={calAdjust >= 300}>+100</button>
              </div>
            </div>
            {form.weeklyBudget && (
              <div className="supermarket-card card">
                <h3>🛒 Best Supermarkets for ${form.weeklyBudget}/week × {form.people}</h3>
                <div className="supermarket-grid">
                  {supermarkets.map((s, i) => (
                    <div key={i} className="supermarket-item">
                      <span className="supermarket-name">{s}</span>
                      <span className="supermarket-badge">{i === 0 ? '⭐ Best Value' : '✅ Great Choice'}</span>
                    </div>
                  ))}
                </div>
                <p className="supermarket-note">Based on your weekly budget. Prices vary by location.</p>
              </div>
            )}
          </div>

          <h2 className="section-title">{parseInt(form.people) > 1 ? `Your ${form.people}-Person Meal Plan` : 'Your 7-Day Meal Plan'}</h2>
          <p className="section-subtitle">Click any meal name to swap it 🔄</p>

          {mealsByDay.map((day, idx) => (
            <div key={idx} className="day-card card fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="day-header">
                <div><span className="day-name">{DAYS[idx]}</span><span className="day-badge">Day {day.day}</span></div>
                <div className="day-totals">
                  <span className="day-cal">{day.totals.calories} cal</span>
                  <span className="day-macro">P {day.totals.protein}g</span>
                  <span className="day-macro">C {day.totals.carbs}g</span>
                  <span className="day-macro">F {day.totals.fat}g</span>
                </div>
              </div>
              <div className="day-meals">
                {day.meals.map((meal, mIdx) => (
                  <div key={mIdx} className="meal-item">
                    <div className="meal-header-row">
                      <div className="meal-slot-badge">{SLOT_ICONS[meal.slot] || '🍽️'} {SLOT_NAMES[meal.slot] || meal.slot}</div>
                      <div className="meal-tags">
                        <span className="cost-badge">{meal.cost || getCostTier(meal.ingredients)}</span>
                        <span className="cost-amount" style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500 }}>${getMealCost(meal.cost || getCostTier(meal.ingredients), form.country).toFixed(2)}</span>
                        <span className="prep-badge">⏱️ {meal.prepTime || '15 min'}</span>
                      </div>
                    </div>
                    <h4 className="meal-name" style={{ cursor: 'pointer' }} onClick={() => handleSwapMeal(idx, mIdx)} title="Click to swap">{meal.name} 🔄</h4>
                    <div className="meal-macros">
                      <span>{meal.calories} cal</span><span>P {meal.protein}g</span><span>C {meal.carbs}g</span><span>F {meal.fat}g</span>
                    </div>
                    <details className="meal-details">
                      <summary>Ingredients & Prep</summary>
                      <div className="meal-ingredients">
                        <strong>Ingredients{parseInt(form.people) > 1 ? ` (×${form.people} for ${form.people} people)` : ''}:</strong>
                        <ul>{meal.ingredients.map((ing, i) => <li key={i}>{parseInt(form.people) > 1 ? ing.replace(/^(\d+)\s*/, (_, n) => `${parseInt(n) * parseInt(form.people)} `) : ing}</li>)}</ul>
                      </div>
                      <div className="meal-instructions"><strong>Quick Prep:</strong><p>{meal.instructions}</p></div>
                    </details>
                  </div>
                ))}
              </div>
              <div className="day-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', borderTop: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="day-micro-chart"><MacroChart protein={day.totals.protein} carbs={day.totals.carbs} fat={day.totals.fat} /></div>
                {(() => { const score = calculateNutritionScore(day.totals, targets); return (
                  <div className="nutrition-score" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: score.color }}>{score.grade}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{score.label}</span>
                  </div>
                )})()}
              </div>
              {(() => { const tipIdx = (idx + planData.mealsByDay.length) % dailyNutritionTips.length; return (
                <div className="daily-tip" style={{ padding: '0.5rem 1.5rem 0.75rem', borderTop: '1px solid var(--gray-100)', fontSize: '0.8rem', color: 'var(--green-700)', background: 'var(--green-50)' }}>
                  💡 {dailyNutritionTips[tipIdx]}
                </div>
              )})()}
            </div>
          ))}

          <div className="grocery-card card fade-in-up">
            <h2>🛒 {parseInt(form.people) > 1 ? `${form.people}-Person` : ''} Grocery List</h2>
            <p className="grocery-note">{parseInt(form.people) > 1 ? `Quantities are scaled for ${form.people} people. ` : ''}Check off as you go!</p>
            <div className="grocery-grid">
              {groceryList.map((item, idx) => (
                <div key={idx} className="grocery-item">
                  <input type="checkbox" id={`grocery-${idx}`} />
                  <label htmlFor={`grocery-${idx}`}>{item}</label>
                </div>
              ))}
            </div>
          </div>

          {form.pantryIngredients && (
            <div className="pantry-note card fade-in-up" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fefce8', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🥩</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}><strong>Pantry Mode active:</strong> Meals prioritized to use ingredients you already have — {form.pantryIngredients}</span>
            </div>
          )}

          {/* Meal Prep Day Suggestion */}
          <div className="prep-card card fade-in-up">
            <h2>📦 Meal Prep Day — Sunday</h2>
            <p className="grocery-note">Set aside 1-2 hours on Sunday to prep for the week. Here's what to batch-cook:</p>
            <div className="prep-tips">
              <div className="prep-tip">
                <span className="prep-icon">🥘</span>
                <div><strong>Cook grains & proteins</strong><p className="prep-note">Cook all rice/quinoa and grill/bake all chicken, beef, or tofu for the week. Store in separate containers.</p></div>
              </div>
              <div className="prep-tip">
                <span className="prep-icon">🥦</span>
                <div><strong>Wash & chop veggies</strong><p className="prep-note">Wash, chop, and store all vegetables in airtight containers. They'll stay fresh and ready to cook.</p></div>
              </div>
              <div className="prep-tip">
                <span className="prep-icon">🧊</span>
                <div><strong>Portion & freeze</strong><p className="prep-note">Portion out meals that freeze well (soups, chilis, casseroles). Label and freeze for busy days.</p></div>
              </div>
              <div className="prep-tip">
                <span className="prep-icon">🥗</span>
                <div><strong>Prepare sauces & dressings</strong><p className="prep-note">Mix dressings, marinades, and sauces for the week. Store in jars in the fridge.</p></div>
              </div>
            </div>
          </div>

          <div className="discount-card card fade-in-up">
            <h2>💰 Save on Your Groceries {form.country !== 'USA' ? `(${form.country})` : ''}</h2>
            <p className="grocery-note">Money-saving resources tailored to {form.country}.</p>
            <div className="discount-grid">
              {discountLinks.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="discount-item">
                  <span className="discount-icon">{d.icon}</span>
                  <div><strong>{d.title}</strong><p className="discount-note">{d.desc}</p></div>
                </a>
              ))}
            </div>
          </div>

          <div className="results-actions fade-in-up">
            <button className="btn btn-secondary btn-lg" onClick={() => { setPage('form'); setStep(1) }}>← New Plan</button>
            <button className="btn btn-primary btn-lg" onClick={handleDownloadPDF}>📄 Download PDF</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default App