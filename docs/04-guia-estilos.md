# 4. Guía de estilos

Este documento recoge los criterios visuales y de interacción que definen PataPlan: colores, tipografía, espaciado, radios, componentes y wireframes. Es la referencia común entre diseño y código.

## 4.1. Prototipo

El prototipo interactivo está disponible en Figma:

[Pulsa aquí para ir al prototipo](https://www.figma.com/design/rv8A4aZqoQBYzfmjioJ8tk/PataPlan?node-id=0-1&t=MC59og3MirEiYxIp-1)

El prototipo cubre las pantallas principales en versión escritorio y móvil, los estados de los componentes (default, focus, error, disabled) y los flujos críticos: alta de animal, asignación de protocolo, generación de informe y consulta de alertas.

## 4.2. Paleta de colores

La paleta se organiza en cuatro grupos: primario (teal), acento (ámbar), neutros y semánticos. Cada grupo cromático sigue una escala de 50 a 900 para cubrir todos los usos posibles (fondos suaves, botones, hovers, textos, bordes, alertas).

### 4.2.1. Primary — Teal

El teal es el color principal de PataPlan. Transmite calma, salud y profesionalidad, y se asocia bien con el ámbito veterinario.

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| primary-50  | `#E8F5F0` | Fondos suaves, hovers en filas, *highlight* sutil. |
| primary-100 | `#A8DCC8` | Fondos de tarjetas informativas, badges claros. |
| primary-200 | `#5DBFA0` | Estados intermedios, ilustraciones. |
| primary-400 | `#2A9D78` | Hover de enlaces y botones primarios. |
| primary-600 | `#1A7A5C` | **Botones primarios**, enlaces, iconos de marca. |
| primary-800 | `#0B5D45` | Paneles de marca (panel lateral de login/registro). |
| primary-900 | `#04382A` | Sólo para textos muy concretos sobre fondo claro. |

### 4.2.2. Accent — Amber

El ámbar se reserva para llamadas de atención no críticas: avisos, pendientes, *highlights* secundarios. **No** se usa para acciones primarias ni para errores.

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| amber-50  | `#FEF3E0` | Fondo de alertas tipo *aviso*. |
| amber-100 | `#FDDCA0` | Badges suaves de pendiente. |
| amber-200 | `#F5B842` | Iconografía y dots de "pendiente". |
| amber-400 | `#E09515` | Hover de elementos ámbar. |
| amber-600 | `#B07210` | Texto sobre fondo `amber-50`. |
| amber-800 | `#7A4A06` | Texto principal de alertas tipo aviso. |
| amber-900 | `#412402` | Énfasis muy oscuro sobre tonos cálidos. |

### 4.2.3. Neutrals

Para fondos, texto y bordes. Construyen la mayor parte de la interfaz.

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| white     | `#FAFAF8` | **Fondo de tarjetas, panels, modales.** |
| gray-50   | `#F3F1EC` | **Fondo de página.** |
| gray-100  | `#E2E0D8` | Bordes suaves, separadores. |
| gray-300  | `#B4B2A9` | Iconos secundarios, placeholders. |
| gray-600  | `#6B6A65` | **Texto secundario, meta, captions.** |
| gray-800  | `#3A3A38` | Texto sobre fondos coloreados. |
| gray-900  | `#1E1E1D` | **Texto principal, títulos.** |

### 4.2.4. Semantic

Colores reservados a estados: éxito, error, advertencia, información. No deben usarse fuera de su función semántica para no diluir su significado.

| Token | Hex | Uso recomendado |
|-------|-----|-----------------|
| danger  | `#DC3545` | Errores, eventos **vencidos**, botones destructivos. |
| success | `#28A745` | Eventos **al día / completados**, confirmaciones. |
| warning | `#E09515` | Avisos no críticos. Comparte tono con `amber-400`. |
| info    | `#1A7A5C` | Mensajes informativos. Comparte tono con `primary-600`. |

### 4.2.5. Reglas de uso resumidas

- Fondo de página: `gray-50`.
- Fondo de tarjetas y modales: `white`.
- Texto principal: `gray-900`. Texto secundario: `gray-600`.
- Botones primarios: `primary-600`, hover `primary-400`.
- Enlaces: `primary-600`, hover `primary-400`.
- Eventos vencidos: `danger`. Pendientes: `amber-400` / `amber-600`. Al día: `success`.

## 4.3. Tipografía

La tipografía oficial es **Montserrat**, una sans-serif geométrica con muy buena legibilidad en pantalla. Se carga desde Google Fonts con los pesos 400 (regular), 500 (medium), 600 (semibold) y 700 (bold).

### 4.3.1. Escala tipográfica

| Nivel | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| H1      | 28 px (1.75 rem) | 700 (bold)     | Título principal de página. |
| H2      | 22 px (1.375 rem) | 700 (bold)    | Títulos de sección. |
| H3      | 18 px (1.125 rem) | 600 (semibold) | Títulos de tarjetas y subsecciones. |
| Body    | 15 px (0.9375 rem) | 400 (regular) | Texto corrido, etiquetas de formulario. |
| Small   | 13 px (0.8125 rem) | 400 (regular) | Meta, descripciones cortas, valores secundarios. |
| Caption | 11 px (0.6875 rem) | 400 (regular) | Marcas de hora, *footnotes*, indicadores muy pequeños. |

### 4.3.2. Reglas tipográficas

- Sólo dos familias en toda la app: Montserrat para todo, `'Courier New'` (monospace) sólo para los códigos de invitación.
- No mezclar más de **tres niveles distintos** en una misma pantalla si se puede evitar.
- Interlineado por defecto: 1.5 para body, 1.3 para titulares.

## 4.4. Sistema de espaciado

El espaciado sigue una escala basada en múltiplos de 4 píxeles. Esto da ritmo visual y reduce las decisiones arbitrarias.

| Token       | px  | rem      | Uso típico |
|-------------|-----|----------|------------|
| spacing-1   | 4   | 0.25 rem | Separación entre icono y texto. |
| spacing-2   | 8   | 0.5 rem  | Padding interno de badges y dots. |
| spacing-3   | 12  | 0.75 rem | Separación entre campos compactos. |
| spacing-4   | 16  | 1 rem    | Padding por defecto de tarjetas, gap base. |
| spacing-5   | 20  | 1.25 rem | Separación entre secciones cercanas. |
| spacing-6   | 24  | 1.5 rem  | Padding interno de modales. |
| spacing-8   | 32  | 2 rem    | Separación entre bloques de contenido distintos. |
| spacing-12  | 48  | 3 rem    | Padding lateral de páginas en escritorio. |

## 4.5. Border radius

Los radios definen el "carácter" del producto: ni cuadrado ni excesivamente redondeado.

| Token | Valor | Uso |
|-------|-------|-----|
| radius-sm | 4 px  | Badges, *chips*, etiquetas pequeñas. |
| radius-md | 8 px  | Botones, inputs, *selects*, *textareas*. |
| radius-lg | 12 px | Cards, paneles, tarjetas de listado. |
| radius-xl | 16 px | Modales y *dialogs*. |
| radius-full | 50% | Avatares, dots, *toggles*. |

## 4.6. Componentes reutilizables

A continuación se describen los componentes base de la interfaz, con sus estados principales.

### 4.6.1. Input

| Estado     | Borde | Background | Notas |
|------------|-------|------------|-------|
| Default    | `gray-100` | `white` | Borde sutil. |
| Focus      | `primary-400` | `white` | Sombra suave `rgba(42,157,120,0.18)` 3 px. |
| Error      | `danger` | `white` | Mensaje de error en `danger` debajo. |
| Disabled   | `gray-100` | `gray-50` | Texto `gray-300`. |

Padding: `0.5rem 0.75rem`. Radio: `radius-md`. Tipografía: Body.

### 4.6.2. Button

| Variante  | Background | Texto | Hover |
|-----------|------------|-------|-------|
| Primary   | `primary-600` | `white` | `primary-400` |
| Secondary | `white` | `gray-800` | Borde `gray-300` |
| Danger    | `white` | `danger` | Borde `danger`, fondo `rgba(220,53,69,0.05)` |
| Ghost     | transparente | `primary-600` | Texto `primary-400` |
| Disabled  | opacidad 0.6 sobre la variante base | — | sin hover |

Padding: `0.5rem 0.875rem`. Radio: `radius-md`. Tipografía: Body 600.

### 4.6.3. Badge

Etiqueta corta de estado.

| Variante | Background | Texto |
|----------|------------|-------|
| Success  | rgba(40,167,69,0.12)  | `success` |
| Warning  | `amber-50`            | `amber-800` |
| Danger   | rgba(220,53,69,0.12)  | `danger` |
| Info     | `primary-50`          | `primary-600` |
| Neutral  | `gray-100`            | `gray-800` |

Padding: `0.15rem 0.5rem`. Radio: `radius-sm`. Tipografía: Caption 600.

### 4.6.4. Card

Contenedor base para listas, métricas y bloques de información.

- Background: `white`
- Borde: 1 px `gray-100`
- Radio: `radius-lg`
- Sombra: ninguna por defecto (se usa borde, no sombra).
- Padding: `spacing-5` (1.25 rem).

### 4.6.5. Alert row

Fila de alerta que aparece en el dashboard ("animales que necesitan atención"). Cada fila se compone de:

- Una **barra vertical de 4 px** a la izquierda con color semántico: `danger` (vencido) o `amber-400` (pendiente).
- Avatar circular (`radius-full`) con foto del animal o inicial.
- Bloque de texto: nombre del animal en `gray-900` 600, meta en `gray-600` regular, lista de eventos con dot semántico.

### 4.6.6. Sidebar nav item

Elemento del menú lateral.

| Estado | Background | Texto |
|--------|------------|-------|
| Default | transparente | `gray-800` |
| Hover   | `gray-50`    | `primary-600` |
| Active  | `primary-50` | `primary-600` 600 |

Icono lucide 18 px a la izquierda, etiqueta Body a la derecha. Padding `0.625rem 0.875rem`, radio `radius-md`.

### 4.6.7. Metric card

Tarjeta de cifra clave (gasto total, gasto del mes, media por animal).

- Card base + título Caption en `gray-600` arriba.
- Cifra en H2 / 28 px 700 (`gray-900`).
- Sufijo (`EUR`) en Small 600 con color `gray-600`.
- Línea de variación (opcional) en `success`, `danger` o `gray-600`.

### 4.6.8. Modal

Diálogo modal centrado.

- Overlay: `rgba(0,0,0,0.5)`.
- Caja: `white`, `radius-xl`, sombra `0 0.625rem 1.875rem rgba(0,0,0,0.18)`.
- Ancho máximo: 32 rem (formularios) o 24 rem (confirmaciones).
- Header con título H3 + botón cerrar (icono X).
- Footer con dos botones: Secondary "Cancelar" + Primary "Confirmar" (orden invertido en móvil).

## 4.7. Wireframes y mockups

Tanto el wirefreame como el mockup de la aplicación web se encuentran definidos en el proyeto Figma de PataPlan.

## 4.8. Accesibilidad

PataPlan apunta al nivel **WCAG 2.1 AA** como mínimo. Los puntos críticos:

### 4.8.1. Contraste de color

Todas las combinaciones texto/fondo cumplen el ratio AA correspondiente (4.5:1 para texto normal, 3:1 para texto grande ≥ 18 pt o ≥ 14 pt bold). Los casos clave verificados:

| Combinación | Ratio | Cumple |
|-------------|-------|--------|
| `gray-900` sobre `gray-50` | 13.8 : 1 | AAA |
| `gray-600` sobre `white`   | 6.0 : 1  | AA |
| `white` sobre `primary-600` | 4.6 : 1 | AA |
| `white` sobre `primary-800` | 7.9 : 1 | AAA |
| `danger` sobre `white` | 4.8 : 1 | AA |
| `amber-800` sobre `amber-50` | 8.4 : 1 | AAA |

Los textos en `gray-300` o `amber-200` se reservan a elementos **no informativos** (placeholders, decoraciones), nunca a contenido funcional.

### 4.8.2. Foco visible

Todos los elementos interactivos (inputs, botones, enlaces, items de menú) tienen un estado de foco visible: borde `primary-400` y sombra suave de 3 px. Nunca se elimina el `outline` sin sustituirlo por otro indicador visual.

### 4.8.3. Información no transmitida sólo por color

El estado de un evento (vencido / pendiente / al día) **no se comunica únicamente con el color**: también lleva un texto explícito ("Vencido", "Pendiente", "Al día") y un icono o dot semántico. Esto garantiza que un usuario daltónico o que use modo alto contraste puede interpretar la información.

### 4.8.4. Tamaño mínimo de objetivo táctil

En vistas móviles, los elementos interactivos tienen al menos 44×44 px de área tocable, siguiendo la recomendación de WCAG 2.5.5.

### 4.8.5. Semántica HTML

Se usan elementos nativos siempre que es posible (`<button>`, `<a>`, `<input>`, `<label>`, `<h1>`–`<h3>`), y se añaden atributos ARIA (`aria-label`, `aria-modal`, `role`) cuando hay componentes personalizados como modales, *dialogs* y *toggles*.
