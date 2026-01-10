import { supabase } from './supabaseClient';

/**
 * 1. Registra el ingreso en la tabla 'ingresos'.
 * 2. Actualiza el saldo de la cuenta seleccionada (suma).
 */
export async function registrarIngreso(datos) {
  try {
    // A. Insertar el registro del ingreso
    const { error: insertError } = await supabase
      .from('ingresos')
      .insert([{
        nombre: datos.nombre,
        monto: datos.monto,
        categoria: datos.categoria,
        descripcion: datos.descripcion,
        cuenta_id: datos.cuentaId,
        fecha: datos.fecha,
        suma_a_presupuesto: datos.sumaPresupuesto
      }]);

    if (insertError) throw insertError;

    // B. Actualizar el saldo de la cuenta (Sumar dinero)
    // 1. Obtener saldo actual
    const { data: cuenta, error: fetchError } = await supabase
      .from('cuentas')
      .select('saldo')
      .eq('id', datos.cuentaId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Sumar y guardar
    const nuevoSaldo = cuenta.saldo + datos.monto;
    const { error: updateError } = await supabase
      .from('cuentas')
      .update({ saldo: nuevoSaldo })
      .eq('id', datos.cuentaId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error("Error en registrarIngreso:", error);
    throw error;
  }
}

/**
 * Calcula el "Ingreso Mensual Total" para el Dashboard.
 * Suma solo los ingresos del mes actual que tengan el checkbox activado.
 */
export async function obtenerIngresoMensual() {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString();

  const { data, error } = await supabase
    .from('ingresos')
    .select('monto')
    .eq('suma_a_presupuesto', true) // Solo los que cuentan para presupuesto
    .gte('fecha', primerDia)
    .lte('fecha', ultimoDia);

  if (error) {
    console.error(error);
    return 0;
  }

  // Sumar todo
  return data.reduce((acc, curr) => acc + curr.monto, 0);
}

/**
 * Obtiene la lista de ingresos.
 * @param {number|null} limite - Si pasas un número, trae solo esos (ej: 5). Si es null, trae todos.
 */
export async function obtenerHistorialIngresos(limite = null) {
  try {
    let query = supabase
      .from('ingresos')
      .select(`
        *,
        cuentas ( nombre, color, logo_url )
      `)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (limite) {
      query = query.limit(limite);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return [];
  }
}

/**
 * ACTUALIZAR INGRESO
 * 1. Resta el monto viejo de la cuenta vieja.
 * 2. Actualiza el registro.
 * 3. Suma el monto nuevo a la cuenta nueva.
 */
export async function actualizarIngreso(id, datosNuevos) {
  try {
    // 1. Obtener el ingreso ANTERIOR para saber cuánto restar
    const { data: anterior } = await supabase.from('ingresos').select('*').eq('id', id).single();
    if (!anterior) throw new Error("Ingreso no encontrado");

    // 2. Revertir saldo en cuenta anterior (Restar lo que habíamos sumado)
    const { data: cuentaAnt } = await supabase.from('cuentas').select('saldo').eq('id', anterior.cuenta_id).single();
    if (cuentaAnt) {
       await supabase.from('cuentas').update({ saldo: cuentaAnt.saldo - anterior.monto }).eq('id', anterior.cuenta_id);
    }

    // 3. Actualizar el registro del ingreso
    const { error: updateError } = await supabase
      .from('ingresos')
      .update({
        nombre: datosNuevos.nombre,
        monto: datosNuevos.monto,
        categoria: datosNuevos.categoria,
        descripcion: datosNuevos.descripcion,
        cuenta_id: datosNuevos.cuentaId,
        fecha: datosNuevos.fecha,
        suma_a_presupuesto: datosNuevos.sumaPresupuesto
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 4. Aplicar nuevo saldo a la cuenta (Sumar el nuevo monto)
    const { data: cuentaNueva } = await supabase.from('cuentas').select('saldo').eq('id', datosNuevos.cuentaId).single();
    if (cuentaNueva) {
       await supabase.from('cuentas').update({ saldo: cuentaNueva.saldo + datosNuevos.monto }).eq('id', datosNuevos.cuentaId);
    }

    return true;
  } catch (error) {
    console.error("Error al actualizar ingreso:", error);
    throw error;
  }
}

/**
 * ELIMINAR INGRESO
 * 1. Resta el dinero de la cuenta (Reverso).
 * 2. Borra el registro.
 */
export async function eliminarIngreso(id) {
  try {
    // 1. Obtener datos del ingreso para saber cuánto restar y a qué cuenta
    const { data: ingreso } = await supabase.from('ingresos').select('*').eq('id', id).single();
    if (!ingreso) throw new Error("Ingreso no encontrado");

    // 2. Restar saldo a la cuenta
    if (ingreso.cuenta_id) {
      const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', ingreso.cuenta_id).single();
      if (cuenta) {
        await supabase.from('cuentas')
          .update({ saldo: cuenta.saldo - ingreso.monto })
          .eq('id', ingreso.cuenta_id);
      }
    }

    // 3. Eliminar registro
    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error eliminando ingreso:", error);
    throw error;
  }
}