
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
    // Guidelines: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    let apiKey = '';
    try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
    } catch (e) {
        console.warn("Could not access process.env");
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
    // Retrieve last 15 messages to provide context
    const recentHistory = user.chatHistory.slice(-15);
    const memoryString = recentHistory.map(msg => 
        `[${msg.sender === 'user' ? 'USER' : 'NEXA'}]: ${msg.text}`
    ).join('\n');

    // CONSTRUCT POWERFUL PROMPT
    const fullPrompt = `
      CONTEXT:
      - Current Time: ${timeString}
      - Current Date: ${dateString}
      - User Name: ${user.name}
      
      *** MEMORY (PREVIOUS CONVERSATION) ***
      You MUST use this history to answer questions about what was said before.
      ${memoryString || "No previous conversation history."}
      **************************************

      USER'S LATEST INPUT: "${prompt}"
    `;

    // 2. Call Gemini with Tools
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        tools: [{ functionDeclarations: [openAppTool, makeCallTool, sendWhatsAppTool, setAlarmTool] }],
      },
    });

    // 3. Parse Response
    let spokenText = response.text || "";
    let actionPayload: ActionPayload = { action: 'NONE' };

    if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
            if (fc.name === 'openApp') {
                actionPayload = { action: 'OPEN_APP', data: fc.args };
            } else if (fc.name === 'makeCall') {
                actionPayload = { action: 'CALL', data: fc.args };
            } else if (fc.name === 'sendWhatsApp') {
                actionPayload = { action: 'WHATSAPP', data: fc.args };
            } else if (fc.name === 'setAlarm') {
                actionPayload = { action: 'ALARM', data: fc.args };
            }
            if (actionPayload.action !== 'NONE') break;
        }
    }

    if (!spokenText && actionPayload.action !== 'NONE') {
        spokenText = "Processing command...";
    }

    return { text: spokenText, actionPayload };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "I'm having trouble connecting to the network.", actionPayload: { action: 'NONE' } };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = getAI();
    
    // PHONETIC REPLACEMENT for clearer Hindi/English mix
    const phoneticText = text
       .replace(/Lohave/gi, "लोहवे") // Force correct pronunciation
       .replace(/Nexa/gi, "Nexa")
       .replace(/Chandan/gi, "Chandan");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: phoneticText }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Kore is soft/female-like
            },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
