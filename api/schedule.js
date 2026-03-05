const fetch = require('node-fetch');

const ONE_SIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

/**
 * Convierte una hora local de Venezuela (UTC-4) a una fecha ISO en UTC
 * para el día de hoy o mañana si la hora ya pasó.
 */
function proximaFechaUTC(horaVE, minutoVE = 0) {
    const ahora = new Date();
    // Hora actual en Venezuela
    const offsetVE = -4 * 60; // minutos
    const localVE  = new Date(ahora.getTime() + (ahora.getTimezoneOffset() + offsetVE) * 60000);

    const objetivo = new Date(localVE);
    objetivo.setHours(horaVE, minutoVE, 0, 0);

    // Si la hora ya pasó hoy, programar para mañana
    if (objetivo <= localVE) {
        objetivo.setDate(objetivo.getDate() + 1);
    }

    // Convertir de vuelta a UTC
    return new Date(objetivo.getTime() - offsetVE * 60000).toISOString();
}

/**
 * Construye el array de horas UTC para un recordatorio periódico
 * (todas las ocurrencias del día que aún no pasaron)
 */
function horasPeriodicasUTC(horaInicio, horaFin, intervalo) {
    const fechas = [];
    for (let h = horaInicio; h <= horaFin; h += intervalo) {
        const fecha = proximaFechaUTC(h);
        fechas.push(fecha);
    }
    return fechas;
}

async function programarEnOneSignal({ playerId, titulo, mensaje, icono, tipo, id, sendAt, reprogramar, notif }) {
    const body = {
        app_id:            ONE_SIGNAL_APP_ID,
        include_player_ids: [playerId],
        headings:  { en: titulo, es: titulo },
        contents:  { en: mensaje, es: mensaje },
        data: {
            tipo,
            id,          // ID único del recordatorio para reprogramar
            titulo,
            mensaje,
            icono,
            reprogramar,
            playerId,
            hora:        notif && notif.hora       || undefined,
            horaInicio:  notif && notif.horaInicio || undefined,
            horaFin:     notif && notif.horaFin    || undefined,
            intervalo:   notif && notif.intervalo  || undefined
        },
        priority:          10,
        ttl:               3600,
        web_buttons: [
            { id: 'done', text: '✅ ¡Hecho!' }
        ],
        action_buttons: [
            { id: 'done', text: '✅ ¡Hecho!' }
        ]
    };

    if (sendAt) {
        body.send_after = sendAt; // ISO string en UTC
    }

    const res  = await fetch('https://onesignal.com/api/v1/notifications', {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Key ${ONE_SIGNAL_REST_KEY}`
        },
        body: JSON.stringify(body)
    });

    return res.json();
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { playerId, notif } = req.body;

    if (!playerId || !notif) {
        return res.status(400).json({ error: 'playerId y notif son requeridos' });
    }

    const { id, titulo, mensaje, icono, tipo, hora, horaInicio, horaFin, intervalo } = notif;

    try {
        const resultados = [];

        if (tipo === 'diario' || tipo === 'unica') {
            const sendAt     = proximaFechaUTC(hora || 9);
            const reprogramar = tipo === 'diario' ? 'diario' : null;
            const data = await programarEnOneSignal({
                playerId, titulo, mensaje, icono,
                tipo: id, id, sendAt, reprogramar, notif
            });
            resultados.push({ hora, sendAt, onesignalId: data.id, error: data.errors });

        } else if (tipo === 'periodico') {
            const fechas = horasPeriodicasUTC(horaInicio || 8, horaFin || 22, intervalo || 2);
            for (const sendAt of fechas) {
                const data = await programarEnOneSignal({
                    playerId, titulo, mensaje, icono,
                    tipo: id, id, sendAt, reprogramar: 'periodico', notif
                });
                resultados.push({ sendAt, onesignalId: data.id, error: data.errors });
            }
        }

        return res.status(200).json({ ok: true, resultados });

    } catch (err) {
        console.error('schedule error:', err.message);
        return res.status(500).json({ error: err.message });
    }
};