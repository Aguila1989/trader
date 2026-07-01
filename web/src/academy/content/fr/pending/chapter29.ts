// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapitre avancé sur les Stratégies de trading (day/swing/HODL, achats programmés,
// ratio risque/rendement, dimensionnement des positions et le pouvoir de ne rien faire).
// Rédigé exactement selon la même forme que content/en/chapter01.ts, avec le
// one-liner `whoFor` propre au chapitre typé via une intersection locale afin que
// l'interface Chapter en production reste intacte jusqu'à l'intégration. Ce chapitre
// ne possède aucun nouveau terme de glossaire ; il réutilise naturellement le
// vocabulaire introduit dans les chapitres précédents.
import type { Chapter } from "../../../types";

export const chapter29: Chapter & { whoFor: string } = {
  id: "c29",
  number: 29,
  level: "ADVANCED",
  whoFor: "Pour les traders qui choisissent un style et un dimensionnement qui leur conviennent",
  title: "Stratégies de trading",
  description:
    "Day trading, swing trading ou HODL, les achats programmés, le ratio risque/rendement, le dimensionnement des positions, et le pouvoir sous-estimé de ne rien faire.",
  lessons: [
    {
      id: "c29-l1",
      title: "Day trading, swing trading ou HODL — lequel vous convient ?",
      paragraphs: [
        "Ces trois styles diffèrent surtout par leur horizon temporel. Un day trader ouvre et ferme ses positions en l'espace de quelques heures, cherchant à capter de petits mouvements intrajournaliers et gardant rarement une position d'un jour à l'autre. Un swing trader conserve ses positions pendant des jours ou des semaines, chevauchant une tendance ou un retournement isolé et acceptant que les prix bougent brusquement pendant qu'il dort. Un HODLeur achète et conserve pendant des mois ou des années, ignorant le bruit et pariant sur la thèse de long terme d'un actif comme le XLM ou d'un token vers lequel il a ouvert une ligne de confiance.",
        "L'effort augmente avec la vitesse. Le day trading exige des heures de présence concentrée devant l'écran, une exécution rapide et une discipline stricte sur les frais et le slippage — sur Stellar, chaque exécution coûte de minuscules frais de réseau plus les frais de pool AMM de 0,30 % ou le spread du SDEX, et ces coûts s'accumulent lorsqu'on trade souvent. Le swing trading demande un point de contrôle quotidien et de la patience dans les phases de repli. Le HODL ne demande presque aucune attention quotidienne, mais il exige la force émotionnelle de tenir à travers de profondes baisses sans vendre dans la panique.",
        "Le tempérament est le véritable facteur décisif. Si surveiller l'écran en permanence vous stresse, le day trading finira par vous user, aussi bons que paraissent les setups. Si vous ne supportez pas de voir une position dans le rouge pendant une semaine, le swing trading vous fera sortir trop tôt. Soyez honnête sur le temps dont vous disposez et sur la volatilité que vous pouvez tolérer, puis choisissez le style le plus lent qui corresponde encore à vos objectifs — plus lent signifie généralement moins d'erreurs forcées et un coût cumulé plus faible.",
      ],
      example:
        "Supposons que vous déteniez des XLM et souhaitiez davantage d'exposition à l'USDC. Un day trader pourrait scalper cinq petits allers-retours XLM/USDC avant le déjeuner, payant des frais à chaque fois. Un swing trader placerait une seule entrée sur un repli et attendrait une semaine un mouvement plus important. Un HODLeur garderait simplement ses XLM et consulterait de temps en temps l'onglet semaine ou année de la page de détail du token. Même actif, trois modes de vie totalement différents — le bon est celui que vous pouvez tenir sans vous épuiser.",
    },
    {
      id: "c29-l2",
      title: "Qu'est-ce que l'achat programmé (DCA) ?",
      paragraphs: [
        "L'achat programmé, ou dollar-cost averaging (DCA), consiste à acheter un montant fixe d'un actif selon un calendrier fixe, quel que soit le prix du jour. Au lieu d'essayer de choisir le point d'entrée parfait, vous vous engagez à acheter, par exemple, 50 USDC de XLM chaque semaine ou chaque mois. Quand le prix est bas, votre montant fixe achète plus d'unités ; quand il est élevé, il en achète moins. Avec le temps, votre coût moyen se lisse, et vous ne placez jamais par accident la totalité de votre mise au plus mauvais moment.",
        "L'intérêt du DCA est de retirer l'émotion et le timing de la décision. Comme l'achat est mécanique, la peur de rater le coche (FOMO) ne peut pas vous pousser à trop acheter sur un pic, et la peur ne peut pas vous empêcher d'acheter sur un repli — le calendrier a déjà décidé pour vous. Vous renoncez à la chance d'une entrée en une fois parfaitement synchronisée en échange de constance et de nuits bien moins agitées. Le DCA fonctionne le mieux pour les actifs auxquels vous croyez sur le long terme, pas pour des coins que vous ne voudriez pas conserver à travers une baisse.",
        "Dans cette application, il n'existe pas de bouton d'achat récurrent automatique ; le DCA est donc une discipline que vous appliquez vous-même : un rappel de calendrier récurrent pour passer le même ordre de même taille VOUS VENDEZ des USDC / VOUS ACHETEZ des XLM à chaque intervalle. Notez que chaque achat constitue un événement imposable distinct dans la plupart des juridictions, alors tenez des registres — ceci est un conseil éducatif, pas un conseil fiscal, et les règles varient d'un pays à l'autre.",
      ],
      example:
        "Pensez à un plan d'épargne où vous mettez de côté 50 EUR chaque mois, quoi que fasse le marché. Vous n'étudiez pas les graphiques avant chaque versement ; vous payez simplement le premier du mois pendant des années. Si les prix baissent, vos 50 EUR achètent discrètement davantage ; s'ils montent, ils achètent moins. Faire du DCA sur le XLM, c'est exactement la même habitude : 50 USDC fixes chaque mois, prix ignoré, émotion retirée.",
    },
    {
      id: "c29-l3",
      title: "Qu'est-ce qu'un ratio risque/rendement et comment le calculer ?",
      paragraphs: [
        "Le ratio rendement/risque compare ce que vous pouvez gagner à ce que vous pouvez perdre sur un seul trade. Vous le calculez en divisant la distance de votre entrée à votre prix cible par la distance de votre entrée à votre stop-loss. Un ratio de 3:1 signifie que votre gain potentiel vaut trois fois votre risque potentiel — vous risquez une unité pour tenter d'en gagner trois.",
        "Ce ratio compte davantage que votre taux de réussite. Avec un rendement/risque de 3:1, vous pouvez vous tromper plus souvent que vous n'avez raison et sortir tout de même gagnant, car chaque gain paie plusieurs pertes. Un trade n'offrant que 1:1 ou pire vous oblige à gagner la plupart du temps rien que pour rentrer dans vos frais, ce qui est une manière fragile de trader. De nombreux traders fixent un minimum, comme refuser tout setup en dessous de 2:1, pour que les maths restent en leur faveur sur un grand nombre de trades.",
        "Le chapitre sur le prix cible et le prix d'invalidation, plus tôt dans l'Academy, montre comment placer ces deux niveaux sur un trade réel dans cette application — la cible est l'endroit où votre thèse porte ses fruits, et l'invalidation est le prix qui prouve que vous avez tort. L'analyste IA utilise la même idée : le rendement/risque impliqué par ces niveaux conditionne une proposition, si bien qu'un trade au rendement trop faible pour son risque est filtré avant même d'atteindre votre seuil de confiance. Fixez d'abord les niveaux, puis laissez le ratio vous dire si le trade vaut la peine d'être pris.",
      ],
      example:
        "Vous achetez du XLM à 0,12 USDC. Vous fixez une cible à 0,15 (un gain de 0,03) et un stop-loss à 0,11 (une perte de 0,01). Rendement/risque = 0,03 / 0,01 = 3:1. Même si seulement 4 trades de ce type sur 10 atteignent la cible et 6 touchent le stop, vous gagneriez à peu près +12 − 6 = +6 unités de risque sur dix trades — rentable malgré des pertes plus fréquentes que les gains. C'est le pouvoir tranquille d'exiger un ratio favorable.",
    },
    {
      id: "c29-l4",
      title: "Qu'est-ce que le dimensionnement des positions et pourquoi est-ce crucial ?",
      paragraphs: [
        "Le dimensionnement des positions consiste à décider quelle part de votre portefeuille engager sur un seul trade afin qu'une perte ne puisse pas vous nuire gravement. La règle courante est de ne risquer qu'un faible pourcentage — souvent 1 % à 2 % — de votre portefeuille total sur une même position. Élément crucial : vous dimensionnez à partir du risque, pas de l'excitation : choisissez d'abord votre stop-loss, puis calculez la taille de position qui fait que ce stop, s'il est touché, ne coûte que le pourcentage que vous avez choisi.",
        "C'est ce qui vous maintient en jeu. Un trader qui risque 2 % par trade peut en perdre dix d'affilée et conserver l'essentiel de son portefeuille intact pour se refaire ; un trader qui mise gros par conviction peut être ruiné par un seul mauvais pari. Un bon dimensionnement transforme une série de pertes d'une catastrophe en un repli surmontable, ce qui explique pourquoi les professionnels le jugent plus important que le choix des gagnants.",
        "Dans cette application, le facteur de risque Taille de position de l'IA gouverne exactement cela. Réglé sur BAS, il propose de petites tranches prudentes de votre solde par trade ; MOYEN et ÉLEVÉ autorisent des positions progressivement plus grandes. Il fonctionne de pair avec un plafond de trading strict et une barrière de pause sur drawdown, si bien que l'IA ne peut jamais miser discrètement tout votre portefeuille sur une seule idée. Le chapitre sur les Réglages de risque de l'IA : contrôle total couvre la mécanique précise des six facteurs — ici, il suffit de savoir que le levier Taille de position est votre ceinture de sécurité.",
      ],
      example:
        "Votre portefeuille est de 1 000 USDC et vous plafonnez le risque à 2 % (20 USDC) par trade. Vous voulez acheter du XLM à 0,12 avec un stop à 0,11 — un risque de 0,01 par unité. En divisant votre budget de risque de 20 USDC par le risque de 0,01 par unité, vous obtenez une position de 2 000 XLM (240 USDC). Si le stop est touché, vous perdez exactement 20 USDC — 2 % — pas une fortune. Mêmes maths, que vous dimensionniez à la main dans l'onglet Trading manuel ou que vous vous appuyiez sur le facteur Taille de position BAS de l'IA.",
    },
    {
      id: "c29-l5",
      title: "Quand ne rien faire — le pouvoir de détenir des stablecoins",
      paragraphs: [
        "Le cash est une position. Choisir de rester dans un stablecoin comme l'USDC et de ne passer aucun trade est une décision légitime, souvent gagnante — et non un manquement à agir. Quand les marchés sont hachés, sans direction ou n'offrent que de médiocres setups risque/rendement, le trade à la plus forte espérance de valeur est fréquemment l'absence de trade. Rester en USDC garde votre capital au sec et prêt pour une occasion réellement bonne, plutôt que de le laisser saigner sur des occasions marginales.",
        "Le danger, le reste du temps, c'est le surtrading. Chaque trade inutile paie des frais et du spread, invite le slippage, et donne à l'émotion une nouvelle chance de vous conduire à l'erreur. Forcer l'action par ennui ou par FOMO, c'est ainsi que de bons soldes s'érodent lentement. Ne rien faire ne coûte presque rien sur Stellar, au-delà de l'occasion d'un mouvement que vous avez laissé passer — et un gain manqué est bien moins coûteux qu'une perte forcée.",
        "En pratique, cela signifie être à l'aise pour conserver votre solde en USDC pendant de longues périodes, observer les graphiques de la page de détail du token et les propositions de l'IA, et ne déployer que lorsqu'un setup franchit votre propre barre. L'IA respecte cela aussi : sa barrière de pause sur drawdown arrête délibérément le trading après une perte définie, imposant une période de refroidissement. La patience est une stratégie, et l'USDC est l'endroit où vous attendez.",
      ],
      example:
        "Sur une semaine plate et sans direction, l'IA fait remonter trois propositions, chacune avec un rendement/risque médiocre d'environ 1,2:1 et une confiance sous votre seuil. Un trader agité les prend toutes les trois, paie des frais sur chacune, et termine la semaine légèrement en baisse. Vous, vous ne faites rien, gardez votre solde en USDC et restez à l'équilibre. Quand un setup net à 3:1 finit par apparaître la semaine suivante, vous avez la totalité du solde prête à y être dimensionnée — récompensé pour avoir su attendre.",
    },
  ],
  quiz: [
    {
      id: "c29-q1",
      prompt: "Vous avez un emploi à temps plein exigeant, vous n'aimez pas fixer les graphiques, et vous pouvez tenir confortablement une position à travers une semaine difficile. Quel style vous convient le plus probablement ?",
      options: [
        {
          text: "Le day trading, car clôturer chaque position dans la journée est l'approche la plus sûre.",
          explanation:
            "Le day trading exige des heures de présence concentrée devant l'écran et une exécution rapide, et ses exécutions fréquentes empilent les coûts de réseau, de pool et de spread. Il ne correspond ni à votre emploi du temps ni à votre aversion pour la surveillance des graphiques.",
        },
        {
          text: "Le swing trading ou le HODL, car tous deux tolèrent un rythme sans intervention constante et de conserver à travers des replis de court terme.",
          explanation:
            "Correct. Les deux styles ne nécessitent que des points de contrôle occasionnels et récompensent le tempérament capable de tenir à travers les replis sans paniquer — un bien meilleur ajustement pour une personne occupée à l'aise pour conserver à travers une semaine difficile.",
        },
        {
          text: "Le style qui affiche les rendements théoriques les plus élevés, quel que soit votre tempérament.",
          explanation:
            "Mauvais angle. Un style que vous ne pouvez pas tenir mène à des erreurs forcées et à l'épuisement. Le meilleur ajustement est le style le plus lent qui satisfait encore vos objectifs, choisi autour de votre temps et de votre tolérance.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q2",
      prompt: "Qu'est-ce qui décrit le mieux l'achat programmé (DCA) ?",
      options: [
        {
          text: "Acheter un montant fixe selon un calendrier fixe, quel que soit le prix actuel.",
          explanation:
            "Correct. Comme verser 50 EUR dans un plan d'épargne chaque mois, le DCA achète le même montant à chaque intervalle — plus d'unités quand c'est bon marché, moins quand c'est cher — retirant le timing et l'émotion de la décision.",
        },
        {
          text: "Attendre le prix le plus bas de l'année, puis tout acheter d'un coup.",
          explanation:
            "C'est du market timing en une seule fois, l'opposé du DCA. Personne ne repère de façon fiable le point bas annuel, et le DCA existe précisément pour éviter d'avoir à le faire.",
        },
        {
          text: "Vendre une fraction fixe de vos avoirs à chaque fois que le prix monte.",
          explanation:
            "Cela décrit une règle de sortie progressive ou de prise de bénéfices, pas le DCA. L'achat programmé consiste en des achats réguliers et planifiés, pas en des ventes déclenchées par le prix.",
        },
        {
          text: "Doubler la taille de votre achat après chaque semaine perdante pour vous refaire plus vite.",
          explanation:
            "C'est un pari de moyenne à la baisse de type martingale, qui fait croître le risque dangereusement. Le DCA garde le montant fixe à dessein, justement pour qu'il ne gonfle jamais.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c29-q3",
      prompt: "Vous entrez sur le XLM à 0,12 USDC, fixez une cible à 0,18 et un stop-loss à 0,10. Quel est le ratio rendement/risque ?",
      options: [
        {
          text: "1:1 — le trade est un pile ou face.",
          explanation:
            "Incorrect. Le rendement (0,18 − 0,12 = 0,06) et le risque (0,12 − 0,10 = 0,02) ne sont pas égaux, on est donc loin d'un 1:1.",
        },
        {
          text: "3:1 — un rendement de 0,06 divisé par un risque de 0,02.",
          explanation:
            "Correct. La distance jusqu'à la cible est de 0,06 et la distance jusqu'au stop est de 0,02, donc 0,06 / 0,02 = 3:1. Vous risquez une unité pour tenter d'en gagner trois, et vous pouvez vous tromper plus souvent que vous n'avez raison tout en restant rentable.",
        },
        {
          text: "0,33:1 — vous risquez trois pour en gagner un.",
          explanation:
            "Cela inverse la formule. Le rendement/risque divise la distance jusqu'à la cible par la distance jusqu'au stop, ce qui donne 3:1 ; le 1:3 inversé serait un mauvais setup que vous devriez généralement refuser.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q4",
      prompt: "Pourquoi le dimensionnement des positions est-il considéré comme si crucial, et en quoi le facteur de risque Taille de position de l'application aide-t-il ?",
      options: [
        {
          text: "Il garantit que chaque trade est rentable en ne choisissant que des entrées gagnantes.",
          explanation:
            "Aucune règle de dimensionnement ne peut garantir un gagnant. Le dimensionnement des positions contrôle combien une perte vous coûte, pas si le trade est gagnant.",
        },
        {
          text: "Il plafonne combien une seule perte peut vous nuire ; le facteur Taille de position réglé sur BAS propose de petites tranches prudentes par trade.",
          explanation:
            "Correct. Ne risquer qu'un faible pourcentage par trade vous permet de survivre à une série de pertes. Le facteur Taille de position de l'IA (BAS/MOYEN/ÉLEVÉ) module la fraction du solde par trade, de pair avec un plafond de trading strict et une barrière de pause sur drawdown.",
        },
        {
          text: "Il permet à l'IA de miser tout votre portefeuille sur son unique idée à la plus forte confiance.",
          explanation:
            "L'opposé d'un bon dimensionnement. Un plafond de trading strict et la barrière de drawdown existent précisément pour que l'IA ne puisse jamais parier tout le portefeuille sur un seul pari.",
        },
        {
          text: "Il supprime entièrement le besoin d'un stop-loss.",
          explanation:
            "À l'envers — le dimensionnement se déduit de votre stop-loss. Vous choisissez d'abord le stop, puis vous dimensionnez pour que le toucher ne coûte que le petit pourcentage que vous avez choisi.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c29-q5",
      prompt: "Les marchés sont hachés et chaque setup disponible n'offre qu'un rendement/risque médiocre sous votre barre. Quelle est souvent la meilleure décision ?",
      options: [
        {
          text: "Forcer quelques trades quand même pour que votre capital travaille toujours.",
          explanation:
            "C'est du surtrading. Chaque trade marginal paie des frais et du spread, invite le slippage, et offre à l'émotion une nouvelle chance de se tromper — une manière fiable de faire saigner un solde.",
        },
        {
          text: "Ne rien faire et garder votre solde en USDC jusqu'à ce qu'un setup réellement bon apparaisse.",
          explanation:
            "Correct. Le cash est une position. Rester dans un stablecoin garde votre capital au sec et prêt, évite les mauvais trades forcés, et ne coûte presque rien au-delà d'un mouvement laissé passer — bien moins coûteux qu'une perte forcée.",
        },
        {
          text: "Passer au day trading pour extraire du profit des petits mouvements.",
          explanation:
            "Trader plus vite sur un marché sans direction multiplie les coûts et les erreurs au lieu de les réduire. Des conditions hachées et de faible qualité appellent la patience, pas plus d'activité.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
