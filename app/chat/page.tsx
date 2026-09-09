'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { Send, Sparkles } from 'lucide-react'

const SESSION_STORAGE_KEY = 'portfolio-chat-session-id'

function getSessionId() {
	if (typeof window === 'undefined') {
		return ''
	}

	const storedSessionId = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
	if (storedSessionId) {
		return storedSessionId
	}

	const sessionId = crypto.randomUUID()
	window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
	return sessionId
}

export default function ChatPage() {
	const [sessionId, setSessionId] = useState('')
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		setSessionId(getSessionId())				
	}, [])

	const { messages, setMessages, sendMessage, status, error, id } = useChat({
		id: sessionId ,
		transport: new DefaultChatTransport({
			api: '/api/chat',
			prepareSendMessagesRequest: ({ messages: pendingMessages }) => {
				console.log(messages)
				const lastMessage = pendingMessages[pendingMessages.length - 1]
				const question = lastMessage?.parts
					.filter((part) => part.type === 'text')
					.map((part) => part.text)
					.join('')

				return {
					body: { sessionId, question },
				}
			},
		}),
	})

	useEffect(() => {
		if (!sessionId) return
		fetch(`/api/chat?sessionId=${sessionId}`)
			.then((res) => res.json())
			.then(setMessages)
			.finally(() => setLoading(false));
	}, [sessionId]);

	const isStreaming = status === 'submitted' || status === 'streaming'
// id = error kbir f chat ui ya3ni handle des erreur, stream de reponse fin ki kon, upstach rate limit, setmessages
	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const question = input.trim()
		if (!question || !sessionId || isStreaming) {
			return
		}

		setInput('')
		await sendMessage({ text: question })
	}

	return (
		<main className="min-h-screen bg-[#f6f4ef] px-4 py-8 text-[#20211e] sm:px-6 lg:px-8">
			<section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#d9d5cb] bg-[#fffdf8] shadow-[0_24px_80px_rgba(52,48,37,0.12)]">
				<header className="border-b border-[#e5e1d8] px-5 py-5 sm:px-8">
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-2xl bg-[#193c3c] text-[#f6d58d]">
							<Sparkles className="size-5" aria-hidden="true" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a06b3b]">Test console</p>
							<h1 className="font-serif text-2xl font-semibold tracking-tight">Portfolio assistant</h1>
						</div>
					</div>
					<p className="mt-4 max-w-xl text-sm leading-6 text-[#6f6b62]">
						Posez une question et observez la réponse arriver en temps réel.
					</p>
				</header>

				<div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
					{messages.length === 0 && (
						<div className="rounded-2xl border border-dashed border-[#d9d5cb] px-5 py-8 text-center text-sm text-[#777268]">
							Commencez par demander quelque chose sur le portfolio.
						</div>
					)}

					{loading ? <div>Chargement des messages...</div> : messages.map((message) => {
						const text = message.parts
							.filter((part) => part.type === 'text')
							.map((part) => part.text)
							.join('')

						return (
							<div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
								<div
									className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
										message.role === 'user'
											? 'rounded-br-sm bg-[#193c3c] text-[#fffdf8]'
											: 'rounded-bl-sm bg-[#f0ede5] text-[#34352f]'
									}`}
								>
									{text || (isStreaming && message.role === 'assistant' ? '...' : '')}
								</div>
							</div>
						)
					})}

					{error && <p className="text-sm text-red-700">Erreur : {error.message}</p>}
				</div>

				<form onSubmit={handleSubmit} className="border-t border-[#e5e1d8] p-4 sm:p-6">
					<div className="flex items-end gap-3 rounded-2xl border border-[#d9d5cb] bg-white p-2 shadow-sm focus-within:border-[#193c3c]">
						<textarea
							value={input}
							onChange={(event) => setInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' && !event.shiftKey) {
									event.preventDefault()
									event.currentTarget.form?.requestSubmit()
								}
							}}
							placeholder="Écrivez votre question..."
							rows={1}
							maxLength={1000}
							disabled={!sessionId || isStreaming}
							className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#9b978d] disabled:cursor-not-allowed"
							aria-label="Question"
						/>
						<button
							type="submit"
							disabled={!input.trim() || !sessionId || isStreaming}
							className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#193c3c] text-[#fffdf8] transition hover:bg-[#285858] disabled:cursor-not-allowed disabled:opacity-40"
							aria-label="Envoyer la question"
						>
							<Send className="size-4" aria-hidden="true" />
						</button>
					</div>
					<p className="mt-2 text-right text-xs text-[#9b978d]">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</p>
				</form>
			</section>
		</main>
	)
}
