'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { Loader2, Send, Sparkles, X } from 'lucide-react'
import ReactMarkdown from "react-markdown";

const SESSION_STORAGE_KEY = 'portfolio-chat-session-id'
export type PortfolioChatVariant = 'modal' | 'embedded'
export type PortfolioChatProps = {
  variant?: PortfolioChatVariant
  initialOpen?: boolean
}

type TextPart = { type: string; text?: string }
type ChatMessage = { id: string; role: 'system' | 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string }> }

function getSessionId() {
  if (typeof window === 'undefined') return ''
  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (stored) return stored
  const id = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, id)
  return id
}

function messageText(message: { parts?: TextPart[] }) {
  return message.parts?.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('') ?? ''
}

export function PortfolioChat({ variant = 'modal', initialOpen = false }: PortfolioChatProps) {
  const [sessionId, setSessionId] = useState('')
  const [input, setInput] = useState('')
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [open, setOpen] = useState(initialOpen)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => setSessionId(getSessionId()), [])

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { sessionId, question: messageText(messages[messages.length - 1] ?? {}) },
    }),
    fetch: async (input, init) => {
      const response = await fetch(input, init)
      if (response.status === 429) throw new Error('Rate limit')
      if (response.status === 400) throw new Error('Request error')
      return response
    },
  }), [sessionId])

  const { messages, setMessages, sendMessage, status, error } = useChat({ id: sessionId || 'portfolio-chat', transport })
  const isStreaming = status === 'submitted' || status === 'streaming'
  const rateLimited = error?.message === 'Rate limit'
  const errorInRequest = error?.message === "Request error"

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    setHistoryLoading(true)
    setHistoryError('')
    fetch(`/api/chat?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => {
        if (!response.ok) throw new Error('History')
        return response.json()
      })
      .then((history: ChatMessage[]) => {
        if (!cancelled) setMessages(history)
      })
      .catch(() => {
        if (!cancelled) setHistoryError('Could not load chat history. You can still try a new question.')
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId, setMessages])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`
  }, [input])

  useEffect(() => {
    if (variant !== 'modal' || !open) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [open, variant])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionId || !input.trim() || isStreaming || rateLimited) return
    const question = input.trim()
    setInput('')
    await sendMessage({ text: question })
  }

  const panel = (
    <section aria-label="Portfolio assistant" className={`flex w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-[0_24px_80px_rgba(69,44,130,0.18)] ${variant === 'modal' ? 'h-full max-w-none' : 'h-[min(620px,calc(100dvh-2rem))] max-w-[450px]'}`}>
      <header className="flex flex-row gap-3 items-center border-b border-border bg-secondary px-4 py-3 text-primary-foreground">
        
          <div className='text-accent'><Sparkles className="size-4" aria-hidden="true" /></div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent"> Portfolio AI assistant</p>
        
        {variant === 'modal' &&
        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 transition hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <X className="size-4" />
        </button>}
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        {historyLoading ? 
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading conversation...
        </div> 
        : 
        messages.length === 0 ? 
        <div className="rounded-2xl px-4 py-6 text-center text-xs leading-5" style={{width:"100%", height:"100%",display:"flex", flexDirection:"column",justifyContent:"center", alignItems:"center", color:"white", fontWeight:"bold", fontSize:"2rem", lineHeight:"2rem"}}> <div>Ask me about my projects, experience, or skills.</div>
        </div> 
        : 
        messages.map((message) => 
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[0.8125rem] leading-5 ${message.role === 'user' ? 'rounded-br-sm bg-primary text-secondary-foreground' : 'rounded-bl-sm bg-secondary text-secondary-foreground'}`}>
            <ReactMarkdown>{messageText(message) || (isStreaming && message.role === 'assistant' ? '...' : '')}</ReactMarkdown>
          </div>
        </div>)}
        {historyError && 
        <p role="alert" className="text-sm text-destructive">{historyError}</p>
        }
        {error && 
        <p role="alert" className="text-sm text-destructive">{rateLimited ? 'Too many requests. Please try again later.' : errorInRequest ? "Error during sending question. Please try again." : 'An error occurred. Please try again.'}</p>
        }
      </div>
      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-1.5 shadow-sm focus-within:border-primary">
          <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} maxLength={1000} rows={1} disabled={!sessionId || historyLoading || isStreaming || rateLimited} placeholder="Ask here..." aria-label="Ask about the portfolio" className="max-h-32 min-h-9 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-xs leading-5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" />
            <button type="submit" disabled={!input.trim() || !sessionId || historyLoading || isStreaming || rateLimited} aria-label="Send question" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-secondary-foreground transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40" style={{background: "#ff6a47"}}>
              <Send className="size-3.5" aria-hidden="true" />
            </button>
        </div>
        <p className="mt-1.5 text-right text-[0.65rem] text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
      </form>
    </section>
  )

  if (variant === 'embedded') return panel
  return <>
    <div className={`fixed inset-0 z-[60] bg-[#193c3c]/10 backdrop-blur-[2px] transition-opacity sm:bg-transparent sm:backdrop-blur-0 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setOpen(false)} aria-hidden={!open}>
      <div className="absolute inset-4 sm:inset-x-[8%] sm:top-8 sm:bottom-10" onClick={(event) => event.stopPropagation()}>
        {panel}
      </div>
    </div>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="portfolio-assistant" aria-label={open ? 'Close portfolio assistant' : 'Open portfolio assistant'} className="fixed bottom-5 right-5 z-[70] flex size-16 items-center justify-center rounded-xl bg-primary shadow-[0_12px_30px_rgba(25,60,60,0.3)] transition hover:-translate-y-1 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6d58d]">
        <Sparkles className="size-6" aria-hidden="true" />
      </button>
  </>
}

export default PortfolioChat