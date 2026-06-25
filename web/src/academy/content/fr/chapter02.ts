import type { Chapter } from "../../types";

export const chapter02: Chapter = {
  id: "c2",
  number: 2,
  level: "BASIC",
  title: "Comprendre les prix",
  description: "Comment les prix se forment dans le carnet d'ordres du SDEX, et pourquoi les bids, les asks, le spread, le slippage et la liquidite influencent tous ce que vous payez reellement.",
  lessons: [
    {
      id: "c2-l1",
      title: "Qu'est-ce qu'un prix de marche ?",
      paragraphs: [
        "Un prix de marche n'est pas une etiquette fixe imposee par une quelconque autorite. C'est simplement le prix auquel quelqu'un est pret a acheter et quelqu'un d'autre est pret a vendre, ici et maintenant. Quand vous voyez XLM cote en USDC, ce chiffre correspond au dernier accord conclu entre un acheteur et un vendeur, ou au meilleur prix actuellement propose.",
        "Comme les prix viennent des gens, ils bougent en permanence. Chaque nouvelle offre, chaque offre annulee ou chaque trade conclu peut faire monter ou descendre le chiffre. Il n'existe pas un seul prix vrai, seulement le prix auquel vous pouvez reellement transiger a cet instant.",
        "Ce bot lit les prix en direct depuis le Stellar Decentralized Exchange, le SDEX. La vue de detail du token les affiche sous forme de graphique de prix avec des chandeliers horaires, journaliers, hebdomadaires et annuels, pour que vous puissiez voir comment le prix convenu a derive dans le temps plutot que de ne voir que le dernier tick.",
      ],
      example: "Supposons que XLM se soit echange en dernier a 0.118 USDC. Une minute plus tard, les vendeurs abaissent leurs offres et le meilleur prix auquel vous pouvez acheter devient 0.117 USDC. Personne n'a annonce de changement ; le prix de marche a simplement bouge parce que le vendeur le moins cher pret a vendre a change. Le graphique en chandeliers afficherait cette petite baisse comme la derniere barre horaire.",
    },
    {
      id: "c2-l2",
      title: "Qu'est-ce qu'un carnet d'ordres et comment le lire ?",
      paragraphs: [
        "Un carnet d'ordres est une liste en direct de toutes les offres en attente d'achat et de vente d'un token. Le bot trade directement contre ce carnet sur le SDEX, plutot que contre un AMM a fonds mutualises. Dans l'onglet Trading manuel, le panneau Carnet d'ordres affiche deux listes empilees.",
        "Le cote vert, ce sont les bids : les gens qui veulent acheter, avec le prix le plus eleve en haut. Le cote rouge, ce sont les asks : les gens qui veulent vendre, avec le prix le plus bas en haut. Les deux meilleurs prix qui se font face au centre forment le haut du carnet, soit les prix immediats auxquels vous traiteriez.",
        "Chaque ligne indique aussi quel volume se trouve a ce prix. Dans le bot, vous pouvez cliquer sur un niveau de bid et il remplit ce prix exact dans le formulaire d'ordre, ce qui vous evite de le taper. Lire le carnet vous indique non seulement le prix, mais aussi combien vous pouvez trader avant que le prix ne se degrade.",
      ],
      example: "Vous ouvrez le Carnet d'ordres pour XLM et USDC. Le meilleur bid vert affiche 0.117 pour 4,000 XLM, et juste en dessous 0.116 pour 9,000 XLM. Le meilleur ask rouge affiche 0.119 pour 3,000 XLM. Donc 4,000 XLM pourraient se vendre a 0.117 ; en vendre davantage entamerait le niveau a 0.116. Cliquer sur le bid a 0.117 reporte instantanement ce prix dans votre formulaire d'ordre.",
    },
    {
      id: "c2-l3",
      title: "Qu'est-ce qu'un bid, un ask et un spread ?",
      paragraphs: [
        "Un bid est le prix qu'un acheteur propose de payer. Un ask est le prix qu'un vendeur souhaite recevoir. Le meilleur bid est toujours un peu plus bas que le meilleur ask, car personne ne propose de payer plus cher que ce que demande le vendeur le moins cher. L'ecart entre ces deux meilleurs prix, c'est le spread.",
        "Le bot affiche ce spread directement, mesure en points de base, ou un point de base vaut un centieme de pour cent. Une InfoTip dans l'application vous le definit : la difference entre le meilleur prix d'achat et le meilleur prix de vente, sachant qu'un spread plus large signifie un cout cache plus eleve par trade.",
        "Le spread compte parce que c'est un cout que vous payez simplement pour trader. Si vous achetez a l'ask et revendez immediatement au bid, vous perdez le spread. C'est pourquoi ce bot le surveille de pres ; la strategie ici consiste surtout a capturer de minuscules spreads, et un spread large peut effacer tout l'avantage.",
      ],
      example: "Si le meilleur bid pour XLM est 0.117 USDC et le meilleur ask est 0.119 USDC, le spread est de 0.002 USDC. Rapporte au prix, cela fait environ 1.7 pour cent, soit a peu pres 170 points de base, ce que le bot signalerait comme large. Achetez puis revendez aussitot, et vous seriez en perte de ces 0.002 par XLM avant tous les autres frais.",
    },
    {
      id: "c2-l4",
      title: "Qu'est-ce que le slippage et pourquoi survient-il ?",
      paragraphs: [
        "Le slippage est la difference entre le prix que vous attendiez et le prix que vous avez reellement obtenu. Vous voyez un token a un certain prix, mais au moment ou votre ordre s'execute, vous etes rempli a un prix legerement moins bon. Le formulaire d'ordre du bot comporte un champ Tolerance de slippage ou vous fixez le maximum que vous etes pret a accepter.",
        "Cela arrive pour deux raisons principales. D'abord, les prix bougent entre le moment ou vous decidez et le moment ou votre ordre arrive ; quelqu'un d'autre peut trader avant vous. Ensuite, votre ordre peut etre plus gros que le volume disponible au meilleur prix, et il doit donc entamer des niveaux moins bons plus profonds dans le carnet pour etre entierement rempli.",
        "L'InfoTip de l'application le dit clairement : le slippage est l'ecart maximal en pourcentage entre le prix attendu et le prix d'execution reel que vous etes pret a accepter. Le regler trop serre risque d'annuler votre trade ; le regler trop large vous laisse vous faire remplir a un mauvais prix. C'est un garde-fou que vous ajustez pour chaque trade.",
      ],
      example: "Vous voulez acheter 10,000 XLM et le meilleur ask est 0.119 USDC, mais il n'y a que 3,000 XLM a ce niveau. Les 7,000 suivants se remplissent a 0.120. Votre prix moyen devient environ 0.1197, un peu au-dessus du 0.119 que vous voyiez. Si votre Tolerance de slippage etait reglee a 0.5 pour cent, ce mouvement de 0.6 pour cent annulerait l'ordre au lieu de le remplir.",
    },
    {
      id: "c2-l5",
      title: "Qu'est-ce que la liquidite et pourquoi est-ce important ?",
      paragraphs: [
        "La liquidite, c'est la quantite que vous pouvez trader pres du prix actuel sans le faire bouger. Un marche liquide a beaucoup de volume empile, serre, des deux cotes du carnet d'ordres, si bien que meme un ordre consequent se remplit avec peu de slippage. Un marche etroit n'a que de petites offres, donc le moindre trade de taille correcte fait fortement bouger le prix.",
        "Le bot suit le volume de trading de chaque marche sur les dernieres 24 heures et le traite comme un controle de sante. Si un marche est trop etroit, il refuse tout simplement d'y trader, parce que le spread et le slippage rendraient tout avantage non rentable et qu'il pourrait etre difficile d'en ressortir proprement.",
        "Pour vous, en tant que trader manuel, la liquidite explique pourquoi deux marches au meme prix peuvent sembler completement differents. Un carnet profond vous permet de trader avec confiance ; un carnet peu profond signifie que c'est votre propre ordre qui fait bouger le prix contre vous. Jetez toujours un oeil a la profondeur dans le panneau Carnet d'ordres avant de dimensionner un trade.",
      ],
      example: "XLM et USDC pourraient afficher 800,000 USDC de volume sur 24 heures avec des milliers de XLM a chaque niveau de prix, de sorte qu'un ordre de 5,000 XLM le bouge a peine. Un token minuscule avec seulement 200 USDC de volume quotidien et 50 unites par niveau ferait un bond sur le meme ordre, et le bot l'ecarterait donc entierement comme trop etroit.",
    },
  ],
  quiz: [
    {
      id: "c2-q1",
      prompt: "Dans le panneau Carnet d'ordres du bot, qu'affiche le cote vert et comment est-il ordonne ?",
      options: [
        {
          text: "Les bids des acheteurs, avec le prix le plus eleve en haut.",
          explanation: "Correct. Le vert, ce sont les bids, tries du plus eleve au plus bas, de sorte que le meilleur prix d'achat se trouve en haut du carnet.",
        },
        {
          text: "Les asks des vendeurs, avec le prix le plus bas en haut.",
          explanation: "Incorrect. Les asks sont du cote rouge ; l'ask le plus bas est le meilleur prix de vente, mais ce n'est pas la liste verte.",
        },
        {
          text: "Les trades conclus durant la derniere heure, du plus recent au plus ancien.",
          explanation: "Incorrect. Le carnet d'ordres affiche les offres en attente, pas un historique des trades passes.",
        },
        {
          text: "Les soldes du pool AMM qui soutient le marche.",
          explanation: "Incorrect. Ce bot trade le carnet d'ordres du SDEX, pas des pools AMM, donc aucun solde de pool n'est affiche ici.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c2-q2",
      prompt: "Le meilleur bid pour XLM est 0.117 USDC et le meilleur ask est 0.119 USDC. Quel est le spread, et pourquoi est-ce important ?",
      options: [
        {
          text: "Il est de 0.236 USDC, la somme des deux prix, et c'est le profit que vous realisez par trade.",
          explanation: "Incorrect. Le spread est la difference, pas la somme, et c'est un cout que vous payez, pas un profit.",
        },
        {
          text: "Il n'y a pas de spread car les deux chiffres sont proches, donc trader est gratuit.",
          explanation: "Incorrect. Tout ecart entre le meilleur bid et le meilleur ask est un vrai spread et un vrai cout.",
        },
        {
          text: "Il est de 0.002 USDC, l'ecart entre le meilleur bid et le meilleur ask, et c'est un cout cache par trade.",
          explanation: "Correct. 0.119 moins 0.117 fait 0.002 ; acheter a l'ask et vendre au bid vous fait perdre ce spread.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c2-q3",
      prompt: "Pourquoi le slippage survient-il quand vous passez un ordre plus gros ?",
      options: [
        {
          text: "L'exchange applique des frais de penalite pour les ordres au-dela d'une taille fixe.",
          explanation: "Incorrect. Le slippage n'est pas une penalite forfaitaire ; il vient de la facon dont le carnet d'ordres se remplit.",
        },
        {
          text: "L'ordre epuise le meilleur niveau de prix et remplit le reste a des prix moins bons, plus profonds dans le carnet.",
          explanation: "Correct. Si votre taille depasse le volume au meilleur prix, le reliquat se remplit a des niveaux moins bons, degradant votre prix moyen.",
        },
        {
          text: "Le bot degrade deliberement votre prix pour capturer le spread a son profit.",
          explanation: "Incorrect. Le slippage vient de la profondeur limitee et des prix qui bougent, pas du bot qui jouerait contre vous.",
        },
        {
          text: "Le slippage n'arrive que sur les petits ordres, jamais sur les gros.",
          explanation: "Incorrect. Les ordres plus gros sont plus susceptibles de subir du slippage, car ils epuisent plus facilement le volume disponible au meilleur prix.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c2-q4",
      prompt: "Pourquoi le bot refuse-t-il de trader sur un marche au volume sur 24 heures tres faible ?",
      options: [
        {
          text: "Un faible volume signifie que le token est tout neuf et pas encore liste sur le SDEX.",
          explanation: "Incorrect. Un marche peut etre liste et rester etroit ; le faible volume concerne la profondeur, pas le statut de listing.",
        },
        {
          text: "Une liquidite etroite signifie des spreads larges et un slippage important, donc tout avantage est englouti et ressortir proprement est difficile.",
          explanation: "Correct. Sans profondeur pres du prix, les couts de spread et de slippage rendent les trades non rentables et risques a denouer.",
        },
        {
          text: "Un faible volume signifie toujours que le prix est sur le point de s'effondrer.",
          explanation: "Incorrect. Un volume etroit ne predit pas la direction ; il predit un cout de trading plus eleve et une difficulte a sortir.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
