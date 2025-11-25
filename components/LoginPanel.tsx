
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { voiceService } from '../services/voiceService'; // Import Voice Service
import { UserProfile } from '../types';

interface LoginPanelProps {
  onLogin: (user: UserProfile) => void;
}

const BackArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'OTP'>('LOGIN');
  const [loginTab, setLoginTab] = useState<'USER' | 'ADMIN' | null>(null);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');

  // HELPER: Unlock Audio on any interaction
  const unlockAudio = () => {
    voiceService.init();
  };

  const handleAdminLogin = () => {
    unlockAudio(); // Unlock audio driver
    if (adminId.trim() === 'Chandan' && adminPass.trim() === 'Nexa') {
      const user = storageService.adminLogin();
      onLogin(user);
    } else {
      setError("ACCESS DENIED");
    }
  };

  const handleUserLogin = () => {
    unlockAudio(); // Unlock audio driver
    if (userMobile.length !== 10) {
      setError("INVALID MOBILE NUMBER");
      return;
    }
    const user = storageService.login(userMobile);
    if (user) onLogin(user);
    else setError("USER NOT FOUND");
  };

  const handleSignupStart = () => {
    setError('');
    if (signupMobile.length !== 10 || signupName.length < 3) {
      setError("INVALID DETAILS");
      return;
    }
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(mockOtp);
    setMode('OTP');
  };

  const handleOtpVerify = () => {
    unlockAudio(); // Unlock audio driver
    if (otp === generatedOtp) {
      const user = storageService.signup(signupName, signupMobile);
      onLogin(user);
    } else {
      setError("INVALID OTP CODE");
    }
  };

  const reset = () => {
    setLoginTab(null);
    setMode('LOGIN');
    setError('');
    setOtp('');
  }

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center p-6 bg-grid font-tech text-white overflow-hidden">
      <div className="scanline"></div>
      <div className="vignette"></div>

      <div className="w-full max-w-sm relative z-20">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-futuristic font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 drop-shadow-[0_0_20px_rgba(41,223,255,0.6)]">
            NEXA
          </h1>
          <div className="text-[10px] tracking-[0.6em] text-cyan-600 mt-2 font-bold uppercase animate-pulse">System Access Protocol</div>
        </div>

        {error && (
          <div className="mb-6 text-center text-red-400 text-xs font-mono border border-red-500/50 p-3 bg-red-950/40 tracking-widest">
            [ ERROR: {error} ]
          </div>
        )}

        <div className="backdrop-blur-md border border-cyan-500/20 p-6 md:p-8 relative bg-black/60 shadow-[0_0_30px_rgba(41,223,255,0.05)]">
           {/* Corner Decor */}
           <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
           <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

           {/* --- MAIN SELECTION SCREEN --- */}
           {mode === 'LOGIN' && loginTab === null && (
             <div className="space-y-4">
               <button onClick={() => setLoginTab('USER')} className="w-full bg-cyan-500/10 border border-cyan-500/50 p-4 text-cyan-400 font-bold tracking-[0.2em] hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(41,223,255,0.3)] transition-all">
                 USER ACCESS
               </button>
               <button onClick={() => setLoginTab('ADMIN')} className="w-full bg-red-500/10 border border-red-500/50 p-4 text-red-400 font-bold tracking-[0.2em] hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
                 ADMIN OVERRIDE
               </button>
               <button onClick={() => setMode('SIGNUP')} className="w-full text-xs text-gray-500 hover:text-cyan-300 mt-4 tracking-widest uppercase border-t border-gray-800 pt-4">
                 Register New Identity
               </button>
             </div>
           )}

           {/* --- USER LOGIN --- */}
           {mode === 'LOGIN' && loginTab === 'USER' && (
             <div className="space-y-6 animate-fadeIn">
                <button onClick={reset} className="text-cyan-600 hover:text-cyan-400 mb-2 flex items-center gap-2 text-xs tracking-widest"><BackArrow /> BACK</button>
                <div className="text-cyan-500 text-xs tracking-[0.2em] text-center border-b border-cyan-900 pb-2">USER AUTHENTICATION</div>
                
                <div className="relative">
                    <input className="w-full bg-black/50 border border-cyan-900 p-3 text-cyan-100 outline-none focus:border-cyan-400 placeholder-cyan-900/50 font-mono tracking-widest text-center transition-colors" placeholder="MOBILE NO." value={userMobile} onChange={e => setUserMobile(e.target.value.replace(/\D/g,''))} maxLength={10} />
                </div>
                <button onClick={handleUserLogin} className="w-full bg-cyan-500/10 border border-cyan-500/50 p-4 text-cyan-400 font-bold tracking-[0.3em] hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(41,223,255,0.1)]">INITIALIZE</button>
             </div>
           )}

           {/* --- ADMIN LOGIN --- */}
           {mode === 'LOGIN' && loginTab === 'ADMIN' && (
             <div className="space-y-6 animate-fadeIn">
                <button onClick={reset} className="text-red-600 hover:text-red-400 mb-2 flex items-center gap-2 text-xs tracking-widest"><BackArrow /> BACK</button>
                <div className="text-red-500 text-xs tracking-[0.2em] text-center border-b border-red-900 pb-2">COMMAND AUTHORIZATION</div>

                <input className="w-full bg-black/50 border border-red-900/50 p-3 text-red-100 outline-none focus:border-red-500 placeholder-red-900/50 font-mono tracking-widest text-center" placeholder="ID" value={adminId} onChange={e => setAdminId(e.target.value)} />
                <input type="password" className="w-full bg-black/50 border border-red-900/50 p-3 text-red-100 outline-none focus:border-red-500 placeholder-red-900/50 font-mono tracking-widest text-center" placeholder="KEY" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                <button onClick={handleAdminLogin} className="w-full bg-red-500/10 border border-red-500/50 p-4 text-red-400 font-bold tracking-[0.3em] hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">AUTHENTICATE</button>
             </div>
           )}

           {/* --- SIGNUP --- */}
           {mode === 'SIGNUP' && (
              <div className="space-y-6 animate-fadeIn">
                 <button onClick={reset} className="text-gray-500 hover:text-white mb-2 flex items-center gap-2 text-xs tracking-widest"><BackArrow /> CANCEL</button>
                 <div className="text-cyan-500 text-xs tracking-[0.2em] text-center border-b border-cyan-900 pb-2">IDENTITY REGISTRATION</div>
                 
                 <input className="w-full bg-black/50 border border-cyan-900 p-3 text-white outline-none focus:border-cyan-400 font-mono text-sm tracking-wide" placeholder="FULL DESIGNATION (NAME)" value={signupName} onChange={e => setSignupName(e.target.value)} />
                 <input className="w-full bg-black/50 border border-cyan-900 p-3 text-white outline-none focus:border-cyan-400 font-mono text-sm tracking-wide" placeholder="COMM LINK (MOBILE)" value={signupMobile} onChange={e => setSignupMobile(e.target.value.replace(/\D/g,''))} maxLength={10} />
                 <button onClick={handleSignupStart} className="w-full bg-cyan-500/10 border border-cyan-500/50 p-3 text-cyan-400 font-bold tracking-[0.2em] hover:bg-cyan-500/20">REQUEST OTP</button>
              </div>
           )}

           {/* --- OTP --- */}
           {mode === 'OTP' && (
              <div className="space-y-6 text-center animate-fadeIn">
                <div className="text-cyan-500 text-xs tracking-[0.2em] mb-4">SECURITY VERIFICATION</div>
                
                {/* OTP SIMULATION DISPLAY */}
                <div className="bg-cyan-900/20 border border-cyan-500/30 p-2 mb-4">
                    <p className="text-[10px] text-cyan-300 uppercase tracking-widest mb-1">Incoming Transmission</p>
                    <p className="text-xl font-mono text-white tracking-[0.5em] font-bold">{generatedOtp}</p>
                </div>

                <input className="w-full bg-black border-b-2 border-cyan-400 p-4 text-center text-3xl text-cyan-400 font-futuristic tracking-[0.5em] outline-none focus:bg-cyan-900/10" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} autoFocus placeholder="____" />
                
                <div className="flex gap-4">
                    <button onClick={() => setMode('SIGNUP')} className="flex-1 border border-gray-700 p-3 text-gray-500 text-xs font-bold tracking-[0.1em]">RETRY</button>
                    <button onClick={handleOtpVerify} className="flex-[2] bg-green-500/10 border border-green-500/50 p-3 text-green-400 font-bold tracking-[0.2em] hover:bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">CONFIRM</button>
                </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;
