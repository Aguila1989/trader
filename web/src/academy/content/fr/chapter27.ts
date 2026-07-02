// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on core technical-analysis indicators: moving averages, RSI,
// MACD, Bollinger Bands, and how to combine a small confluent set without
// drowning in conflicting signals. Authored to the exact same shape as
// content/en/chapter22.ts, with the per-chapter `whoFor` one-liner typed via a
// local intersection so the live Chapter interface stays untouched. This chapter
// owns no new glossary terms; it only reuses terms taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter27: Chapter & { whoFor: string } = {
  id: "c27",
  number: 27,
  level: "ADVANCED",
  whoFor: "Pour les traders prêts à lire les indicateurs qui se cachent derrière le prix",
  title: "Analyse technique — Les indicateurs essentiels",
  description:
    "Les moyennes mobiles, le RSI, le MACD et les bandes de Bollinger — ce que chacun mesure, et comment en combiner un petit ensemble sans se noyer sous des signaux contradictoires.",
  lessons: [
    {
      id: "c27-l1",
      title: "Qu'est-ce qu'une moyenne mobile (MA) et comment l'utiliser ?",
      paragraphs: [
        "Une moyenne mobile lisse un prix en dents de scie pour le ramener à une seule ligne, en faisant la moyenne des N derniers cours de clôture à mesure que le temps avance. Elle ne prédit rien ; elle résume ce que le prix a déjà fait, en filtrant le bruit pour rendre une tendance plus facile à percevoir. Les traders observent si le prix se situe au-dessus ou en dessous de la ligne, et si la ligne elle-même monte ou descend.",
        "Les deux types courants diffèrent par la façon dont ils pondèrent les données. Une moyenne mobile simple (SMA) traite chaque prix de la fenêtre de manière égale. Une moyenne mobile exponentielle (EMA) accorde plus de poids aux prix récents, si bien qu'elle tourne plus vite lorsque le prix change, mais génère aussi davantage de faux signaux. Aucune n'est \"meilleure\" : la SMA est plus stable, l'EMA plus réactive, et le choix dépend de la vitesse à laquelle vous voulez réagir.",
        "Un exemple chiffré rend la chose concrète. Prenons cinq clôtures quotidiennes du XLM en USDC : 0,100, 0,104, 0,108, 0,112, 0,126. La SMA sur 5 périodes est leur simple moyenne, soit 0,110. Une EMA sur 5 périodes s'appuie bien davantage sur la dernière valeur, 0,126, et se situe autour de 0,116 — nettement plus haut parce que le récent bond domine. Si le prix vient ensuite à baisser, l'EMA reflue plus tôt que la SMA.",
        "Dans Atrium, vous observeriez ces tendances sur la page de détail du token, où le graphique de prix propose des onglets heure, jour, semaine et année, avec des chandeliers et du volume. Un onglet plus long (semaine ou année) associé à une SMA plus lente montre la tendance de fond ; un onglet plus court (heure ou jour) associé à une EMA réagit aux mouvements intrajournaliers. Il s'agit uniquement de lecture de graphique — Atrium ne trace pas d'indicateurs et ne passe pas d'ordres à votre place.",
      ],
      example:
        "Deux personnes décrivent une route vallonnée. Le marcheur SMA fait la moyenne des cinq derniers panneaux et qualifie la route de \"légèrement montante\". Le marcheur EMA s'appuie surtout sur le panneau le plus récent, qui indiquait justement \"montée raide\", et la décrit comme \"grimpant rapidement\". Tous deux ont raison sur les mêmes données ; l'EMA réagit simplement plus tôt à l'information la plus fraîche, au prix d'une réaction excessive à une seule bosse.",
    },
    {
      id: "c27-l2",
      title: "Qu'est-ce que le RSI (indice de force relative) ?",
      paragraphs: [
        "Le RSI est un oscillateur de momentum qui mesure la vitesse des variations récentes du prix sur une échelle fixe de 0 à 100. Il compare l'ampleur moyenne des mouvements de hausse à celle des mouvements de baisse sur une fenêtre d'observation, classiquement 14 périodes. Une valeur élevée signifie que les acheteurs ont fortement dominé ; une valeur basse signifie que ce sont les vendeurs. Parce qu'il est borné, le RSI se lit facilement d'un coup d'œil.",
        "Les signaux conventionnels sont les niveaux 70 et 30. Au-dessus de 70, l'actif est dit suracheté — il a monté rapidement et pourrait être dû pour une pause ou un repli. En dessous de 30, il est dit survendu — il a chuté rapidement et pourrait être dû pour un rebond. Certains traders surveillent aussi la ligne médiane à 50 comme séparateur approximatif de tendance, et guettent les divergences, lorsque le prix inscrit un nouveau sommet mais pas le RSI, laissant entendre que le mouvement perd de sa force.",
        "La mise en garde essentielle est que suracheté ne veut pas dire \"vendre maintenant\", et survendu ne veut pas dire \"acheter maintenant\". Dans une tendance forte, le RSI peut rester collé au-dessus de 70 pendant des jours ou des semaines tandis que le prix continue de grimper, et vendre à découvert chaque fois qu'il affiche 70 vous saignerait à blanc. Le RSI est le plus fiable dans un marché en range, sans direction ; dans une tendance puissante, il reste étiré et ses extrêmes induisent en erreur. Considérez-le comme une description du momentum, non comme un déclencheur autonome.",
        "Sur la page de détail du token d'Atrium, vous pourriez passer à l'onglet jour, lire les chandeliers et remarquer qu'un token qui s'envole sur un fort volume affichera probablement un RSI élevé — un contexte utile, mais qui n'est pas à lui seul une raison d'agir à contre-tendance.",
      ],
      example:
        "Lors d'un rallye rapide du XLM, le RSI sur le graphique jour atteint 78. Un trader qui vend à découvert par réflexe \"parce que c'est suracheté\" est stoppé alors que le prix continue de grimper pendant une semaine de plus, le RSI restant garé près de 80. La même valeur de 78 lors d'une semaine plate et bornée en range — où le prix ne cesse de caler et de refluer — aurait été un signal bien plus digne de confiance indiquant que la poussée était surétendue.",
    },
    {
      id: "c27-l3",
      title: "Qu'est-ce que le MACD et que vous dit-il sur le momentum ?",
      paragraphs: [
        "Le MACD (Moving Average Convergence Divergence) transforme deux moyennes mobiles en une lecture du momentum. La ligne MACD est la différence entre une EMA rapide et une EMA lente, classiquement la période 12 moins la période 26. Lorsque la moyenne rapide s'écarte au-dessus de la lente, le momentum se construit à la hausse ; lorsqu'elle passe en dessous, le momentum se retourne à la baisse. Le franchissement du zéro par la ligne MACD marque l'endroit où les deux moyennes se croisent réellement.",
        "Une deuxième ligne, la ligne de signal, est une EMA sur 9 périodes de la ligne MACD elle-même — une version lissée de celle-ci. L'événement phare est le croisement : lorsque la ligne MACD croise à la hausse à travers la ligne de signal, on y lit un renforcement du momentum haussier, et un croisement à la baisse un affaiblissement. Ces signaux sont en retard, car ils sont construits à partir de moyennes de prix passés ; ils confirment donc un changement plutôt qu'ils ne l'annoncent tôt.",
        "L'histogramme est le troisième élément : des barres montrant l'écart entre la ligne MACD et la ligne de signal. Des barres qui grandissent signifient que les deux lignes s'écartent et que le momentum s'accélère ; des barres qui rétrécissent signifient qu'elles convergent et que le momentum s'essouffle, ce qui précède souvent le croisement lui-même. Lire l'histogramme est un moyen de voir venir un retournement un temps avant que les lignes ne se croisent réellement.",
        "Comme tous les indicateurs présentés ici, le MACD décrit le momentum des prix qu'Atrium trace sur le graphique de détail du token ; il ne passe jamais de trade. Toute décision qui en découle transite quand même par les outils habituels de l'application et, en Trading par bot, par le seuil de confiance et les facteurs de risque de l'analyste IA.",
      ],
      example:
        "Le XLM coté en USDC glisse depuis quelque temps, et les barres de l'histogramme MACD sous le zéro commencent à rétrécir jour après jour, avant même que le prix ne se retourne — le momentum baissier s'essouffle. Quelques jours plus tard, la ligne MACD croise à la hausse à travers sa ligne de signal, confirmant le changement que l'histogramme laissait déjà présager. Un trader qui surveillait l'histogramme a été prévenu à l'avance ; celui qui a attendu le croisement a obtenu un signal plus tardif mais plus confirmé.",
    },
    {
      id: "c27-l4",
      title: "Que sont les bandes de Bollinger ?",
      paragraphs: [
        "Les bandes de Bollinger enveloppent une moyenne mobile dans deux bandes de volatilité. La ligne centrale est généralement une SMA sur 20 périodes. Les bandes supérieure et inférieure se situent à un nombre défini d'écarts-types de celle-ci — habituellement deux. Comme l'écart-type augmente lorsque le prix oscille largement et diminue lorsqu'il se calme, les bandes s'élargissent automatiquement dans les périodes volatiles et se resserrent dans les périodes calmes. Elles offrent une image de l'étirement et de la volatilité actuels du prix.",
        "Deux caractéristiques retiennent le plus l'attention. Un resserrement (squeeze) survient quand les bandes se rétrécissent fortement, signalant une volatilité inhabituellement basse — un ressort comprimé. Il vous indique qu'un mouvement plus ample est statistiquement plus probable prochainement, mais, point crucial, il ne vous en dit pas la direction. Un contact avec la bande supérieure ou inférieure signifie que le prix est loin de sa moyenne récente ; dans un range, cela précède souvent un retour vers le centre, mais dans une tendance forte le prix peut \"marcher le long de la bande\", en la longeant tout en poursuivant sa course.",
        "Les limites, en toute honnêteté, comptent. Les bandes de Bollinger ne prédisent pas où le prix se dirige. Un resserrement annonce que la volatilité devrait se dilater, non pas si la cassure part vers le haut ou vers le bas. Un contact avec une bande n'est pas un signal de retournement automatique. Elles décrivent la volatilité et l'écart à la moyenne — un contexte réellement utile, mais rien de plus. Associer un contact de bande à une lecture du RSI ou à un retournement du MACD vous apporte bien plus que les bandes seules.",
        "Vous liriez tout cela sur le graphique en chandeliers d'Atrium, sur la page de détail du token, en choisissant un onglet de période qui correspond à votre horizon — un onglet semaine pour une vision de swing, un onglet heure pour la volatilité intrajournalière.",
      ],
      example:
        "Sur le graphique semaine du XLM/USDC, les bandes de Bollinger se resserrent en un squeeze étroit après une quinzaine de jours calmes — la volatilité s'est asséchée. Quelques jours plus tard, le prix sort brutalement du range et les bandes s'écartent grand ouvertes. Le resserrement avait correctement averti qu'un mouvement d'ampleur arrivait ; il n'a jamais dit dans quel sens, si bien qu'un trader qui a parié une direction uniquement sur le resserrement ne faisait que deviner.",
    },
    {
      id: "c27-l5",
      title: "Comment combiner des indicateurs sans se perdre",
      paragraphs: [
        "L'erreur de débutant la plus courante est la surcharge d'indicateurs : empiler une dizaine d'outils sur un même graphique jusqu'à ce qu'ils se contredisent, puis se figer. Le RSI dit survendu, le MACD dit momentum baissier, les bandes disent resserrement — et vous n'avez aucune idée de quoi faire. Ajouter plus d'indicateurs n'ajoute pas plus de certitude. La plupart sont construits à partir des mêmes données de prix et de volume, si bien qu'un écran rempli d'indicateurs se répète en grande partie tout en donnant l'impression d'une confirmation indépendante.",
        "La solution est un petit ensemble délibérément convergent qui mesure des choses différentes. Un trio sensé : un outil de tendance (une moyenne mobile), un outil de momentum (RSI ou MACD) et un outil de volatilité (bandes de Bollinger). La confluence signifie que vous n'agissez que lorsqu'ils s'accordent — par exemple, un prix au-dessus d'une MA ascendante (tendance haussière), un RSI qui se redresse depuis une zone de survente (momentum qui se retourne) et un resserrement des bandes qui se résout à la hausse (volatilité qui se dilate dans votre sens). Lorsqu'ils divergent, la réponse honnête est le plus souvent de ne rien faire.",
        "Décidez de votre ensemble et de vos règles à l'avance, dans un moment de calme, exactement comme le chapitre 22 sur la psychologie du trading le préconise pour un plan de trading. Cela vous évite de saisir un nouvel indicateur chaque fois que ce que disent les indicateurs actuels vous déplaît — une forme de chasse à la confirmation qui ramène tout droit à la surcharge. Mieux vaut peu d'outils que vous comprenez en profondeur que beaucoup que vous lisez superficiellement.",
        "En pratique, vous liriez cette confluence directement sur le graphique de détail du token d'Atrium, en changeant d'onglet de période et en examinant les chandeliers et le volume, puis vous achemineriez toute décision via le formulaire manuel ou, en Trading par bot, vous la mettriez en balance avec le score de confiance de l'analyste IA. Il s'agit de contenu éducatif, non de conseil financier — aucun indicateur ni aucune combinaison ne garantit un résultat.",
      ],
      example:
        "Un trader qui surveille le XLM/USDC n'utilise que trois outils. Le prix se situe au-dessus d'une MA ascendante sur 50 périodes, le RSI est remonté de 32 à plus de 40, et un squeeze de Bollinger vient de casser à la hausse — trois choses différentes (tendance, momentum, volatilité) pointant toutes dans le même sens, si bien que le trade présente une réelle confluence. Une semaine plus tard, seule la MA est d'accord tandis que le RSI et les bandes sont neutres ; les signaux étant partagés, le geste discipliné est de rester à l'écart plutôt que de forcer.",
    },
  ],
  quiz: [
    {
      id: "c27-q1",
      prompt: "Étant donné les cinq clôtures 0,100, 0,104, 0,108, 0,112, 0,126, comment une EMA sur 5 périodes se compare-t-elle à la SMA sur 5 périodes de 0,110 ?",
      options: [
        {
          text: "L'EMA est plus haute que 0,110, parce qu'elle pondère plus fortement la valeur la plus récente, 0,126.",
          explanation:
            "Correct. Une EMA s'appuie sur les prix récents, si bien que le dernier bond à 0,126 la tire au-dessus de la SMA à pondération égale de 0,110 — ce qui explique précisément pourquoi une EMA réagit plus vite aux mouvements frais.",
        },
        {
          text: "L'EMA est plus basse que 0,110, parce qu'elle écarte le prix le plus récent.",
          explanation:
            "À l'envers. Une EMA n'écarte pas le prix le plus récent ; elle le met en avant. Cette valeur récente de 0,126 tire l'EMA vers le haut, pas vers le bas.",
        },
        {
          text: "L'EMA est égale à 0,110, parce que les deux moyennes produisent toujours le même nombre.",
          explanation:
            "Non. Elles ne coïncident que lorsque les prix sont plats. Avec une série ascendante, les pondérations différentes font diverger l'EMA et la SMA.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q2",
      prompt: "Le RSI sur le graphique jour est collé au-dessus de 70 depuis plus d'une semaine tandis que le prix continue de grimper. Que vous dit cela ?",
      options: [
        {
          text: "C'est un signal de vente garanti — le prix doit se retourner à l'instant où le RSI franchit 70.",
          explanation:
            "C'est le piège classique du RSI. Dans une tendance forte, le RSI peut rester suracheté longtemps, et vendre à découvert chaque fois qu'il affiche 70 saigne un trader à blanc.",
        },
        {
          text: "Le RSI est défaillant et devrait être totalement ignoré sur ce token.",
          explanation:
            "Pas du tout. Le RSI fonctionne exactement comme prévu — il reflète un momentum fort et soutenu. L'erreur est d'attendre de ses extrêmes qu'ils fassent office de déclencheurs de retournement dans une tendance.",
        },
        {
          text: "Dans une tendance forte, le RSI peut rester suracheté longtemps ; ses extrêmes sont bien plus fiables dans les marchés en range que dans les tendances.",
          explanation:
            "Correct. Suracheté ne veut pas dire \"vendre maintenant\". Les extrêmes 70/30 du RSI sont les plus dignes de confiance dans les ranges latéraux ; dans une tendance puissante, il reste étiré et induit en erreur.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c27-q3",
      prompt: "Que représente l'histogramme du MACD, et pourquoi les traders le surveillent-ils ?",
      options: [
        {
          text: "Il montre l'écart entre la ligne MACD et la ligne de signal ; des barres qui rétrécissent peuvent avertir d'un mouvement qui s'essouffle avant que les lignes ne se croisent réellement.",
          explanation:
            "Correct. L'histogramme est la distance entre les deux lignes. Des barres qui rétrécissent vers zéro signifient que le momentum converge, ce qui précède souvent le croisement lui-même — un avertissement précoce.",
        },
        {
          text: "Il montre le volume de trading brut de chaque chandelier.",
          explanation:
            "Non. Le volume est une série distincte (Atrium le trace sur le graphique du token). L'histogramme du MACD est l'écart entre la ligne MACD et sa ligne de signal.",
        },
        {
          text: "Il montre le solde du compte en USDC au fil du temps.",
          explanation:
            "Non. L'histogramme n'a rien à voir avec votre solde ; il n'est que la différence entre la ligne MACD et la ligne de signal.",
        },
        {
          text: "Il prédit l'objectif de prix futur exact de l'actif.",
          explanation:
            "Aucun indicateur ne prédit un prix exact. L'histogramme décrit le momentum en mesurant l'écart entre deux lignes — il ne prévoit rien de précis.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c27-q4",
      prompt: "Un resserrement des bandes de Bollinger apparaît sur le graphique. Que pouvez-vous légitimement en conclure ?",
      options: [
        {
          text: "Le prix est sur le point de monter, parce qu'un resserrement est un signal haussier.",
          explanation:
            "Un resserrement ne dit rien de la direction. Le lire comme haussier revient à deviner ; la cassure pourrait tout aussi bien se faire vers le bas.",
        },
        {
          text: "La volatilité est inhabituellement basse et un mouvement plus ample est statistiquement plus probable prochainement — mais le resserrement ne vous en dit pas la direction.",
          explanation:
            "Correct. Des bandes étroites signifient une volatilité basse, un ressort comprimé. Cela augmente la probabilité d'un mouvement plus ample, mais reste muet sur la hausse ou la baisse — c'est pourquoi les traders l'associent à d'autres outils.",
        },
        {
          text: "Le token a perdu sa ligne de confiance et ne peut plus être tradé.",
          explanation:
            "Sans rapport. Un resserrement est une lecture de volatilité sur le graphique de prix ; les lignes de confiance sont une adhésion au niveau du compte pour détenir un token et n'ont rien à voir avec la largeur des bandes.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c27-q5",
      prompt: "Votre graphique compte dix indicateurs et trois d'entre eux se contredisent désormais. Quelle est la réponse sensée ?",
      options: [
        {
          text: "Ajouter trois indicateurs de plus jusqu'à ce qu'une majorité s'accorde.",
          explanation:
            "C'est de la surcharge d'indicateurs. La plupart des indicateurs sont construits à partir des mêmes données de prix, si bien qu'en empiler davantage revient surtout à répéter l'information tout en donnant l'impression d'une confirmation nouvelle.",
        },
        {
          text: "Choisir l'indicateur qui dit justement ce que vous espériez entendre.",
          explanation:
            "C'est de la chasse à la confirmation — sélectionner l'outil qui flatte votre biais. Cela abandonne tout processus fondé sur des règles et ramène tout droit à la confusion.",
        },
        {
          text: "Réduire à un petit ensemble convergent — un outil de tendance, un de momentum, un de volatilité — et n'agir que lorsqu'ils s'accordent, sinon rester à l'écart.",
          explanation:
            "Correct. Un ensemble délibérément restreint qui mesure des choses différentes offre une réelle confluence. Lorsqu'ils divergent, le geste honnête est le plus souvent de ne rien faire, et l'ensemble devrait être choisi calmement à l'avance dans le cadre d'un plan de trading.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
