import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  Square, 
  Sparkles, 
  X, 
  FileText, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { VoiceJournalService } from '../services/voiceJournalService';

interface VoiceJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToEditor: (data: {
    title?: string;
    contentHtml: string;
    mood?: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null;
    tags?: string[];
  }) => void;
}

export default function VoiceJournalModal({
  isOpen,
  onClose,
  onApplyToEditor,
}: VoiceJournalModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 30, 45, 20, 35, 60, 40, 25, 10]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const voiceServiceRef = useRef<VoiceJournalService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveAnimRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize service
  useEffect(() => {
    voiceServiceRef.current = new VoiceJournalService();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
      voiceServiceRef.current?.stopListening();
    };
  }, []);

  // When modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      handleStop();
      setTranscript('');
      setInterimTranscript('');
      setRecordingDuration(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Audio wave animation simulation
  useEffect(() => {
    if (isRecording) {
      waveAnimRef.current = setInterval(() => {
        setAudioLevel([
          Math.floor(Math.random() * 50) + 15,
          Math.floor(Math.random() * 75) + 20,
          Math.floor(Math.random() * 95) + 30,
          Math.floor(Math.random() * 60) + 25,
          Math.floor(Math.random() * 100) + 40,
          Math.floor(Math.random() * 80) + 30,
          Math.floor(Math.random() * 65) + 20,
          Math.floor(Math.random() * 45) + 15,
          Math.floor(Math.random() * 30) + 10,
        ]);
      }, 120);
    } else {
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
      setAudioLevel([15, 20, 25, 20, 30, 25, 20, 15, 10]);
    }

    return () => {
      if (waveAnimRef.current) clearInterval(waveAnimRef.current);
    };
  }, [isRecording]);

  const handleStart = () => {
    if (!voiceServiceRef.current) return;
    setErrorMessage(null);

    const started = voiceServiceRef.current.startListening(
      transcript,
      (fullText, interim) => {
        setTranscript(fullText);
        setInterimTranscript(interim);
      },
      (err) => {
        setErrorMessage(err);
        setIsRecording(false);
      },
      () => {
        // onEnd
      }
    );

    if (started) {
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceServiceRef.current) {
      const finalAccumulated = voiceServiceRef.current.stopListening();
      if (finalAccumulated) setTranscript(finalAccumulated);
    }
    setInterimTranscript('');
    setIsRecording(false);
  };

  const handleClear = () => {
    handleStop();
    setTranscript('');
    setInterimTranscript('');
    setRecordingDuration(0);
  };

  // Convert Speech Transcript -> Journal Entry
  const handleConvertToJournal = () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) return;

    handleStop();
    const analysis = VoiceJournalService.analyzeTranscript(fullText);

    onApplyToEditor({
      title: analysis.title,
      contentHtml: analysis.formattedHtml,
      mood: analysis.suggestedMood,
      tags: analysis.tags,
    });

    onClose();
  };

  // Formatting seconds into mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Live analysis preview
  const liveAnalysis = VoiceJournalService.analyzeTranscript((transcript + ' ' + interimTranscript).trim());
  const hasContent = !!(transcript.trim() || interimTranscript.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
            }`}>
              <Mic size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Voice Journaling
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Speak your thoughts. Real-time speech-to-text converts your voice into structured journal entries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Waveform & Recording Controls Area */}
          <div className="bg-gray-50 dark:bg-neutral-850 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
            {/* Audio Waveform visualization */}
            <div className="flex items-end justify-center space-x-1.5 h-16 mb-4 w-full max-w-xs">
              {audioLevel.map((height, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: `${height}%` }}
                  transition={{ ease: 'easeOut', duration: 0.12 }}
                  className={`w-2.5 rounded-full transition-colors ${
                    isRecording 
                      ? 'bg-gradient-to-t from-red-500 to-amber-500' 
                      : 'bg-gray-300 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="font-mono text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-200 mb-4">
              {formatTime(recordingDuration)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Mic size={16} />
                  <span>{transcript ? 'Resume Recording' : 'Start Recording'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Square size={14} className="fill-current" />
                  <span>Pause / Stop</span>
                </button>
              )}

              {hasContent && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                  title="Reset and clear transcript"
                >
                  <RefreshCw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Live Transcript Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <FileText size={13} className="mr-1.5" />
                Live Transcript
              </span>
              <span>{((transcript + interimTranscript).trim().split(/\s+/).filter(Boolean)).length} words</span>
            </div>

            <div className="min-h-[120px] max-h-[180px] overflow-y-auto p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 text-sm leading-relaxed">
              {transcript || interimTranscript ? (
                <div>
                  <span className="text-gray-900 dark:text-gray-100">{transcript}</span>
                  {interimTranscript && (
                    <span className="text-gray-400 dark:text-gray-500 italic ml-1">
                      {interimTranscript}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 dark:text-gray-500 text-xs italic flex items-center justify-center h-20">
                  {isRecording ? 'Listening... Speak into your microphone' : 'Click "Start Recording" to begin speaking'}
                </div>
              )}
            </div>
          </div>

          {/* AI / Smart Analysis Preview */}
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-2"
            >
              <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 font-semibold">
                <span className="flex items-center">
                  <Sparkles size={13} className="mr-1.5 text-blue-600 dark:text-blue-400" />
                  Smart Journal Extraction Preview
                </span>
              </div>

              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Derived Title: </span>
                  <span>{liveAnalysis.title}</span>
                </div>
                {liveAnalysis.suggestedMood && (
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Detected Mood: </span>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800 font-medium capitalize">
                      {liveAnalysis.suggestedMood}
                    </span>
                  </div>
                )}
                {liveAnalysis.tags.length > 0 && (
                  <div className="flex items-center space-x-1 pt-0.5">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Suggested Tags: </span>
                    {liveAnalysis.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.2 rounded bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-neutral-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!hasContent}
            onClick={handleConvertToJournal}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            <span>Convert to Journal Entry</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
