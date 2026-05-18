# 8. Despliegue

## 8.1. Entorno de producción

PataPlan está desplegada en un **VPS de IONOS** (Ubuntu Server LTS) con tres componentes orquestados por **Docker Compose**:

- **`db`** — instancia de **PostgreSQL 16 Alpine** con su volumen persistente.
- **`server`** — API REST construida con Node.js 20 + Express + Prisma, escuchando en el puerto interno 3000.
- **`client`** — SPA de React servida por **nginx Alpine** en el puerto 80, que además actúa como **reverse proxy** del backend para que las llamadas a `/api` lleguen al servicio `server` por la red interna de Docker.

La aplicación es accesible públicamente en:

> **<https://pataplan.yiisus.com>**

El VPS tiene asignado un dominio del autor (`yiisus.com`) y `pataplan` es un subdominio configurado mediante un registro `A` apuntando a la IP pública del servidor.

## 8.2. Topología

```
                                Internet
                                    │
                                    ▼
                  ┌──────────────────────────────────────┐
                  │       Reverse proxy (puerto 443)     │
                  │    nginx host + Let's Encrypt SSL    │
                  └──────────────────────────────────────┘
                                    │
                                    │ http://localhost:80
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │                  Docker network                       │
        │                                                       │
        │   ┌─────────────┐    ┌─────────────┐   ┌────────────┐ │
        │   │   client    │───▶│   server    │──▶│     db     │ │
        │   │ nginx:alp.  │    │ node:20     │   │ postgres16 │ │
        │   │  :80 SPA +  │    │  :3000 API  │   │   :5432    │ │
        │   │   /api  ➝   │    │             │   │  volumen   │ │
        │   └─────────────┘    └─────────────┘   └────────────┘ │
        └───────────────────────────────────────────────────────┘
```

El frontend y el backend nunca exponen puertos directamente al exterior: solo el contenedor `client` publica el puerto `80` hacia el host, y el reverse proxy del host es el que termina TLS y reenvía las peticiones.

## 8.3. Docker

### 8.3.1. Tres `docker-compose` apilables

Para que la misma configuración pueda usarse en local, en CI y en producción, PataPlan adopta el patrón de **un fichero base + dos overrides**:

- `docker-compose.yml` — **base**: define el servicio `db` con `postgres:16-alpine`, su volumen `pataplan-data`, su `healthcheck` (`pg_isready`) y la red `pataplan-network`. No incluye credenciales ni puertos expuestos: se completa con uno de los dos overrides.

- `docker-compose.dev.yml` — **desarrollo**: añade `server` y `client` con sus respectivos `Dockerfile.dev`, **publica los puertos** (`5432`, `3000`, `5173`), monta los **bind mounts** del código (`./server:/app`, `./client:/app`) para hot reload, y ejecuta `npm run dev` en ambos.

- `docker-compose.prod.yml` — **producción**: añade `server` y `client` con los `Dockerfile` multi-stage, **no monta volúmenes de código** (la imagen es autocontenida), ejecuta `npm start` en el servidor, y solo publica el puerto `80` del cliente.

Comandos típicos:

```bash
# Desarrollo
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `POSTGRES_*`, etc.) se leen del fichero `.env` del host. No se commiteán al repositorio: se documentan en `.env.example`.

### 8.3.2. Dockerfile del backend (`server/Dockerfile`)

Multi-stage de dos etapas para reducir el tamaño de la imagen final:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app .
EXPOSE 3000
CMD ["npm", "start"]
```

- **Etapa `build`**: instala dependencias de producción (`--only=production`) y genera el cliente de Prisma. Este paso es necesario en build porque el cliente generado depende del schema y debe quedar empaquetado dentro de la imagen.
- **Etapa final**: parte de una imagen base limpia y copia exclusivamente lo necesario para correr, dejando fuera todos los artefactos intermedios de instalación. La imagen resultante pesa aproximadamente 200 MB.

### 8.3.3. Dockerfile del frontend (`client/Dockerfile`)

Multi-stage de dos etapas, con cambio de imagen base entre etapas:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- **Etapa `build`**: instala dependencias (incluidas las de desarrollo, necesarias para Vite) y ejecuta `npm run build`, que genera la versión optimizada del SPA en `/app/dist`.
- **Etapa final**: parte de **nginx Alpine** (~25 MB), copia los estáticos generados en la etapa anterior y la configuración personalizada de nginx. No queda rastro de Node ni de npm en la imagen final.

### 8.3.4. nginx como reverse proxy interno

`client/nginx.conf` cumple dos funciones:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location /api {
        proxy_pass http://server:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- **`location /api`**: redirige las llamadas a la API hacia el contenedor `server` por el nombre de servicio de Docker (`http://server:3000`). Así el frontend hace todas sus llamadas a su propio origen (`/api/...`) y no hay CORS ni necesidad de URL del backend en runtime.
- **`location /`**: sirve el SPA con fallback a `index.html` para que las rutas del cliente (`/animals/42`, `/calendar`, etc.) funcionen tras un refresco del navegador.

## 8.4. HTTPS con Let's Encrypt

El contenedor `client` escucha en HTTP simple (puerto 80) dentro del host. La terminación TLS la realiza un **reverse proxy nginx ejecutándose directamente en el host** (fuera de Docker), que también gestiona la renovación automática de los certificados con **Let's Encrypt vía Certbot**.

Configuración resumida del bloque del proxy en el host:

```nginx
server {
    listen 443 ssl http2;
    server_name pataplan.yiisus.com;

    ssl_certificate     /etc/letsencrypt/live/pataplan.yiisus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pataplan.yiisus.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name pataplan.yiisus.com;
    return 301 https://$host$request_uri;
}
```

Certificados emitidos y renovados automáticamente con:

```bash
sudo certbot --nginx -d pataplan.yiisus.com
sudo systemctl enable certbot.timer
```

El timer de `systemd` ejecuta `certbot renew` dos veces al día. Si un certificado está a menos de 30 días de caducar, lo renueva sin intervención.

## 8.5. CI/CD con GitHub Actions

El repositorio incluye **un workflow de integración continua** que se dispara en cada `push` y en cada `pull request` contra las ramas `main` y `develop`. El fichero vive en `.github/workflows/ci.yml`.

### 8.5.1. Pasos del workflow

El workflow tiene tres jobs que se ejecutan en paralelo:

**Job `lint`** — verifica que el código respeta las convenciones de estilo.

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with: { node-version: '20', cache: 'npm' }
- run: npm ci --prefix server
- run: npm run lint --prefix server
- run: npm ci --prefix client
- run: npm run lint --prefix client
```

**Job `test`** — ejecuta la suite de tests del backend con Jest, incluida la cobertura.

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with: { node-version: '20', cache: 'npm' }
- run: npm ci --prefix server
- run: npm test --prefix server -- --coverage
- uses: actions/upload-artifact@v4
  with:
    name: coverage-report
    path: server/coverage
```

El informe de cobertura se sube como artefacto del workflow, lo que permite descargarlo desde la pestaña Actions de GitHub para revisarlo sin tener que regenerarlo localmente.

**Job `build`** — construye las imágenes Docker para validar que el `Dockerfile` y el `docker-compose.prod.yml` siguen funcionando.

```yaml
- uses: actions/checkout@v4
- uses: docker/setup-buildx-action@v3
- run: docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

Si cualquiera de los tres jobs falla, el PR no puede mergearse: las ramas `main` y `develop` están protegidas con **branch protection rules** que exigen estado verde antes de permitir merge.

### 8.5.2. Dependabot

Configurado en `.github/dependabot.yml`, abre PRs automáticos cuando:

- Hay actualizaciones de paquetes de npm en `server/` o `client/`.
- Hay actualizaciones de versiones de las propias GitHub Actions usadas en el workflow.
- Se publica una vulnerabilidad de seguridad en alguna dependencia.

Los PRs de Dependabot pasan por el mismo CI que cualquier otro: si los tests siguen pasando con la nueva versión, el PR queda listo para revisión.

## 8.6. Proceso de despliegue

El despliegue es **manual con un script de actualización** en el VPS — no hay despliegue automático desde `main` para mantener control sobre el momento del paso a producción y evitar despliegues no intencionados durante pruebas.

### 8.6.1. Pasos desde `push` a `main` hasta producción

1. **Merge a `main`**: el cambio llega a la rama protegida tras pasar el CI y la revisión.
2. **Conexión por SSH al VPS de IONOS** desde el equipo del autor:
   ```bash
   ssh deploy@pataplan.yiisus.com
   ```
3. **Pull de los cambios** en el directorio del proyecto:
   ```bash
   cd /opt/pataplan
   git pull origin main
   ```
4. **Reconstrucción de las imágenes** con la nueva versión del código:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml build
   ```
5. **Aplicación de migraciones de Prisma** si las hay:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     run --rm server npx prisma migrate deploy
   ```
6. **Recreación de los contenedores** con la nueva imagen:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```
   El flag `-d` lo deja en segundo plano; `--remove-orphans` opcionalmente limpia contenedores obsoletos.
7. **Verificación del healthcheck** (ver siguiente sección).
8. **Limpieza** de imágenes Docker antiguas para no consumir disco:
   ```bash
   docker image prune -f
   ```

El tiempo total de un despliegue típico es de **2-3 minutos**, durante los cuales puede haber una breve interrupción del servicio (no más de unos segundos durante la recreación del contenedor `client`).

### 8.6.2. Backups

Antes de cada despliegue que incluya una migración de base de datos, se hace un **dump previo**:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec db \
  pg_dump -U pataplan pataplan > /backups/pataplan-$(date +%Y%m%d-%H%M%S).sql
```

Adicionalmente, **una tarea cron diaria** en el host hace un dump completo de la base de datos y lo guarda en `/backups/`, manteniendo los últimos 30 días.

## 8.7. Monitorización

### 8.7.1. Healthcheck del backend

El servidor expone un endpoint público de salud en la raíz:

```
GET /
→ 200 OK
  { "status": "ok", "message": "PataPlan API" }
```

Implementado en `server/src/app.js`. Se usa para verificar tras el despliegue que el contenedor está respondiendo correctamente:

```bash
curl -fsS https://pataplan.yiisus.com/api/ || echo "API DOWN"
```

### 8.7.2. Healthcheck de la base de datos

El servicio `db` de Docker Compose tiene su propio healthcheck definido en el `docker-compose.yml` base:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-pataplan}"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Esto bloquea el arranque del contenedor `server` hasta que PostgreSQL está aceptando conexiones (`depends_on: condition: service_healthy`), evitando reintentos manuales tras un reinicio completo.

### 8.7.3. Logs

Los logs de cada servicio son accesibles vía Docker:

```bash
# Logs del backend en tiempo real
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f server

# Últimas 200 líneas del nginx del cliente
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail 200 client

# Errores recientes de la base de datos
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs db | grep -i error
```

El backend usa **`morgan`** como logger HTTP en modo `dev`, lo que produce una línea por petición con método, ruta, código de estado y tiempo de respuesta. Esto es suficiente para diagnóstico básico durante el MVP.

### 8.7.4. Uptime externo

Para vigilancia 24/7 desde fuera del propio VPS, se usa un servicio gratuito de monitorización externa (**UptimeRobot**) configurado con dos checks cada cinco minutos:

- `GET https://pataplan.yiisus.com/` — verifica que el SPA responde con 200.
- `GET https://pataplan.yiisus.com/api/` — verifica que el endpoint de salud del backend devuelve `{ "status": "ok" }`.

Si cualquiera de los dos falla dos comprobaciones seguidas, UptimeRobot envía una notificación por correo al autor.
