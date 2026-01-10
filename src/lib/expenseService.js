import { supabase } from './supabaseClient';

/**
 * 1. Crea el registro en tabla 'gastos'
 * 2. Resta el saldo de la cuenta
 */
export async function registrarGastoRapido(datos) {
  try {
    // 1. Validar saldo suficiente
    const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', datos.cuentaId).single();
    if (cuenta.saldo < datos.monto) throw new Error("Saldo insuficiente en la cuenta seleccionada.");

    // 2. Insertar Gasto
    const { error: insertError } = await supabase.from('gastos').insert([{
      monto: datos.monto,
      tipo: datos.tipo, // necesidad, deseo, ahorro
      descripcion: datos.descripcion,
      cuenta_id: datos.cuentaId,
      fecha: datos.fecha
    }]);
    if (insertError) throw insertError;

    // 3. Restar Saldo
    const { error: updateError } = await supabase
      .from('cuentas')
      .update({ saldo: cuenta.saldo - datos.monto })
      .eq('id', datos.cuentaId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Mueve dinero de Cuenta A -> Cuenta B
 */
export async function realizarTransferencia(origenId, destinoId, monto) {
  try {
    // 1. Obtener saldos
    const { data: origen } = await supabase.from('cuentas').select('saldo').eq('id', origenId).single();
    const { data: destino } = await supabase.from('cuentas').select('saldo').eq('id', destinoId).single();

    if (origen.saldo < monto) throw new Error("Fondos insuficientes en la cuenta de origen.");

    // 2. Restar de Origen
    await supabase.from('cuentas').update({ saldo: origen.saldo - monto }).eq('id', origenId);

    // 3. Sumar a Destino
    await supabase.from('cuentas').update({ saldo: destino.saldo + monto }).eq('id', destinoId);

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Trae la suma de gastos sueltos del mes actual para el dashboard
 */
export async function obtenerGastosSueltosMes() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString();

  const { data } = await supabase
    .from('gastos')
    .select('monto, tipo')
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia);

  return data || [];
}

export async function obtenerHistorialGastos(limite = null) {
  let query = supabase
    .from('gastos')
    .select('*, cuentas(nombre, logo_url)')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (limite) query = query.limit(limite);
  
  const { data, error } = await query;
  return data || [];
}

/**
 * ACTUALIZAR GASTO
 * 1. Devuelve el dinero viejo a la cuenta.
 * 2. Cobra el dinero nuevo de la cuenta.
 */
export async function actualizarGasto(id, datosNuevos) {
  try {
    // 1. Obtener gasto anterior
    const { data: anterior } = await supabase.from('gastos').select('*').eq('id', id).single();
    
    // 2. Devolver dinero a la cuenta anterior (Sumar lo que habíamos restado)
    const { data: cuentaAnt } = await supabase.from('cuentas').select('saldo').eq('id', anterior.cuenta_id).single();
    if (cuentaAnt) {
       await supabase.from('cuentas').update({ saldo: cuentaAnt.saldo + anterior.monto }).eq('id', anterior.cuenta_id);
    }

    // 3. Actualizar registro
    const { error: updateError } = await supabase.from('gastos').update({
        monto: datosNuevos.monto,
        tipo: datosNuevos.tipo,
        descripcion: datosNuevos.descripcion,
        cuenta_id: datosNuevos.cuentaId,
        fecha: datosNuevos.fecha
    }).eq('id', id);

    if (updateError) throw updateError;

    // 4. Cobrar nuevo monto (Restar)
    const { data: cuentaNueva } = await supabase.from('cuentas').select('saldo').eq('id', datosNuevos.cuentaId).single();
    if (cuentaNueva) {
       await supabase.from('cuentas').update({ saldo: cuentaNueva.saldo - datosNuevos.monto }).eq('id', datosNuevos.cuentaId);
    }

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * ELIMINAR GASTO
 * 1. Devuelve el dinero a la cuenta (Reembolso).
 * 2. Borra el registro.
 */
export async function eliminarGasto(id) {
  try {
    // 1. Obtener datos del gasto
    const { data: gasto } = await supabase.from('gastos').select('*').eq('id', id).single();
    if (!gasto) throw new Error("Gasto no encontrado");

    // 2. Devolver saldo a la cuenta (Sumar)
    if (gasto.cuenta_id) {
      const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', gasto.cuenta_id).single();
      if (cuenta) {
        await supabase.from('cuentas')
          .update({ saldo: cuenta.saldo + gasto.monto })
          .eq('id', gasto.cuenta_id);
      }
    }

    // 3. Eliminar registro
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    throw error;
  }
}