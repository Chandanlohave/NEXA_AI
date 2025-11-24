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
  
  const introPlayedRef = useRef(false);

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

  useEffect(() => {
    if (user && !introPlayedRef.current) {
        introPlayedRef.current = true;
        const performIntro = async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const hr = new Date().getHours();
            let greeting = "Good morning";
            if (hr >= 12 && hr < 17) greeting = "Good afternoon";
            if (hr >= 17) greeting = "Good evening";

            let introText = "";
            if (user.role === UserRole.ADMIN) {
                introText = `मैं Nexa हूँ. ${greeting}, Chandan sir. System online.`;
            } else {
                introText = `मैं Nexa हूँ. ${greeting}! System ready.`;
            }
            await speakResponse(introText);
        };
        performIntro();
    }
  }, [user]);

  const speakResponse = async (text: string) => {
    // Generate Audio first
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
          // Don't hide chat immediately so user can read it
        }
      );
    } else {
      // Fallback if audio fails
      setNexaState(NexaState.SPEAKING);
      setCurrentText(text);
      setIsUserText(false);
      setShowChat(true);
      setTimeout(() => {
          setNexaState(NexaState.IDLE);
      }, 3000);
    }
  };

  const toggleMicInteraction = () => {
    // If already active, stop
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
    setCurrentText("Initializing Audio Input...");
    setIsUserText(true);
    setShowChat(true);
    setNexaState(NexaState.LISTENING);

    voiceService.startListening(
      async (text, isFinal) => {
        setCurrentText(text);
        if (isFinal && user) {
          setNexaState(NexaState.THINKING);
          
          const { text: responseText, actionPayload } = await generateTextResponse(text, user);
          
          await speakResponse(responseText);
          
          if (actionPayload.action !== 'NONE') {
             setTimeout(() => {
                intentService.execute(actionPayload);
             }, 1000); 
          }
        }
      },
      () => {
        // On Error / Stop
        setNexaState(NexaState.IDLE);
      }
    );
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setNexaState(NexaState.IDLE);
    setShowChat(false);
    setShowSettings(false);
    introPlayedRef.current = false;
  };

  const deleteUser = (mobile: string) => {
    if (confirm("WARNING: Are you sure you want to delete this user?")) {
        storageService.deleteUser(mobile);
        setAllUsers(prev => prev.filter(u => u.mobile !== mobile));
    }
  };

  const applyAdminSettings = () => {
      setHudSpeed(tempHudSpeed);
      // alert("CONFIGURATION UPDATED");
  };

  if (!user) {
    return <LoginPanel onLogin={(u) => { setUser(u); }} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-black bg-jarvis-grid flex flex-col relative font-sans text-white overflow-hidden transition-colors duration-500">
      
      {/* GLOBAL OVERLAYS */}
      <div className="scanline"></div>
      <div className="vignette"></div>

      {/* --- SETTINGS BUTTON --- */}
      <button 
        onClick={() => { setShowSettings(true); setTempHudSpeed(hudSpeed); }}
        className="absolute top-4 right-4 z-50 text-cyan-500/50 hover:text-cyan-400 p-2 border border-cyan-500/20 bg-black/40 rounded-full backdrop-blur-sm"
      >
        <SettingsIcon />
      </button>

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
           <div className="w-full max-w-sm max-h-[80vh] overflow-y-auto border border-cyan-500/30 bg-black/90 p-6 relative shadow-[0_0_30px_rgba(34,211,238,0.2)] scrollbar-hide">
               <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XIcon /></button>
               
               {/* ADMIN SETTINGS PANEL */}
               {user.role === UserRole.ADMIN ? (
                 <>
                    <h2 className="text-xl font-futuristic text-red-500 mb-6 border-b border-red-900 pb-2">ADMIN CONTROL PANEL</h2>
                    
                    {/* Speed Control */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-red-400 tracking-widest block mb-2">HUD ROTATION SPEED</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="0.1" max="5" step="0.1" 
                                value={tempHudSpeed} 
                                onChange={(e) => setTempHudSpeed(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <span className="font-mono text-red-300 w-8">{tempHudSpeed}x</span>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <button 
                        onClick={applyAdminSettings}
                        className="w-full mb-8 bg-red-500/20 border border-red-500 text-red-400 font-bold p-2 tracking-widest hover:bg-red-500/40"
                    >
                        APPLY CONFIG
                    </button>

                    {/* User Management */}
                    <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3 uppercase">Registered Users Database</h3>
                    <div className="space-y-2 mb-6 max-h-40 overflow-y-auto border border-gray-800 p-2">
                        {allUsers.length === 0 && <p className="text-gray-600 text-xs italic">No users found.</p>}
                        {allUsers.map(u => (
                            <div key={u.mobile} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-800">
                                <div>
                                    <div className="text-xs font-bold text-cyan-400">{u.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">{u.mobile}</div>
                                </div>
                                {u.role !== UserRole.ADMIN && (
                                    <button onClick={() => deleteUser(u.mobile)} className="text-red-900 hover:text-red-500 p-1">
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                 </>
               ) : (
                 /* USER SETTINGS PANEL */
                 <>
                    <h2 className="text-xl font-futuristic text-cyan-400 mb-6 border-b border-cyan-900 pb-2">USER CONFIG</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-tech tracking-widest text-gray-400">
                            <span>IDENTITY</span>
                            <span className="text-white">{user.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-tech tracking-widest text-gray-400">
                            <span>MOBILE</span>
                            <span className="text-white font-mono">{user.mobile}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-tech tracking-widest text-gray-400">
                            <span>ACCESS LEVEL</span>
                            <span className="text-cyan-400">STANDARD</span>
                        </div>
                    </div>
                 </>
               )}
               
               <div className="h-px bg-gray-800 my-4"></div>

               <button 
                 onClick={handleLogout}
                 className="w-full bg-red-900/10 border border-red-900/30 p-3 text-red-800 font-bold tracking-[0.2em] hover:bg-red-900/30 hover:text-red-500 transition-colors"
               >
                 TERMINATE SESSION
               </button>
           </div>
        </div>
      )}

      {/* --- HUD SECTION (TOP 40%) - SCALED DOWN --- */}
      <div className="h-[40%] flex items-center justify-center relative z-10 pt-10 safe-top">
         {/* Reduced scale to 60% on mobile */}
         <div className="scale-60 md:scale-75 transition-transform duration-500">
            <HUD state={nexaState} speed={hudSpeed} />
         </div>
      </div>

      {/* --- CHAT SECTION (MIDDLE 35%) --- */}
      <div className="h-[35%] flex flex-col items-center justify-center w-full px-4 relative z-20">
          <ChatInterface 
            text={currentText} 
            isUser={isUserText} 
            isVisible={showChat} 
            state={nexaState} 
            userRole={user.role}
          />
      </div>

      {/* --- MIC SECTION (BOTTOM 25%) --- */}
      <div className="h-[25%] flex flex-col items-center justify-center relative z-30 pb-8 safe-bottom">
         <HoloMicButton 
            active={nexaState !== NexaState.IDLE} 
            state={nexaState} 
            onClick={toggleMicInteraction}
         />
      </div>

    </div>
  );
}