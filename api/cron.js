// api/cron.js — Notificación del suplemento (12pm, 3pm, 6pm, 9pm VET)
const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: process.env.ONESIGNAL_APP_ID,
                included_segments: ['All'],
                headings: { en: '💊 ¿Ya te tomaste tu suplemento?' },
                contents: { en: 'Si no lo has hecho, hazlo. Que no te hice esto para que lo ignores 🙃' },
                priority: 10,
                ttl: 3600,
                web_buttons: [
                    { id: 'done', text: '✅ ¡Hecho!' },
                    { id: 'snooze', text: '⏰ En 10 min' }
                ]
            })
        });

        const data = await response.json();
        if (data.errors) return res.status(500).json({ error: data.errors });

        console.log('Suplemento enviado:', data.id);
        return res.status(200).json({ success: true, id: data.id });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
