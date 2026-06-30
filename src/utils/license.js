/**
 * Simple license key system for MacroMate.
 * Keys format: MACRO-YYYYMMDD-HH (e.g. MACRO-20261231-12)
 * - YYYYMMDD = expiry date
 * - HH = validity hour (24h format)
 * 
 * The owner generates keys using generateKey() below.
 * The app validates keys and locks when expired.
 */

function xorChecksum(str) {
  let sum = 0
  for (let i = 0; i < str.length; i++) {
    sum ^= str.charCodeAt(i)
  }
  return (sum % 100).toString().padStart(2, '0')
}

export function generateKey(expiryDate) {
  // expiryDate: Date object
  const y = expiryDate.getFullYear()
  const m = String(expiryDate.getMonth() + 1).padStart(2, '0')
  const d = String(expiryDate.getDate()).padStart(2, '0')
  const h = String(expiryDate.getHours()).padStart(2, '0')
  const base = `${y}${m}${d}`
  const check = xorChecksum(base)
  return `MACRO-${base}-${check}${h}`
}

export function validateKey(key) {
  if (!key || typeof key !== 'string') return { valid: false, reason: 'No key provided' }
  
  const trimmed = key.trim().toUpperCase()
  const match = trimmed.match(/^MACRO-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/)
  
  if (!match) {
    return { valid: false, reason: 'Invalid key format. Should be: MACRO-YYYYMMDD-XXXX' }
  }
  
  const [, yearStr, monthStr, dayStr, checkSum, hourStr] = match
  const base = `${yearStr}${monthStr}${dayStr}`
  const expectedCheck = xorChecksum(base)
  
  if (checkSum !== expectedCheck) {
    return { valid: false, reason: 'Invalid key' }
  }
  
  const expiryDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hourStr))
  const now = new Date()
  
  if (expiryDate < now) {
    return { valid: false, reason: `License expired on ${expiryDate.toLocaleDateString()}` }
  }
  
  return { 
    valid: true, 
    expiresAt: expiryDate.toISOString(),
    expiresFormatted: expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
}

// Quick test: generate a key valid for 30 days
// Run with: node -e "const {generateKey} = require('./license'); const d = new Date(); d.setDate(d.getDate()+30); console.log(generateKey(d))"
if (typeof require !== 'undefined' && require.main === module) {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  const key = generateKey(d)
  console.log('Generated key (valid 30 days):', key)
  console.log('Validation:', validateKey(key))
}