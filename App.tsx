
import React, { useState, useEffect, useRef } from 'react';
import { NexaState, UserProfile, UserRole } from './types';
import { generateTextResponse, generateSpeech } from './services/geminiService';
import { voiceService } from './services/voiceService';
import { storageService } from './services/storageService';
import { intentService } from './services/intentService';
import HUD from './components/HUD';
import ChatInterface from './components/ChatInterface';
import LoginPanel from './components/LoginPanel';

// --- ICONS ---
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// HOLOGRAPHIC BUTTON
const HoloMicButton = ({ active, state, onClick }: { active: boolean, state: NexaState, onClick: () => void }) => {
  let mainColor = 'text-cyan-400';
  let borderColor = 'border-cyan-500';
  let shadowColor = 'shadow-cyan-500/50';
  
  if (state === NexaState.LISTENING) {
    mainColor = 'text-red-500';
    borderColor = 'border-red-500';
    shadowColor = 'shadow-red-500/50';
  } else if (state === NexaState.THINKING) {
    mainColor = 'text-amber-400';
    borderColor = 'border-amber-400';
    shadowColor = 'shadow-amber-400/50';
  }

  return (
    <button 
      onClick={onClick}
      className={`relative group w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105'} active:scale-95`}
    >
       {/* Background Ripple */}
       <div className={`absolute inset-0 rounded-full border-2 ${borderColor} opacity-30 ${active ? 'animate-ping' : ''}`}></div>
       <div className={`absolute inset-0 rounded-full border ${borderColor} opacity-20 scale-125`}></div>
       
       {/* Main Circle */}
       <div className={`
         relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/60 backdrop-blur-md border-2 ${borderColor}
         flex items-center justify-center ${mainColor} shadow-[0_0_30px_rgba(0,0,0,0.6)] ${shadowColor}
         transition-all duration-300
       `}>
          <MicIcon />
       </div>
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nexaState, setNexaState] = useState<NexaState>(NexaState.IDLE);
  const [currentText, setCurrentText] = useState<string>("");
  const [isUserText, setIsUserText] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hudSpeed, setHudSpeed] = useState(1);
  const [tempHudSpeed, setTempHudSpeed] = useState(1);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [applyStatus, setApplyStatus] = useState<'IDLE' | 'APPLIED'>('IDLE');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const introPlayedRef = useRef(false);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    const savedUser = storageService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Fetch users when Admin settings open
  useEffect(() => {
    if (showSettings && user?.role === UserRole.ADMIN) {
        setAllUsers(storageService.getAllUsers());
    }
  }, [showSettings, user]);

  // --- NEW INTRO LOGIC ---
  useEffect(() => {
    if (user && !introPlayedRef.current) {
        introPlayedRef.current = true;
        const performIntro = async () => {
            // Wait briefly for UI to mount
            await new Promise(resolve => setTimeout(resolve, 800));
            
            let introText = "";
            if (user.role === UserRole.ADMIN) {
                // Short, Cool Intro for Admin
                introText = `Welcome back, Sir. NEXA online.`;
            } else {
                introText = `NEXA is ready. Hello there!`;
            }
            await speakResponse(introText);
        };
        performIntro();
    }
  }, [user]);

  const speakResponse = async (text: string) => {
    // Generate Audio
    const audioData = await generateSpeech(text);
    
    if (audioData) {
      voiceService.playAudio(
        audioData, 
        () => {
          // ON START
          setNexaState(NexaState.SPEAKING);
          setCurrentText(text);
          setIsUserText(false);
          setShowChat(true);
        },
        () => {
          // ON END
          setNexaState(NexaState.IDLE);
          setShowChat(false); 
        }
      );
    } else {
      // Fallback
      setNexaState(NexaState.SPEAKING);
      setCurrentText(text);
      setIsUserText(false);
      setShowChat(true);
      setTimeout(() => {
          setNexaState(NexaState.IDLE);
          setShowChat(false);
      }, 3000);
    }
  };

  const toggleMicInteraction = () => {
    if (nexaState === NexaState.LISTENING) {
       voiceService.stopListening();
       setNexaState(NexaState.IDLE);
       return;
    }
    
    if (nexaState === NexaState.SPEAKING) {
        voiceService.stopAudio();
        setNexaState(NexaState.IDLE);
        return;
    }

    if (nexaState !== NexaState.IDLE) return;

    // Start Listening
    setCurrentText("");
    setIsUserText(true);
    setShowChat(false); // Hide chat while listening for cleaner UI
    setNexaState(NexaState.LISTENING);

    voiceService.startListening(
      async (text, isFinal) => {
        if (isFinal && user) {
            setNexaState(NexaState.THINKING); // Show Thinking Yellow
            setCurrentText(text);
            setIsUserText(true);
            setShowChat(true);
            
            // Generate Response
            const response = await generateTextResponse(text, user);
            
            // Execute Intent
            if (response.actionPayload.action !== 'NONE') {
                intentService.execute(response.actionPayload);
            }
            
            // Speak Response
            await speakResponse(response.text);
            
            // Save to Memory
            storageService.saveChat(user, { text: text, sender: 'user', timestamp: Date.now() });
            storageService.saveChat(user, { text: response.text, sender: 'nexa', timestamp: Date.now() });
        } else {
           // Live transcript (optional update)
        }
      },
      () => {
          setNexaState(NexaState.IDLE);
          setShowChat(false);
      }
    );
  };

  const handleLogin = (u: UserProfile) => {
    setUser(u);
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setNexaState(NexaState.IDLE);
    setShowSettings(false);
    introPlayedRef.current = false;
  };

  const handleApplyConfig = () => {
    setHudSpeed(tempHudSpeed);
    setApplyStatus('APPLIED');
    setTimeout(() => setApplyStatus('IDLE'), 2000);
  };

  const handleDeleteUser = (mobile: string) => {
    if (confirm(`Delete user ${mobile}?`)) {
        storageService.deleteUser(mobile);
        setAllUsers(storageService.getAllUsers());
    }
  };

  if (!user) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  // --- MAIN HUD SCREEN ---
  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-between p-4 bg-transparent safe-area-inset overflow-hidden">
       
       {/* SETTINGS BUTTON */}
       <button 
         onClick={() => setShowSettings(true)}
         className="absolute top-4 right-4 z-40 text-cyan-500 hover:text-cyan-300 opacity-60 hover:opacity-100 transition-opacity"
       >
         <SettingsIcon />
       </button>

       {/* SETTINGS MODAL */}
       {showSettings && (
         <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md bg-nexa-panel border border-cyan-500/30 p-6 shadow-[0_0_50px_rgba(41,223,255,0.1)] relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon /></button>
                
                <h2 className="text-xl font-futuristic text-cyan-400 mb-6 tracking-widest border-b border-cyan-900 pb-2">
                    {user.role === UserRole.ADMIN ? 'ADMIN CONSOLE' : 'USER SETTINGS'}
                </h2>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                   {/* INSTALL APP BUTTON (PWA) */}
                   {installPrompt && (
                       <div className="bg-cyan-900/20 border border-cyan-500/40 p-4 flex items-center justify-between animate-pulse">
                          <div>
                             <div className="text-cyan-300 text-xs font-bold tracking-widest mb-1">SYSTEM UPDATE</div>
                             <div className="text-[10px] text-cyan-500/80">Install NEXA Native App</div>
                          </div>
                          <button 
                             onClick={handleInstallClick}
                             className="bg-cyan-500/20 border border-cyan-500 text-cyan-300 px-3 py-2 text-xs font-bold flex items-center gap-2 hover:bg-cyan-500/40"
                          >
                             <DownloadIcon /> INSTALL
                          </button>
                       </div>
                   )}

                   <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-xs tracking-widest">IDENTITY</div>
                      <div className="text-white font-mono">{user.name}</div>
                   </div>
                   <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-xs tracking-widest">MOBILE</div>
                      <div className="text-white font-mono">{user.mobile}</div>
                   </div>

                   {/* ADMIN CONTROLS */}
                   {user.role === UserRole.ADMIN && (
                     <div className="mt-8 border-t border-cyan-900/50 pt-4 space-y-4">
                        <div className="text-red-400 text-xs font-bold tracking-[0.2em] mb-2">SYSTEM OVERRIDE</div>
                        
                        {/* SPEED CONTROL */}
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] text-cyan-600 uppercase">
                              <span>HUD Rotation Speed</span>
                              <span>{tempHudSpeed.toFixed(1)}x</span>
                           </div>
                           <input 
                             type="range" min="0.2" max="3" step="0.1" 
                             value={tempHudSpeed} 
                             onChange={(e) => setTempHudSpeed(parseFloat(e.target.value))}
                             className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                           />
                        </div>
                        
                        <button 
                           onClick={handleApplyConfig}
                           className={`w-full py-3 text-xs font-bold tracking-[0.2em] border transition-all ${applyStatus === 'APPLIED' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-cyan-900/20 border-cyan-800 text-cyan-500 hover:bg-cyan-900/40 hover:border-cyan-500'}`}
                        >
                           {applyStatus === 'APPLIED' ? 'CONFIGURATION UPDATED' : 'APPLY CONFIG'}
                        </button>

                        {/* USER DB */}
                        <div className="mt-6">
                            <div className="text-[10px] text-gray-500 tracking-widest mb-2">REGISTERED IDENTITIES</div>
                            <div className="space-y-2">
                                {allUsers.map(u => (
                                    <div key={u.mobile} className="flex items-center justify-between bg-black/40 p-2 border border-gray-800">
                                        <div className="text-xs text-gray-300">
                                            <span className="text-cyan-700 mr-2">[{u.role === UserRole.ADMIN ? 'ADM' : 'USR'}]</span>
                                            {u.name}
                                        </div>
                                        {u.role !== UserRole.ADMIN && (
                                            <button onClick={() => handleDeleteUser(u.mobile)} className="text-red-900 hover:text-red-500"><TrashIcon /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                   )}
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full mt-8 bg-red-900/10 border border-red-900/50 text-red-800 hover:text-red-500 hover:bg-red-900/20 py-3 text-xs font-bold tracking-[0.3em] transition-all"
                >
                  TERMINATE SESSION
                </button>
            </div>
         </div>
       )}

       {/* TOP SECTION: HUD (Scaled down for mobile) */}
       <div className="flex-1 w-full flex items-center justify-center relative mt-12 md:mt-0">
          <div className="scale-50 md:scale-100 transform transition-transform duration-500">
             <HUD state={nexaState} speed={hudSpeed} />
          </div>
       </div>

       {/* MIDDLE SECTION: CHAT BUBBLE */}
       <div className="w-full flex justify-center absolute top-[42%] md:top-[45%] left-0 px-6 z-30 pointer-events-none">
          <ChatInterface 
            text={currentText} 
            isUser={isUserText} 
            isVisible={showChat} 
            state={nexaState}
            userRole={user ? user.role : UserRole.USER}
          />
       </div>

       {/* BOTTOM SECTION: MIC (Arc Reactor) */}
       <div className="h-1/4 w-full flex items-center justify-center pb-8">
          <HoloMicButton 
            active={nexaState === NexaState.LISTENING || nexaState === NexaState.SPEAKING} 
            state={nexaState}
            onClick={toggleMicInteraction}
          />
       </div>

    </div>
  );
}
