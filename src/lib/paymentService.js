import { supabase } from './supabaseClient';

/**
 * Registra pago Y debita de la cuenta seleccionada
 */
export async function registrarPago(item, tipo, cuentaId) {
  const hoy = new Date().toISOString().split('T')[0];
  const tabla = tipo === 'servicio' ? 'servicios' : 'suscripciones';
  const columnaId = tipo === 'servicio' ? 'servicio_id' : 'suscripcion_id';

  try {
    // 1. Obtener saldo actual de la cuenta
    const { data: cuenta, error: cuentaError } = await supabase
      .from('cuentas')
      .select('saldo')
      .eq('id', cuentaId)
      .single();
    
    if (cuentaError) throw cuentaError;

    // 2. Debitar (Saldo - Monto)
    const nuevoSaldo = cuenta.saldo - item.monto;
    const { error: updateCuentaError } = await supabase
      .from('cuentas')
      .update({ saldo: nuevoSaldo })
      .eq('id', cuentaId);

    if (updateCuentaError) throw updateCuentaError;

    // 3. Crear Historial (Vinculando la cuenta)
    const { error: histError } = await supabase
      .from('historial_pagos')
      .insert([{
        fecha_pago: hoy,
        monto: item.monto,
        tipo: tipo,
        [columnaId]: item.id,
        cuenta_id: cuentaId // <--- IMPORTANTE
      }]);

    if (histError) throw histError;

    // 4. Actualizar fecha en Servicio/Suscripción
    const { error: updateItemError } = await supabase
      .from(tabla)
      .update({ ultimo_pago: hoy })
      .eq('id', item.id);

    if (updateItemError) throw updateItemError;

    return true;
  } catch (error) {
    console.error("Error al registrar pago:", error);
    throw error;
  }
}

/**
 * Deshacer pago Y devolver dinero a la cuenta
 */
export async function deshacerUltimoPago(item, tipo) {
  const tabla = tipo === 'servicio' ? 'servicios' : 'suscripciones';
  const columnaId = tipo === 'servicio' ? 'servicio_id' : 'suscripcion_id';

  try {
    // 1. Buscar el último historial
    const { data: historial, error: fetchError } = await supabase
      .from('historial_pagos')
      .select('id, fecha_pago, monto, cuenta_id') // Necesitamos cuenta_id y monto
      .eq(columnaId, item.id)
      .order('fecha_pago', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (historial && historial.length > 0) {
      const pagoABorrar = historial[0];

      // 2. DEVOLVER EL DINERO (Si existe la cuenta)
      if (pagoABorrar.cuenta_id) {
         // Traer saldo actual
         const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', pagoABorrar.cuenta_id).single();
         if (cuenta) {
            await supabase.from('cuentas').update({ saldo: cuenta.saldo + pagoABorrar.monto }).eq('id', pagoABorrar.cuenta_id);
         }
      }

      // 3. Borrar historial
      await supabase.from('historial_pagos').delete().eq('id', pagoABorrar.id);

      // 4. Restaurar fecha anterior
      const { data: anterior } = await supabase
        .from('historial_pagos')
        .select('fecha_pago')
        .eq(columnaId, item.id)
        .order('fecha_pago', { ascending: false })
        .limit(1);

      const nuevaFecha = anterior && anterior.length > 0 ? anterior[0].fecha_pago : null;
      await supabase.from(tabla).update({ ultimo_pago: nuevaFecha }).eq('id', item.id);

    } else {
      // Si no hay historial, solo limpiamos fecha (reset manual)
      await supabase.from(tabla).update({ ultimo_pago: null }).eq('id', item.id);
    }

    return true;
  } catch (error) {
    console.error("Error al deshacer pago:", error);
    throw error;
  }
}