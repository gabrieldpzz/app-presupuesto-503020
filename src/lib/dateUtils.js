export function calcularEstadoPago(ultimoPagoStr, frecuencia) {
  // 1. Sin datos
  if (!ultimoPagoStr) {
    return {
      proximoPago: null,
      textoFecha: '--',
      diasRestantes: 0,
      
      // Neutro: Gris claro
      bgInfo: 'bg-slate-100 dark:bg-zinc-800',
      textInfo: 'text-slate-600 dark:text-zinc-400',
      labelInfo: 'text-slate-400 dark:text-zinc-500',
      
      estado: 'sin_datos',
      estaPagado: false
    };
  }

  // 2. Cálculos
  const [year, month, day] = ultimoPagoStr.split('-').map(Number);
  const fechaUltimo = new Date(year, month - 1, day);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let proximoPago = new Date(fechaUltimo);
  if (frecuencia === 'quincenal') {
    proximoPago.setDate(proximoPago.getDate() + 15);
  } else {
    proximoPago.setMonth(proximoPago.getMonth() + 1);
  }

  const diffTime = proximoPago - hoy;
  const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const textoFecha = proximoPago.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  // 3. COLORES SÓLIDOS (SOLO PARA LA CAJA INTERNA)
  
  // Default: Pendiente (Gris Sólido)
  let bgInfo = 'bg-slate-100 dark:bg-zinc-800';
  let textInfo = 'text-slate-800 dark:text-white';
  let labelInfo = 'text-slate-500 dark:text-zinc-400';
  
  let estaPagado = false;
  let estado = 'pendiente';

  const diasDesdePago = Math.ceil((hoy - fechaUltimo) / (1000 * 60 * 60 * 24));
  const margenPago = frecuencia === 'quincenal' ? 10 : 25;

  if (diasDesdePago < margenPago) {
     // PAGADO: Verde Esmeralda Fuerte
     bgInfo = 'bg-emerald-500 shadow-md shadow-emerald-500/20';
     textInfo = 'text-white';
     labelInfo = 'text-emerald-100/90'; 
     estaPagado = true;
     estado = 'pagado';
  
  } else if (diasRestantes < 0) {
     // VENCIDO: Rojo Fuerte
     bgInfo = 'bg-rose-600 shadow-md shadow-rose-600/20';
     textInfo = 'text-white';
     labelInfo = 'text-rose-100/90';
     estado = 'vencido';
  
  } else if (diasRestantes <= 3) {
     // ALERTA: Naranja Fuerte
     bgInfo = 'bg-amber-500 shadow-md shadow-amber-500/20';
     textInfo = 'text-white';
     labelInfo = 'text-amber-100/90';
     estado = 'alerta';
  }

  return {
    proximoPago,
    textoFecha,
    diasRestantes,
    bgInfo,
    textInfo,
    labelInfo,
    estado,
    estaPagado
  };
}