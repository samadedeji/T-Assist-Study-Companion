import { ArrowRight, BookOpen, Brain, Check, MessageCircle, MoveUpRight, Play, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import { Mark } from '@/components/t-assist-ui';

export default function Landing() {
  const { data: health } = useHealthCheck({ query: { queryKey: ['/api/healthz'], staleTime: 60_000 } });
  return (
    <div className="noise min-h-[100dvh] overflow-hidden bg-[#f7f0e4] text-foreground">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Mark />
        <div className="flex items-center gap-3"><Link href="/login" data-testid="link-landing-login" className="focus-ring hidden rounded-full px-4 py-2 text-sm font-bold text-foreground/70 hover:text-foreground sm:block">I already have an account</Link><Link href="/signup" data-testid="link-landing-signup-top" className="focus-ring rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[3px_3px_0_rgba(39,54,69,.14)] transition-transform hover:-translate-y-0.5">Start learning</Link></div>
      </header>
      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_.95fr] md:px-8 md:pb-28 md:pt-24">
          <div className="relative z-10 animate-rise">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-[#e0f1ec] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-primary"><span className="size-1.5 rounded-full bg-primary animate-soft-pulse" /> {health?.status === 'ok' ? 'Temmy is online' : 'A quieter way to learn'}</div>
            <h1 className="max-w-[680px] font-display text-[clamp(3.5rem,8vw,7.5rem)] font-bold leading-[.88] tracking-[-.075em]">Make room<br /><span className="text-primary">for curious.</span></h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-foreground/65 md:text-xl">Temmy is the study companion that explains the hard bits, remembers what you are working on, and makes showing up feel like a win.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4"><Link href="/signup" data-testid="link-hero-signup" className="focus-ring group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground shadow-[5px_5px_0_rgba(39,54,69,.15)] transition-all hover:-translate-y-1 hover:shadow-[7px_7px_0_rgba(39,54,69,.15)]">Meet Temmy <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link><span className="text-sm text-muted-foreground">Free to start. No judgement.</span></div>
          </div>
          <div className="relative animate-rise animate-rise-delay-2">
            <div className="absolute -right-8 -top-10 size-40 rounded-full bg-accent/30 blur-2xl" /><div className="absolute -bottom-8 -left-8 size-48 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative rotate-2 rounded-[2rem] border border-[#d7cabb] bg-[#fffaf1] p-4 shadow-[12px_16px_0_rgba(103,76,52,.10)] transition-transform duration-500 hover:rotate-0 md:p-6">
              <div className="flex items-center justify-between border-b border-border/70 pb-4"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={17} /></span><div><p className="font-display font-bold">Temmy</p><p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">your study buddy</p></div></div><span className="font-mono text-[10px] text-primary">online</span></div>
              <div className="space-y-5 py-7"><div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-[#e9ddd0] px-4 py-3 text-sm leading-6">Can you help me understand photosynthesis?</div><div className="flex max-w-[86%] gap-3"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles size={13} /></span><div className="rounded-2xl rounded-tl-sm bg-[#e0f1ec] px-4 py-3 text-sm leading-6">Absolutely. Think of a plant as a tiny solar kitchen. It uses light to turn water and air into food. Want to draw it out together?</div></div><div className="ml-auto flex max-w-[65%] items-center gap-2 rounded-2xl rounded-tr-sm bg-[#e9ddd0] px-4 py-3 text-sm"><Check size={15} className="text-primary" /> That actually makes sense.</div></div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"><span className="flex-1 text-sm text-muted-foreground">Ask Temmy anything...</span><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><ArrowRight size={15} /></span></div>
            </div>
            <div className="absolute -bottom-5 -right-2 flex -rotate-3 items-center gap-2 rounded-2xl border border-[#d7cabb] bg-[#fffaf1] px-4 py-3 shadow-[5px_6px_0_rgba(103,76,52,.10)]"><span className="grid size-8 place-items-center rounded-lg bg-accent"><Brain size={16} /></span><span className="font-mono text-[10px] uppercase tracking-wider">small steps count</span></div>
          </div>
        </section>
        <section className="border-y border-border/70 bg-[#e7f3ee] px-5 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-6xl"><div className="max-w-xl"><p className="font-mono text-xs uppercase tracking-[.18em] text-primary">The good kind of help</p><h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-.05em] md:text-6xl">Not answers.<br /><span className="text-primary">A way in.</span></h2></div><div className="mt-14 grid gap-4 md:grid-cols-3"><Feature icon={MessageCircle} index="01" title="Ask without shrinking" text="Homework questions, half-formed thoughts, the thing you are too shy to ask in class. Temmy meets you there." /><Feature icon={BookOpen} index="02" title="Learn your way" text="A quick explainer, a worked example, or a gentle nudge. You choose the next step." /><Feature icon={MoveUpRight} index="03" title="See yourself grow" text="Your streaks and topics make progress visible, without turning learning into a scoreboard." /></div></div></section>
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28"><div className="grid items-end gap-10 md:grid-cols-[.9fr_1.1fr]"><div><p className="font-mono text-xs uppercase tracking-[.18em] text-primary">A softer study ritual</p><h2 className="mt-4 font-display text-4xl font-bold leading-[.95] tracking-[-.06em] md:text-6xl">Open the tab.<br />Find your flow.</h2><Link href="/signup" data-testid="link-bottom-signup" className="focus-ring mt-8 inline-flex items-center gap-2 font-bold text-primary underline decoration-primary/30 underline-offset-8">Start with your name <ArrowRight size={17} /></Link></div><div className="grid grid-cols-2 gap-3 md:gap-5"><Stat value="01" label="student profile, made light" /><Stat value="∞" label="questions worth asking" /><Stat value="03" label="ways to see your momentum" /><Stat value="24/7" label="a calm place to begin again" /></div></div></section>
      </main>
      <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-border/70 px-5 py-7 text-xs text-muted-foreground md:px-8"><Mark compact /><span>Made for the next question.</span></footer>
    </div>
  );
}

function Feature({ icon: Icon, index, title, text }: { icon: typeof MessageCircle; index: string; title: string; text: string }) {
  return <div className="rounded-[1.5rem] border border-primary/10 bg-[#f8fbf8] p-6 transition-transform hover:-translate-y-1"><div className="flex items-center justify-between"><span className="font-mono text-xs text-primary">{index}</span><Icon size={21} className="text-primary" /></div><h3 className="mt-12 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}
function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl bg-[#f5eee2] p-5 md:p-7"><p className="font-display text-3xl font-bold text-primary md:text-5xl">{value}</p><p className="mt-3 max-w-28 text-xs leading-5 text-muted-foreground">{label}</p></div>;
}