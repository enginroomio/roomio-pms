'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { DEMO_CRM_MESSAGES, HOTEL_DIRECTORY, type CrmMessage } from '@/lib/data/guest-relations';

const CRM_STORAGE_KEY = 'roomio:gr-crm-messages-v1';

function loadCrmMessages(): CrmMessage[] {
  if (typeof window === 'undefined') return DEMO_CRM_MESSAGES;
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return DEMO_CRM_MESSAGES;
    const parsed = JSON.parse(raw) as CrmMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO_CRM_MESSAGES;
  } catch {
    return DEMO_CRM_MESSAGES;
  }
}

function saveCrmMessages(messages: CrmMessage[]) {
  localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(messages.slice(0, 100)));
}

export function GrCrmMessagesPanel() {
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [guest, setGuest] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<CrmMessage['channel']>('Portal');

  useEffect(() => {
    setMessages(loadCrmMessages());
  }, []);

  const openCount = useMemo(() => messages.filter((m) => m.status === 'Yeni').length, [messages]);

  function reply(id: string) {
    const next = messages.map((m) => (m.id === id ? { ...m, status: 'Yanıtlandı' as const } : m));
    setMessages(next);
    saveCrmMessages(next);
  }

  function addMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!guest.trim() || !subject.trim()) return;
    const row: CrmMessage = {
      id: `crm-${Date.now()}`,
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      channel,
      guest: guest.trim(),
      subject: subject.trim(),
      body: body.trim() || '—',
      status: 'Yeni',
    };
    const next = [row, ...messages];
    setMessages(next);
    saveCrmMessages(next);
    setGuest('');
    setSubject('');
    setBody('');
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Online CRM mesajı</h2>
        <form className="roomio-form-grid" style={{ marginTop: 12 }} onSubmit={addMessage}>
          <label className="roomio-field"><span>Kanal</span>
            <select className="roomio-input" value={channel} onChange={(e) => setChannel(e.target.value as CrmMessage['channel'])}>
              <option>Portal</option><option>WhatsApp</option><option>E-posta</option><option>Telefon</option>
            </select>
          </label>
          <label className="roomio-field"><span>Misafir</span><input className="roomio-input" value={guest} onChange={(e) => setGuest(e.target.value)} required /></label>
          <label className="roomio-field roomio-field--full"><span>Konu</span><input className="roomio-input" value={subject} onChange={(e) => setSubject(e.target.value)} required /></label>
          <label className="roomio-field roomio-field--full"><span>Mesaj</span><textarea className="roomio-input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></label>
          <div className="roomio-form-actions"><Button type="submit">Kaydet</Button></div>
        </form>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Gelen kutusu</h2>
          <span className="roomio-badge">{openCount} yeni</span>
        </div>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Zaman</th><th>Kanal</th><th>Misafir</th><th>Konu</th><th>Durum</th><th /></tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Mesaj yok.</td></tr>
            ) : messages.map((m) => (
              <tr key={m.id}>
                <td>{m.at}</td>
                <td>{m.channel}</td>
                <td>{m.guest}{m.roomNo ? ` (${m.roomNo})` : ''}</td>
                <td>{m.subject}</td>
                <td><span className="roomio-badge">{m.status}</span></td>
                <td>
                  {m.status === 'Yeni' ? (
                    <Button variant="ghost" onClick={() => reply(m.id)}>Yanıtla</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GrDirectoryPanel() {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HOTEL_DIRECTORY;
    return HOTEL_DIRECTORY.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.phone.includes(q),
    );
  }, [query]);

  return (
    <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
      <div className="roomio-kurulus-toolbar">
        <h2 className="roomio-card-title">Adres ve telefon rehberi</h2>
        <input className="roomio-input" placeholder="Ara…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 220 }} />
      </div>
      <table className="roomio-table" style={{ marginTop: 12 }}>
        <thead>
          <tr><th>Ad</th><th>Görev</th><th>Departman</th><th>Telefon</th><th>Dahili</th><th>E-posta</th></tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{e.role}</td>
              <td>{e.department}</td>
              <td>{e.phone}</td>
              <td>{e.extension ?? '—'}</td>
              <td>{e.email ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
