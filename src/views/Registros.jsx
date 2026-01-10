import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { deshacerUltimoPago } from '../lib/paymentService';
import { ClipboardList, Loader2, CheckCircle2, Circle, Image as ImageIcon } from 'lucide-react';
import { calcularEstadoPago } from '../lib/dateUtils';
import ModalConfirmacion from '../components/ModalConfirmacion'; // <--- IMPORTAR

export default function Registros() {
  const [items, setItems] = useState([]);
  const [historialReciente, setHistorialReciente] = useState({});
  const [loading, setLoading] = useState(true);
  
  // ESTADOS PARA EL MODAL
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [itemToUndo, setItemToUndo] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    // ... (Tu código existente de fetchData se mantiene IGUAL) ...
    // Solo lo resumo aquí para no copiar todo de nuevo, pero mantén la lógica de carga:
    const { data: servicios } = await supabase.from('servicios').select('*');
    const { data: suscripciones } = await supabase.from('suscripciones').select('*');
    
    // ... lógica de historial ...
    const { data: historial } = await supabase
       .from('historial_pagos')
       .select('servicio_id, suscripcion_id, cuenta_id, cuentas(nombre, color)')
       .order('fecha_pago', { ascending: false });

    const mapaPagos = {};
    historial?.forEach(h => {
        if (h.servicio_id && !mapaPagos[h.servicio_id]) mapaPagos[h.servicio_id] = h.cuentas;
        if (h.suscripcion_id && !mapaPagos[h.suscripcion_id]) mapaPagos[h.suscripcion_id] = h.cuentas;
    });
    setHistorialReciente(mapaPagos);

    const listaServicios = (servicios || []).map(s => ({ ...s, tipo: 'servicio' }));
    const listaSubs = (suscripciones || []).map(s => ({ ...s, tipo: 'suscripcion' }));

    const todo = [...listaServicios, ...listaSubs].sort((a, b) => {
        if (!a.ultimo_pago) return 1;
        if (!b.ultimo_pago) return -1;
        return new Date(b.ultimo_pago) - new Date(a.ultimo_pago);
    });

    setItems(todo);
    setLoading(false);
  }

  // 1. AL DAR CLIC EN LA FILA
  const handleToggle = (item) => {
      const info = calcularEstadoPago(item.ultimo_pago, item.frecuencia);
      if (info.estaPagado) {
          // ABRIR EL MODAL EN LUGAR DE WINDOW.CONFIRM
          setItemToUndo(item);
          setConfirmModalOpen(true);
      } else {
          alert("Para registrar un pago nuevo, por favor ve a la sección de Servicios o Suscripciones.");
      }
  };

  // 2. CONFIRMAR LA ACCIÓN
  const proceedToUndo = async () => {
      if (itemToUndo) {
          await deshacerUltimoPago(itemToUndo, itemToUndo.tipo);
          fetchData();
          setItemToUndo(null);
      }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-emerald-500 border border-[var(--border)]"><ClipboardList size={20} /></div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Historial de Pagos</h1>
        </div>
      </div>

      <div className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[2rem] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-accent)] text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--bg-app)]/50">
                <th className="p-6">Estado</th>
                <th className="p-6">Concepto</th>
                <th className="p-6">Pagado con</th>
                <th className="p-6">Último Pago</th>
                <th className="p-6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const info = calcularEstadoPago(item.ultimo_pago, item.frecuencia);
                const cuentaInfo = historialReciente[item.id];

                return (
                  <tr key={`${item.tipo}-${item.id}`} className="transition-all hover:bg-[var(--bg-app)] group">
                    <td className="p-6 cursor-pointer" onClick={() => handleToggle(item)}>
                      {info.estaPagado ? (
                        <div className="flex items-center gap-2 text-emerald-500">
                           <CheckCircle2 size={18} /> <span className="text-xs font-bold">PAGADO</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[var(--text-accent)] opacity-50">
                           <Circle size={18} /> <span className="text-xs font-bold">PENDIENTE</span>
                        </div>
                      )}
                    </td>
                    {/* ... (Resto de columnas igual que antes) ... */}
                    <td className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg p-1 border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                                {item.logo_url ? <img src={item.logo_url} className="w-full h-full object-contain"/> : <ImageIcon size={16} className="text-zinc-300"/>}
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)] text-sm">{item.nombre}</p>
                                <p className="text-[9px] font-black uppercase text-[var(--text-accent)] tracking-wider">{item.tipo}</p>
                            </div>
                        </div>
                    </td>
                    <td className="p-6">
                        {info.estaPagado && cuentaInfo ? (
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${cuentaInfo.color === 'black' ? 'zinc-800' : cuentaInfo.color + '-500'}`} />
                              <span className="text-xs font-bold text-[var(--text-main)]">{cuentaInfo.nombre}</span>
                           </div>
                        ) : (
                           <span className="text-[10px] text-[var(--text-accent)]">--</span>
                        )}
                    </td>
                    <td className="p-6 text-xs font-bold text-[var(--text-main)]">
                         {item.ultimo_pago ? new Date(item.ultimo_pago + 'T00:00:00').toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'}) : '--'}
                    </td>
                    <td className="p-6 font-black text-[var(--text-main)] text-right">${item.monto.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <ModalConfirmacion 
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={proceedToUndo}
        titulo="¿Deshacer Pago?"
        mensaje="Esta acción borrará el registro del historial y, si es posible, reembolsará el dinero a la cuenta original."
      />
    </div>
  );
}