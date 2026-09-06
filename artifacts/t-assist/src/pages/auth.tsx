import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getGetCurrentStudentQueryKey, useLogIn, useSignUp } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Mark } from '@/components/t-assist-ui';

export function Signup() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const signup = useSignUp();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(''); if (name.trim().length < 2 || !level.trim() || !/^\d{4,6}$/.test(pin)) { setError('Add your name, class level, and a 4–6 digit PIN.'); return; } signup.mutate({ data: { name: name.trim(), ageOrClassLevel: level.trim(), pin } }, { onSuccess: (session) => { queryClient.setQueryData(getGetCurrentStudentQueryKey(), session.student); setLocation('/chat'); }, onError: () => setError('That profile could not be created. Try again in a moment.') }); };
  return <AuthFrame eyebrow="A little profile, no big forms" title={<>Let’s make this<br /><span className="text-primary">yours.</span></>} side="New here? Start with the question on your mind.">
    <form onSubmit={submit} className="space-y-5" data-testid="form-signup">
      <Field label="What should Temmy call you?" value={name} onChange={setName} placeholder="Your first name" icon={UserRound} testId="input-signup-name" autoFocus />
      <Field label="What are you learning right now?" value={level} onChange={setLevel} placeholder="Year 8, GCSE, primary 6..." icon={Sparkles} testId="input-signup-level" />
      <Field label="Choose a 4–6 digit PIN" value={pin} onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} placeholder="A number you’ll remember" icon={LockKeyhole} testId="input-signup-pin" type="password" inputMode="numeric" autoComplete="new-password" />
      {error && <p data-testid="status-signup-error" className="rounded-xl bg-[#fae0db] px-4 py-3 text-sm font-semibold text-[#99473f]">{error}</p>}
      <button disabled={signup.isPending} data-testid="button-submit-signup" className="focus-ring group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground shadow-[4px_4px_0_rgba(39,54,69,.14)] transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{signup.isPending ? 'Making your space...' : <>Continue to Temmy <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></>}</button>
      <p className="text-center text-xs leading-5 text-muted-foreground">Your profile is just for your study space. Temmy uses Google Gemini to help answer questions, so do not share private information.</p>
    </form>
  </AuthFrame>;
}

export function Login() {
  const [, setLocation] = useLocation(); const queryClient = useQueryClient(); const login = useLogIn(); const [name, setName] = useState(''); const [pin, setPin] = useState(''); const [error, setError] = useState('');
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(''); if (!name.trim() || !/^\d{4,6}$/.test(pin)) { setError('Check your name and 4–6 digit PIN.'); return; } login.mutate({ data: { name: name.trim(), pin } }, { onSuccess: (session) => { queryClient.setQueryData(getGetCurrentStudentQueryKey(), session.student); setLocation('/chat'); }, onError: () => setError('We could not find that profile. Check your details and try again.') }); };
  return <AuthFrame eyebrow="Welcome back" title={<>Ready when<br /><span className="text-primary">you are.</span></>} side="Your little corner of learning is here.">
    <form onSubmit={submit} className="space-y-5" data-testid="form-login">
      <Field label="Your name" value={name} onChange={setName} placeholder="The name on your profile" icon={UserRound} testId="input-login-name" autoFocus />
      <Field label="Your PIN" value={pin} onChange={(value) => setPin(value.replace(/\D/g, '').slice(0, 6))} placeholder="4–6 digits" icon={KeyRound} testId="input-login-pin" type="password" inputMode="numeric" autoComplete="current-password" />
      {error && <p data-testid="status-login-error" className="rounded-xl bg-[#fae0db] px-4 py-3 text-sm font-semibold text-[#99473f]">{error}</p>}
      <button disabled={login.isPending} data-testid="button-submit-login" className="focus-ring group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-bold text-primary-foreground shadow-[4px_4px_0_rgba(39,54,69,.14)] transition-all hover:-translate-y-0.5 disabled:opacity-60">{login.isPending ? 'Finding your space...' : <>Open my study space <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></>}</button>
    </form>
  </AuthFrame>;
}

function AuthFrame({ eyebrow, title, side, children }: { eyebrow: string; title: React.ReactNode; side: string; children: React.ReactNode }) {
  return <div className="noise min-h-[100dvh] bg-[#f7f0e4]"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8"><Mark /><Link href="/" data-testid="link-auth-back" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back home</Link></header><main className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-10 md:grid-cols-[.9fr_1.1fr] md:px-8 md:pb-28 md:pt-20"><div className="animate-rise md:pt-12"><p className="font-mono text-xs uppercase tracking-[.18em] text-primary">{eyebrow}</p><h1 className="mt-5 font-display text-5xl font-bold leading-[.94] tracking-[-.07em] md:text-7xl">{title}</h1><p className="mt-7 max-w-sm text-base leading-7 text-muted-foreground">{side}</p><div className="mt-12 hidden items-center gap-3 text-sm font-semibold text-muted-foreground md:flex"><span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><Sparkles size={16} /></span>Temmy keeps the hard things human.</div></div><div className="animate-rise animate-rise-delay-1 max-w-md md:ml-auto md:w-full"><div className="rounded-[2rem] border border-[#d7cabb] bg-[#fffaf1] p-6 shadow-[10px_12px_0_rgba(103,76,52,.10)] md:p-9">{children}</div><div className="mt-5 flex justify-center gap-2 text-sm text-muted-foreground">{eyebrow === 'Welcome back' ? <>New to T-assist? <Link href="/signup" data-testid="link-login-signup" className="font-bold text-primary underline underline-offset-4">Create a profile</Link></> : <>Already have a profile? <Link href="/login" data-testid="link-signup-login" className="font-bold text-primary underline underline-offset-4">Log in</Link></>}</div></div></main></div>;
}

function Field({ label, value, onChange, placeholder, icon: Icon, testId, type = 'text', autoFocus = false, inputMode, autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; icon: typeof UserRound; testId: string; type?: string; autoFocus?: boolean; inputMode?: 'numeric'; autoComplete?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><span className="relative block"><Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid={testId} autoFocus={autoFocus} autoComplete={autoComplete} type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="focus-ring w-full rounded-xl border border-border bg-background px-4 py-3.5 pl-11 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary" /></span></label>;
}