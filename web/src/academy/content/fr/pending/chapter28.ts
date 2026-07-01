// PENDING — do not activate until green light.
// Technical Analysis — Chart Patterns. An ADVANCED chapter on reading structure
// straight off the chart: support and resistance, trends, classic chart
// patterns, Fibonacci retracements, and applying them on this app's price
// graph. Authored to the exact same shape as content/en/chapter01.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../../types";

export const chapter28: Chapter & { whoFor: string } = {
  id: "c28",
  number: 28,
  level: "ADVANCED",
  whoFor: "Pour les traders qui veulent lire la structure directement sur le graphique",
  title: "Analyse technique — Les figures chartistes",
  description:
    "Les supports et résistances, les tendances, les figures chartistes classiques, les retracements de Fibonacci, et comment les appliquer sur le graphique de prix de cette application.",
  lessons: [
    {
      id: "c28-l1",
      title: "Qu'est-ce qu'un support et une résistance ?",
      paragraphs: [
        "Un support et une résistance sont des niveaux de prix où le marché a changé d'avis à plusieurs reprises. Pensez à un plancher et à un plafond. Le support est le plancher : un prix vers lequel le marché ne cesse de retomber mais peine à franchir vers le bas, parce que suffisamment d'acheteurs interviennent à cet endroit. La résistance est le plafond : un prix vers lequel le marché ne cesse de remonter mais peine à franchir vers le haut, parce que suffisamment de vendeurs apparaissent. Les deux sont la mémoire en action, marquant les niveaux où les foules du passé ont jugé qu'un prix était bon marché ou cher.",
        "Ces niveaux se forment parce que les traders s'en souviennent. Si XLM/USDC a rebondi trois fois sur 0,11, les acheteurs guettent un quatrième rebond et les vendeurs placent leurs ordres juste au-dessus, si bien que le niveau se renforce de lui-même. Sur le Stellar Decentralized Exchange, c'est littéral : le carnet d'ordres on-chain montre les offres d'achat en attente se regrouper près du support et les offres de vente près de la résistance, et la profondeur du carnet d'ordres fait partie de la façon dont l'application évalue la liquidité d'un token.",
        "Les niveaux ne tiennent pas éternellement. Lorsque le prix clôture franchement à travers un plancher ou un plafond sur un volume élevé, ce niveau cède et échange souvent de rôle. Une résistance franchie devient fréquemment un nouveau support, et un support franchi devient une nouvelle résistance, parce que la foule réancre ses attentes sur le nouveau niveau. Une faible incursion qui se retourne rapidement est plus probablement une fausse cassure qu'une vraie, d'où l'importance d'attendre une confirmation.",
      ],
      example:
        "Sur la page de détail du token XLM/USDC, le prix cale près de 0,12 lors de trois rallyes distincts sur une semaine — c'est une résistance, un plafond. À la quatrième tentative, une bougie clôture nettement au-dessus de 0,12 avec un bond des barres de volume. Au cours des deux jours suivants, le prix redescend vers 0,12 et tient. L'ancien plafond s'est mué en plancher : la résistance est devenue support, et le niveau que vous surveilliez compte toujours, simplement avec son rôle inversé.",
    },
    {
      id: "c28-l2",
      title: "Qu'est-ce qu'une tendance et comment l'identifier ?",
      paragraphs: [
        "Une tendance est la direction générale vers laquelle dérive le prix, en ignorant les petits zigzags du parcours. La manière propre de la lire consiste à observer les points de retournement — les sommets et les creux locaux. Une tendance haussière forme des sommets de plus en plus hauts et des creux de plus en plus hauts : chaque rallye dépasse un peu le sommet précédent, et chaque repli s'arrête au-dessus du creux précédent. Une tendance baissière est l'image miroir : des sommets de plus en plus bas et des creux de plus en plus bas, chaque rebond échouant plus tôt et chaque baisse allant plus profond.",
        "Quand aucun de ces schémas ne tient — les sommets et les creux se situent à peu près au même endroit — le marché évolue latéralement, rebondissant entre un support et une résistance horizontaux au lieu de suivre une tendance. Les tendances vivent aussi sur plusieurs échelles de temps à la fois : un token peut être dans une tendance haussière de plusieurs mois tout en imprimant en son sein une tendance baissière de deux jours. C'est pourquoi l'unité de temps que vous choisissez change la réponse, et pourquoi aligner votre trade sur la tendance de plus grande ampleur vaut généralement mieux que de la combattre.",
        "Une tendance n'est intacte que tant que sa structure ne se rompt pas. Une tendance haussière est remise en question dès l'instant où le prix forme un creux plus bas, en enfonçant un creux de retournement antérieur ; une tendance baissière est remise en question lorsque le prix forme un sommet plus haut. Cette rupture de structure est votre signal objectif indiquant que la direction pourrait changer, plutôt qu'un simple ressenti qu'elle est allée assez loin.",
      ],
      example:
        "En lisant XLM/USDC sur la vue hebdomadaire, vous tracez les mouvements : 0,10, retour à 0,09, montée à 0,115, retour à 0,10, montée à 0,13. Chaque sommet est plus haut que le précédent (0,115, puis 0,13) et chaque creux l'est aussi (0,09, puis 0,10) — des sommets plus hauts et des creux plus hauts d'école, donc la tendance est haussière. Si le repli suivant cassait au contraire sous 0,10 pour former un creux plus bas, la structure de la tendance haussière serait mise en doute et vous resserreriez vos hypothèses.",
    },
    {
      id: "c28-l3",
      title: "Les figures chartistes courantes",
      paragraphs: [
        "Les figures chartistes sont des formes récurrentes qui laissent deviner ce qu'une foule s'apprête à faire. Une tête-épaules est une figure de sommet : trois pics où celui du milieu (la tête) est le plus haut et les deux extérieurs (les épaules) sont plus bas et à peu près au même niveau. Une ligne tracée sous les deux creux qui les séparent est l'encolure. Lorsque le prix clôture sous cette encolure, cela signale que la tendance haussière s'est probablement essoufflée et qu'une baisse peut suivre. Retournez toute la forme à l'envers — un creux, un creux plus bas, puis un creux plus haut — et vous obtenez une tête-épaules inversée, une figure de creux qui laisse présager un retournement à la hausse.",
        "Un double sommet ressemble à la lettre M : le prix monte vers un sommet, se replie, remonte vers presque exactement le même sommet, et échoue de nouveau. Ce plafond rejeté deux fois suggère que les acheteurs sont à bout, et une chute sous le creux central le confirme. Un double creux en est le miroir, une forme en W : deux tentatives ratées de descendre plus bas, laissant entendre que les vendeurs sont à bout et qu'une hausse pourrait s'amorcer. Les deux figures ne sont en réalité qu'un support ou une résistance qui tient deux fois, dessiné sous une forme mémorable.",
        "Un fanion est une brève pause à l'intérieur d'un mouvement fort. Après une envolée marquée, le prix dérive latéralement ou légèrement à contre-courant du mouvement dans un petit rectangle incliné — le fanion — accroché au mouvement initial abrupt qui forme la hampe. Il se résout habituellement dans la direction du mouvement d'origine, comme si le marché avait repris son souffle avant de continuer. Aucune de ces formes n'est une garantie ; ce sont des probabilités qui s'améliorent quand le volume et la tendance générale sont en accord, et elles échouent assez souvent pour qu'un stop loss reste indispensable.",
      ],
      example:
        "Sur la vue journalière d'un token, vous voyez trois pics près de 0,14, 0,16 et 0,14 — une tête-épaules claire, avec l'encolure tracée à travers les deux creux vers 0,125. Le prix clôture ensuite sous 0,125 tandis que les barres de volume gonflent. La figure s'est déclenchée : la tendance haussière antérieure signale son essoufflement, et un trader utilisant l'onglet Trading manuel de l'application pourrait placer un stop loss juste au-dessus de l'épaule droite pour plafonner le risque si la cassure s'avère fausse.",
    },
    {
      id: "c28-l4",
      title: "Que sont les retracements de Fibonacci et comment les utiliser ?",
      paragraphs: [
        "Après un mouvement fort, le prix suit rarement une ligne droite — il se replie d'une partie du chemin avant, parfois, de reprendre. Les retracements de Fibonacci sont un ensemble de niveaux horizontaux que de nombreux traders utilisent pour estimer la profondeur possible de ce repli. Vous ancrez l'outil du début d'un mouvement jusqu'à sa fin, et il trace des lignes à des pourcentages fixes de cette amplitude. Les niveaux que les traders surveillent le plus sont 38,2 %, 50 % et 61,8 % — un retracement de 38,2 % est un repli superficiel, 61,8 % en est un profond qui rend l'essentiel du mouvement.",
        "L'idée est que ces ratios agissent comme un support potentiel dans une tendance haussière (ou une résistance dans une tendance baissière), des zones où un repli peut caler et la tendance peut reprendre. Le niveau des 50 % n'est pas véritablement un nombre de Fibonacci mais il est inclus par convention, parce que les prix rendent si souvent environ la moitié d'un mouvement. Bien utilisés, ces niveaux sont des candidats à surveiller, non des ordres : un endroit où chercher un rebond, idéalement là où un niveau de Fibonacci coïncide avec un support ou une résistance que vous avez déjà identifié de manière indépendante.",
        "Prenez garde à ne pas trop vous y fier. Les niveaux de Fibonacci sont en partie auto-réalisateurs — ils fonctionnent en partie parce qu'assez de traders surveillent les mêmes lignes — et il est facile de les tracer à partir de points de retournement soigneusement choisis jusqu'à ce que l'un semble coller. Traitez un niveau qui coïncide avec une structure antérieure ou un chiffre rond comme plus significatif, confirmez toujours par l'action des prix plutôt que d'acheter aveuglément sur une ligne, et protégez l'idée par un stop loss au cas où le repli se transformerait en un retournement complet.",
      ],
      example:
        "XLM/USDC monte de 0,10 jusqu'à 0,15, un mouvement de 0,05. En ancrant l'outil de Fibonacci de 0,10 à 0,15, le niveau des 38,2 % se situe près de 0,131, celui des 50 % près de 0,125 et celui des 61,8 % près de 0,119. Le prix se replie et se stabilise juste autour de 0,125 — le niveau des 50 % — qui se trouve aussi être une ancienne zone de résistance du mois dernier. Deux signaux indépendants pointant vers le même prix font de 0,125 un point plus crédible à surveiller pour une reprise de la tendance haussière qu'une ligne de Fibonacci isolée ne le serait.",
    },
    {
      id: "c28-l5",
      title: "Comment utiliser le graphique de prix de cette application pour l'analyse technique",
      paragraphs: [
        "La page de détail du token est l'endroit où tout cela se rejoint. Son graphique de prix comporte des onglets heure, jour, semaine et année, et chaque onglet est un angle de vue différent sur le même actif. Le chapitre Lire le marché explique déjà comment fonctionnent le graphique lui-même et les chandeliers, aussi cette leçon suppose que vous savez les lire et se concentre uniquement sur l'application des supports et résistances, des tendances et des figures à travers ces quatre onglets.",
        "Travaillez du haut vers le bas. Commencez par l'onglet année pour voir la tendance dominante et les principaux supports et résistances qui ont tenu sur le long terme — les grands planchers et plafonds qui méritent le respect. Descendez à l'onglet semaine pour situer les sommets et creux de mouvement qui définissent la tendance actuelle, puis à l'onglet jour pour trouver la figure que vous pourriez trader, comme un double creux ou un fanion. Enfin, utilisez l'onglet heure pour synchroniser une entrée près d'un niveau, en guettant une cassure ou un rebond plutôt qu'en devinant. Lisez les barres de volume en parallèle : une cassure de support ou de résistance sur un volume croissant est bien plus convaincante qu'une cassure sur un faible volume.",
        "Une fois que le graphique vous indique un niveau, transformez-le en plan à l'aide des propres outils de l'application. Un support auquel vous faites confiance devient un prix de stop loss dans l'onglet Trading manuel ; un niveau de résistance devient un prix cible ; et l'écart entre votre entrée et votre prix d'invalidation est exactement le ratio rendement/risque que l'application vérifie avant de laisser passer un trade. Ceci est de l'éducation, pas un conseil financier — les figures décrivent des probabilités, jamais des certitudes, aussi chaque lecture nécessite toujours une sortie définie.",
      ],
      example:
        "Vous voulez trader XLM/USDC. Sur l'onglet année, la tendance est clairement haussière avec un support de long terme à 0,09. L'onglet semaine montre des sommets plus hauts et des creux plus hauts toujours intacts. L'onglet jour imprime un fanion qui marque une pause après un rallye, et l'onglet heure montre le prix rebondir sur le bord inférieur du fanion à 0,118 sur un volume croissant. Vous achetez près de 0,118, placez le stop loss juste en dessous à 0,115 (invalidation), et fixez un prix cible sur le sommet antérieur de 0,14 — une lecture construite onglet par onglet, puis reliée aux outils de stop loss et de prix cible de l'application.",
    },
  ],
  quiz: [
    {
      id: "c28-q1",
      prompt: "Le prix remonte à plusieurs reprises vers 0,12 sur XLM/USDC mais échoue systématiquement à clôturer au-dessus. Que joue le rôle de 0,12, et que se passe-t-il souvent si le prix finit par clôturer franchement au-dessus ?",
      options: [
        {
          text: "C'est un support (un plancher) ; une clôture au-dessus signifie que le plancher s'est effondré.",
          explanation:
            "Les rôles sont inversés. Un niveau au-dessus duquel le prix échoue sans cesse à monter est un plafond — une résistance — et non un plancher. Le support est le niveau vers lequel le prix ne cesse de retomber tout en tenant au-dessus.",
        },
        {
          text: "C'est une résistance (un plafond) ; une fois franchie, elle se mue souvent en un nouveau support.",
          explanation:
            "Correct. Un niveau au-dessus, rejeté à plusieurs reprises, est une résistance. Lorsque le prix la franchit franchement en clôture, la foule réancre ses attentes et l'ancien plafond agit fréquemment comme un nouveau plancher lors du repli suivant.",
        },
        {
          text: "C'est une résistance, et une fois franchie elle disparaît entièrement et ne compte plus jamais.",
          explanation:
            "À moitié juste sur l'étiquette, faux sur la suite. Une résistance franchie ne s'évanouit que rarement ; elle change couramment de rôle pour devenir un support, si bien que le niveau continue de compter.",
        },
        {
          text: "C'est un niveau de Fibonacci, donc aucune confirmation ni aucun volume n'est nécessaire pour trader la cassure.",
          explanation:
            "Non. Il s'agit d'un niveau de résistance horizontal ordinaire, pas d'un retracement de Fibonacci, et trader n'importe quelle cassure aveuglément, sans volume ni confirmation, expose à se faire piéger par une fausse cassure.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q2",
      prompt: "Vous tracez les points de retournement sur l'onglet semaine et trouvez : 0,10, 0,09, 0,115, 0,10, 0,13. Comment classeriez-vous cette tendance ?",
      options: [
        {
          text: "Une tendance baissière, parce que le prix est parti de 0,10 et qu'il y a eu des replis.",
          explanation:
            "Des replis à eux seuls ne font pas une tendance baissière. Une tendance baissière exige des sommets plus bas et des creux plus bas ; ici les sommets (0,115 puis 0,13) et les creux (0,09 puis 0,10) montent tous les deux.",
        },
        {
          text: "Une plage latérale, parce que le prix ne cesse de rebondir de haut en bas.",
          explanation:
            "Une plage signifie que les sommets et les creux se situent à peu près au même niveau. Ici, chaque sommet et chaque creux est progressivement plus haut, donc c'est une tendance, pas une plage.",
        },
        {
          text: "Une tendance haussière, parce que les mouvements montrent des sommets plus hauts (0,115 puis 0,13) et des creux plus hauts (0,09 puis 0,10).",
          explanation:
            "Correct. La structure qui définit une tendance haussière est faite de sommets plus hauts et de creux plus hauts, et les deux sont présents ici ; la tendance est donc haussière jusqu'à ce qu'un creux plus bas rompe cette structure.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c28-q3",
      prompt: "Sur la vue journalière, vous voyez trois pics — un plus bas, un plus haut au milieu, puis un plus bas de nouveau — avec une ligne tracée sous les deux creux qui les séparent. Le prix clôture ensuite sous cette ligne sur un volume croissant. Quelle est cette figure et que suggère-t-elle ?",
      options: [
        {
          text: "Une tête-épaules, figure de sommet ; une clôture sous l'encolure signale que la tendance haussière peut s'essouffler et qu'une baisse pourrait suivre.",
          explanation:
            "Correct. Trois pics avec une tête plus haute au milieu et une encolure sous les creux forment une tête-épaules. Clôturer sous l'encolure, surtout sur un volume croissant, est le déclencheur qui avertit d'un possible retournement à la baisse.",
        },
        {
          text: "Un double creux (forme en W) signalant que les vendeurs sont épuisés et qu'une hausse est probable.",
          explanation:
            "Mauvaise forme. Un double creux est un W fait de deux creux ratés, une figure de fond. Trois pics dont celui du milieu est le plus haut forment un sommet, et ici le prix a cassé vers le bas, pas vers le haut.",
        },
        {
          text: "Un fanion haussier, signifiant que le mouvement antérieur va simplement se poursuivre à la hausse après une brève pause.",
          explanation:
            "Un fanion est une petite pause latérale accrochée à une hampe abrupte, non trois pics distincts avec une encolure. Et une cassure sous l'encolure pointe vers le bas, l'inverse d'un fanion qui se poursuit à la hausse.",
        },
        {
          text: "Une tête-épaules inversée, une figure de fond qui laisse présager un retournement à la hausse.",
          explanation:
            "Une tête-épaules inversée est cette forme retournée — un creux, un creux plus bas, puis un creux plus haut — et elle casse vers le haut. Ce qui est décrit ici est la version classique, à l'endroit, qui casse vers le bas.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c28-q4",
      prompt: "Après une envolée de 0,10 à 0,15, vous tracez un retracement de Fibonacci et le prix se stabilise près du niveau des 61,8 %, qui coïncide aussi avec une ancienne zone de résistance. Comment devriez-vous traiter cela ?",
      options: [
        {
          text: "Acheter immédiatement sans stop, parce qu'un niveau de Fibonacci à 61,8 % tient toujours.",
          explanation:
            "Aucun niveau ne tient toujours. Un retracement de 61,8 % est en réalité un repli profond qui rend l'essentiel du mouvement, et acheter sans stop vous laisse sans protection si le repli se transforme en un retournement complet.",
        },
        {
          text: "Le traiter comme une zone plus crédible à surveiller pour un rebond parce que deux signaux indépendants coïncident, tout en confirmant par le prix et en utilisant un stop loss.",
          explanation:
            "Correct. Un niveau de Fibonacci n'est qu'un candidat à surveiller, mais son poids grandit lorsqu'il chevauche une structure indépendante comme une résistance antérieure. Vous confirmez tout de même par l'action des prix et protégez l'idée par un stop.",
        },
        {
          text: "L'ignorer, puisque les niveaux de Fibonacci n'ont aucun sens et n'influencent jamais le prix.",
          explanation:
            "Trop dédaigneux. Les niveaux de Fibonacci sont en partie auto-réalisateurs parce que de nombreux traders surveillent les mêmes lignes ; ils peuvent donc compter — surtout là où ils s'alignent sur une structure réelle — même s'ils n'ont rien de magique.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c28-q5",
      prompt: "Vous voulez appliquer l'analyse technique sur le graphique de prix d'un token dans cette application, qui comporte des onglets heure, jour, semaine et année. Quel est le déroulé le plus judicieux ?",
      options: [
        {
          text: "N'utiliser que l'onglet heure, puisque le détail à court terme est tout ce qui compte pour n'importe quel trade.",
          explanation:
            "Travailler uniquement sur l'onglet heure, c'est avoir des œillères. Vous passeriez à côté de la tendance dominante et des principaux supports et résistances de long terme que révèlent les onglets semaine et année, et vous traderiez facilement à contre-courant de la vue d'ensemble.",
        },
        {
          text: "Travailler du haut vers le bas : l'onglet année pour la tendance dominante et les niveaux majeurs, l'onglet semaine pour les mouvements de la tendance actuelle, l'onglet jour pour une figure, et l'onglet heure pour synchroniser une entrée — en lisant le volume tout du long.",
          explanation:
            "Correct. Partir du large et resserrer maintient votre trade aligné sur la tendance de plus grande ampleur, trouve une figure tradable et synchronise l'entrée près d'un niveau, le volume confirmant toute cassure — puis le niveau devient un stop loss ou un prix cible dans l'application.",
        },
        {
          text: "Choisir le seul onglet qui montre en ce moment une forme qui vous plaît et ignorer les autres.",
          explanation:
            "Sélectionner un seul horizon de temps flatteur, c'est ainsi que les traders se dupent eux-mêmes. Une figure sur l'onglet jour peut pointer dans un sens tandis que la tendance annuelle pointe dans l'autre ; les onglets sont faits pour être lus ensemble, du haut vers le bas.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
