import LeftCenterText from './LeftCenterText.jsx'
import './authLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <section className="auth-left" aria-hidden="true">
        <div className="left-visual">
          <div className="blob blob-a" />
          <div className="blob blob-b" />
          <div className="blob blob-c" />

          <div className="rings">
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
          </div>

          <LeftCenterText />

          <div className="dots">
            <span className="dot d1" />
            <span className="dot d2" />
            <span className="dot d3" />
            <span className="dot d4" />
            <span className="dot d5" />
            <span className="dot d6" />
            <span className="dot d7" />
            <span className="dot d8" />
            <span className="dot d9" />
            <span className="dot d10" />
            <span className="dot d11" />
            <span className="dot d12" />
          </div>

          <div className="sweep sweep-1" />
          <div className="sweep sweep-2" />
        </div>
        <div className="grain" />
      </section>

      <section className="auth-right">
        <div className="auth-right-inner">
          <div className="auth-card">
            {children}
          </div>
        </div>
      </section>
    </div>
  )
}
