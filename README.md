# 🗼 La Torre Mística — Escape Room Cooperativo

> Escape room cooperativo asimétrico para 2 jugadores. 10 pisos. Comunicación por voz en tiempo real.
> Creado como despedida para Li, Nuria y José en Ferrovial.

---

## 🕹️ Cómo jugar

1. Ambos jugadores abren la URL del juego (local o Netlify)
2. Uno genera un **código de sala** y lo comparte
3. El otro introduce el mismo código
4. Cada uno elige su rol: **Jugador 1 (🔵)** o **Jugador 2 (🟠)**
5. Coordinar por voz — las pantallas son completamente diferentes
6. ¡Superar los 10 pisos para abrir el cofre final!

---

## 🔑 Soluciones de cada piso

| Piso | Nombre | Respuesta |
|------|--------|-----------|
| 1 | La Contraseña Oculta | **GRACIAS** (7·18·1·3·9·1·19) |
| 2 | El Día D | **31 / 01 / 2024** (fecha de incorporación de Li) |
| 3 | Cables Cruzados | AZUL→P1 · MORADO→P2 · ROJO→P3 · AMARILLO→P4 · VERDE→P5 |
| 4 | El Código Matemático | **52** |
| 5 | Laberinto a Ciegas | Llegar a la ★ (esquina inf. derecha) |
| 6 | Traducción de NPCs | Opción **B** |
| 7 | Secuencia de Válvulas | **V3 → V1 → V4 → V2** |
| 8 | Memoria Visual | Secuencia aleatoria (ver en J1 y dictar a J2) |
| 9 | Sincronización | Pulsar juntos (margen ±500ms) |
| 10 | El Cofre Final | J1: **NURIA** · J2: **JOSE** · insertar al mismo tiempo |

---

## 🔑 Modo Administrador (Test sin segundo jugador)

Introduce el código especial **`LIELEMEJOR`** como código de sala en el lobby.

**Qué activa:**
- Pantalla de confirmación "Modo Administrador" en púrpura
- Todos los pisos muestran ambos paneles (J1 + J2) al mismo tiempo
- Barra flotante en la parte inferior con:
  - 💡 **Pista del piso actual** (respuesta de J2 resumida)
  - **Botón "Saltar nivel →"** para avanzar directamente al siguiente piso
- Para los niveles 9 y 10 (que requieren dos personas simultáneas) aparece un botón **"Resolver automáticamente"**

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo local (sin Supabase — dos pestañas en el mismo navegador)
npm run dev
# → Abrir http://localhost:5173 en dos pestañas
# → Tab 1: código sala → rol J1
# → Tab 2: mismo código → rol J2
```

---

## 🌐 Configurar para Dispositivos Diferentes (Supabase)

Para jugar desde dos ordenadores/móviles distintos necesitas Supabase:

### Paso 1: Crear proyecto Supabase gratuito
1. Ve a [supabase.com](https://supabase.com) → **Start for free**
2. Crea un nuevo proyecto (nombre, contraseña, región: EU West)
3. Espera ~1 min a que se inicie

### Paso 2: Obtener credenciales
1. En tu proyecto → **Settings** → **API**
2. Copia **Project URL** y **anon public** key

### Paso 3: Crear el archivo .env
```bash
# En la carpeta del proyecto:
cp .env.example .env
```
Edita `.env`:
```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Paso 4: Habilitar Realtime en Supabase
1. En Supabase → **Realtime** (menú izquierdo)
2. Asegúrate de que está **enabled** (debería estarlo por defecto)
3. No necesitas crear ninguna tabla — solo se usa Broadcast + Presence

---

## 📦 Desplegar en Netlify

```bash
# 1. Build de producción
npm run build

# 2. Subir la carpeta 'dist/' a Netlify
# O conecta tu repositorio GitHub a Netlify con:
#   Build command: npm run build
#   Publish directory: dist
```

### Variables de entorno en Netlify
En Netlify → **Site settings** → **Environment variables** → añade:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| React 18 + Vite | Framework principal |
| Framer Motion | Animaciones de transición |
| Zustand | Estado global del juego |
| Supabase Realtime | Sincronización en tiempo real |
| BroadcastChannel | Fallback local (misma pestaña) |
| CSS 3D Transforms | Cofre 3D, laberinto, efectos |
| Canvas API | Laberinto del piso 5 |

---

## 📁 Estructura del Proyecto

```
src/
├── App.jsx                    # Router principal
├── index.css                  # Sistema de diseño completo
├── store/
│   └── useGameStore.js        # Estado global (Zustand)
├── lib/
│   └── sync.js                # Sincronización (Supabase o BroadcastChannel)
├── screens/
│   ├── LobbyScreen.jsx        # Pantalla de entrada y selección de rol
│   ├── GameScreen.jsx         # Motor del juego
│   └── VictoryScreen.jsx      # Pantalla de victoria
├── components/ui/
│   ├── TowerHeader.jsx        # Cabecera fija con progreso
│   ├── FloorTransition.jsx    # Animación entre pisos
│   └── NpcBackground.jsx      # NPCs y partículas de fondo
└── levels/
    ├── Level01_Password.jsx   # La Contraseña Oculta
    ├── Level02_DateDay.jsx    # El Día D (Ferrovial)
    ├── Level03_Cables.jsx     # Cables Cruzados
    ├── Level04_MathCode.jsx   # El Código Matemático
    ├── Level05_Maze.jsx       # Laberinto a Ciegas
    ├── Level06_NpcTranslation.jsx # Traducción de NPCs (Infraglot)
    ├── Level07_Valves.jsx     # Secuencia de Válvulas
    ├── Level08_VisualMemory.jsx   # Memoria Visual
    ├── Level09_Sync.jsx       # Sincronización
    └── Level10_Chest.jsx      # El Cofre Final + Animación SOUL
```

---

*Hecho con ❤️ como despedida. SOUL: Li + nUria + JOSé.*
