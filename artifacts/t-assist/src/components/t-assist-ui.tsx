import { BookOpen, ChartNoAxesColumnIncreasing, ChevronRight, CircleHelp, Flame, LogOut, MessageCircle, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useGetCurrentStudent, useLogOut } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCurrentStudentQueryKey } from '@workspace/api-client-react';

export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className="focus-ring inline-flex items-center gap-2.5">
      <span className="relative grid size-10 place-items-center rounded-[13px] bg-primary text-primary-foreground shadow-[4px_4px_0_rgba(39,54,69,.14)]">
        <span className="font-display text-xl font-bold">T</span>
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-accent" />
      </span>
      {!compact && <span className="font-display text-xl font-bold tracking-[-.04em]">T-assist</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: student, isLoading, isError } = useGetCurrentStudent({
    query: { queryKey: getGetCurrentStudentQueryKey(), retry: false },
  });
  const logout = useLogOut();

  if (isLoading) {
    return <div className="app-shell min-h-[100dvh] p-5"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-14 w-44 rounded-xl bg-muted" /><div className="mt-8 h-[65vh] rounded-[2rem] bg-muted/60" /></div></div>;
  }
  if (isError || !student) {
    if (location !== '/login') setLocation('/login');
    return <div className="app-shell min-h-[100dvh] grid place-items-center"><div className="h-10 w-10 animate-soft-pulse rounded-full bg-accent" /></div>;
  }

  const nav = [
    { href: '/chat', label: 'Talk to Temmy', icon: MessageCircle },
    { href: '/progress', label: 'Your progress', icon: ChartNoAxesColumnIncreasing },
  ];
  const initials = student.name.trim().slice(0, 1).toUpperCase();
  return (
    <div className="noise app-shell min-h-[100dvh] md:flex">
      <aside className="hidden w-[250px] shrink-0 flex-col border-r border-border/80 bg-[#f5eee2]/75 px-5 py-6 md:flex">
        <Mark />
        <div className="mt-14 space-y-2">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your desk</p>
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${location === href ? 'bg-primary text-primary-foreground' : 'text-foreground/65 hover:bg-muted hover:text-foreground'}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{location === href && <ChevronRight size={15} className="ml-auto" />}
            </Link>
          ))}
        </div>
        <div className="mt-auto rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-accent font-display font-bold">{initials}</span>
            <div className="min-w-0"><p className="truncate text-sm font-bold" data-testid="text-student-name">{student.name}</p><p className="font-mono text-[10px] text-muted-foreground">{student.ageOrClassLevel}</p></div>
          </div>
          <button onClick={() => logout.mutate(undefined, { onSuccess: () => { queryClient.removeQueries({ queryKey: getGetCurrentStudentQueryKey() }); setLocation('/'); } })} data-testid="button-log-out" className="focus-ring mt-4 flex w-full items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-destructive"><LogOut size={14} /> Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-[#f5eee2]/95 px-4 py-3 backdrop-blur md:hidden">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-mobile-${href.slice(1)}`} className={`focus-ring flex flex-col items-center gap-1 text-[10px] font-bold ${location === href ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={20} /><span>{label}</span></Link>)}
        <button onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation('/') })} data-testid="button-mobile-log-out" className="focus-ring flex flex-col items-center gap-1 text-[10px] font-bold text-muted-foreground"><LogOut size={20} /><span>Sign out</span></button>
      </nav>
    </div>
  );
}

export function TinyTemmy() {
  return <div className="grid size-9 place-items-center rounded-[12px] bg-primary text-primary-foreground shadow-[3px_3px_0_rgba(39,54,69,.12)]"><Sparkles size={17} /></div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-border bg-card/60 p-10 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><CircleHelp size={24} /></div><h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p></div>;
}

export function StreakPill({ days }: { days: number }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs font-medium text-foreground"><Flame size={14} className="text-[#e76f35]" /> {days} day{days === 1 ? '' : 's'} steady</span>;
}

export function SubjectMark({ subject }: { subject: string }) {
  const colors = ['bg-[#d7eee8] text-primary', 'bg-[#ffe1c7] text-[#a94d27]', 'bg-[#e1dafa] text-[#57478e]', 'bg-[#f9d4d5] text-[#a7434b)'];
  const color = colors[subject.length % colors.length].replace(')', '');
  return <span className={`grid size-10 place-items-center rounded-xl font-display text-sm font-bold ${color}`}>{subject.slice(0, 2).toUpperCase()}</span>;
}