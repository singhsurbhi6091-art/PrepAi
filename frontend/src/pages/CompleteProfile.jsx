// src/pages/CompleteProfile.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import toast, { Toaster } from 'react-hot-toast'
import '@/styles/global.scss'

const ROLES = [
  { value: 'candidate', label: 'Candidate', desc: 'Prepare for job interviews', icon: '👤' },
  { value: 'admin', label: 'Admin', desc: 'Manage platform and content', icon: '⚙️' },
]

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [selectedRole, setSelectedRole] = useState('')
  const [step, setStep] = useState(1) // 1: role, 2: companies

  useEffect(() => { fetchCompanies('') }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchCompanies(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchCompanies = async (q) => {
    try {
      const res = await api.get(`/companies/search?q=${q}&t=${Date.now()}`)
      setCompanies(res.data)
    } catch { toast.error('Failed to load companies') }
  }

  const toggleCompany = (company) => {
    const exists = selectedCompanies.find(c => c._id === company._id)
    setSelectedCompanies(exists
      ? selectedCompanies.filter(c => c._id !== company._id)
      : [...selectedCompanies, company]
    )
  }

  const handleSubmit = async () => {
    if (!selectedRole) return toast.error('Please select a role')
    if (selectedCompanies.length === 0) return toast.error('Select at least one company')
    setLoading(true)
    try {
      const res = await api.post('/auth/complete-profile', {
        role: selectedRole,
        companies: selectedCompanies.map(c => c._id)
      })
      login(res.data.user, localStorage.getItem('token'))
      toast.success('Profile completed!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center" style={{ background: 'linear-gradient(135deg, #F0F0F8 0%, #F7F7FA 50%, #EEEEF8 100%)', alignItems: 'flex-start', paddingTop: '3rem' }}>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />

      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="logo" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.75rem' }}>PrepAI</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>Set up your profile</h1>
          <p style={{ color: 'var(--mid)', fontSize: '14px' }}>This is a one-time setup — choose carefully</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 600,
                background: step >= s ? 'var(--accent)' : 'var(--border)',
                color: step >= s ? '#fff' : 'var(--muted)',
                transition: 'all 0.3s ease'
              }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: '13px', color: step === s ? 'var(--ink)' : 'var(--muted)', fontWeight: step === s ? 500 : 400 }}>
                {s === 1 ? 'Your role' : 'Target companies'}
              </span>
              {s < 2 && <div style={{ width: '32px', height: '1px', background: step > s ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s ease' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>

            {/* Step 1: Role */}
            {step === 1 && (
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>What's your role?</h3>
                <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1.25rem' }}>Choose how you'll use PrepAI</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                  {ROLES.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '1rem 1.1rem',
                        border: `2px solid ${selectedRole === role.value ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        background: selectedRole === role.value ? 'var(--accent-soft)' : 'var(--white)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{role.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: selectedRole === role.value ? 'var(--accent-text)' : 'var(--ink)' }}>{role.label}</p>
                        <p style={{ fontSize: '13px', color: 'var(--mid)', marginTop: '2px' }}>{role.desc}</p>
                      </div>
                      {selectedRole === role.value && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg"
                  onClick={() => { if (!selectedRole) return toast.error('Please select a role'); setStep(2) }}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Companies */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>Target companies</h3>
                <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1.25rem' }}>
                  Which companies are you preparing for?
                </p>

                <div className="field" style={{ marginBottom: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
                      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      className="input"
                      type="text"
                      placeholder="Search companies… e.g. Tata, Google"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                {/* Results dropdown */}
                {companies.length > 0 && (
                  <div style={{
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    maxHeight: '200px', overflowY: 'auto', marginBottom: '0.75rem',
                    background: 'var(--white)'
                  }}>
                    {companies.map(company => {
                      const isSel = selectedCompanies.find(c => c._id === company._id)
                      return (
                        <div
                          key={company._id}
                          onClick={() => toggleCompany(company)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--border)',
                            background: isSel ? 'var(--accent-soft)' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: isSel ? 'var(--accent-text)' : 'var(--ink)' }}>{company.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{company.industry}</p>
                          </div>
                          {isSel
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          }
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Selected chips */}
                {selectedCompanies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                    {selectedCompanies.map(company => (
                      <span
                        key={company._id}
                        className="badge badge-accent"
                        onClick={() => toggleCompany(company)}
                        style={{ cursor: 'pointer', gap: '5px' }}
                      >
                        {company.name}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: '0 0 auto' }}>← Back</button>
                  <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" />Saving…</> : 'Complete setup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}