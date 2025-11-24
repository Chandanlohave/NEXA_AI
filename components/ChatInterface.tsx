
import React, { useState, useEffect } from 'react';
import { NexaState } from '../types';

interface ChatInterfaceProps {
  text: string;
  isUser: boolean;
  isVisible: boolean;
  state: NexaState;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ text, isUser, isVisible, state }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  // DYNAMIC COLOR
  let textColor = 'text-cyan-400';
  let glowEffect = 'drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]'; // Increased Glow

  if (state === NexaState.LISTENING) {
     textColor = 'text-red-500';
     glowEffect = 'drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]';
  } else if (state === NexaState.THINKING) {
     textColor = 'text-amber-400';
     glowEffect = 'drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]';
  }

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText('');
      return;
    }
    
    // IF USER: Show text instantly
    if (isUser) {
      setDisplayedText(text);
    } 
    // IF NEXA: Typewriter Effect
    else {
      setDisplayedText('');
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText((prev) => text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(intervalId);
      }, 30); // Type speed
      return () => clearInterval(intervalId);
    }
  }, [text, isUser, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-md text-center pointer-events-none transition-all duration-300 flex flex-col items-center justify-center">
       
       {/* Label */}
       <div className={`text-[10px] font-futuristic tracking-[0.4em] uppercase mb-4 opacity-70 border-b border-opacity-40 pb-1 ${textColor} border-current inline-block`}>
          {isUser ? 'AUDIO_INPUT' : 'NEXA_LOG'}
       </div>

       {/* Main Text */}
       <div className={`
         font-tech font-medium leading-relaxed tracking-wider transition-all
         ${isUser 
            ? 'text-lg text-white/90 italic' 
            : `text-xl md:text-2xl ${textColor} ${glowEffect}`
         }
       `}>
          {isUser ? `"${displayedText}"` : <span className="typing-cursor">{displayedText}</span>}
       </div>
    </div>
  );
};

export default ChatInterface;
