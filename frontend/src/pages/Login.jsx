// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import toast, { Toaster } from 'react-hot-toast'
import '@/styles/global.scss'


export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.token)
      toast.success('Welcome back!')
      navigate(res.data.user.isProfileComplete ? '/dashboard' : '/complete-profile')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) errors.forEach(e => toast.error(e.message))
      else toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center" style={{ background: 'linear-gradient(135deg, #F0F0F8 0%, #F7F7FA 50%, #EEEEF8 100%)' }}>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="logo" style={{ fontSize: '1.7rem', display: 'block', marginBottom: '0.5rem' }}>PrepAI</span>
          <p style={{ color: 'var(--mid)', fontSize: '14px' }}>AI-powered interview practice</p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.2rem' }}>Sign in</h2>
            <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1.75rem' }}>
              Continue your interview prep journey
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field">
                <label className="label">Email</label>
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                      padding: 0, display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPassword
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <><span className="spinner" />Signing in…</> : 'Sign in'}
              </button>
            </form>

            <hr className="divider" />

            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--mid)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}