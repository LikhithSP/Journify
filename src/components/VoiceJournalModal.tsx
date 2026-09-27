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
  AlertCircle,
  Tag,
  Plus
} from 'lucide-react';
import { VoiceJournalService } from '../services/voiceJournalService';

const AVAILABLE_MOODS: Array<{ id: 'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious'; label: string; emoji: string }> = [
  { id: 'joyful', label: 'Joyful', emoji: '😊' },
  { id: 'peaceful', label: 'Peaceful', emoji: '😌' },
  { id: 'sad', label: 'Sad', emoji: '😔' },
  { id: 'angry', label: 'Angry', emoji: '😠' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
];

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

  // User-customizable completion fields
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<'joyful' | 'peaceful' | 'sad' | 'angry' | 'anxious' | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);

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
      setTitle('');
      setMood(null);
      setTags([]);
      setNewTagInput('');
      setHasManuallyEditedTitle(false);
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
    setTitle('');
    setMood(null);
    setTags([]);
    setNewTagInput('');
    setHasManuallyEditedTitle(false);
  };

  // Convert Speech Transcript -> Journal Entry
  const handleConvertToJournal = () => {
    let finalAccumulated = '';
    if (timerRef.current) clearInterval(timerRef.current);
    if (voiceServiceRef.current) {
      finalAccumulated = voiceServiceRef.current.stopListening();
    }
    setIsRecording(false);

    const fullText = (finalAccumulated || (transcript + ' ' + interimTranscript)).trim();
    if (!fullText) return;

    const analysis = VoiceJournalService.analyzeTranscript(fullText);

    const finalTitle = title.trim() || analysis.title || 'Voice Journal Entry';
    const finalMood = mood !== null ? mood : analysis.suggestedMood;
    const finalTags = tags.length > 0 ? tags : (analysis.tags.length > 0 ? analysis.tags : ['reflection']);

    onApplyToEditor({
      title: finalTitle,
      contentHtml: analysis.formattedHtml,
      mood: finalMood,
      tags: finalTags,
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

  // Automatically sync suggestions into state as user speaks if they haven't manually modified them yet
  useEffect(() => {
    if (hasContent && !isRecording) {
      if (!hasManuallyEditedTitle && liveAnalysis.title && !title) {
        setTitle(liveAnalysis.title);
      }
      if (mood === null && liveAnalysis.suggestedMood) {
        setMood(liveAnalysis.suggestedMood);
      }
      if (tags.length === 0 && liveAnalysis.tags.length > 0) {
        setTags(liveAnalysis.tags);
      }
    }
  }, [hasContent, isRecording, liveAnalysis.title, liveAnalysis.suggestedMood]);

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

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

          {/* Completion Details: Title, Mood & Tags customization */}
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 text-xs space-y-3.5"
            >
              <div className="flex items-center justify-between text-neutral-900 dark:text-neutral-100 font-semibold border-b border-neutral-200/70 dark:border-neutral-700 pb-2">
                <span className="flex items-center text-xs">
                  <Sparkles size={13} className="mr-1.5 text-amber-500 dark:text-amber-400" />
                  Entry Details
                </span>
                <span className="text-[11px] font-normal text-neutral-500">Customize before saving</span>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 text-[11px]">
                  What should be the title?
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setHasManuallyEditedTitle(true);
                  }}
                  placeholder={liveAnalysis.title || 'Give your entry a title...'}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 transition"
                />
              </div>

              {/* Mood selector */}
              <div className="space-y-1.5">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 text-[11px]">
                  How are you feeling? (Mood)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MOODS.map((m) => {
                    const isSelected = mood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMood(isSelected ? null : m.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition border ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 border-neutral-900 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                  {mood && (
                    <button
                      type="button"
                      onClick={() => setMood(null)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Tags editor */}
              <div className="space-y-1.5">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 text-[11px] flex items-center gap-1">
                  <Tag size={11} className="text-neutral-400" />
                  <span>Tags</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500 transition"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag + Enter"
                      className="px-2 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[11px] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none w-28"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="p-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                      title="Add Tag"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
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
