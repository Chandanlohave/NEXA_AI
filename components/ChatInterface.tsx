import React, { useState, useEffect } from 'react';
import { NexaState, UserRole } from '../types';

interface ChatInterfaceProps {
  text: string;
  isUser: boolean;
  isVisible: boolean;
  state: NexaState;
  userRole: UserRole;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ text, isUser, isVisible, state, userRole }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  // DYNAMIC COLOR
  let borderColor = 'border-cyan-500/30';
  let textColor = 'text-cyan-400';
  let bgColor = 'bg-cyan-950/20';

  if (state === NexaState.LISTENING) {
     borderColor = 'border-red-500/30';
     textColor = 'text-red-400';
     bgColor = 'bg-red-950/20';
  } else if (state === NexaState.THINKING) {
     borderColor = 'border-amber-500/30';
     textColor = 'text-amber-400';
     bgColor = 'bg-amber-950/20';
  }

  // LABEL LOGIC
  let labelText = 'SYSTEM_LOG';
  if (isUser) {
    labelText = userRole === UserRole.ADMIN ? 'ADMIN_TERMINAL' : 'USER_TERMINAL';
  } else {
    labelText = 'NEXA_RESPONSE';
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

  if (!isVisible && !displayedText) return null;

  return (
    <div className={`
      w-full max-w-sm transition-all duration-300 flex flex-col items-start
      border ${borderColor} ${bgColor} backdrop-blur-sm p-4 rounded-lg relative overflow-hidden
      shadow-[0_0_20px_rgba(0,0,0,0.3)]
    `}>
       {/* Corner Accents */}
       <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${borderColor} opacity-80`}></div>
       <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${borderColor} opacity-80`}></div>
       <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${borderColor} opacity-80`}></div>
       <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${borderColor} opacity-80`}></div>

       {/* Label */}
       <div className={`text-[9px] font-futuristic tracking-[0.3em] uppercase mb-2 opacity-60 w-full border-b ${borderColor} pb-1 flex justify-between`}>
          <span>{labelText}</span>
          <span>{isUser ? '>>' : '<<'}</span>
       </div>

       {/* Main Text */}
       <div className={`
         font-tech font-medium leading-relaxed tracking-wide text-left w-full
         ${isUser 
            ? 'text-base text-white/80 italic' 
            : `text-lg ${textColor} drop-shadow-sm`
         }
       `}>
          {isUser ? `"${displayedText}"` : <span className="typing-cursor">{displayedText}</span>}
       </div>
    </div>
  );
};

export default ChatInterface;