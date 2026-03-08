# Decisiones Tecnicas

## Decision 1
`Artificial World` sigue siendo el motor Python verificable. El `ai-core` local de este repo es un servicio auxiliar para backend web y herramientas de apoyo, no el motor principal.

## Decision 2
`HeroRefuge` consume el `ai-core` como cliente especializado. Su contrato de herramientas sigue existiendo, pero la inferencia deja de ser un caso aislado.

## Decision 3
La memoria local es archivo plano versionado (`.md` + `.json`). No se introduce vector DB, embeddings persistentes ni multiagente.

## Decision 4
Los endpoints de IA se limitan a cinco operaciones:
- `health`
- `chat`
- `summarize`
- `analyzeTestFailure`
- `analyzeSession`

## Decision 5
El puente con `DobackSoft` real queda en nivel de contrato futuro. No se asume integración real con `dobackv2` dentro de este repositorio.
