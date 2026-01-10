import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { depositarAhorro, getMetas } from '../lib/savingsService';
import { X, Save, Loader2, Wallet, Target } from 'lucide-react';

export default function ModalDepositarAhorro({ isOpen, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [metas, setMetas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  
  const [form, setForm] = useState({
    metaId: '',
    cuentaId: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  async function fetchData() {
    const metasData = await getMetas();
    const { data: cuentasData } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    
    setMetas(metasData);
    setCuentas(cuentasData || []);
    
    if (metasData.length > 0) setForm(prev => ({ ...prev, metaId: metasData[0].id }));
    if (cuentasData && cuentasData.length > 0) setForm(prev => ({ ...prev, cuentaId: cuentasData[0].id }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await depositarAhorro(form.metaId, form.cuentaId, parseFloat(form.monto), form.fecha);
      onRefresh();
      onClose();
      setForm(prev => ({ ...prev, monto: '' }));
    } catch (error) { alert(error.message); } 
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2"><Target className="text-purple-500"/> Aportar a Meta</h3>
          <button onClick={onClose}><X/></button>
        </div>

        {metas.length === 0 ? (
            <p className="text-center text-[var(--text-accent)]">No tienes metas creadas. Ve a la sección Ahorros para crear una.</p>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-accent)] ml-1 mb-1 block">¿Cuánto vas a ahorrar?</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-accent)] font-bold">$</span>
                    <input type="number" step="0.01" required autoFocus value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 pl-8 font-black text-[var(--text-main)] text-xl outline-none focus:ring-2 focus:ring-purple-500" placeholder="0.00" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-accent)] mb-1 block">Destino (Meta)</label>
                    <select value={form.metaId} onChange={(e) => setForm({...form, metaId: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none h-[50px]">
                        {metas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-accent)] mb-1 block">Origen (Cuenta)</label>
                    <select value={form.cuentaId} onChange={(e) => setForm({...form, cuentaId: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none h-[50px]">
                        {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.saldo})</option>)}
                    </select>
                </div>
            </div>

            <button disabled={loading} className="w-full bg-purple-500 text-white py-4 rounded-3xl font-black flex justify-center gap-2 shadow-xl shadow-purple-500/20 mt-2 hover:bg-purple-600">
                {loading ? <Loader2 className="animate-spin" /> : 'GUARDAR APORTE'}
            </button>
            </form>
        )}
      </div>
    </div>
  );
}