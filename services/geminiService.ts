
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADMIN, SYSTEM_INSTRUCTION_USER } from "../constants";
import { UserProfile, UserRole, ActionPayload } from "../types";

// --- TOOL DEFINITIONS ---

const openAppTool: FunctionDeclaration = {
  name: 'openApp',
  description: 'Opens a specific app on the device. Supported: WhatsApp, YouTube, Instagram, Camera, Chrome, Settings, Phone.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, description: 'The name of the application to open' }
    },
    required: ['appName']
  }
};

const makeCallTool: FunctionDeclaration = {
  name: 'makeCall',
  description: 'Initiates a phone call to a number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      number: { type: Type.STRING, description: 'The phone number to call' }
    },
    required: ['number']
  }
};

const sendWhatsAppTool: FunctionDeclaration = {
  name: 'sendWhatsApp',
  description: 'Sends a WhatsApp message or opens chat.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      number: { type: Type.STRING, description: 'The phone number (optional)' },
      message: { type: Type.STRING, description: 'The message content' }
    },
    required: ['message']
  }
};

const setAlarmTool: FunctionDeclaration = {
  name: 'setAlarm',
  description: 'Sets an alarm for a specific time.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      hour: { type: Type.NUMBER, description: 'Hour in 24-hour format (0-23)' },
      minute: { type: Type.NUMBER, description: 'Minute (0-59)' },
      message: { type: Type.STRING, description: 'Label for the alarm' }
    },
    required: ['hour', 'minute']
  }
};

// Singleton instance, lazy loaded
let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    let apiKey = '';
    // SAFE ENV ACCESS
    try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
    } catch (e) {}

    // Debug for Vercel: Log if key is missing (DO NOT log the actual key)
    if (!apiKey) {
        console.error("NEXA SYSTEM ERROR: API_KEY is missing in environment variables.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
};

export interface GenResponse {
  text: string;
  actionPayload: ActionPayload;
}

export const generateTextResponse = async (prompt: string, user: UserProfile): Promise<GenResponse> => {
  try {
    const ai = getAI();
    
    // 1. Setup Context
    const systemInstruction = user.role === UserRole.ADMIN 
      ? SYSTEM_INSTRUCTION_ADMIN 
      : SYSTEM_INSTRUCTION_USER;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // --- MEMORY INTEGRATION ---
    const recentHistory = user.chatHistory.slice(-15);
    const memoryString = recentHistory.map(msg => 
        `[${msg.sender === 'user' ? 'USER' : 'NEXA'}]: ${msg.text}`
    ).join('\n');

    // CONSTRUCT PROMPT
    const fullPrompt = `
      CONTEXT:
      - Time: ${timeString}, Date: ${dateString}
      - User: ${user.name}
      
      *** MEMORY ***
      ${memoryString || "No previous history."}
      *************

      INPUT: "${prompt}"
    `;

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        tools: [{ functionDeclarations: [openAppTool, makeCallTool, sendWhatsAppTool, setAlarmTool] }],
      },
    });

    // 3. Parse
    let spokenText = response.text || "";
    let actionPayload: ActionPayload = { action: 'NONE' };

    if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
            if (fc.name === 'openApp') actionPayload = { action: 'OPEN_APP', data: fc.args };
            else if (fc.name === 'makeCall') actionPayload = { action: 'CALL', data: fc.args };
            else if (fc.name === 'sendWhatsApp') actionPayload = { action: 'WHATSAPP', data: fc.args };
            else if (fc.name === 'setAlarm') actionPayload = { action: 'ALARM', data: fc.args };
            
            if (actionPayload.action !== 'NONE') break;
        }
    }

    if (!spokenText && actionPayload.action !== 'NONE') {
        spokenText = "Executing command...";
    }

    return { text: spokenText, actionPayload };

  } catch (error) {
    console.error("Gemini Text Error:", error);
    return { text: "Network unreachable. Please check connection.", actionPayload: { action: 'NONE' } };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    
    // PHONETIC FIXES
    const phoneticText = text
       .replace(/Lohave/gi, "लोहवे")
       .replace(/Nexa/gi, "Nexa")
       .replace(/Chandan/gi, "Chandan");

    const modalityAudio = 'AUDIO' as unknown as Modality;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: phoneticText }],
        },
      ],
      config: {
        responseModalities: [modalityAudio], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Soft Female
            },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};
