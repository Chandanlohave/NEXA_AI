
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

// NEW: Futuristic Geometric Mic
const FuturisticMicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" opacity="0.9"/>
    <path d="M19 10a1 1 0 0 0-2 0v1a5 5 0 0 1-10 0v-1a1 1 0 0 0-2 0v1a7 7 0 0 0 6 6.92V21H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-3.08A7 7 0 0 0 19 11v-1Z"/>
    <rect x="11" y="4" width="2" height="6" rx="1" fill="#000" fillOpacity="0.3"/>
  </svg>
);

// Icon for when Nexa is speaking (Waveform)
const AudioWaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M12 3v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M6 8v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 8v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M2 11v2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 11v2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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
const HoloMicButton = ({ state, onClick }: { state: NexaState, onClick: () => void }) => {
  let mainColor = 'text-cyan-400';
  let borderColor = 'border-cyan-500';
  let shadowColor = 'shadow-cyan-500/50';
  let bgEffect = 'bg-black/60';
  let pulseAnimation = '';
  let IconComponent = FuturisticMicIcon;
  
  // STATE: LISTENING (Red, Aggressive Pulse)
  if (state === NexaState.LISTENING) {
    mainColor = 'text-red-500';
    borderColor = 'border-red-500';
    shadowColor = 'shadow-red-500/80';
    bgEffect = 'bg-red-950/30';
    // Ping creates the ripple effect
    pulseAnimation = 'animate-pulse'; 
  } 
  // STATE: THINKING (Amber, Fast Spin/Fade)
  else if (state === NexaState.THINKING) {
    mainColor = 'text-amber-400';
    borderColor = 'border-amber-400';
    shadowColor = 'shadow-amber-400/50';
    bgEffect = 'bg-amber-950/30';
    pulseAnimation = 'animate-pulse duration-75';
  } 
  // STATE: SPEAKING (Cyan, Wave Icon, Pulse)
  else if (state === NexaState.SPEAKING) {
    mainColor = 'text-cyan-300';
    borderColor = 'border-cyan-400';
    shadowColor = 'shadow-cyan-400/60';
    IconComponent = AudioWaveIcon; // Switch to Wave icon
    pulseAnimation = 'animate-bounce'; // Gentle bounce for audio
  }

  return (
    <button 
      onClick={onClick}
      className={`relative group w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all duration-300 active:scale-95`}
    >
       {/* Background Ripple (Only visible when Listening) */}
       {state === NexaState.LISTENING && (
         <div className={`absolute inset-0 rounded-full border-2 ${borderColor} opacity-50 animate-ping`}></div>
       )}

       {/* Outer Static Glow Ring */}
       <div className={`absolute inset-0 rounded-full border ${borderColor} opacity-20 scale-110 transition-colors duration-500`}></div>
       
       {/* Main Circle */}
       <div className={`
         relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full backdrop-blur-md border-2 ${borderColor}
         flex items-center justify-center ${mainColor} shadow-[0_0_30px_rgba(0,0,0,0.6)] ${shadowColor}
         ${bgEffect} transition-all duration-500 ${pulseAnimation}
       `}>
          <IconComponent />
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
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const introPlayedRef = useRef(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Check Login
    const storedUser = storageService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // 2. Check PWA Install Status
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 3. Listen for Install Prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not already installed
      if (!isInstalled) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Listen for Install Completion
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('NEXA System Installed Successfully');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  // --- AUTO INTRO LOGIC ---
  useEffect(() => {
    if (user && !introPlayedRef.current) {
      // Small delay to let UI settle
      const timer = setTimeout(() => {
         const now = new Date();
         const hour = now.getHours();
         let greeting = "Good morning";
         if (hour >= 12 && hour < 17) greeting = "Good afternoon";
         else if (hour >= 17) greeting = "Good evening";

         const userName = user.role === UserRole.ADMIN ? "Chandan" : user.name;
         
         // Intro Text with ENGLISH Name for display
         // "Chandan Lohave" stays in English for display
         const introText = `मैं Nexa हूँ — आपकी Personal AI Assistant, जिसे Chandan Lohave ने design किया है. ${greeting}! लगता है आज आपका mood मेरे जैसा perfect है. बताइए ${userName} sir, मैं आपकी किस प्रकार सहायता कर सकती हूँ?`;
         
         // Set text to UI but DO NOT SHOW yet
         setIsUserText(false);
         setCurrentText(introText);
         setShowChat(false); // Wait for audio start
         setNexaState(NexaState.SPEAKING);

         // Speak
         generateSpeech(introText).then(audio => {
            if (audio) {
                voiceService.playAudio(audio, 
                    () => {
                        // ON START: Show Text and Typewriter
                        setNexaState(NexaState.SPEAKING);
                        setShowChat(true);
                    },
                    () => {
                        setNexaState(NexaState.IDLE);
                        setShowChat(false); // Auto hide after intro
                    }
                );
            } else {
                // If audio fails, just show text briefly
                setNexaState(NexaState.IDLE);
                setShowChat(true);
                setTimeout(() => setShowChat(false), 4000);
            }
         });
         
         introPlayedRef.current = true;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // --- HANDLERS ---
  const handleInstallClick = () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setShowInstallBanner(false);
            }
            setDeferredPrompt(null);
        });
    } else {
        alert("System installation instructions:\n1. Tap browser menu (⋮)\n2. Select 'Install App' or 'Add to Home Screen'");
    }
  };

  const handleMicClick = () => {
    // If Speaking -> Stop Audio (Interruption)
    if (nexaState === NexaState.SPEAKING) {
        voiceService.stopAudio();
        setNexaState(NexaState.IDLE);
        setShowChat(false);
        return;
    }

    // If Listening -> Stop Listening (Cancel)
    if (nexaState === NexaState.LISTENING) {
        voiceService.stopListening();
        setNexaState(NexaState.IDLE);
        return;
    }

    // If Idle -> Start Listening
    setNexaState(NexaState.LISTENING);
    setCurrentText("");
    setShowChat(false);
    
    voiceService.startListening(
        (text, isFinal) => {
            // Show USER text immediately
            setCurrentText(text);
            setIsUserText(true);
            setShowChat(true);
            if (isFinal) {
                handleInteraction(text);
            }
        },
        () => {
            // Error or Stop
            setNexaState(NexaState.IDLE);
            setShowChat(false);
        }
    );
  };

  const handleInteraction = async (inputText: string) => {
    if (!user) return;
    
    // Switch to Thinking
    setNexaState(NexaState.THINKING);
    setShowChat(false); // Hide chat while thinking

    // 1. Save User Message
    storageService.saveChat(user, { text: inputText, sender: 'user', timestamp: Date.now() });
    
    // 2. Generate AI Response
    const response = await generateTextResponse(inputText, user);
    
    // 3. Save AI Message
    storageService.saveChat(user, { text: response.text, sender: 'nexa', timestamp: Date.now() });

    // 4. Update User Context (Memory Sync)
    const updatedUser = storageService.getCurrentUser();
    if (updatedUser) setUser(updatedUser);

    // 5. Update UI Text State (But don't show yet)
    setIsUserText(false);
    setCurrentText(response.text);
    
    // 6. Execute Actions
    if (response.actionPayload.action !== 'NONE') {
        intentService.execute(response.actionPayload);
    }

    // 7. Speak and Show Text
    if (response.text) {
        const audio = await generateSpeech(response.text);
        if (audio) {
            voiceService.playAudio(audio,
                () => {
                    // Audio Started: SHOW TEXT NOW
                    setNexaState(NexaState.SPEAKING);
                    setShowChat(true);
                },
                () => {
                    // Audio Ended
                    setNexaState(NexaState.IDLE);
                    setShowChat(false);
                }
            );
        } else {
            // Fallback if no audio (show text briefly)
            setNexaState(NexaState.IDLE);
            setShowChat(true);
            setTimeout(() => setShowChat(false), 3000);
        }
    } else {
        setNexaState(NexaState.IDLE);
        setShowChat(false);
    }
  };

  const handleLogin = (u: UserProfile) => {
      setUser(u);
      introPlayedRef.current = false; // Reset intro for new login
  };

  const handleLogout = () => {
      storageService.logout();
      setUser(null);
      setShowSettings(false);
      window.location.reload();
  };

  const deleteUser = (mobile: string) => {
     storageService.deleteUser(mobile);
     alert("User Identity Erased.");
     // Force refresh settings UI
     setTempHudSpeed(prev => prev); 
  };

  const applyConfig = () => {
     setHudSpeed(tempHudSpeed);
     const btn = document.getElementById('apply-btn');
     if(btn) {
         const originalText = btn.innerText;
         btn.innerText = "UPDATED";
         btn.style.color = '#4ade80';
         setTimeout(() => {
             btn.innerText = originalText;
             btn.style.color = '';
         }, 1000);
     }
  };

  if (!user) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  // --- MAIN UI ---
  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-tech select-none">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-jarvis-grid opacity-30 pointer-events-none"></div>
      <div className="scanline"></div>
      <div className="vignette"></div>

      {/* --- INSTALL BANNER (Non-Intrusive) --- */}
      {showInstallBanner && !isInstalled && (
        <div className="absolute top-0 left-0 w-full z-50 bg-cyan-900/90 border-b border-cyan-500 text-cyan-100 px-4 py-3 flex justify-between items-center shadow-lg animate-fadeIn backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-black/50 rounded-lg border border-cyan-500/50">
                    <DownloadIcon />
                </div>
                <div>
                    <div className="text-xs font-bold tracking-widest text-cyan-400">SYSTEM UPGRADE AVAILABLE</div>
                    <div className="text-[10px] opacity-80">Install NEXA Protocol for native performance</div>
                </div>
            </div>
            <button 
                onClick={handleInstallClick}
                className="bg-cyan-500 text-black text-xs font-bold px-4 py-2 rounded tracking-widest hover:bg-cyan-400 transition-colors"
            >
                INSTALL
            </button>
        </div>
      )}

      {/* --- SETTINGS BUTTON --- */}
      <div className="absolute top-6 right-6 z-40">
        <button onClick={() => setShowSettings(true)} className="text-cyan-500/50 hover:text-cyan-400 transition-colors p-2">
           <SettingsIcon />
        </button>
      </div>

      {/* --- MAIN LAYOUT (FLEX COLUMN) --- */}
      
      {/* TOP: HUD (40%) */}
      <div className="flex-[0.4] flex items-center justify-center relative">
          <div className={`transition-all duration-500 ${showChat ? 'scale-90' : 'scale-100'} translate-y-8`}>
              <HUD state={nexaState} speed={hudSpeed} />
          </div>
      </div>

      {/* MIDDLE: CHAT (35%) */}
      <div className="flex-[0.35] flex items-start justify-center px-6 relative z-30 pt-4">
         <ChatInterface 
            text={currentText} 
            isUser={isUserText} 
            isVisible={showChat} 
            state={nexaState}
            userRole={user.role}
         />
      </div>

      {/* BOTTOM: MIC (25%) */}
      <div className="flex-[0.25] flex items-center justify-center pb-8 safe-area-inset">
         <HoloMicButton 
            state={nexaState} 
            onClick={handleMicClick} 
         />
      </div>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md border border-cyan-500/30 bg-black/80 p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon /></button>
                
                <h2 className="text-xl font-futuristic text-cyan-400 mb-6 tracking-widest border-b border-cyan-900 pb-2">
                    SYSTEM CONFIG
                </h2>

                <div className="space-y-6">
                    {/* PROFILE */}
                    <div className="bg-cyan-900/10 p-4 border border-cyan-500/20">
                        <div className="text-[10px] text-cyan-600 tracking-[0.2em] mb-1">CURRENT IDENTITY</div>
                        <div className="text-white font-mono text-lg">{user.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">ID: {user.mobile}</div>
                    </div>

                    {/* ADMIN CONTROLS */}
                    {user.role === UserRole.ADMIN && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-red-400 tracking-widest block mb-2">HUD ROTATION VELOCITY</label>
                                <input 
                                    type="range" min="0.5" max="3" step="0.5" 
                                    value={tempHudSpeed} 
                                    onChange={(e) => setTempHudSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-red-500 bg-gray-800 h-1 appearance-none"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                                    <span>SLOW</span>
                                    <span>{tempHudSpeed}x</span>
                                    <span>MAX</span>
                                </div>
                            </div>

                            <button id="apply-btn" onClick={applyConfig} className="w-full border border-red-500/50 text-red-500 py-2 text-xs tracking-[0.2em] hover:bg-red-950/30">
                                APPLY CONFIG
                            </button>

                            <div className="pt-4 border-t border-gray-800">
                                <div className="text-[10px] text-red-600 tracking-[0.2em] mb-3">USER DATABASE</div>
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {storageService.getAllUsers().map(u => (
                                        <div key={u.mobile} className="flex justify-between items-center bg-gray-900 p-2 border-l-2 border-gray-700">
                                            <div>
                                                <div className="text-xs text-gray-300">{u.name}</div>
                                                <div className="text-[10px] text-gray-600">{u.mobile}</div>
                                            </div>
                                            {u.role !== UserRole.ADMIN && (
                                                <button onClick={() => deleteUser(u.mobile)} className="text-red-500 hover:text-red-300 p-1"><TrashIcon /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INSTALL BUTTON */}
                    {deferredPrompt && !isInstalled && (
                        <button onClick={handleInstallClick} className="w-full bg-cyan-500 text-black font-bold py-3 tracking-[0.2em] text-xs hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                            INSTALL SYSTEM (NATIVE)
                        </button>
                    )}

                    {/* LOGOUT */}
                    <button onClick={handleLogout} className="w-full border border-gray-700 text-gray-400 py-3 text-xs tracking-[0.2em] hover:bg-gray-900 hover:text-white mt-4">
                        TERMINATE SESSION
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
