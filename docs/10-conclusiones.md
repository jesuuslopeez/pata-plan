# 10. Conclusiones

Este capítulo recoge la evaluación crítica del proyecto una vez finalizado: en qué medida se han cumplido los objetivos planteados en la introducción, qué se ha entregado más allá de lo previsto, qué ha quedado fuera y qué se llevará a futuras iteraciones. Cierra con las lecciones aprendidas durante el desarrollo.

## 10.1. Evaluación crítica respecto a los objetivos iniciales

Los objetivos específicos definidos en `docs/01-introduccion.md` se revisan uno a uno contrastándolos con lo realmente entregado.

### 10.1.1. Gestión centralizada de múltiples animales

**Estado: cumplido.**

Cada animal dispone de una ficha completa (nombre, especie, raza, sexo, fecha de nacimiento, microchip, foto, notas y peso) y se organiza dentro de grupos arbitrarios definidos por el usuario. El modelo soporta el caso "hogar con varios animales" y el caso "refugio con decenas", y el cuidador puede pertenecer a sus propios grupos y, simultáneamente, colaborar en grupos de otra persona mediante código de invitación.

La verificación se hace con un seed de pruebas que reproduce un escenario real de 30+ animales repartidos entre dos grupos, y con tests de integración que validan el filtrado por grupo y la verificación de acceso por rol.

### 10.1.2. Calendario sanitario con alertas automáticas

**Estado: cumplido.**

El calendario registra vacunas, desparasitaciones internas y externas, revisiones y tratamientos, con frecuencia opcional. Al completar un evento periódico, el sistema calcula automáticamente la siguiente dosis sumando la frecuencia a la fecha de finalización efectiva. La página de calendario muestra los eventos del mes con colores semánticos (vencido / pendiente / completado) y permite filtrar por animal, grupo y tipo.

Durante la fase de pulido se detectó un bug en el cálculo del siguiente evento cuando el actual estaba programado en el futuro y se marcaba "del tirón": el sistema usaba la fecha actual en vez de la programada y los eventos se solapaban. El fix consistió en usar el máximo entre la fecha de hoy y la fecha programada como base para la siguiente cita, manteniendo la cadencia estable.

### 10.1.3. Motor de protocolos con encadenamiento temporal

**Estado: cumplido.**

Los protocolos definen secuencias de actuaciones sanitarias reutilizables (por ejemplo, "Gato recién ingresado": desparasitación día 0, primera vacuna día 15, segunda dosis día 45, revisión día 60). Asignar un protocolo a un animal genera automáticamente todos los eventos del calendario, y si una actuación se retrasa, el motor recalcula en cascada todas las fechas dependientes mediante una transacción de Prisma que garantiza atomicidad.

Esta funcionalidad es uno de los diferenciadores clave de PataPlan frente a la competencia: ninguna de las apps analizadas en el estudio comparativo (11Pets, PetVitality, Woofz) ofrece protocolos encadenados con recálculo automático.

### 10.1.4. Sistema de priorización inteligente de alertas

**Estado: cumplido.**

El dashboard evalúa todos los eventos pendientes y vencidos y les asigna un score de urgencia combinando tres factores: días de retraso, gravedad del tipo de evento (configurable en `EventType.severityScore`) y estado del animal (cachorros < 6 meses y recién ingresados < 30 días pesan más). La lista resultante responde a la pregunta operativa del cuidador — "¿qué tengo que atender primero?" — en lugar de ordenar por fecha plana.

La calibración de los pesos se hizo iterativamente con casos reales del refugio: el escenario de validación era que un cachorro con su primera vacuna vencida debía aparecer por encima de un adulto con una revisión anual vencida con más días de retraso.

### 10.1.5. Generación de informes PDF

**Estado: cumplido.**

Cada animal puede descargar un informe sanitario completo en PDF generado con `pdfkit`: incluye datos de la ficha, historial de vacunas y desparasitaciones, tratamientos activos, visitas veterinarias, evolución de peso y resumen de gastos. La maquetación incorpora cabecera con logo, paginación y pie con fecha de emisión.

Este es el documento que resuelve el caso de uso "entregar la mascota en adopción", "trasladar al animal a otra protectora" o "primera visita en un veterinario nuevo", sin depender de ninguna clínica concreta.

### 10.1.6. Detección de anomalías de peso

**Estado: cumplido con ajuste de alcance.**

La propuesta inicial mencionaba detección estadística con media + desviación típica del historial completo. La implementación final usa **media móvil de los últimos cinco registros**, que se comporta mejor con animales jóvenes que crecen (donde la desviación típica histórica sería engañosamente alta) y con animales adultos estables (donde basta una ventana corta para detectar cambios).

Cuando un nuevo registro se aleja significativamente del patrón, el sistema lo marca como anomalía y genera automáticamente un evento de revisión en el calendario para que el cuidador lo evalúe.

### 10.1.7. Control de gastos veterinarios

**Estado: cumplido.**

Cada gasto se asocia a un animal y una categoría (vacuna, desparasitación, cirugía, medicación, alimentación, otros) y queda fechado. El dashboard económico muestra el gasto total, el del mes en curso con comparativa frente al mes anterior, la media por animal, la evolución mensual en gráfico de líneas y el reparto por categoría en gráfico de tarta.

### 10.1.8. Objetivos transversales

Los dos objetivos transversales también se han cumplido:

- **Independencia de cualquier clínica veterinaria**: los datos pertenecen al usuario, no a un centro. El historial no se pierde al cambiar de veterinario.
- **Doble caso de uso (hogar + refugio)**: el modelo de grupos atiende ambos sin forzar al hogar particular a pagar por funcionalidades pensadas para el refugio.

## 10.2. Grado de cumplimiento del alcance

### 10.2.1. Funcionalidades MVP

Todas las funcionalidades comprometidas en el MVP del briefing inicial se han entregado: gestión de animales, calendario sanitario, motor de protocolos, alertas con scoring, historial clínico, gestión documental, gastos, informes PDF, detección de anomalías de peso, dashboard general y sistema de roles.

### 10.2.2. Funcionalidades añadidas no previstas inicialmente

Durante el desarrollo se identificaron necesidades que no estaban en el alcance inicial y se incorporaron por su valor real para el caso de uso:

- **Compartición de grupos por código de invitación.** El planteamiento original solo contemplaba roles globales (`ADMIN` / `COLLABORATOR`). Al modelar el caso del refugio se vio que hacían falta también roles por grupo (`VIEWER` / `EDITOR`) y un mecanismo de unión por código, para que el administrador de un refugio pudiera dar acceso puntual a voluntarios sin promoverlos a colaboradores globales.
- **Verificación de email en el registro** mediante envío real por SMTP de Gmail.
- **Recuperación de contraseña por email** con token temporal de una hora.
- **Opción "Mantener sesión iniciada"** en login, con persistencia en `localStorage` (30 días) o `sessionStorage` (sesión actual) según preferencia del usuario.
- **Borrado de eventos sanitarios**, incluido en un parche posterior tras detectar el caso de uso real (eventos creados por error o duplicados).
- **Doble paleta tipográfica** (Montserrat + Fraunces) que aporta personalidad editorial a la interfaz sin renunciar a la legibilidad del sans-serif para datos.

### 10.2.3. Funcionalidades post-MVP no abordadas

El briefing original mencionaba cuatro funcionalidades "post-MVP opcionales". El balance final es:

- **Notificaciones por email programadas**: implementadas parcialmente. Existe un scheduler diario (`node-cron`) que evalúa los eventos pendientes/vencidos y la infraestructura SMTP está en producción, pero no se han activado los envíos masivos en producción para no saturar la cuenta de envío durante la evaluación.
- **Enlace público compartible** con resumen del animal (modo "carta de adopción"): no implementado.
- **Exportación CSV** de animales, eventos y gastos: no implementada.
- **Modo oscuro**: no implementado. La paleta se diseñó pensando en modo claro y adaptar todos los componentes habría supuesto rehacer la guía de estilos.

Las cuatro se trasladan al apartado de mejoras futuras (sección 10.3).

### 10.2.4. Cumplimiento de los rasgos diferenciales

Los cinco rasgos diferenciales que justifican la existencia de PataPlan (definidos en el apartado 1.5) se cumplen íntegramente:

1. **Sin penalización por número de animales** — el modelo no introduce ningún límite, ni de pago ni técnico, asociado a la cantidad de animales del usuario.
2. **Independiente de cualquier clínica** — todo el modelo de datos es propiedad del cuidador.
3. **Gestión colectiva** — la unidad central es el grupo, no el animal individual.
4. **Motor de protocolos con recálculo en cascada** — implementado y probado.
5. **Priorización inteligente y detección de anomalías** — ambas funcionalidades están operativas.

## 10.3. Mejoras futuras propuestas

A continuación se listan, ordenadas por valor estimado para el usuario, las mejoras que se considerarían para una eventual evolución del producto.

### 10.3.1. Notificaciones proactivas reales

Activar los envíos diarios de email con los eventos pendientes y vencidos del día, y explorar notificaciones push web (Web Push API + Service Worker) como alternativa más inmediata al email.

La infraestructura ya está montada (cron + SMTP); falta calibrar la frecuencia, definir si el resumen es diario o solo cuando hay eventos urgentes, y añadir un panel de preferencias por usuario para personalizar la notificación.

### 10.3.2. Modo oscuro

Definir una variante de la paleta para fondo oscuro, manteniendo los acentos teal y ámbar, y exponerla bajo un toggle en ajustes. El mayor esfuerzo no estaría en los colores sino en revisar contrastes y sombras en componentes con elevación (cards, modales) para que no pierdan jerarquía visual.

### 10.3.3. Exportación de datos en CSV/Excel

Permitir al usuario descargar listados de animales, eventos sanitarios y gastos en CSV o XLSX. Es un complemento natural al informe PDF: el PDF es para entregar el dato, el CSV es para analizarlo en otra herramienta.

### 10.3.4. Enlace público compartible

Generar un enlace de solo lectura (con token único) que muestre una "carta de presentación" del animal: foto, ficha básica, estado sanitario y fecha de las últimas vacunas. 

### 10.3.5. PWA instalable

La aplicación ya es responsive y funcional en móvil, pero no es instalable como PWA ni aprovecha capacidades nativas. Las mejoras concretas serían:

- Manifest + Service Worker para que se instale como icono en la pantalla de inicio.
- Funcionamiento offline básico (consultar fichas y eventos sin conexión).
- Captura de foto del animal directamente desde la cámara al crear o editar la ficha.


## 10.4. Lecciones aprendidas

Esta sección recoge las lecciones técnicas, metodológicas y de producto que se llevan del proyecto.

### 10.4.1. Pivotar el dashboard de "métricas" a "acción"

La primera versión del dashboard era una rejilla de KPIs ("animales totales", "eventos pendientes", "gasto del mes") con gráficos. Era ordenada y se parecía a cualquier dashboard de gestión, pero no servía: las preguntas reales del cuidador no son "¿cuántas cosas tengo?" sino **"¿qué tengo que hacer ahora?"**.

El rediseño puso en el centro la lista priorizada de animales con eventos urgentes (con foto, evento concreto y días de retraso) y movió los KPIs a un panel lateral. La lección es que el dashboard debe responder a la pregunta operativa del usuario, no documentar el estado del sistema.

### 10.4.2. Iterar los algoritmos con casos reales del dominio

El sistema de scoring de alertas no se podía resolver "en la pizarra": cada combinación de pesos produce un orden distinto y solo la prueba contra escenarios reales del refugio reveló qué calibración tenía sentido. Lo mismo pasó con la detección de anomalías de peso, donde la fórmula inicial (media + desviación histórica) daba falsos positivos en cachorros y se sustituyó por una ventana de cinco registros.

La lección: para algoritmos de scoring/detección, montar varios casos sintéticos representativos y usarlos como banco de pruebas antes de dar el algoritmo por bueno.

### 10.4.3. Atomicidad en operaciones complejas

El recálculo en cascada de un protocolo toca varios eventos en secuencia. Un fallo a mitad de la operación dejaría el calendario en un estado inconsistente — peor que no haber recalculado. La solución (envolver la operación en una transacción de Prisma) es estándar, pero la lección importante es **detectar a tiempo qué operaciones del dominio son "todo o nada"** y no fiarse de "casi nunca falla".

### 10.4.4. Empezar el despliegue cuanto antes

Una de las decisiones más rentables fue desplegar la aplicación en el VPS desde la primera semana del desarrollo, incluso con funcionalidad mínima. Eso permitió detectar y resolver problemas de configuración (nginx + reverse proxy, puerto 8085 ocupado por otro servicio, healthchecks, certificados HTTPS, CORS) cuando todavía había margen, en vez de descubrirlos la semana antes de la entrega.

La recomendación del enunciado de "despliegue temprano" no era retórica.

### 10.4.5. Documentación continua, no documentación final

Escribir la documentación a medida que avanzaba el desarrollo (en vez de dejarla para el final) tuvo dos beneficios concretos. Primero, las decisiones técnicas quedan registradas con su contexto fresco — al cabo de unas semanas ya no recuerdas por qué descartaste tal librería. Segundo, los apartados largos (instalación, despliegue, manual de usuario) son inviables si se posponen al sprint final: 4.000 líneas no se escriben en una semana.

### 10.4.6. SCRUM individual: lo que funciona y lo que no

La versión simplificada de SCRUM (sprints de dos semanas, backlog en GitHub Projects, revisión al final de cada sprint) aportó disciplina y un ritmo razonable. Lo que **no** funciona bien sin un equipo:

- La **estimación** en horas es muy imprecisa cuando solo te estimas a ti mismo.
- Las **dailys** pierden sentido y se sustituyen, en la práctica, por notas personales.
- La **demo** ante stakeholders se convierte en demo ante el profesor/tribunal; no hay retroalimentación intermedia.

La adaptación realista es asumir que SCRUM individual es, en esencia, **kanban con cadencia de sprint**: tablero con estados, foco en lo en curso, ciclos de revisión cada dos semanas para reorientar prioridades.


### 10.4.7. La interfaz como diferenciador

Una de las decisiones de producto más útiles fue invertir tiempo en una interfaz que **no pareciera generada por una plantilla**. El uso de tipografía editorial (Fraunces para títulos), una paleta natural con verde teal y ámbar (en vez de la combinación azul/gris habitual de las webs de gestión) y micro-detalles (el punto ámbar junto a los títulos, la huella decorativa al hacer hover) generan una sensación de marca propia que separa a PataPlan del prototipo genérico que se podría esperar de un proyecto académico.

La lección no es estética sino de producto: en un mercado saturado de apps de gestión, **el cuidado de la interfaz es un diferenciador tan válido como las funcionalidades**.

## 10.5. Reflexión final

PataPlan ha cumplido los siete objetivos funcionales y los dos transversales planteados en la introducción, ha entregado funcionalidades adicionales relevantes (compartición de grupos, verificación de email, recuperación de contraseña, borrado de eventos) y ha quedado desplegado en producción en una URL pública accesible.

El proyecto deja además una base sólida para crecer: un modelo de datos relacional de doce entidades con integridad referencial, una API REST documentada con Swagger y cubierta por tests, un frontend React con una guía de estilos propia y una infraestructura Docker reproducible con CI/CD automatizado.

Lo que se lleva el proyecto más allá del aprobado académico es la conciencia de que **el dominio importa**. PataPlan no es "una app de gestión más"; resuelve un problema concreto vivido en primera persona (gestionar la salud de más de treinta animales con folios manuscritos) y lo resuelve con decisiones de producto justificadas, no por imitación de la competencia. Esa es la conclusión personal más valiosa del trabajo.
