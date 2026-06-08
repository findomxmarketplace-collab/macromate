import React, { useState, useRef, useEffect, useCallback } from 'react'
import mealDb from './data/meals'
import dessertsDb, { motivationalQuotes, getSupermarkets, getCostTier } from './data/desserts'
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
  const [purchased, setPurchased] = useState(() => localStorage.getItem('macromate_purchased') === 'true')
  const [form, setForm] = useState({
    age: '', sex: 'Male', weight: '', weightUnit: 'lbs', goal: 'Lose Fat',
    dietType: 'No restrictions', dislikedFoods: '', allergies: '',
    mealsPerDay: '3', sweetTooth: false, freezerFriendly: false, weeklyBudget: '',
    people: '1', planDuration: '7', cookingMethod: 'No preference',
  })
  const [peopleData, setPeopleData] = useState([])
  const [planData, setPlanData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [targets, setTargets] = useState(null)
  const [allPersonTargets, setAllPersonTargets] = useState([])
  const [calAdjust, setCalAdjust] = useState(0)
  const planRef = useRef(null)

  const updateForm = (k, v) => {
    // When people count changes, update peopleData array length
    if (k === 'people') {
      const count = parseInt(v)
      setForm(p => ({ ...p, people: v }))
      setPeopleData(prev => {
        const arr = [...prev]
        while (arr.length < count - 1) arr.push({ age: '', sex: 'Male', weight: '' })
        return arr.slice(0, count - 1)
      })
    } else {
      setForm(p => ({ ...p, [k]: v }))
    }
  }
  const updatePerson = (idx, field, val) => {
    setPeopleData(prev => {
      const arr = [...prev]
      if (!arr[idx]) arr[idx] = { age: '', sex: 'Male', weight: '' }
      arr[idx] = { ...arr[idx], [field]: val }
      return arr
    })
  }

  const PAYPAL_URL = "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=85X6ZA2CZDYH4"

  const handlePurchase = () => {
    window.open(PAYPAL_URL, '_blank')
    if (window.confirm('After completing your $22 payment on PayPal, click OK to unlock MacroMate instantly.\n\nAlready paid? Click OK to get started!')) {
      localStorage.setItem('macromate_purchased', 'true')
      setPurchased(true)
    }
  }

  const handleGenerate = useCallback(() => {
    setGenerating(true)
    setTimeout(() => {
      const prefs = {
        dietType: form.dietType, dislikedFoods: form.dislikedFoods,
        allergies: form.allergies, mealsPerDay: parseInt(form.mealsPerDay),
        sweetTooth: form.sweetTooth, freezerFriendly: form.freezerFriendly,
        weeklyBudget: form.weeklyBudget, people: form.people,
        planDuration: parseInt(form.planDuration) || 7, cookingMethod: form.cookingMethod,
      }
      
      // Calculate targets for each person separately (not averaged)
      const personList = [
        { name: 'You', age: parseInt(form.age), sex: form.sex, weight: parseFloat(form.weight), weightUnit: form.weightUnit, goal: form.goal },
        ...peopleData.filter(p => p.age && p.weight).map((p, i) => ({
          name: `Person ${i + 2}`,
          age: parseInt(p.age), sex: p.sex, weight: parseFloat(p.weight),
          weightUnit: form.weightUnit, goal: form.goal,
        }))
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
      planDuration: parseInt(form.planDuration) || 7, cookingMethod: form.cookingMethod,
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

  // ===== PAYWALL LANDING =====
  if (page === 'landing' && !purchased) {
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
              <div className="price-tag">
                <span className="price-amount">$22</span>
                <span className="price-label">one-time · unlimited use</span>
              </div>
              <button className="btn btn-primary btn-lg hero-cta" onClick={handlePurchase}>
                💳 Buy Now — $22
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                Secure checkout via PayPal · Instant access · No recurring fees
              </p>
              <a href="#" onClick={(e) => { e.preventDefault(); localStorage.setItem('macromate_purchased', 'true'); setPurchased(true); }}
                style={{ fontSize: '0.75rem', color: 'var(--gray-300)', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.25rem' }}>
                Already purchased? Click to unlock (test mode)
              </a>
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
              <div className="feature-item">✅ One purchase = lifetime access</div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="btn btn-primary btn-lg" onClick={handlePurchase}>
                💳 Buy Now — $22
              </button>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>No refunds — all sales final</p>
              <a href="#" onClick={(e) => { e.preventDefault(); localStorage.setItem('macromate_purchased', 'true'); setPurchased(true); }}
                style={{ fontSize: '0.75rem', color: 'var(--gray-300)', textDecoration: 'underline', cursor: 'pointer', display: 'block', marginTop: '0.25rem' }}>
                Already purchased? Click to unlock (test mode)
              </a>
            </div>
          </div>
        </section>
        <footer className="landing-footer">
          <div className="container"><p>MacroMate — Not for Resale. © MacroMate</p></div>
        </footer>
      </div>
    )
  }

  // ===== LANDING (PURCHASED) =====
  if (page === 'landing' && purchased) {
    return (
      <div className="landing">
        <header className="landing-header">
          <div className="container">
            <div className="logo">MacroMate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>Not for Resale</span>
              <span className="badge badge-green">✅ Purchased</span>
              <button className="btn btn-primary" onClick={() => setPage('form')}>Generate My Meal Plan</button>
            </div>
          </div>
        </header>
        <section className="hero">
          <div className="container">
            <div className="hero-badge badge badge-green">Welcome back, MacroMate owner!</div>
            <h1 className="hero-title">Your Personal AI Meal Plan — <span>Ready in 60 Seconds</span></h1>
            <button className="btn btn-primary btn-lg hero-cta" onClick={() => setPage('form')}>
              ✨ Start Your Meal Plan
            </button>
            <div className="benefits">
              <div className="benefit-card">
                <div className="benefit-icon">🎯</div>
                <h3>Tailored to Your Goal</h3>
                <p>Lose fat, build muscle, or maintain — every meal is calibrated.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🥗</div>
                <h3>Diet-Specific Options</h3>
                <p>6 diets, desserts, swaps, and budget tracking.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📊</div>
                <h3>Interactive & Flexible</h3>
                <p>Swap meals, adjust calories, log progress, regenerate.</p>
              </div>
            </div>
          </div>
        </section>
        <footer className="landing-footer">
          <div className="container"><p>MacroMate — Not for Resale</p></div>
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
                  <label>Preferred Cooking Method</label>
                  <select value={form.cookingMethod} onChange={e => updateForm('cookingMethod', e.target.value)}>
                    <option value="No preference">No preference</option>
                    <option value="Stove-Top (Quick)">Stove-Top / Quick</option>
                    <option value="Oven-Baked">Oven-Baked / Roasted</option>
                    <option value="BBQ & Grilling">BBQ & Grilling</option>
                    <option value="One-Pan / Sheet Pan">One-Pan / Sheet Pan</option>
                    <option value="Slow Cooker / Casserole">Slow Cooker / Casserole</option>
                    <option value="No-Cook / Assembly">No-Cook / Assembly (Salads, Smoothies)</option>
                  </select>
                  <span className="hint">We'll prioritize meals that match your preferred method.</span>
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
                <div className="input-group"><label>Foods You Dislike (optional)</label><input type="text" placeholder="e.g. broccoli, salmon" value={form.dislikedFoods} onChange={e => updateForm('dislikedFoods', e.target.value)} /><span className="hint">Separate with commas.</span></div>
                <div className="input-group"><label>Allergies (optional)</label><input type="text" placeholder="e.g. nuts, dairy, shellfish" value={form.allergies} onChange={e => updateForm('allergies', e.target.value)} /><span className="hint">We'll filter out meals containing these.</span></div>
                <div className="input-group">
                  <label>Weekly Grocery Budget (optional)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><span>$</span><input type="number" placeholder="e.g. 80" value={form.weeklyBudget} onChange={e => updateForm('weeklyBudget', e.target.value)} min="20" max="300" /></div>
                  <span className="hint">We'll suggest the most affordable supermarkets.</span>
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
    const supermarkets = getSupermarkets(form.weeklyBudget)
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
            {form.freezerFriendly && <p style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 500 }}>🧊 Freezer-friendly mode active — meals selected for batch cooking & freezing</p>}
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
              <div className="day-micro-chart"><MacroChart protein={day.totals.protein} carbs={day.totals.carbs} fat={day.totals.fat} /></div>
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

          <div className="discount-card card fade-in-up">
            <h2>💰 Save on Your Groceries</h2>
            <p className="grocery-note">Save money on your meal plan ingredients with these money-saving resources.</p>
            <div className="discount-grid">
              <a href="https://www.istock.com" target="_blank" rel="noopener noreferrer" className="discount-item">
                <span className="discount-icon">🏪</span>
                <div><strong>Check Supermarket Weekly Ads</strong><p className="discount-note">Check local flyers for deals on produce, meat, and pantry staples.</p></div>
              </a>
              <a href="https://www.rakuten.com" target="_blank" rel="noopener noreferrer" className="discount-item">
                <span className="discount-icon">💵</span>
                <div><strong>Cashback Apps</strong><p className="discount-note">Rakuten, Ibotta, and Fetch Rewards offer cashback on grocery purchases.</p></div>
              </a>
              <a href="https://www.toogoodtogo.com" target="_blank" rel="noopener noreferrer" className="discount-item">
                <span className="discount-icon">♻️</span>
                <div><strong>Too Good To Go</strong><p className="discount-note">Rescue surplus food from local stores at a fraction of the price.</p></div>
              </a>
              <div className="discount-item">
                <span className="discount-icon">📝</span>
                <div><strong>Buy in Bulk, Freeze What You Can</strong><p className="discount-note">Batch cook and freeze meals to reduce waste and save money on ingredients.</p></div>
              </div>
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