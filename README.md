# VíaLibre — app web real

Este es el proyecto web real de VíaLibre (no un artefacto de Claude). Habla directamente con tu
backend (`vialibre-backend`) desplegado en Render.

## 1. Configurar

Este proyecto necesita saber dónde está tu backend. Crea un archivo `.env`:

```bash
cp .env.example .env
```

Y edítalo con la URL real de tu backend en Render:

```
VITE_BACKEND_URL=https://vialibre-backend.onrender.com
```

## 2. Probar en local

```bash
npm install
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

## 3. Publicar el sitio web

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para subir a cualquier hosting estático. Las opciones más
simples con capa gratuita:

**Vercel** (recomendado, más simple):
1. Sube esta carpeta a un repositorio de GitHub (igual que hiciste con el backend)
2. Ve a vercel.com → "Add New" → "Project" → selecciona el repositorio
3. Vercel detecta Vite automáticamente (Build command: `npm run build`, Output: `dist`)
4. En "Environment Variables", añade `VITE_BACKEND_URL` con la URL de tu backend en Render
5. Deploy — te da una URL pública tipo `https://vialibre-app.vercel.app`

**Netlify** funciona igual (Build command: `npm run build`, Publish directory: `dist`).

## Siguiente paso: empaquetar como app de Android

Una vez el sitio esté publicado en una URL pública (Vercel/Netlify), ese es el punto de partida
para convertirlo en una app instalable con PWABuilder y subirla a Google Play. Eso lo vemos en la
siguiente fase.
