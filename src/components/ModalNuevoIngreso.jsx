import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarIngreso, actualizarIngreso } from '../lib/incomeService';
import { X, Save, Loader2, DollarSign, Calendar, Tag, Wallet } from 'lucide-react';

export default function ModalNuevoIngreso({ isOpen, onClose, onRefresh, editingItem }) {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  
  const [form, setForm] = useState({
    nombre: '',
    monto: '',
    categoria: 'Sueldo',
    cuentaId: '',
    fecha: new Date().toISOString().split('T')[0],
    sumaPresupuesto: true,
    descripcion: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCuentas();
      if (editingItem) {
        setForm({
           nombre: editingItem.nombre || '',
           monto: editingItem.monto,
           categoria: editingItem.categoria,
           cuentaId: editingItem.cuenta_id,
           fecha: editingItem.fecha,
           sumaPresupuesto: editingItem.suma_a_presupuesto,
           descripcion: editingItem.descripcion || ''
        });
      } else {
        setForm(prev => ({ 
            ...prev, nombre: '', monto: '', descripcion: '', 
            fecha: new Date().toISOString().split('T')[0] 
        }));
      }
    }
  }, [isOpen, editingItem]);

  async function fetchCuentas() {
    const { data } = await supabase.from('cuentas').select('id, nombre, saldo').order('saldo', { ascending: false });
    setCuentas(data || []);
    if (data && data.length > 0 && !editingItem) {
      setForm(prev => ({ ...prev, cuentaId: data[0].id }));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        monto: parseFloat(form.monto),
        categoria: form.categoria,
        cuentaId: form.cuentaId,
        fecha: form.fecha,
        sumaPresupuesto: form.sumaPresupuesto,
        descripcion: form.descripcion
      };

      if (editingItem) {
         await actualizarIngreso(editingItem.id, payload);
      } else {
         await registrarIngreso(payload);
      }
      
      onRefresh();
      onClose();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
             <DollarSign className="text-emerald-500" /> {editingItem ? 'Editar Ingreso' : 'Nuevo Ingreso'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* CAMPO NOMBRE */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Nombre del Ingreso</label>
             <input 
               autoFocus
               required 
               value={form.nombre} 
               onChange={(e) => setForm({...form, nombre: e.target.value})} 
               className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:font-normal" 
               placeholder="Ej: Nómina Quincena 1" 
             />
          </div>

          {/* MONTO */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Monto</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-accent)] font-bold">$</span>
                <input 
                  type="number" step="0.01" required 
                  value={form.monto} 
                  onChange={(e) => setForm({...form, monto: e.target.value})} 
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 pl-8 font-black text-[var(--text-main)] text-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" 
                  placeholder="0.00" 
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* CATEGORÍA */}
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block flex items-center gap-1"><Tag size={10}/> Fuente</label>
               <select 
                 value={form.categoria} 
                 onChange={(e) => setForm({...form, categoria: e.target.value})} 
                 className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer h-[50px]"
               >
                 <option value="Sueldo">Sueldo / Nómina</option>
                 <option value="Honorarios">Honorarios</option>
                 <option value="Ventas">Ventas</option>
                 <option value="Regalo">Regalo</option>
                 <option value="Devolucion">Devolución</option>
                 <option value="Inversion">Rendimientos</option>
                 <option value="Otros">Otros</option>
               </select>
             </div>

             {/* FECHA */}
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block flex items-center gap-1"><Calendar size={10}/> Fecha</label>
               <input 
                 type="date" 
                 required 
                 value={form.fecha} 
                 onChange={(e) => setForm({...form, fecha: e.target.value})} 
                 className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer h-[50px]"
               />
             </div>
          </div>

          {/* CUENTA DESTINO */}
          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block flex items-center gap-1"><Wallet size={10}/> Ingresar en Cuenta</label>
             <select 
                 value={form.cuentaId} 
                 onChange={(e) => setForm({...form, cuentaId: e.target.value})} 
                 className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
             >
                 {cuentas.map(c => (
                   <option key={c.id} value={c.id}>{c.nombre} (Saldo: ${c.saldo})</option>
                 ))}
             </select>
          </div>

          {/* CHECKBOX PRESUPUESTO */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-indigo-500/10 transition-colors" onClick={() => setForm({...form, sumaPresupuesto: !form.sumaPresupuesto})}>
             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${form.sumaPresupuesto ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300'}`}>
                {form.sumaPresupuesto && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
             </div>
             <div className="flex-1">
                <p className="font-bold text-sm text-[var(--text-main)]">Sumar a Presupuesto Mensual</p>
                <p className="text-[10px] text-[var(--text-accent)] leading-tight mt-0.5">
                   Actívalo si este ingreso cuenta para tus reglas 50/30/20.
                </p>
             </div>
          </div>

          <button 
            disabled={loading || !form.cuentaId} 
            className="w-full bg-emerald-500 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 mt-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {editingItem ? 'ACTUALIZAR' : 'REGISTRAR'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}