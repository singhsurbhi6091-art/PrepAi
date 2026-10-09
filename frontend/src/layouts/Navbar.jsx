import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from '@/lib/axios'
import '@/styles/global.scss'
import '@/styles/variables.scss'
import '@/styles/mixins.scss'

export default function Navbar({ paymentStatus }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Global styles */}
      < style > {`
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
      `}</style >

      {/* ── Navbar ── */}
      < nav style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #E4E4EC', height: '60px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
        <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: '1.4rem', color: '#4F46E5', letterSpacing: '-.01em' }}>PrepAI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#9999A8' }}>{user?.name}</span>
          {paymentStatus?.isPaid
            ? <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#ECFDF5', color: '#065F46' }}>✦ Pro</span>
            : <span style={{ fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '999px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>{paymentStatus?.remainingFree ?? 0} free left</span>
          }
          <button onClick={() => navigate('/settings')} style={ob()}>Settings</button>
          <button onClick={async () => { await logout(); navigate('/login') }} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#9999A8', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: '6px' }}>Sign out</button>
        </div>
      </nav >
    </>
  );
}

const ob = () => ({
  background: 'transparent', border: '1px solid #E4E4EC', borderRadius: '8px',
  padding: '6px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
  color: '#0D0D0F', fontFamily: 'inherit',
})