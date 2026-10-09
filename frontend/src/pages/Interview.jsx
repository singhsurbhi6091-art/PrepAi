// src/pages/Interview.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/axios'
import toast, { Toaster } from 'react-hot-toast'
import '@/styles/global.scss'

const ModeBtn = ({ mode, current, icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '10px 8px', border: `2px solid ${current === mode ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', background: current === mode ? 'var(--accent-soft)' : 'var(--white)',
      cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit'
    }}
  >
    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</span>
    <span style={{ fontSize: '12px', fontWeight: 600, color: current === mode ? 'var(--accent-text)' : 'var(--mid)' }}>{label}</span>
  </button>
)

export default function Interview() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [questions] = useState(location.state?.questions || [])
  const [jobRole] = useState(location.state?.jobRole || '')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerMode, setAnswerMode] = useState('text')
  const [textAnswer, setTextAnswer] = useState('')
  const [recording, setRecording] = useState(false)
  const [mediaBlob, setMediaBlob] = useState(null)
  const [mediaMimeType, setMediaMimeType] = useState('')
  const [mediaUrl, setMediaUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState([])
  const [completed, setCompleted] = useState(false)
  const [muted, setMuted] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const liveVideoRef = useRef(null)
  const timerRef = useRef(null)

  const currentQuestion = questions[currentIndex]
  const progress = Math.round((currentIndex / questions.length) * 100)

  const speakQuestion = (text) => {
    if (muted) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1
    window.speechSynthesis.speak(u)
  }

  useEffect(() => {
    if (currentQuestion?.question) speakQuestion(currentQuestion.question)
    return () => window.speechSynthesis.cancel()
  }, [currentIndex, muted])

  useEffect(() => {
    return () => { if (mediaUrl) URL.revokeObjectURL(mediaUrl) }
  }, [mediaUrl])

  useEffect(() => {
    if (recording) {
      setRecordingTime(0)
      console.log(recording);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startRecording = async () => {
    try {
      if (mediaUrl) { URL.revokeObjectURL(mediaUrl); setMediaUrl(null) }
      setMediaBlob(null)
      const constraints = answerMode === 'video'
        ? { video: { facingMode: 'user' }, audio: true } : { audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (answerMode === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream
        liveVideoRef.current.play()
      }
      chunksRef.current = []
      let mimeType = ''
      if (answerMode === 'video') {
        mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm'
      } else {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
          : MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      }
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setMediaBlob(blob); setMediaMimeType(mimeType); setMediaUrl(URL.createObjectURL(blob))
      }
      mr.start(100)
      setRecording(true)
    } catch { toast.error('Microphone/camera access denied') }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    setRecording(false)
  }

  const resetRecording = () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl)
    setMediaBlob(null); setMediaUrl(null); setMediaMimeType('')
  }

  const handleSubmit = async () => {
    if (answerMode === 'text' && !textAnswer.trim()) return toast.error('Please enter your answer')
    if ((answerMode === 'audio' || answerMode === 'video') && !mediaBlob) return toast.error('Please record first')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('interviewId', id)
      fd.append('questionIndex', String(currentIndex))
      if (answerMode === 'text') fd.append('answer', textAnswer)
      else if (answerMode === 'audio') fd.append('audio', mediaBlob, `answer.${mediaMimeType.includes('mp4') ? 'mp4' : 'webm'}`)
      else fd.append('video', mediaBlob, `answer.${mediaMimeType.includes('mp4') ? 'mp4' : 'webm'}`)
      const res = await api.post('/interview/answer', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setScores(prev => [...prev, { index: currentIndex, score: res.data.score, feedback: res.data.feedback }])
      toast.success(`Scored ${res.data.score}/100`)
      if (res.data.interviewStatus === 'completed') {
        setCompleted(true)
        setTimeout(() => navigate(`/report/${id}`), 2500)
      } else {
        setCurrentIndex(prev => prev + 1)
        setTextAnswer('')
        resetRecording()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (completed) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: '1rem',
      background: 'var(--surface)'
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'var(--green-soft)', border: '2px solid #A7F3D0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
      }}>🎉</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Interview complete!</h2>
      <p style={{ color: 'var(--mid)', fontSize: '14px' }}>Generating your report…</p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div className="spinner spinner-dark" />
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Redirecting…</span>
      </div>
    </div>
  )

  return (
    <div className="page-bg">
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />

      {/* Top bar */}
      <div style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '0 1.25rem', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <span className="logo" style={{ fontSize: '1.2rem' }}>PrepAI</span>
        <div style={{ flex: 1, maxWidth: '300px', margin: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          onClick={() => { if (!muted) window.speechSynthesis.cancel(); setMuted(!muted) }}
          className="btn btn-outline btn-sm"
          style={{ padding: '0 10px', gap: '4px' }}
        >
          {muted
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" /><path d="M19.07 4.93a10 10 0 010 14.14" /></svg>
          }
          {muted ? 'Muted' : 'Audio'}
        </button>
      </div>

      <div className="container-sm" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>

        {/* Question card */}
        <div className="card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--accent)' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                Question {currentIndex + 1}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>· {jobRole}</span>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, color: 'var(--ink)' }}>
              {currentQuestion?.question}
            </p>
          </div>
        </div>

        {/* Answer mode selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <ModeBtn mode="text" current={answerMode} icon="✏️" label="Text" onClick={() => { setAnswerMode('text'); resetRecording() }} />
          <ModeBtn mode="audio" current={answerMode} icon="🎙" label="Audio" onClick={() => { setAnswerMode('audio'); resetRecording() }} />
          <ModeBtn mode="video" current={answerMode} icon="🎥" label="Video" onClick={() => { setAnswerMode('video'); resetRecording() }} />
        </div>

        {/* Answer area */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-body">

            {/* TEXT */}
            {answerMode === 'text' && (
              <div>
                <label className="label" style={{ marginBottom: '8px', display: 'block' }}>Your answer</label>
                <textarea
                  className="textarea"
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here. Be clear and specific — mention examples where relevant."
                  rows={7}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{textAnswer.length} chars</span>
                </div>
              </div>
            )}

            {/* AUDIO */}
            {answerMode === 'audio' && (
              <div>
                {!recording && !mediaUrl && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'var(--accent-soft)', margin: '0 auto 1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                    }}>🎙</div>
                    <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1rem' }}>Tap to start recording your spoken answer</p>
                    <button className="btn btn-primary" onClick={startRecording} style={{ minWidth: '160px' }}>Start recording</button>
                  </div>
                )}

                {recording && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', background: 'var(--red-soft)',
                      margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div className="pulse" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--red)' }} />
                    </div>
                    <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Recording</p>
                    <p style={{ color: 'var(--mid)', fontSize: '13px', fontFamily: 'monospace', marginBottom: '1rem' }}>{formatTime(recordingTime)}</p>
                    <button className="btn btn-danger" onClick={stopRecording} style={{ minWidth: '160px' }}>Stop recording</button>
                  </div>
                )}

                {!recording && mediaUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500 }}>Preview your recording</p>
                    <audio controls src={mediaUrl} style={{ width: '100%' }} />
                    <button className="btn btn-outline btn-sm" onClick={resetRecording}>Re-record</button>
                  </div>
                )}
              </div>
            )}

            {/* VIDEO */}
            {answerMode === 'video' && (
              <div>
                <div style={{ display: recording ? 'block' : 'none' }}>
                  <video
                    ref={liveVideoRef} autoPlay muted playsInline
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', background: '#000', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>REC {formatTime(recordingTime)}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={stopRecording}>Stop</button>
                  </div>
                </div>

                {!recording && !mediaUrl && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: 'var(--accent-soft)', margin: '0 auto 1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                    }}>🎥</div>
                    <p style={{ color: 'var(--mid)', fontSize: '14px', marginBottom: '1rem' }}>Record a video answer — make sure your camera is ready</p>
                    <button className="btn btn-primary" onClick={startRecording} style={{ minWidth: '160px' }}>Start video</button>
                  </div>
                )}

                {!recording && mediaUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 500 }}>Preview your recording</p>
                    <video controls src={mediaUrl} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                    <button className="btn btn-outline btn-sm" onClick={resetRecording}>Re-record</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginBottom: '1.5rem' }}
        >
          {submitting
            ? <><span className="spinner" />Evaluating…</>
            : currentIndex === questions.length - 1 ? 'Submit final answer' : `Submit & next →`
          }
        </button>

        {/* Previous scores */}
        {scores.length > 0 && (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Previous answers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scores.map((s, i) => (
                <div key={i} className="card">
                  <div className="card-body" style={{ padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>Question {s.index + 1}</p>
                      <p style={{ fontSize: '12px', color: 'var(--mid)', lineHeight: 1.5 }}>{s.feedback}</p>
                    </div>
                    <span className={`badge ${s.score >= 80 ? 'badge-green' : s.score >= 60 ? 'badge-amber' : 'badge-red'}`} style={{ flexShrink: 0 }}>
                      {s.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}