
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

// HOLOGRAPHIC BUTTON
const HoloMicButton = ({ active, state, onStart, onEnd }: { active: boolean, state: NexaState, onStart: () => void, onEnd: () => void }) => {
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
      onMouseDown={onStart}
      onMouseUp={onEnd}
      onTouchStart={onStart}
      onTouchEnd={onEnd}
      className={`relative group w-24 h-24 flex items-center justify-center transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'}`}
    >
       {/* Background Ripple */}
       <div className={`absolute inset-0 rounded-full border-2 ${borderColor} opacity-30 ${active ? 'animate-ping' : ''}`}></div>
       <div className={`absolute inset-0 rounded-full border ${borderColor} opacity-20 scale-125`}></div>
       
       {/* Main Circle */}
       <div className={`
         relative z-10 w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border-2 ${borderColor}
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
  
  const introPlayedRef = useRef(false);
  const longPressTimerRef = useRef<any>(null);

  useEffect(() => {
    const savedUser = storageService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

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
          // ON START: Show Text and UI State
          setNexaState(NexaState.SPEAKING);
          setCurrentText(text);
          setIsUserText(false);
          setShowChat(true);
        },
        () => {
          // ON END: Hide Text
          setNexaState(NexaState.IDLE);
          setShowChat(false);
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
          setShowChat(false);
      }, 3000);
    }
  };

  const startMicInteraction = () => {
    // Long press logic for logout
    longPressTimerRef.current = setTimeout(() => {
       if (window.confirm("CONFIRM SYSTEM SHUTDOWN (LOGOUT)?")) {
         handleLogout();
       }
    }, 2000);

    if (nexaState !== NexaState.IDLE) return;
  };

  const endMicInteraction = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    // If it was a short press and we are not idle, stop everything
    if (nexaState !== NexaState.IDLE) {
       voiceService.stopListening();
       voiceService.stopAudio();
       setNexaState(NexaState.IDLE);
       setShowChat(false);
       return;
    }

    // Start Listening
    setCurrentText("Listening...");
    setIsUserText(true);
    setShowChat(true);
    setNexaState(NexaState.LISTENING);

    voiceService.startListening(
      async (text, isFinal) => {
        setCurrentText(text);
        if (isFinal && user) {
          setNexaState(NexaState.THINKING);
          // Don't show thinking text, keep user text until response is ready
          
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
        setNexaState(NexaState.IDLE);
        setShowChat(false);
      }
    );
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setNexaState(NexaState.IDLE);
    setShowChat(false);
    introPlayedRef.current = false;
  };

  if (!user) {
    return <LoginPanel onLogin={(u) => { setUser(u); }} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-black bg-jarvis-grid flex flex-col relative font-sans text-white overflow-hidden transition-colors duration-500">
      
      {/* GLOBAL OVERLAYS */}
      <div className="scanline"></div>
      <div className="vignette"></div>

      {/* --- HUD SECTION (TOP 40%) --- */}
      <div className="h-[40%] flex items-center justify-center relative z-10 pt-8 safe-top">
         <div className="scale-100">
            <HUD state={nexaState} />
         </div>
      </div>

      {/* --- CHAT SECTION (MIDDLE 35%) --- */}
      <div className="h-[35%] flex flex-col items-center justify-center w-full px-6 relative z-20">
          <ChatInterface text={currentText} isUser={isUserText} isVisible={showChat} state={nexaState} />
      </div>

      {/* --- MIC SECTION (BOTTOM 25%) --- */}
      <div className="h-[25%] flex flex-col items-center justify-center relative z-30 pb-8 safe-bottom">
         <HoloMicButton 
            active={nexaState !== NexaState.IDLE} 
            state={nexaState} 
            onStart={startMicInteraction}
            onEnd={endMicInteraction}
         />
      </div>

    </div>
  );
}
