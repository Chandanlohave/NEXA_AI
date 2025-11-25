export class VoiceService {
  private recognition: any;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    // Safety check for SSR or environments where window is undefined
    if (typeof window === 'undefined') return;

    try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          // Initialize without options to use the device's native sample rate (e.g., 48000Hz)
          this.audioContext = new AudioContextClass();
        }
    } catch (e) {
        console.warn("AudioContext init failed (User interaction usually required first):", e);
    }

    try {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.lang = 'en-IN'; // Hinglish preference
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
        }
    } catch (e) {
        console.warn("SpeechRecognition init failed:", e);
    }
  }

  async playAudio(base64Data: string, onStart: () => void, onEnded: () => void) {
    if (!this.audioContext) {
        // Try to re-init if it failed in constructor (e.g. needs user gesture)
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            this.audioContext = new AudioContextClass();
        } else {
            onEnded();
            return;
        }
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.stopAudio();

    try {
      // Decode Base64 to binary
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      try {
        // Attempt 1: Standard Browser Decoding
        const bufferCopy = bytes.buffer.slice(0);
        audioBuffer = await this.audioContext.decodeAudioData(bufferCopy);
      } catch (decodeError) {
        // Attempt 2: Manual PCM Decoding (Fallback for Raw Gemini Audio)
        audioBuffer = this.pcmToAudioBuffer(bytes, this.audioContext);
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      this.gainNode = this.audioContext.createGain();
      source.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      const duration = audioBuffer.duration;
      
      // 150ms Fade In
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(1, now + 0.15);
      
      // 150ms Fade Out
      if (duration > 0.3) {
        this.gainNode.gain.setValueAtTime(1, now + duration - 0.15);
        this.gainNode.gain.linearRampToValueAtTime(0, now + duration);
      }

      source.onended = onEnded;
      this.currentSource = source;
      
      // Schedule start immediately
      source.start(0);
      
      // Trigger UI start immediately after scheduling
      onStart();
      
    } catch (error) {
      console.error("Audio Playback Fatal Error:", error);
      onEnded();
    }
  }

  // Manual PCM Decoding for raw audio
  private pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): AudioBuffer {
    // Gemini always sends 24000Hz mono.
    // Creating a buffer with 24000Hz on a 48000Hz context is perfectly valid.
    // The browser handles the playback rate conversion automatically.
    const sampleRate = 24000; 
    const numChannels = 1;    
    
    // Calculate 16-bit samples
    const byteLength = data.length;
    // Ensure even length for 16-bit
    const adjustedLength = byteLength % 2 === 0 ? byteLength : byteLength - 1;
    
    const dataView = new DataView(data.buffer, data.byteOffset, adjustedLength);
    const numSamples = adjustedLength / 2;
    
    const buffer = ctx.createBuffer(numChannels, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      // Read Int16 Little Endian
      const sample = dataView.getInt16(i * 2, true);
      // Normalize to Float32 [-1.0, 1.0]
      channelData[i] = sample < 0 ? sample / 32768 : sample / 32767;
    }
    
    return buffer;
  }

  stopAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch(e) {}
      this.currentSource = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) {}
      this.gainNode = null;
    }
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onError: () => void) {
    if (!this.recognition) {
      alert("Speech recognition not supported.");
      onError();
      return;
    }

    try {
        this.recognition.start();
    } catch (e) {
        // Already started
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
        this.recognition.stop();
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return; 
      // console.error("Speech error", event);
      // Silent fail or retry logic can be added here
      onError();
    };
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch(e) {}
    }
  }
}

export const voiceService = new VoiceService();