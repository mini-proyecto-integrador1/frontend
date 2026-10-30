# En Punto — Frontend

**En Punto** es una aplicación web para organizadores de eventos independientes: permite crear un evento con sus gestiones logísticas, ver qué es urgente hoy, reprogramar cuando un día se sobrecarga y seguir el progreso del evento.

Proyecto Integrador I (750018C) — Universidad del Valle, 2026-II.

## Aplicación desplegada

| Servicio | URL |
|---|---|
| Frontend (Vercel) | https://frontend-sepia-eight-44.vercel.app |
| Backend (Render) | https://mini-proyecto-integrador1-back.onrender.com |
| Documentación de la API (Swagger) | https://mini-proyecto-integrador1-back.onrender.com/api/docs/ |

> El backend está en un plan gratuito de Render y se duerme cuando no se usa. La primera carga puede tardar hasta un minuto; si aparece un error de conexión, espera un momento y recarga.

## Cuenta de demostración

- **Correo:** `demo@enpunto.com`
- **Contraseña:** `D040608#`

La cuenta incluye el evento "Lanzamiento de producto" (20 de noviembre) con 3 gestiones: una hecha, una pospuesta con nota y una pendiente. El 14 de noviembre ya tiene 5 h de las 6 h del límite diario: agregar una gestión de 3 h ese día muestra el aviso de sobrecarga.

## Pantallas

| Ruta | Descripción |
|---|---|
| `/login` y `/registro` | Acceso y creación de cuenta |
| `/hoy` | Gestiones ordenadas por urgencia (vencidas, para hoy, próximas) y avisos de sobrecarga |
| `/crear` | Crear un evento con sus gestiones logísticas |
| `/evento` | Lista de eventos |
| `/evento/:id` | Detalle del evento: editar, cambiar estado (pendiente, hecha, pospuesta), reprogramar y eliminar |
| `/progreso` | Avance de cada evento y avance general |

Las rutas privadas requieren iniciar sesión; sin sesión se redirige a `/login`.

## Tecnologías

- React 19 y React Router 7
- Vite 8
- Tailwind CSS 4
- lucide-react (íconos)
- ESLint

## Ejecutar en local

### Requisitos

- [Node.js](https://nodejs.org/) 20.19 o superior, con `npm` (probado con Node 22 LTS). Para comprobar tu versión: `node --version`
- Git
- Un navegador actualizado (Chrome, Edge o Firefox)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/mini-proyecto-integrador1/frontend.git
cd frontend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

**Qué deberías ver en cada paso:**

1. `npm install` termina sin errores y crea la carpeta `node_modules/`.
2. `npm run dev` muestra en la terminal una línea como `Local: http://localhost:5173/`. Déjala abierta mientras uses la aplicación.
3. Al abrir esa dirección en el navegador aparece la pantalla de inicio de sesión de En Punto. Escribe el correo y la contraseña de la cuenta de demostración: debes llegar a la pantalla **Hoy**.

Para detener el servidor, presiona `Ctrl + C` en la terminal.

### Variable de entorno

El frontend lee la URL de la API desde `VITE_API_URL`. El archivo `.env` del repositorio ya apunta al backend desplegado en Render, así que **no necesitas levantar el backend** para probar la aplicación:

```
VITE_API_URL=https://mini-proyecto-integrador1-back.onrender.com
```

Si quieres usar un backend propio en tu computador (por ejemplo, en `http://localhost:8000`), crea un archivo `.env.local` en la raíz del frontend con la dirección de ese backend. Ese archivo no se sube al repositorio y tiene prioridad sobre `.env`:

```
VITE_API_URL=http://localhost:8000
```

Las instrucciones para levantar el backend están en el README del repositorio del backend.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión de producción en la carpeta `dist/` |
| `npm run preview` | Sirve la versión de producción generada con `build` |
| `npm run lint` | Revisa el código con ESLint |

## Recorrido sugerido con la cuenta de demostración

Estos pasos reproducen las tareas de las pruebas de usabilidad (T1 a T4):

| Tarea | Qué hacer | Resultado esperado |
|---|---|---|
| **T1 — Crear un evento** | Ve a **Crear evento**, escribe un nombre, elige tipo y fecha, y agrega al menos 2 gestiones con fecha y horas estimadas. Guarda. | El evento aparece en **Mis eventos** con sus gestiones. |
| **T2 — Ver lo urgente** | Ve a **Hoy**. Pasa el cursor por **Ordenado por urgencia** para ver la regla. Marca una gestión como **Hecha** en el detalle del evento. | La lista se agrupa en Vencidas, Para hoy y Próximas; la gestión hecha sale de la lista pendiente. |
| **T3 — Resolver una sobrecarga** | En el evento "Lanzamiento de producto", agrega una gestión de 3 h con fecha 14 de noviembre (ese día ya tiene 5 de 6 h). | Aparece el aviso de sobrecarga, con la explicación del límite diario y las opciones para resolverlo (cambiar el límite o reprogramar). |
| **T4 — Posponer y ver el progreso** | En el detalle de un evento, elige **Pospuesta** en una gestión y escribe una nota. Luego abre **Progreso**. | La gestión queda pospuesta con su nota y cuenta en el total, pero no suma avance hasta marcarla como hecha. |

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `npm install` o `npm run dev` fallan con un error de versión de Node | Node más antiguo que 20.19 | Instala una versión más reciente desde nodejs.org y repite `npm install`. |
| `command not found: npm` | Node no está instalado | Instala Node.js (incluye `npm`). |
| El puerto 5173 está ocupado | Hay otra aplicación usándolo | Vite elige otro puerto y lo muestra en la terminal: usa esa dirección. |
| Al iniciar sesión sale un error de conexión | El backend de Render está dormido | Espera 30 a 60 segundos y vuelve a intentar. |
| La pantalla queda en blanco o redirige siempre a `/login` | La sesión venció | Vuelve a iniciar sesión. |
| Con un backend local, el navegador bloquea las peticiones | Falta permitir el origen del frontend (CORS) | Permite `http://localhost:5173` en la configuración de CORS del backend. |

## Despliegue

El frontend se despliega en **Vercel** a partir de la rama `main`. El archivo `vercel.json` redirige todas las rutas a `index.html` para que React Router funcione al recargar o abrir un enlace directo (por ejemplo `/hoy`). La variable `VITE_API_URL` apunta al backend en Render.

## Estructura del proyecto

```
src/
├── pages/        Pantallas (Hoy, Crear, Eventos, EventoDetalle, Progreso, Login, Registro)
├── components/   Componentes reutilizables (encabezado, modales, ayudas, barra de progreso…)
├── *Service.js   Llamadas a la API (auth, eventos, hoy)
├── *Utils.js     Lógica de apoyo (urgencia, sobrecarga, progreso, errores)
├── api.js        URL base de la API
└── App.jsx       Rutas de la aplicación
```

## Equipo

- Luis Yair Valencia Rivas — UX, frontend y QA
- Martín Stivensson Álvarez Quintero — UX y frontend
- Jairo Hernán González Barreto — backend

Profesor: Fabián Stiven Valencia Córdoba
