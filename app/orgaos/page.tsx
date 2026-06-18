'use client';

import { useState, useEffect } from 'react';
import { useAuth, authHeaders } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

export default function OrgaosPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', document: '', email: '', phone: '', notes: '' });

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) loadClients();
  }, [token, authLoading]);

  const loadClients = async () => {
    const res = await fetch('/api/clientes', { headers: authHeaders(token) });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = '/api/clientes';
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { ...form, id: editingId } : form;

    const res = await fetch(url, {
      method,
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      loadClients();
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', document: '', email: '', phone: '', notes: '' });
    }
  };

  const editClient = (client: Client) => {
    setForm({
      name: client.name,
      document: client.document,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Excluir este órgão? As tarefas vinculadas perderão a referência.')) return;
    await fetch(`/api/clientes?id=${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadClients();
  };

  if (authLoading || loading) {
    return <div className="text-center py-20 text-brand-navy/50 font-body">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-heading text-2xl text-brand-navy">Órgãos</h2>
          <p className="font-body text-sm text-brand-navy/50">{clients.length} órgão{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', document: '', email: '', phone: '', notes: '' }); }} className="btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Órgão
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-5 animate-fade-up">
          <form onSubmit={saveClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Nome / Razão Social</label>
              <input className="input-field text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">CPF / CNPJ</label>
              <input className="input-field text-sm" value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} required />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">E-mail</label>
              <input type="email" className="input-field text-sm" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Telefone</label>
              <input className="input-field text-sm" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Observações</label>
              <textarea className="input-field text-sm min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button type="submit" className="btn-primary text-sm">{editingId ? 'Atualizar' : 'Salvar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <div key={client.id} className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-navy/5 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-navy" />
                </div>
                <div>
                  <h3 className="font-body text-sm font-medium text-brand-navy">{client.name}</h3>
                  <span className="font-body text-xs text-brand-navy/40">{client.document}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => editClient(client)} className="p-1.5 hover:bg-brand-sand/20 rounded transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-brand-navy/40" />
                </button>
                <button onClick={() => deleteClient(client.id)} className="p-1.5 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-brand-navy/30 hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
            {(client.email || client.phone) && (
              <div className="space-y-1 text-xs text-brand-navy/50 font-body">
                {client.email && <p>{client.email}</p>}
                {client.phone && <p>{client.phone}</p>}
              </div>
            )}
          </div>
        ))}
        {clients.length === 0 && !showForm && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-16 font-body text-sm text-brand-navy/50">
            Nenhum órgão cadastrado. Clique em "Novo Órgão" para começar.
          </div>
        )}
      </div>
    </div>
  );
}
