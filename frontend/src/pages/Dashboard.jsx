// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import '@/styles/global.scss'
import '@/styles/variables.scss'
import '@/styles/mixins.scss'

// ─── Constants ───────────────────────────────────────────────────────────────

const INTERVIEW_MODES = [
  {
    id: 'standard',
    icon: '💼',
    title: 'Job Role Interview',
    desc: 'Classic interview tailored to your target role and company',
    color: '#4F46E5',
    colorSoft: '#EEF2FF',
    colorText: '#3730A3',
    badge: null,
    isPro: false,
  },
  {
    id: 'company',
    icon: '🏢',
    title: 'Company-Specific',
    desc: 'Questions based on actual patterns of top companies',
    color: '#0891B2',
    colorSoft: '#ECFEFF',
    colorText: '#0E7490',
    badge: 'Popular',
    isPro: false,
    comingSoon: true,
  },
  {
    id: 'resume',
    icon: '📄',
    title: 'Resume / CV Based',
    desc: 'Upload your CV — get questions tailored to your experience',
    color: '#7C3AED',
    colorSoft: '#F5F3FF',
    colorText: '#5B21B6',
    badge: 'Pro',
    isPro: true,
    comingSoon: true,
  },
  {
    id: 'core',
    icon: '⚙️',
    title: 'Core Subjects',
    desc: 'DSA, OS, DBMS, CN, OOP — go deep on CS fundamentals',
    color: '#D97706',
    colorSoft: '#FFFBEB',
    colorText: '#92400E',
    badge: null,
    isPro: false,
    comingSoon: true,
  },
]

const CORE_SUBJECTS = [
  { id: 'dsa', label: 'DSA', icon: '🌳' },
  { id: 'os', label: 'OS', icon: '💻' },
  { id: 'dbms', label: 'DBMS', icon: '🗄️' },
  { id: 'cn', label: 'Networks', icon: '🌐' },
  { id: 'oop', label: 'OOP', icon: '📦' },
  { id: 'algo', label: 'Algorithms', icon: '⚡' },
  { id: 'system', label: 'System Design', icon: '🏗️' },
  { id: 'sql', label: 'SQL', icon: '📊' },
]

const DIFFICULTY = [
  { key: 'Easy', color: '#059669', soft: '#ECFDF5', text: '#065F46' },
  { key: 'Medium', color: '#D97706', soft: '#FFFBEB', text: '#92400E' },
  { key: 'Hard', color: '#DC2626', soft: '#FEF2F2', text: '#991B1B' },
]

const JOB_ROLES = [
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer',
  'Machine Learning Engineer', 'Mobile Developer', 'UI/UX Designer',
  'Product Manager', 'QA Engineer', 'Cloud Engineer',
  'Cybersecurity Analyst', 'Business Analyst',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const scoreBadgeStyle = (score) => {
  if (score >= 80) return { bg: '#ECFDF5', text: '#065F46' }
  if (score >= 60) return { bg: '#FFFBEB', text: '#92400E' }
  return { bg: '#FEF2F2', text: '#991B1B' }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [interviews, setInterviews] = useState([])
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState('standard')
  const [jobRole, setJobRole] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [difficulty, setDifficulty] = useState('Medium')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeJobRole, setResumeJobRole] = useState('')
  const [starting, setStarting] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')
  const resumeRef = useRef()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [iRes, pRes, prRes] = await Promise.all([
        api.get('/interview/my-interviews'),
        api.get('/payment/status'),
        api.get('/auth/profile')
      ])
      setInterviews(Array.isArray(iRes.data.interviews) ? iRes.data.interviews : [])
      setPaymentStatus(pRes.data)
      setCompanies(prRes.data.companies || [])
      setJobRole(prRes.data.jobPreference || '')
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const toggleSubject = (id) =>
    setSelectedSubjects(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])

  const handleStartInterview = async (e) => {
    e.preventDefault()
    if (selectedMode === 'standard' || selectedMode === 'company') {
      if (!jobRole) return toast.error('Select a job role')
      if (!selectedCompany) return toast.error('Select a company')
    }
    if (selectedMode === 'core' && selectedSubjects.length === 0)
      return toast.error('Select at least one subject')
    if (selectedMode === 'resume') {
      if (!paymentStatus?.isPaid) return navigate('/payment')
      if (!resumeFile) return toast.error('Upload your resume')
      if (!resumeJobRole) return toast.error('Enter target job role')
    }

    setStarting(true)
    try {
      let res
      if (selectedMode === 'resume') {
        const fd = new FormData()
        fd.append('resume', resumeFile)
        fd.append('jobRole', resumeJobRole)
        fd.append('type', 'resume')
        res = await api.post('/interview/start', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else if (selectedMode === 'core') {
        res = await api.post('/interview/start', { type: 'core', subjects: selectedSubjects, difficulty })
      } else {
        res = await api.post('/interview/start', { type: selectedMode, jobRole, companyId: selectedCompany })
      }
      navigate(`/interview/${res.data.interviewId}`, {
        state: { questions: res.data.questions, jobRole: res.data.jobRole }
      })
    } catch (err) {
      if (err.response?.status === 403) { toast.error('Free limit reached'); navigate('/payment') }
      else toast.error(err.response?.data?.message || 'Failed to start interview')
    } finally { setStarting(false) }
  }

  const mode = INTERVIEW_MODES.find(m => m.id === selectedMode)
  const completed = interviews.filter((i) => i.status === 'completed')
  const avgScore = completed.length ? Math.round(completed.reduce((s, i) => s + (i.overallScore || 0), 0) / completed.length) : null
  const bestScore = completed.length ? Math.max(...completed.map(i => i.overallScore || 0)) : null
  const filteredHistory = historyFilter === 'all' ? interviews : interviews.filter(i => (i.type || 'standard') === historyFilter)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '14px', background: '#F7F7FA', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '28px', height: '28px', border: '3px solid #E4E4EC', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin .65s linear infinite' }} />
      <p style={{ color: '#9999A8', fontSize: '14px' }}>Loading your dashboard…</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7FA', fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: '15px' }}>

      {/* Global styles & Responsive CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&display=swap');
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes up    { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:none } }
        
        .dash-card { background:#fff;border:1px solid #E4E4EC;border-radius:16px;overflow:hidden }
        .mcard:hover { border-color:#C7D2FE !important }
        .mcard.active { box-shadow:0 0 0 3px rgba(79,70,229,.12) }
        .sc:hover { border-color:#4F46E5 !important;background:#F5F3FF !important }
        .hist-row:hover { background:#F9F9FC !important }
        .btn-p:hover { filter:brightness(1.08) }
        .btn-p:active { transform:scale(.98) }
        input,select,textarea { font-family:inherit }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-thumb { background:#D1D5DB;border-radius:99px }

        /* Responsive Layout Overrides */
        .dash-main-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .mode-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 500px) {
          .mode-cards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 900px) {
          .dash-main-layout {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
          }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ background: 'rgba(255,255,255,.90)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #E4E4EC', minHeight: '60px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: '1.4rem', color: '#4F46E5', letterSpacing: '-.01em' }}>PrepAI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#9999A8' }}>{user?.name}</span>
            {paymentStatus?.isPaid
              ? <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#ECFDF5', color: '#065F46' }}>✦ Pro</span>
              : <span style={{ fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '999px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{paymentStatus?.remainingFree ?? 0} free left</span>
            }
            <button onClick={() => navigate('/settings')} style={ob()}>Settings</button>
            <button onClick={async () => { await logout(); navigate('/login') }} style={{ background: 'none', border: 'none', fontSize: '13px', color: 'rgb(255 121 121)', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: '6px', fontWeight: '500', transition: 'background .2s'}}>Sign out</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', boxSizing: 'border-box' }}>
        
        {/* ── Top row: greeting + stats ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', animation: 'up .4s ease' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.025em', marginBottom: '4px' }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ color: '#6B6B7B', fontSize: '14px' }}>
              {completed.length === 0 ? 'Start your first interview to see your stats here.' : `${completed.length} interview${completed.length !== 1 ? 's' : ''} completed · Keep going!`}
            </p>
          </div>
          {completed.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { l: 'Total', v: completed.length },
                { l: 'Avg Score', v: avgScore ? `${avgScore}` : '—' },
                { l: 'Best', v: bestScore ? `${bestScore}` : '—' },
              ].map(s => (
                <div key={s.l} style={{ background: '#fff', border: '1px solid #E4E4EC', borderRadius: '12px', padding: '10px 14px', textAlign: 'center', minWidth: '70px', flex: '1 1 70px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#9999A8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>{s.l}</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-.03em' }}>{s.v}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Grid / Column Layout ── */}
        <div className="dash-main-layout" style={{ alignItems: 'start' }}>

          {/* ────── LEFT: Start Interview ────── */}
          <div className="dash-card" style={{ width: '100%', animation: 'up .45s ease .05s both' }}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F0F0F8' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>Start an Interview</h2>
              <p style={{ fontSize: '13px', color: '#6B6B7B' }}>Choose your session type and configure it below</p>
            </div>

            {/* Mode cards */}
            <div className="mode-cards-grid" style={{ padding: '1.25rem' }}>
              {INTERVIEW_MODES.map(m => {
                const isActive = selectedMode === m.id
                const isLocked = m.isPro && !paymentStatus?.isPaid
                return (
                  <button
                    key={m.id}
                    className={`mcard${isActive ? ' active' : ''}`}
                    onClick={() => { if (isLocked) { navigate('/payment'); return }; setSelectedMode(m.id) }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                      padding: '14px', borderRadius: '12px', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                      border: `2px solid ${isActive ? m.color : '#E4E4EC'}`,
                      background: isActive ? m.colorSoft : '#FAFAFA',
                      transition: 'all .18s ease', position: 'relative', width: '100%', boxSizing: 'border-box'
                    }}
                  >
                    {/* Badge */}
                    {m.badge && (
                      <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, letterSpacing: '.04em', padding: '2px 8px', borderRadius: '999px', background: m.colorSoft, color: m.colorText, border: `1px solid ${m.color}40` }}>
                        {isLocked ? '🔒 Pro' : m.badge}
                      </span>
                    )}
                    {!m.badge && isLocked && (
                      <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '13px' }}>🔒</span>
                    )}
                    <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{m.icon}</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isActive ? m.colorText : '#0D0D0F', marginBottom: '3px' }}>{m.title}</p>
                      <p style={{ fontSize: '11px', color: '#6B6B7B', lineHeight: 1.5 }}>{m.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Dynamic config form */}
            <div style={{ padding: '0 1.25rem 1.5rem', borderTop: '1px solid #F0F0F8', paddingTop: '1.25rem' }}>
              <form onSubmit={handleStartInterview} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>

                {/* Standard / Company */}
                {(selectedMode === 'standard' || selectedMode === 'company') && (
                  <>
                    <div style={fw()}>
                      <label style={ls()}>Target Job Role</label>
                      <select style={is()} value={jobRole} onChange={e => setJobRole(e.target.value)}>
                        <option value="">Select a role…</option>
                        {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div style={fw()}>
                      <label style={ls()}>Company</label>
                      <select style={is()} value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
                        <option value="">Select company…</option>
                        {companies.map(c => <option key={c._id || c} value={c._id || c}>{c.name || c}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {/* Core subjects */}
                {selectedMode === 'core' && (
                  <>
                    <div style={fw()}>
                      <label style={ls()}>Select Subjects <span style={{ fontWeight: 400, color: '#9999A8' }}>({selectedSubjects.length} selected)</span></label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {CORE_SUBJECTS.map(s => {
                          const on = selectedSubjects.includes(s.id)
                          return (
                            <button key={s.id} type="button" className="sc" onClick={() => toggleSubject(s.id)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '6px 12px', borderRadius: '999px', border: '1.5px solid',
                              borderColor: on ? '#4F46E5' : '#E4E4EC',
                              background: on ? '#EEF2FF' : '#fff',
                              color: on ? '#3730A3' : '#6B6B7B',
                              fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all .15s ease', fontFamily: 'inherit',
                            }}>
                              <span style={{ fontSize: '13px' }}>{s.icon}</span>{s.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div style={fw()}>
                      <label style={ls()}>Difficulty</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {DIFFICULTY.map(d => {
                          const on = difficulty === d.key
                          return (
                            <button key={d.key} type="button" onClick={() => setDifficulty(d.key)} style={{
                              flex: 1, padding: '9px', borderRadius: '9px', border: '1.5px solid',
                              borderColor: on ? d.color : '#E4E4EC',
                              background: on ? d.soft : '#fff',
                              color: on ? d.text : '#6B6B7B',
                              fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                            }}>{d.key}</button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Resume */}
                {selectedMode === 'resume' && (
                  !paymentStatus?.isPaid ? (
                    <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔒</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#5B21B6', marginBottom: '5px' }}>Pro Feature</p>
                      <p style={{ fontSize: '13px', color: '#7C3AED', marginBottom: '14px' }}>Resume-based interviews require a Pro plan</p>
                      <button type="button" onClick={() => navigate('/payment')} style={{ background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '999px', padding: '10px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Upgrade to Pro →
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={fw()}>
                        <label style={ls()}>Upload Resume / CV</label>
                        <div onClick={() => resumeRef.current?.click()} style={{
                          border: `2px dashed ${resumeFile ? '#059669' : '#C7D2FE'}`,
                          borderRadius: '11px', padding: '22px', textAlign: 'center', cursor: 'pointer',
                          background: resumeFile ? '#ECFDF5' : '#F9F9FF', transition: 'all .2s',
                        }}>
                          {resumeFile ? (
                            <div>
                              <p style={{ fontSize: '1.5rem', marginBottom: '6px' }}>✅</p>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#065F46' }}>{resumeFile.name}</p>
                              <p style={{ fontSize: '12px', color: '#6B6B7B', marginTop: '2px' }}>Click to change</p>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontSize: '2rem', marginBottom: '6px' }}>📄</p>
                              <p style={{ fontSize: '13px', fontWeight: 500, color: '#4F46E5' }}>Click to upload PDF or DOCX</p>
                              <p style={{ fontSize: '12px', color: '#9999A8', marginTop: '2px' }}>Max 5MB</p>
                            </div>
                          )}
                        </div>
                        <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0] || null)} />
                      </div>
                      <div style={fw()}>
                        <label style={ls()}>Target Job Role</label>
                        <select style={is()} value={resumeJobRole} onChange={e => setResumeJobRole(e.target.value)}>
                          <option value="">Select a role…</option>
                          {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </>
                  )
                )}

                {/* Submit button */}
                {!(selectedMode === 'resume' && !paymentStatus?.isPaid) && (
                  <button type="submit" className="btn-p" disabled={starting} style={{
                    background: starting ? '#818CF8' : mode.color, color: '#fff', border: 'none',
                    borderRadius: '11px', height: '48px', fontSize: '15px', fontWeight: 600,
                    cursor: starting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                    transition: 'all .2s', fontFamily: 'inherit', marginTop: '6px'
                  }}>
                    {starting ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                        Starting your session…
                      </>
                    ) : `Start ${mode.title} →`}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* ────── RIGHT COLUMN ────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>

            {/* Upgrade card */}
            {!paymentStatus?.isPaid && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #DDD6FE', animation: 'up .5s ease .1s both' }}>
                {/* Gradient hero */}
                <div style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#6366F1 55%,#818CF8 100%)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', marginBottom: '6px' }}>Upgrade to Pro</p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>₹499</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginTop: '3px' }}>one-time · lifetime access</p>
                    </div>
                    <span style={{ fontSize: '2.2rem', lineHeight: 1, opacity: .9 }}>✦</span>
                  </div>

                  {/* Feature grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '1.25rem' }}>
                    {['∞ Unlimited interviews', '📄 Resume-based sessions', '📊 Detailed reports', '⚡ Instant AI feedback', '🏆 Priority support', '🎯 All job roles'].map(f => (
                      <div key={f} style={{ fontSize: '12px', color: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>{f}</div>
                    ))}
                  </div>

                  {/* Usage meter */}
                  <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: '10px', padding: '12px', marginBottom: '1rem', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,.8)', marginBottom: '6px' }}>
                      <span>Free plan usage</span>
                      <span>{3 - (paymentStatus?.remainingFree ?? 0)} of 3 used</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,.2)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#fff', borderRadius: '99px', width: `${((3 - (paymentStatus?.remainingFree ?? 0)) / 3) * 100}%`, transition: 'width .5s ease' }} />
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.55)', marginTop: '5px' }}>
                      {(paymentStatus?.remainingFree ?? 0) === 0 ? 'Free limit reached' : `${paymentStatus?.remainingFree} interview${paymentStatus?.remainingFree !== 1 ? 's' : ''} remaining`}
                    </p>
                  </div>

                  <button onClick={() => navigate('/payment')} style={{ width: '100%', background: '#fff', color: '#4F46E5', border: 'none', borderRadius: '10px', height: '44px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .2s' }}>
                    Upgrade Now →
                  </button>
                </div>

                {/* Free vs Pro comparison */}
                <div style={{ background: 'rgba(49,46,103,.95)', padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Feature</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: 'center' }}>Free</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: 'center' }}>Pro</span>
                  </div>
                  {[
                    { feat: 'Interviews', free: '3 total', pro: 'Unlimited' },
                    { feat: 'Resume-based', free: '✗', pro: '✓' },
                    { feat: 'Core subjects', free: '✓', pro: '✓' },
                    { feat: 'Company-specific', free: '✓', pro: '✓' },
                    { feat: 'AI Reports', free: 'Basic', pro: 'Full detail' },
                  ].map(r => (
                    <div key={r.feat} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '6px', fontSize: '12px' }}>
                      <span style={{ color: 'rgba(255,255,255,.7)' }}>{r.feat}</span>
                      <span style={{ textAlign: 'center', color: r.free === '✗' ? '#F87171' : 'rgba(255,255,255,.45)' }}>{r.free}</span>
                      <span style={{ textAlign: 'center', color: '#86EFAC', fontWeight: 600 }}>{r.pro}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pro badge */}
            {paymentStatus?.isPaid && (
              <div style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)', border: '1px solid #A7F3D0', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px', animation: 'up .4s ease both' }}>
                <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>✦</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#065F46', fontSize: '15px' }}>Pro Plan Active</p>
                  <p style={{ fontSize: '13px', color: '#059669' }}>Unlimited interviews · All features unlocked</p>
                </div>
              </div>
            )}

            {/* Interview history */}
            <div className="dash-card" style={{ animation: 'up .5s ease .15s both' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F0F0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Interview History</h2>
                <span style={{ fontSize: '12px', color: '#9999A8', background: '#F3F4F6', padding: '3px 10px', borderRadius: '999px' }}>{interviews.length} sessions</span>
              </div>

              {/* Type filters */}
              {interviews.length > 0 && (
                <div style={{ padding: '10px 1.25rem', borderBottom: '1px solid #F0F0F8', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[{ k: 'all', l: 'All' }, { k: 'standard', l: 'Job Role' }, { k: 'company', l: 'Company' }, { k: 'core', l: 'Core' }, { k: 'resume', l: 'Resume' }].map(f => (
                    <button key={f.k} onClick={() => setHistoryFilter(f.k)} style={{
                      padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                      border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      borderColor: historyFilter === f.k ? '#4F46E5' : '#E4E4EC',
                      background: historyFilter === f.k ? '#EEF2FF' : '#fff',
                      color: historyFilter === f.k ? '#4F46E5' : '#6B6B7B',
                    }}>{f.l}</button>
                  ))}
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</p>
                  <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>No interviews yet</p>
                  <p style={{ fontSize: '13px', color: '#9999A8' }}>{historyFilter === 'all' ? 'Start your first session!' : 'No ' + historyFilter + ' interviews found'}</p>
                </div>
              ) : (
                <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
                  {filteredHistory.map(iv => {
                    const typeIcon = { standard: '💼', company: '🏢', resume: '📄', core: '⚙️' }[iv.type || 'standard'] || '💼'
                    const sc = iv.overallScore
                    const sStyle = sc != null ? scoreBadgeStyle(sc) : { bg: '#F3F4F6', text: '#6B7280' }
                    return (
                      <div key={iv._id} className="hist-row" onClick={() => navigate(`/report/${iv._id}`)} style={{ padding: '11px 1.25rem', borderBottom: '1px solid #F7F7FA', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background .15s' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                          {typeIcon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0D0D0F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                            {iv.jobRole || (iv.subjects?.join(', ')) || 'Interview'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9999A8' }}>
                            {iv.company?.name && `${iv.company.name} · `}
                            {new Date(iv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: sStyle.bg, color: sStyle.text }}>
                            {sc != null ? `${sc}/100` : 'In progress'}
                          </span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9999A8" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helpers
const fw = () => ({ display: 'flex', flexDirection: 'column', gap: '6px' })
const ls = () => ({ fontSize: '13px', fontWeight: 600, color: '#0D0D0F', letterSpacing: '.01em' })
const is = () => ({
  fontFamily: 'inherit', fontSize: '14px', color: '#0D0D0F',
  background: '#fff', border: '1.5px solid #E4E4EC', borderRadius: '9px',
  padding: '0 .875rem', height: '42px', width: '100%', outline: 'none',
  WebkitAppearance: 'none', cursor: 'pointer',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B7B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right .875rem center', paddingRight: '2.5rem',
})
const ob = () => ({
  background: '#88ff9330', border: 'none', borderRadius: '8px',
  padding: '6px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  color: 'rgb(115 255 90)', fontFamily: 'inherit',
})