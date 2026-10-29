# Prompt for the next agent (paste it as the first message)

```
Hola. Soy Carlos. Retomamos el proyecto del Institute for Hispano Studies (web de Beltrán Arellanes), ahora desde Windows: me he cambiado de Linux porque me quedaba sin disco, así que el entorno es nuevo.

Antes de nada lee, enteros y en este orden:
1. AGENTS.md (las reglas del repo, obligatorias).
2. docs/handoff/2026-10-29-round-3-windows.md (dónde lo dejamos, cómo trabajo yo, qué está pendiente y cómo montar el entorno en Windows).
Luego mira el estado real: `gh pr list`, `gh issue list`, `git log --oneline -15 origin/main`.

Lo primero que necesito:
1. Monta el entorno en este Windows (sección 4 del handoff): lo que falte instalar dímelo y te lo instalo o me das el comando. Arranca la web en localhost (http://localhost:3000) para que yo la vea. Si hay PRs sin fusionar (archivo #76, Atlas #77), levanta también su rama en otro puerto y dame las URLs.
2. Dame UNA lista ordenada y sintetizada de todo lo que necesita mi revisión, mis respuestas o cosas que te falten (sección 3 del handoff, actualizada con lo que veas en GitHub). Corta: una línea por punto. Si algo ya está resuelto, quítalo.
3. Luego seguimos la ronda: terminar y revisar el archivo (#76) y el Atlas (#77), fusionar cuando yo dé el ok, AdSense (#70) cuando tenga el ID, el manifiesto cuando llegue, y desplegar la preview para Beltrán cuando te lo diga.

Cómo trabajo (está en el handoff, pero lo repito): háblame en español; código, commits, PRs e issues en inglés. No me llenes de preguntas: decide con criterio, entrega y yo corrijo. Solo contenido real, nada inventado; imágenes solo con fuente y licencia en assets/art/SOURCES.md; EN/ES; prefers-reduced-motion en todo. Verifica con capturas reales a 1440 y 390 en EN y ES antes de decir que algo está terminado. Para rondas grandes eres el orquestador: lanza subagentes en paralelo (worktrees, una issue = una rama = un PR), no llenes tu propio contexto, revisa sus capturas y me cuentas en corto. Fusiona cada ronda verificada cuando yo esté contento; despliega solo cuando te lo pida. Al final de la ronda, recuérdame lo de las descargas de PDF para suscriptores de Patreon (#72).
```
