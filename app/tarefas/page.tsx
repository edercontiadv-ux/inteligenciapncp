'use client';

import { useState, useEffect } from 'react';
import { useAuth, authHeaders } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Plus, Circle, CheckCircle2, Clock, AlertTriangle, Trash2, User } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  document: string;
}

interface Task {
  id: string;
  description: string;
  processNumber: string;
  type: string;
  priority: string;
  deadline: string | null;
  responsible: string | null;
  status: string;
  clientId: string | null;
  client: Client | null;
}

export default function TarefasPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: '',
    processNumber: '',
    type: 'Prazo',
    priority: 'alta',
    deadline: '',
    responsible: '',
    clientId: '',
  });

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) {
      loadData();
    }
  }, [token, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        fetch('/api/tarefas', { headers: authHeaders(token) }),
        fetch('/api/clientes', { headers: authHeaders(token) }),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks(prev => [...prev, task]);
        setShowForm(false);
        setForm({ description: '', processNumber: '', type: 'Prazo', priority: 'alta', deadline: '', responsible: '', clientId: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    try {
      await fetch(`/api/tarefas?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'pendente' ? 'concluida' : 'pendente';
    try {
      await fetch('/api/tarefas', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ ...task, id: task.id, status: newStatus, deadline: task.deadline || null }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'concluida');

  const priorityColor = (p: string) => {
    switch (p) {
      case 'alta': return 'text-red-500';
      case 'media': return 'text-yellow-500';
      case 'baixa': return 'text-green-500';
      default: return 'text-brand-navy/50';
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
  };

  const daysUntil = (d: string | null) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (authLoading || loading) {
    return <div className="text-center py-20 text-brand-navy/50 font-body">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-heading text-2xl text-brand-navy">Tarefas</h2>
          <p className="font-body text-sm text-brand-navy/50">{user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-brand-navy/50 bg-brand-sand/20 px-3 py-1.5 rounded-full">
            Pendentes ({pendingTasks.length})
          </span>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-5 animate-fade-up">
          <form onSubmit={createTask} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Descrição</label>
              <input className="input-field text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Nº Processo</label>
              <input className="input-field text-sm" value={form.processNumber} onChange={e => setForm({ ...form, processNumber: e.target.value })} required />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Cliente</label>
              <select className="select-field text-sm" value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Sem cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Tipo</label>
              <select className="select-field text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>Prazo</option>
                <option>Audiência</option>
                <option>Petição</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Prioridade</label>
              <select className="select-field text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Prazo</label>
              <input type="date" className="input-field text-sm" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-brand-navy/70 mb-1 block">Responsável</label>
              <input className="input-field text-sm" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary text-sm">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks Table */}
      <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-sand/30 bg-brand-mist/30">
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Tarefa</th>
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Cliente</th>
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Prioridade</th>
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Prazo</th>
                <th className="text-left font-body text-xs font-medium text-brand-navy/50 uppercase tracking-wider px-4 py-3">Responsável</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 font-body text-sm text-brand-navy/50">
                    Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para começar.
                  </td>
                </tr>
              )}
              {tasks.map(task => {
                const days = daysUntil(task.deadline);
                return (
                  <tr key={task.id} className={`border-b border-brand-sand/10 hover:bg-brand-mist/20 transition-colors ${task.status === 'concluida' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleStatus(task)} className="shrink-0">
                          {task.status === 'concluida' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-brand-navy/30 hover:text-brand-navy/50 transition-colors" />
                          )}
                        </button>
                        <div>
                          <span className="font-body text-sm text-brand-navy font-medium block leading-tight">{task.description}</span>
                          <span className="font-body text-xs text-brand-navy/40">{task.processNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.client ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-brand-navy/40" />
                          <span className="font-body text-sm text-brand-navy/70">{task.client.name}</span>
                        </div>
                      ) : (
                        <span className="font-body text-sm text-brand-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-xs bg-brand-sand/20 text-brand-navy/60 px-2 py-1 rounded-full">{task.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-3.5 h-3.5 ${priorityColor(task.priority)}`} />
                        <span className={`font-body text-sm capitalize ${priorityColor(task.priority)}`}>{task.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-navy/40" />
                        <span className="font-body text-sm text-brand-navy/70">{formatDate(task.deadline)}</span>
                        {days !== null && days <= 7 && task.status !== 'concluida' && (
                          <span className={`font-body text-xs font-medium ${days <= 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                            {days <= 0 ? 'vencido' : `${days}d`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-sm text-brand-navy/70">{task.responsible || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-brand-navy/30 hover:text-red-400 transition-colors" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
