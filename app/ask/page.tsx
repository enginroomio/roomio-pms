'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

export default function AskPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Merhaba! Otel hizmetleri hakkında sorularınızı yanıtlayabilirim.' },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, audience: 'guest' }),
      });
      const j = (await res.json()) as { ok: boolean; reply: string; message?: string };
      setMessages((m) => [...m, { role: 'assistant', text: j.ok ? j.reply : (j.message ?? 'Yanıt alınamadı') }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Bot size={28} />
          <div>
            <strong>Otel AI Asistan</strong>
            <span>7/24 misafir desteği</span>
          </div>
        </div>

        <div className="roomio-public-portal__stack" style={{ marginTop: 16, maxHeight: 360, overflowY: 'auto' }}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="roomio-card"
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--roomio-accent-soft, #eef2ff)' : undefined,
              }}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form className="roomio-public-portal__stack" style={{ marginTop: 12 }} onSubmit={(e) => void send(e)}>
          <label className="roomio-field">
            <span>Sorunuz</span>
            <input
              className="roomio-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Check-in nasıl yapılır? SPA saatleri?"
              disabled={loading}
            />
          </label>
          <button className="roomio-btn roomio-btn--primary" type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Yanıtlanıyor…' : 'Gönder'}
          </button>
        </form>

        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          <Link href="/guest">Misafir portalı</Link> · <Link href="/app">Mobil uygulama</Link>
        </p>
      </div>
    </div>
  );
}
