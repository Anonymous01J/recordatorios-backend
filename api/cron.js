const fetch = require('node-fetch');

const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

const MENSAJES = {
    suplemento: {
        titulo: "💊 ¿Ya te tomaste tu suplemento?",
        mensaje: "Si no lo has hecho, hazlo. Que no te hice esto para que lo ignores 🙃",
        botones: [
            { id: 'done', text: '✅ ¡Hecho!' },
            { id: 'snooze', text: '⏰ En 10 min' }
        ]
    },
    parche: {
        titulo: "🏴‍☠️ ¿Te pusiste tu parche hoy?",
        mensaje: "Si no lo has hecho, es tu momento de hacer Cosplay de Garfio 🪝",
        botones: [
            { id: 'done', text: '✅ ¡Hecho!' },
            { id: 'pirata', text: '🏴‍☠️ ¡Soy Garfio!' }
        ]
    }
};

module.exports = async function handler(req, res) {
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const tipo = req.query.tipo || 'suplemento';
    const notif = MENSAJES[tipo];

    if (!notif) {
        return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${ONE_SIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONE_SIGNAL_APP_ID,
                included_segments: ['All'],
                headings: { es: notif.titulo },
                contents: { es: notif.mensaje },
                // CLAVE: Enviamos el ID para que el script sepa qué completar
                data: { tipo: tipo }, 
                priority: 10,
                ttl: 3600,
                web_buttons: notif.botones,
                chrome_web_icon: "https://recordatorios-app.netlify.app/favicon.ico"
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('OneSignal error:', data.errors);
            return res.status(500).json({ error: data.errors });
        }

        console.log(`Notificacion [${tipo}] enviada: ${data.id} recipients: ${data.recipients}`);
        return res.status(200).json({ ok: true, tipo, id: data.id, recipients: data.recipients });

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};