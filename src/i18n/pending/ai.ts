import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Melhorar": {
    en: "Improve",
    es: "Mejorar",
    fr: "Améliorer",
  },
  "Melhore a escrita: deixe o texto mais claro e simpático, mantendo o sentido.": {
    en: "Improve the writing: make the text clearer and friendlier, keeping the meaning.",
    es: "Mejora la escritura: deja el texto más claro y amable, manteniendo el sentido.",
    fr: "Améliorez le texte : plus clair et chaleureux, en gardant le sens.",
  },
  "✂️ Resumir": {
    en: "✂️ Summarize",
    es: "✂️ Resumir",
    fr: "✂️ Résumer",
  },
  "Resuma o texto mantendo as informações essenciais.": {
    en: "Summarize the text while keeping the essential information.",
    es: "Resume el texto manteniendo la información esencial.",
    fr: "Résumez le texte en gardant l'essentiel.",
  },
  "📝 Corrigir": {
    en: "📝 Fix",
    es: "📝 Corregir",
    fr: "📝 Corriger",
  },
  "Corrija ortografia e gramática sem mudar o estilo.": {
    en: "Fix spelling and grammar without changing the style.",
    es: "Corrige ortografía y gramática sin cambiar el estilo.",
    fr: "Corrigez l'orthographe et la grammaire sans changer le style.",
  },
  "Sem acesso ao microfone. Libere a permissão no navegador.": {
    en: "No microphone access. Allow permission in the browser.",
    es: "Sin acceso al micrófono. Permite el permiso en el navegador.",
    fr: "Pas d'accès au micro. Autorisez-le dans le navigateur.",
  },
  "Veja a imagem.": {
    en: "Look at the image.",
    es: "Mira la imagen.",
    fr: "Regardez l'image.",
  },
  "Conteúdo colado (HTML, estrutura intencional):\n\"\"\"\n{html}\n\"\"\"": {
    en: "Pasted content (HTML, intentional structure):\n\"\"\"\n{html}\n\"\"\"",
    es: "Contenido pegado (HTML, estructura intencional):\n\"\"\"\n{html}\n\"\"\"",
    fr: "Contenu collé (HTML, structure intentionnelle) :\n\"\"\"\n{html}\n\"\"\"",
  },
  "Texto colado:\n\"\"\"\n{text}\n\"\"\"": {
    en: "Pasted text:\n\"\"\"\n{text}\n\"\"\"",
    es: "Texto pegado:\n\"\"\"\n{text}\n\"\"\"",
    fr: "Texte collé :\n\"\"\"\n{text}\n\"\"\"",
  },
  "\n(sobre o trecho selecionado)": {
    en: "\n(about the selected passage)",
    es: "\n(sobre el tramo seleccionado)",
    fr: "\n(sur le passage sélectionné)",
  },
  "Não entendi nada no áudio. Tente de novo mais perto do microfone.": {
    en: "I didn't catch anything in the audio. Try again closer to the microphone.",
    es: "No entendí nada del audio. Intenta de nuevo más cerca del micrófono.",
    fr: "Je n'ai rien compris dans l'audio. Réessayez plus près du micro.",
  },
  "Cancelado.": {
    en: "Cancelled.",
    es: "Cancelado.",
    fr: "Annulé.",
  },
  "O assistente não respondeu.": {
    en: "The assistant did not reply.",
    es: "El asistente no respondió.",
    fr: "L'assistant n'a pas répondu.",
  },
  "Assistente de IA": {
    en: "AI assistant",
    es: "Asistente de IA",
    fr: "Assistant IA",
  },
  "Modelo": {
    en: "Model",
    es: "Modelo",
    fr: "Modèle",
  },
  "Verificando modelos…": {
    en: "Checking models…",
    es: "Comprobando modelos…",
    fr: "Vérification des modèles…",
  },
  "Modelos": {
    en: "Models",
    es: "Modelos",
    fr: "Modèles",
  },
  "⚠️ Assistente de IA não configurado no servidor.": {
    en: "⚠️ AI assistant is not configured on the server.",
    es: "⚠️ Asistente de IA no configurado en el servidor.",
    fr: "⚠️ Assistant IA non configuré sur le serveur.",
  },
  "Converse normalmente: pergunte sobre o documento ou sobre o acampamento e ele responde aqui; peça uma mudança (“resuma”, “acrescente…”) e ele altera o texto e conta o que fez — dá para reverter.": {
    en: "Chat normally: ask about the document or the camp and it replies here; ask for a change (“summarize”, “add…”) and it edits the text and explains what it did — you can undo.",
    es: "Habla con normalidad: pregunta sobre el documento o el campamento y responde aquí; pide un cambio (“resume”, “añade…”) y altera el texto y cuenta lo que hizo — se puede revertir.",
    fr: "Discutez normalement : posez une question sur le document ou le camp et il répond ici ; demandez un changement (« résume », « ajoute… ») et il modifie le texte en expliquant — on peut annuler.",
  },
  "Selecione um trecho no editor para tratar só dele.": {
    en: "Select a passage in the editor to work only on that.",
    es: "Selecciona un tramo en el editor para tratar solo de él.",
    fr: "Sélectionnez un passage dans l'éditeur pour ne traiter que celui-ci.",
  },
  "🎤 Áudio · {time}": {
    en: "🎤 Audio · {time}",
    es: "🎤 Audio · {time}",
    fr: "🎤 Audio · {time}",
  },
  " · transcrevendo…": {
    en: " · transcribing…",
    es: " · transcribiendo…",
    fr: " · transcription…",
  },
  "🔎 Consultou {items}": {
    en: "🔎 Looked up {items}",
    es: "🔎 Consultó {items}",
    fr: "🔎 A consulté {items}",
  },
  "🎨 Desenhando {done} de {total}…": {
    en: "🎨 Drawing {done} of {total}…",
    es: "🎨 Dibujando {done} de {total}…",
    fr: "🎨 Dessin de {done} sur {total}…",
  },
  "Escrevendo o documento…": {
    en: "Writing the document…",
    es: "Escribiendo el documento…",
    fr: "Rédaction du document…",
  },
  "Respondendo…": {
    en: "Replying…",
    es: "Respondiendo…",
    fr: "Réponse…",
  },
  "Consultando…": {
    en: "Looking up…",
    es: "Consultando…",
    fr: "Consultation…",
  },
  "Pensando…": {
    en: "Thinking…",
    es: "Pensando…",
    fr: "Réflexion…",
  },
  " (no trecho selecionado)": {
    en: " (in the selected passage)",
    es: " (en el tramo seleccionado)",
    fr: " (dans le passage sélectionné)",
  },
  "Pronto.": {
    en: "Done.",
    es: "Listo.",
    fr: "C'est fait.",
  },
  "Sem resposta.": {
    en: "No reply.",
    es: "Sin respuesta.",
    fr: "Pas de réponse.",
  },
  "⚠️ Não consegui desenhar uma imagem.": {
    en: "⚠️ I couldn't draw one image.",
    es: "⚠️ No pude dibujar una imagen.",
    fr: "⚠️ Impossible de dessiner une image.",
  },
  "⚠️ Não consegui desenhar {n} imagens.": {
    en: "⚠️ I couldn't draw {n} images.",
    es: "⚠️ No pude dibujar {n} imágenes.",
    fr: "⚠️ Impossible de dessiner {n} images.",
  },
  "✅ Aplicado no documento": {
    en: "✅ Applied to the document",
    es: "✅ Aplicado en el documento",
    fr: "✅ Appliqué au document",
  },
  "✅ Aplicado no trecho selecionado": {
    en: "✅ Applied to the selected passage",
    es: "✅ Aplicado en el tramo seleccionado",
    fr: "✅ Appliqué au passage sélectionné",
  },
  "↩️ Revertido no documento": {
    en: "↩️ Reverted in the document",
    es: "↩️ Revertido en el documento",
    fr: "↩️ Annulé dans le document",
  },
  "↩️ Revertido no trecho selecionado": {
    en: "↩️ Reverted in the selected passage",
    es: "↩️ Revertido en el tramo seleccionado",
    fr: "↩️ Annulé dans le passage sélectionné",
  },
  "👁 Ver o que mudou": {
    en: "👁 See what changed",
    es: "👁 Ver qué cambió",
    fr: "👁 Voir ce qui a changé",
  },
  "↶ Reverter": {
    en: "↶ Revert",
    es: "↶ Revertir",
    fr: "↶ Annuler",
  },
  "↷ Aplicar de novo": {
    en: "↷ Apply again",
    es: "↷ Aplicar de nuevo",
    fr: "↷ Appliquer à nouveau",
  },
  "🎤 Áudio gravado · {time}": {
    en: "🎤 Recorded audio · {time}",
    es: "🎤 Audio grabado · {time}",
    fr: "🎤 Audio enregistré · {time}",
  },
  "Descartar áudio": {
    en: "Discard audio",
    es: "Descartar audio",
    fr: "Jeter l'audio",
  },
  "Imagem colada": {
    en: "Pasted image",
    es: "Imagen pegada",
    fr: "Image collée",
  },
  "Remover imagem": {
    en: "Remove image",
    es: "Quitar imagen",
    fr: "Retirer l'image",
  },
  "Ver texto colado": {
    en: "View pasted text",
    es: "Ver texto pegado",
    fr: "Voir le texte collé",
  },
  "Colado com formatação": {
    en: "Pasted with formatting",
    es: "Pegado con formato",
    fr: "Collé avec mise en forme",
  },
  "Texto colado": {
    en: "Pasted text",
    es: "Texto pegado",
    fr: "Texte collé",
  },
  "📋 {kind} · {n} caracteres": {
    en: "📋 {kind} · {n} characters",
    es: "📋 {kind} · {n} caracteres",
    fr: "📋 {kind} · {n} caractères",
  },
  "Remover texto colado": {
    en: "Remove pasted text",
    es: "Quitar texto pegado",
    fr: "Retirer le texte collé",
  },
  "Pergunte ou peça uma mudança no trecho selecionado": {
    en: "Ask or request a change in the selected passage",
    es: "Pregunta o pide un cambio en el tramo seleccionado",
    fr: "Demandez ou demandez un changement dans le passage sélectionné",
  },
  "Pergunte algo ou peça uma mudança — dá para colar texto ou imagens": {
    en: "Ask something or request a change — you can paste text or images",
    es: "Pregunta algo o pide un cambio — se puede pegar texto o imágenes",
    fr: "Posez une question ou demandez un changement — vous pouvez coller du texte ou des images",
  },
  "🎯 trecho selecionado": {
    en: "🎯 selected passage",
    es: "🎯 tramo seleccionado",
    fr: "🎯 passage sélectionné",
  },
  "📄 documento inteiro": {
    en: "📄 whole document",
    es: "📄 documento entero",
    fr: "📄 document entier",
  },
  "Parar gravação": {
    en: "Stop recording",
    es: "Parar grabación",
    fr: "Arrêter l'enregistrement",
  },
  "Gravar áudio": {
    en: "Record audio",
    es: "Grabar audio",
    fr: "Enregistrer l'audio",
  },
  "Enviar áudio": {
    en: "Send audio",
    es: "Enviar audio",
    fr: "Envoyer l'audio",
  },
  "O que a IA mudou": {
    en: "What the AI changed",
    es: "Lo que cambió la IA",
    fr: "Ce que l'IA a changé",
  },
  "O que mudou": {
    en: "What changed",
    es: "Qué cambió",
    fr: "Ce qui a changé",
  },
  "nada mudou": {
    en: "nothing changed",
    es: "nada cambió",
    fr: "rien n'a changé",
  },
  "1 trecho novo": {
    en: "1 new passage",
    es: "1 tramo nuevo",
    fr: "1 nouveau passage",
  },
  "{n} trechos novos": {
    en: "{n} new passages",
    es: "{n} tramos nuevos",
    fr: "{n} nouveaux passages",
  },
  "1 reescrito": {
    en: "1 rewritten",
    es: "1 reescrito",
    fr: "1 réécrit",
  },
  "{n} reescritos": {
    en: "{n} rewritten",
    es: "{n} reescritos",
    fr: "{n} réécrits",
  },
  "1 removido": {
    en: "1 removed",
    es: "1 eliminado",
    fr: "1 retiré",
  },
  "{n} removidos": {
    en: "{n} removed",
    es: "{n} eliminados",
    fr: "{n} retirés",
  },
  "Diferenças": {
    en: "Differences",
    es: "Diferencias",
    fr: "Différences",
  },
  "Documento novo": {
    en: "New document",
    es: "Documento nuevo",
    fr: "Nouveau document",
  },
  "Mostrar o texto inteiro": {
    en: "Show the full text",
    es: "Mostrar el texto entero",
    fr: "Afficher tout le texte",
  },
  "O texto ficou igual — a IA não mudou nada.": {
    en: "The text stayed the same — the AI changed nothing.",
    es: "El texto quedó igual — la IA no cambió nada.",
    fr: "Le texte est resté identique — l'IA n'a rien changé.",
  },
  "↶ Desfazer a mudança": {
    en: "↶ Undo the change",
    es: "↶ Deshacer el cambio",
    fr: "↶ Annuler le changement",
  },
  "Manter": {
    en: "Keep",
    es: "Mantener",
    fr: "Garder",
  },
  "IA ligada: ao colar ou sair do campo, o texto é distribuído nos campos acima": {
    en: "AI on: when you paste or leave the field, the text is sorted into the fields above",
    es: "IA activa: al pegar o salir del campo, el texto se reparte en los campos de arriba",
    fr: "IA activée : en collant ou en quittant le champ, le texte est réparti dans les champs ci-dessus",
  },
  "IA desligada": {
    en: "AI off",
    es: "IA apagada",
    fr: "IA désactivée",
  },
  "organizando…": {
    en: "sorting…",
    es: "organizando…",
    fr: "organisation…",
  },
  "organizar com IA": {
    en: "sort with AI",
    es: "organizar con IA",
    fr: "organiser avec l'IA",
  },
  "Desenhar uma imagem": {
    en: "Draw an image",
    es: "Dibujar una imagen",
    fr: "Dessiner une image",
  },
  "O que aparece no desenho": {
    en: "What appears in the drawing",
    es: "Qué aparece en el dibujo",
    fr: "Ce qui apparaît dans le dessin",
  },
  "ex.: capa para “{suggestion}” — barracas entre pinheiros ao amanhecer": {
    en: "e.g. cover for “{suggestion}” — tents among pine trees at dawn",
    es: "ej.: portada para “{suggestion}” — tiendas entre pinos al amanecer",
    fr: "ex. : couverture pour « {suggestion} » — tentes parmi des pins à l'aube",
  },
  "ex.: crianças em fila na porta de um ônibus escolar, vistas de lado": {
    en: "e.g. kids lined up at a school bus door, seen from the side",
    es: "ej.: niños en fila en la puerta de un autobús escolar, vistos de lado",
    fr: "ex. : enfants en file à la porte d'un bus scolaire, vus de côté",
  },
  "Descreva o que se vê. O desenho não leva letras — se precisar de texto, use a legenda.": {
    en: "Describe what is seen. The drawing has no letters — if you need text, use the caption.",
    es: "Describe lo que se ve. El dibujo no lleva letras — si necesitas texto, usa la leyenda.",
    fr: "Décrivez ce que l'on voit. Le dessin n'a pas de lettres — pour du texte, utilisez la légende.",
  },
  "Formato da imagem": {
    en: "Image format",
    es: "Formato de la imagen",
    fr: "Format de l'image",
  },
  "Deitada": {
    en: "Landscape",
    es: "Apaisada",
    fr: "Paysage",
  },
  "Quadrada": {
    en: "Square",
    es: "Cuadrada",
    fr: "Carrée",
  },
  "Em pé": {
    en: "Portrait",
    es: "De pie",
    fr: "Portrait",
  },
  "Desenhista": {
    en: "Artist",
    es: "Dibujante",
    fr: "Dessinateur",
  },
  "Estilo do acampamento (vetor chapado, cores do app)": {
    en: "Camp style (flat vector, app colors)",
    es: "Estilo del campamento (vector plano, colores de la app)",
    fr: "Style du camp (vectoriel plat, couleurs de l'app)",
  },
  "🎨 Desenhando… leva de 10 a 60 segundos.": {
    en: "🎨 Drawing… takes 10 to 60 seconds.",
    es: "🎨 Dibujando… tarda de 10 a 60 segundos.",
    fr: "🎨 Dessin… cela prend de 10 à 60 secondes.",
  },
  "Não foi possível gerar a imagem.": {
    en: "Could not generate the image.",
    es: "No se pudo generar la imagen.",
    fr: "Impossible de générer l'image.",
  },
  "Não foi possível guardar a imagem.": {
    en: "Could not save the image.",
    es: "No se pudo guardar la imagen.",
    fr: "Impossible d'enregistrer l'image.",
  },
  "Legenda (opcional)": {
    en: "Caption (optional)",
    es: "Leyenda (opcional)",
    fr: "Légende (facultative)",
  },
  "ex.: Fila de embarque no sábado": {
    en: "e.g. Boarding line on Saturday",
    es: "ej.: Fila de embarque el sábado",
    fr: "ex. : File d'embarquement le samedi",
  },
  "↻ De novo": {
    en: "↻ Again",
    es: "↻ De nuevo",
    fr: "↻ Encore",
  },
  "🎨 Desenhar": {
    en: "🎨 Draw",
    es: "🎨 Dibujar",
    fr: "🎨 Dessiner",
  },
  "Guardando…": {
    en: "Saving…",
    es: "Guardando…",
    fr: "Enregistrement…",
  },
  "Gerar título com IA a partir do conteúdo": {
    en: "Generate title with AI from the content",
    es: "Generar título con IA a partir del contenido",
    fr: "Générer un titre avec l'IA à partir du contenu",
  },
  "Gerar título com IA": {
    en: "Generate title with AI",
    es: "Generar título con IA",
    fr: "Générer un titre avec l'IA",
  },
  "HTML do documento": {
    en: "Document HTML",
    es: "HTML del documento",
    fr: "HTML du document",
  },
  "⤷ Formatar": {
    en: "⤷ Format",
    es: "⤷ Formatear",
    fr: "⤷ Formater",
  },
  "✓ Aplicar": {
    en: "✓ Apply",
    es: "✓ Aplicar",
    fr: "✓ Appliquer",
  },
  "⚠️ Estas tags serão removidas ao aplicar: {tags}": {
    en: "⚠️ These tags will be removed on apply: {tags}",
    es: "⚠️ Estas etiquetas se quitarán al aplicar: {tags}",
    fr: "⚠️ Ces balises seront retirées à l'application : {tags}",
  },
  "Permitido: p, br, strong, em, s, ul, ol, li, h2, h3, blockquote, a, hr, img, mark, details, summary, figure, figcaption, table.": {
    en: "Allowed: p, br, strong, em, s, ul, ol, li, h2, h3, blockquote, a, hr, img, mark, details, summary, figure, figcaption, table.",
    es: "Permitido: p, br, strong, em, s, ul, ol, li, h2, h3, blockquote, a, hr, img, mark, details, summary, figure, figcaption, table.",
    fr: "Autorisé : p, br, strong, em, s, ul, ol, li, h2, h3, blockquote, a, hr, img, mark, details, summary, figure, figcaption, table.",
  },
  "{n} caracteres": {
    en: "{n} characters",
    es: "{n} caracteres",
    fr: "{n} caractères",
  },
  " · alterado": {
    en: " · changed",
    es: " · modificado",
    fr: " · modifié",
  },
  " · ⌘/Ctrl+Enter aplica": {
    en: " · ⌘/Ctrl+Enter applies",
    es: " · ⌘/Ctrl+Enter aplica",
    fr: " · ⌘/Ctrl+Entrée applique",
  },
};
