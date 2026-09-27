import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UpgradeProPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Demo Mock Card Fields
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('•••');
  const [cardHolder, setCardHolder] = useState(user?.email?.split('@')[0] || 'Alex Hunter');
  const [country, setCountry] = useState('United States');

  // Pricing details ($5 / month standard, $4 / month annual)
  const price = billingCycle === 'monthly' ? 5 : 4; 
  const savings = billingCycle === 'yearly' ? '20% OFF' : null;

  const handleDemoPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      // Store local pro upgrade flag
      localStorage.setItem('journify_user_pro', 'true');
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-3 sm:px-6 pb-20 select-none">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={14} className="mr-1.5" />
        Back
      </button>

      {/* Hero Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold mb-3">
          <Sparkles size={13} className="text-purple-500" />
          <span>Journify Pro Experience</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3">
          Elevate your reflections without limits
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Advanced AI insights, unlimited encrypted cloud storage, high-fidelity voice transcriptions, and bespoke PDF export decks.
        </p>

        {/* Billing Cycle Switcher */}
        <div className="mt-6 inline-flex items-center p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Monthly billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <span>Annual billing</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Plan Details, Right Stripe Checkout Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Plan Summary & Perks */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2a1b2d] via-[#1e1728] to-[#12111a] dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 text-white shadow-2xl border border-purple-900/40 dark:border-neutral-800 relative overflow-hidden">
            {/* Ambient Lighting Background */}
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-amber-500/20 via-violet-500/20 to-transparent blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Zap size={16} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Journify Pro</h3>
                    <p className="text-[11px] text-neutral-300 dark:text-neutral-400">Everything in Free + Power Features</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white backdrop-blur-xs">
                  {savings || 'Standard'}
                </span>
              </div>

              {/* Price display */}
              <div className="py-4 border-y border-white/15 my-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                  ${price}
                </span>
                <span className="text-xs text-neutral-300 dark:text-neutral-400 font-medium">
                  /month {billingCycle === 'yearly' ? '(billed annually at $48)' : ''}
                </span>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-neutral-200">
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Advanced Reports & Sentiment Trends:</strong> Deep cognitive & mood tracking graphs over time.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited Cloud Storage:</strong> Store infinite high-res photos, audio recordings, and entries.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Extended 30-Day Version History:</strong> Restore any draft revisions with instantaneous rollbacks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Full Speech-to-Text Transcription:</strong> Limitless AI voice journal extraction and summaries.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Priority Cloud Sync & Offline Encryption:</strong> Multi-device instantaneous bidirectional sync.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust badges */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2 text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Zero-knowledge client-side encryption</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your journal entries are encrypted end-to-end. Not even the Journify server or payment processor can read your journal pages.
            </p>
          </div>
        </div>

        {/* Right Column: Stripe-Style Checkout Flow */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-neutral-900 dark:text-white" />
                <h2 className="font-bold text-base text-neutral-900 dark:text-white">
                  Payment Details
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Lock size={12} />
                <span>Simulated Stripe Sandbox</span>
              </div>
            </div>

            {paymentSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Upgrade Successful!
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                    Welcome to <strong>Journify Pro</strong>. Your account has been upgraded with unlimited cloud storage, sentiment reports, and speech-to-text.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition shadow-xs"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleDemoPayment} className="space-y-4">
                {/* Email Display */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={user?.email || 'user@journify.app'}
                    disabled
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Card information
                  </label>
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div className="flex items-center px-3.5 py-2.5">
                      <CreditCard size={15} className="text-neutral-400 mr-2 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="1234 1234 1234 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-transparent text-xs text-neutral-900 dark:text-white focus:outline-none placeholder-neutral-400 font-mono"
                        required
                      />
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">VISA / MC</span>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-neutral-200 dark:divide-neutral-700">
                      <div className="px-3.5 py-2.5">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full bg-transparent text-xs text-neutral-900 dark:text-white focus:outline-none placeholder-neutral-400 font-mono"
                          required
                        />
                      </div>
                      <div className="px-3.5 py-2.5 flex items-center justify-between">
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="w-full bg-transparent text-xs text-neutral-900 dark:text-white focus:outline-none placeholder-neutral-400 font-mono"
                          required
                        />
                        <Lock size={12} className="text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name on card */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Cardholder name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Full name on card"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>

                {/* Country or Region */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Country or region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="India">India</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>

                {/* Notice Banner */}
                <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Demo Payment Mode: No actual credit card charge will be made. Clicking below demonstrates the full checkout experience and activates Pro features for your session.
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processing simulated transaction...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Pay ${price}.00 & Upgrade to Pro</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-400 pt-2">
                  <span>Guaranteed Safe Checkout</span>
                  <span>·</span>
                  <span>Cancel anytime</span>
                  <span>·</span>
                  <span>Instant activation</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
