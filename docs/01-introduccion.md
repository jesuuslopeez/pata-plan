# 1. Introducción

## 1.1. Origen de la idea

PataPlan nace de una situación cotidiana muy concreta: convivir con muchos animales y darme cuenta de que las herramientas disponibles no me servían.

En casa tenemos un perro y siete gatos. Cada uno con su propio calendario de vacunas, sus desparasitaciones internas y externas, sus revisiones, su historial de peso y, en algunos casos, tratamientos activos que hay que recordar día a día. Además, colaboro con una protectora de animales, de manera que gestiono junto a mi familia un refugio con más de veinticinco gatos, donde cada nuevo ingreso arranca un protocolo sanitario completo (primera desparasitación, vacuna, segunda dosis, revisión, etc.) y donde los animales rotan: entran, se adoptan, se trasladan.

La gestión actual de toda esa información se hace con **cartillas de papel y un folio manuscrito**. Las cartillas se traspapelan, las fechas se olvidan, las dosis se mezclan entre animales con nombres parecidos y, cuando un animal cambia de cuidador o se entrega en adopción, hay que reconstruir su historial casi de memoria. Es un sistema que para uno o dos animales funciona, pero **escala muy mal** en cuanto pasas de la decena.

La pregunta que da origen al proyecto es directa: si llevo el control de mis gastos personales con una app, si gestiono mi calendario laboral con una herramienta digital, ¿por qué la salud de los animales que dependen de mí sigue dependiendo de un folio que se puede mojar, perder o tirar por error?

## 1.2. Motivación

El objetivo es **sustituir el sistema manual por una herramienta digital** que centralice todo el control sanitario de los animales en un único sitio, accesible desde cualquier dispositivo, y que cubra tanto el caso del hogar con varias mascotas como el del refugio con decenas de animales.

PataPlan no pretende ser una app médica ni reemplazar al veterinario. Su papel es el de **una herramienta de gestión para el cuidador**: ese hueco que hoy ocupan el folio, la cartilla de papel y la memoria del responsable. Lo que se persigue no es diagnosticar nada, sino que la persona que cuida de los animales **no se olvide de las cosas importantes** y tenga toda la información organizada y a mano cuando alguien (un veterinario, un adoptante, otro voluntario) se la pida.

## 1.3. Objetivos específicos

A partir de esa motivación general se concretan los siguientes objetivos funcionales:

1. **Gestión centralizada de múltiples animales**, organizados por grupos lógicos (por ejemplo "Casa" y "Refugio") y con su ficha completa: nombre, especie, raza, sexo, fecha de nacimiento, microchip, foto, notas y evolución de peso.
2. **Calendario sanitario con alertas automáticas**, que registre vacunas, desparasitaciones internas y externas, revisiones y tratamientos, y que calcule de manera automática la próxima dosis a partir de la frecuencia configurada.
3. **Motor de protocolos con encadenamiento temporal**, capaz de definir secuencias de actuaciones sanitarias (por ejemplo el protocolo de un gato recién ingresado en refugio) y de **recalcular en cascada** todas las fechas dependientes si una actuación se retrasa.
4. **Sistema de priorización inteligente de alertas**, que evalúe todos los eventos pendientes y vencidos de todos los animales y los ordene en función de su urgencia real (días de retraso, tipo de evento, estado del animal), no por orden cronológico ciego.
5. **Generación de informes PDF** por animal, agregando datos de vacunas, desparasitaciones, tratamientos, visitas, peso y gastos en un único documento útil para adopciones, traslados o consultas veterinarias.
6. **Detección de anomalías de peso** mediante cálculos estadísticos sencillos (media y desviación típica del historial), que avise cuando una variación se sale del patrón habitual de cada animal individual.
7. **Control de gastos veterinarios**, con resúmenes por animal, por categoría y por mes, para entender el coste real del cuidado y planificarlo.

A estos objetivos funcionales se suman dos transversales: que la aplicación sea **independiente de cualquier clínica veterinaria** (los datos son del cuidador, no del centro que los trata) y que pueda **dar servicio tanto al hogar particular como al refugio organizado**, sin obligar al primero a pagar por funcionalidades pensadas para el segundo.

## 1.4. Análisis comparativo

Antes de plantear el desarrollo se revisaron las alternativas existentes en el mercado, agrupadas en cuatro categorías. Ninguna cubre el caso de uso descrito.

### 1.4.1. Apps dirigidas al dueño particular

#### 11Pets

Una de las apps de referencia para dueños de mascotas. Permite registrar varios animales con su ficha sanitaria y guardar documentos.

**Limitaciones detectadas:**
- **Cobro por mascotas adicionales** a partir de cierto número, lo que la hace inviable para un refugio con decenas de animales.
- **Pérdidas de datos reportadas** por usuarios en tiendas de aplicaciones, especialmente al cambiar de dispositivo o tras actualizaciones.
- Es una **app móvil**, sin acceso web cómodo, lo que dificulta su uso desde un ordenador a la hora de gestionar muchos animales o imprimir informes.

#### PetVitality

Aplicación orientada a la salud y el bienestar de la mascota, con foco específico en el **seguimiento de síntomas y de patologías concretas** (epilepsia, entre otras).

**Limitaciones detectadas:**
- Diseñada para hacer seguimiento clínico fino de un único animal con un problema de salud crónico.
- **No está pensada para la gestión colectiva** de muchos animales sanos, que es el caso de uso principal de PataPlan.

#### Woofz

App muy popular en el sector, pero **exclusiva para perros** y enfocada al **entrenamiento y la educación canina**, no al control sanitario multianimal.

**Limitaciones detectadas:**
- Sólo perros: deja fuera a los gatos, que son la mayoría de los animales del caso de uso.
- Modelo de suscripción que llega **hasta los 40 € al mes**, prohibitivo para un refugio.
- No cubre vacunación, desparasitación ni gastos veterinarios como funcionalidad principal.

### 1.4.2. Software veterinario profesional

Soluciones como **Wakyma** o **Iveter** son herramientas potentes y completas, pero están diseñadas para **clínicas veterinarias**, no para dueños o protectoras. Su flujo gira en torno al cliente (la persona que paga la consulta) y al historial clínico que **la propia clínica** mantiene de cada paciente. La curva de aprendizaje, la licencia y la complejidad las hacen inadecuadas para el usuario final, que no necesita gestionar facturación, citas, almacén ni recetas oficiales.

### 1.4.3. Apps vinculadas a clínicas concretas

Muchas clínicas ofrecen una app propia para que sus clientes consulten el historial de sus mascotas. El problema principal es que **el dueño depende de la clínica**: si cambia de veterinario, si la clínica deja de ofrecer el servicio o si el animal recibe atención en varios sitios distintos, el historial se fragmenta o se pierde por completo. El dato sigue siendo de la clínica, no del cuidador.

### 1.4.4. Síntesis del análisis

Ninguna de las opciones revisadas cubre simultáneamente:

- Gestión de **muchos animales** sin coste creciente por cada uno.
- Acceso **web** además de móvil.
- **Independencia** total de cualquier clínica veterinaria.
- Soporte tanto para **hogares particulares** como para **refugios y protectoras**.
- Funcionalidades concretas como protocolos en cascada, priorización de alertas o detección estadística de anomalías de peso.

## 1.5. Propuesta de valor diferencial de PataPlan

A partir de las carencias detectadas, PataPlan se posiciona explícitamente como una herramienta **del cuidador, para el cuidador**, con cinco rasgos diferenciales:

1. **Sin penalización por número de animales.** El modelo no encarece la herramienta cuanto más responsable sea su usuario; un refugio con cincuenta animales se gestiona igual que un hogar con uno.
2. **Independiente de cualquier clínica veterinaria.** Los datos pertenecen al cuidador. Cambiar de veterinario, llevar al animal a un especialista puntual o trasladarlo a otra ciudad no rompe el historial.
3. **Pensada para gestión colectiva, no para un único animal enfermo.** El núcleo del producto está en organizar bien la salud rutinaria de muchos animales sanos (vacunación, desparasitación, peso, gasto), no en hacer seguimiento médico fino de un caso clínico.
4. **Motor de protocolos con recalculado en cascada.** Permite formalizar el conocimiento informal del refugio ("a un gato nuevo le toca esto, luego esto otro y luego aquello") en una plantilla reutilizable, y absorbe automáticamente los retrasos sin obligar al cuidador a recalcular fechas a mano.
5. **Priorización inteligente de alertas y detección de anomalías.** En lugar de mostrar una lista cronológica plana, ordena lo pendiente por urgencia real; y en lugar de exigir al usuario interpretar la curva de peso de cada animal, lo avisa cuando algo se sale de lo normal.

En resumen: PataPlan ocupa un hueco real que las soluciones existentes no cubren — el del usuario que necesita una **herramienta de gestión sanitaria multianimal**, accesible desde cualquier dispositivo, independiente de su veterinario y diseñada para escalar desde el hogar hasta el refugio.
