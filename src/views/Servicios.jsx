import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Home as HomeIcon, Zap, Droplets, Globe } from 'lucide-react';

export default function Servicios() {
  const [servicios, setServicios] = useState([
    // Datos de prueba por si Supabase no está listo aún
    { id: 1, nombre: 'Alquiler', monto: 500, categoria: 'Casa', dia_pago: 5 },
    { id: 2, nombre: 'Luz', monto: 45, categoria: 'Servicios', dia_pago: 15 },
    { id: 3, nombre: 'Agua', monto: 20, categoria: 'Servicios', dia_pago: 20 },
  ]);

  const calcularDias = (dia) => {
    const hoy = new Date().getDate();
    return dia >= hoy ? dia - hoy : (30 - hoy) + dia;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-[var(--bg-button)] rounded-lg text-indigo-500 border border-[var(--border)]">
              <HomeIcon size={20} />
           </div>
           <h1 className="text-2xl font-black">Servicios</h1>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer">
          <Plus size={18} /> Nuevo
        </button>
      </div>

      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-accent)] text-[10px] font-black uppercase tracking-widest">
              <th className="p-5">Nombre</th>
              <th className="p-5">Monto</th>
              <th className="p-5">Categoría</th>
              <th className="p-5">Pagar</th>
              <th className="p-5">Días Restantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {servicios.map((s) => (
              <tr key={s.id} className="hover:bg-indigo-500/5 transition-all group">
                <td className="p-5 font-bold flex items-center gap-3">
                  <span className="text-indigo-400 opacity-50">#</span> {s.nombre}
                </td>
                <td className="p-5 font-black text-lg">${s.monto}</td>
                <td className="p-5">
                   <span className="bg-[var(--bg-button)] px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                     {s.categoria}
                   </span>
                </td>
                <td className="p-5">
                   <button className="bg-[var(--bg-button)] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer">
                     Pagar
                   </button>
                </td>
                <td className="p-5 font-black text-indigo-500">
                  {calcularDias(s.dia_pago)} días
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}