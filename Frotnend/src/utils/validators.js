// Frontend-only validation helpers

export function validateEmail(email) {
  const value = String(email || '').trim()

  if (!value) return 'Email is required.'

  // Reasonably strict email format check (frontend cannot verify mailbox existence).
  // - No spaces
  // - Has local@domain.tld
  // - TLD length >= 2
  const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/
  if (!emailRegex.test(value)) return 'Please enter a valid email address.'

  return null
}

export function validatePassword(password) {
  const value = String(password || '')

  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (/\s/.test(value)) return 'Password must not contain spaces.'
  if (!/\d/.test(value)) return 'Password must include at least 1 number.'
  // Special character: anything that is not a letter or digit
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must include at least 1 special character.'

  return null
}
