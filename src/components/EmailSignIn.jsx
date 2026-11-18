import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail, ShieldCheck, X } from 'lucide-react';

// Passwordless sign-in: email -> 6-digit code -> session.
export default function EmailSignIn({ onSendCode, onVerify, onGoogle, onClose }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const emailRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    (step === 'email' ? emailRef : codeRef).current?.focus();
  }, [step]);

  const requestCode = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const id = await onSendCode(email.trim());
      setUserId(id);
      setStep('code');
      setCode('');
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true); setError('');
    try {
      await onVerify(userId, digits);
    } catch (err) {
      setError(err.message || 'That code is invalid or has expired.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const id = await onSendCode(email.trim());
      setUserId(id);
      setCode('');
      setNotice('A new code is on its way.');
      codeRef.current?.focus();
    } catch (err) {
      setError(err.message || 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lp-modal" role="dialog" aria-modal="true" aria-label="Sign in with email">
        <div className="lp-modal-head">
          <div className="lp-modal-icon">{step === 'email' ? <Mail size={20} /> : <ShieldCheck size={20} />}</div>
          <button className="lp-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {step === 'email' ? (
          <>
            <h2 className="lp-modal-title">Sign in with email</h2>
            <p className="lp-modal-sub">We’ll email you a one time code. No password needed.</p>
            <form onSubmit={requestCode}>
              <label className="lp-modal-label" htmlFor="lp-email">Email address</label>
              <input
                id="lp-email"
                ref={emailRef}
                className="lp-field"
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
              {error && <p className="lp-modal-error">{error}</p>}
              <button className="lp-modal-btn glp-btn glp-btn-primary" type="submit" disabled={busy}>
                {busy ? <Loader2 size={17} className="lp-spin" /> : <>Send code <ArrowRight size={16} /></>}
              </button>
            </form>
            {onGoogle && (
              <button type="button" className="lp-modal-link lp-modal-alt" onClick={onGoogle}>
                Use Google
              </button>
            )}
          </>
        ) : (
          <>
            <h2 className="lp-modal-title">Check your email</h2>
            <p className="lp-modal-sub">
              We sent a six digit code to <strong>{email}</strong>. It expires in 15 minutes.
            </p>
            <form onSubmit={verifyCode}>
              <label className="lp-modal-label" htmlFor="lp-code">Confirmation code</label>
              <input
                id="lp-code"
                ref={codeRef}
                className="lp-field lp-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={busy}
                required
              />
              {error && <p className="lp-modal-error">{error}</p>}
              {notice && <p className="lp-modal-notice">{notice}</p>}
              <button className="lp-modal-btn glp-btn glp-btn-primary" type="submit" disabled={busy}>
                {busy ? <Loader2 size={17} className="lp-spin" /> : <>Verify &amp; sign in <ArrowRight size={16} /></>}
              </button>
            </form>
            <div className="lp-modal-links">
              <button type="button" className="lp-modal-link" onClick={resend} disabled={busy}>Resend code</button>
              <button type="button" className="lp-modal-link" onClick={() => { setStep('email'); setError(''); setNotice(''); }} disabled={busy}>
                <ArrowLeft size={13} /> Use another email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
