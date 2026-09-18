import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Mic, Calendar, Shield, Zap,
  ArrowRight, Check, ChevronDown, Moon, Sun, Sparkles, Lock,
  Bookmark, Award, Star
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HERO_IMAGE_URL = 'https://framerusercontent.com/images/pC6wv63RktJx8IvHALRzmZ2K90.webp?width=2454&height=2877';

const TRUST_LOGOS = [
  { name: 'Bugbusterlabs', icon: Shield },
  { name: 'Indoorwall', icon: Bookmark },
  { name: 'PaperWeight', icon: BookOpen },
  { name: 'Laager', icon: Award },
  { name: 'Facets', icon: Zap },
];

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
    quote: "A journal shouldn't feel like another corporate task board. Journify gives writing the reverence and quiet elegance of a classical leather notebook.",
    name: "Dr. Elena Rostova",
    role: "Philosopher & Essayist",
    rating: 5,
  },
  {
    quote: "The voice capture and instant transcription turns my fragmented morning commute thoughts into coherent journal passages. Truly unmatched.",
    name: "Julian Chen",
    role: "Founding Architect",
    rating: 5,
  },
  {
    quote: "Knowing my data never leaves my offline-encrypted enclave without my explicit consent gave me the confidence to write honestly again.",
    name: "Sarah Jenkins",
    role: "Novelist & Biographer",
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Apprentice',
    price: '$0',
    period: 'free forever',
    description: 'Everything essential to cultivate a daily mindful writing habit.',
    features: [
      'Unlimited journal entries',
      'Offline-first PWA synchronization',
      'Basic voice journaling (5 min/day)',
      'Calendar & streak rituals',
      'End-to-end encrypted storage',
    ],
    cta: 'Begin Journaling',
    highlight: false,
  },
  {
    name: 'Master Craftsman',
    price: '$8',
    period: 'per month',
    description: 'For thinkers, writers, and builders demanding boundless reflection.',
    features: [
      'Everything in Apprentice',
      'Unlimited AI Voice Transcription',
      'Deep psychological mood analytics',
      'Nested folder hierarchies & tags',
      'Full JSON & Markdown data export',
      'Priority offline sync & recovery',
    ],
    cta: 'Start Free 14-Day Trial',
    highlight: true,
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
      <header className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-full bg-white/80 dark:bg-[#151518]/80 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800 shadow-lg shadow-black/[0.04] dark:shadow-black/20 px-5 sm:px-6 py-2.5 flex items-center justify-between pointer-events-auto transition-all"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-[#111] dark:bg-white flex items-center justify-center text-white dark:text-black transition-transform group-hover:scale-105">
              <BookOpen size={16} strokeWidth={2.2} />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
              Journify
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#philosophy" className="hover:text-black dark:hover:text-white transition-colors">Philosophy</a>
            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-black dark:hover:text-white transition-colors">Testimonials</a>
          </nav>

          {/* CTA & Theme toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/login"
              className="text-[13.5px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors hidden sm:inline px-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
            >
              Get started
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ── HERO SECTION (MATCHING REFERENCE IMAGE) ── */}
      <section className="relative pt-14 pb-12 lg:pt-16 lg:pb-16 overflow-hidden">
        {/* Subtle background curved geometric lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-15 flex items-center justify-center">
          <svg className="w-full h-full max-w-[1400px]" viewBox="0 0 1400 900" fill="none" stroke="currentColor">
            <circle cx="700" cy="450" r="420" strokeWidth="0.8" strokeDasharray="3 3" className="text-neutral-300 dark:text-neutral-700" />
            <circle cx="700" cy="450" r="620" strokeWidth="0.8" className="text-neutral-200 dark:text-neutral-800" />
            <circle cx="1100" cy="450" r="380" strokeWidth="0.8" strokeDasharray="4 4" className="text-neutral-200 dark:text-neutral-800" />
            <line x1="100" y1="450" x2="1300" y2="450" strokeWidth="0.6" className="text-neutral-200 dark:text-neutral-800" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center min-h-[540px] lg:min-h-[600px]">
            
            {/* Left Hero Content (6 Columns on large screens for artwork room) */}
            <div className="lg:col-span-6">
              
              {/* Editorial Headline tailored specifically to Journify */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif-headline text-4xl sm:text-6xl md:text-[66px] leading-[1.08] text-neutral-900 dark:text-neutral-100 tracking-[-0.015em] mb-6 font-normal"
              >
                A great life needs more than memory. It needs a <span className="italic font-normal">journal.</span>
              </motion.h1>

              {/* Subheading description directly mentioning journaling & Journify capabilities */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg md:text-[19px] text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed mb-8 font-normal"
              >
                Capture daily thoughts, voice reflections, and personal milestones in a quiet, Notion-inspired space. End-to-end encrypted, offline-first, and completely your own.
              </motion.p>

              {/* Buttons: Electric Blue Primary + Pill Outline Secondary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3.5 mb-14"
              >
                {/* Electric Blue Pill Button */}
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white font-medium text-sm transition-all shadow-md shadow-[#0066ff]/25 hover:shadow-lg hover:shadow-[#0066ff]/35 active:scale-[0.98]"
                >
                  <span>Start your journal free</span>
                  <ArrowRight size={15} />
                </Link>

                {/* Pill Outline Button */}
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium transition-colors"
                >
                  Explore features
                </a>
              </motion.div>

              {/* Social Proof & Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.35 }}
                className="pt-6 border-t border-neutral-100 dark:border-neutral-850"
              >
                <p className="text-xs font-normal text-neutral-400 dark:text-neutral-500 mb-4 tracking-normal">
                  Loved by 10,000+ writers, mindful thinkers & creators worldwide
                </p>
                <div className="flex items-center gap-6 sm:gap-9 opacity-50 grayscale hover:grayscale-0 hover:opacity-90 transition-all flex-wrap">
                  {TRUST_LOGOS.map((logo) => {
                    const Icon = logo.icon;
                    return (
                      <div key={logo.name} className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                        <Icon size={16} />
                        <span className="font-semibold text-xs tracking-tight">{logo.name}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right Hero Image (Classical Scholar / Master with Book - Enlarged Hero Presence) */}
            <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[520px] sm:max-w-[620px] lg:max-w-[720px] flex justify-center lg:justify-end"
              >
                {/* Ambient glow behind classical artwork */}
                <div className="absolute -inset-8 bg-gradient-to-tr from-amber-200/25 via-blue-200/25 to-transparent dark:from-amber-950/25 dark:via-blue-950/25 rounded-full blur-3xl pointer-events-none" />

                <img
                  src={HERO_IMAGE_URL}
                  alt="Classical scholar reading a journal book"
                  className="relative z-10 w-full h-auto max-h-[640px] sm:max-h-[700px] lg:max-h-[780px] object-contain drop-shadow-2xl select-none"
                  loading="eager"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: PHILOSOPHY (The Master's Workshop) ── */}
      <section id="philosophy" className="py-24 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
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

      {/* ── SECTION 4: TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#0066ff]">
              Reflections
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-5xl mt-2 text-neutral-900 dark:text-neutral-100 font-normal">
              Words from our writers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-7 rounded-2xl bg-white dark:bg-[#18181a] border border-neutral-200/80 dark:border-neutral-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-500 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="font-serif-headline text-lg sm:text-xl text-neutral-800 dark:text-neutral-200 leading-snug italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{t.name}</div>
                  <div className="text-xs text-neutral-400">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: PRICING ── */}
      <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Investment
          </span>
          <h2 className="font-serif-headline text-3xl sm:text-5xl mt-2 text-neutral-900 dark:text-neutral-100 font-normal">
            Transparent, uncompromised value.
          </h2>
          <p className="text-sm text-neutral-500 mt-2">No dark patterns. Cancel or export your entire archive anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl border transition-all ${
                plan.highlight
                  ? 'border-[#0066ff] ring-1 ring-[#0066ff]/20 bg-white dark:bg-[#18181a] shadow-xl shadow-[#0066ff]/5'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181a]'
              }`}
            >
              {plan.highlight && (
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0066ff]/10 text-[#0066ff] uppercase tracking-wider mb-4">
                  Most Chosen
                </span>
              )}
              <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">{plan.name}</h3>
              <p className="text-xs text-neutral-500 mt-1 mb-6">{plan.description}</p>
              
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl font-bold font-serif-headline text-neutral-900 dark:text-neutral-100">{plan.price}</span>
                <span className="text-xs text-neutral-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                    <Check size={14} className="text-[#0066ff] flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full py-3 rounded-full text-center text-sm font-medium transition-all ${
                  plan.highlight
                    ? 'bg-[#0066ff] hover:bg-[#0052cc] text-white shadow-md shadow-[#0066ff]/25'
                    : 'border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-neutral-900 dark:text-neutral-100'
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
