# 6. Desarrollo del proyecto

## 6.1. Secuencia de desarrollo

El proyecto se ha planificado siguiendo una versión simplificada de **SCRUM** adaptada a un trabajo individual: sprints de **dos semanas** con un objetivo concreto, una revisión al final de cada sprint y un product backlog único alojado en GitHub Projects.

La aplicación se ha desarrollado a lo largo de **cinco sprints** (un sprint 0 de planificación más cuatro sprints de implementación), cada uno con su propio conjunto de tareas, ramas de Git y entregables.

### 6.1.1. Sprint 0 — Planificación y prototipado

**Objetivo:** definir el alcance, modelar el dominio y preparar la infraestructura técnica.

- Análisis de competidores y definición de los diferenciadores de PataPlan (ver `docs/01-introduccion.md`).
- Recogida de requisitos funcionales y desglose en historias de usuario.
- Diseño del **modelo entidad-relación**: 12 entidades y sus relaciones (ver `docs/05-diseno.md`).
- Prototipado de las pantallas principales en **Figma**: login, dashboard, listado de animales, ficha de animal, calendario, gastos.
- Definición de la **paleta de color** (Teal + Amber) y la guía de estilos (ver `docs/04-guia-estilos.md`).
- Configuración inicial del repositorio: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `.gitignore`, `CHANGELOG.md`, plantillas de issue y PR, Dependabot, GitHub Actions.
- Arranque del proyecto: scaffolding del cliente con Vite y del servidor con Express, `docker-compose.yml` con PostgreSQL.

### 6.1.2. Sprint 1 — Backend core y autenticación

**Objetivo:** levantar el modelo de datos, la autenticación y las operaciones CRUD básicas.

- Definición completa del **schema de Prisma** con sus 12 modelos.
- Implementación de **autenticación JWT**: registro, login, middleware de protección.
- Sistema de **roles** a nivel global (`ADMIN` / `COLLABORATOR`) y por grupo (`VIEWER` / `EDITOR`).
- Endpoints CRUD para **grupos** y **animales**, con verificación de acceso por grupo (`getAccessibleGroupIds`, `getEditableGroupIds`).
- Endpoints de **registros de peso** con su histórico.
- Seed inicial con usuario administrador y catálogo de `EventType` por defecto.
- Tests básicos de los servicios de autenticación y grupos.

### 6.1.3. Sprint 2 — Protocolos, alertas y frontend inicial

**Objetivo:** completar el motor sanitario en backend y arrancar el frontend.

- Implementación del **motor de protocolos**: definición de pasos, asignación a animal y generación automática de eventos.
- **Recálculo en cascada** de fechas cuando un evento de un protocolo se completa con retraso.
- **Sistema de alertas con scoring** que ordena los eventos pendientes/vencidos por urgencia real.
- Endpoints de **visitas veterinarias**, **historial clínico** y **gastos**.
- Frontend: estructura del enrutado, contexto de autenticación, layout con sidebar.
- Páginas de **Login**, **Registro**, **Dashboard**, **Listado de animales** y **Ficha de animal**.
- Diseño de los componentes base: `Button`, `Input`, `Card`, `Modal`, `Avatar`, siguiendo BEM y SASS.

### 6.1.4. Sprint 3 — Funcionalidades avanzadas

**Objetivo:** completar las funcionalidades que diferencian a PataPlan.

- **Detección de anomalías de peso** basada en media de los últimos 5 registros.
- **Generación de informes PDF** por animal con `pdfkit`.
- **Gestión documental**: subida y descarga de archivos adjuntos por animal.
- **Compartición de grupos** mediante código de invitación y unión por código.
- **Dashboard económico**: gasto total, gasto del mes, comparativa, evolución mensual y reparto por categoría.
- Página de **Calendario** con vista mensual y filtros por animal/grupo/tipo.
- Página de **Protocolos** con editor visual de pasos.
- Refinamiento de la UI: estados vacíos, mensajes de carga, validaciones inline.

### 6.1.5. Sprint 4 — Verificación, recuperación y despliegue

**Objetivo:** completar la capa de seguridad, pulir la UI y dejar la aplicación lista para producción.

- **Verificación de correo electrónico** en el registro, con envío real por SMTP de Gmail.
- **Recuperación de contraseña** por email (token temporal de 1 hora).
- Opción **"Mantener sesión iniciada"** en login (sessionStorage por defecto, localStorage 30 días).
- Persistencia de JWT tras F5.
- Pulido de la generación de PDF: cabecera con logo en badge teal, paginación, pies.
- Pulido del dashboard: foto de la mascota en las tarjetas de alerta, efecto cristal esmerilado en las tarjetas de animal.
- Documentación técnica y de usuario en `docs/`.
- Configuración de **Docker Compose** para producción y de **GitHub Actions** para CI.

## 6.2. Dificultades encontradas

### 6.2.1. Gestión de componentes en Figma con variantes e iconos

El sistema de componentes en Figma se reveló más complejo de lo previsto cuando hubo que combinar varias propiedades en una misma instancia: por ejemplo, un botón con **variantes** (primario/secundario/fantasma), **tamaños** (small/medium/large), **estados** (default/hover/disabled/loading) y un **slot de icono** opcional a izquierda o derecha.

El problema concreto era que los **iconos no se comportaban como instancias intercambiables**: al cambiar de variante de botón, la propiedad de icono se reseteaba.

### 6.2.2. Diseño del dashboard que no pareciera generado por IA

La primera versión del dashboard era una rejilla de tarjetas con métricas (`Animales totales`, `Eventos pendientes`, `Gasto del mes`, `Alertas activas`), gráficos de barras y un calendario reducido.

El pivote fue replantear la pregunta de partida: en lugar de **"¿cuántas cosas tengo?"**, el dashboard debía responder a **"¿qué tengo que hacer ahora?"**. Esto llevó a:

- Eliminar las tarjetas KPI estáticas de la zona principal.
- Sustituirlas por una **lista priorizada de animales que necesitan atención**, calculada por el sistema de scoring, con la foto del animal, el evento concreto y los días de retraso.
- Mover las cifras agregadas a un panel lateral, más pequeño, como contexto.
- Añadir una sección **"Próximos días"** con los eventos previstos de los siguientes siete días.

El cambio no solo mejoró la utilidad de la pantalla, sino que **diferenciaba** la aplicación: ninguno de los competidores analizados centraba su dashboard en la acción concreta del día.

### 6.2.3. Recálculo en cascada de fechas de protocolo

Cuando un protocolo define una secuencia de eventos dependientes (`desparasitación día 0, vacuna día 15, segunda dosis día 45, revisión día 60`) y uno de los eventos se completa con retraso, **todos los eventos posteriores deben moverse en consecuencia**.

El reto técnico tuvo tres partes:

1. **Detectar cuánto retraso hubo**: calcular la diferencia en días entre la fecha en que se completó el evento y la fecha en la que estaba programado.
2. **Decidir qué eventos mover**: solo los del mismo protocolo, posteriores en el tiempo y con estado `PENDING`.
3. **Aplicar el cambio de forma atómica**: si fallaba a mitad, no quedar con la mitad del protocolo desplazada.

La solución usa una **transacción de Prisma** que itera los eventos pendientes posteriores ordenados por fecha y suma el retraso a cada uno. Además, al recalcular se reevalúa el estado: si la nueva fecha queda en el pasado, el evento pasa a `OVERDUE`; si no, sigue `PENDING`.

Un detalle fino fue **comparar fechas sin la hora**: si un evento estaba programado para hoy a las 00:00 y se evaluaba a las 10:00, la comparación directa lo marcaba como vencido. Se introdujo un helper `startOfToday()` que normaliza las fechas a medianoche antes de comparar.

### 6.2.4. Sistema de scoring de alertas

El listado de eventos pendientes ordenado por fecha no respondía a la pregunta real del usuario: una **desparasitación rutinaria con un día de retraso en un gato adulto sano** no es lo mismo que un **tratamiento activo con tres días de retraso en un cachorro recién ingresado**, pero ordenado por fecha el primero sale antes.

Se diseñó un sistema de scoring que combina tres factores:

- **Factor de retraso**: cuanto más días vencido, mayor el peso (multiplicador ×3 por día).
- **Factor de gravedad por tipo de evento**: los tratamientos pesan más que las desparasitaciones rutinarias; valores configurables en `EventType.severityScore`.
- **Multiplicador por estado del animal**: cachorros (< 6 meses) y animales recién ingresados (< 30 días) tienen un multiplicador mayor.

El reto fue calibrar los pesos para que las alertas "se sintieran correctas" en escenarios reales. Se ajustaron iterativamente probando con casos del refugio: un cachorro vencido en su primera vacuna debía aparecer por encima de un adulto vencido en su revisión anual.

## 6.3. Decisiones técnicas

### 6.3.1. React frente a otras opciones

Se eligió **React** por cuatro razones:

- **Ecosistema**: gran disponibilidad de librerías para gráficos (`recharts`), drag and drop (`@dnd-kit`), iconos (`lucide-react`) y enrutado (`react-router-dom`), todas con buen soporte y mantenimiento activo.
- **Demanda laboral**: es la librería frontend con mayor presencia en ofertas de empleo en España, lo que aporta valor formativo más allá del proyecto académico.
- **Hooks y composición funcional**: el modelo mental de hooks encaja con la lógica de PataPlan (contextos para autenticación y notificaciones, hooks personalizados para llamadas API).
- **Conocimiento**: Es una de las bibliotecas JavaScript que hemos trabajado en clase, exactamente la primera que aprendimos, y como en las prácticas laborales trabajo con Angular decidí usar React por no estar todo el tiempo trabajando con la misma *library*.

### 6.3.2. PostgreSQL frente a MongoDB

El modelo de datos de PataPlan es **fuertemente relacional**: un evento sanitario pertenece a un animal, que pertenece a un grupo; un evento puede venir de la asignación de un protocolo; las visitas tienen documentos; los gastos relacionan animales con categorías. Las consultas habituales cruzan varias tablas.

**PostgreSQL** se eligió por:

- **Integridad referencial** con claves foráneas y restricciones reales.
- **Transacciones ACID** necesarias para operaciones como el recálculo en cascada o la asignación de protocolos.
- **JSON nativo** disponible cuando se necesita flexibilidad puntual (no se necesita una base entera sin esquema).
- **Ecosistema y herramientas** sólidas: `psql`, `pg_dump`, herramientas gráficas, hosting en cualquier proveedor cloud.
- **Conocimiento**: También es conocida para mi, ya que la trabajamos en el primer año del ciclo.

MongoDB habría obligado a duplicar datos o a usar referencias manuales, perdiendo la integridad referencial — un coste alto para una aplicación que necesita ser exacta con los datos sanitarios.

### 6.3.3. Prisma como ORM

**Prisma** se eligió frente a alternativas como Sequelize, TypeORM o consultas SQL directas por:

- **Type safety**: el cliente generado expone tipos exactos para cada modelo, evitando errores en tiempo de compilación.
- **Migraciones limpias**: `prisma migrate` genera SQL legible y reversible.
- **Schema declarativo**: el `schema.prisma` es la fuente única de verdad del modelo de datos.
- **API ergonómica**: las consultas relacionales con `include` son legibles sin renunciar a la potencia de SQL.
- **Studio**: una interfaz gráfica gratuita para inspeccionar la base de datos durante el desarrollo.

### 6.3.4. SASS frente a Tailwind

El proyecto adopta **SASS con metodología BEM** en lugar de Tailwind. La decisión vino dada en parte por el enunciado del proyecto, que exige uso de preprocesadores CSS, pero coincide con ventajas reales:

- **Separación de responsabilidades**: la lógica de estilo no se mezcla con el JSX, lo que mantiene los componentes legibles.
- **Variables y mixins**: los tokens de diseño (colores, espaciados, breakpoints) se centralizan en `_variables.scss` y `_mixins.scss`.
- **BEM**: nombres como `animal-card__photo--rounded` son explícitos y fáciles de buscar.


### 6.3.5. Unidades en `rem` frente a `px`

Todos los tamaños del frontend (tipografía, espaciados, paddings, radios) usan **`rem`** y no `px`. La razón es la **accesibilidad**: si un usuario aumenta el tamaño de fuente desde la configuración de su navegador, toda la interfaz escala proporcionalmente. Con `px`, la página queda fija e ignora esa preferencia, lo que perjudica especialmente a personas con baja visión.

El criterio: `1rem = 16px` (el valor por defecto del navegador). Toda la escala tipográfica y de espaciado se expresa como múltiplos o fracciones de `rem`.

### 6.3.6. BEM como convención de nombrado CSS

Con SASS sin Tailwind, hace falta una convención que evite colisiones de clases. **BEM** (Block, Element, Modifier) ofrece:

- **Predictibilidad**: `block__element--modifier` es siempre el mismo patrón.
- **Aislamiento**: las clases son largas y específicas, lo que evita choques entre componentes.
- **Búsqueda fácil**: una clase BEM identifica de forma única su componente origen.

Ejemplo: `animal-card`, `animal-card__photo`, `animal-card__photo--rounded`.

### 6.3.7. Docker para reproducibilidad

PataPlan se despliega con **Docker Compose** orquestando tres servicios: `client`, `server` y `postgres`. Los motivos:

- **Reproducibilidad**: cualquier desarrollador clona el repositorio, ejecuta `docker compose up` y tiene el entorno completo sin instalar Node, PostgreSQL ni configurar variables a mano.
- **Paridad dev/prod**: el mismo `Dockerfile` se usa en desarrollo (con bind mounts) y en producción (con build estático), reduciendo sorpresas al desplegar.
- **Aislamiento**: la base de datos vive en un volumen Docker y no contamina el sistema del desarrollador.
- **Portabilidad**: el despliegue funciona igual en cualquier servidor con Docker, sin depender de la versión exacta del SO.

## 6.4. Control de versiones

### 6.4.1. Git y GitHub

Todo el código del proyecto vive en un único repositorio en GitHub: <https://github.com/jesuuslopeez/pata-plan>. Se usa Git con flujo de trabajo basado en ramas:

- **`main`**: rama protegida con código estable de producción.
- **`develop`**: rama de integración donde se acumula el trabajo de los sprints antes de pasar a `main`.
- **`sprint/N`**: una rama por sprint para agrupar el trabajo del periodo.
- **`feature/sprint-N/<descripcion>`**: ramas de feature concretas que se mergean a la rama del sprint.
- **`fix/<descripcion>`**: para correcciones de bugs urgentes.

Los **pull requests** son obligatorios para integrar a `develop` y a `main`; cada PR pasa por la verificación de GitHub Actions (lint + tests) antes de poder mergearse.

### 6.4.2. Conventional Commits

Todos los commits siguen la especificación **Conventional Commits** con un asunto en una sola línea. Los tipos en uso son `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` y `ci`. El alcance es opcional pero recomendado.

Ejemplos reales del histórico:

```
feat(auth): add JWT-based login endpoint
fix(events): treat events scheduled today as pending, not overdue
refactor(dashboard): center layout around priority alerts
docs: add installation guide
ci: add lint workflow on pull request
```

Esta convención permite generar el `CHANGELOG.md` de forma semi-automática agrupando commits por tipo, y facilita la revisión del histórico.

### 6.4.3. GitHub Projects

La gestión del backlog y el progreso de cada sprint se hace con **GitHub Projects** (tablero kanban con columnas `Backlog`, `Sprint`, `In progress`, `Review`, `Done`). Cada tarea es un **issue** vinculado al tablero, con etiquetas (`type:feature`, `type:bug`, `priority:high`, `area:frontend`, `area:backend`) y, cuando se completa, un PR que la cierra automáticamente con `Closes #N`.

El tablero público está disponible en: <https://github.com/users/jesuuslopeez/projects/3>

### 6.4.4. Dependabot

El repositorio tiene activado **Dependabot** (`.github/dependabot.yml`) para crear pull requests automáticos cuando hay actualizaciones de dependencias o de versiones de GitHub Actions. Esto mantiene el árbol de dependencias al día sin trabajo manual y avisa de vulnerabilidades de seguridad publicadas en el registro de npm.

## 6.5. Fragmentos de código relevantes

A continuación se desgranan cuatro algoritmos clave del backend, con su código real y la explicación de cada parte.

### 6.5.1. Algoritmo de scoring de alertas

Ubicación: `server/src/services/alert.service.js`.

El score final de un evento se calcula como `(factorRetraso + factorGravedad) × multiplicadorAnimal`.

```javascript
const DEFAULT_SEVERITY = {
  TREATMENT: 10,
  VACCINE: 7,
  DEWORMING_INTERNAL: 5,
  DEWORMING_EXTERNAL: 5,
  CHECKUP: 3,
};

const calcDaysOverdueFactor = (scheduledDate, now) => {
  const daysUntil = diffDays(new Date(scheduledDate), now);

  if (daysUntil < 0) {
    return Math.abs(daysUntil) * 3;
  }
  if (daysUntil === 0) {
    return 3;
  }
  if (daysUntil <= 3) {
    return 2;
  }
  if (daysUntil <= 7) {
    return 1;
  }
  return 0;
};
```

El **factor de retraso** premia con `3 × días` los eventos ya vencidos. Los eventos del día actual reciben un `3`, los próximos tres días un `2`, y los siguientes una semana un `1`. Más allá de una semana se considera ruido y se ignora (`0`).

```javascript
const calcSeverityFactor = (eventType) => {
  if (eventType.severityScore) {
    return eventType.severityScore;
  }
  return DEFAULT_SEVERITY[eventType.category] || 5;
};
```

El **factor de gravedad** usa el valor configurable en `EventType.severityScore` si existe; si no, cae al valor por defecto según categoría: tratamientos (10) pesan más que vacunas (7), que pesan más que desparasitaciones (5), que pesan más que revisiones (3).

```javascript
const calcAnimalMultiplier = (animal, now) => {
  let multiplier = 1.0;

  if (animal.dateOfBirth) {
    const ageMs = now.getTime() - new Date(animal.dateOfBirth).getTime();
    const ageMonths = ageMs / (30.44 * 86400000);
    if (ageMonths < 6) {
      multiplier = Math.max(multiplier, 1.5);
    }
  }

  const createdMs = now.getTime() - new Date(animal.createdAt).getTime();
  const createdDays = createdMs / 86400000;
  if (createdDays < 30) {
    multiplier = Math.max(multiplier, 1.3);
  }

  return multiplier;
};
```

El **multiplicador por animal** sube el score un 50% si el animal tiene menos de seis meses (cachorro) y un 30% si lleva menos de 30 días en el sistema (recién ingresado). Se aplica el máximo de los dos en lugar de multiplicarlos, para no inflar demasiado el score.

```javascript
const score = parseFloat(
  ((daysOverdueFactor + severityFactor) * animalMultiplier).toFixed(1)
);
```

Finalmente, el score se combina y se redondea a un decimal. Los eventos se ordenan de mayor a menor score y se etiquetan como `critical` (≥30), `high` (≥15), `medium` (≥5) o `low`.

### 6.5.2. Recálculo en cascada de fechas de protocolo

Ubicación: `server/src/services/recalculation.service.js`.

Se invoca cuando se completa un evento que pertenece a una asignación de protocolo, para mover los eventos posteriores si hubo retraso.

```javascript
const recalculateCascade = async (completedEvent, completedDate) => {
  if (!completedEvent.protocolAssignmentId) {
    return null;
  }

  const delayDays = diffDays(completedDate, new Date(completedEvent.scheduledDate));
  if (delayDays <= 0) {
    return null;
  }
```

Primero descarta los casos triviales: si el evento no viene de un protocolo o no hubo retraso (se completó a tiempo o antes), no hay nada que recalcular.

```javascript
  const assignment = await prisma.protocolAssignment.findUnique({
    where: { id: completedEvent.protocolAssignmentId },
    select: { status: true },
  });
  if (!assignment || assignment.status === 'CANCELLED') {
    return null;
  }
```

Si la asignación está cancelada, tampoco se tocan eventos: el protocolo se considera abandonado.

```javascript
  const pendingEvents = await prisma.healthEvent.findMany({
    where: {
      protocolAssignmentId: completedEvent.protocolAssignmentId,
      status: 'PENDING',
      scheduledDate: { gt: completedEvent.scheduledDate },
    },
    orderBy: { scheduledDate: 'asc' },
  });
```

Se cargan únicamente los eventos del mismo protocolo, posteriores en el tiempo y aún pendientes. Los ya completados o vencidos no se tocan: están en el histórico real.

```javascript
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    for (const event of pendingEvents) {
      const newDate = addDays(event.scheduledDate, delayDays);
      const compareDate = new Date(newDate);
      compareDate.setHours(0, 0, 0, 0);
      const newStatus = compareDate < startOfToday ? 'OVERDUE' : 'PENDING';

      await tx.healthEvent.update({
        where: { id: event.id },
        data: {
          scheduledDate: newDate,
          status: newStatus,
        },
      });
    }
  });

  return { delayDays, eventsUpdated: pendingEvents.length };
};
```

La actualización se hace dentro de una **transacción**: o todos los eventos se mueven o ninguno. Para cada uno se suma el retraso y se reevalúa el estado comparando con el inicio del día actual (sin horas), de forma que un evento que cae justo en el día de hoy se mantiene `PENDING` y no se marca como vencido.

### 6.5.3. Detección de anomalías de peso

Ubicación: `server/src/services/weight.service.js`.

Cuando se registra un nuevo peso, se calcula la **media de los últimos cinco registros** y se comprueba si el nuevo valor se desvía más de un 10%.

```javascript
const ANOMALY_THRESHOLD = 0.1;
const ANOMALY_EVENT_TYPE_NAME = 'Anomalía de peso';

const computeAnomaly = (newValue, recentValues) => {
  if (recentValues.length < 3) {
    return { isAnomaly: false, mean: null, deviationPercent: null };
  }
  const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const deviationPercent = ((newValue - mean) / mean) * 100;
  const isAnomaly = Math.abs(deviationPercent) > ANOMALY_THRESHOLD * 100;
  return { isAnomaly, mean, deviationPercent };
};
```

Por debajo de dos registros previos no se evalúa: aún no hay suficiente historial para considerar nada anormal. A partir de dos, se calcula la media y la desviación porcentual del nuevo valor respecto a esa media. Si supera el 10% en valor absoluto (subida o bajada), se marca como anomalía.

```javascript
const recentRecords = await prisma.weightRecord.findMany({
  where: { animalId },
  orderBy: { recordedAt: 'desc' },
  take: 5,
  select: { valueKg: true },
});
const recentValues = recentRecords.map((r) => parseFloat(r.valueKg));

const { isAnomaly, mean, deviationPercent } = computeAnomaly(value, recentValues);
```

Se usan los **cinco registros más recientes** como referencia. Cinco es un compromiso entre capturar la variabilidad reciente del animal (un perro joven gana peso mes a mes) y disponer de suficientes datos para una media estable.

```javascript
const weight = await prisma.$transaction(async (tx) => {
  const created = await tx.weightRecord.create({
    data: {
      animalId,
      valueKg: value,
      recordedAt: date,
      isAnomaly,
    },
  });

  if (isAnomaly) {
    const eventType = await findOrCreateAnomalyEventType(tx);
    await tx.healthEvent.create({
      data: {
        animalId,
        eventTypeId: eventType.id,
        scheduledDate: new Date(),
        status: 'PENDING',
        notes: anomalyMessage,
      },
    });
  }

  return created;
});
```

Si se detecta anomalía, dentro de la misma transacción se crea automáticamente un **evento de revisión pendiente** asociado al animal, con la categoría `CHECKUP` y `severityScore` 8 (alto). Así el cuidador ve el aviso en el dashboard sin tener que monitorizar manualmente la gráfica de peso.

La elección consciente fue usar **estadística clásica** (media + umbral porcentual) en lugar de un modelo de machine learning: el cálculo es explicable, determinista y suficientemente preciso para el caso de uso real. El mensaje generado (`Peso registrado: 4.20 kg. Media histórica: 5.10 kg. Desviación: -17.6%`) es comprensible sin formación matemática.

### 6.5.4. Generación dinámica de PDF

Ubicación: `server/src/services/pdfGenerator.service.js`.

Se usa **`pdfkit`** para componer el informe de forma imperativa. La estructura general es: cabecera con logo + datos del animal + tablas por sección + pie de página.

```javascript
const drawHeader = (doc, animalName, generatedAt) => {
  const badgeWidth = 110;
  const badgeHeight = 44;
  const badgeRadius = 8;

  doc
    .save()
    .fillColor(COLORS.primary800)
    .roundedRect(PAGE_MARGIN, PAGE_MARGIN - 6, badgeWidth, badgeHeight, badgeRadius)
    .fill()
    .restore();

  try {
    doc.image(LOGO_PATH, PAGE_MARGIN + 8, PAGE_MARGIN - 2, {
      fit: [badgeWidth - 16, badgeHeight - 12],
      align: 'center',
      valign: 'center',
    });
  } catch {
    // logo missing — fall back silently
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(COLORS.gray900)
    .text('Informe Sanitario', textX, PAGE_MARGIN, { width: textWidth });
```

La cabecera dibuja un **rectángulo redondeado con el color primario** y encima el logo de PataPlan. Es necesario porque el logotipo es blanco con transparencia (diseñado para fondos oscuros) y sin el badge no se vería sobre el blanco del papel. El `try/catch` permite que el PDF se genere igualmente aunque falte el archivo de logo en el despliegue.

```javascript
const drawTable = (doc, columns, rows) => {
  const headerHeight = 22;
  const rowHeight = 20;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);

  const drawHeaderRow = () => {
    // ... pinta fila de cabecera con fondo gris
  };

  ensureSpace(doc, headerHeight + rowHeight);
  drawHeaderRow();

  rows.forEach((row, idx) => {
    ensureSpace(doc, rowHeight);
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - FOOTER_RESERVED) {
      doc.addPage();
      drawHeaderRow();
    }
    // ... pinta cada celda con coloreado alterno de filas
  });
};
```

La función `drawTable` recibe definiciones de columnas (`{ label, width, align }`) y un array de filas, y se encarga de:

- Pintar la **cabecera** con fondo gris claro.
- Alternar el fondo de las filas para mejorar la legibilidad (filas pares con un blanco roto).
- Detectar **saltos de página** mediante `ensureSpace`: si la siguiente fila no cabe, añade una página y repite la cabecera arriba.
- Soportar **colores por celda** (verde para `COMPLETED`, rojo para `OVERDUE`) pasando objetos `{ text, color }` en lugar de strings planos.

```javascript
const drawFooters = (doc, generatedAt) => {
  const range = doc.bufferedPageRange();
  const generatedLabel = formatDateTime(generatedAt);
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.gray600)
      .text(
        `PataPlan — Generado el ${generatedLabel}      Página ${i + 1} de ${range.count}`,
        PAGE_MARGIN,
        doc.page.height - 30,
        { width: CONTENT_WIDTH, align: 'center' }
      );
  }
};
```

El pie de página se pinta **al final**, una vez se sabe cuántas páginas tiene el documento, gracias a `bufferPages: true` en la configuración inicial. Esto permite numerar correctamente las páginas (`Página 1 de 5`) sin necesidad de un segundo pase de cálculo.

```javascript
const generateReport = (data) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Informe sanitario — ${data.animal.name}`,
      Author: 'PataPlan',
    },
  });

  const generatedAt = new Date();

  drawHeader(doc, data.animal.name, generatedAt);

  sectionTitle(doc, 'Datos del animal');
  drawKeyValueTable(doc, buildAnimalRows(data.animal));
  sectionDivider(doc);

  renderVaccines(doc, data.healthEvents);
  renderDewormings(doc, data.healthEvents);
  renderTreatments(doc, data.healthEvents);
  renderVisits(doc, data.vetVisits);
  renderWeights(doc, data.weightRecords);
  renderExpenses(doc, data.expenses);

  drawFooters(doc, generatedAt);

  doc.end();
  return doc;
};
```

El orquestador `generateReport` compone el documento sección a sección. Cada `renderX` es **idempotente y opcional**: si no hay registros de esa sección, no pinta nada (no aparece ni el título). Así el informe se adapta al animal: un perro con tres años de historial completo puede ocupar diez páginas, mientras que un gato recién ingresado puede caber en una.

La función devuelve el **stream** del documento, no un buffer en memoria: el controlador HTTP lo conecta directamente al `response`, lo que permite descargas grandes sin saturar el servidor.
