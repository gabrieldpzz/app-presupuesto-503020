import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarGastoRapido, actualizarGasto } from '../lib/expenseService';
import { X, Save, Loader2, Wallet, PieChart, MinusCircle, Users, Plus, Trash2 } from 'lucide-react';

export default function ModalNuevoGasto({ isOpen, onClose, onRefresh, editingItem }) {
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  
  // Estado para dividir cuenta
  const [isSplit, setIsSplit] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMonto, setNuevoMonto] = useState('');
  
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
              
              // Buscar deudas asociadas al gasto
              fetchDeudasDelGasto(editingItem.id);
          } else {
              setForm(prev => ({ ...prev, monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], categoria: 'Alimentacion' }));
              setIsSplit(false);
              setPersonas([]);
          }
      }
  }, [isOpen, editingItem]);

  async function fetchCuentas() {
    const { data } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentas(data || []);
    if (data && data.length > 0 && !editingItem) setForm(prev => ({ ...prev, cuentaId: data[0].id }));
  }

  // Función para traer deudas del gasto al editar
  const fetchDeudasDelGasto = async (gastoId) => {
    try {
      const { data } = await supabase.from('deudas').select('*').eq('gasto_id', gastoId);
      if (data && data.length > 0) {
        setIsSplit(true);
        // Mapear al formato { nombre, monto }
        setPersonas(data.map(d => ({ nombre: d.persona, monto: d.monto })));
      } else {
        setIsSplit(false);
        setPersonas([]);
      }
    } catch (error) {
      console.error('Error fetching deudas:', error);
      setIsSplit(false);
      setPersonas([]);
    }
  };

  // Agregar persona a la lista
  const addPersona = () => {
    if (!nuevoNombre || !nuevoMonto) return;
    setPersonas([...personas, { nombre: nuevoNombre, monto: parseFloat(nuevoMonto) }]);
    setNuevoNombre('');
    setNuevoMonto('');
  };

  const removePersona = (idx) => {
    const temp = [...personas];
    temp.splice(idx, 1);
    setPersonas(temp);
  };

  // Calcular "MI PARTE"
  const totalGasto = parseFloat(form.monto) || 0;
  const totalDeuda = personas.reduce((acc, curr) => acc + curr.monto, 0);
  const miParte = totalGasto - totalDeuda;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (miParte < 0) return alert("Error: La suma de las deudas es mayor al total del gasto.");

    setLoading(true);
    try {
      const payload = { ...form, monto: parseFloat(form.monto), deudores: isSplit ? personas : [] };
      
      if (editingItem) {
          await actualizarGasto(editingItem.id, payload);
      } else {
          await registrarGastoRapido(payload);
      }
      
      onRefresh();
      onClose();
      setForm(prev => ({ ...prev, monto: '', descripcion: '' }));
      setPersonas([]);
      setIsSplit(false);
    } catch (error) {
      alert(error.message);
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
             <MinusCircle className="text-red-500" /> {editingItem ? 'Editar Gasto' : 'Nuevo Gasto'}
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

          {/* CHECKBOX DIVIDIR */}
          <div 
             onClick={() => setIsSplit(!isSplit)}
             className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${isSplit ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-500/10' : 'bg-[var(--bg-app)] border-[var(--border)]'}`}
          >
             <div className={`p-2 rounded-full ${isSplit ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}><Users size={16} /></div>
             <div>
                <p className="font-bold text-sm text-[var(--text-main)]">Dividir cuenta</p>
                <p className="text-[10px] text-[var(--text-accent)]">Marca esto si alguien más te pagará su parte.</p>
             </div>
          </div>

          {/* ZONA DE SPLIT (Solo si está activo) */}
          {isSplit && (
             <div className="bg-[var(--bg-app)] p-4 rounded-2xl border border-[var(--border)] space-y-3">
                <p className="text-xs font-black uppercase text-[var(--text-accent)]">Agregar personas</p>
                
                {/* Inputs para agregar */}
                <div className="flex gap-2">
                   <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre" className="flex-1 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-[var(--border)] text-sm font-bold outline-none" />
                   <input type="number" step="0.01" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} placeholder="$" className="w-20 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-[var(--border)] text-sm font-bold outline-none" />
                   <button type="button" onClick={addPersona} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all cursor-pointer"><Plus size={16}/></button>
                </div>

                {/* Lista */}
                <div className="space-y-2 mt-2">
                   {/* MI PARTE (Calculada) */}
                   <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <span className="text-sm font-black text-emerald-600 flex items-center gap-2">YO (Mi gasto real)</span>
                      <span className="text-sm font-black text-emerald-600">${miParte.toFixed(2)}</span>
                   </div>

                   {personas.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-zinc-800 rounded-lg border border-[var(--border)]">
                         <span className="text-sm font-bold text-[var(--text-main)]">{p.nombre}</span>
                         <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-indigo-500">${p.monto.toFixed(2)}</span>
                            <button type="button" onClick={() => removePersona(idx)} className="text-red-400 hover:text-red-500 cursor-pointer"><Trash2 size={14}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

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
             <select value={form.cuentaId} onChange={(e) => setForm({...form, cuentaId: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var,--border] rounded-2xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-red-500 cursor-pointer h-[50px]">
               {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} (${c.saldo})</option>)}
             </select>
          </div>

          <button disabled={loading || !form.cuentaId || miParte < 0} className="w-full bg-red-500 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 mt-2 cursor-pointer active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {editingItem ? 'ACTUALIZAR' : 'REGISTRAR'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}