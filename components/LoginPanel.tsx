import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';

interface LoginPanelProps {
  onLogin: (user: UserProfile) => void;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'OTP'>('LOGIN');
  const [loginTab, setLoginTab] = useState<'USER' | 'ADMIN'>('USER');
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = () => {
    if (adminId.trim() === 'Chandan' && adminPass.trim() === 'Nexa') {
      const user = storageService.adminLogin();
      onLogin(user);
    } else {
      setError("ACCESS DENIED");
    }
  };

  const handleUserLogin = () => {
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
    setTimeout(() => alert(`NEXA SECURE OTP: ${mockOtp}`), 500);
  };

  const handleOtpVerify = () => {
    if (otp === generatedOtp) {
      const user = storageService.signup(signupName, signupMobile);
      onLogin(user);
    } else {
      setError("INVALID OTP");
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center p-6 bg-grid font-tech text-white overflow-hidden">
      <div className="scanline"></div>
      <div className="vignette"></div>

      <div className="w-full max-w-sm relative z-20">
        <div className="text-center mb-10">
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

        <div className="backdrop-blur-md border border-cyan-500/20 p-8 relative bg-black/60 shadow-[0_0_30px_rgba(41,223,255,0.05)]">
           {/* Corner Decor */}
           <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
           <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

           {mode === 'LOGIN' && (
             <>
               <div className="flex mb-8 text-xs font-bold tracking-[0.2em]">
                 <button onClick={() => {setLoginTab('USER'); setError('');}} className={`flex-1 pb-3 border-b-2 transition-all ${loginTab === 'USER' ? 'border-cyan-400 text-cyan-400' : 'border-gray-800 text-gray-600'}`}>USER</button>
                 <button onClick={() => {setLoginTab('ADMIN'); setError('');}} className={`flex-1 pb-3 border-b-2 transition-all ${loginTab === 'ADMIN' ? 'border-red-500 text-red-500' : 'border-gray-800 text-gray-600'}`}>ADMIN</button>
               </div>

               {loginTab === 'USER' ? (
                 <div className="space-y-6">
                    <div className="relative">
                        <input className="w-full bg-black/50 border border-cyan-900 p-3 text-cyan-100 outline-none focus:border-cyan-400 placeholder-cyan-900/50 font-mono tracking-widest text-center transition-colors" placeholder="MOBILE NO." value={userMobile} onChange={e => setUserMobile(e.target.value.replace(/\D/g,''))} maxLength={10} />
                        <div className="absolute right-3 top-3 text-cyan-700 text-xs animate-pulse">●</div>
                    </div>
                    <button onClick={handleUserLogin} className="w-full bg-cyan-500/10 border border-cyan-500/50 p-4 text-cyan-400 font-bold tracking-[0.3em] hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(41,223,255,0.3)] transition-all">INITIALIZE</button>
                    <button onClick={() => setMode('SIGNUP')} className="w-full text-[10px] text-gray-500 hover:text-cyan-300 mt-2 tracking-widest uppercase">Register New Identity</button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <input className="w-full bg-black/50 border border-red-900/50 p-3 text-red-100 outline-none focus:border-red-500 placeholder-red-900/50 font-mono tracking-widest text-center" placeholder="ADMIN ID" value={adminId} onChange={e => setAdminId(e.target.value)} />
                    <input type="password" className="w-full bg-black/50 border border-red-900/50 p-3 text-red-100 outline-none focus:border-red-500 placeholder-red-900/50 font-mono tracking-widest text-center" placeholder="PASSWORD" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                    <button onClick={handleAdminLogin} className="w-full bg-red-500/10 border border-red-500/50 p-4 text-red-400 font-bold tracking-[0.3em] hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">AUTHENTICATE</button>
                 </div>
               )}
             </>
           )}

           {mode === 'SIGNUP' && (
              <div className="space-y-6">
                 <div className="text-cyan-500 text-xs tracking-[0.2em] text-center mb-6 border-b border-cyan-900 pb-2">IDENTITY REGISTRATION</div>
                 <input className="w-full bg-black/50 border border-cyan-900 p-3 text-white outline-none focus:border-cyan-400 font-mono text-sm tracking-wide" placeholder="FULL DESIGNATION (NAME)" value={signupName} onChange={e => setSignupName(e.target.value)} />
                 <input className="w-full bg-black/50 border border-cyan-900 p-3 text-white outline-none focus:border-cyan-400 font-mono text-sm tracking-wide" placeholder="COMM LINK (MOBILE)" value={signupMobile} onChange={e => setSignupMobile(e.target.value.replace(/\D/g,''))} maxLength={10} />
                 <button onClick={handleSignupStart} className="w-full bg-cyan-500/10 border border-cyan-500/50 p-3 text-cyan-400 font-bold tracking-[0.2em] hover:bg-cyan-500/20">REQUEST OTP</button>
                 <button onClick={() => setMode('LOGIN')} className="w-full text-[10px] text-gray-500 hover:text-white tracking-widest">ABORT</button>
              </div>
           )}

           {mode === 'OTP' && (
              <div className="space-y-6 text-center">
                <div className="text-cyan-500 text-xs tracking-[0.2em] mb-4">SECURITY VERIFICATION</div>
                <input className="w-full bg-black border-b-2 border-cyan-400 p-4 text-center text-3xl text-cyan-400 font-futuristic tracking-[0.5em] outline-none focus:bg-cyan-900/10" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} autoFocus placeholder="____" />
                <button onClick={handleOtpVerify} className="w-full bg-green-500/10 border border-green-500/50 p-3 text-green-400 font-bold tracking-[0.2em] hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">CONFIRM</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;