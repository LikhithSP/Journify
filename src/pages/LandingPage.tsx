import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onBeginJourney?: () => void;
}

export default function LandingPage({ onBeginJourney }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0c0d12] text-white select-none font-sans antialiased flex flex-col justify-between">
      {/* Background Image: zoomed slightly, shifted to the left, and sharpened */}
      <img
        src="https://media.mutualart.com/Images/2021_10/17/16/163627236/d4e41784-675e-4185-a27b-ad72d0f0506f.Jpeg"
        alt="Journify background"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none filter contrast-[1.14] brightness-[0.98] saturate-[1.06] scale-110 origin-[20%_25%]"
        style={{ objectPosition: '22% 20%', imageRendering: '-webkit-optimize-contrast' }}
      />
      
      {/* Atmospheric Vignette: rich dark gradient on the left so typography pops without obscuring the painting */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/25 z-[1] pointer-events-none hidden md:block" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85 z-[1] pointer-events-none md:hidden" />
      {/* Top subtle fade for navbar readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-[2] pointer-events-none" />

      {/* Floating Modern Header / Navbar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-7 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-bold tracking-tight text-white group-hover:scale-105 transition-transform duration-200 shadow-sm">
            J
          </div>
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-white">
            Journify<span className="text-white/40 text-xs ml-1 font-normal">’26</span>
          </span>
        </Link>

        {/* Compact Right Pill Navigation */}
        <div className="liquid-glass rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <Link
            to="/login"
            className="text-xs font-semibold text-white/75 hover:text-white px-3 py-1.5 transition-colors tracking-wide"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            onClick={onBeginJourney}
            className="liquid-glass rounded-full px-4 py-1.5 text-xs font-semibold text-white hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1.5 group shadow-sm bg-white/[0.08]"
          >
            <span>Begin Journey</span>
            <ArrowRight className="w-3 h-3 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero Content: Editorial Left-Aligned Composition */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-20 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl text-left pt-12 sm:pt-14">
          {/* Crisp Modern Editorial Heading */}
          <h1
            className="animate-fade-rise font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold tracking-[-0.045em] leading-[0.98] text-white drop-shadow-md"
          >
            Where thoughts find their{' '}
            <span className="text-white/40 font-medium italic block sm:inline">
              quiet momentum.
            </span>
          </h1>

          {/* Readable Subtext */}
          <p className="animate-fade-rise-delay text-white/70 text-base sm:text-lg max-w-xl mt-6 leading-relaxed font-normal tracking-[-0.01em]">
            A distraction-free canvas for deep reflection, clarity, and creative breakthroughs. Built for quiet minds and bold thinkers.
          </p>

          {/* Action CTA Group */}
          <div className="animate-fade-rise-delay-2 flex flex-wrap items-center gap-4 mt-9">
            <Link
              to="/login"
              onClick={onBeginJourney}
              className="liquid-glass rounded-full px-8 py-3.5 text-sm font-semibold text-white hover:scale-[1.03] active:scale-[0.98] cursor-pointer inline-flex items-center gap-2.5 transition-all duration-200 tracking-[-0.01em] shadow-2xl bg-white/[0.08]"
            >
              <span>Start Journaling Free</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Editorial Accent Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-7 flex items-center justify-between text-xs text-white/40">
        <div>© 2026 Journify. All reflections protected.</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-white/70 transition-colors cursor-pointer">Supabase Encrypted</span>
          <span className="hover:text-white/70 transition-colors cursor-pointer">Offline First</span>
        </div>
      </footer>
    </div>
  );
}
