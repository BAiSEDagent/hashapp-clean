import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronUp, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useDemo } from '@/context/DemoContext';

const VENICE_BADGE_STYLE = {
  background: 'rgba(100,80,255,0.12)',
  border: '0.5px solid rgba(100,80,255,0.28)',
  color: '#AFA9EC',
} as const;

const UNREAD_DOT_STYLE = { background: '#7F77DD' } as const;
const DEFAULT_SUBJECT = 'New conversation';
const AGENT_LABEL = 'Agent';
const ERROR_MESSAGE = 'Reasoning unavailable — check VENICE_API_KEY';

function VeniceBadge({ label = 'Venice' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider shrink-0"
      style={VENICE_BADGE_STYLE}
    >
      <span className="w-1 h-1 rounded-full" style={UNREAD_DOT_STYLE} />
      {label}
    </span>
  );
}

function AgentInitial({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      A
    </div>
  );
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function threadHasUnread(thread: { messages: Array<{ role: 'user' | 'assistant'; read: boolean }> }) {
  return thread.messages.some(message => message.role === 'assistant' && !message.read);
}

export function AgentChat() {
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    addThread,
    addMessage,
    markThreadRead,
    deleteThread,
    spendPermissions,
    rules,
    feed,
  } = useDemo() as any;

  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [pendingAssistantText, setPendingAssistantText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeThread = useMemo(
    () => threads.find((thread: any) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const hasUnread = useMemo(() => threads.some(threadHasUnread), [threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, pendingAssistantText]);

  useEffect(() => {
    if (activeThread) {
      inputRef.current?.focus();
    }
  }, [activeThread]);

  const handleOpenThread = useCallback((threadId: string) => {
    setExpanded(true);
    setActiveThreadId(threadId);
    markThreadRead(threadId);
    setConfirmDeleteId(null);
  }, [markThreadRead, setActiveThreadId]);

  const handleNewConversation = useCallback(() => {
    const thread = addThread(DEFAULT_SUBJECT);
    setExpanded(true);
    setActiveThreadId(thread.id);
    setConfirmDeleteId(null);
  }, [addThread, setActiveThreadId]);

  const handleBack = useCallback(() => {
    setActiveThreadId(null);
    setConfirmDeleteId(null);
  }, [setActiveThreadId]);

  const handleDeleteConfirm = useCallback((threadId: string) => {
    deleteThread(threadId);
    setConfirmDeleteId(null);
  }, [deleteThread]);

  const requestAssistant = useCallback(async (
    threadId: string,
    outboundMessages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ) => {
    setPendingAssistantText('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: outboundMessages,
          agentContext: {
            agentLabel: AGENT_LABEL,
            spendPermissions: spendPermissions
              .filter((permission: any) => permission.state === 'active')
              .map((permission: any) => ({ vendor: permission.vendor, amount: permission.amount, cadence: permission.cadence })),
            rulesCount: rules.filter((rule: any) => rule.enabled).length,
            recentActivity: feed.slice(0, 3).map((item: any) => ({
              merchant: item.merchant,
              amountStr: item.amountStr,
              status: item.status,
            })),
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('chat failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setPendingAssistantText(fullText);
      }

      addMessage(threadId, 'assistant', fullText.trim() || '[empty response]');
    } catch {
      addMessage(threadId, 'assistant', ERROR_MESSAGE);
    } finally {
      setPendingAssistantText('');
      setIsStreaming(false);
    }
  }, [addMessage, feed, rules, spendPermissions]);

  const handleSend = useCallback(async () => {
    if (!activeThreadId || isStreaming) return;
    const content = inputValue.trim();
    if (!content) return;

    const currentThread = threads.find((thread: any) => thread.id === activeThreadId);
    if (!currentThread) return;

    const nextMessages = [
      ...currentThread.messages.map((message: any) => ({ role: message.role, content: message.content } as const)),
      { role: 'user' as const, content },
    ];

    addMessage(activeThreadId, 'user', content);
    setInputValue('');
    await requestAssistant(activeThreadId, nextMessages);
  }, [activeThreadId, addMessage, inputValue, isStreaming, requestAssistant, threads]);

  if (!expanded && !activeThread) {
    return (
      <div onClick={() => setExpanded(true)} className="bg-card rounded-2xl border border-border/30 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors">
        <div className="flex items-center gap-3 p-5">
          <MessageCircle size={14} className="text-muted-foreground/40" />
          <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider flex-1">Ask the agent</span>
          {hasUnread && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={UNREAD_DOT_STYLE} />}
          <span className="text-[10px] text-muted-foreground/30 mr-1">Private reasoning</span>
          <VeniceBadge />
          <ChevronDown size={14} className="text-muted-foreground/30" />
        </div>
      </div>
    );
  }

  if (!activeThread) {
    return (
      <div className="bg-card rounded-2xl border border-border/30 overflow-hidden">
        <div onClick={() => setExpanded(false)} className="flex items-center gap-3 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.04]">
          <MessageCircle size={14} className="text-muted-foreground/40" />
          <span className="text-[12px] font-semibold text-muted-foreground/50 uppercase tracking-wider flex-1">Ask the agent</span>
          {hasUnread && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={UNREAD_DOT_STYLE} />}
          <VeniceBadge />
          <ChevronUp size={14} className="text-muted-foreground/30" />
        </div>
        <div className="divide-y divide-white/[0.04]">
          {threads.map((thread: any) => {
            const lastMessage = thread.messages.at(-1);
            const unread = threadHasUnread(thread);
            return (
              <div key={thread.id} onClick={() => handleOpenThread(thread.id)} className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-white/[0.025] active:bg-white/[0.04] transition-colors">
                <AgentInitial size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-foreground truncate">{thread.subject}</span>
                    {unread && <span className="w-[7px] h-[7px] rounded-full shrink-0" style={UNREAD_DOT_STYLE} />}
                  </div>
                  {lastMessage && <p className="text-[11px] text-muted-foreground/45 truncate mt-0.5">{lastMessage.content.slice(0, 40)}{lastMessage.content.length > 40 ? '…' : ''}</p>}
                </div>
                {lastMessage && <span className="text-[9px] text-muted-foreground/30 shrink-0">{formatTime(lastMessage.ts)}</span>}
                <ChevronRight size={12} className="text-muted-foreground/20 shrink-0" />
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/[0.04]">
          <button onClick={handleNewConversation} className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/20 transition-colors">New conversation</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/30 overflow-hidden flex flex-col" style={{ maxHeight: 420 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] shrink-0">
        <button onClick={handleBack} className="p-1 -ml-1 rounded-lg hover:bg-white/[0.06] transition-colors"><ArrowLeft size={16} className="text-muted-foreground/60" /></button>
        <span className="text-[13px] font-semibold text-foreground flex-1 truncate">{activeThread.subject}</span>
        <VeniceBadge />
        <button onClick={() => setConfirmDeleteId(activeThread.id)} className="p-1 rounded-lg hover:bg-rose-500/10 transition-colors ml-1"><Trash2 size={14} className="text-muted-foreground/40" /></button>
      </div>
      {confirmDeleteId === activeThread.id && (
        <div className="px-4 py-3 bg-rose-500/[0.06] border-b border-rose-500/10 shrink-0">
          <p className="text-[12px] font-semibold text-foreground mb-1">Delete this conversation?</p>
          <p className="text-[10px] text-muted-foreground/50 mb-3 leading-relaxed">Venice messages removed from device. Receipts and onchain proof are not affected.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-foreground/70 bg-white/[0.06] hover:bg-white/[0.09] transition-colors">Keep it</button>
            <button onClick={() => handleDeleteConfirm(activeThread.id)} className="flex-1 py-2 rounded-lg text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 transition-colors">Delete</button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {activeThread.messages.map((message: any) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {message.role === 'assistant' && <AgentInitial size={24} />}
            <div className="flex flex-col max-w-[80%]">
              <div className={`px-3 py-2 rounded-xl text-[12px] leading-relaxed ${message.role === 'user' ? 'bg-blue-600/20 text-foreground rounded-br-sm' : 'bg-white/[0.05] text-foreground/90 rounded-bl-sm'}`}>{message.content}</div>
              {message.role === 'assistant' && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider mt-1 self-start" style={{ background: 'rgba(100,80,255,0.10)', border: '0.5px solid rgba(100,80,255,0.25)', color: '#AFA9EC' }}>Private · Venice</span>}
            </div>
          </div>
        ))}
        {pendingAssistantText && (
          <div className="flex justify-start gap-2">
            <AgentInitial size={24} />
            <div className="px-3 py-2 rounded-xl rounded-bl-sm bg-white/[0.05] text-foreground/90 text-[12px] leading-relaxed max-w-[80%]">{pendingAssistantText}<span className="inline-block w-1.5 h-3 bg-primary/40 animate-pulse ml-0.5 rounded-sm" /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.04] shrink-0">
        <input ref={inputRef} value={inputValue} onChange={event => setInputValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder="Ask the agent..." disabled={isStreaming} className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/30 transition-colors disabled:opacity-50" />
        <button onClick={() => void handleSend()} disabled={!inputValue.trim() || isStreaming} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"><Send size={14} /></button>
      </div>
    </div>
  );
}
