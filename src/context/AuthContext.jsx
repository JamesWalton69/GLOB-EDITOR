import React, { useEffect, useState } from 'react';
import { ID } from 'appwrite';
import { account, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '../lib/appwrite';
import { AuthContext } from '../lib/auth';
import { getMode, WORST_USER } from '../lib/fixture';

export const AuthProvider = ({ children }) => {
  // Dev-only preview hooks: view the landing page or IDE with any UI style.
  const params = new URLSearchParams(window.location.search);
  const dev = import.meta.env.DEV;
  const guest = dev && params.has('guest');
  const demo = dev && params.has('demo');
  const [user, setUser] = useState(() => {
    if (!demo) return null;
    return getMode() === 'worst' ? WORST_USER : { $id: 'demo-user', email: 'demo@example.com', name: 'Demo' };
  });
  const [loading, setLoading] = useState(!(guest || demo));

  useEffect(() => {
    if (guest || demo) return undefined;
    let mounted = true;
    account.get()
      .then((current) => { if (mounted) setUser(current); })
      .catch(() => { if (mounted) setUser(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [guest, demo]);

  // Popup + token flow. The token endpoint sends userId and secret to our own
  // callback page, so no third party cookie is needed to restore the session.
  const signInWithGoogle = async () => {
    const callback = `${window.location.origin}/oauth-callback.html`;
    const url = new URL(`${APPWRITE_ENDPOINT}/account/tokens/oauth2/google`);
    url.searchParams.set('success', callback);
    url.searchParams.set('failure', callback);
    url.searchParams.set('project', APPWRITE_PROJECT_ID);

    const popup = window.open(url.toString(), 'globeditor-oauth', 'width=520,height=680');
    if (!popup) throw new Error('Allow popups to sign in with Google.');

    return new Promise((resolve, reject) => {
      let done = false;
      let accepted = false;
      const finish = (fn, value) => {
        if (done) return;
        done = true;
        window.removeEventListener('message', onMessage);
        clearInterval(watch);
        clearTimeout(timeout);
        localStorage.removeItem('globeditor-oauth-result');
        popup.close();
        fn(value);
      };
      const accept = (data) => {
        if (accepted || done) return;
        if (!data || data.type !== 'globeditor-oauth') return;
        accepted = true;
        if (!data.userId || !data.secret) {
          finish(reject, new Error(data.error || 'Google sign in was cancelled.'));
          return;
        }
        account.createSession({ userId: data.userId, secret: data.secret })
          .then(() => account.get())
          .then((current) => { setUser(current); finish(resolve, current); })
          .catch((error) => finish(reject, error));
      };
      const onMessage = (event) => {
        if (event.origin !== window.location.origin) return;
        accept(event.data);
      };
      window.addEventListener('message', onMessage);
      // The callback also writes to localStorage, so the result survives a missed postMessage.
      const watch = setInterval(() => {
        try {
          const raw = localStorage.getItem('globeditor-oauth-result');
          if (raw) accept(JSON.parse(raw));
        } catch {
          return;
        }
      }, 400);
      const timeout = setTimeout(() => {
        finish(reject, new Error('Google sign in timed out.'));
      }, 5 * 60 * 1000);
    });
  };

  // Step 1 — Appwrite emails a 6-digit code. It creates the account on first use.
  const sendEmailCode = async (email) => {
    const token = await account.createEmailToken({ userId: ID.unique(), email });
    return token.userId;
  };

  // Step 2 — exchange the emailed code for a real session.
  const confirmEmailCode = async (userId, code) => {
    await account.createSession({ userId, secret: code.trim() });
    setUser(await account.get());
  };

  const signOut = async () => {
    await account.deleteSessions();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, sendEmailCode, confirmEmailCode, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
