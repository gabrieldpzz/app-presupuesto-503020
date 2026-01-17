import { supabase } from './supabaseClient';

// Registrar las deudas al momento de crear el gasto
export async function registrarDeudas(gastoId, listaDeudores) {
  const inserts = listaDeudores.map(d => ({
    gasto_id: gastoId,
    persona: d.nombre,
    monto: d.monto,
    pagado: false
  }));

  const { error } = await supabase.from('deudas').insert(inserts);
  if (error) throw error;
}

// Obtener deudas pendientes
export async function obtenerDeudasPendientes() {
  const { data } = await supabase
    .from('deudas')
    .select('*, gastos(descripcion, fecha)')
    .eq('pagado', false)
    .order('created_at', { ascending: false });
  return data || [];
}

// NUEVO: Obtener deudas de un gasto específico
export async function obtenerDeudasPorGasto(gastoId) {
  const { data } = await supabase
    .from('deudas')
    .select('*')
    .eq('gasto_id', gastoId)
    .order('persona', { ascending: true });
  return data || [];
}

// MARCAR COMO PAGADO (Aquí ocurre la magia de devolver el dinero)
export async function marcarDeudaPagada(deudaId, cuentaDestinoId) {
  try {
    // 1. Obtener info de la deuda
    const { data: deuda } = await supabase.from('deudas').select('*').eq('id', deudaId).single();
    
    // 2. Traer saldo de la cuenta
    const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', cuentaDestinoId).single();

    // 3. SUMAR EL DINERO A LA CUENTA (Reembolso)
    await supabase.from('cuentas').update({ saldo: cuenta.saldo + deuda.monto }).eq('id', cuentaDestinoId);

    // 4. Crear un registro de Ingreso tipo "Reembolso" (Opcional, para historial)
    await supabase.from('ingresos').insert([{
        monto: deuda.monto,
        categoria: 'Devolucion',
        nombre: `Pago de ${deuda.persona}`,
        cuenta_id: cuentaDestinoId,
        fecha: new Date(),
        suma_a_presupuesto: false // No cuenta como ingreso real, es retorno
    }]);

    // 5. Marcar deuda como pagada
    await supabase.from('deudas').update({ pagado: true }).eq('id', deudaId);

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// NUEVO: Deshacer pago (Si te equivocaste al marcarlo)
export async function desmarcarDeudaPagada(deudaId, cuentaDestinoId) {
  try {
    // 1. Obtener info de la deuda
    const { data: deuda } = await supabase.from('deudas').select('*').eq('id', deudaId).single();
    
    // 2. Traer saldo de la cuenta
    const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', cuentaDestinoId).single();

    // 3. RESTAR EL DINERO (Corregir el error)
    await supabase.from('cuentas').update({ saldo: cuenta.saldo - deuda.monto }).eq('id', cuentaDestinoId);

    // 4. Marcar como NO pagado
    await supabase.from('deudas').update({ pagado: false }).eq('id', deudaId);

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}