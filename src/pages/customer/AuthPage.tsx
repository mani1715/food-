import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { signInCustomer, signUpCustomer, sendPasswordResetEmail, signOutUser } from '../../lib/supabase/auth';

export function AuthPage({ recovery = false }: { recovery?: boolean }) {
  const { supabaseUser, authLoading } = useApp();
  const [params] = useSearchParams();
  const requested = params.get('next') || '/profile';
  const next = /^\/(profile|orders|wishlist)(\?|$)/.test(requested) ? requested : '/profile';
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (!isSupabaseConfigured()) throw new Error('Sign-in is not configured yet. Please contact the store.');
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await signOutUser();
        setComplete(true);
        setMessage('Password updated. Sign in with your new password.');
      } else if (mode === 'signup') {
        const result = await signUpCustomer(email.trim(), password, name.trim(), '');
        if (!result.session) setMessage('Check your email to confirm your account, then sign in.');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(email.trim());
        setMessage('If an account exists for this email, you will receive a password reset link.');
      } else {
        await signInCustomer(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <p role="status" className="p-12 text-center">Checking your session...</p>;
  if (supabaseUser && !recovery && !busy) return <Navigate to={next} replace />;
  const title = recovery ? 'Set a new password' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  return (
    <section className="max-w-md mx-auto my-12 p-6 border rounded-3xl space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {message && <p role="status">{message}</p>}
      {recovery && !supabaseUser && !complete ? <p>Open the password reset link from your email, or <Link className="underline" to="/login">request a new link</Link>.</p> : !complete && (
        <form onSubmit={submit} className="space-y-4">
          {!recovery && mode === 'signup' && <label className="block">Full name<input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="block w-full border rounded-xl p-3" /></label>}
          {!recovery && <label className="block">Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border rounded-xl p-3" /></label>}
          {(recovery || mode !== 'forgot') && <label className="block">Password<input type="password" required minLength={recovery || mode === 'signup' ? 8 : 1} autoComplete={recovery || mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="block w-full border rounded-xl p-3" /></label>}
          <button disabled={busy} className="w-full bg-black text-white rounded-xl p-3 disabled:opacity-50">{busy ? 'Please wait...' : recovery ? 'Save password' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}</button>
        </form>
      )}
      {!recovery && <div className="flex flex-wrap gap-4 text-sm">{(['login', 'signup', 'forgot'] as const).filter(item => item !== mode).map(item => <button key={item} disabled={busy} className="underline" onClick={() => { setMode(item); setError(''); setMessage(''); setPassword(''); }}>{item === 'login' ? 'Sign in' : item === 'signup' ? 'Create account' : 'Forgot password?'}</button>)}</div>}
      {complete && <Link className="underline" to="/login">Sign in</Link>}
    </section>
  );
}
