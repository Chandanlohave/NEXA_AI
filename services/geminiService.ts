import { GoogleGenAI, Modality, FunctionDeclaration, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_ADMIN, SYSTEM_INSTRUCTION_USER } from "../constants";
import { UserProfile, UserRole, ActionPayload } from "../types";

// Safe initialization to prevent "process is not defined" crashes in browser environments
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey });

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

export interface GenResponse {
  text: string;
  actionPayload: ActionPayload;
}

export const generateTextResponse = async (prompt: string, user: UserProfile): Promise<GenResponse> => {
  try {
    // 1. Setup Context
    const systemInstruction = user.role === UserRole.ADMIN 
      ? SYSTEM_INSTRUCTION_ADMIN 
      : SYSTEM_INSTRUCTION_USER;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateString = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const fullPrompt = `
      [CURRENT TIME: ${timeString}]
      [CURRENT DATE: ${dateString}]
      [USER NAME: ${user.name}]
      
      USER INPUT: "${prompt}"
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
    const candidate = response.candidates?.[0];
    let spokenText = "";
    let actionPayload: ActionPayload = { action: 'NONE' };

    // Extract Text parts
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          spokenText += part.text;
        }
      }
    }

    // Extract Function Calls
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.functionCall) {
                const fc = part.functionCall;
                if (fc.name === 'openApp') {
                    actionPayload = { action: 'OPEN_APP', data: fc.args };
                } else if (fc.name === 'makeCall') {
                    actionPayload = { action: 'CALL', data: fc.args };
                } else if (fc.name === 'sendWhatsApp') {
                    actionPayload = { action: 'WHATSAPP', data: fc.args };
                } else if (fc.name === 'setAlarm') {
                    actionPayload = { action: 'ALARM', data: fc.args };
                }
            }
        }
    }

    if (!spokenText && actionPayload.action !== 'NONE') {
        // Fallback text if model only returned tool call
        spokenText = "Okay sir, processing...";
    }

    return { text: spokenText || "System failure.", actionPayload };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
        text: "Sorry, network fluctuate ho raha hai. Dobara boliye.", 
        actionPayload: { action: 'NONE' } 
    };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!text) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
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