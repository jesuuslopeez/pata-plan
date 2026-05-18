# 2. Descripción del proyecto

## 2.1. Funcionalidades

PataPlan se estructura en doce bloques funcionales que cubren todo el ciclo de cuidado sanitario de un animal: desde su alta hasta su adopción, traslado o seguimiento de por vida.

### 2.1.1. Gestión de animales

Cada animal dispone de una **ficha completa** con nombre, especie (perro, gato u otro), raza, sexo, fecha de nacimiento, microchip, foto, notas libres e historial de peso.

Los animales se organizan en **grupos lógicos** definidos por el usuario — típicamente "Casa" y "Refugio", pero el modelo es libre — lo que permite filtrar, agrupar estadísticas y delegar permisos por grupo. Un mismo usuario puede pertenecer a sus propios grupos y, a la vez, colaborar en grupos de otra persona.

### 2.1.2. Calendario sanitario inteligente

El calendario registra cuatro tipos de eventos: **vacunas, desparasitaciones internas, desparasitaciones externas, revisiones y tratamientos**. Cada evento guarda fecha, tipo, producto utilizado, veterinario, notas y, opcionalmente, una **frecuencia** en días.

Cuando un evento periódico se marca como realizado, el sistema **calcula automáticamente la siguiente dosis** sumando la frecuencia a la fecha de finalización, sin intervención manual. La vista del calendario presenta los eventos con colores semánticos: vencido (rojo), pendiente (ámbar), realizado (verde).

### 2.1.3. Motor de protocolos sanitarios

Los protocolos permiten formalizar **secuencias de actuaciones sanitarias** reutilizables. Por ejemplo, el protocolo "Gato recién ingresado en refugio" puede definir: desparasitación día 0, primera vacuna día 15, segunda dosis día 45 y revisión final día 60.

Asignar un protocolo a un animal **genera automáticamente todos los eventos** del calendario con sus fechas calculadas a partir de la fecha de inicio. Si una actuación se retrasa (por ejemplo, la primera vacuna se aplaza una semana), el motor **recalcula en cascada** todas las fechas dependientes que vienen después, evitando que el cuidador tenga que ajustarlas manualmente.

### 2.1.4. Sistema de alertas con scoring de prioridad

El sistema evalúa **todos los eventos pendientes y vencidos** de todos los animales y les asigna un **score de urgencia** basado en tres factores: días de retraso, tipo de evento (un tratamiento activo pesa más que una desparasitación rutinaria) y estado del animal (un cachorro o un animal recién ingresado pesa más que un adulto estable).

El resultado es una lista ordenada por urgencia real, no por fecha, que responde a la pregunta clave del cuidador: **"¿qué tengo que atender primero?"**.

### 2.1.5. Historial clínico independiente

Cada visita al veterinario se registra con fecha, motivo, diagnóstico, tratamiento, veterinario y observaciones. La diferencia frente a las apps vinculadas a clínicas concretas es que **el historial pertenece al cuidador**: no depende de qué veterinario atienda al animal en cada momento, ni se pierde si se cambia de centro.

### 2.1.6. Gestión documental

Cada animal puede tener **documentos e imágenes adjuntos**: cartillas de vacunación escaneadas, resultados de analíticas, informes veterinarios, recetas. Los archivos se suben al servidor, se organizan por animal y fecha, y se pueden previsualizar y descargar desde la propia ficha del animal.

### 2.1.7. Control de gastos veterinarios

Cada gasto se asocia a un animal y una categoría (vacuna, desparasitación, cirugía, medicación, alimentación, otros) y queda fechado. El sistema agrega los gastos en un **dashboard económico** con tres vistas: total gastado, gasto del mes en curso (con comparativa frente al mes anterior) y media por animal. Los gráficos muestran la **evolución mensual** y el **reparto por categoría**.

### 2.1.8. Generación de informes PDF

PataPlan genera un **informe sanitario completo por animal** en formato PDF, agregando datos de su ficha, historial de vacunas, desparasitaciones, tratamientos, visitas veterinarias, evolución de peso y resumen de gastos. Es un documento útil para adopciones, traslados a otra protectora o consultas veterinarias en centros nuevos.

### 2.1.9. Detección de anomalías de peso

El sistema analiza el historial de peso de cada animal y calcula su **media y desviación típica**. Cuando un nuevo registro se aleja significativamente del patrón habitual de ese animal concreto (por ejemplo, una bajada brusca del 10% en un mes), se marca como **anomalía** y se genera automáticamente un evento de revisión en el calendario para que el cuidador lo evalúe.

La detección es **estadística, no basada en inteligencia artificial**: usa una técnica clásica y explicable que permite al usuario entender por qué se ha disparado la alerta.

### 2.1.10. Dashboard centrado en "qué necesita atención"

La pantalla de inicio no es un resumen estático de números, sino una vista accionable construida alrededor de la pregunta **"¿qué tengo que hacer hoy?"**. Incluye:

- **Animales que necesitan atención**, ordenados por urgencia, con sus eventos pendientes o vencidos.
- **Próximos días** con los eventos programados de los siguientes siete días.
- **Resumen económico** del mes en curso.
- **Reparto por grupo** con cuántos animales hay en cada uno.

### 2.1.11. Sistema de roles

PataPlan distingue dos roles a nivel global:

- **Admin**: crea grupos, gestiona colaboradores, configura protocolos y tiene acceso completo a sus propios datos.
- **Colaborador**: opera dentro de los grupos a los que ha sido invitado, con un rol específico por grupo.

A nivel de cada grupo, los colaboradores pueden ser **lectores** (acceso de solo lectura) o **editores** (pueden registrar eventos, visitas, pesos y gastos, pero no modificar la configuración del grupo).

### 2.1.12. Vista compartida y colaboración

Un grupo puede ser compartido con otras cuentas mediante un **código de invitación** que el administrador genera y comparte. Cualquier persona registrada en PataPlan puede unirse a un grupo introduciendo su código y, a partir de ese momento, ve los animales de ese grupo en su panel, con los permisos que le hayan asignado.

Cuando un usuario ve un animal que no es suyo, la interfaz lo indica claramente (etiqueta "de [nombre del propietario]") para que entienda en qué contexto está trabajando. El sistema permite **salir del grupo** en cualquier momento desde los ajustes del usuario.

## 2.2. UI/UX

### 2.2.1. Diseño centrado en la acción

El criterio principal del diseño es responder a una pregunta concreta del usuario: **"¿qué necesito hacer hoy?"**. Por eso el dashboard no abre con un resumen frío de cifras, sino con la lista priorizada de animales que necesitan atención. El resto de páginas siguen la misma lógica: presentan primero la información accionable y dejan los datos contextuales después.

### 2.2.2. Paleta de color

La paleta combina dos familias:

- **Teal** (verde azulado) como color primario. Transmite calma, salud y profesionalidad, y se asocia bien con el ámbito veterinario y de cuidado.
- **Amber** (ámbar) como color de acento. Se reserva para llamadas de atención no críticas: eventos pendientes, avisos.

A esto se suman los colores semánticos clásicos: **rojo** (vencido, eliminar), **verde** (al día, completado), **gris** (texto secundario, fondos). 

### 2.2.3. Tipografía

La tipografía elegida es **Montserrat**, una sans-serif geométrica con buena legibilidad en pantalla y un aire moderno y limpio. Se usa con tres pesos principales: regular para texto corrido, semibold para etiquetas y titulares pequeños, y bold para títulos principales.

### 2.2.4. Layout responsive

La aplicación está diseñada para funcionar bien tanto en **escritorio** como en **móvil**:

- En escritorio: **sidebar de navegación** lateral fija con las secciones principales (Panel, Animales, Calendario, Protocolos, Gastos, Ajustes) y el contenido en una zona central amplia.
- En móvil: la navegación se reorganiza y los componentes (tarjetas, formularios, tablas) se apilan en una sola columna.

Esta dualidad es deliberada: el cuidador puede registrar un peso o consultar el siguiente evento desde el móvil cuando está con el animal, y sentarse delante del ordenador para generar un informe PDF, configurar un protocolo o revisar el gasto del trimestre.

## 2.3. Usuarios objetivo

PataPlan está pensada para tres perfiles principales, cada uno con necesidades algo distintas:

### 2.3.1. Propietarios de múltiples mascotas

Familias con tres, cinco, diez animales en casa. Llevan razonablemente bien una mascota con cartilla y memoria, pero a partir de cierto número pierden el control de fechas, dosis y gastos. Necesitan **centralizar** la información y **no olvidarse** de lo importante.

### 2.3.2. Responsables de refugios y protectoras

Personas u organizaciones que gestionan decenas de animales en flujo constante (ingresos, adopciones, traslados). Necesitan **protocolos estandarizados** para los nuevos ingresos, **informes exportables** para entregar al adoptante y un control claro del **gasto sanitario** para justificar donaciones y presupuestos.

### 2.3.3. Familias que comparten el cuidado de animales

Hogares en los que más de una persona se ocupa de los animales (padres e hijos, parejas, compañeros de piso). Necesitan **acceso compartido** con permisos claros: el responsable principal define la configuración y los protocolos, y los demás registran lo que van haciendo día a día sin tocar lo que no les corresponde.

## 2.4. Casos de uso principales

A continuación se describen cinco casos de uso representativos del funcionamiento típico de la aplicación.

### 2.4.1. Registrar un nuevo animal en el refugio

1. El administrador del grupo "Refugio" entra en la sección Animales y pulsa **Añadir animal**.
2. Rellena la ficha: nombre, especie, raza, sexo aproximado, fecha estimada de nacimiento, microchip si lo tiene, foto.
3. Lo asigna al grupo "Refugio".
4. El animal queda disponible en el listado y en el panel general.

### 2.4.2. Aplicar el protocolo de acogida

1. Desde la ficha del animal recién registrado, el administrador pulsa **Asignar protocolo**.
2. Selecciona el protocolo "Gato nuevo en refugio" y la fecha de inicio.
3. El sistema **genera automáticamente** los eventos: desparasitación día 0, primera vacuna día 15, segunda dosis día 45, revisión día 60.
4. Todos quedan visibles en el calendario del animal y en el calendario general.

### 2.4.3. Consultar qué animales necesitan atención

1. El cuidador entra en PataPlan por la mañana.
2. El panel principal muestra, ordenados por urgencia real, los animales con eventos vencidos o próximos a vencer.
3. Pulsa sobre cualquiera para ir a su ficha y registrar la actuación realizada.
4. Al marcar un evento periódico como completado, el sistema calcula la siguiente dosis sin que tenga que hacer nada más.

### 2.4.4. Generar un informe sanitario para una adopción

1. Desde la ficha del animal que va a ser adoptado, el cuidador pulsa **Descargar informe**.
2. El sistema genera un PDF que agrega su ficha, historial de vacunas, desparasitaciones, tratamientos, visitas veterinarias, evolución de peso y resumen de gastos.
3. El PDF lleva el branding de PataPlan, fecha de generación y se descarga al instante con un nombre tipo `informe-luna-2026-05-15.pdf`.
4. Se entrega al adoptante junto con la cartilla física.

### 2.4.5. Registrar una visita veterinaria con su gasto asociado

1. Tras volver del veterinario, el cuidador entra en la ficha del animal.
2. En la pestaña **Visitas** pulsa **Añadir visita** y completa: fecha, motivo, diagnóstico, tratamiento, veterinario y observaciones.
3. A continuación, en la página **Gastos** pulsa **Añadir gasto**, selecciona grupo y animal, introduce el importe, la categoría (por ejemplo "Cirugía") y la fecha.
4. El gasto aparece de inmediato en el dashboard económico, en el resumen por categoría y en el total del mes.
