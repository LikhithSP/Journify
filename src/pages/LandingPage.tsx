import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Mic, Calendar, Shield, Zap,
  ArrowRight, Check, ChevronDown, Moon, Sun, Sparkles, Lock, Star
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HERO_IMAGE_URL = 'https://framerusercontent.com/images/pC6wv63RktJx8IvHALRzmZ2K90.webp?width=2454&height=2877';

const FEATURES = [
  {
    icon: <BookOpen size={20} />,
    title: 'A Sanctuary for Your Words',
    desc: 'Distraction-free Markdown editor with typography designed for timeless clarity.',
    badge: 'Crafted Focus',
  },
  {
    icon: <Mic size={20} />,
    title: 'Voice Thought Capture',
    desc: 'Speak freely. AI transcribes, parses moods, and formats reflections into thoughtful prose.',
    badge: 'Speech to Prose',
  },
  {
    icon: <Calendar size={20} />,
    title: 'Calendar & Arc of Reflection',
    desc: 'See your psychological timeline unfold across months with streak rituals and mood arcs.',
    badge: 'Retrospective',
  },
  {
    icon: <Shield size={20} />,
    title: 'End-to-End Sanctity',
    desc: 'Your thoughts belong solely to you. Zero telemetry, local-first offline encryption.',
    badge: 'Vault Privacy',
  },
  {
    icon: <Zap size={20} />,
    title: 'Offline-First Resilience',
    desc: 'Write on mountains, flights, or off-grid. Instant local cache syncs smoothly when reconnected.',
    badge: 'PWA & Offline',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'Notion-Style Organization',
    desc: 'Hierarchical folders, tags, pinboards, and interactive fan-spread showcases.',
    badge: 'System Architecture',
  },
];

const TESTIMONIALS = [
  {
    id: 't-1',
    quote: "I used to lose my best ideas while walking my dog or driving to work. Now I just tap the red voice button, talk naturally, and Journify formats it into clean notes with mood tags before I even get home.",
    name: "Marcus Vance",
    role: "Product Designer & Daily Journaler",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    tag: "Voice Journaling",
    date: "Sep 14, 2026",
    mood: "😊",
    words: 420,
    rating: 5,
  },
  {
    id: 't-2',
    quote: "The 3x3 tables, clean Markdown shortcuts, and image attachments give me a real digital sketchbook feel. It replaced Apple Notes and Day One for me completely.",
    name: "Aaliyah Chen",
    role: "Freelance Illustrator",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    tag: "Rich Formatting",
    date: "Sep 16, 2026",
    mood: "😌",
    words: 310,
    rating: 5,
  },
  {
    id: 't-3',
    quote: "Knowing all my entries are encrypted locally on my laptop first via IndexedDB with zero tracking telemetry is what made me comfortable writing raw, honest thoughts again.",
    name: "Devon Brooks",
    role: "Software Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    tag: "Vault Privacy",
    date: "Sep 17, 2026",
    mood: "💡",
    words: 580,
    rating: 5,
  },
  {
    id: 't-4',
    quote: "The calendar heatmap and streak tracker keep me consistent without guilt. Seeing 45 consecutive days logged makes me feel so proud of my self-reflection habit.",
    name: "Maya Lindqvist",
    role: "Clinical Psychologist",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    tag: "Streak Rituals",
    date: "Sep 18, 2026",
    mood: "🔥",
    words: 290,
    rating: 5,
  },
  {
    id: 't-5',
    quote: "I wrote three long entries on an 11-hour flight with zero Wi-Fi. The moment my phone landed and connected to airport 5G, everything synced to cloud storage without a hitch.",
    name: "Liam O'Connor",
    role: "Travel Writer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    tag: "Offline First",
    date: "Sep 18, 2026",
    mood: "✨",
    words: 512,
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Free Sanctuary',
    price: '$0',
    period: 'free forever',
    description: 'A complete, private offline-first journaling sanctuary for daily reflection.',
    features: [
      'Unlimited journal entries & local drafts',
      'Distraction-free Markdown & 3x3 table editor',
      'Speech-to-text voice journaling',
      'Interactive Calendar & day streak tracking',
      'Offline-first PWA with local IndexedDB encryption',
      'Rich image attachments & tag organization',
      'One-click JSON & Markdown privacy exports',
    ],
    cta: 'Start Journaling Free',
    highlight: false,
    badge: 'Core Free',
  },
  {
    name: 'Journify Pro',
    price: '$5',
    period: 'per month',
    description: 'For writers, thinkers, and builders who want unlimited cloud power and advanced insights.',
    features: [
      'Everything in Free Sanctuary',
      'Unlimited encrypted cloud storage & sync',
      'Advanced mood tracking & sentiment reports',
      'Extended 30-day version history rollbacks',
      'Priority bidirectional multi-device synchronization',
      'Unlimited AI speech-to-prose transcriptions',
      'VIP badge & early access to new features',
    ],
    cta: 'Upgrade to Pro ($5/mo)',
    highlight: true,
    badge: '20% Off Annual',
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does Journify protect my privacy?',
      a: 'All entries are encrypted and stored locally on your device via IndexedDB first. When cloud synchronization is active, entries are encrypted with your credentials before transmission to secure Supabase storage.',
    },
    {
      q: 'Can I write while offline or on an airplane?',
      a: 'Yes. Journify is engineered with offline-first PWA architecture. You can launch, read, and compose entries completely disconnected. Once online, the SyncEngine automatically synchronizes your changes.',
    },
    {
      q: 'How does Voice Journaling work?',
      a: 'Click the record microphone button and speak your reflections aloud. Journify records high-fidelity audio, transcribes it via browser or neural speech recognition, and auto-formats it with mood tags.',
    },
    {
      q: 'Can I export my journal data anytime?',
      a: 'Yes. In the Privacy Center, you have one-click complete export in both human-readable Markdown and structured JSON. You own every word.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#111113] text-[#1c1c1c] dark:text-[#f0f0f0] selection:bg-[#0066ff]/20 overflow-x-hidden font-sans">
      
      {/* ── Modern Rounded Floating Navbar ── */}
      <header className="fixed top-3 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-full bg-white/80 dark:bg-[#151518]/80 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg shadow-black/[0.04] dark:shadow-black/20 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between pointer-events-auto transition-all"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-black transition-transform group-hover:scale-105">
              <BookOpen size={14} strokeWidth={2.2} />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-900 dark:text-white">
              Journify
            </span>
          </Link>

          {/* Navigation Links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#philosophy" className="hover:text-black dark:hover:text-white transition-colors">Philosophy</a>
            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-black dark:hover:text-white transition-colors">Testimonials</a>
          </nav>

          {/* CTA & Theme toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              to="/login"
              className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline px-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-3 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs whitespace-nowrap"
            >
              Get started
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-24 sm:pt-20 lg:pt-16 pb-10 sm:pb-12 lg:pb-16 overflow-hidden">
        {/* Subtle background curved geometric lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-15 flex items-center justify-center">
          <svg className="w-full h-full max-w-[1400px]" viewBox="0 0 1400 900" fill="none" stroke="currentColor">
            <circle cx="700" cy="450" r="420" strokeWidth="0.8" strokeDasharray="3 3" className="text-neutral-300 dark:text-neutral-700" />
            <circle cx="700" cy="450" r="620" strokeWidth="0.8" className="text-neutral-200 dark:text-neutral-800" />
            <circle cx="1100" cy="450" r="380" strokeWidth="0.8" strokeDasharray="4 4" className="text-neutral-200 dark:text-neutral-800" />
            <line x1="100" y1="450" x2="1300" y2="450" strokeWidth="0.6" className="text-neutral-200 dark:text-neutral-800" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-6 text-center lg:text-left">
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif-headline text-3xl sm:text-5xl md:text-[60px] lg:text-[66px] leading-[1.1] text-neutral-900 dark:text-neutral-100 tracking-[-0.015em] mb-4 sm:mb-6 font-normal"
              >
                A great life needs more than memory. It needs a <span className="italic font-normal">journal.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm sm:text-base lg:text-[19px] text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-7 sm:mb-8 font-normal"
              >
                Capture daily thoughts, voice reflections, and personal milestones in a quiet, Notion-inspired space. End-to-end encrypted, offline-first, and completely your own.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-10 sm:mb-14"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white font-medium text-sm transition-all shadow-md shadow-[#0066ff]/25 hover:shadow-lg hover:shadow-[#0066ff]/35 active:scale-[0.98]"
                >
                  <span>Start your journal free</span>
                  <ArrowRight size={15} />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-5 py-2.5 sm:py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium transition-colors"
                >
                  Explore features
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.35 }}
                className="pt-6 border-t border-neutral-200 dark:border-neutral-700/80 hidden lg:block"
              />
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[280px] sm:max-w-[420px] lg:max-w-[720px] flex justify-center lg:justify-end"
              >
                <div className="absolute -inset-8 bg-gradient-to-tr from-amber-200/25 via-blue-200/25 to-transparent dark:from-amber-950/25 dark:via-blue-950/25 rounded-full blur-3xl pointer-events-none" />

                <img
                  src={HERO_IMAGE_URL}
                  alt="Classical scholar reading a journal book"
                  className="relative z-10 w-full h-auto max-h-[320px] sm:max-h-[500px] lg:max-h-[780px] object-contain drop-shadow-2xl select-none"
                  loading="eager"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: PHILOSOPHY ── */}
      <section id="philosophy" className="py-14 sm:py-24 px-5 sm:px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0066ff]">
            The Journify Standard
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl mt-3 mb-6 text-neutral-900 dark:text-neutral-100 font-normal">
            Where craftsmanship meets inner tranquility.
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Most software bombards you with endless notifications, AI spam, and superficial metrics. Journify is crafted for people who view their journal as a sacred workshop of consciousness.
          </p>
        </div>
      </section>

      {/* ── SECTION 3: FEATURES GRID ── */}
      <section id="features" className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Capabilities
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-5xl mt-2 text-neutral-900 dark:text-neutral-100 font-normal">
              Instruments for the deep mind.
            </h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
            Every feature is intentionally tuned to keep your flow undisturbed and your records permanently accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-7 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#18181a] hover:border-neutral-400 dark:hover:border-neutral-600 transition-all group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:bg-[#0066ff] group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {item.badge}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: TESTIMONIALS (Fan Spread Deck Design matching Recent Journals) ── */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0066ff]">
              Reflections
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-5xl mt-2 text-neutral-900 dark:text-neutral-100 font-normal">
              Words from our writers.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Hover to inspect any writer's reflection · Real experiences from everyday minds
            </p>
          </div>

          {/* Interactive Fan Spread Deck */}
          <div className="relative w-full h-[360px] sm:h-[380px] flex items-center justify-center select-none py-6">
            {TESTIMONIALS.map((t, i) => {
              const total = TESTIMONIALS.length;
              const center = (total - 1) / 2;
              const offset = i - center;
              const baseRot = offset * 6.5;
              const baseX = offset * 90;
              const baseY = Math.abs(offset) * 10;
              const baseZ = total - Math.abs(offset);

              const isHovered = activeFaq === i; // reuse index or separate state
              const isAnyHovered = activeFaq !== null;

              return (
                <motion.div
                  key={t.id}
                  onMouseEnter={() => setActiveFaq(i)}
                  onMouseLeave={() => setActiveFaq(null)}
                  className="absolute cursor-pointer"
                  style={{
                    transformOrigin: '50% 125%',
                    zIndex: isHovered ? 40 : baseZ,
                  }}
                  animate={{
                    rotate: isHovered ? 0 : isAnyHovered ? baseRot * 1.3 : baseRot,
                    x: isHovered ? baseX * 1.05 : isAnyHovered ? baseX * 1.2 : baseX,
                    y: isHovered ? -35 : isAnyHovered ? baseY + 6 : baseY,
                    scale: isHovered ? 1.08 : isAnyHovered ? 0.95 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 340,
                    damping: 24,
                  }}
                >
                  <div
                    className={`w-[260px] sm:w-[290px] h-[260px] rounded-2xl p-5 flex flex-col justify-between
                      bg-white dark:bg-[#1c1c1f]
                      border transition-all duration-200
                      ${isHovered 
                        ? 'border-neutral-900/30 dark:border-neutral-400/50 shadow-2xl shadow-black/20 dark:shadow-black/70 ring-2 ring-black/5 dark:ring-white/15' 
                        : 'border-neutral-200/90 dark:border-neutral-800 shadow-lg shadow-black/5 dark:shadow-black/35'
                      }`}
                  >
                    {/* Top: Date, Mood & Stars */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-semibold text-neutral-400 font-mono">
                          {t.date}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{t.mood}</span>
                          <div className="flex text-amber-500">
                            {[...Array(t.rating)].map((_, r) => (
                              <Star key={r} size={10} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quote Body */}
                      <p className="font-serif-headline text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed italic line-clamp-4 font-normal">
                        "{t.quote}"
                      </p>
                    </div>

                    {/* Bottom: Author, Role & Tag */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={t.avatar}
                            alt={t.name}
                            className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {t.role}
                            </div>
                          </div>
                        </div>

                        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                          #{t.tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: PRICING (Updated with real project details: Free vs $5/mo Pro) ── */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Investment
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl mt-2 text-neutral-900 dark:text-neutral-100 font-normal">
            Transparent, uncompromised value.
          </h2>
          <p className="text-sm text-neutral-500 mt-2">Zero hidden fees. Full data sovereignty. Cancel or export your entire archive anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
                plan.highlight
                  ? 'border-purple-500/80 ring-1 ring-purple-500/20 bg-gradient-to-b from-purple-500/5 via-white to-white dark:from-purple-950/20 dark:via-[#18181a] dark:to-[#18181a] shadow-xl shadow-purple-500/5'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181a]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    plan.highlight
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {plan.badge}
                  </span>
                  {plan.highlight && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      $4/mo billed annually
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">{plan.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-6 leading-relaxed">{plan.description}</p>
                
                <div className="flex items-baseline gap-1.5 mb-6 py-2 border-y border-neutral-100 dark:border-neutral-800">
                  <span className="text-4xl font-extrabold font-mono text-neutral-900 dark:text-neutral-100">{plan.price}</span>
                  <span className="text-xs text-neutral-400">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs sm:text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-neutral-700 dark:text-neutral-300">
                      <Check size={15} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-500'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={plan.highlight ? "/register" : "/register"}
                className={`block w-full py-3 rounded-full text-center text-xs font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-600/25'
                    : 'border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: FAQ ── */}
      <section className="py-20 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif-headline text-3xl font-normal text-center mb-10 text-neutral-900 dark:text-neutral-100">
            Frequently answered questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                className="border border-neutral-200/90 dark:border-neutral-800 rounded-xl bg-white dark:bg-[#18181a] overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-[#0066ff] transition-colors"
                >
                  <span>{faq.q}</span>
                  <motion.div animate={{ rotate: activeFaq === i ? 180 : 0 }}>
                    <ChevronDown size={15} className="text-neutral-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FINAL CTA ── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif-headline text-4xl sm:text-5xl font-normal text-neutral-900 dark:text-neutral-100 mb-4">
            Claim your sanctuary today.
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-base mb-8 max-w-md mx-auto">
            Experience the calm of focused journaling. Free to start, private forever.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white font-medium text-sm transition-all shadow-lg shadow-[#0066ff]/25 active:scale-95"
          >
            <span>Create your master journal</span>
            <ArrowRight size={15} />
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Lock size={12} />
            <span>Encrypted local enclave · No card required</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-semibold">
            <BookOpen size={14} />
            <span>Journify</span>
          </div>
          <div>
            © {new Date().getFullYear()} Journify. Designed for intentional minds.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-black dark:hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-black dark:hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
