import type { Chapter } from "../../types";

export const chapter06: Chapter = {
  id: "c6",
  number: 6,
  level: "ADVANCED",
  title: "Stop loss suiveurs",
  description:
    "Un stop qui suit le prix vers le haut pour verrouiller le profit mais ne redescend jamais, et comment en configurer un ici.",
  lessons: [
    {
      id: "c6-l1",
      title: "Qu'est-ce qu'un stop loss suiveur ?",
      paragraphs: [
        "Un stop loss suiveur est une sortie protectrice dont le prix de déclenchement suit le marché en votre faveur mais jamais contre vous. Au lieu de fixer un prix unique, vous définissez une distance de suivi, et le bot maintient le déclencheur à cette distance sous le meilleur prix qu'il a vu.",
        "À mesure que le prix grimpe, le déclencheur grimpe avec lui par crans successifs, protégeant une part toujours plus grande de votre gain. Dès que le prix stagne ou recule suffisamment pour toucher le déclencheur, le stop se déclenche et clôture la position en traversant le carnet pour s'exécuter immédiatement, exactement comme un stop classique.",
        "L'application le dit clairement dans sa propre infobulle : un stop suiveur monte automatiquement quand le prix monte, verrouillant le profit, mais ne redescend jamais. Vous définissez la distance de suivi, en unités de prix ou en pourcentage. Cela laisse courir les positions gagnantes tout en plafonnant la part du mouvement que vous rendez.",
      ],
      example:
        "Vous détenez du XLM acheté autour de 0.110 USDC. Vous placez un stop suiveur avec un suivi de 5 pour cent. Au prix médian actuel de 0.120, le déclencheur initial se situe à 0.120 fois 0.95, soit 0.114. Le prix monte à 0.130, donc le déclencheur monte à 0.1235. Si le prix retombe ensuite à 0.1235, le stop se déclenche et vend, encaissant bien plus que votre prix d'entrée.",
    },
    {
      id: "c6-l2",
      title: "En quoi un stop loss suiveur diffère-t-il d'un stop loss classique ?",
      paragraphs: [
        "Un stop loss classique a un seul prix de déclenchement fixe que vous choisissez une fois et qui ne change jamais de lui-même. Il vous protège à la baisse, mais si le prix s'envole il ne fait rien pour capter ce nouveau profit. Il vous faudrait annuler et replacer un stop plus haut à la main.",
        "Un stop suiveur résout ce problème. Son déclencheur est calculé à partir d'une référence mobile, le meilleur prix vu jusqu'ici, moins votre distance de suivi. Il migre donc automatiquement vers le haut au fur et à mesure que la position progresse, et uniquement vers le haut. Il ne dérivera jamais de lui-même vers votre prix d'entrée.",
        "Les deux types de stop se comportent de façon identique quand ils se déclenchent : ils traversent le carnet pour s'exécuter tout de suite, en acceptant le prix actuel pour garantir la sortie. La seule différence est de savoir si le déclencheur est figé, comme pour un stop classique, ou auto-ajustable, comme pour un stop suiveur. Dans le panneau de stop loss, vous basculez de l'un à l'autre avec un commutateur.",
      ],
      example:
        "Deux stops sur du XLM acheté à 0.110. Un stop classique est figé à 0.105 pour toujours. Un stop suiveur placé 0.005 sous le prix démarre à 0.115 quand le médian est à 0.120. Le prix grimpe à 0.140 : le stop classique reste à 0.105, risquant tout le gain, tandis que le déclencheur suiveur a grimpé à 0.135, verrouillant environ 0.025 de profit par unité.",
    },
    {
      id: "c6-l3",
      title: "Qu'est-ce qu'un plus haut atteint et comment fonctionne-t-il ?",
      paragraphs: [
        "Le plus haut atteint est le chiffre unique qui fait fonctionner le suivi. Pour une position longue, c'est le prix le plus élevé que le bot a observé depuis la création du stop. Chaque nouveau tick est comparé à ce chiffre, et le repère ne se met à jour que lorsqu'un prix plus élevé arrive.",
        "Le déclencheur effectif découle toujours de ce repère : plus haut atteint fois (1 moins le pourcentage divisé par 100) pour un suivi en pourcentage, ou plus haut atteint moins le montant pour un suivi en montant. Comme le repère ne peut que monter, le déclencheur ne peut que monter. Un prix plus bas n'abaisse jamais le repère, donc il ne relâche jamais votre protection.",
        "Dans la liste des stops, chaque stop suiveur affiche un badge de suivi, le déclencheur actif en temps réel et une colonne Plus haut atteint, pour que vous puissiez voir le repère et le déclencheur évoluer ensemble en direct. Regarder cette colonne grimper cran par cran est l'image la plus claire du profit qui se verrouille pas à pas.",
      ],
      example:
        "Suivi en montant de 0.004 sur du XLM. Le médian est à 0.120, donc le repère est à 0.120 et le déclencheur à 0.116. Le prix passe par 0.123, 0.121, 0.128 : le repère ne suit que les nouveaux sommets, donc 0.123 puis 0.128, et le déclencheur monte à 0.119 puis 0.124. Le repli à 0.121 n'a touché ni l'un ni l'autre. Le déclencheur a fini à 0.124 et n'a jamais baissé.",
    },
    {
      id: "c6-l4",
      title: "Suivi en montant ou suivi en pourcentage — quand utiliser lequel ?",
      paragraphs: [
        "Quand vous choisissez un stop loss suiveur, vous choisissez aussi comment mesurer la distance : suivi en pourcentage ou suivi en montant. Un suivi en pourcentage évolue avec le prix, donc l'écart en valeur absolue grandit à mesure que l'actif s'apprécie. Un suivi en montant garde le même écart fixe en unités de prix, peu importe où va le prix.",
        "Les suivis en pourcentage conviennent aux actifs qui bougent de façon proportionnelle et aux positions que vous voulez tenir à travers de fortes hausses, car la marge de respiration s'élargit avec la position. Les suivis en montant conviennent à un risque serré et bien défini, comme une paire à stablecoin telle que XLM contre USDC, où vous raisonnez en unités de prix fixes et voulez une distance prévisible.",
        "Quel que soit votre choix, l'application prévisualise un prix de stop initial à partir du médian actuel, pour que vous puissiez vérifier la distance avant de valider. Si cet aperçu se situe trop près ou trop loin du prix à votre goût, ajustez le chiffre avant de créer le stop.",
      ],
      example:
        "XLM à un médian de 0.120. Un suivi de 5 pour cent donne un déclencheur initial de 0.114, soit un écart de 0.006. Un suivi en montant de 0.006 donne le même 0.114 aujourd'hui. Mais si le prix double à 0.240, le suivi en pourcentage se situe désormais à 0.012 d'écart tandis que le suivi en montant reste à seulement 0.006 d'écart, bien plus serré à ce prix plus élevé.",
    },
    {
      id: "c6-l5",
      title: "Comment placer un stop loss suiveur dans cette application (manuel et IA)",
      paragraphs: [
        "Pour en placer un manuellement, ouvrez le panneau de stop loss et basculez le commutateur sur stop loss suiveur. Choisissez suivi en pourcentage ou suivi en montant, saisissez la distance, et lisez l'aperçu du prix de stop initial que l'application calcule à partir du médian actuel. Quand l'aperçu vous semble correct, créez le stop et il rejoint la liste avec son badge de suivi.",
        "Une fois actif, vous ne le gérez pas tick par tick. Le bot tient à jour le plus haut atteint pour vous et recalcule le déclencheur à chaque mise à jour de prix, donc le déclencheur actif et les colonnes Plus haut atteint se mettent à jour tout seuls. Si le prix retombe jusqu'au déclencheur, il se déclenche et clôture en traversant le carnet pour s'exécuter tout de suite.",
        "Les stops suiveurs peuvent aussi être créés par l'IA plutôt qu'à la main. Un stop suiveur placé par l'IA apparaît dans la même liste avec le même badge de suivi, le même déclencheur actif et la même colonne Plus haut atteint, et il suit les mêmes règles de cran. Qu'il soit placé par vous ou par l'IA, la mécanique est exactement la même.",
      ],
      example:
        "Vous basculez sur stop loss suiveur, choisissez suivi en pourcentage, et saisissez 4. Avec le médian à 0.120, le panneau prévisualise un prix de stop initial de 0.1152. Vous le créez ; la liste affiche un badge de suivi, déclencheur 0.1152, plus haut atteint 0.120. Le prix culmine ensuite à 0.135, donc la colonne Plus haut atteint indique 0.135 et le déclencheur actif indique 0.1296.",
    },
  ],
  quiz: [
    {
      id: "c6-q1",
      prompt: "Quelle est la meilleure description d'un stop loss suiveur ?",
      options: [
        {
          text: "Une sortie protectrice dont le déclencheur suit le prix vers le haut à une distance fixée mais ne redescend jamais.",
          explanation:
            "Correct. Le déclencheur suit le meilleur prix à la distance que vous avez choisie et ne monte que par crans, verrouillant le profit.",
        },
        {
          text: "Un prix de déclenchement fixe que vous définissez une fois et qui ne change jamais.",
          explanation:
            "Cela décrit un stop loss classique, pas un stop suiveur. Le déclencheur d'un stop suiveur évolue vers le profit.",
        },
        {
          text: "Un ordre qui renforce automatiquement votre position quand le prix monte.",
          explanation:
            "Un stop suiveur n'achète jamais davantage. C'est une sortie qui clôture la position quand le prix retombe jusqu'au déclencheur mobile.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c6-q2",
      prompt:
        "Quelle est la différence clé entre un stop classique et un stop suiveur dans cette application ?",
      options: [
        {
          text: "Le stop classique s'exécute à un prix limite tandis que le stop suiveur ne s'exécute jamais.",
          explanation:
            "Faux. Les deux types de stop se déclenchent en traversant le carnet pour s'exécuter immédiatement ; aucun ne reste un ordre limite passif une fois déclenché.",
        },
        {
          text: "Le déclencheur du stop suiveur s'auto-ajuste vers le haut tandis que celui du stop classique reste figé.",
          explanation:
            "Correct. Un stop classique conserve un seul prix fixe ; le stop suiveur recalcule son déclencheur à partir du plus haut atteint qui monte.",
        },
        {
          text: "Le stop suiveur peut déplacer son déclencheur à la fois vers le haut et vers le bas pour suivre le prix.",
          explanation:
            "Faux. Le déclencheur suiveur ne se déplace que vers le haut, vers le profit ; il ne redescend jamais.",
        },
        {
          text: "Seul le stop classique peut être placé par l'IA.",
          explanation:
            "Faux. Les stops suiveurs peuvent être placés manuellement ou par l'IA, et apparaissent avec un badge de suivi dans les deux cas.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q3",
      prompt:
        "Sur une position longue, le prix passe par 0.120, puis 0.130, puis revient à 0.126, avec un suivi en montant de 0.005. Quel est le déclencheur après le repli à 0.126 ?",
      options: [
        {
          text: "0.121, car le déclencheur suit le dernier prix de 0.126 vers le bas.",
          explanation:
            "Faux. Le plus haut atteint ne baisse pas, donc le déclencheur ne baisse pas quand le prix recule.",
        },
        {
          text: "0.125, car le plus haut atteint est resté à 0.130 et 0.130 moins 0.005 fait 0.125.",
          explanation:
            "Correct. Le repère s'est verrouillé au sommet de 0.130, donc le déclencheur se maintient à 0.125 même si le prix glisse à 0.126.",
        },
        {
          text: "0.115, car le déclencheur est toujours à 0.005 sous le prix de départ de 0.120.",
          explanation:
            "Faux. Le déclencheur se mesure à partir du plus haut atteint, qui est monté à 0.130, et non à partir du prix de départ.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q4",
      prompt:
        "Pourquoi pourriez-vous préférer un suivi en montant à un suivi en pourcentage sur une paire à stablecoin comme XLM contre USDC ?",
      options: [
        {
          text: "Parce qu'un suivi en montant s'élargit automatiquement quand le prix monte.",
          explanation:
            "Faux. C'est le comportement du suivi en pourcentage. Un suivi en montant garde un écart fixe en unités de prix.",
        },
        {
          text: "Parce qu'un suivi en montant désactive le plus haut atteint.",
          explanation:
            "Faux. Les deux types de suivi utilisent le même plus haut atteint ; seul le calcul de la distance diffère.",
        },
        {
          text: "Parce que vous raisonnez en unités de prix fixes et voulez une distance prévisible et constante.",
          explanation:
            "Correct. Un suivi en montant conserve le même écart en unités de prix quel que soit le mouvement du prix, offrant un risque serré et prévisible.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c6-q5",
      prompt:
        "Quand vous placez un stop suiveur manuellement dans le panneau, qu'affiche l'application avant que vous le créiez ?",
      options: [
        {
          text: "Un aperçu du prix de stop initial calculé à partir du prix médian actuel.",
          explanation:
            "Correct. Après que vous avez basculé sur suiveur et saisi une distance, l'application prévisualise le déclencheur initial à partir du médian actuel pour que vous puissiez le vérifier.",
        },
        {
          text: "Un prix d'exécution garanti auquel le stop s'exécutera plus tard.",
          explanation:
            "Faux. Rien n'est garanti ; quand le stop se déclenche, il traverse le carnet pour s'exécuter au prix du moment.",
        },
        {
          text: "Le plus haut atteint final que le stop atteindra.",
          explanation:
            "Faux. Le plus haut atteint est inconnu à l'avance ; il ne se construit que lorsque le prix bouge après la création du stop.",
        },
        {
          text: "Une liste des transactions passées qui ont touché le même déclencheur.",
          explanation:
            "Faux. Le panneau affiche un aperçu du prix de stop initial, pas des exécutions historiques.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
