import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Mic, Calendar, Shield, Zap, Star,
  ArrowRight, Check, ChevronDown, Moon, Sun, Sparkles, Lock, BarChart2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const MOODS = ['😊', '😌', '😔', '💪', '🌟', '😴', '🎯'];

const FEATURES = [
  {
    icon: <BookOpen size={20} />,
    title: 'Rich Journal Editor',
    desc: 'Full formatting, images, tags, and mood tracking — all in one elegant space.',
    color: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
    accent: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/60 dark:border-amber-800/40',
  },
  {
    icon: <Mic size={20} />,
    title: 'Voice Journaling',
    desc: 'Record your thoughts out loud. Journify transcribes and formats them instantly.',
    color: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
    accent: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/60 dark:border-rose-800/40',
  },
  {
    icon: <Calendar size={20} />,
    title: 'Timeline & Calendar',
    desc: 'See your journaling journey mapped across time, with mood and streak data.',
    color: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    accent: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/60 dark:border-violet-800/40',
  },
  {
    icon: <Shield size={20} />,
    title: 'Privacy First',
    desc: 'End-to-end encrypted. Your journal is yours alone — never sold, never shared.',
    color: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
    accent: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    icon: <Zap size={20} />,
    title: 'Offline Ready',
    desc: "Write anywhere, even without internet. Everything syncs when you're back online.",
    color: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
    accent: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200/60 dark:border-yellow-800/40',
  },
  {
    icon: <BarChart2 size={20} />,
    title: 'Mood Insights',
    desc: 'Track emotional patterns over time and understand yourself better.',
    color: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30',
    accent: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/60 dark:border-sky-800/40',
  },
];

const TESTIMONIALS = [
  {
    quote: "Journify changed how I reflect on my days. The voice feature is a game-changer.",
    name: "Priya S.",
    role: "Product Designer",
    mood: "🌟",
  },
  {
    quote: "Finally a journal app that doesn't feel like a spreadsheet. Beautiful and fast.",
    name: "Marcus T.",
    role: "Software Engineer",
    mood: "😊",
  },
  {
    quote: "I love the streak system. It turned journaling into a daily ritual for me.",
    name: "Aisha R.",
    role: "Therapist",
    mood: "💪",
  },
];

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Unlimited journal entries', 'Mood tracking', 'Calendar view', 'Offline access'],
    cta: 'Start writing free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$4',
    period: 'per month',
    features: ['Everything in Free', 'Voice journaling', 'AI mood insights', 'Custom folders', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
];

function FloatingMood({ emoji, delay, x, y }: { emoji: string; delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute text-2xl select-none pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.8],
        y: [20, 0, -10, -30],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        repeatDelay: 6,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'Is Journify really free?', a: 'Yes. Our Free plan is genuinely unlimited for journal entries, mood tracking, and offline access — forever.' },
    { q: 'How is my data protected?', a: 'All entries are encrypted at rest and in transit. We never read or sell your journal data. You can export or delete everything at any time from your Privacy Center.' },
    { q: 'Does it work offline?', a: "Yes. Journify is a Progressive Web App. Write offline, and your entries sync automatically when you're back online." },
    { q: 'Can I use voice to journal?', a: 'Voice journaling is available on Pro. Record a voice note and Journify transcribes it into a formatted journal entry.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113] text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Journify</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-gray-900 dark:hover:text-white transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} className="text-gray-400" /> : <Moon size={16} className="text-gray-500" />}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/60 via-white to-white dark:from-amber-950/20 dark:via-[#111113] dark:to-[#111113]" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {MOODS.map((emoji, i) => (
            <FloatingMood
              key={emoji + i}
              emoji={emoji}
              delay={i * 1.2}
              x={`${10 + i * 12}%`}
              y={`${20 + (i % 3) * 25}%`}
            />
          ))}
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full mb-6 border border-amber-200 dark:border-amber-800/60"
          >
            <Sparkles size={12} />
            Your private journaling space
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Write your story,{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              one day at a time.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Journify is the journaling app built for your thoughts — beautiful, private, and always with you, even offline.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-2xl text-base hover:bg-gray-700 dark:hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-900/10 dark:shadow-white/5"
            >
              Start writing — it's free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-gray-600 dark:text-gray-400 font-medium text-base hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in to continue
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 flex items-center justify-center gap-6 flex-wrap"
          >
            {['Private & encrypted', 'Works offline', 'Free forever plan'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                <Check size={12} className="text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything your journal needs
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
              Built for real reflection, not productivity theater.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className={`group p-6 rounded-2xl bg-gradient-to-br ${feature.color} border ${feature.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.accent} bg-white/60 dark:bg-black/20`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-gray-100">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE STRIP */}
      <section className="py-20 bg-gray-950 dark:bg-black overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
              Your days, beautifully archived.
            </h2>
            <p className="text-gray-400 text-base">A journal that grows with you.</p>
          </motion.div>

          <div className="relative flex items-center justify-center h-64">
            {[
              { title: 'Feeling grateful today', mood: '😊', date: 'Today', color: 'bg-amber-50', tag: 'Gratitude', offset: -130 },
              { title: 'Big project launch!', mood: '🎯', date: 'Yesterday', color: 'bg-violet-50', tag: 'Work', offset: 0 },
              { title: 'Morning walk thoughts', mood: '😌', date: '2 days ago', color: 'bg-emerald-50', tag: 'Reflection', offset: 130 },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40, rotate: (i - 1) * 5 }}
                whileInView={{ opacity: 1, y: 0, rotate: (i - 1) * 3 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, rotate: 0, scale: 1.05, zIndex: 10 }}
                className={`absolute ${card.color} rounded-2xl p-5 shadow-2xl cursor-pointer`}
                style={{ width: 190, left: `calc(50% + ${card.offset}px - 95px)`, zIndex: i === 1 ? 5 : 1 }}
              >
                <div className="text-2xl mb-2">{card.mood}</div>
                <div className="font-semibold text-sm text-gray-800 mb-1">{card.title}</div>
                <div className="text-xs text-gray-500 mb-3">{card.date}</div>
                <span className="px-2 py-0.5 bg-white/70 rounded-full text-xs text-gray-600 font-medium">{card.tag}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">People love Journify</h2>
            <div className="flex justify-center gap-1 mb-4">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
              >
                <div className="text-2xl mb-4">{t.mood}</div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5">
                  "{t.quote}"
                </p>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-gray-500 dark:text-gray-400">No surprise charges. Cancel anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`p-8 rounded-2xl border ${
                  plan.highlight
                    ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-gray-900 text-xs font-bold rounded-full mb-4">
                    <Sparkles size={10} />
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-medium mb-1 opacity-70">{plan.name}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm opacity-60">/ {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check size={14} className={plan.highlight ? 'text-amber-400' : 'text-emerald-500'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-10 text-center">Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  {faq.q}
                  <motion.div animate={{ rotate: activeFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl p-12 border border-amber-200/60 dark:border-amber-800/40"
          >
            <div className="text-4xl mb-5">📖</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start your journal today.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base">
              Join thousands of people who write with Journify every day.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-2xl text-base hover:bg-gray-700 dark:hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-900/15"
            >
              Create your free account
              <ArrowRight size={16} />
            </Link>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Lock size={11} />
              No credit card required
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md flex items-center justify-center">
              <BookOpen size={11} className="text-white" />
            </div>
            <span className="font-bold text-sm">Journify</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Journify</span>
            <Link to="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
