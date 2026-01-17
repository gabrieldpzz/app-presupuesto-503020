import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { realizarTransferencia } from '../lib/expenseService';
import { X, ArrowRightLeft, Loader2, ArrowRight, PiggyBank } from 'lucide-react';

export default function ModalTransferencia({ isOpen, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  
  // Nuevo estado para marcar como ahorro
  const [esAhorro, setEsAhorro] = useState(false);

  const [form, setForm] = useState({ origen: '', destino: '', monto: '' });

  useEffect(() => { 
      if (isOpen) {
          fetchCuentas();
          setEsAhorro(false); // Resetear al abrir
      }
  }, [isOpen]);

  async function fetchCuentas() {
    const { data } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentas(data || []);
    if (data && data.length >= 2) {
       setForm(prev => ({ ...prev, origen: data[0].id, destino: data[1].id }));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.origen === form.destino) return alert("La cuenta de origen y destino no pueden ser la misma.");
    setLoading(true);
    try {
      // Pasamos el parámetro esAhorro (true/false)
      await realizarTransferencia(form.origen, form.destino, parseFloat(form.monto), esAhorro);
      onRefresh();
      onClose();
      setForm(prev => ({ ...prev, monto: '' }));
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
             <ArrowRightLeft className="text-amber-500" /> Transferencia
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="flex-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Desde (Origen)</label>
                 <select value={form.origen} onChange={(e) => setForm({...form, origen: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none h-[50px] cursor-pointer">
                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.saldo})</option>)}
                 </select>
              </div>
              <ArrowRight className="text-[var(--text-accent)] mt-5" />
              <div className="flex-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Hacia (Destino)</label>
                 <select value={form.destino} onChange={(e) => setForm({...form, destino: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none h-[50px] cursor-pointer">
                    {cuentas.filter(c => c.id !== form.origen).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                 </select>
              </div>
           </div>

           <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Monto a Transferir</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-accent)] font-bold">$</span>
                <input type="number" step="0.01" required autoFocus value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 pl-8 font-black text-[var(--text-main)] text-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all" placeholder="0.00" />
             </div>
           </div>

           {/* SWITCH: Contar como Ahorro */}
           <div 
             onClick={() => setEsAhorro(!esAhorro)}
             className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${esAhorro ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[var(--bg-app)] border-[var(--border)] hover:border-amber-300'}`}
           >
              <div className={`p-2 rounded-full transition-colors ${esAhorro ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'}`}>
                 <PiggyBank size={20} />
              </div>
              <div className="flex-1">
                 <p className={`font-bold text-sm ${esAhorro ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>
                    Contar como Ahorro
                 </p>
                 <p className="text-[10px] text-[var(--text-accent)] leading-tight">
                    Si activas esto, se sumará a tu meta del 20% en las estadísticas.
                 </p>
              </div>
              {/* Toggle Visual */}
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${esAhorro ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${esAhorro ? 'translate-x-4' : ''}`} />
              </div>
           </div>

           <button disabled={loading} className="w-full bg-amber-500 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50">
             {loading ? <Loader2 className="animate-spin" /> : <><ArrowRightLeft size={20} /> TRANSFERIR</>}
           </button>
        </form>
      </div>
    </div>
  );
}