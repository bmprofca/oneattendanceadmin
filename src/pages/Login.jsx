import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  Check,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';
import SelectField from '../components/common/SelectField';

const COUNTRY_CODE_OPTIONS = [
  { value: '91',  label: '🇮🇳 +91  India' },
  { value: '1',   label: '🇺🇸 +1   USA / Canada' },
  { value: '44',  label: '🇬🇧 +44  UK' },
  { value: '61',  label: '🇦🇺 +61  Australia' },
  { value: '971', label: '🇦🇪 +971 UAE' },
  { value: '65',  label: '🇸🇬 +65  Singapore' },
  { value: '60',  label: '🇲🇾 +60  Malaysia' },
  { value: '64',  label: '🇳🇿 +64  New Zealand' },
  { value: '27',  label: '🇿🇦 +27  South Africa' },
  { value: '49',  label: '🇩🇪 +49  Germany' },
  { value: '33',  label: '🇫🇷 +33  France' },
  { value: '81',  label: '🇯🇵 +81  Japan' },
];
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

// Small step-indicator dot used in the "Phone — Verify" progress row.
const StepDot = ({ active, done, label }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold border-2 transition-colors duration-300 ${
        done
          ? 'bg-[var(--signal)] border-[var(--signal)] text-white'
          : active
          ? 'border-[var(--signal)] text-[var(--signal)]'
          : 'border-[var(--line)] text-[var(--text-low)]'
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : label[0]}
    </div>
    <span
      className={`text-sm hidden sm:inline font-medium ${
        active || done ? 'text-[var(--text-hi)]' : 'text-[var(--text-low)]'
      }`}
    >
      {label}
    </span>
  </div>
);

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .auth-scope {
    --surface-0:#FFFFFF;
    --surface-1:#F6F7FC;
    --surface-2:#ECEFFA;
    --line:#E1E5F2;
    --signal:#0D9488;
    --signal-dim:rgba(13,148,136,0.10);
    --signal-dim-strong:rgba(13,148,136,0.18);
    --violet:#6D5DFB;
    --text-hi:#0F172A;
    --text-mid:#475569;
    --text-low:#8B94A7;
    --danger:#DC2626;
    --danger-dim:rgba(220,38,38,0.08);
    font-family:'Inter', ui-sans-serif, system-ui, sans-serif;
  }
  .auth-scope .font-display { font-family:'Space Grotesk', ui-sans-serif, sans-serif; }
  .auth-scope .font-mono { font-family:'IBM Plex Mono', ui-monospace, monospace; }

  @keyframes fadeRise { from { opacity:0; transform:translateY(14px);} to {opacity:1; transform:translateY(0);} }
  @keyframes pulseRing { 0% { transform:scale(0.75); opacity:0.55;} 100% { transform:scale(2.4); opacity:0;} }
  @keyframes shakeX { 10%,90%{transform:translateX(-1px);} 20%,80%{transform:translateX(2px);} 30%,50%,70%{transform:translateX(-4px);} 40%,60%{transform:translateX(4px);} }
  @keyframes popIn { 0%{transform:scale(1);} 45%{transform:scale(1.15);} 100%{transform:scale(1);} }
  @keyframes slowSpin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }

  .anim-fade-rise { animation: fadeRise 0.55s cubic-bezier(0.16,1,0.3,1) both; }
  .anim-shake { animation: shakeX 0.45s ease; }
  .anim-pop { animation: popIn 0.28s ease; }
  .ring-pulse { animation: pulseRing 2.8s cubic-bezier(0.2,0.6,0.4,1) infinite; }
  .ring-pulse-delay-1 { animation-delay: 0.9s; }
  .ring-pulse-delay-2 { animation-delay: 1.8s; }
  .ambient-spin { animation: slowSpin 30s linear infinite; }

  @media (prefers-reduced-motion: reduce) {
    .anim-fade-rise, .anim-shake, .anim-pop, .ring-pulse, .ambient-spin { animation: none !important; }
  }
`;

const Login = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const otp = otpDigits.join('');

  // Countdown for "Resend code"
  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  // Auto-submit the moment all 6 digits are filled
  useEffect(() => {
    if (step === 2 && otp.length === OTP_LENGTH && !loading) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const maskedPhone = () => {
    if (phone.length <= 4) return `+${countryCode} ${phone}`;
    return `+${countryCode} ${'•'.repeat(Math.max(phone.length - 4, 0))} ${phone.slice(-4)}`;
  };

  // Full number sent to API = countryCode + localNumber
  const fullPhone = () => `${countryCode}${phone}`;

  const sendOtpRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiCall('/auth/send-otp', 'POST', { phone: fullPhone() });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setResendSeconds(RESEND_SECONDS);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 7) {
      setError('Enter a valid phone number');
      return;
    }
    sendOtpRequest();
  };

  const handleResend = () => {
    if (resendSeconds > 0 || loading) return;
    sendOtpRequest();
  };

  const handleBack = () => {
    setStep(1);
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setError('');
    setResendSeconds(0);
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const verifyRes = await apiCall('/auth/verify-otp', 'POST', { phone: fullPhone(), otp });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.message || 'Invalid OTP');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Save token and initial user data to localStorage
      if (verifyData.data && verifyData.data.token) {
        localStorage.setItem('token', verifyData.data.token);
        localStorage.setItem('admin_user', JSON.stringify(verifyData.data.user));
      }

      const meRes = await apiCall('/auth/me', 'GET');

      const meData = await meRes.json();
      if (meRes.ok && meData.success) {
        login(meData.data);
        navigate('/');
      } else {
        setError(meData.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const trustItems = [
    'One-time codes, never stored',
    'Sessions monitored for unusual activity',
    'Encrypted in transit and at rest',
  ];

  return (
    <div className="auth-scope min-h-screen w-full flex flex-col lg:flex-row bg-[var(--surface-1)] text-[var(--text-hi)]">
      <style>{styles}</style>

      {/* ---------- Mobile compact header ---------- */}
      <div className="flex lg:hidden items-center justify-between px-6 py-5 border-b border-[var(--line)] bg-[var(--surface-0)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--signal-dim)] border border-[var(--line)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--signal)]" />
          </div>
          <span className="font-display text-lg font-semibold tracking-wide">Admin Console</span>
        </div>
        <span className="text-xs tracking-[0.2em] uppercase text-[var(--text-low)] font-medium">Secure sign-in</span>
      </div>

      {/* ---------- Desktop brand panel ---------- */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between overflow-hidden bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface-1)] border-r border-[var(--line)] p-8">
        <div
          className="pointer-events-none absolute -top-1/2 -left-1/3 w-[140%] h-[140%] opacity-[0.10] ambient-spin blur-3xl"
          style={{
            background:
              'conic-gradient(from 0deg, var(--signal), transparent 25%, var(--violet), transparent 60%, var(--signal))',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-0)] border border-[var(--line)] shadow-sm flex items-center justify-center">
            <Shield className="w-4 h-4 text-[var(--signal)]" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-wide leading-none">Admin Console</div>
            <div className="text-xs tracking-[0.25em] uppercase text-[var(--text-low)] font-medium mt-1.5">
              Secure Access
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center gap-6 my-auto">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-[var(--signal)]/30 ring-pulse" />
            <span className="absolute inset-0 rounded-full border-2 border-[var(--signal)]/30 ring-pulse ring-pulse-delay-1" />
            <span className="absolute inset-0 rounded-full border-2 border-[var(--signal)]/30 ring-pulse ring-pulse-delay-2" />
            <div className="relative w-16 h-16 rounded-2xl bg-[var(--surface-0)] border border-[var(--line)] flex items-center justify-center shadow-[0_8px_30px_-8px_var(--signal-dim-strong)]">
              <Phone className="w-7 h-7 text-[var(--signal)]" />
            </div>
          </div>
          <div className="max-w-sm">
            <h2 className="font-display text-2xl font-semibold text-[var(--text-hi)]">
              Verify it's you.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-mid)]">
              Every sign-in is confirmed with a one-time code sent straight to your phone
              — no passwords to leak, guess, or reuse.
            </p>
          </div>
        </div>

        <ul className="relative flex flex-col gap-3">
          {trustItems.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-[var(--text-mid)] font-medium">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--signal-dim)] text-[var(--signal)] shrink-0">
                <Check className="w-3 h-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--line) 1.5px, transparent 1.5px)',
            backgroundSize: '26px 26px',
          }}
        />

        <div className="relative w-full max-w-lg anim-fade-rise bg-[var(--surface-0)] border border-[var(--line)] rounded-3xl shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <StepDot active={step === 1} done={step === 2} label="Phone" />
            <div className="flex-1 h-1 bg-[var(--line)] rounded-full relative overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-[var(--signal)] rounded-full transition-all duration-500 ${
                  step === 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <StepDot active={step === 2} done={false} label="Verify" />
          </div>

          <div className="mb-6">
            <h1 className="font-display text-3xl leading-tight font-semibold text-[var(--text-hi)]">
              {step === 1 ? 'Sign in' : 'Enter the code'}
            </h1>
            <p className="mt-2 text-base text-[var(--text-mid)]">
              {step === 1
                ? 'Use your registered phone number to receive a one-time code.'
                : `We texted a 6-digit code to ${maskedPhone()}.`}
            </p>
          </div>

          {error && (
            <div
              key={error}
              role="alert"
              className="mb-5 flex items-start gap-2 p-3 rounded-2xl bg-[var(--danger-dim)] border border-[var(--danger)]/20 text-[var(--danger)] text-sm font-medium anim-shake"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-3">
                {/* Country code + phone number row */}
                <div className="flex gap-2">
                  {/* Country code selector */}
                  <div className="shrink-0" style={{ width: '9rem' }}>
                    <SelectField
                      options={COUNTRY_CODE_OPTIONS}
                      value={COUNTRY_CODE_OPTIONS.find((o) => o.value === countryCode) || null}
                      onChange={(opt) => setCountryCode(opt ? opt.value : '91')}
                      isSearchable
                      menuPlacement="auto"
                    />
                  </div>

                  {/* Phone number input */}
                  <div className="group relative flex flex-1 items-center">
                    <Phone className="absolute left-4 w-5 h-5 text-[var(--text-low)] group-focus-within:text-[var(--signal)] transition-colors" />
                    <input
                      id="phone"
                      type="text"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-3 bg-[var(--surface-1)] border-2 border-[var(--line)] rounded-2xl outline-none text-[var(--text-hi)] text-base font-mono tracking-wide placeholder:text-[var(--text-low)] focus:border-[var(--signal)] focus:bg-[var(--surface-0)] focus:shadow-[0_0_0_4px_var(--signal-dim)] transition-all duration-200"
                    />
                  </div>
                </div>

                <p className="text-sm text-[var(--text-low)]">
                  Enter your local number — country code is selected above.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group rounded-2xl py-3 text-base font-semibold text-white bg-[var(--signal)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 shadow-[0_10px_30px_-10px_var(--signal-dim-strong)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending code…
                  </>
                ) : (
                  <>
                    Send verification code
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold tracking-wide text-[var(--text-mid)] uppercase">
                    6-digit code
                  </label>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm font-medium text-[var(--text-low)] hover:text-[var(--signal)] inline-flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change number
                  </button>
                </div>

                <div
                  className="flex items-center justify-between gap-2 sm:gap-3"
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      aria-label={`Digit ${i + 1} of 6`}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-semibold rounded-xl bg-[var(--surface-1)] border-2 outline-none text-[var(--text-hi)] transition-all duration-200 ${
                        digit
                          ? 'border-[var(--signal)] bg-[var(--surface-0)] shadow-[0_0_0_4px_var(--signal-dim)] anim-pop'
                          : 'border-[var(--line)] focus:border-[var(--signal)] focus:bg-[var(--surface-0)] focus:shadow-[0_0_0_4px_var(--signal-dim)]'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-5 text-sm sm:text-base">
                  <span className="text-[var(--text-low)] font-medium">Sent to {maskedPhone()}</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendSeconds > 0 || loading}
                    className="font-semibold text-[var(--signal)] disabled:text-[var(--text-low)] disabled:cursor-not-allowed hover:underline underline-offset-4 transition-colors"
                  >
                    {resendSeconds > 0 ? `Resend in 0:${String(resendSeconds).padStart(2, '0')}` : 'Resend code'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== OTP_LENGTH}
                className="w-full group rounded-2xl py-3 text-base font-semibold text-white bg-[var(--signal)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 shadow-[0_10px_30px_-10px_var(--signal-dim-strong)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify &amp; continue
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--text-low)]">
            Trouble signing in? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;