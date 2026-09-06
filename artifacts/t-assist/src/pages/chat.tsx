import { Camera, ChevronDown, ImagePlus, Mic, RefreshCw, Send, Sparkles, Volume2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getGetChatHistoryQueryKey, getGetCurrentStudentQueryKey, getGetProgressQueryKey, useGetChatHistory, useGetCurrentStudent, useGetProgress, useSendChatMessage } from '@workspace/api-client-react';
import type { Message } from '@workspace/api-client-react';
import { AppShell, StreakPill, TinyTemmy } from '@/components/t-assist-ui';

export default function Chat() {
  return <AppShell><ChatRoom /></AppShell>;
}

function ChatRoom() {
  const queryClient = useQueryClient();
  const { data: student } = useGetCurrentStudent({ query: { queryKey: getGetCurrentStudentQueryKey(), staleTime: 60_000 } });
  const { data: history, isLoading, isError, refetch } = useGetChatHistory({ query: { queryKey: getGetChatHistoryQueryKey(), retry: 1 } });
  const { data: progress } = useGetProgress({ query: { queryKey: getGetProgressQueryKey(), retry: 1 } });
  const send = useSendChatMessage();
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const messages = useMemo(() => history ?? [], [history]);
  const sendMessage = (contentText = draft, media?: { contentType: 'voice' | 'image'; mediaData: string; mediaMimeType: string }) => {
    const clean = contentText.trim();
    if (!clean || send.isPending) return;
    setDraft('');
    setNotice('');
    send.mutate({ data: { contentText: clean, contentType: media?.contentType ?? 'text', mediaData: media?.mediaData, mediaMimeType: media?.mediaMimeType } }, {
      onSuccess: (reply) => {
        queryClient.setQueryData<Message[]>(getGetChatHistoryQueryKey(), [...messages, reply.studentMessage, reply.temmyMessage]);
        queryClient.setQueryData(getGetProgressQueryKey(), reply.progress);
      },
      onError: () => { setDraft(clean); setNotice('Temmy missed that one. Check your connection and try again.'); },
    });
  };
  const startVoice = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice('Voice notes are not supported in this browser. You can type your question instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const dataUrl = await readFileAsDataUrl(blob);
        sendMessage('Here is a voice note. Please help me understand it.', {
          contentType: 'voice',
          mediaData: dataUrl.split(',')[1] ?? '',
          mediaMimeType: blob.type.split(';')[0] || 'audio/webm',
        });
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setNotice('Listening. Tap the microphone again when you are done.');
    } catch {
      setNotice('Temmy could not access your microphone. Check your browser permission and try again.');
    }
  };
  const stopVoice = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };
  const suggestions = ['Explain fractions simply', 'Help me revise for a test', 'I am stuck on an assignment'];

  return <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-8">
    <header className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Your study desk</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] md:text-4xl">Hey, {student?.name || 'there'}.</h1></div><div className="flex items-center gap-3"><StreakPill days={progress?.currentStreak ?? student?.currentStreak ?? 0} /><Link href="/progress" data-testid="link-chat-progress" className="focus-ring hidden rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold hover:bg-muted sm:block">View progress</Link></div></header>
    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="flex min-h-[calc(100dvh-190px)] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-[#fffaf1] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 md:px-7"><div className="flex items-center gap-3"><TinyTemmy /><div><p className="font-display font-bold">Temmy</p><p className="font-mono text-[10px] uppercase tracking-wider text-primary">ready to think with you</p></div></div><button data-testid="button-chat-menu" onClick={() => setNotice('Your conversation is saved to your study space.')} className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Conversation info"><ChevronDown size={18} /></button></div>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-8">
          {isLoading && <ChatSkeleton />}
          {isError && <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-[#e8c8c3] bg-[#fae0db] p-6 text-center"><p className="font-bold">The conversation is taking a breather.</p><button onClick={() => refetch()} data-testid="button-retry-chat" className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg bg-[#99473f] px-4 py-2 text-sm font-bold text-[#fffaf1]"><RefreshCw size={15} /> Try again</button></div>}
          {!isLoading && !isError && messages.length === 0 && <WelcomeMessage name={student?.name} onSuggestion={sendMessage} suggestions={suggestions} />}
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {send.isPending && <div className="flex items-start gap-3"><TinyTemmy /><div className="rounded-2xl rounded-tl-sm bg-[#e0f1ec] px-4 py-3"><span className="inline-flex gap-1"><i className="size-1.5 animate-soft-pulse rounded-full bg-primary" /><i className="size-1.5 animate-soft-pulse rounded-full bg-primary [animation-delay:.2s]" /><i className="size-1.5 animate-soft-pulse rounded-full bg-primary [animation-delay:.4s]" /></span></div></div>}
          {notice && <p data-testid="status-chat-notice" className="text-center text-xs font-semibold text-[#99473f]">{notice}</p>}
        </div>
        <div className="border-t border-border/70 bg-[#fcf6eb] px-4 pb-4 pt-3 md:px-7"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} data-testid={`button-suggestion-${suggestion.slice(0, 8).replaceAll(' ', '-').toLowerCase()}`} className="focus-ring shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary">{suggestion}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} data-testid="input-chat-message" rows={1} placeholder="Ask Temmy anything..." className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/70" /><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const dataUrl = await readFileAsDataUrl(file); sendMessage('Please help me understand this image.', { contentType: 'image', mediaData: dataUrl.split(',')[1] ?? '', mediaMimeType: file.type }); event.target.value = ''; }} /><button type="button" onClick={() => recording ? stopVoice() : void startVoice()} data-testid="button-voice-input" aria-label={recording ? 'Stop voice note' : 'Voice input'} className={`focus-ring grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary ${recording ? 'bg-[#fae0db] text-[#99473f]' : ''}`}><Mic size={18} /></button><button type="button" onClick={() => fileRef.current?.click()} data-testid="button-image-input" aria-label="Share an image" className="focus-ring hidden size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary sm:grid"><ImagePlus size={18} /></button><button type="submit" disabled={!draft.trim() || send.isPending} data-testid="button-send-message" aria-label="Send message" className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} /></button></form></div>
      </section>
      <aside className="hidden space-y-4 xl:block"><div className="rounded-[1.5rem] bg-primary p-5 text-primary-foreground"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/65">A small nudge</p><Sparkles size={18} className="text-accent" /></div><p className="mt-7 font-display text-xl font-bold leading-tight">You do not need to know where to start.</p><p className="mt-3 text-sm leading-6 text-primary-foreground/70">Ask Temmy for one next step. That is enough for today.</p></div><div className="rounded-[1.5rem] border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">While you are here</p><div className="mt-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-secondary font-display text-xl font-bold text-primary">{progress?.topics.length ?? 0}</span><div><p className="text-sm font-bold">topics explored</p><p className="text-xs text-muted-foreground">Every question leaves a trace.</p></div></div><div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold text-muted-foreground">Try asking about something you almost understand.</p><Link href="/progress" data-testid="link-side-progress" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">See your map <Volume2 size={13} /></Link></div></div></aside>
    </div>
  </div>;
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function WelcomeMessage({ name, suggestions, onSuggestion }: { name?: string; suggestions: string[]; onSuggestion: (value: string) => void }) {
  return <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center md:py-16"><div className="relative"><div className="grid size-20 place-items-center rounded-[1.7rem] bg-primary text-primary-foreground shadow-[6px_6px_0_rgba(39,54,69,.14)]"><Sparkles size={32} /></div><span className="absolute -right-2 -top-2 size-4 rounded-full bg-accent" /></div><p className="mt-7 font-mono text-[10px] uppercase tracking-[.2em] text-primary">A fresh page</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">What are we curious about?</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{name ? `Hi ${name}. ` : ''}Drop in a question, a stuck point, or a subject you want to make less mysterious.</p><div className="mt-7 flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => onSuggestion(suggestion)} data-testid={`button-welcome-${suggestion.slice(0, 7).replaceAll(' ', '-').toLowerCase()}`} className="focus-ring rounded-full border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary">{suggestion}</button>)}</div></div>;
}

function MessageBubble({ message }: { message: Message }) {
  const isStudent = message.sender === 'student';
  return <div data-testid={`message-${message.id}`} className={`flex items-start gap-3 ${isStudent ? 'justify-end' : ''}`}>{!isStudent && <TinyTemmy />}<div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${isStudent ? 'rounded-tr-sm bg-[#e9ddd0]' : 'rounded-tl-sm bg-[#e0f1ec]'}`}><p>{message.contentText}</p><time className="mt-1 block font-mono text-[9px] text-muted-foreground/70">{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div></div>;
}

function ChatSkeleton() {
  return <div className="space-y-5 animate-pulse"><div className="ml-auto h-16 w-2/3 rounded-2xl bg-muted" /><div className="h-24 w-3/4 rounded-2xl bg-muted" /><div className="ml-auto h-12 w-1/2 rounded-2xl bg-muted" /></div>;
}