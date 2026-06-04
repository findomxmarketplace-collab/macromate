import React, { useState, useRef } from 'react'
import mealDb from './data/meals'
import { calculateTargets, generateMeals } from './utils/nutrition'
import { downloadPDF } from './components/MealPlanPDF'
import './App.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function App() {
  const [page, setPage] = useState('landing') // landing | form | results
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    age: '',
    sex: 'Male',
    weight: '',
    weightUnit: 'lbs',
    goal: 'Lose Fat',
    dietType: 'No restrictions',
    dislikedFoods: '',
    mealsPerDay: '3',
  })
  const [planData, setPlanData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [targets, setTargets] = useState(null)
  const planRef = useRef(null)

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleGenerate = () => {
    setGenerating(true)
    // Small delay to show loading state
    setTimeout(() => {
      const prefs = {
        dietType: form.dietType,
        dislikedFoods: form.dislikedFoods,
        mealsPerDay: parseInt(form.mealsPerDay),
      }
      const t = calculateTargets({
        age: parseInt(form.age),
        sex: form.sex,
        weight: parseFloat(form.weight),
        weightUnit: form.weightUnit,
        goal: form.goal,
      })
      const result = generateMeals(mealDb, prefs, t)
      setTargets(t)
      setPlanData(result)
      setGenerating(false)
      setPage('results')
    }, 1200)
  }

  const handleDownloadPDF = () => {
    if (planRef.current) {
      downloadPDF(planRef.current)
    }
  }

  const canProceedStep1 = form.age && form.weight
  const canProceedStep2 = true // all selected

  // Landing page
  if (page === 'landing') {
    return (
      <div className="landing">
        <header className="landing-header">
          <div className="container">
            <div className="logo">MacroMate</div>
            <button className="btn btn-primary" onClick={() => setPage('form')}>
              Generate My Free Plan
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="container">
            <div className="hero-badge badge badge-green">AI-Powered Meal Planning</div>
            <h1 className="hero-title">
              Your Personal AI Meal Plan — <span>Ready in 60 Seconds</span>
            </h1>
            <p className="hero-subtitle">
              Tell us your goals, and our AI builds a science-based 7-day meal plan 
              with exact macros, ingredients, and prep instructions — tailored to you.
            </p>
            <button className="btn btn-primary btn-lg hero-cta" onClick={() => setPage('form')}>
              Generate My Free Plan
            </button>

            <div className="benefits">
              <div className="benefit-card">
                <div className="benefit-icon">🎯</div>
                <h3>Tailored to Your Goal</h3>
                <p>Lose fat, build muscle, or maintain — every meal is calibrated to your target.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🥗</div>
                <h3>Diet-Specific Options</h3>
                <p>Keto, vegan, paleo, gluten-free, or no restrictions — we've got you covered.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">📋</div>
                <h3>Grocery List Included</h3>
                <p>Get a consolidated 7-day shopping list so you can prep once and eat all week.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h4>Tell Us About You</h4>
                <p>Age, weight, goal, and dietary preferences.</p>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <div className="step-number">2</div>
                <h4>AI Generates Your Plan</h4>
                <p>7 days of meals with real macros and prep steps.</p>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <div className="step-number">3</div>
                <h4>Eat & Track Progress</h4>
                <p>Download your PDF and use it as much as you want — one-time purchase.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="container">
            <p>MacroMate — Eat smarter, reach your goals.</p>
          </div>
        </footer>
      </div>
    )
  }

  // Multi-step form
  if (page === 'form') {
    return (
      <div className="form-page">
        <header className="form-header">
          <div className="container">
            <div className="logo" onClick={() => setPage('landing')} style={{ cursor: 'pointer' }}>MacroMate</div>
          </div>
        </header>

        <div className="container form-container">
          <div className="form-card card">
            <div className="form-progress">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <div className="progress-circle">1</div>
                <span>Your Profile</span>
              </div>
              <div className="progress-line" />
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="progress-circle">2</div>
                <span>Preferences</span>
              </div>
              <div className="progress-line" />
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="progress-circle">3</div>
                <span>Generate</span>
              </div>
            </div>

            {/* Step 1: Profile */}
            {step === 1 && (
              <div className="form-step fade-in-up">
                <h2>Tell us about yourself</h2>
                <p className="form-desc">We'll use this to calculate your perfect macros.</p>

                <div className="input-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    value={form.age}
                    onChange={e => updateForm('age', e.target.value)}
                    min="10"
                    max="120"
                  />
                </div>

                <div className="input-group">
                  <label>Biological Sex</label>
                  <div className="radio-group">
                    <label className={form.sex === 'Male' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="sex"
                        value="Male"
                        checked={form.sex === 'Male'}
                        onChange={e => updateForm('sex', e.target.value)}
                      />
                      <span>Male</span>
                    </label>
                    <label className={form.sex === 'Female' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="sex"
                        value="Female"
                        checked={form.sex === 'Female'}
                        onChange={e => updateForm('sex', e.target.value)}
                      />
                      <span>Female</span>
                    </label>
                  </div>
                </div>

                <div className="input-group">
                  <label>Current Weight</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="e.g. 175"
                      value={form.weight}
                      onChange={e => updateForm('weight', e.target.value)}
                      style={{ flex: 1 }}
                      min="30"
                      max="700"
                    />
                    <select
                      value={form.weightUnit}
                      onChange={e => updateForm('weightUnit', e.target.value)}
                      style={{ width: '100px' }}
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>

                <div className="form-nav">
                  <button
                    className="btn btn-primary btn-block btn-lg"
                    disabled={!canProceedStep1}
                    onClick={() => setStep(2)}
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Preferences */}
            {step === 2 && (
              <div className="form-step fade-in-up">
                <h2>What are your preferences?</h2>
                <p className="form-desc">We'll personalize every meal around these choices.</p>

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
                  <label>Meals Per Day</label>
                  <select value={form.mealsPerDay} onChange={e => updateForm('mealsPerDay', e.target.value)}>
                    <option value="2">2 meals</option>
                    <option value="3">3 meals</option>
                    <option value="4">4 meals (includes snack)</option>
                    <option value="5">5 meals (includes 2 snacks)</option>
                  </select>
                  <span className="hint">
                    {form.mealsPerDay === '2' && 'Great for intermittent fasting approaches.'}
                    {form.mealsPerDay === '3' && 'The classic breakfast, lunch, dinner structure.'}
                    {form.mealsPerDay === '4' && 'Three meals plus one snack to keep energy steady.'}
                    {form.mealsPerDay === '5' && 'Frequent smaller meals to fuel muscle growth.'}
                  </span>
                </div>

                <div className="input-group">
                  <label>Foods You Dislike (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. broccoli, salmon, mushrooms"
                    value={form.dislikedFoods}
                    onChange={e => updateForm('dislikedFoods', e.target.value)}
                  />
                  <span className="hint">Separate with commas. We'll avoid these in your plan.</span>
                </div>

                <div className="form-nav" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ flex: 2 }}
                    onClick={() => setStep(3)}
                  >
                    Review →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Generate */}
            {step === 3 && (
              <div className="form-step fade-in-up">
                <h2>Ready to generate your plan</h2>
                <p className="form-desc">Here's a quick summary — all good?</p>

                <div className="summary-card">
                  <div className="summary-row">
                    <span>Age / Sex</span>
                    <strong>{form.age} · {form.sex}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Weight</span>
                    <strong>{form.weight} {form.weightUnit}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Goal</span>
                    <strong>{form.goal}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Diet</span>
                    <strong>{form.dietType}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Meals / Day</span>
                    <strong>{form.mealsPerDay}</strong>
                  </div>
                  {form.dislikedFoods && (
                    <div className="summary-row">
                      <span>Dislikes</span>
                      <strong>{form.dislikedFoods}</strong>
                    </div>
                  )}
                </div>

                <div className="form-nav" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)} style={{ flex: 1 }}>
                    ← Edit
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ flex: 2 }}
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <><span className="spinner" /> Generating...</>
                    ) : (
                      '✨ Generate My Meal Plan'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Results page
  if (page === 'results' && planData) {
    const { mealsByDay, groceryList } = planData

    return (
      <div className="results-page">
        <header className="results-header">
          <div className="container">
            <div className="logo" onClick={() => setPage('landing')} style={{ cursor: 'pointer' }}>MacroMate</div>
            <button className="btn btn-primary" onClick={handleDownloadPDF}>
              📄 Download My Meal Plan as PDF
            </button>
          </div>
        </header>

        <div className="container results-container" ref={planRef}>
          {/* Daily targets */}
          <div className="targets-card card fade-in-up">
            <h2>🎯 Your Daily Targets</h2>
            <div className="targets-grid">
              <div className="target-item">
                <div className="target-value">{targets.targetCalories}</div>
                <div className="target-label">Calories</div>
              </div>
              <div className="target-item">
                <div className="target-value">{targets.proteinG}g</div>
                <div className="target-label">Protein</div>
              </div>
              <div className="target-item">
                <div className="target-value">{targets.carbsG}g</div>
                <div className="target-label">Carbs</div>
              </div>
              <div className="target-item">
                <div className="target-value">{targets.fatG}g</div>
                <div className="target-label">Fat</div>
              </div>
            </div>
            <p className="targets-note">
              Based on Mifflin-St Jeor equation. Your actual needs may vary — listen to your body!
            </p>
          </div>

          {/* 7-day meal plan */}
          <h2 className="section-title">Your 7-Day Meal Plan</h2>
          
          {mealsByDay.map((day, idx) => (
            <div key={idx} className="day-card card fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="day-header">
                <div>
                  <span className="day-name">{DAYS[idx]}</span>
                  <span className="day-badge">Day {day.day}</span>
                </div>
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
                    <div className="meal-slot-badge">
                      {meal.slot === 'breakfast' && '🌅 Breakfast'}
                      {meal.slot === 'lunch' && '☀️ Lunch'}
                      {meal.slot === 'dinner' && '🌙 Dinner'}
                      {meal.slot === 'snack' && '🍎 Snack'}
                    </div>
                    <h4 className="meal-name">{meal.name}</h4>
                    <div className="meal-macros">
                      <span>{meal.calories} cal</span>
                      <span>P {meal.protein}g</span>
                      <span>C {meal.carbs}g</span>
                      <span>F {meal.fat}g</span>
                    </div>
                    <details className="meal-details">
                      <summary>Ingredients & Prep</summary>
                      <div className="meal-ingredients">
                        <strong>Ingredients:</strong>
                        <ul>
                          {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                      </div>
                      <div className="meal-instructions">
                        <strong>Quick Prep:</strong>
                        <p>{meal.instructions}</p>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Grocery List */}
          <div className="grocery-card card fade-in-up">
            <h2>🛒 7-Day Grocery List</h2>
            <p className="grocery-note">
              Consolidated shopping list for the entire week. Buy once, eat all week!
            </p>
            <div className="grocery-grid">
              {groceryList.map((item, idx) => (
                <div key={idx} className="grocery-item">
                  <input type="checkbox" id={`grocery-${idx}`} />
                  <label htmlFor={`grocery-${idx}`}>{item}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Re-generate and Download */}
          <div className="results-actions fade-in-up">
            <button className="btn btn-secondary btn-lg" onClick={() => { setPage('form'); setStep(1) }}>
              ← Generate New Plan
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleDownloadPDF}>
              📄 Download My Meal Plan as PDF
            </button>
          </div>
          
          <p className="license-note">
            💡 PDF download requires a license key (one-time purchase — use it as much as you want!)
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default App