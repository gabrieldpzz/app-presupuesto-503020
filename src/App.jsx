import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Servicios from './views/Servicios';
import Suscripciones from './views/Suscripciones';
import Registros from './views/Registros';
import ListaCompras from './views/ListaCompras';
import Cuentas from './views/Cuentas';
import Ahorros from './views/Ahorros';
import Estadisticas from './views/Estadisticas';
import ModalNuevoIngreso from './components/ModalNuevoIngreso';
import ModalHistorialIngresos from './components/ModalHistorialIngresos';
import ModalHistorialGastos from './components/ModalHistorialGastos';
import ModalNuevoGasto from './components/ModalNuevoGasto';
import ModalTransferencia from './components/ModalTransferencia';
import ModalNuevaCuenta from './components/ModalNuevaCuenta';
import ModalDepositarAhorro from './components/ModalDepositarAhorro';
import ModalCuentasPorCobrar from './components/ModalCuentasPorCobrar';
import ModalDetalleDeudas from './components/ModalDetalleDeudas';
import ModalConfirmacion from './components/ModalConfirmacion';
import { supabase } from './lib/supabaseClient';
import { calcularEstadoPago } from './lib/dateUtils';
import { obtenerIngresoMensual, obtenerHistorialIngresos, eliminarIngreso } from './lib/incomeService';
import { obtenerGastosSueltosMes, obtenerHistorialGastos, eliminarGasto } from './lib/expenseService';
import { getMetas } from './lib/savingsService';
import { 
  Wallet, Sun, Moon, TrendingUp, Coffee, Smartphone,
  PlusCircle, MinusCircle, CreditCard, ArrowLeftRight, Target, Settings,
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Pencil, Trash2, Users, Eye
} from 'lucide-react';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false); 
  const [view, setView] = useState('dashboard');
  const [totalIncome, setTotalIncome] = useState(0);
  
  const [gastosReales, setGastosReales] = useState({
    necesidades: 0,
    deseos: 0,
    ahorro: 0
  });
  const [ingresosRecientes, setIngresosRecientes] = useState([]);
  const [gastosRecientes, setGastosRecientes] = useState([]);
  const [cuentasDashboard, setCuentasDashboard] = useState([]);
  const [metasDashboard, setMetasDashboard] = useState([]);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  const [isAhorroModalOpen, setIsAhorroModalOpen] = useState(false);
  const [isDeudasOpen, setIsDeudasOpen] = useState(false);
  const [isDetalleDeudasOpen, setIsDetalleDeudasOpen] = useState(false);
  const [selectedGastoSplit, setSelectedGastoSplit] = useState(null);

  const [isHistorialIngresosOpen, setIsHistorialIngresosOpen] = useState(false);
  const [historialIngresosCompleto, setHistorialIngresosCompleto] = useState([]);
  const [isHistorialGastosOpen, setIsHistorialGastosOpen] = useState(false);
  const [historialGastosCompleto, setHistorialGastosCompleto] = useState([]);

  const [editingIngreso, setEditingIngreso] = useState(null);
  const [editingGasto, setEditingGasto] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const savedIncome = localStorage.getItem('totalIncome');
    if (savedIncome) setTotalIncome(Number(savedIncome));
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (view === 'dashboard') recalcularTodo();
  }, [darkMode, view]);

  const recalcularTodo = async () => {
    const ingresosMes = await obtenerIngresoMensual();
    setTotalIncome(ingresosMes);
    setIngresosRecientes(await obtenerHistorialIngresos(5));
    setGastosRecientes(await obtenerHistorialGastos(5));
    setMetasDashboard(await getMetas());

    const { data: accs } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentasDashboard(accs || []);

    calcularGastos(ingresosMes);
  };

  const calcularGastos = async (incomeOverride) => {
    try {
      const { data: servicios } = await supabase.from('servicios').select('*');
      const { data: suscripciones } = await supabase.from('suscripciones').select('*');
      const gastosRapidos = await obtenerGastosSueltosMes();

      let sumaNecesidades = 0;
      let sumaDeseos = 0;
      let sumaAhorro = 0;

      const procesarItemFijo = (item, esSuscripcion) => {
        const estado = calcularEstadoPago(item.ultimo_pago, item.frecuencia);
        if (estado.estaPagado) {
          if (esSuscripcion) sumaDeseos += item.monto;
          else sumaNecesidades += item.monto;
        }
      };

      if (servicios) servicios.forEach(s => procesarItemFijo(s, false));
      if (suscripciones) suscripciones.forEach(s => procesarItemFijo(s, true));

      if (gastosRapidos) {
        gastosRapidos.forEach(g => {
          if (g.tipo === 'necesidad') sumaNecesidades += g.monto;
          else if (g.tipo === 'deseo') sumaDeseos += g.monto;
          else if (g.tipo === 'ahorro') sumaAhorro += g.monto;
        });
      }

      setGastosReales({ necesidades: sumaNecesidades, deseos: sumaDeseos, ahorro: sumaAhorro });

    } catch (error) {
      console.error("Error calculando presupuesto:", error);
    }
  };

  const handleEditIngreso = (ingreso) => { setEditingIngreso(ingreso); setIsConfigModalOpen(true); };
  const handleEditGasto = (gasto) => { setEditingGasto(gasto); setIsGastoModalOpen(true); };

  const requestDelete = (item, tipo) => {
    setItemToDelete({ ...item, tipoRegistro: tipo });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.tipoRegistro === 'ingreso') {
        await eliminarIngreso(itemToDelete.id);
      } else {
        await eliminarGasto(itemToDelete.id);
      }
      recalcularTodo();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      alert("Error al eliminar: " + error.message);
    }
  };

  const abrirHistorialIngresos = async () => {
    setHistorialIngresosCompleto(await obtenerHistorialIngresos(null));
    setIsHistorialIngresosOpen(true);
  };
  const abrirHistorialGastos = async () => {
    setHistorialGastosCompleto(await obtenerHistorialGastos(null));
    setIsHistorialGastosOpen(true);
  };

  const openDetalleDeudas = (gasto) => {
    setSelectedGastoSplit(gasto);
    setIsDetalleDeudasOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} setView={setView} currentView={view} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[var(--bg-sidebar)] shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
             {view === 'dashboard' && (
              <div className="hidden sm:block">
                 <span className="text-xs font-black text-[var(--text-accent)] uppercase tracking-widest">Hola, bienvenido</span>
              </div>
             )}
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-full bg-[var(--bg-button)] border border-[var(--border)] text-[var(--text-main)] cursor-pointer hover:scale-110 transition-transform">
            {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {view === 'dashboard' ? (
            <div className="w-full max-w-[1600px] mx-auto p-6 md:p-8 animate-in fade-in duration-500">
              
              <div className="flex flex-col xl:flex-row gap-8 items-start">
                
                {/* === ZONA IZQUIERDA === */}
                <div className="flex-1 w-full space-y-8 min-w-0">
                    
                    {/* PRESUPUESTO */}
                    <section className="bg-[var(--bg-sidebar)] p-8 rounded-[3rem] border border-[var(--border)] shadow-sm transition-all duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                          <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 text-white"><Wallet size={32} /></div>
                            <div>
                              <h1 className="text-2xl font-black tracking-tight">Presupuesto Real</h1>
                              <p className="text-[10px] font-black text-indigo-500 tracking-[0.3em] uppercase">Mes Actual</p>
                            </div>
                          </div>
                          <div className="bg-[var(--bg-app)] px-8 py-4 rounded-3xl border border-[var(--border)] text-right">
                            <span className="text-[10px] font-black text-[var(--text-accent)] uppercase tracking-widest block mb-1">Ingreso Mensual (Presupuestado)</span>
                            <span className="text-3xl font-black text-indigo-600">${totalIncome.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <ProgressCard title="Necesidades" limit={totalIncome * 0.5} current={gastosReales.necesidades} color="indigo" icon={<Smartphone size={18}/>} />
                          <ProgressCard title="Gustos" limit={totalIncome * 0.3} current={gastosReales.deseos} color="purple" icon={<Coffee size={18}/>} />
                          <ProgressCard title="Ahorro / Otros" limit={totalIncome * 0.2} current={gastosReales.ahorro} color="emerald" icon={<TrendingUp size={18}/>} />
                        </div>
                    </section>
                    
                    {/* ACCIONES RÁPIDAS */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <QuickButton icon={<PlusCircle />} label="Nuevo Ingreso" color="text-emerald-500" onClick={() => { setEditingIngreso(null); setIsConfigModalOpen(true); }} />
                        <QuickButton icon={<MinusCircle />} label="Gasto Rápido" color="text-red-500" onClick={() => { setEditingGasto(null); setIsGastoModalOpen(true); }} />
                        <QuickButton icon={<Users />} label="Cobrar" color="text-indigo-500" onClick={() => setIsDeudasOpen(true)} />
                        <QuickButton icon={<CreditCard />} label="Nueva Cuenta" color="text-indigo-500" onClick={() => setIsCuentaModalOpen(true)} />
                        <QuickButton icon={<ArrowLeftRight />} label="Transferir" color="text-amber-500" onClick={() => setIsTransferModalOpen(true)} />
                        <QuickButton icon={<Target />} label="Ahorro" color="text-purple-500" onClick={() => setIsAhorroModalOpen(true)} />
                    </div>

                    {/* GRID INGRESOS / GASTOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* INGRESOS */}
                        <section className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-6 shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-main)]">Ingresos</h3>
                                    <p className="text-[9px] font-bold text-[var(--text-accent)] uppercase tracking-widest">Recientes</p>
                                </div>
                                <button onClick={abrirHistorialIngresos} className="text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Ver todos</button>
                            </div>
                            <div className="flex-1 space-y-3">
                                {ingresosRecientes.length === 0 ? (
                                    <div className="text-center py-10 opacity-50 text-xs">Sin ingresos.</div>
                                ) : (
                                    ingresosRecientes.map(ing => (
                                        <div key={ing.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-app)] border border-transparent hover:border-[var(--border)] transition-all group relative pr-14">
                                            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 shrink-0"><ArrowUpRight size={18} /></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[var(--text-main)] text-sm truncate">{ing.nombre || ing.categoria}</p>
                                                <div className="flex items-center gap-1.5"><span className="text-[9px] font-bold text-[var(--text-accent)] uppercase">{new Date(ing.fecha).toLocaleDateString('es-ES', {month:'short', day:'numeric'})}</span></div>
                                            </div>
                                            <span className="font-black text-emerald-500 text-sm whitespace-nowrap">+${ing.monto.toLocaleString()}</span>
                                            
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-app)] pl-2">
                                                <button onClick={() => handleEditIngreso(ing)} className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"><Pencil size={14} /></button>
                                                <button onClick={() => requestDelete(ing, 'ingreso')} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* GASTOS */}
                        <section className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-6 shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-[var(--text-main)]">Gastos</h3>
                                    <p className="text-[9px] font-bold text-[var(--text-accent)] uppercase tracking-widest">Recientes</p>
                                </div>
                                <button onClick={abrirHistorialGastos} className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Ver todos</button>
                            </div>
                            <div className="flex-1 space-y-3">
                                {gastosRecientes.length === 0 ? (
                                    <div className="text-center py-10 opacity-50 text-xs">Sin gastos.</div>
                                ) : (
                                    gastosRecientes.map(gasto => (
                                        <div key={gasto.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-app)] border border-transparent hover:border-[var(--border)] transition-all group relative pr-20">
                                            <div className="p-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 shrink-0"><ArrowDownRight size={18} /></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[var(--text-main)] text-sm truncate capitalize">{gasto.descripcion || gasto.tipo}</p>
                                                <div className="flex items-center gap-1.5"><span className="text-[9px] font-bold text-[var(--text-accent)] uppercase">{new Date(gasto.fecha).toLocaleDateString('es-ES', {month:'short', day:'numeric'})}</span></div>
                                            </div>
                                            <span className="font-black text-red-500 text-sm whitespace-nowrap">-${gasto.monto.toLocaleString()}</span>

                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-app)] pl-2">
                                                {gasto.deudas && gasto.deudas.length > 0 && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); openDetalleDeudas(gasto); }} 
                                                        className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"
                                                        title="Ver División"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleEditGasto(gasto)} className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"><Pencil size={14} /></button>
                                                <button onClick={() => requestDelete(gasto, 'gasto')} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                </div>
                
                {/* === ZONA DERECHA (CUENTAS) === */}
                <div className="w-full xl:w-96 shrink-0 flex flex-col gap-6">
                   {/* WIDGET CUENTAS */}
                   <div className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-6 shadow-sm sticky top-6">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                             <h3 className="text-lg font-black text-[var(--text-main)]">Mis Cuentas</h3>
                             <p className="text-[9px] font-bold text-[var(--text-accent)] uppercase tracking-widest">Saldos Disponibles</p>
                          </div>
                          <button onClick={() => setView('cuentas')} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] transition-colors cursor-pointer"><ChevronRight size={18} /></button>
                      </div>

                      <div className="space-y-4">
                         {cuentasDashboard.length === 0 ? (
                            <div className="text-center py-10 opacity-50 text-xs">No hay cuentas.</div>
                         ) : (
                            cuentasDashboard.map(c => (
                               <div key={c.id} className="p-4 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] hover:border-indigo-300 transition-colors group">
                                  <div className="flex items-center gap-3 mb-2">
                                     <div className="w-8 h-8 bg-white rounded-lg p-1 border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-contain"/> : <Wallet size={16} className="text-zinc-400"/>}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[var(--text-main)] text-sm truncate">{c.nombre}</p>
                                        <p className="text-[9px] font-bold text-[var(--text-accent)] uppercase">{c.tipo}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">${c.saldo.toLocaleString()}</p>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
                      
                      <button onClick={() => setIsCuentaModalOpen(true)} className="w-full mt-6 py-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-accent)] text-xs font-bold hover:bg-[var(--bg-app)] hover:text-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer">
                          <PlusCircle size={14} /> AGREGAR CUENTA
                      </button>
                   </div>

                   {/* === NUEVO WIDGET: MIS METAS === */}
                   <div className="bg-[var(--bg-sidebar)] rounded-[2.5rem] border border-[var(--border)] p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-lg font-black text-[var(--text-main)]">Mis Metas</h3>
                              <p className="text-[9px] font-bold text-[var(--text-accent)] uppercase tracking-widest">Progreso</p>
                          </div>
                          <button onClick={() => setView('ahorros')} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] transition-colors cursor-pointer"><ChevronRight size={18} /></button>
                      </div>

                      <div className="space-y-5">
                          {metasDashboard.length === 0 ? (
                              <div className="text-center py-6 opacity-50 text-xs text-[var(--text-accent)]">No hay metas activas.</div>
                          ) : (
                              metasDashboard.slice(0, 3).map(m => {
                                  const percent = Math.min((m.ahorro_actual / m.meta_total) * 100, 100);
                                  return (
                                      <div key={m.id}>
                                          <div className="flex justify-between text-xs font-bold mb-1">
                                              <span className="text-[var(--text-main)]">{m.nombre}</span>
                                              <span className={`text-${m.color}-500`}>${m.ahorro_actual.toLocaleString()}</span>
                                          </div>
                                          <div className="h-2.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
                                              <div className={`h-full bg-${m.color}-500 rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }} />
                                          </div>
                                      </div>
                                  );
                              })
                          )}
                      </div>
                      
                      <button onClick={() => setIsAhorroModalOpen(true)} className="w-full mt-6 py-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent hover:border-purple-200">
                          <Target size={14} /> APORTAR AHORA
                      </button>
                   </div>

                </div>

              </div>
            </div>
          ) : view === 'servicios' ? (
            <Servicios />
          ) : view === 'suscripciones' ? (
            <Suscripciones />
          ) : view === 'compras' ? (
            <ListaCompras />
          ) : view === 'cuentas' ? (
            <Cuentas />
          ) : view === 'ahorros' ? (
            <Ahorros />
          ) : view === 'estadisticas' ? (
            <Estadisticas />
          ) : view === 'registros' ? (
            <Registros />
          ) : null}
        </main>
      </div>
      
      <ModalNuevoIngreso 
        isOpen={isConfigModalOpen} 
        onClose={() => { setIsConfigModalOpen(false); setEditingIngreso(null); }} 
        onRefresh={recalcularTodo} 
        editingItem={editingIngreso}
      />
      <ModalNuevoGasto 
        isOpen={isGastoModalOpen} 
        onClose={() => { setIsGastoModalOpen(false); setEditingGasto(null); }} 
        onRefresh={recalcularTodo} 
        editingItem={editingGasto}
      />
      <ModalTransferencia isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onRefresh={recalcularTodo} />
      <ModalNuevaCuenta isOpen={isCuentaModalOpen} onClose={() => setIsCuentaModalOpen(false)} onRefresh={recalcularTodo} />
      <ModalDepositarAhorro isOpen={isAhorroModalOpen} onClose={() => setIsAhorroModalOpen(false)} onRefresh={recalcularTodo} />
      <ModalCuentasPorCobrar isOpen={isDeudasOpen} onClose={() => setIsDeudasOpen(false)} onRefresh={recalcularTodo} />
      <ModalDetalleDeudas 
        isOpen={isDetalleDeudasOpen} 
        onClose={() => setIsDetalleDeudasOpen(false)} 
        gasto={selectedGastoSplit} 
        onRefresh={recalcularTodo} 
      />
      
      <ModalHistorialIngresos 
        isOpen={isHistorialIngresosOpen} 
        onClose={() => setIsHistorialIngresosOpen(false)} 
        ingresos={historialIngresosCompleto}
        onEdit={(i) => { setIsHistorialIngresosOpen(false); handleEditIngreso(i); }}
        onDelete={(i) => { setIsHistorialIngresosOpen(false); requestDelete(i, 'ingreso'); }}
      />
      <ModalHistorialGastos 
        isOpen={isHistorialGastosOpen} 
        onClose={() => setIsHistorialGastosOpen(false)} 
        gastos={historialGastosCompleto}
        onEdit={(g) => { 
          setIsHistorialGastosOpen(false); 
          handleEditGasto(g); 
        }}
        onDelete={(g) => { 
          setIsHistorialGastosOpen(false); 
          requestDelete(g, 'gasto'); }}
        onViewSplit={(g) => {
          setIsHistorialGastosOpen(false);
          openDetalleDeudas(g);
        }}
      />

      <ModalConfirmacion 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        titulo="¿Eliminar registro?"
        mensaje="El monto será revertido de la cuenta asociada y el saldo se actualizará."
      />
    </div>
  );
}

function ProgressCard({ title, limit, current, color, icon }) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : (current > 0 ? 100 : 0);
  
  const themeStyles = {
    indigo: { iconBg: 'bg-indigo-100 dark:bg-indigo-500/10', iconText: 'text-indigo-600 dark:text-indigo-500', bar: 'bg-indigo-500' },
    purple: { iconBg: 'bg-purple-100 dark:bg-purple-500/10', iconText: 'text-purple-600 dark:text-purple-500', bar: 'bg-purple-500' },
    emerald: { iconBg: 'bg-emerald-100 dark:bg-emerald-500/10', iconText: 'text-emerald-600 dark:text-emerald-500', bar: 'bg-emerald-500' },
  };
  const style = themeStyles[color] || themeStyles.indigo;
  const isOver = current > limit && limit > 0;

  return (
    <div className="p-6 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-sidebar)] shadow-sm hover:scale-[1.02] transition-transform duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className={`p-2 rounded-xl ${style.iconBg} ${style.iconText}`}>{icon}</div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase text-[var(--text-accent)]">{title}</p>
          <p className="text-lg font-black text-[var(--text-main)]">
             ${current.toLocaleString()} <span className="text-[var(--text-accent)] text-xs font-bold">/ ${limit.toLocaleString()}</span>
          </p>
        </div>
      </div>
      <div className="h-3 w-full bg-[var(--bg-app)] rounded-full border border-[var(--border)] overflow-hidden">
        <div 
           className={`h-full transition-all duration-700 ${isOver ? 'bg-red-500' : style.bar}`} 
           style={{ width: `${percentage}%` }} 
        />
      </div>
      <div className="mt-2 flex justify-between items-center">
         <span className="text-[9px] font-bold text-[var(--text-accent)] uppercase">
           {Math.round(percentage)}% del límite
         </span>
         {isOver && <span className="text-[9px] font-bold text-red-500 uppercase">¡Excedido!</span>}
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

export default App;