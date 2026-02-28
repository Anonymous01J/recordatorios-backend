# 📬 Recordatorios Backend

Backend serverless en Vercel que envía notificaciones push via OneSignal a las horas correctas.

## Horarios (Venezuela UTC-4)

| Notificación | Hora VE | Hora UTC (cron) |
|---|---|---|
| 💊 Suplemento | 12:00 PM | 16:00 |
| 💊 Suplemento | 3:00 PM  | 19:00 |
| 💊 Suplemento | 6:00 PM  | 22:00 |
| 💊 Suplemento + 🪝 Parche | 9:00 PM | 01:00 |

## Despliegue en Vercel

### 1. Crea un nuevo repo en GitHub
```bash
mkdir recordatorios-backend
cd recordatorios-backend
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/TU_USUARIO/recordatorios-backend.git
git push -u origin main
```

### 2. Importa el repo en Vercel
- Ve a vercel.com → New Project
- Selecciona el repo `recordatorios-backend`
- Haz clic en Deploy

### 3. Configura las variables de entorno en Vercel
Ve a tu proyecto → Settings → Environment Variables y agrega:

| Variable | Valor |
|---|---|
| `ONESIGNAL_APP_ID` | `6b37a1cf-ee9d-4941-8ca0-eb7bef3fbc75` |
| `ONESIGNAL_REST_KEY` | Tu REST API Key de OneSignal |
| `CRON_SECRET` | Una cadena aleatoria larga (ej: `mi-secreto-super-seguro-2026`) |

### 4. Redeploy
Después de agregar las variables, haz un redeploy desde el dashboard de Vercel.

### 5. Verifica que funciona
Visita: `https://TU-PROYECTO.vercel.app/api/cron?tipo=suplemento&hora=12`
Con el header: `Authorization: Bearer TU_CRON_SECRET`

## Estructura
```
/
├── api/
│   └── cron.js        ← Endpoint que envía la notificación
├── vercel.json        ← Configuración de crons automáticos
├── package.json
└── README.md
```
