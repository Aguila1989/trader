import type { Chapter } from "../../types";

export const chapter08: Chapter = {
  id: "c8",
  number: 8,
  level: "ADVANCED",
  title: "Lire le marche",
  description:
    "Lisez les graphiques de prix, les chandeliers, les unites de temps, le volume et les tendances de liquidite tels que cette application les presente.",
  lessons: [
    {
      id: "c8-l1",
      title: "Qu'est-ce qu'un graphique de prix et comment le lire ?",
      paragraphs: [
        "Un graphique de prix est une image de la facon dont le prix d'un token a evolue dans le temps. Le temps se lit de gauche a droite, donc le point le plus ancien est a gauche et le plus recent a droite. Le prix se lit de bas en haut, donc une ligne ou une forme placee plus haut signifie un prix plus eleve. Lire un graphique revient surtout a se poser une question : sur la portion que vous regardez, le prix monte-t-il, baisse-t-il ou evolue-t-il a plat ?",
        "Dans cette application, la vue detail du token trace le graphique a partir des donnees reelles de trades issues de Stellar Horizon, regroupees en periodes de temps fixes. Chaque periode devient un chandelier plutot qu'un simple point, ce qui condense quatre prix dans une seule forme au lieu d'un seul. Cela vous permet de voir non seulement ou le prix a fini, mais aussi de combien il a oscille en chemin.",
        "Ne sur-interpretez pas les petites oscillations. Prenez du recul et regardez d'abord la pente d'ensemble, puis zoomez sur le detail. Un graphique vous dit ce qui s'est deja passe, pas ce qui va se passer ensuite : traitez-le donc comme un indice, pas comme une prediction.",
      ],
      example:
        "Sur la vue journaliere, vous voyez 30 chandeliers quotidiens. Le plus a gauche cloture pres de 0.118, les chandeliers derivent vers le haut jusqu'a environ 0.131 au milieu, puis les derniers retombent vers 0.126. La conclusion : un mois qui a monte puis a rendu une partie du gain, finissant legerement plus haut qu'il n'avait commence.",
    },
    {
      id: "c8-l2",
      title: "Qu'est-ce qu'un chandelier ?",
      paragraphs: [
        "Un chandelier resume une periode de temps a l'aide de quatre prix : l'ouverture, le plus haut, le plus bas et la cloture. La partie epaisse, appelee le corps, est tracee entre l'ouverture et la cloture. Les fines lignes au-dessus et en dessous, appelees meches, montent jusqu'au plus haut et descendent jusqu'au plus bas atteints durant cette periode.",
        "La couleur indique la direction en un coup d'oeil. Un chandelier vert ou haussier a cloture plus haut qu'il n'a ouvert, donc le sommet du corps est la cloture. Un chandelier rouge ou baissier a cloture plus bas qu'il n'a ouvert, donc le sommet du corps est l'ouverture. De longues meches signifient que le prix s'est beaucoup eloigne de l'ouverture ou de la cloture avant de se stabiliser, ce qui traduit de l'indecision ou un mouvement rejete.",
        "Dans cette application, chaque chandelier porte aussi le volume de base echange et le nombre de trades de la periode, si bien qu'un chandelier n'est pas qu'une forme, mais aussi une activite. Lisez le corps pour le mouvement net et les meches pour la bataille qui l'a produit.",
      ],
      example:
        "Un seul chandelier quotidien ouvre a 0.120, plonge vers un plus bas de 0.117, bondit vers un plus haut de 0.129, puis cloture a 0.127. Il s'affiche en vert car la cloture a battu l'ouverture, avec une courte meche basse a 0.117 et une meche haute atteignant 0.129 au-dessus du sommet du corps de 0.127.",
    },
    {
      id: "c8-l3",
      title: "Comment utiliser le graphique horaire / journalier / hebdomadaire / annuel dans cette application",
      paragraphs: [
        "Le graphique de detail du token dispose d'un selecteur d'unite de temps avec quatre reglages, et chacun recadre le meme token sur une fenetre differente. Horaire affiche 24 chandeliers d'une heure, ce qui couvre en gros la derniere journee dans le detail. Journalier affiche 30 chandeliers quotidiens, environ un mois. Hebdomadaire affiche 52 chandeliers hebdomadaires, environ une annee en semaines. Annuel affiche 365 chandeliers quotidiens, soit a peu pres une annee complete jour par jour.",
        "Choisissez l'unite de temps en fonction de la question. Pour ce qui se passe en ce moment, utilisez l'horaire. Pour la forme du dernier mois, utilisez le journalier. Pour l'arc plus long, utilisez l'hebdomadaire ou l'annuel. Un mouvement qui semble enorme sur le graphique horaire peut n'etre qu'un minuscule soubresaut une fois passe en hebdomadaire : verifiez donc toujours un signal court terme en le confrontant a un signal plus long.",
        "Comme chaque chandelier est construit a partir des memes agregations de trades de Horizon, les quatre vues sont coherentes entre elles ; elles ne font que regrouper les trades en periodes plus longues ou plus courtes. Changer d'unite de temps ne modifie jamais les donnees sous-jacentes, seulement le niveau de zoom auquel vous les lisez.",
      ],
      example:
        "Vous reperez une chute brutale sur le graphique horaire qui parait alarmante sur ses 24 chandeliers. Vous passez en hebdomadaire, voyez 52 chandeliers hebdomadaires, et constatez que cette meme chute n'est qu'un petit chandelier rouge a l'interieur d'une annee en tendance haussiere reguliere. La frayeur n'etait qu'un bruit intrajournalier normal.",
    },
    {
      id: "c8-l4",
      title: "Qu'est-ce qu'un indicateur de volume ?",
      paragraphs: [
        "Le volume, c'est la quantite d'un token reellement echangee durant une periode. Dans cette application, chaque chandelier rapporte son volume de base et son nombre de trades, ce qui vous permet de voir si un mouvement de prix s'est produit sur une forte activite ou sur presque rien. Le volume repond a une question differente de celle du prix : pas vers ou il est alle, mais quelle conviction se cachait derriere.",
        "La regle generale est que le volume confirme les mouvements. Un bond de prix sur un volume en hausse est plus fiable car de nombreux participants se sont accordes dessus. Le meme bond sur un volume mince est suspect, puisqu'un seul petit ordre peut bousculer un marche calme sans que cela veuille dire grand-chose.",
        "Cela compte directement pour le bot. Il impose un seuil minimal de volume sur 24h et refuse les marches tres minces, parce qu'un graphique qui parait attractif mais qui s'echange a peine est un piege : vous pourriez ne pas pouvoir entrer ou sortir au prix que vous voyez. Jetez toujours un oeil au volume avant de faire confiance a un chandelier.",
      ],
      example:
        "Deux tokens ont tous deux pris 4 pour cent aujourd'hui. Le token A l'a fait sur 90 000 de volume de base reparti sur 600 trades ; le token B l'a fait sur 800 de volume reparti sur 5 trades. Le mouvement du token A est credible et le bot l'envisagerait ; celui du token B est du bruit sur un marche que le bot rejetterait comme trop mince.",
    },
    {
      id: "c8-l5",
      title: "Qu'est-ce qu'une tendance de liquidite et pourquoi la suivre ?",
      paragraphs: [
        "La liquidite, c'est la facilite avec laquelle vous pouvez trader un token sans faire bouger son prix. Le volume d'une seule journee est un instantane ; une tendance de liquidite est la direction que prend cet instantane dans le temps. Le bot fait tourner un scanner de liquidite qui classe les tokens selon leur volume sur 24h et leur nombre de trades, puis observe comment chaque token se deplace dans ces classements.",
        "Le scanner rapporte deux tendances par token. La tendance de rang peut s'ameliorer, decliner ou rester stable, ce qui signifie que le token grimpe, glisse ou conserve sa place dans le classement. La tendance de volume peut croitre, retrecir ou rester stable, decrivant l'activite brute elle-meme. Ensemble, elles forment la tendance de liquidite.",
        "Suivez-la car la liquidite determine si une strategie est seulement executable. Un token dont le volume croit et le rang s'ameliore devient plus facile a trader et plus sur a dimensionner. Un token qui retrecit et decline se tarit, si bien que meme un bon signal de prix y est risque, car vous pourriez vous retrouver coince a le detenir.",
      ],
      example:
        "Un token se situe au milieu du peloton, mais sa fiche de scanner indique une tendance de volume en croissance et une tendance de rang en amelioration au fil des scans recents, grimpant du rang 40 vers le rang 25. Cette tendance de liquidite en amelioration signifie qu'une entree aujourd'hui sera plus facile a denouer plus tard que le meme trade ne l'aurait ete il y a une semaine.",
    },
  ],
  quiz: [
    {
      id: "c8-q1",
      prompt: "Sur un graphique de prix dans cette application, que represente le deplacement de gauche a droite ?",
      options: [
        {
          text: "Le temps qui passe, du plus ancien a gauche au plus recent a droite.",
          explanation:
            "Correct. L'axe horizontal est le temps, donc le chandelier le plus a droite est la periode la plus recente.",
        },
        {
          text: "Le prix qui monte, du moins cher a gauche au plus cher a droite.",
          explanation:
            "Incorrect. Le prix est l'axe vertical ; l'horizontal est le temps.",
        },
        {
          text: "Le volume qui augmente, du plus calme a gauche au plus actif a droite.",
          explanation:
            "Incorrect. Le volume est rapporte par chandelier, pas par la position horizontale.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c8-q2",
      prompt:
        "Un chandelier ouvre a 0.120, cloture a 0.127, avec un plus haut de 0.129 et un plus bas de 0.117. Qu'est-ce qui est vrai ?",
      options: [
        {
          text: "C'est un chandelier rouge et 0.129 est la cloture.",
          explanation:
            "Incorrect. La cloture (0.127) est au-dessus de l'ouverture, donc le chandelier est vert, et 0.129 est le plus haut, pas la cloture.",
        },
        {
          text: "C'est un chandelier vert ; le corps va de 0.120 a 0.127 et les meches atteignent 0.129 et 0.117.",
          explanation:
            "Correct. Une cloture au-dessus de l'ouverture le rend vert ; le corps va de l'ouverture a la cloture et les meches marquent le plus haut et le plus bas.",
        },
        {
          text: "Le corps va de 0.117 a 0.129 et il n'y a pas de meches.",
          explanation:
            "Incorrect. Le corps va de l'ouverture a la cloture (0.120 a 0.127) ; 0.117 et 0.129 sont les extremes des meches.",
        },
        {
          text: "Il est vert parce que le plus haut a battu l'ouverture.",
          explanation:
            "Incorrect. La couleur vient de la cloture par rapport a l'ouverture, pas du plus haut par rapport a l'ouverture.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q3",
      prompt:
        "Vous voulez juger le dernier mois complet d'evolution du prix d'un token. Quelle unite de temps convient le mieux ?",
      options: [
        {
          text: "Horaire, qui affiche 24 chandeliers d'une heure.",
          explanation:
            "Incorrect. L'horaire ne couvre qu'environ la derniere journee, pas un mois.",
        },
        {
          text: "Journalier, qui affiche 30 chandeliers quotidiens.",
          explanation:
            "Correct. Trente chandeliers quotidiens couvrent environ un mois, ce qui correspond a la question.",
        },
        {
          text: "Annuel, qui affiche 365 chandeliers quotidiens.",
          explanation:
            "Incorrect. L'annuel couvre une annee complete, bien plus que le seul mois demande.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q4",
      prompt: "Pourquoi le bot prete-t-il attention au volume, et pas seulement au prix ?",
      options: [
        {
          text: "Un volume eleve signifie toujours que le prix va continuer de monter.",
          explanation:
            "Incorrect. Le volume confirme la conviction derriere un mouvement mais ne predit pas la direction future.",
        },
        {
          text: "Le volume determine la couleur de chaque chandelier.",
          explanation:
            "Incorrect. La couleur du chandelier vient de la cloture par rapport a l'ouverture ; le volume est distinct.",
        },
        {
          text: "Le volume confirme si un mouvement est fiable, et les marches tres minces sont rejetes par un seuil minimal de volume sur 24h.",
          explanation:
            "Correct. Un mouvement sur un fort volume est plus credible, et le bot refuse les marches trop minces pour y entrer ou en sortir de maniere fiable.",
        },
        {
          text: "Le volume remplace le prix comme element principal a lire sur le graphique.",
          explanation:
            "Incorrect. Le volume complete le prix ; vous lisez les deux, pas l'un a la place de l'autre.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c8-q5",
      prompt:
        "Le scanner montre un token avec une tendance de volume en croissance et une tendance de rang en amelioration. Que vous dit cette tendance de liquidite ?",
      options: [
        {
          text: "Le token devient plus facile a trader et plus sur a dimensionner au fil du temps.",
          explanation:
            "Correct. Un volume en croissance plus un rang qui grimpe signifient une liquidite en amelioration, donc entrer puis sortir plus tard devient plus facile.",
        },
        {
          text: "Le prix du token est garanti de monter.",
          explanation:
            "Incorrect. La tendance de liquidite decrit la facilite a trader, pas la direction future du prix.",
        },
        {
          text: "Le token se tarit et devrait etre evite.",
          explanation:
            "Incorrect. Ce serait une tendance de volume en retrecissement et une tendance de rang en declin, l'oppose de ce cas.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
