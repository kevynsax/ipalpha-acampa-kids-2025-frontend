import type { Locale } from "../locales";

export const LITERALS: Record<string, Partial<Record<Exclude<Locale, "pt">, string>>> = {
  "Zerar todos os check-ins?": {
    en: "Reset all check-ins?",
    es: "¿Resetear todos los check-ins?",
    fr: "Réinitialiser tous les check-ins ?",
  },
  "Isso apaga o check-in de {kids} criança(s) e {staff} pessoa(s) da equipe, os coletes e o histórico. Não pode ser desfeito.": {
    en: "This clears check-in for {kids} child(ren) and {staff} staff member(s), the vests, and the history. It cannot be undone.",
    es: "Esto borra el check-in de {kids} niño(s) y {staff} persona(s) del equipo, los chalecos y el historial. No se puede deshacer.",
    fr: "Cela efface le check-in de {kids} enfant(s) et {staff} membre(s) de l'équipe, les gilets et l'historique. Impossible à annuler.",
  },
  "Zerar check-ins": {
    en: "Reset check-ins",
    es: "Resetear check-ins",
    fr: "Réinitialiser les check-ins",
  },
  "⏰ Janela de horário do check-in": {
    en: "⏰ Check-in time window",
    es: "⏰ Ventana de horario del check-in",
    fr: "⏰ Fenêtre horaire du check-in",
  },
  "Nesse horário os ajudantes da igreja": {
    en: "During this time, church helpers",
    es: "En ese horario los ayudantes de la iglesia",
    fr: "Pendant cette plage, les aides de l'église",
  },
  "e": {
    en: "and",
    es: "y",
    fr: "et",
  },
  " do ônibus recebem os dados das crianças e fazem o check-in.": {
    en: " bus helpers receive the children's data and do the check-in.",
    es: " del autobús reciben los datos de los niños y hacen el check-in.",
    fr: " du bus reçoivent les données des enfants et font le check-in.",
  },
  "Abre em": {
    en: "Opens at",
    es: "Abre a las",
    fr: "Ouvre à",
  },
  "Fecha em": {
    en: "Closes at",
    es: "Cierra a las",
    fr: "Ferme à",
  },
  "🧪 Modo de teste ligado — igreja e ônibus estão liberados agora, independente da janela.": {
    en: "🧪 Test mode on — church and bus are open now, regardless of the window.",
    es: "🧪 Modo de prueba activado — iglesia y autobús están liberados ahora, independiente de la ventana.",
    fr: "🧪 Mode test activé — église et bus sont ouverts maintenant, indépendamment de la fenêtre.",
  },
  "O fim da janela precisa ser depois do início.": {
    en: "The end of the window must be after the start.",
    es: "El fin de la ventana debe ser después del inicio.",
    fr: "La fin de la fenêtre doit être après le début.",
  },
  "🟢 Aberta agora — fecha {when}": {
    en: "🟢 Open now — closes {when}",
    es: "🟢 Abierta ahora — cierra {when}",
    fr: "🟢 Ouverte maintenant — ferme {when}",
  },
  "🕒 Abre {from} até {until}": {
    en: "🕒 Opens {from} until {until}",
    es: "🕒 Abre {from} hasta {until}",
    fr: "🕒 Ouvre {from} jusqu'à {until}",
  },
  "⚫ Fechada — era {from} até {until}": {
    en: "⚫ Closed — was {from} until {until}",
    es: "⚫ Cerrada — era {from} hasta {until}",
    fr: "⚫ Fermée — c'était {from} jusqu'à {until}",
  },
  "Janela salva — está aberta agora.": {
    en: "Window saved — it's open now.",
    es: "Ventana guardada — está abierta ahora.",
    fr: "Fenêtre enregistrée — elle est ouverte maintenant.",
  },
  "Janela salva.": {
    en: "Window saved.",
    es: "Ventana guardada.",
    fr: "Fenêtre enregistrée.",
  },
  "Salvar horário ⏰": {
    en: "Save schedule ⏰",
    es: "Guardar horario ⏰",
    fr: "Enregistrer l'horaire ⏰",
  },
  "Janela da volta para a igreja": {
    en: "Return-to-church window",
    es: "Ventana de la vuelta a la iglesia",
    fr: "Fenêtre du retour à l'église",
  },
  "Horário em que os ajudantes fazem a chamada no ônibus antes de sair do acampamento.": {
    en: "Time when helpers take roll call on the bus before leaving camp.",
    es: "Horario en que los ayudantes hacen la lista en el autobús antes de salir del campamento.",
    fr: "Horaire où les aides font l'appel dans le bus avant de quitter le camp.",
  },
  "Janela da volta salva — está aberta agora.": {
    en: "Return window saved — it's open now.",
    es: "Ventana de la vuelta guardada — está abierta ahora.",
    fr: "Fenêtre du retour enregistrée — elle est ouverte maintenant.",
  },
  "Janela da volta salva.": {
    en: "Return window saved.",
    es: "Ventana de la vuelta guardada.",
    fr: "Fenêtre du retour enregistrée.",
  },
  "Salvar volta": {
    en: "Save return",
    es: "Guardar vuelta",
    fr: "Enregistrer le retour",
  },
  "⛪ Ajudantes do check-in na igreja": {
    en: "⛪ Church check-in helpers",
    es: "⛪ Ayudantes del check-in en la iglesia",
    fr: "⛪ Aides du check-in à l'église",
  },
  "Durante a janela, veem": {
    en: "During the window, they see",
    es: "Durante la ventana, ven",
    fr: "Pendant la fenêtre, ils voient",
  },
  "todas as crianças": {
    en: "all the children",
    es: "todos los niños",
    fr: "tous les enfants",
  },
  " (com os dados de saúde, para conferir com os pais)": {
    en: " (with health data, to check with the parents)",
    es: " (con los datos de salud, para verificar con los padres)",
    fr: " (avec les données de santé, pour vérifier avec les parents)",
  },
  "Adicionar ajudante da igreja": {
    en: "Add church helper",
    es: "Añadir ayudante de la iglesia",
    fr: "Ajouter un aide de l'église",
  },
  "Ninguém escolhido. Só o admin faz o check-in na igreja.": {
    en: "No one chosen. Only the admin does church check-in.",
    es: "Nadie elegido. Solo el admin hace el check-in en la iglesia.",
    fr: "Personne choisie. Seul l'admin fait le check-in à l'église.",
  },
  "📍 Pontos de encontro da equipe": {
    en: "📍 Staff meeting points",
    es: "📍 Puntos de encuentro del equipo",
    fr: "📍 Points de rendez-vous de l'équipe",
  },
  "Novo ponto": {
    en: "New point",
    es: "Nuevo punto",
    fr: "Nouveau point",
  },
  "➕ Novo ponto": {
    en: "➕ New point",
    es: "➕ Nuevo punto",
    fr: "➕ Nouveau point",
  },
  "Cada pessoa da equipe faz o": {
    en: "Each staff member does their",
    es: "Cada persona del equipo hace su",
    fr: "Chaque personne de l'équipe fait son",
  },
  "próprio check-in": {
    en: "own check-in",
    es: "propio check-in",
    fr: "propre check-in",
  },
  " pelo celular ao chegar em um destes pontos (a igreja, o acampamento para quem vai direto…), dentro do raio.": {
    en: " on their phone when they arrive at one of these points (the church, the campsite for those going straight there…), within the radius.",
    es: " por el celular al llegar a uno de estos puntos (la iglesia, el campamento para quien va directo…), dentro del radio.",
    fr: " sur le téléphone à l'arrivée à l'un de ces points (l'église, le camp pour ceux qui y vont directement…), dans le rayon.",
  },
  "Raio (metros)": {
    en: "Radius (meters)",
    es: "Radio (metros)",
    fr: "Rayon (mètres)",
  },
  "Latitude": {
    en: "Latitude",
    es: "Latitud",
    fr: "Latitude",
  },
  "Longitude": {
    en: "Longitude",
    es: "Longitud",
    fr: "Longitude",
  },
  "Igreja, Acampamento…": {
    en: "Church, Campsite…",
    es: "Iglesia, Campamento…",
    fr: "Église, Camp…",
  },
  "Dê um nome ao ponto.": {
    en: "Give the point a name.",
    es: "Pon un nombre al punto.",
    fr: "Donnez un nom au point.",
  },
  "Latitude entre -90 e 90, longitude entre -180 e 180.": {
    en: "Latitude between -90 and 90, longitude between -180 and 180.",
    es: "Latitud entre -90 y 90, longitud entre -180 y 180.",
    fr: "Latitude entre -90 et 90, longitude entre -180 et 180.",
  },
  "O raio precisa estar entre {min} e {max} metros.": {
    en: "Radius must be between {min} and {max} meters.",
    es: "El radio debe estar entre {min} y {max} metros.",
    fr: "Le rayon doit être entre {min} et {max} mètres.",
  },
  "Informe latitude e longitude.": {
    en: "Enter latitude and longitude.",
    es: "Indica latitud y longitud.",
    fr: "Indiquez latitude et longitude.",
  },
  "Abrir no Google Maps": {
    en: "Open in Google Maps",
    es: "Abrir en Google Maps",
    fr: "Ouvrir dans Google Maps",
  },
  "🗑️ Remover ponto": {
    en: "🗑️ Remove point",
    es: "🗑️ Quitar punto",
    fr: "🗑️ Retirer le point",
  },
  "Dica: no Google Maps, clique com o botão direito no local e copie as coordenadas (dá para colar as duas de uma vez no campo Latitude), ou arraste o 📍 no mapa. 200–500 m é um bom raio.": {
    en: "Tip: in Google Maps, right-click the place and copy the coordinates (you can paste both at once into Latitude), or drag the 📍 on the map. 200–500 m is a good radius.",
    es: "Consejo: en Google Maps, haz clic derecho en el lugar y copia las coordenadas (puedes pegar las dos de una vez en Latitud), o arrastra el 📍 en el mapa. 200–500 m es un buen radio.",
    fr: "Astuce : dans Google Maps, cliquez droit sur le lieu et copiez les coordonnées (vous pouvez coller les deux d'un coup dans Latitude), ou faites glisser le 📍 sur la carte. 200–500 m est un bon rayon.",
  },
  "↺ Adicionar padrão (IPAlpha Tamboré)": {
    en: "↺ Add default (IPAlpha Tamboré)",
    es: "↺ Añadir predeterminado (IPAlpha Tamboré)",
    fr: "↺ Ajouter le défaut (IPAlpha Tamboré)",
  },
  "Pontos salvos! A equipe já pode usar no dia da saída.": {
    en: "Points saved! Staff can already use them on departure day.",
    es: "¡Puntos guardados! El equipo ya puede usarlos el día de la salida.",
    fr: "Points enregistrés ! L'équipe peut déjà les utiliser le jour du départ.",
  },
  "Salvar pontos 📍": {
    en: "Save points 📍",
    es: "Guardar puntos 📍",
    fr: "Enregistrer les points 📍",
  },
  "🧹 Zerar check-ins": {
    en: "🧹 Reset check-ins",
    es: "🧹 Resetear check-ins",
    fr: "🧹 Réinitialiser les check-ins",
  },
  "Apaga o check-in de todas as crianças (igreja, ida e volta), da equipe, os coletes e o histórico.": {
    en: "Clears check-in for all children (church, outbound and return), staff, the vests, and the history.",
    es: "Borra el check-in de todos los niños (iglesia, ida y vuelta), del equipo, los chalecos y el historial.",
    fr: "Efface le check-in de tous les enfants (église, aller et retour), de l'équipe, les gilets et l'historique.",
  },
  "Check-ins zerados.": {
    en: "Check-ins reset.",
    es: "Check-ins reseteados.",
    fr: "Check-ins réinitialisés.",
  },
  "Zerando…": {
    en: "Resetting…",
    es: "Reseteando…",
    fr: "Réinitialisation…",
  },
  "🧹 Zerar check-ins ({kids} crianças · {staff} equipe)": {
    en: "🧹 Reset check-ins ({kids} children · {staff} staff)",
    es: "🧹 Resetear check-ins ({kids} niños · {staff} equipo)",
    fr: "🧹 Réinitialiser les check-ins ({kids} enfants · {staff} équipe)",
  },
};
