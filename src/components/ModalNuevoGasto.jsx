import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarGastoRapido, actualizarGasto } from '../lib/expenseService';
import { X, Save, Loader2, Wallet, PieChart, MinusCircle } from 'lucide-react';

export default function ModalNuevoGasto({ isOpen, onClose, onRefresh, editingItem }) {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  
  const [form, setForm] = useState({
    monto: '',
    tipo: 'necesidad',
    categoria: 'Alimentacion',
    cuentaId: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { 
      if (isOpen) {
          fetchCuentas();
          if (editingItem) {
              setForm({
                  monto: editingItem.monto,
                  tipo: editingItem.tipo,
                  categoria: editingItem.categoria || 'Alimentacion',
                  cuentaId: editingItem.cuenta_id,
                  descripcion: editingItem.descripcion || '',
                  fecha: editingItem.fecha
              });
          } else {
              setForm(prev => ({ ...prev, monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], categoria: 'Alimentacion' }));
          }
      }
  }, [isOpen, editingItem]);

  async function fetchCuentas() {
    const { data } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentas(data || []);
    if (data && data.length > 0 && !editingItem) setForm(prev => ({ ...prev, cuentaId: data[0].id }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, monto: parseFloat(form.monto) };
      
      if (editingItem) {
          await actualizarGasto(editingItem.id, payload);
      } else {
          await registrarGastoRapido(payload);
      }
      
      onRefresh();
      onClose();
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
             <MinusCircle className="text-red-500" /> {editingItem ? 'Editar Gasto' : 'Gasto Rápido'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* MONTO */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">¿Cuánto gastaste?</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-accent)] font-bold">$</span>
                <input type="number" step="0.01" required autoFocus value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 pl-8 font-black text-[var(--text-main)] text-xl outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:font-normal" placeholder="0.00" />
             </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Concepto</label>
             <input required value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Ej: Supermercado, Cena, Uber..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* CATEGORÍA */}
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Categoría</label>
               <select 
                   value={form.categoria} 
                   onChange={(e) => setForm({...form, categoria: e.target.value})} 
                   className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-red-500 h-[50px] cursor-pointer"
               >
                   <option value="Alimentacion">🍔 Alimentación</option>
                   <option value="Transporte">🚗 Transporte</option>
                   <option value="Vivienda">🏠 Vivienda</option>
                   <option value="Salud">💊 Salud</option>
                   <option value="Entretenimiento">🎬 Entretenimiento</option>
                   <option value="Compras">🛍️ Compras</option>
                   <option value="Educacion">📚 Educación</option>
                   <option value="Varios">✨ Varios</option>
               </select>
             </div>

             {/* TIPO 50/30/20 */}
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block flex items-center gap-1"><PieChart size={10}/> Tipo</label>
               <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-red-500 cursor-pointer h-[50px]">
                 <option value="necesidad">Necesidad (50%)</option>
                 <option value="deseo">Gusto/Deseo (30%)</option>
                 <option value="ahorro">Ahorro/Inv. (20%)</option>
               </select>
             </div>
          </div>

          {/* CUENTA ORIGEN */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block flex items-center gap-1"><Wallet size={10}/> Pagar con</label>
             <select value={form.cuentaId} onChange={(e) => setForm({...form, cuentaId: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-red-500 cursor-pointer h-[50px]">
               {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.saldo})</option>)}
             </select>
          </div>

          <button disabled={loading || !form.cuentaId} className="w-full bg-red-500 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 mt-2 cursor-pointer active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {editingItem ? 'ACTUALIZAR' : 'REGISTRAR'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}