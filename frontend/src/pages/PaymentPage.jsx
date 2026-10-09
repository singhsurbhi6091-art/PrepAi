// src/pages/PaymentPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import '@/styles/global.scss'

const API_BASE = import.meta.env.VITE_API_URL

const FEATURES = [
  { icon: '∞', label: 'Unlimited AI mock interviews' },
  { icon: '📊', label: 'Detailed performance reports' },
  { icon: '🎯', label: 'All job roles & companies' },
  { icon: '⚡', label: 'Instant feedback after each round' },
  { icon: '🎙', label: 'Audio & video answer support' },
  { icon: '🏆', label: 'Priority support' },
]

export default function PaymentPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { if (user?.isPaid) navigate('/dashboard') }, [user])
  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
    return () => document.body.removeChild(s)
  }, [])

  const getToken = () => localStorage.getItem('token')

  const handlePayment = async () => {
    setLoading(true); setStatus(null); setErrorMsg('')
    try {
      const { data } = await axios.post(`${API_BASE}/api/payment/create-order`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const options = {
        key: data.keyId, amount: data.amount, currency: data.currency,
        order_id: data.orderId, name: 'PrepAI', description: 'Unlimited Plan — Lifetime Access',
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#4F46E5' },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => { await verifyPayment(response) },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r) => {
        setStatus('failed'); setErrorMsg(r.error?.description || 'Payment failed'); setLoading(false)
      })
      rzp.open()
    } catch (err) {
      setStatus('failed'); setErrorMsg(err.response?.data?.message || 'Something went wrong'); setLoading(false)
    }
  }

  const verifyPayment = async (response) => {
    try {
      const { data } = await axios.post(`${API_BASE}/api/payment/verify`, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (setUser) setUser(data.user)
      setStatus('success')
    } catch (err) {
      setStatus('failed'); setErrorMsg(err.response?.data?.message || 'Verification failed')
    } finally { setLoading(false) }
  }

  // Success screen
  if (status === 'success') return (
    <div className="page-center" style={{ background: 'linear-gradient(135deg, #F0F0F8 0%, #F7F7FA 100%)' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '2.5rem 2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: 'var(--green-soft)',
            border: '2px solid #A7F3D0', margin: '0 auto 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Payment successful!</h2>
          <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1.5rem' }}>
            Your <strong>Unlimited Plan</strong> is now active. Start practising with unlimited interviews.
          </p>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/dashboard')}>
            Go to dashboard →
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-bg">
      {/* Nav */}
      <nav className="navbar">
        <span className="logo">PrepAI</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Back</button>
      </nav>

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-accent" style={{ marginBottom: '1rem' }}>One-time payment</span>
          <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Unlock unlimited practice
          </h1>
          <p style={{ color: 'var(--mid)', fontSize: '15px' }}>
            Pay once. Practice forever. No subscriptions, no hidden fees.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', alignItems: 'start', maxWidth: '800px', margin: '0 auto' }}>

          {/* Left — Features */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)' }}>₹499</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>one-time</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '1.5rem' }}>Lifetime access · No hidden charges</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                {FEATURES.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-soft)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '14px', flexShrink: 0
                    }}>
                      {f.icon}
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--ink)' }}>{f.label}</span>
                  </div>
                ))}
              </div>

              <hr className="divider" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <span className="badge badge-gray">Free plan</span>
                <span style={{ fontSize: '13px', color: 'var(--mid)' }}>3 interviews · basic feedback only</span>
              </div>
            </div>
          </div>

          {/* Right — Checkout */}
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '0.25rem' }}>Order summary</h3>
              <p style={{ color: 'var(--mid)', fontSize: '13px', marginBottom: '1.25rem' }}>
                Secure checkout powered by Razorpay
              </p>

              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px' }}>Unlimited Plan</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>₹499</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--mid)' }}>GST / Taxes</span>
                  <span style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 500 }}>Included</span>
                </div>
                <hr className="divider" style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹499</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handlePayment}
                disabled={loading}
                style={{ marginBottom: '1rem' }}
              >
                {loading
                  ? <><span className="spinner" />Processing…</>
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Pay ₹499 with Razorpay
                    </>
                }
              </button>

              {status === 'failed' && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '13px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--muted)', fontSize: '12px', marginBottom: '1rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                256-bit SSL encrypted · Secured by Razorpay
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                  <span key={m} style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--surface)'
                  }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}