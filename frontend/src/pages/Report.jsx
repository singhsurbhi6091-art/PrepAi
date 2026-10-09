// src/pages/Report.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import toast, { Toaster } from 'react-hot-toast'
import '@/styles/global.scss'

const ScoreRing = ({ score, size = 120 }) => {
  const r = 46
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="700" fill="var(--ink)">{score}</text>
      <text x="50" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--muted)">/100</text>
    </svg>
  )
}

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/interview/report/${id}`)
      .then(res => setReport(res.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="spinner spinner-dark" style={{ width: '24px', height: '24px' }} />
      <p style={{ color: 'var(--mid)', fontSize: '14px' }}>Loading your report…</p>
    </div>
  )

  if (!report) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: 'var(--mid)' }}>Report not found</p>
      <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
    </div>
  )

  const grade = report.overallScore >= 80 ? { label: 'Excellent', color: 'badge-green' }
    : report.overallScore >= 60 ? { label: 'Good', color: 'badge-amber' }
    : { label: 'Needs work', color: 'badge-red' }

  return (
    <div className="page-bg">
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />

      {/* Navbar */}
      <nav className="navbar">
        <span className="logo">PrepAI</span>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </nav>

      <div className="container-sm" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* Overall score hero */}
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-soft) 0%, #F0EFFE 100%)',
            padding: '2rem 1.5rem'
          }}>
            <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1rem' }}>
              Interview Report
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <ScoreRing score={report.overallScore} size={130} />
            </div>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Overall Performance
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${grade.color}`}>{grade.label}</span>
              <span className="badge badge-accent">{report.jobRole}</span>
              {report.company?.name && <span className="badge badge-gray">{report.company.name}</span>}
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Questions', value: report.qna?.length || 0 },
              { label: 'Avg score', value: `${report.overallScore}/100` },
              { label: 'Date', value: new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '1rem', textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none'
              }}>
                <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{stat.label}</p>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Q&A breakdown */}
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Question breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {report.qna?.map((q, i) => {
            const scoreClass = q.score >= 80 ? 'badge-green' : q.score >= 60 ? 'badge-amber' : 'badge-red'
            return (
              <div key={i} className="card">
                <div className="card-body">
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
                        Q{i + 1}
                      </span>
                      <p style={{ fontWeight: 600, fontSize: '15px', marginTop: '3px', lineHeight: 1.5 }}>{q.question}</p>
                    </div>
                    <span className={`badge ${scoreClass}`} style={{ flexShrink: 0 }}>{q.score}/100</span>
                  </div>

                  {/* Score bar */}
                  <div className="progress-track" style={{ marginBottom: '1rem' }}>
                    <div className="progress-fill" style={{
                      width: `${q.score}%`,
                      background: q.score >= 80 ? 'var(--green)' : q.score >= 60 ? 'var(--amber)' : 'var(--red)'
                    }} />
                  </div>

                  {/* Your answer */}
                  <div style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius-md)',
                    padding: '0.875rem', marginBottom: '0.75rem'
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Your answer
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.6 }}>{q.answer}</p>
                    {q.audioUrl && <audio controls src={q.audioUrl} style={{ width: '100%', marginTop: '10px' }} />}
                    {q.videoUrl && <video controls src={q.videoUrl} style={{ width: '100%', marginTop: '10px', borderRadius: 'var(--radius-sm)' }} />}
                  </div>

                  {/* AI Feedback */}
                  <div style={{
                    background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)',
                    padding: '0.875rem', borderLeft: '3px solid var(--accent)'
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      AI feedback
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--accent-text)', lineHeight: 1.6 }}>{q.feedback}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/dashboard')}>
            Practice again →
          </button>
        </div>
      </div>
    </div>
  )
}