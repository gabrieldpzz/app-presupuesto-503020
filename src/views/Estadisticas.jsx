import { useEffect, useState } from 'react';
import { obtenerDatosEstadisticas } from '../lib/statisticService';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';

export default function Estadisticas() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Fecha actual por defecto
  const [fecha, setFecha] = useState(new Date());

  useEffect(() => {
    cargarDatos();
  }, [fecha]);

  async function cargarDatos() {
    setLoading(true);
    const resultados = await obtenerDatosEstadisticas(fecha.getMonth(), fecha.getFullYear());
    setData(resultados);
    setLoading(false);
  }

  // Funciones para cambiar mes
  const cambiarMes = (delta) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + delta);
    setFecha(nuevaFecha);
  };

  const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  if (loading || !data) return <div className="p-20 text-center text-[var(--text-accent)]">Calculando finanzas...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in">
      
      {/* HEADER: Título y Selector de Mes */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-indigo-500 border border-[var(--border)]">
            <PieChart size={20} />
          </div>
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

      {/* 1. TARJETAS DE RESUMEN (Balance) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <StatCard 
            title="Ingresos" 
            monto={data.ingresos} 
            icon={<TrendingUp size={24}/>} 
            color="emerald" 
            bg="bg-emerald-500" 
         />
         <StatCard 
            title="Gastos Totales" 
            monto={data.gastos} 
            icon={<TrendingDown size={24}/>} 
            color="rose" 
            bg="bg-rose-500" 
         />
         <StatCard 
            title="Balance Neto" 
            monto={data.balance} 
            icon={<DollarSign size={24}/>} 
            color={data.balance >= 0 ? "indigo" : "amber"} 
            bg={data.balance >= 0 ? "bg-indigo-500" : "bg-amber-500"} 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. DESGLOSE 50/30/20 (Tipo) */}
          <section className="bg-[var(--bg-sidebar)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
             <h3 className="text-lg font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
                <Filter size={18} className="text-indigo-500"/> Regla 50/30/20
             </h3>
             
             <div className="space-y-6">
                <BarraProgreso 
                    label="Necesidades (50%)" 
                    monto={data.porTipo.necesidad} 
                    total={data.ingresos} 
                    color="indigo" 
                    meta={50} 
                />
                <BarraProgreso 
                    label="Gustos (30%)" 
                    monto={data.porTipo.deseo} 
                    total={data.ingresos} 
                    color="purple" 
                    meta={30} 
                />
                <BarraProgreso 
                    label="Ahorro (20%)" 
                    monto={data.porTipo.ahorro} 
                    total={data.ingresos} 
                    color="emerald" 
                    meta={20} 
                />
             </div>
             <p className="text-[10px] text-[var(--text-accent)] mt-6 text-center italic">
                * Porcentajes calculados sobre el Ingreso Total del mes.
             </p>
          </section>

          {/* 3. DESGLOSE POR CATEGORÍA (Detallado) */}
          <section className="bg-[var(--bg-sidebar)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
             <h3 className="text-lg font-black text-[var(--text-main)] mb-6 flex items-center gap-2">
                <Filter size={18} className="text-rose-500"/> Gastos por Categoría
             </h3>

             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {data.porCategoria.length === 0 ? (
                    <div className="text-center py-10 opacity-50 text-sm">No hay gastos registrados este mes.</div>
                ) : (
                    data.porCategoria.map((cat, index) => {
                        // Calcular porcentaje respecto al GASTO TOTAL (no al ingreso)
                        const percent = data.gastos > 0 ? (cat.total / data.gastos) * 100 : 0;
                        return (
                            <div key={index} className="group">
                                <div className="flex justify-between text-sm font-bold mb-1.5">
                                    <span className="text-[var(--text-main)] flex items-center gap-2">
                                       <span className="w-2 h-2 rounded-full bg-rose-500"></span> {cat.nombre}
                                    </span>
                                    <span className="text-[var(--text-main)]">${cat.total.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-[var(--bg-app)] rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-rose-500 rounded-full opacity-80 group-hover:opacity-100 transition-all" 
                                        style={{ width: `${percent}%` }} 
                                    />
                                </div>
                                <div className="text-right mt-1">
                                    <span className="text-[9px] font-bold text-[var(--text-accent)]">{Math.round(percent)}% del gasto</span>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
          </section>

      </div>
    </div>
  );
}

// Subcomponentes visuales
function StatCard({ title, monto, icon, color, bg }) {
    return (
        <div className="bg-[var(--bg-sidebar)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-transform">
            <div>
                <p className="text-[10px] font-black uppercase text-[var(--text-accent)] tracking-widest mb-1">{title}</p>
                <p className={`text-3xl font-black text-[var(--text-main)]`}>${monto.toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-2xl ${bg} text-white shadow-lg shadow-${color}-500/30`}>
                {icon}
            </div>
        </div>
    );
}

function BarraProgreso({ label, monto, total, color, meta }) {
    // Evitar NaN
    const percent = total > 0 ? (monto / total) * 100 : 0;
    const isOver = percent > meta;

    return (
        <div>
            <div className="flex justify-between items-end mb-2">
                <div>
                    <span className={`block text-xs font-black uppercase text-${color}-500 mb-0.5`}>{label}</span>
                    <span className="text-lg font-black text-[var(--text-main)]">${monto.toLocaleString()}</span>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-[var(--text-accent)]'}`}>
                        {Math.round(percent)}% <span className="text-[9px] opacity-70">/ {meta}%</span>
                    </span>
                </div>
            </div>
            <div className="h-4 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
                <div 
                    className={`h-full transition-all duration-1000 bg-${color}-500 ${isOver ? 'bg-red-500' : ''}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }} 
                />
            </div>
        </div>
    );
}