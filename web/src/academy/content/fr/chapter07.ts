import type { Chapter } from "../../types";

export const chapter07: Chapter = {
  id: "c7",
  number: 7,
  level: "ADVANCED",
  title: "Prix cible et prix d'invalidation",
  description: "Definissez un objectif de profit et un niveau de stop, puis decouvrez comment leur ratio gain/risque decide si le bot laisse passer un trade.",
  lessons: [
    {
      id: "c7-l1",
      title: "Qu'est-ce qu'un prix cible ?",
      paragraphs: [
        "Un prix cible est le prix auquel vous prevoyez de prendre vos profits. Dans le formulaire d'ordre du Trading manuel, vous le definissez dans la section Avance, dans le champ optionnel Prix cible. L'infobulle de l'application le decrit simplement : le prix auquel vous souhaitez prendre vos profits, et le bot fermera automatiquement la position lorsque ce prix sera atteint.",
        "La cible represente le cote gain de votre trade. Pour un achat, elle se situe au-dessus de votre point d'entree, car vous gagnez quand le prix monte jusqu'a elle. La distance entre votre entree et votre cible correspond au gain que vous cherchez a capturer.",
        "Definir une cible transforme un vague espoir en une sortie concrete. Plutot que de surveiller le graphique et de reagir de maniere emotionnelle, vous decidez a l'avance ou l'idee a porte ses fruits, et le bot agit pour vous des que ce niveau est atteint. Cela rend vos sorties disciplinees et coherentes.",
      ],
      example: "Vous achetez du XLM a 0.118 USDC et vous anticipez une hausse jusqu'a 0.130. Vous saisissez 0.130 comme Prix cible. Le gain que vous visez est la distance entre l'entree et la cible, soit 0.130 moins 0.118, ce qui fait 0.012 par unite. Si le prix atteint 0.130, le bot ferme la position et engrange ce gain pour vous, sans que vous ayez besoin de surveiller l'ecran.",
    },
    {
      id: "c7-l2",
      title: "Qu'est-ce qu'un prix d'invalidation ?",
      paragraphs: [
        "Un prix d'invalidation est le niveau ou votre idee de trade se revele fausse. Vous le definissez dans la meme section Avance, dans le champ optionnel Prix d'invalidation. L'infobulle de l'application l'explique directement : si le prix descend jusqu'a ce niveau, l'idee de trade est consideree comme invalide, et il sert generalement a placer un stop loss.",
        "L'invalidation represente le cote risque de votre trade. Pour un achat, elle se situe en dessous de votre point d'entree, car l'idee echoue si le prix baisse au lieu de monter. La distance entre votre entree et votre invalidation correspond au risque que vous acceptez si vous avez tort.",
        "Nommer le niveau ou vous avez tort est ce qui distingue un trade d'un pari. Une fois que le prix le franchit, s'accrocher revient simplement a esperer. Le moniteur surveille vos positions ouvertes et propose une fermeture lorsque le niveau d'invalidation est franchi, de sorte que la perte est plafonnee a la taille que vous avez choisie au depart.",
      ],
      example: "Vous achetez du XLM a 0.118 USDC. Votre idee repose sur le maintien d'un support a 0.114, vous saisissez donc 0.114 comme Prix d'invalidation. Le risque que vous acceptez est la distance entre l'entree et l'invalidation, soit 0.118 moins 0.114, ce qui fait 0.004 par unite. Si le prix descend a 0.114, le support a cede, l'idee est invalide, et le moniteur propose de fermer la position pour stopper l'hemorragie.",
    },
    {
      id: "c7-l3",
      title: "Comment le prix cible et le prix d'invalidation fonctionnent ensemble",
      paragraphs: [
        "La cible et l'invalidation sont les deux moities d'un meme plan. La cible mesure votre gain, la distance entre l'entree et elle vers le haut. L'invalidation mesure votre risque, la distance entre l'entree et elle vers le bas. Diviser le gain par le risque donne le ratio gain/risque, le seul chiffre qui vous dit si un trade vaut la peine d'etre pris.",
        "Le bot impose un ratio gain/risque minimum, fixe par defaut a 1.2. Le gain divise par le risque doit depasser ce minimum, sinon le trade est bloque par une violation de politique. Pour un achat, cela exige aussi que la cible soit au-dessus de l'entree et l'invalidation en dessous de l'entree, afin que les deux distances aient un sens.",
        "Cette verification vous protege des trades desequilibres ou vous risquez beaucoup pour gagner peu. Meme une strategie qui n'a raison qu'une fois sur deux peut etre rentable si ses gains sont plus gros que ses pertes, et le ratio est la maniere dont le bot garantit cette structure avant que le moindre capital ne soit engage.",
      ],
      example: "Vous achetez a 0.118, cible 0.130, invalidation 0.114. Le gain est 0.130 moins 0.118, soit 0.012. Le risque est 0.118 moins 0.114, soit 0.004. Le ratio est 0.012 divise par 0.004, soit 3.0, confortablement au-dessus du minimum de 1.2, donc le trade est autorise. Si vous fixiez plutot la cible a 0.1184, le gain serait de 0.0004 contre 0.004 de risque, un ratio de 0.1, et le bot le bloquerait.",
    },
    {
      id: "c7-l4",
      title: "Comment les definir correctement pour un trade",
      paragraphs: [
        "Definissez d'abord l'invalidation, pas la cible. Choisissez-la sur le graphique, au niveau qui prouverait vraiment que votre idee est fausse, comme juste en dessous d'un support que vous attendez voir tenir. Ancrer le stop a une structure reelle, plutot qu'au montant que vous souhaitez perdre, le maintient honnete.",
        "Choisissez ensuite une cible qu'un mouvement realiste peut reellement atteindre, idealement pres d'une resistance ou d'un sommet precedent. Calculez ensuite le gain divise par le risque et confirmez qu'il depasse le minimum de 1.2. Si ce n'est pas le cas, la solution n'est pas d'eloigner la cible arbitrairement, mais de trouver une meilleure entree ou une invalidation plus serree mais toujours valable.",
        "Une erreur frequente consiste a eloigner la cible juste pour passer la verification du ratio. Cela produit un chiffre que le marche a peu de chances d'atteindre. Le ratio est un filtre, pas un objectif ; les deux niveaux doivent rester des prix que le marche peut plausiblement franchir.",
      ],
      example: "Vous voulez acheter du XLM autour de 0.118. Le support se situe a 0.115, vous placez donc l'invalidation a 0.115, ce qui donne 0.003 de risque. Pour depasser le minimum de 1.2, il vous faut au moins 0.0036 de gain, donc une cible de 0.1216 ou plus convient. Vous reperez une resistance a 0.124, vous y placez donc la cible, ce qui donne 0.006 de gain, un ratio de 2.0, un trade propre et realiste.",
    },
    {
      id: "c7-l5",
      title: "Comment l'IA utilise le prix cible et le prix d'invalidation dans ses propositions",
      paragraphs: [
        "Lorsque l'analyste IA genere une proposition de trade, il ne se contente pas de choisir une direction. Chaque proposition inclut deja un targetPrice et un invalidationPrice, de sorte que l'idee arrive avec sa sortie de profit et son niveau de stop entierement specifies. Le invalidationPrice est le stop propre a l'analyste, le prix auquel il abandonnerait l'idee.",
        "Parce que la proposition porte les deux niveaux, la meme verification gain/risque s'y applique. Le bot peut confirmer que l'idee de l'analyste depasse le ratio minimum avant que la proposition ne devienne un ordre executable, en appliquant une regle coherente aussi bien aux trades manuels qu'a ceux pilotes par l'IA.",
        "Une fois la position ouverte, le moniteur utilise en continu le niveau d'invalidation. Il surveille la position ouverte et propose une fermeture si la position franchit son invalidation, de sorte que le stop de l'analyste est reellement applique sur le marche, plutot que de rester une simple suggestion sur le papier.",
      ],
      example: "L'analyste propose d'acheter du XLM a 0.118 avec un targetPrice de 0.128 et un invalidationPrice de 0.114. Le gain est de 0.010, le risque de 0.004, un ratio de 2.5 qui depasse le minimum de 1.2, donc la proposition est valide. Vous l'approuvez et la position s'ouvre. Plus tard, le prix glisse jusqu'a 0.114, l'invalidation est franchie, et le moniteur propose de fermer la position, appliquant le stop propre a l'analyste.",
    },
  ],
  quiz: [
    {
      id: "c7-q1",
      prompt: "Dans le formulaire de Trading manuel, que fait le champ Prix cible pour une position d'achat ?",
      options: [
        { text: "Il definit le prix auquel vous souhaitez prendre vos profits, et le bot ferme automatiquement la position lorsque ce prix est atteint.", explanation: "Correct. Cela correspond exactement a l'infobulle de l'application : la cible est votre niveau de prise de profit et le bot ferme la position quand il est atteint." },
        { text: "Il definit le prix sous l'entree ou l'idee de trade est consideree comme invalide.", explanation: "Incorrect. Cela decrit le prix d'invalidation, le niveau de stop sous l'entree, pas la cible." },
        { text: "Il indique au bot le montant maximum de capital a engager dans le trade.", explanation: "Incorrect. Le prix cible est un niveau de sortie, pas un parametre de dimensionnement de position ou de limite de capital." },
        { text: "Il definit la tolerance au slippage que l'ordre acceptera.", explanation: "Incorrect. Le slippage est une question distincte ; le prix cible est purement votre niveau de sortie pour la prise de profit." },
      ],
      correctIndex: 0,
    },
    {
      id: "c7-q2",
      prompt: "Que represente le prix d'invalidation ?",
      options: [
        { text: "Le prix auquel vous prenez vos profits sur un trade gagnant.", explanation: "Incorrect. C'est le prix cible ; l'invalidation concerne l'echec de l'idee, pas sa reussite." },
        { text: "Le prix moyen de tous vos trades passes sur ce token.", explanation: "Incorrect. L'invalidation est un niveau de stop prospectif pour ce trade, pas une moyenne historique." },
        { text: "Le niveau ou, si le prix y descend, l'idee de trade est consideree comme invalide ; il sert generalement de stop loss.", explanation: "Correct. C'est la definition de l'infobulle de l'application : l'atteindre signifie que l'idee a echoue, et il sert de stop loss." },
      ],
      correctIndex: 2,
    },
    {
      id: "c7-q3",
      prompt: "Vous achetez a 0.120, definissez une cible de 0.126 et une invalidation de 0.114. Avec le ratio gain/risque minimum par defaut de 1.2, que se passe-t-il ?",
      options: [
        { text: "Le trade est bloque, car le gain de 0.006 est inferieur au risque de 0.006.", explanation: "Incorrect. Le gain est 0.126 moins 0.120 = 0.006 et le risque est 0.120 moins 0.114 = 0.006, ils sont donc egaux, pas inferieurs." },
        { text: "Le trade est bloque, car le ratio est de 1.0, ce qui ne depasse pas le minimum de 1.2.", explanation: "Correct. Le gain 0.006 divise par le risque 0.006 fait 1.0, sous le minimum de 1.2, donc le bot le bloque par une violation de politique." },
        { text: "Le trade est autorise, car une cible et une invalidation ont toutes deux ete fournies.", explanation: "Incorrect. Fournir les deux niveaux est necessaire mais pas suffisant ; le ratio doit encore depasser le minimum, et 1.0 ne le fait pas." },
        { text: "Le trade est autorise, car le ratio de 1.0 est suffisamment proche de 1.2.", explanation: "Incorrect. Le ratio doit depasser le minimum ; 1.0 est sous 1.2 et le bot ne l'arrondit pas vers le haut." },
      ],
      correctIndex: 1,
    },
    {
      id: "c7-q4",
      prompt: "Comment l'analyste IA utilise-t-il les prix cible et d'invalidation ?",
      options: [
        { text: "Il inclut un targetPrice et un invalidationPrice dans chaque proposition, et le moniteur propose une fermeture si une position ouverte franchit son invalidation.", explanation: "Correct. L'analyste specifie les deux niveaux par proposition, l'invalidation est son stop, et le moniteur l'applique en proposant une fermeture lors d'un franchissement." },
        { text: "Il ignore ces niveaux car ils n'ont de sens que pour les trades manuels.", explanation: "Incorrect. L'analyste definit lui-meme les deux niveaux dans chaque proposition ; ils ne sont pas reserves au manuel." },
        { text: "Il definit uniquement un prix cible et laisse entierement le stop a l'utilisateur.", explanation: "Incorrect. La proposition inclut un invalidationPrice comme stop propre a l'analyste, pas seulement une cible." },
        { text: "Il les utilise uniquement pour colorer le graphique et n'agit jamais en fonction d'eux.", explanation: "Incorrect. Le moniteur propose activement de fermer une position lorsque son niveau d'invalidation est franchi, donc ces niveaux declenchent une action." },
      ],
      correctIndex: 0,
    },
  ],
};
