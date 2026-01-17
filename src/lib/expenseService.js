import { supabase } from './supabaseClient';
import { registrarDeudas } from './debtService';

/**
 * 1. Crea el registro en tabla 'gastos'
 * 2. Resta el saldo de la cuenta
 */
export async function registrarGastoRapido(datos) {
  try {
    // 1. Validar saldo suficiente
    const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', datos.cuentaId).single();
    if (cuenta.saldo < datos.monto) throw new Error("Saldo insuficiente en la cuenta seleccionada.");

    // 2. Insertar Gasto y retornar datos
    const { data, error: insertError } = await supabase.from('gastos').insert([{
      monto: datos.monto,
      tipo: datos.tipo, // necesidad, deseo, ahorro
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      cuenta_id: datos.cuentaId,
      fecha: datos.fecha
    }]).select();
    
    if (insertError) throw insertError;
    const gastoCreado = data[0];

    // 3. Restar Saldo
    const { error: updateError } = await supabase
      .from('cuentas')
      .update({ saldo: cuenta.saldo - datos.monto })
      .eq('id', datos.cuentaId);

    if (updateError) throw updateError;

    // 4. Registrar deudas si existen
    if (datos.deudores && datos.deudores.length > 0) {
      await registrarDeudas(gastoCreado.id, datos.deudores);
    }

    return gastoCreado.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Mueve dinero de Cuenta A -> Cuenta B
 * Si esAhorro = true, crea un registro estadístico en 'gastos'.
 */
export async function realizarTransferencia(origenId, destinoId, monto, esAhorro = false) {
  try {
    const fechaHoy = new Date().toISOString().split('T')[0];

    // 1. Obtener saldos y NOMBRES (para la descripción del ahorro)
    const { data: origen } = await supabase.from('cuentas').select('saldo, nombre').eq('id', origenId).single();
    const { data: destino } = await supabase.from('cuentas').select('saldo, nombre').eq('id', destinoId).single();

    if (!origen || !destino) throw new Error("Cuentas no encontradas.");
    if (origen.saldo < monto) throw new Error("Fondos insuficientes en la cuenta de origen.");

    // 2. Restar de Origen
    const { error: errOrigen } = await supabase.from('cuentas').update({ saldo: origen.saldo - monto }).eq('id', origenId);
    if (errOrigen) throw errOrigen;

    // 3. Sumar a Destino
    const { error: errDestino } = await supabase.from('cuentas').update({ saldo: destino.saldo + monto }).eq('id', destinoId);
    if (errDestino) throw errDestino;

    // 4. SI ES AHORRO: Crear registro estadístico
    // Esto permite que el dashboard lo cuente en el 20% de ahorro sin perder el dinero (ya que está en la otra cuenta)
    if (esAhorro) {
        await supabase.from('gastos').insert([{
            monto: monto,
            tipo: 'ahorro', // Clave para la regla 50/30/20
            categoria: 'Ahorro',
            descripcion: `Transferencia a ${destino.nombre}`,
            cuenta_id: origenId,
            fecha: fechaHoy
        }]);
    }

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
    .select('*, cuentas(nombre, logo_url), deudas(id)')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (limite) query = query.limit(limite);
  
  const { data, error } = await query;
  return data || [];
}

/**
 * ACTUALIZAR GASTO
 */
export async function actualizarGasto(id, datosNuevos) {
  try {
    // 1. Obtener gasto anterior
    const { data: anterior } = await supabase.from('gastos').select('*').eq('id', id).single();
    
    // 2. Devolver dinero a la cuenta anterior
    const { data: cuentaAnt } = await supabase.from('cuentas').select('saldo').eq('id', anterior.cuenta_id).single();
    if (cuentaAnt) {
       await supabase.from('cuentas').update({ saldo: cuentaAnt.saldo + anterior.monto }).eq('id', anterior.cuenta_id);
    }

    // 3. Actualizar registro del gasto
    const { error: updateError } = await supabase.from('gastos').update({
        monto: datosNuevos.monto,
        tipo: datosNuevos.tipo,
        descripcion: datosNuevos.descripcion,
        categoria: datosNuevos.categoria,
        cuenta_id: datosNuevos.cuentaId,
        fecha: datosNuevos.fecha
    }).eq('id', id);

    if (updateError) throw updateError;

    // 4. Cobrar nuevo monto
    const { data: cuentaNueva } = await supabase.from('cuentas').select('saldo').eq('id', datosNuevos.cuentaId).single();
    if (cuentaNueva) {
       await supabase.from('cuentas').update({ saldo: cuentaNueva.saldo - datosNuevos.monto }).eq('id', datosNuevos.cuentaId);
    }

    // 5. Borrar deudas existentes
    await supabase.from('deudas').delete().eq('gasto_id', id);

    // 6. Registrar nuevas deudas
    if (datosNuevos.deudores && datosNuevos.deudores.length > 0) {
      await registrarDeudas(id, datosNuevos.deudores);
    }

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * ELIMINAR GASTO
 */
export async function eliminarGasto(id) {
  try {
    // 1. Obtener datos del gasto
    const { data: gasto } = await supabase.from('gastos').select('*').eq('id', id).single();
    if (!gasto) throw new Error("Gasto no encontrado");

    // 2. Devolver saldo a la cuenta
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