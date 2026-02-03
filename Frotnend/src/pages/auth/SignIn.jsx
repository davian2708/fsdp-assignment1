import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import TextField from '../../components/auth/TextField'
import { validateEmail } from '../../utils/validators'
import './authPages.css'

import { db } from '../../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default function SignIn() {
  const navigate = useNavigate()   

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

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setMessage('')

    const err = validateEmail(email)
    if (err) return

    if (!password) {
      setMessage('Please enter your password.')
      return
    }

    setBusy(true)

    try {
      await addDoc(collection(db, "signins"), {
  email,
  createdAt: serverTimestamp(),
});

localStorage.setItem("currentUser", email); 

setMessage("Signed in. Redirecting...");
setTimeout(() => {
  navigate("/home");
}, 500);

    } catch (error) {
      console.error('Firestore error:', error)
      setMessage('Failed to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth-title">Sign in</h1>
      <p className="auth-subtitle">Enter your credentials to continue.</p>

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
          placeholder="Your password"
          autoComplete="current-password"
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
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="row">
          <span className="link-muted">No account?</span>
          <Link to="/signup" className="link-muted">Create one</Link>
        </div>

        {message ? <div className="banner">{message}</div> : null}
      </form>
    </AuthLayout>
  )
}
