import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Save, Loader2, ShoppingCart } from 'lucide-react';

export default function ModalNuevaLista({ isOpen, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('blue');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('listas').insert([{ nombre, color }]);
      if (error) throw error;
      onRefresh();
      onClose();
      setNombre('');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'emerald', class: 'bg-emerald-500' },
    { id: 'purple', class: 'bg-purple-500' },
    { id: 'rose', class: 'bg-rose-500' },
    { id: 'amber', class: 'bg-amber-500' },
    { id: 'slate', class: 'bg-slate-800' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-[2rem] border border-[var(--border)] shadow-2xl p-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-500" /> Nueva Lista
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)]"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Nombre de la Lista</label>
             <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Supermercado" />
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-2 block">Color de Etiqueta</label>
             <div className="flex gap-2 justify-center">
                {colors.map((c) => (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => setColor(c.id)}
                    className={`w-8 h-8 rounded-full ${c.class} transition-all ${color === c.id ? 'ring-2 ring-offset-2 ring-[var(--text-main)] scale-110' : 'opacity-60 hover:opacity-100'}`}
                  />
                ))}
             </div>
          </div>

          <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black flex justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" /> : 'CREAR LISTA'}
          </button>
        </form>
      </div>
    </div>
  );
}