
export class VoiceService {
  private recognition: any;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    // DO NOT initialize AudioContext here. 
    // It causes "Autoplay Policy" blocks on Android/iOS.
    // We wait for init() triggered by a button click.
  }

  // CALL THIS ON USER INTERACTION (Click)
  init() {
    if (typeof window === 'undefined') return;
    
    if (!this.audioContext) {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                console.log("Audio Engine Started:", this.audioContext.state);
            }
        } catch (e) {
            console.warn("Audio Init Error:", e);
        }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
            console.log("Audio Engine Resumed");
        });
    }

    this.initRecognition();
  }

  private initRecognition() {
    try {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition && !this.recognition) {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.lang = 'en-IN'; // Hinglish preference
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
        }
    } catch (e) {
        console.warn("Speech Init Error:", e);
    }
  }

  async playAudio(base64Data: string, onStart: () => void, onEnded: () => void) {
    // 1. Ensure Context Exists
    if (!this.audioContext) {
        this.init(); // Try to lazy init
        if (!this.audioContext) {
            console.error("Audio Context Missing - User interaction needed");
            onEnded();
            return;
        }
    }
    
    // 2. Force Wake Up (Critical for Android)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.error("Could not resume audio context:", e);
      }
    }

    this.stopAudio();

    try {
      // Decode Base64
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      try {
        const bufferCopy = bytes.buffer.slice(0);
        audioBuffer = await this.audioContext.decodeAudioData(bufferCopy);
      } catch (decodeError) {
        console.warn("Standard decode failed, trying PCM fallback...");
        audioBuffer = this.pcmToAudioBuffer(bytes, this.audioContext);
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      this.gainNode = this.audioContext.createGain();
      source.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      const now = this.audioContext.currentTime;
      // Slight Fade In/Out to prevent popping
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(1, now + 0.1);

      source.onended = onEnded;
      this.currentSource = source;
      
      source.start(0);
      onStart();
      
    } catch (error) {
      console.error("Audio Playback Fatal Error:", error);
      onEnded();
    }
  }

  private pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): AudioBuffer {
    // Gemini 2.5 Flash TTS sends 24kHz Mono PCM
    const sampleRate = 24000; 
    const numChannels = 1;    
    const byteLength = data.length;
    const adjustedLength = byteLength % 2 === 0 ? byteLength : byteLength - 1;
    const dataView = new DataView(data.buffer, data.byteOffset, adjustedLength);
    const numSamples = adjustedLength / 2;
    
    const buffer = ctx.createBuffer(numChannels, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const sample = dataView.getInt16(i * 2, true);
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
  }

  startListening(onResult: (text: string, isFinal: boolean) => void, onError: () => void) {
    if (!this.recognition) this.initRecognition();

    if (!this.recognition) {
      alert("Voice input not supported on this browser.");
      onError();
      return;
    }

    try {
        this.recognition.start();
    } catch (e) {
        console.log("Recognition already started");
    }

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) {
        onResult(final, true);
        this.recognition.stop();
      } else if (interim) {
        onResult(interim, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') onError();
    };
  }

  stopListening() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
    }
  }
}

export const voiceService = new VoiceService();
