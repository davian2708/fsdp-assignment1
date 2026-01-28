import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import TextField from '../../components/auth/TextField'
import { validateEmail, validatePassword } from '../../utils/validators'
import { db } from '../../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import './authPages.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const emailError = useMemo(
    () => (submitted ? validateEmail(email) : null),
    [email, submitted]
  )

  const passwordError = useMemo(
    () => (submitted ? validatePassword(password) : null),
    [password, submitted]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setMessage('')

    const eErr = validateEmail(email)
    const pErr = validatePassword(password)

    if (eErr || pErr) return

    setBusy(true)

    try {
      await addDoc(collection(db, 'users'), {
        email,
        createdAt: serverTimestamp()
      })

      setMessage('Account created. You can now sign in ')
      setEmail('')
      setPassword('')
      setSubmitted(false)
    } catch (error) {
      console.error('Firestore error:', error)
      setMessage('Failed to create account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-title">Sign up</h1>
      <p className="auth-subtitle">
        Create a new account with your email and password.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          error={emailError}
        />

        <TextField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          autoComplete="new-password"
          error={passwordError}
          rightSlot={
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>

        <div className="row">
          <span className="link-muted">Already have an account?</span>
          <Link to="/signin" className="link-muted">Sign in</Link>
        </div>

        <div className="small">
          Password rules:
          <ul>
            <li>Minimum 8 characters</li>
            <li>Contains at least 1 number</li>
            <li>Contains at least 1 special character</li>
            <li>No spaces</li>
          </ul>
        </div>

        {message ? <div className="banner">{message}</div> : null}
      </form>
    </AuthLayout>
  )
}
