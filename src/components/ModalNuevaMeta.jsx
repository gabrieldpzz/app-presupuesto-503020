import { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // O usar savingsService
import { crearMeta } from '../lib/savingsService';
import { X, Save, Loader2, Target } from 'lucide-react';

export default function ModalNuevaMeta({ isOpen, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: '', meta_total: '', color: 'indigo' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearMeta({ ...form, meta_total: parseFloat(form.meta_total) });
      onRefresh();
      onClose();
      setForm({ nombre: '', meta_total: '', color: 'indigo' });
    } catch (err) { alert(err.message); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const colors = [
    { id: 'indigo', class: 'bg-indigo-500' }, { id: 'emerald', class: 'bg-emerald-500' },
    { id: 'purple', class: 'bg-purple-500' }, { id: 'rose', class: 'bg-rose-500' },
    { id: 'amber', class: 'bg-amber-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2"><Target /> Nueva Meta</h3>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-accent)]">Nombre</label>
              <input required value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-xl p-3 font-bold text-[var(--text-main)] outline-none" placeholder="Ej: Viaje 2024" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-accent)]">Meta Total ($)</label>
              <input type="number" required value={form.meta_total} onChange={e=>setForm({...form, meta_total:e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-xl p-3 font-bold text-[var(--text-main)] outline-none" placeholder="0.00" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-accent)] mb-2 block">Color</label>
              <div className="flex gap-2 justify-center">
                 {colors.map(c => (
                    <button type="button" key={c.id} onClick={()=>setForm({...form, color: c.id})} className={`w-8 h-8 rounded-full ${c.class} ${form.color === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`} />
                 ))}
              </div>
           </div>
           <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black flex justify-center gap-2 mt-4 shadow-lg hover:bg-indigo-700">
             {loading ? <Loader2 className="animate-spin"/> : 'CREAR META'}
           </button>
        </form>
      </div>
    </div>
  );
}