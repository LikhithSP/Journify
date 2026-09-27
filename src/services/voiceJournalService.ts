/**
 * Voice Journaling Service
 * Web Speech API & MediaRecorder integration
 * Pipeline: Record -> Speech-to-text -> Live Transcript -> Journal Entry
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
}

// Window declaration for cross-browser Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceJournalService {
  private recognition: any = null;
  private isListeningInternal: boolean = false;
  private onResultCallback?: (fullText: string, interim: string) => void;
  private onErrorCallback?: (errorMsg: string) => void;
  private onEndCallback?: () => void;
  private accumulatedTranscript: string = '';

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            this.accumulatedTranscript += (this.accumulatedTranscript.length ? ' ' : '') + result[0].transcript.trim();
          } else {
            interim += result[0].transcript;
          }
        }
        if (this.onResultCallback) {
          this.onResultCallback(this.accumulatedTranscript, interim);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'no-speech') return;
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error === 'not-allowed' 
            ? 'Microphone access denied. Please allow microphone permissions.' 
            : `Voice error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        // Automatically restart if user hasn't explicitly stopped
        if (this.isListeningInternal) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListeningInternal = false;
            if (this.onEndCallback) this.onEndCallback();
          }
        } else {
          if (this.onEndCallback) this.onEndCallback();
        }
      };
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public startListening(
    initialText: string = '',
    onResult: (fullText: string, interim: string) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech Recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return false;
    }

    this.accumulatedTranscript = initialText;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.isListeningInternal = true;

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      if (err.name === 'InvalidStateError') {
        return true;
      }
      onError(err.message || 'Could not start microphone');
      this.isListeningInternal = false;
      return false;
    }
  }

  public stopListening(): string {
    this.isListeningInternal = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    return this.accumulatedTranscript;
  }

  /**
   * Intelligently derives Title, Clean Content paragraphs, and suggested Mood from speech transcript
   */
  public static analyzeTranscript(transcript: string): {
    title: string;
    formattedHtml: string;
    suggestedMood: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null;
    tags: string[];
  } {
    const cleanText = transcript.trim();
    if (!cleanText) {
      return {
        title: 'Voice Note',
        formattedHtml: '<p></p>',
        suggestedMood: null,
        tags: ['voice-note'],
      };
    }

    // Split sentences
    const sentences = cleanText.split(/(?<=[.?!])\s+/).filter(Boolean);
    const firstSentence = sentences[0] || cleanText;
    
    // Auto-generate a title from first sentence up to 7-8 words
    const titleWords = firstSentence.replace(/[.?!,]/g, '').split(/\s+/).slice(0, 7);
    const title = titleWords.join(' ') || 'Voice Journal Note';

    // Group into paragraphs (every 2-3 sentences)
    const paragraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const p = sentences.slice(i, i + 2).join(' ');
      if (p) paragraphs.push(`<p>${p}</p>`);
    }

    if (paragraphs.length === 0) {
      paragraphs.push(`<p>${cleanText}</p>`);
    }

    // Infer mood from common keywords
    const lower = cleanText.toLowerCase();
    let suggestedMood: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null = null;
    if (/\b(happy|excited|joy|great|amazing|love|awesome|proud|grateful|celebrate)\b/.test(lower)) {
      suggestedMood = 'joyful';
    } else if (/\b(calm|relaxed|quiet|peace|serene|chill|meditation|rest)\b/.test(lower)) {
      suggestedMood = 'peaceful';
    } else if (/\b(sad|down|crying|unhappy|depressed|heartbroken|grief|lonely)\b/.test(lower)) {
      suggestedMood = 'sad';
    } else if (/\b(angry|furious|frustrated|annoyed|mad|pissed|hate)\b/.test(lower)) {
      suggestedMood = 'angry';
    } else if (/\b(anxious|nervous|worried|stress|panic|overwhelmed|scared)\b/.test(lower)) {
      suggestedMood = 'anxious';
    }

    // Tag inference
    const tags: string[] = [];
    if (/\b(work|meeting|project|office|job)\b/.test(lower)) tags.push('work');
    if (/\b(idea|inspiration|thought|brainstorm)\b/.test(lower)) tags.push('ideas');
    if (/\b(family|friend|mom|dad|relationship)\b/.test(lower)) tags.push('personal');
    if (suggestedMood) tags.push(suggestedMood);

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      formattedHtml: paragraphs.join(''),
      suggestedMood,
      tags,
    };
  }
}
