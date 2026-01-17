import { supabase } from './supabaseClient';

export async function resetearAplicacion() {
  try {
    // 1. Borrar tablas dependientes primero (Orden estricto por llaves foráneas)
    
    // Deudas dependen de Gastos
    await supabase.from('deudas').delete().not('id', 'is', null);

    // Gastos, Ingresos, Historial y Metas
    await supabase.from('gastos').delete().not('id', 'is', null);
    await supabase.from('ingresos').delete().not('id', 'is', null);
    await supabase.from('historial_pagos').delete().not('id', 'is', null);
    await supabase.from('metas_ahorro').delete().not('id', 'is', null);

    // 2. Resetear Saldos de Cuentas a 0 (No las borramos, solo las reiniciamos)
    // Primero traemos los IDs
    const { data: cuentas } = await supabase.from('cuentas').select('id');
    
    if (cuentas && cuentas.length > 0) {
      // Actualizamos una por una o en bloque si el RLS lo permite. 
      // Por seguridad hacemos un map.
      const actualizaciones = cuentas.map(c => 
        supabase.from('cuentas').update({ saldo: 0 }).eq('id', c.id)
      );
      await Promise.all(actualizaciones);
    }
    
    // (Opcional) Resetear fechas de último pago en Servicios/Suscripciones
    await supabase.from('servicios').update({ ultimo_pago: null }).not('id', 'is', null);
    await supabase.from('suscripciones').update({ ultimo_pago: null }).not('id', 'is', null);

    return true;
  } catch (error) {
    console.error("Error en reset total:", error);
    throw error;
  }
}