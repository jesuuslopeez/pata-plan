# 3. Instalación y puesta en marcha

Este documento explica cómo levantar PataPlan en un equipo nuevo, tanto en modo desarrollo como en producción. Hay dos rutas posibles: con **Docker Compose** (recomendada, todo se levanta con un comando) o **sin Docker** (más control, requiere instalar PostgreSQL manualmente).

---

## 3.1. Requisitos previos

| Herramienta | Versión mínima | Comprobar con |
|-------------|----------------|---------------|
| Node.js | 20 LTS o superior | `node --version` |
| npm | 10+ (viene con Node) | `npm --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | v2 (integrado en Docker Desktop) | `docker compose version` |
| Git | 2.40+ | `git --version` |
| Navegador moderno | Chrome, Firefox, Edge o Safari actuales | — |

Si vas a usar la ruta sin Docker, también necesitas **PostgreSQL 16** instalado localmente.

---

## 3.2. Clonar el repositorio

```bash
git clone https://github.com/jesuuslopeez/pata-plan.git
cd pata-plan
```

La estructura relevante es:

```
pata-plan/
├── client/                   # frontend React + Vite
├── server/                   # backend Node.js + Express + Prisma
├── docker-compose.yml        # base: servicio de base de datos
├── docker-compose.dev.yml    # overrides para desarrollo
├── docker-compose.prod.yml   # overrides para producción
└── .env.example              # plantilla de variables de entorno
```

---

## 3.3. Configurar variables de entorno

Copia la plantilla:

```bash
cp .env.example .env
```

Edita `.env` y rellena cada variable. A continuación se explica qué hace cada una.

### 3.3.1. Base de datos

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_USER` | Usuario de PostgreSQL. Valor por defecto: `pataplan`. |
| `POSTGRES_PASSWORD` | Contraseña del usuario. **Cámbiala en producción.** |
| `POSTGRES_DB` | Nombre de la base de datos. Valor por defecto: `pataplan`. |
| `DATABASE_URL` | Cadena de conexión completa de Prisma. Formato: `postgresql://USUARIO:PASSWORD@HOST:5432/BASE`. En Docker el host es **`db`** (nombre del servicio). Sin Docker, **`localhost`**. |

### 3.3.2. Servidor

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto en el que escucha el backend. Por defecto `3000`. |
| `NODE_ENV` | `development` o `production`. |

### 3.3.3. Autenticación (JWT)

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave usada para firmar los tokens. **Obligatorio cambiarla en producción** por una cadena larga y aleatoria. |
| `JWT_EXPIRES_IN` | Duración por defecto de los tokens (`1d`, `7d`, `30d`…). Si el usuario marca "Mantener sesión iniciada", el backend usa 30 días sin tocar esta variable. |

### 3.3.4. CORS

| Variable | Descripción |
|----------|-------------|
| `CORS_ORIGIN` | URL del frontend autorizada. En desarrollo `http://localhost:5173`. En producción la URL real desplegada. |

### 3.3.5. Subida de archivos

| Variable | Descripción |
|----------|-------------|
| `UPLOAD_MAX_SIZE_MB` | Tamaño máximo por fichero subido. Por defecto `10`. |
| `UPLOAD_DIR` | Carpeta donde se guardan los archivos. Por defecto `uploads`. |

### 3.3.6. Envío de correo (opcional)

Si dejas las variables SMTP vacías, PataPlan genera automáticamente una cuenta de pruebas en **Ethereal** y muestra en la consola del backend una URL para previsualizar cada correo (útil en desarrollo). Para que los correos lleguen a buzones reales, configura un proveedor SMTP:

| Variable | Descripción |
|----------|-------------|
| `SMTP_HOST` | Servidor SMTP. Por ejemplo `smtp.gmail.com`. |
| `SMTP_PORT` | Puerto. Habitualmente `587`. |
| `SMTP_SECURE` | `true` para SMTPS (puerto 465), `false` para STARTTLS (puerto 587). |
| `SMTP_USER` | Usuario / correo de la cuenta. |
| `SMTP_PASS` | Contraseña o **contraseña de aplicación** (en Gmail, generada desde la cuenta de Google con 2FA activada). |
| `MAIL_FROM` | Dirección que aparece como remitente. Ej. `"PataPlan <no-reply@pataplan.com>"`. |
| `VERIFY_URL_BASE` | URL pública del frontend para verificación de correo. Por defecto `http://localhost:5173/verify-email`. |
| `RESET_URL_BASE` | URL pública del frontend para restablecer contraseña. Por defecto `http://localhost:5173/reset-password`. |

---

## 3.4. Puesta en marcha con Docker Compose (recomendada)

Esta es la ruta más simple: levanta base de datos, backend y frontend con un solo comando.

### 3.4.1. Modo desarrollo

Usa la combinación del compose base + el override de desarrollo:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Esto arranca:

- PostgreSQL en `localhost:5432`
- Backend en `http://localhost:3000` (con `nodemon` y *hot reload*)
- Frontend en `http://localhost:5173` (con Vite y *hot reload*)

Para ver los logs en vivo:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

Para parar todo:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### 3.4.2. Modo producción

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

En producción el frontend se sirve desde Nginx en el puerto `80` y el backend corre con `npm start`. Asegúrate de:

- Haber cambiado `POSTGRES_PASSWORD` y `JWT_SECRET` por valores seguros.
- Haber configurado `CORS_ORIGIN`, `VERIFY_URL_BASE` y `RESET_URL_BASE` con la URL pública real.
- Tener SMTP configurado si quieres que los correos lleguen.

### 3.4.3. Migrar el esquema y poblar la base de datos

La primera vez (y cada vez que cambie `prisma/schema.prisma`) hay que sincronizar la base de datos. Desde fuera del contenedor:

```bash
docker compose exec server npx prisma db push
docker compose exec server npx prisma generate
```

Para cargar datos de ejemplo:

```bash
docker compose exec server npx prisma db seed
```

---

## 3.5. Comandos de desarrollo

Aunque uses Docker, en muchos casos es más cómodo lanzar los comandos directamente con `npm`.

### 3.5.1. Backend (`/server`)

```bash
cd server

npm run dev        # arranca el backend con nodemon (hot reload)
npm start          # arranca en modo producción
npm test           # ejecuta los tests con Jest
npm run lint       # comprueba estilo de código con ESLint
npm run lint:fix   # corrige automáticamente lo que puede
npm run format     # formatea con Prettier
```

Comandos de Prisma (también desde `/server`):

```bash
npx prisma db push        # sincroniza el esquema con la BD
npx prisma generate       # regenera el cliente de Prisma
npx prisma db seed        # carga el seed inicial
npx prisma studio         # abre Prisma Studio en http://localhost:5555
```

### 3.5.2. Frontend (`/client`)

```bash
cd client

npm run dev        # arranca Vite en http://localhost:5173
npm run build      # genera el build de producción en /dist
npm run preview    # sirve el build para probarlo en local
npm run lint       # comprueba estilo de código
npm run lint:fix   # corrige automáticamente lo que puede
npm run format     # formatea con Prettier
```

---

## 3.6. Instalación sin Docker

Si no quieres usar Docker, necesitas instalar PostgreSQL manualmente y levantar backend y frontend por separado.

### 3.6.1. Instalar PostgreSQL

- **Linux (Ubuntu/Debian):** `sudo apt install postgresql-16`
- **macOS (Homebrew):** `brew install postgresql@16 && brew services start postgresql@16`
- **Windows:** instalador oficial desde https://www.postgresql.org/download/windows/

Crea la base de datos y el usuario:

```bash
sudo -u postgres psql
```

```sql
CREATE USER pataplan WITH PASSWORD 'change-me';
CREATE DATABASE pataplan OWNER pataplan;
GRANT ALL PRIVILEGES ON DATABASE pataplan TO pataplan;
\q
```

### 3.6.2. Ajustar `DATABASE_URL`

En `.env` cambia el host de `db` (Docker) a `localhost`:

```
DATABASE_URL=postgresql://pataplan:change-me@localhost:5432/pataplan
```

### 3.6.3. Instalar dependencias y arrancar

En dos terminales distintas:

**Terminal 1 — backend:**

```bash
cd server
npm install
npx prisma db push
npx prisma generate
npx prisma db seed     # opcional, carga datos de ejemplo
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

---

## 3.7. Acceso por defecto

Si has ejecutado el seed, puedes entrar con:

- **Usuario:** `admin@pataplan.com`
- **Contraseña:** `admin123`

Cambia estas credenciales antes de exponer el proyecto en producción.

---

## 3.8. Troubleshooting

### 3.8.1. Puerto ya en uso

Síntoma: el backend o el frontend no arrancan y se ve un error tipo `EADDRINUSE` o `Port 3000 is already in use`.

Identifica el proceso que ocupa el puerto y mátalo:

```bash
# Linux / macOS
lsof -i :3000
kill -9 <PID>

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

O cambia el puerto en `.env` (`PORT=3001`) y, si estás en desarrollo, ajusta también `CORS_ORIGIN` y la baseURL de axios en `client/src/services/api.js`.

### 3.8.2. Error de conexión a la base de datos

Síntoma: el backend arranca pero todas las llamadas devuelven 500, o Prisma falla con `Can't reach database server`.

Comprueba en orden:

1. ¿Está corriendo el contenedor de PostgreSQL? `docker compose ps`
2. ¿Las credenciales de `.env` coinciden con las del contenedor (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`)?
3. ¿`DATABASE_URL` apunta al host correcto? **`db`** dentro de Docker, **`localhost`** fuera.
4. Si has cambiado la contraseña tras un primer arranque, borra el volumen y recrea: `docker compose down -v && docker compose up -d`.

### 3.8.3. Errores de Prisma tras cambiar el esquema

Síntoma: el backend devuelve `Unknown field XYZ for select statement on model …` o similar.

El cliente de Prisma está desactualizado. Regenéralo:

```bash
cd server
npx prisma db push      # sincroniza la BD si has tocado schema.prisma
npx prisma generate     # regenera el cliente
```

Reinicia el backend (`nodemon` puede no detectar el regenerado).

### 3.8.4. Cambios en `.env` que no se aplican

`nodemon` no observa `.env` por defecto. Si has tocado `.env`, **reinicia el backend manualmente**: pulsa `rs` en la terminal donde corre `nodemon`, o detenlo y vuelve a lanzarlo.

### 3.8.5. CORS bloquea las peticiones desde el navegador

Síntoma: el navegador muestra `CORS policy: No 'Access-Control-Allow-Origin' header`.

Comprueba que `CORS_ORIGIN` en `.env` es exactamente la URL desde la que sirves el frontend (incluyendo el puerto). En desarrollo: `http://localhost:5173`.

### 3.8.6. Los correos no llegan

Si has configurado SMTP y los correos no llegan:

1. Revisa la carpeta de **spam** del destinatario.
2. En Gmail, asegúrate de tener **verificación en dos pasos activada** y de usar una **contraseña de aplicación**, no tu contraseña normal.
3. Si dejas las variables SMTP vacías, los correos NO se mandan a buzones reales: PataPlan usa Ethereal y muestra en la consola del backend una URL `[mailer] Preview URL: …` para verlos.

### 3.8.7. Permisos al subir archivos

Síntoma: subir un documento o foto falla con `EACCES` o un 500 del backend.

La carpeta `uploads/` debe ser escribible por el proceso del backend:

```bash
mkdir -p server/uploads/animals server/uploads/documents
chmod -R 755 server/uploads        # Linux / macOS
```
