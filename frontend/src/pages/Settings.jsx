// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import toast, { Toaster } from 'react-hot-toast'
import '@/styles/global.scss'

const JOB_ROLES = [
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer',
  'Machine Learning Engineer', 'Mobile Developer', 'UI/UX Designer',
  'Product Manager', 'QA Engineer', 'Cloud Engineer',
  'Cybersecurity Analyst', 'Business Analyst'
]

export default function Settings() {
  const navigate = useNavigate()
  const { user, login } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState(user?.name || '')
  const [jobPreference, setJobPreference] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [companies, setCompanies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [savingCompanies, setSavingCompanies] = useState(false)

  useEffect(() => { fetchProfile() }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchCompanySearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile')
      setName(res.data.name)
      setJobPreference(res.data.jobPreference || '')
      setCompanies(res.data.companies || [])
    } catch { toast.error('Failed to load profile') }
  }

  const fetchCompanySearch = async (q) => {
    try {
      const res = await api.get(`/companies/search?q=${q}&t=${Date.now()}`)
      setSearchResults(res.data)
    } catch { toast.error('Failed to search companies') }
  }

  const toggleCompany = (company) => {
    const exists = companies.find(c => c._id === company._id)
    setCompanies(exists ? companies.filter(c => c._id !== company._id) : [...companies, company])
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    setSavingProfile(true)
    try {
      const res = await api.put('/auth/update-profile', { name, jobPreference })
      login(res.data.user, localStorage.getItem('token'))
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setSavingProfile(false) }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords don\'t match')
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setSavingPassword(true)
    try {
      await api.put('/auth/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      toast.success('Password updated!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally { setSavingPassword(false) }
  }

  const handleSaveCompanies = async () => {
    if (companies.length === 0) return toast.error('Select at least one company')
    setSavingCompanies(true)
    try {
      const res = await api.put('/auth/update-companies', { companies: companies.map(c => c._id) })
      login(res.data.user, localStorage.getItem('token'))
      toast.success('Companies updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update companies')
    } finally { setSavingCompanies(false) }
  }

  const TABS = [
    { key: 'profile', label: 'Profile', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: 'password', label: 'Password', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
    { key: 'companies', label: 'Companies', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  ]

  return (
    <div className="page-bg">
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />

      <nav className="navbar">
        <span className="logo">PrepAI</span>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </nav>

      <div className="container-sm" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ color: 'var(--mid)', fontSize: '14px' }}>Manage your account and preferences</p>
        </div>

        {/* Avatar / profile summary */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: '#fff'
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '15px' }}>{user?.name}</p>
              <p style={{ color: 'var(--mid)', fontSize: '13px' }}>{user?.email}</p>
            </div>
            <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', border: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                color: activeTab === t.key ? 'var(--accent)' : 'var(--mid)',
                borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`,
                marginBottom: '-1px', transition: 'all 0.2s ease'
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Profile information</h3>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="field">
                  <label className="label">Full name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label className="label">Email <span className="label-hint">(cannot be changed)</span></label>
                  <input className="input" value={user?.email || ''} disabled />
                </div>
                <div className="field">
                  <label className="label">App role <span className="label-hint">(cannot be changed)</span></label>
                  <input className="input" value={user?.role || ''} disabled style={{ textTransform: 'capitalize' }} />
                </div>
                <div className="field">
                  <label className="label">Job preference</label>
                  <select className="select" value={jobPreference} onChange={e => setJobPreference(e.target.value)}>
                    <option value="">Select job role</option>
                    {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Auto-fills the job role on your dashboard</span>
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={savingProfile}>
                  {savingProfile ? <><span className="spinner" />Saving…</> : 'Save changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Password tab */}
        {activeTab === 'password' && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Change password</h3>
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="field">
                  <label className="label">Current password</label>
                  <input
                    className="input" type="password"
                    value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="field">
                  <label className="label">New password</label>
                  <input
                    className="input" type="password"
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="field">
                  <label className="label">Confirm new password</label>
                  <input
                    className="input" type="password"
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                  />
                </div>
                {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <div className="alert alert-danger" style={{ padding: '10px 14px', fontSize: '13px' }}>Passwords do not match</div>
                )}
                <button className="btn btn-primary btn-full" type="submit" disabled={savingPassword}>
                  {savingPassword ? <><span className="spinner" />Updating…</> : 'Update password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Companies tab */}
        {activeTab === 'companies' && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Target companies</h3>
              <p style={{ color: 'var(--mid)', fontSize: '13px', marginBottom: '1.25rem' }}>
                These companies appear in your interview dropdown
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
                    placeholder="Search companies…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  maxHeight: '200px', overflowY: 'auto', marginBottom: '0.75rem',
                  background: 'var(--white)'
                }}>
                  {searchResults.map(company => {
                    const isSel = companies.find(c => c._id === company._id)
                    return (
                      <div
                        key={company._id}
                        onClick={() => toggleCompany(company)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid var(--border)',
                          background: isSel ? 'var(--accent-soft)' : 'transparent', transition: 'background 0.15s'
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

              {companies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                  {companies.map(company => (
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

              <button className="btn btn-primary btn-full" onClick={handleSaveCompanies} disabled={savingCompanies}>
                {savingCompanies ? <><span className="spinner" />Saving…</> : 'Save companies'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}