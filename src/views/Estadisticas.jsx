import { useEffect, useState } from 'react';
import { obtenerDatosEstadisticas } from '../lib/statisticService';
import { 
  PieChart, TrendingUp, TrendingDown, DollarSign, Filter, 
  ArrowUpRight, ArrowDownRight, Calendar, Wallet, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Estadisticas() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [fecha, setFecha] = useState(new Date());
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  useEffect(() => { 
      setPaginaActual(1);
      cargarDatos(); 
  }, [fecha]);

  async function cargarDatos() {
    setLoading(true);
    const resultados = await obtenerDatosEstadisticas(fecha.getMonth(), fecha.getFullYear());
    setData(resultados);
    setLoading(false);
  }

  const cambiarMes = (delta) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + delta);
    setFecha(nuevaFecha);
  };

  const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const indiceUltimoItem = paginaActual * ITEMS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - ITEMS_POR_PAGINA;
  const movimientosVisibles = data?.flujoGlobal.slice(indicePrimerItem, indiceUltimoItem) || [];
  const totalPaginas = data ? Math.ceil(data.flujoGlobal.length / ITEMS_POR_PAGINA) : 0;

  if (loading || !data) return <div className="p-20 text-center text-[var(--text-accent)]">Analizando movimientos...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in">
      
      {/* HEADER (Igual) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-indigo-500 border border-[var(--border)]"><PieChart size={20} /></div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Análisis Financiero</h1>
        </div>
        <div className="flex items-center bg-[var(--bg-sidebar)] p-1 rounded-2xl border border-[var(--border)] shadow-sm">
            <button onClick={() => cambiarMes(-1)} className="p-3 hover:bg-[var(--bg-app)] rounded-xl text-[var(--text-main)] transition-colors cursor-pointer">←</button>
            <div className="px-6 min-w-[150px] text-center">
                <span className="text-xs font-black uppercase text-[var(--text-accent)] block">Periodo</span>
                <span className="text-sm font-bold text-[var(--text-main)] capitalize">{nombreMes}</span>
            </div>
            <button onClick={() => cambiarMes(1)} className="p-3 hover:bg-[var(--bg-app)] rounded-xl text-[var(--text-main)] transition-colors cursor-pointer">→</button>
        </div>
      </div>

      {/* 1. TARJETAS (Igual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <StatCard title="Ingresos" monto={data.ingresos} icon={<TrendingUp size={24}/>} color="emerald" bg="bg-emerald-500" />
         <StatCard title="Gastos Totales" monto={data.gastos} icon={<TrendingDown size={24}/>} color="rose" bg="bg-rose-500" />
         <StatCard title="Balance Neto" monto={data.balance} icon={<DollarSign size={24}/>} color={data.balance >= 0 ? "indigo" : "amber"} bg={data.balance >= 0 ? "bg-indigo-500" : "bg-amber-500"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* 2. REGLA 50/30/20 (Igual) */}
          <section className="bg-[var(--bg-sidebar)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
             <h3 className="text-lg font-black text-[var(--text-main)] mb-6 flex items-center gap-2"><Filter size={18} className="text-indigo-500"/> Regla 50/30/20</h3>
             <div className="space-y-6">
                <BarraProgreso label="Necesidades (50%)" monto={data.porTipo.necesidad} total={data.ingresos} color="indigo" meta={50} />
                <BarraProgreso label="Gustos (30%)" monto={data.porTipo.deseo} total={data.ingresos} color="purple" meta={30} />
                <BarraProgreso label="Ahorro (20%)" monto={data.porTipo.ahorro} total={data.ingresos} color="emerald" meta={20} />
             </div>
          </section>

          {/* 3. DESGLOSE DOBLE: INGRESOS Y GASTOS POR CATEGORÍA */}
          <section className="bg-[var(--bg-sidebar)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm flex flex-col gap-8">
             
             {/* A. Ingresos por Fuente */}
             <div>
                <h3 className="text-lg font-black text-[var(--text-main)] mb-4 flex items-center gap-2"><Filter size={18} className="text-emerald-500"/> Fuentes de Ingreso</h3>
                <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                   {data.ingresosPorCategoria.length === 0 ? <p className="text-xs text-[var(--text-accent)]">Sin ingresos.</p> : 
                      data.ingresosPorCategoria.map((cat, i) => <FilaCategoria key={i} cat={cat} totalGlobal={data.ingresos} color="emerald" />)
                   }
                </div>
             </div>

             <div className="border-t border-[var(--border)]"></div>

             {/* B. Gastos por Categoría */}
             <div>
                <h3 className="text-lg font-black text-[var(--text-main)] mb-4 flex items-center gap-2"><Filter size={18} className="text-rose-500"/> Gastos por Categoría</h3>
                <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                   {data.gastosPorCategoria.length === 0 ? <p className="text-xs text-[var(--text-accent)]">Sin gastos.</p> : 
                      data.gastosPorCategoria.map((cat, i) => <FilaCategoria key={i} cat={cat} totalGlobal={data.gastos} color="rose" />)
                   }
                </div>
             </div>

          </section>
      </div>

      {/* HISTORIAL GLOBAL CON PAGINACIÓN Y CUENTA */}
      <section className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                <Calendar className="text-indigo-500" /> Movimientos del Mes
             </h3>
             <span className="text-xs font-bold text-[var(--text-accent)] bg-[var(--bg-app)] px-3 py-1 rounded-full border border-[var(--border)]">
                {data.flujoGlobal.length} registros encontrados
             </span>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-[var(--bg-app)] text-[var(--text-accent)] text-[10px] font-black uppercase tracking-wider rounded-xl">
                   <tr>
                      <th className="p-4 rounded-l-xl">Fecha</th>
                      <th className="p-4">Descripción</th>
                      <th className="p-4">Cuenta / Método</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-right rounded-r-xl">Monto</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                   {movimientosVisibles.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-sm text-[var(--text-accent)]">No hay movimientos en esta página.</td></tr>
                   ) : (
                      movimientosVisibles.map((mov, idx) => (
                         <tr key={`${mov.id}-${idx}`} className="hover:bg-[var(--bg-app)] transition-colors">
                            <td className="p-4 w-32">
                               <div className="font-bold text-[var(--text-main)] text-xs">
                                  {new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                               </div>
                            </td>
                            
                            <td className="p-4 font-bold text-[var(--text-main)] text-sm capitalize">
                               {mov.descripcion}
                            </td>

                            <td className="p-4">
                               {mov.cuenta ? (
                                   <div className="flex items-center gap-2">
                                       <div className="w-5 h-5 bg-white rounded-full p-0.5 border border-[var(--border)] flex items-center justify-center overflow-hidden">
                                           {mov.cuenta.logo_url ? <img src={mov.cuenta.logo_url} className="w-full h-full object-contain" /> : <Wallet size={10} className="text-zinc-400"/>}
                                       </div>
                                       <span className="text-xs font-bold text-[var(--text-accent)] truncate max-w-[100px]">{mov.cuenta.nombre}</span>
                                   </div>
                               ) : (
                                   <span className="text-[10px] text-zinc-300">--</span>
                               )}
                            </td>

                            <td className="p-4">
                               <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${mov.tipoMovimiento === 'ingreso' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                  {mov.categoria}
                               </span>
                            </td>
                            
                            <td className="p-4 text-right font-black text-sm w-32">
                               <div className={`flex items-center justify-end gap-1 ${mov.tipoMovimiento === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {mov.tipoMovimiento === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString()}
                               </div>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>

          {totalPaginas > 1 && (
              <div className="flex justify-between items-center mt-6 border-t border-[var(--border)] pt-4">
                  <button 
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => p - 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  
                  <span className="text-xs font-black text-[var(--text-accent)]">
                      Página {paginaActual} de {totalPaginas}
                  </span>

                  <button 
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => p + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-app)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
              </div>
          )}
      </section>

    </div>
  );
}

// Subcomponentes
function StatCard({ title, monto, icon, color, bg }) {
    return (
        <div className="bg-[var(--bg-sidebar)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
            <div>
                <p className="text-[10px] font-black uppercase text-[var(--text-accent)] tracking-widest mb-1">{title}</p>
                <p className={`text-3xl font-black text-[var(--text-main)]`}>${monto.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-2xl ${bg} text-white shadow-lg shadow-${color}-500/30`}>{icon}</div>
        </div>
    );
}

function BarraProgreso({ label, monto, total, color, meta }) {
    const percent = total > 0 ? (monto / total) * 100 : 0;
    const isOver = percent > meta;
    return (
        <div>
            <div className="flex justify-between items-end mb-2">
                <div><span className={`block text-xs font-black uppercase text-${color}-500 mb-0.5`}>{label}</span><span className="text-lg font-black text-[var(--text-main)]">${monto.toLocaleString()}</span></div>
                <div className="text-right"><span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-[var(--text-accent)]'}`}>{Math.round(percent)}% <span className="text-[9px] opacity-70">/ {meta}%</span></span></div>
            </div>
            <div className="h-4 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
                <div className={`h-full transition-all duration-1000 bg-${color}-500 ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
        </div>
    );
}

function FilaCategoria({ cat, totalGlobal, color }) {
    const percent = totalGlobal > 0 ? (cat.total / totalGlobal) * 100 : 0;
    return (
        <div className="group">
            <div className="flex justify-between text-sm font-bold mb-1.5">
                <span className="text-[var(--text-main)] flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span> {cat.nombre}
                </span>
                <span className="text-[var(--text-main)]">${cat.total.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full bg-[var(--bg-app)] rounded-full overflow-hidden">
                <div className={`h-full bg-${color}-500 rounded-full opacity-80 group-hover:opacity-100 transition-all`} style={{ width: `${percent}%` }} />
            </div>
            <div className="text-right mt-1"><span className="text-[9px] font-bold text-[var(--text-accent)]">{Math.round(percent)}%</span></div>
        </div>
    )
}