import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Wallet, TrendingUp, Coffee, Smartphone, PlusCircle, 
  MinusCircle, CreditCard, ArrowLeftRight, Target, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Para navegar con código

// SERVICIOS
import { obtenerIngresoMensual, obtenerHistorialIngresos } from '../lib/incomeService';
import { obtenerHistorialGastos, obtenerGastosSueltosMes } from '../lib/expenseService';
import { calcularEstadoPago } from '../lib/dateUtils';

// COMPONENTES Y MODALES
import ModalNuevoIngreso from '../components/ModalNuevoIngreso';
import ModalNuevoGasto from '../components/ModalNuevoGasto';
import ModalTransferencia from '../components/ModalTransferencia';
import ModalNuevaCuenta from '../components/ModalNuevaCuenta';
import ModalHistorialIngresos from '../components/ModalHistorialIngresos';
import ModalHistorialGastos from '../components/ModalHistorialGastos';

export default function Dashboard() {
  const navigate = useNavigate(); // Hook para navegar
  const [totalIncome, setTotalIncome] = useState(0);
  
  // ESTADOS
  const [gastosReales, setGastosReales] = useState({ necesidades: 0, deseos: 0, ahorro: 0 });
  const [ingresosRecientes, setIngresosRecientes] = useState([]);
  const [gastosRecientes, setGastosRecientes] = useState([]);
  const [cuentasDashboard, setCuentasDashboard] = useState([]);

  // MODALES
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  
  // HISTORIALES
  const [isHistorialIngresosOpen, setIsHistorialIngresosOpen] = useState(false);
  const [historialIngresosCompleto, setHistorialIngresosCompleto] = useState([]);
  const [isHistorialGastosOpen, setIsHistorialGastosOpen] = useState(false);
  const [historialGastosCompleto, setHistorialGastosCompleto] = useState([]);

  // EDICIÓN
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [editingGasto, setEditingGasto] = useState(null);

  useEffect(() => { recalcularTodo(); }, []);

  const recalcularTodo = async () => {
    const ingresosMes = await obtenerIngresoMensual();
    setTotalIncome(ingresosMes);
    setIngresosRecientes(await obtenerHistorialIngresos(5));
    setGastosRecientes(await obtenerHistorialGastos(5));
    
    const { data: accs } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentasDashboard(accs || []);

    calcularGastos(ingresosMes);
  };

  const calcularGastos = async () => {
    try {
      const { data: servicios } = await supabase.from('servicios').select('*');
      const { data: suscripciones } = await supabase.from('suscripciones').select('*');
      const gastosRapidos = await obtenerGastosSueltosMes();

      let sumaNecesidades = 0, sumaDeseos = 0, sumaAhorro = 0;

      const procesar = (item, esSuscripcion) => {
        const estado = calcularEstadoPago(item.ultimo_pago, item.frecuencia);
        if (estado.estaPagado) esSuscripcion ? sumaDeseos += item.monto : sumaNecesidades += item.monto;
      };

      if (servicios) servicios.forEach(s => procesar(s, false));
      if (suscripciones) suscripciones.forEach(s => procesar(s, true));
      if (gastosRapidos) {
         gastosRapidos.forEach(g => {
            if (g.tipo === 'necesidad') sumaNecesidades += g.monto;
            else if (g.tipo === 'deseo') sumaDeseos += g.monto;
            else if (g.tipo === 'ahorro') sumaAhorro += g.monto;
         });
      }
      setGastosReales({ necesidades: sumaNecesidades, deseos: sumaDeseos, ahorro: sumaAhorro });
    } catch (error) { console.error(error); }
  };

  const abrirHistorialIngresos = async () => {
    setHistorialIngresosCompleto(await obtenerHistorialIngresos(null));
    setIsHistorialIngresosOpen(true);
  };
  const abrirHistorialGastos = async () => {
    setHistorialGastosCompleto(await obtenerHistorialGastos(null));
    setIsHistorialGastosOpen(true);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* ZONA IZQUIERDA */}
        <div className="flex-1 w-full space-y-8 min-w-0">
            {/* PRESUPUESTO */}
            <section className="bg-[var(--bg-sidebar)] p-8 rounded-[3rem] border border-[var(--border)] shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 text-white"><Wallet size={32} /></div>
                        <div><h1 className="text-2xl font-black">Presupuesto Real</h1><p className="text-[10px] font-black text-indigo-500 tracking-[0.3em] uppercase">Mes Actual</p></div>
                    </div>
                    <div className="bg-[var(--bg-app)] px-8 py-4 rounded-3xl border border-[var(--border)] text-right">
                        <span className="text-[10px] font-black text-[var(--text-accent)] uppercase tracking-widest block mb-1">Ingreso Total</span>
                        <span className="text-3xl font-black text-indigo-600">${totalIncome.toLocaleString()}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ProgressCard title="Necesidades" limit={totalIncome * 0.5} current={gastosReales.necesidades} color="indigo" icon={<Smartphone size={18}/>} />
                    <ProgressCard title="Gustos" limit={totalIncome * 0.3} current={gastosReales.deseos} color="purple" icon={<Coffee size={18}/>} />
                    <ProgressCard title="Ahorro" limit={totalIncome * 0.2} current={gastosReales.ahorro} color="emerald" icon={<TrendingUp size={18}/>} />
                </div>
            </section>
            
            {/* BOTONES RÁPIDOS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <QuickButton icon={<PlusCircle />} label="Ingreso" color="text-emerald-500" onClick={() => { setEditingIngreso(null); setIsConfigModalOpen(true); }} />
                <QuickButton icon={<MinusCircle />} label="Gasto" color="text-red-500" onClick={() => { setEditingGasto(null); setIsGastoModalOpen(true); }} />
                {/* OJO: Aquí usamos navigate en lugar de setView */}
                <QuickButton icon={<CreditCard />} label="Nueva Cuenta" color="text-indigo-500" onClick={() => setIsCuentaModalOpen(true)} />
                <QuickButton icon={<ArrowLeftRight />} label="Transferir" color="text-amber-500" onClick={() => setIsTransferModalOpen(true)} />
                <QuickButton icon={<Target />} label="Ahorro" color="text-purple-500" onClick={() => navigate('/ahorros')} />
            </div>

            {/* LISTAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ListaResumen titulo="Ingresos" datos={ingresosRecientes} color="emerald" icon={<ArrowUpRight size={18}/>} onVerTodos={abrirHistorialIngresos} onItemClick={(i) => { setEditingIngreso(i); setIsConfigModalOpen(true); }} />
                <ListaResumen titulo="Gastos" datos={gastosRecientes} color="red" icon={<ArrowDownRight size={18}/>} onVerTodos={abrirHistorialGastos} onItemClick={(g) => { setEditingGasto(g); setIsGastoModalOpen(true); }} />
            </div>
        </div>
      </div>

      {/* MODALES */}
      <ModalNuevoIngreso isOpen={isConfigModalOpen} onClose={() => {setIsConfigModalOpen(false); setEditingIngreso(null);}} onRefresh={recalcularTodo} editingItem={editingIngreso} />
      <ModalNuevoGasto isOpen={isGastoModalOpen} onClose={() => {setIsGastoModalOpen(false); setEditingGasto(null);}} onRefresh={recalcularTodo} editingItem={editingGasto} />
      <ModalTransferencia isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onRefresh={recalcularTodo} />
      <ModalNuevaCuenta isOpen={isCuentaModalOpen} onClose={() => setIsCuentaModalOpen(false)} onRefresh={recalcularTodo} />
      <ModalHistorialIngresos isOpen={isHistorialIngresosOpen} onClose={() => setIsHistorialIngresosOpen(false)} ingresos={historialIngresosCompleto} />
      <ModalHistorialGastos isOpen={isHistorialGastosOpen} onClose={() => setIsHistorialGastosOpen(false)} gastos={historialGastosCompleto} />
    </div>
  );
}

// Subcomponentes auxiliares
function ProgressCard({ title, limit, current, color, icon }) {
    const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : (current > 0 ? 100 : 0);
    const isOver = current > limit && limit > 0;

    return (
        <div className="p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-sm flex flex-col justify-between h-full group hover:border-[var(--text-accent)] transition-colors duration-300">
            
            {/* ENCABEZADO: Icono y Título */}
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${color}-100 text-${color}-600 dark:bg-${color}-500/10 dark:text-${color}-500 transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-[var(--text-accent)] tracking-widest mb-1">
                        {title}
                    </p>
                    <div className="inline-block bg-[var(--bg-app)] px-2 py-1 rounded-lg border border-[var(--border)]">
                        <p className="text-[10px] font-bold text-[var(--text-accent)]">
                           Meta: <span className="text-[var(--text-main)]">${limit.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* CUERPO: Monto Gastado Grande */}
            <div className="mb-3">
                <p className="text-[9px] font-black uppercase text-[var(--text-accent)] mb-0.5 ml-1">Gastado Actual</p>
                <p className="text-3xl font-black text-[var(--text-main)] tracking-tight flex items-baseline gap-1">
                   ${current.toLocaleString()}
                </p>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="relative">
                <div className="h-4 w-full bg-[var(--bg-app)] rounded-full border border-[var(--border)] overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-700 ease-out ${isOver ? 'bg-red-500' : `bg-${color}-500`}`} 
                        style={{ width: `${percentage}%` }} 
                    />
                </div>
                
                {/* TEXTO INFERIOR (Porcentaje y Alerta) */}
                <div className="flex justify-between items-center mt-2">
                     <span className={`text-[10px] font-black uppercase ${isOver ? 'text-red-500' : `text-${color}-500`}`}>
                        {Math.round(percentage)}% completado
                     </span>
                     {isOver && (
                        <span className="text-[9px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-md animate-pulse">
                            ¡Excedido!
                        </span>
                     )}
                </div>
            </div>
        </div>
    );
}

function QuickButton({ icon, label, color, onClick }) { 
    return (
      <button onClick={onClick} className="flex flex-col items-center justify-center p-6 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[2.5rem] hover:border-indigo-500 transition-all cursor-pointer group active:scale-95 shadow-sm">
        <div className={`${color} mb-3 group-hover:scale-110 transition-transform`}>{icon}</div>
        <span className="text-[10px] font-black uppercase text-[var(--text-main)] text-center">{label}</span>
      </button>
    );
}

function ListaResumen({ titulo, datos, color, icon, onVerTodos, onItemClick }) {
    return (
        <section className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-6 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-[var(--text-main)]">{titulo}</h3>
                <button onClick={onVerTodos} className={`text-[10px] font-bold text-${color}-500 px-3 py-1.5 rounded-lg transition-colors cursor-pointer`}>Ver todos</button>
            </div>
            <div className="flex-1 space-y-3">
                {datos.length === 0 ? <div className="text-center py-10 opacity-50 text-xs">Vacío</div> : datos.map(item => (
                    <div key={item.id} onClick={() => onItemClick(item)} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-app)] border border-transparent hover:border-[var(--border)] transition-all cursor-pointer">
                        <div className={`p-2 rounded-xl bg-${color}-100 text-${color}-600 dark:bg-${color}-500/10 dark:text-${color}-400 shrink-0`}>{icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--text-main)] text-sm truncate">{item.nombre || item.descripcion || item.categoria}</p>
                            <span className="text-[9px] font-bold text-[var(--text-accent)] uppercase">{new Date(item.fecha).toLocaleDateString('es-ES', {month:'short', day:'numeric'})}</span>
                        </div>
                        <span className={`font-black text-${color}-500 text-sm`}>${item.monto.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}