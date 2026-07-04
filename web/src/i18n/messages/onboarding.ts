// User-facing strings for the interactive onboarding tour (Feature 1) plus the
// "Restart Tutorial" block in Settings > Account. One namespace per file; the
// i18n index auto-merges this under `onboarding.*`.
export default {
  en: {
    progress: "Step {step} of {total}",
    skip: "Skip tutorial",
    next: "Next",
    start: "Start",
    startTrading: "Start trading",
    close: "Close tutorial",
    steps: {
      welcome: {
        title: "Welcome to {app}",
        body: "This short tutorial walks you through the key features. It takes about 3 minutes.",
      },
      sidebar: {
        title: "The sidebar",
        body: "The sidebar is your main navigation. You can collapse it to save space using the arrow icon.",
        bodyMobile: "The menu is your main navigation. On your phone it lives behind the ☰ button in the top-left corner.",
        action: "Tap the collapse arrow to continue",
        actionMobile: "Tap ☰ to open the menu",
      },
      portfolio: {
        title: "Portfolio overview",
        body: "Your portfolio value is always visible here. Click any token to see its detail page.",
        action: "Tap anywhere on the portfolio section",
      },
      modes: {
        title: "Trading modes",
        body: "This controls whether the AI and bot can trade. Read-only means only you can trade manually. Never change this accidentally — always read the warning before switching to Live.",
      },
      manual: {
        title: "Manual trading",
        body: "Place manual trades here. Your trades never need approval — they execute immediately.",
        action: "Tap the Manual tab",
      },
      bot: {
        title: "Bot trading and AI",
        body: "The AI trading features live here. AI trading requires a Premium subscription and your own AI API key.",
        action: "Tap the Bot tab",
      },
      academy: {
        title: "The Academy",
        body: "The Academy has free courses for all levels — from absolute beginner to expert. You can access it without being logged in.",
        action: "Tap the Academy link",
        actionMobile: "Open the menu (☰), then tap Academy",
      },
      done: {
        title: "You're ready",
        body: "Explore the app at your own pace. The Academy is always there if you have questions.",
      },
    },
    account: {
      title: "Tutorial",
      hint: "Replay the interactive walkthrough of the app's key features at any time.",
      restart: "Restart Tutorial",
      error: "Could not restart the tutorial. Please try again.",
    },
  },

  nl: {
    progress: "Stap {step} van {total}",
    skip: "Rondleiding overslaan",
    next: "Volgende",
    start: "Starten",
    startTrading: "Begin met handelen",
    close: "Rondleiding sluiten",
    steps: {
      welcome: {
        title: "Welkom bij {app}",
        body: "Deze korte rondleiding neemt je mee langs de belangrijkste functies. Het duurt ongeveer 3 minuten.",
      },
      sidebar: {
        title: "De zijbalk",
        body: "De zijbalk is je belangrijkste navigatie. Je kunt hem inklappen om ruimte te besparen via het pijltje.",
        bodyMobile: "Het menu is je belangrijkste navigatie. Op je telefoon zit het achter de ☰-knop linksboven.",
        action: "Tik op het inklap-pijltje om verder te gaan",
        actionMobile: "Tik op ☰ om het menu te openen",
      },
      portfolio: {
        title: "Portefeuille-overzicht",
        body: "De waarde van je portefeuille is hier altijd zichtbaar. Klik op een token om de detailpagina te bekijken.",
        action: "Tik ergens op het portefeuillegedeelte",
      },
      modes: {
        title: "Handelsmodi",
        body: "Dit bepaalt of de AI en de bot mogen handelen. Read-only betekent dat alleen jij handmatig kunt handelen. Wijzig dit nooit per ongeluk — lees altijd de waarschuwing voordat je naar Live schakelt.",
      },
      manual: {
        title: "Handmatig handelen",
        body: "Plaats hier handmatige orders. Jouw orders hebben nooit goedkeuring nodig — ze worden direct uitgevoerd.",
        action: "Tik op het tabblad Handmatig",
      },
      bot: {
        title: "Bothandel en AI",
        body: "Hier vind je de AI-handelsfuncties. AI-handel vereist een Premium-abonnement en je eigen AI-API-sleutel.",
        action: "Tik op het tabblad Bot",
      },
      academy: {
        title: "De Academy",
        body: "De Academy biedt gratis cursussen voor elk niveau — van absolute beginner tot expert. Je kunt er ook zonder in te loggen bij.",
        action: "Tik op de Academy-link",
        actionMobile: "Open het menu (☰) en tik op Academy",
      },
      done: {
        title: "Je bent er klaar voor",
        body: "Verken de app op je eigen tempo. De Academy staat altijd voor je klaar als je vragen hebt.",
      },
    },
    account: {
      title: "Rondleiding",
      hint: "Speel de interactieve rondleiding langs de belangrijkste functies op elk moment opnieuw af.",
      restart: "Rondleiding opnieuw starten",
      error: "De rondleiding kon niet opnieuw worden gestart. Probeer het nog eens.",
    },
  },

  fr: {
    progress: "Étape {step} sur {total}",
    skip: "Passer le tutoriel",
    next: "Suivant",
    start: "Commencer",
    startTrading: "Commencer à trader",
    close: "Fermer le tutoriel",
    steps: {
      welcome: {
        title: "Bienvenue sur {app}",
        body: "Ce court tutoriel vous présente les fonctions essentielles. Il dure environ 3 minutes.",
      },
      sidebar: {
        title: "La barre latérale",
        body: "La barre latérale est votre navigation principale. Vous pouvez la replier pour gagner de la place grâce à la flèche.",
        bodyMobile: "Le menu est votre navigation principale. Sur téléphone, il se trouve derrière le bouton ☰ en haut à gauche.",
        action: "Touchez la flèche de repli pour continuer",
        actionMobile: "Touchez ☰ pour ouvrir le menu",
      },
      portfolio: {
        title: "Aperçu du portefeuille",
        body: "La valeur de votre portefeuille est toujours visible ici. Cliquez sur un jeton pour ouvrir sa page de détail.",
        action: "Touchez n'importe où dans la section portefeuille",
      },
      modes: {
        title: "Modes de trading",
        body: "Ce réglage détermine si l'IA et le bot peuvent trader. Read-only signifie que vous seul pouvez trader manuellement. Ne le changez jamais par accident — lisez toujours l'avertissement avant de passer en Live.",
      },
      manual: {
        title: "Trading manuel",
        body: "Placez vos ordres manuels ici. Vos ordres ne nécessitent jamais d'approbation — ils sont exécutés immédiatement.",
        action: "Touchez l'onglet Manuel",
      },
      bot: {
        title: "Trading bot et IA",
        body: "Les fonctions de trading IA se trouvent ici. Le trading IA nécessite un abonnement Premium et votre propre clé API d'IA.",
        action: "Touchez l'onglet Bot",
      },
      academy: {
        title: "L'Academy",
        body: "L'Academy propose des cours gratuits pour tous les niveaux — du débutant complet à l'expert. Elle est accessible même sans être connecté.",
        action: "Touchez le lien Academy",
        actionMobile: "Ouvrez le menu (☰), puis touchez Academy",
      },
      done: {
        title: "Vous êtes prêt",
        body: "Explorez l'application à votre rythme. L'Academy est toujours là si vous avez des questions.",
      },
    },
    account: {
      title: "Tutoriel",
      hint: "Rejouez à tout moment la visite interactive des fonctions essentielles.",
      restart: "Relancer le tutoriel",
      error: "Impossible de relancer le tutoriel. Veuillez réessayer.",
    },
  },

  es: {
    progress: "Paso {step} de {total}",
    skip: "Saltar el tutorial",
    next: "Siguiente",
    start: "Empezar",
    startTrading: "Empezar a operar",
    close: "Cerrar el tutorial",
    steps: {
      welcome: {
        title: "Bienvenido a {app}",
        body: "Este breve tutorial te muestra las funciones clave. Dura unos 3 minutos.",
      },
      sidebar: {
        title: "La barra lateral",
        body: "La barra lateral es tu navegación principal. Puedes plegarla para ganar espacio con la flecha.",
        bodyMobile: "El menú es tu navegación principal. En el móvil está detrás del botón ☰, arriba a la izquierda.",
        action: "Toca la flecha de plegado para continuar",
        actionMobile: "Toca ☰ para abrir el menú",
      },
      portfolio: {
        title: "Resumen de la cartera",
        body: "El valor de tu cartera siempre está visible aquí. Haz clic en cualquier token para ver su página de detalle.",
        action: "Toca en cualquier parte de la sección de cartera",
      },
      modes: {
        title: "Modos de trading",
        body: "Esto controla si la IA y el bot pueden operar. Read-only significa que solo tú puedes operar manualmente. No lo cambies nunca por accidente — lee siempre la advertencia antes de pasar a Live.",
      },
      manual: {
        title: "Trading manual",
        body: "Coloca aquí tus órdenes manuales. Tus órdenes nunca necesitan aprobación — se ejecutan de inmediato.",
        action: "Toca la pestaña Manual",
      },
      bot: {
        title: "Trading con bot e IA",
        body: "Las funciones de trading con IA viven aquí. El trading con IA requiere una suscripción Premium y tu propia clave API de IA.",
        action: "Toca la pestaña Bot",
      },
      academy: {
        title: "La Academy",
        body: "La Academy ofrece cursos gratuitos para todos los niveles — desde principiante absoluto hasta experto. Puedes acceder sin iniciar sesión.",
        action: "Toca el enlace de la Academy",
        actionMobile: "Abre el menú (☰) y toca Academy",
      },
      done: {
        title: "Todo listo",
        body: "Explora la aplicación a tu ritmo. La Academy siempre está ahí si tienes dudas.",
      },
    },
    account: {
      title: "Tutorial",
      hint: "Vuelve a reproducir el recorrido interactivo por las funciones clave cuando quieras.",
      restart: "Reiniciar el tutorial",
      error: "No se pudo reiniciar el tutorial. Inténtalo de nuevo.",
    },
  },
};
