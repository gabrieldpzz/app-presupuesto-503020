import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, ShoppingCart, Loader2, Trash2, Check, X, GripVertical } from 'lucide-react';
import ModalNuevaLista from '../components/ModalNuevaLista';

export default function ListaCompras() {
  const [listas, setListas] = useState([]);
  const [items, setItems] = useState({}); // Objeto { lista_id: [items...] }
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemText, setNewItemText] = useState({}); // Texto temporal por lista

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    // 1. Traer Listas
    const { data: listasData } = await supabase.from('listas').select('*').order('created_at', { ascending: false });
    
    if (listasData) {
      setListas(listasData);
      // 2. Traer Items de todas esas listas
      const { data: itemsData } = await supabase.from('items_lista').select('*').order('created_at', { ascending: true });
      
      // Agrupar items por lista_id para fácil acceso
      const itemsAgrupados = {};
      listasData.forEach(l => itemsAgrupados[l.id] = []);
      itemsData?.forEach(item => {
        if (itemsAgrupados[item.lista_id]) itemsAgrupados[item.lista_id].push(item);
      });
      setItems(itemsAgrupados);
    }
    setLoading(false);
  }

  // AGREGAR ITEM (Al dar Enter en el input)
  const handleAddItem = async (e, listaId) => {
    if (e.key === 'Enter' && newItemText[listaId]?.trim()) {
      const texto = newItemText[listaId].trim();
      
      // Optimismo UI
      const tempId = Date.now();
      const nuevoItem = { id: tempId, lista_id: listaId, texto, completado: false, temp: true };
      
      setItems(prev => ({
        ...prev,
        [listaId]: [...prev[listaId], nuevoItem]
      }));
      setNewItemText(prev => ({ ...prev, [listaId]: '' })); // Limpiar input

      // Guardar en DB
      const { data, error } = await supabase.from('items_lista').insert([{ lista_id: listaId, texto }]).select();
      
      if (!error && data) {
        // Reemplazar ID temporal con real
        setItems(prev => ({
          ...prev,
          [listaId]: prev[listaId].map(i => i.id === tempId ? data[0] : i)
        }));
      }
    }
  };

  // CHECKBOX (Tachar)
  const toggleCheck = async (itemId, listaId, estadoActual) => {
    // UI Optimista
    setItems(prev => ({
      ...prev,
      [listaId]: prev[listaId].map(i => i.id === itemId ? { ...i, completado: !estadoActual } : i)
    }));

    await supabase.from('items_lista').update({ completado: !estadoActual }).eq('id', itemId);
  };

  // ELIMINAR ITEM
  const deleteItem = async (itemId, listaId) => {
    setItems(prev => ({
      ...prev,
      [listaId]: prev[listaId].filter(i => i.id !== itemId)
    }));
    await supabase.from('items_lista').delete().eq('id', itemId);
  };

  // ELIMINAR LISTA COMPLETA
  const deleteList = async (listaId) => {
    if (!confirm("¿Borrar esta lista y todo su contenido?")) return;
    setListas(prev => prev.filter(l => l.id !== listaId));
    await supabase.from('listas').delete().eq('id', listaId);
  };

  // Mapeo de colores para el header de la tarjeta
  const colorMap = {
    blue: 'bg-blue-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500',
    rose: 'bg-rose-500', amber: 'bg-amber-500', slate: 'bg-slate-700'
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-orange-500 border border-[var(--border)]">
            <ShoppingCart size={20} />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Lista de Compras</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 cursor-pointer">
          <Plus size={18} /> Nueva Lista
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
      ) : listas.length === 0 ? (
        <div className="text-center p-10 opacity-50 text-[var(--text-accent)]">No hay listas creadas. ¡Crea una para empezar!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {listas.map((lista) => (
            <div key={lista.id} className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              
              {/* CARD HEADER */}
              <div className={`${colorMap[lista.color || 'blue']} p-4 flex justify-between items-center`}>
                 <h3 className="font-black text-white text-lg tracking-tight truncate px-1">{lista.nombre}</h3>
                 <button onClick={() => deleteList(lista.id)} className="text-white/60 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
                    <Trash2 size={16} />
                 </button>
              </div>

              {/* TABLA TIPO EXCEL (LISTA) */}
              <div className="p-2 bg-[var(--bg-sidebar)]">
                 <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    
                    {/* ITEMS */}
                    {items[lista.id]?.map((item) => (
                      <div key={item.id} className={`group/item flex items-center gap-3 p-2 rounded-lg transition-all ${item.completado ? 'bg-slate-50 dark:bg-zinc-800/50' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
                         
                         {/* CHECKBOX CUSTOM */}
                         <button 
                           onClick={() => toggleCheck(item.id, lista.id, item.completado)}
                           className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.completado ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600 hover:border-indigo-400'}`}
                         >
                           {item.completado && <Check size={14} strokeWidth={4} />}
                         </button>

                         {/* TEXTO */}
                         <span className={`flex-1 text-sm font-bold transition-all ${item.completado ? 'text-zinc-400 line-through decoration-2 decoration-zinc-300' : 'text-[var(--text-main)]'}`}>
                           {item.texto}
                         </span>

                         {/* BORRAR ITEM (Solo visible en hover) */}
                         <button onClick={() => deleteItem(item.id, lista.id)} className="opacity-0 group-hover/item:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-1">
                            <X size={14} />
                         </button>
                      </div>
                    ))}
                 </div>

                 {/* INPUT NUEVO ITEM (Como última fila de Excel) */}
                 <div className="mt-2 border-t border-[var(--border)] pt-2 px-2 pb-2">
                    <input 
                      type="text"
                      placeholder="+ Agregar item..."
                      className="w-full bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-bold placeholder:text-zinc-400 placeholder:font-normal rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border border-transparent focus:border-indigo-500/20"
                      value={newItemText[lista.id] || ''}
                      onChange={(e) => setNewItemText({ ...newItemText, [lista.id]: e.target.value })}
                      onKeyDown={(e) => handleAddItem(e, lista.id)}
                    />
                 </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <ModalNuevaLista isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchData} />
    </div>
  );
}