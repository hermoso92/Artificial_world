# Arquitectura conceptual — Artificial World

## Tesis

Artificial World debe operar como un sistema local de comprensión verificable.

Su unidad de valor no es una respuesta aislada.
Es un expediente auditable de proyecto.

## Capas del sistema

### 1. Ingestión de repositorios

Responsabilidad:

- leer repositorios locales o referencias aprobadas
- fijar versión, snapshot o commit
- detectar stack, estructura y artefactos clave

Salidas:

- índice estructural
- mapa de componentes
- huella de versión

### 2. Lectura y extracción documental

Responsabilidad:

- leer README, docs, changelogs, specs, prompts y notas
- extraer claims, definiciones, promesas y huecos
- distinguir documentación canónica de material promocional

Salidas:

- grafo documental
- lista de afirmaciones normalizadas
- huecos y ambigüedades detectadas

### 3. Normalización de hechos

Responsabilidad:

- separar hechos, hipótesis, visión y contradicciones
- consolidar un lenguaje común para el análisis

Salidas:

- inventario de hechos observables
- inventario de hipótesis
- matriz de contradicciones inicial

### 4. Comparación contra repositorios de referencia

Responsabilidad:

- contrastar el proyecto con referencias seleccionadas
- detectar patrones ausentes, decisiones equivalentes y desvíos importantes

Salidas:

- matriz comparativa
- diferencias clave
- oportunidades de aprendizaje o corrección

### 5. Re-comparación iterativa

Responsabilidad:

- repetir la comparación cuando cambian el repo, la documentación o las referencias
- recalcular diferencias y contradicciones

Salidas:

- delta comparativa
- cambios de criterio
- contradicciones resueltas o abiertas

### 6. Memoria y documentación viva

Responsabilidad:

- guardar decisiones, hallazgos, contradicciones, glosario y contexto
- permitir continuidad entre sesiones

Salidas:

- expediente vivo del proyecto
- historial de análisis
- memoria recuperable por tema y fecha

### 7. MCP maestros y orquestadores

Responsabilidad:

- decidir qué agentes intervienen
- coordinar el flujo entre módulos
- imponer reglas de seguridad, permisos y trazabilidad

Tipos iniciales:

- orquestador de análisis
- orquestador documental
- orquestador comparativo
- orquestador de síntesis

### 8. Agentes especializados

Responsabilidad:

- ejecutar tareas acotadas con contratos claros
- producir artefactos parciales verificables

Tipos iniciales:

- documental
- auditor
- comparador
- contradicción
- técnico
- producto
- narrativo
- seguridad

### 9. Capa de auditoría y trazabilidad

Responsabilidad:

- registrar qué agente hizo qué
- asociar cada salida a fuente, versión y contexto
- impedir que los claims importantes salgan sin evidencia

Registro mínimo por evento:

- agente
- timestamp
- input usado
- fuentes consultadas
- output producido
- nivel de confianza
- contradicciones abiertas

### 10. Capa local de ejecución

Responsabilidad:

- correr modelos locales o conectores aprobados
- gestionar almacenamiento, caché, colas y herramientas
- mantener operación offline-friendly cuando sea posible

### 11. Capa de seguridad y permisos

Responsabilidad:

- delimitar lectura, escritura, red y ejecución
- proteger secretos y carpetas sensibles
- exigir consentimiento para operaciones no triviales

### 12. Capa de salida

Responsabilidad:

- convertir el trabajo interno en piezas útiles para humanos

Salidas objetivo:

- informe técnico
- resumen ejecutivo
- contradicciones detectadas
- historia del proyecto
- backlog sugerido
- acciones recomendadas

## Flujo principal

Entrada -> ingestión -> extracción documental -> normalización -> comparación -> contradicción -> re-comparación -> síntesis -> acción

## El Lazo de Convergencia

Nombre recomendado para la capacidad central de comunicación iterativa del sistema.

Flujo exacto:

1. entrada de repositorio, documentación y referencias
2. análisis estructural inicial
3. actualización del expediente vivo
4. comparación con referencias
5. detección de contradicciones
6. segunda comparación con contradicciones incorporadas
7. síntesis técnica, ejecutiva y narrativa
8. recomendaciones accionables

## Regla cardinal

Ninguna afirmación importante debe salir del sistema sin rastro verificable.
