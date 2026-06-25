import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Reglages de risque de l'IA : controle total",
  description: "Plongee dans les six facteurs de risque independants, le mode Basique face au Mode Expert, et la facon dont des seuils numeriques precis faconnent chaque proposition de l'IA.",
  lessons: [
    {
      id: "c11-l1",
      title: "Que sont les facteurs de risque et pourquoi sont-ils separes ?",
      paragraphs: [
        "Le panneau des reglages de risque se trouve dans l'onglet Bot Trading et expose six facteurs de risque independants : la taille de position, la distance du stop loss, la frequence des trades, la tolerance a la volatilite des actifs, la tolerance au drawdown et la tolerance au slippage. Chacun gouverne un point different du cycle de vie d'un trade, depuis les marches que le scan de la chaine considere meme, en passant par le niveau de confiance que l'IA doit atteindre, jusqu'a la taille de l'ordre qu'elle peut soumettre et l'eloignement du stop de protection. Ce sont des regles de politique, pas une strategie : ils n'indiquent jamais a l'IA quoi acheter, seulement les conditions dans lesquelles elle a le droit d'agir.",
        "S'il y a six molettes distinctes plutot qu'un unique curseur de risque global, c'est qu'un seul niveau de risque est trop grossier pour exprimer la facon dont raisonnent les vrais traders. L'appetit pour le risque n'est pas unidimensionnel. Un trader peut vouloir des stops tres serres parce que l'avantage recent est fragile, tout en souhaitant une frequence de trades elevee parce que la strategie repose sur la capture de nombreuses petites occasions de spread. Un unique curseur forcerait les stops serres et la frequence faible a bouger ensemble, ce qui est exactement le mauvais couplage. Separer les facteurs vous permet de melanger un reglage prudent sur un axe avec un reglage agressif sur un autre, afin que le bot exprime votre veritable these plutot qu'un compromis.",
        "Chaque facteur est lu en direct au moment de la proposition, jamais mis en cache. Quand vous modifiez une valeur, elle prend effet des la proposition suivante generee par l'orchestrateur, sans redemarrage et sans avoir a attendre une fin de session. Cela compte parce que les conditions de marche evoluent plus vite que vous ne pouvez redeployer, et vous voulez pouvoir resserrer la pause sur drawdown ou assouplir le plafond de volatilite en pleine session et que cela morde immediatement.",
        "Chaque valeur numerique est aussi inscrite dans le prompt de l'IA, et l'instantane numerique complet est journalise a cote de la proposition qu'il a produite. Cela vous donne une trace verifiable : pour toute proposition historique, vous pouvez reconstruire exactement quels six seuils etaient en vigueur lors de sa generation, ce qui est essentiel lorsque vous cherchez a attribuer un trade ignore ou execute a un reglage precis plutot que de deviner.",
      ],
      example: "Vous croyez en l'avantage de capture de spread mais vous vous mefiez du suivi de tendance, alors vous reglez la frequence des trades sur agressif (confiance minimale faible) tout en gardant la distance du stop loss serree a 2 pour cent. Un unique curseur global ne pourrait pas exprimer cette combinaison ; six facteurs independants le peuvent, et la prochaine proposition honore les deux a la fois.",
    },
    {
      id: "c11-l2",
      title: "Taille de position — mecanique exacte",
      paragraphs: [
        "En mode Basique, la taille de position est un choix en trois paliers : FAIBLE, MOYEN, ELEVE. FAIBLE reproduit exactement le comportement prudent actuel de l'application et constitue la valeur par defaut retrocompatible. En coulisses, le mode Basique met a l'echelle le plafond de taille par ordre comme un multiple du plafond configure : FAIBLE c'est fois un, MOYEN c'est fois trois, et ELEVE c'est fois six. MOYEN et ELEVE n'augmentent jamais le risque que par rapport a FAIBLE ; il n'existe aucun moyen de rendre le mode Basique plus petit que la base prudente.",
        "Activer le bouton Mode Expert, intitule configurer des seuils numeriques exacts, remplace les trois paliers par un unique controle precis : la taille de position maximale en pourcentage du solde disponible. La plage va de 1 a 100 pour cent. Les presets d'usine sont FAIBLE 5, MOYEN 15 et ELEVE 30, mais en Mode Expert vous saisissez n'importe quel entier dans la plage. La semantique est un pourcentage du solde disponible, et non un montant fixe de tokens, de sorte que la taille absolue de l'ordre suit automatiquement votre portefeuille a mesure qu'il grandit ou retrecit. Un reglage de 10 pour cent sur un solde de 400 XLM autorise un ordre d'environ 40 XLM ; les memes 10 pour cent sur un solde de 800 XLM autorisent environ 80.",
        "Le panneau affiche un apercu en direct pour que vous n'ayez jamais a faire ce calcul de tete. Il lit votre solde disponible actuel et montre une ligne de la forme : avec X XLM disponibles, l'ordre maximal est d'environ Y XLM. A mesure que vous faites glisser ou saisissez le pourcentage, l'apercu se recalcule instantanement, ce qui rend evident le moment ou un pourcentage en apparence modeste se traduit par une position absolue inconfortablement grande sur un solde important.",
        "La taille de position n'agit pas seule. Il existe un plafond par trade propre a l'IA que l'orchestrateur applique egalement. Si le pourcentage que vous choisissez autorisait un ordre superieur a ce plafond par trade, le panneau fait remonter un avertissement afin que vous compreniez que la taille effective sera ramenee au plafond plutot qu'a votre pourcentage. Autrement dit, la plus petite des deux limites l'emporte, et l'avertissement existe pour que ce bridage ne soit jamais une surprise silencieuse. Lisez l'apercu en meme temps que l'avertissement : l'apercu vous dit ce que demande votre pourcentage, l'avertissement vous dit quand le plafond de l'IA le supplantera.",
      ],
      example: "Vous reglez la taille de position Expert sur 25 pour cent avec 600 XLM disponibles. L'apercu en direct affiche environ 150 XLM. Si le plafond par trade de l'IA est de 100 XLM, le panneau avertit que votre pourcentage depasse le plafond, et l'ordre maximal reel est ramene a 100 XLM, et non 150.",
    },
    {
      id: "c11-l3",
      title: "Distance du stop loss et tolerance au drawdown — mecanique exacte",
      paragraphs: [
        "La distance du stop loss definit a quel point la sortie de protection se place sous l'entree. En mode Basique, la distance de stop par defaut s'elargit avec le niveau : MOYEN et ELEVE multiplient le pourcentage de stop configure par fois un, fois un et demi, et fois deux et demi respectivement, et a MOYEN ou ELEVE l'IA recoit aussi pour consigne de preferer un stop suiveur plutot qu'un stop fixe. En Mode Expert, vous choisissez le stop directement de deux facons : un pourcentage fixe depuis l'entree, avec une plage de 0,5 a 20 pour cent et des presets 2, 5 et 10 ; ou un montant fixe depuis l'entree exprime en XLM. L'option du montant fixe est utile quand vous raisonnez en termes absolus plutot qu'en pourcentages.",
        "Le panneau avertit activement lorsque votre distance de stop est tres serree, parce qu'un stop place a l'interieur du spread bid-ask normal se declenchera sur le seul bruit. Si vous placez un stop a 0,5 pour cent sur un marche dont le spread aller-retour est deja proche de cette largeur, vous serez sorti sur le spread avant que le trade n'ait eu une chance de fonctionner. L'avertissement est la pour vous empecher de transformer un outil de protection en une petite perte garantie.",
        "La tolerance au drawdown est un coupe-circuit au niveau du portefeuille plutot qu'un controle par trade. En mode Basique, FAIBLE met en pause le trading de l'IA apres une baisse de 5 pour cent, MOYEN apres 10 pour cent, et ELEVE ne met jamais en pause sur drawdown. En Mode Expert, le controle se lit : mettre en pause le trading de l'IA si le portefeuille baisse de X pour cent en 24 heures, avec une plage de 1 a 50 pour cent et des presets 5, 10 et 25. Il existe aussi une case Ne jamais mettre en pause sur drawdown, qui correspond exactement au Basique ELEVE et desactive entierement le coupe-circuit.",
        "Le detail comportemental crucial est ce que signifie pause. Lorsque le seuil de drawdown sur 24 heures est franchi, seules les nouvelles entrees de l'IA sont mises en pause. Les sorties reductrices de risque sont toujours autorisees. C'est deliberement ainsi : un coupe-circuit qui figerait tout le bot pourrait vous piecer dans une position perdante precisement au moment ou les conditions se deteriorent. En stoppant toute nouvelle exposition tout en laissant la porte de sortie ouverte, le coupe-circuit endigue le risque nouveau sans empecher le bot de vous faire sortir des trades dans lesquels vous etes deja.",
      ],
      example: "Vous reglez un stop Expert a pourcentage fixe de 0,6 pour cent sur un marche dont le spread est d'environ 0,5 pour cent. Le panneau avertit que le stop est tres serre. Separement, avec une tolerance au drawdown de 10 pour cent, une perte precoce porte la variation du portefeuille sur 24 heures a moins 11 pour cent : les nouvelles entrees se mettent en pause, mais une proposition de cloture d'une position perdante existante s'execute quand meme.",
    },
    {
      id: "c11-l4",
      title: "Frequence des trades et tolerance a la volatilite des actifs — mecanique exacte",
      paragraphs: [
        "La frequence des trades est implementee comme un filtre de confiance, parce que la facon la plus nette de faire trader le bot plus ou moins souvent est de modifier le niveau de certitude qu'il doit atteindre avant d'agir. L'IA note chaque proposition de 0 a 100. En mode Basique, FAIBLE et MOYEN exigent une confiance moyenne ou superieure pour s'auto-soumettre, ELEVE autorise en plus le passage des propositions a faible confiance, et le delai d'attente entre les entrees se raccourcit egalement aux frequences plus elevees. En Mode Expert, le controle est explicite : le score de confiance minimal de l'IA pour trader, un nombre de 50 a 99 avec des presets 85, 70 et 55. Notez l'inversion qui piege les gens : un seuil plus bas signifie une frequence de trades plus elevee, parce que davantage de propositions franchissent la barre.",
        "Seules les propositions au seuil ou au-dessus s'auto-executent. Tout ce qui est en dessous n'est pas ecarte ; c'est conserve pour revue manuelle, et la raison est inscrite au journal sous une forme explicite et attribuable, telle que : proposition ignoree, confiance 68 inferieure au seuil 70. Cet ecart de deux points est une information recuperable. Si vous voyez une serie de quasi-ratages groupes juste sous votre seuil, vous avez la preuve directe qu'abaisser le seuil de quelques points aurait admis de vrais trades, et le journal vous permet de trancher sur des donnees plutot que sur un ressenti.",
        "La tolerance a la volatilite des actifs filtre les marches que le scan de la chaine considerera meme, avant qu'une proposition n'existe. En mode Basique, MOYEN et ELEVE assouplissent les filtres de liquidite sur le volume 24 heures et le spread d'entree afin que des marches plus minces deviennent eligibles. En Mode Expert, le controle est un plafond strict : la variation de prix maximale acceptee sur 24 heures en pourcentage, allant de 1 a 50 avec des presets 5, 15 et 30. Tout token dont la variation absolue de prix sur 24 heures depasse le plafond est ignore par le scan et nomme dans le journal des marches exclus, de sorte que vous pouvez voir exactement quels candidats ont ete filtres et pourquoi.",
        "Ces deux facteurs operent a des etapes differentes et se composent proprement. La tolerance a la volatilite des actifs est un filtre en amont sur l'univers des marches negociables ; la frequence des trades est un filtre en aval sur la confiance des propositions au sein des marches survivants. Un plafond de volatilite bas peut affamer en candidats un reglage de confiance a haute frequence, parce qu'il y a simplement moins de choses a noter. Quand le bot est plus calme que vous ne l'attendez, verifiez d'abord le journal des marches exclus pour voir si c'est le plafond de volatilite, et non le seuil de confiance, qui est la contrainte limitante.",
      ],
      example: "Vous reglez la frequence des trades Expert sur une confiance minimale de 70 et la tolerance a la volatilite des actifs sur 5 pour cent. Un token qui varie de 8 pour cent en 24 heures n'atteint jamais l'etape de notation et apparait dans le journal des marches exclus. Une autre proposition est bien notee a 68 et conservee, journalisee comme proposition ignoree, confiance 68 inferieure au seuil 70.",
    },
    {
      id: "c11-l5",
      title: "Tolerance au slippage et combinaison des facteurs — strategie avancee",
      paragraphs: [
        "La tolerance au slippage est le dernier filtre avant l'execution et protege la qualite d'execution. En Mode Expert, le controle est le slippage maximal accepte en pourcentage, allant de 0,1 a 10 avec des presets 0,5, 1,5 et 3. Une proposition dont le slippage attendu depasse le plafond est bloquee d'emblee. C'est le facteur qui defend le plus directement la these de la capture de spread : si votre avantage n'est que de quelques points de base, une execution qui en cede plus que cela en slippage transforme une configuration gagnante en une configuration perdante. Reglez-le trop laxiste sur des carnets minces et vous payez l'avantage meme que la strategie cherche a recolter ; reglez-le trop serre et de bonnes propositions sur des paires liquides seront tout de meme parfois bloquees par un elargissement momentane.",
        "Les six facteurs partagent deux concepts directeurs. D'abord, les presets : Conservateur signifie de petits trades, des stops serres, uniquement de la confiance elevee ; Equilibre signifie une exposition moderee sur tous les facteurs ; Agressif signifie des trades plus gros, des stops plus larges, des trades plus frequents. Selectionner un preset charge un ensemble coherent de chiffres sur chaque facteur a la fois, et tout facteur que vous modifiez ensuite a la main bascule le chargeur sur Personnalise. Ensuite, une banniere d'avertissement ELEVE apparait des qu'une seule valeur est plus agressive que le preset Agressif, de sorte que pousser une molette au-dela du profil agressif livre est toujours visible plutot que silencieux.",
        "L'interet de l'independance est la combinaison deliberee, et les combinaisons interagissent de facons qui meritent reflexion. Pour trader souvent mais petit et en securite, reglez la frequence des trades sur agressif avec un seuil de confiance minimal bas, la taille de position sur faible a un petit pourcentage du solde, et la distance du stop loss sur serre. Pour chasser quelques mouvements a forte conviction, faites l'inverse : un seuil de confiance eleve, un pourcentage de position plus grand, et un stop plus large pour que la position plus grosse ne soit pas secouee par le bruit. Rappelez-vous que les etapes se composent : le plafond de volatilite decide de l'univers, le seuil de confiance decide quelles propositions survivent, la taille de position et le slippage decident de l'ordre final, et la tolerance au drawdown peut mettre en pause les nouvelles entrees par-dessus tout cela.",
        "Enfin, tout le systeme est retrocompatible. Avec le bouton Mode Expert desactive, chaque facteur se comporte exactement comme le faisaient auparavant les niveaux Basique FAIBLE, MOYEN, ELEVE, et FAIBLE reste la base prudente qui reproduit le comportement d'origine de l'application. Le Mode Expert est une precision purement additive : il vous laisse nommer des seuils exacts, voir des apercus et avertissements en direct, et faire journaliser l'instantane numerique complet avec chaque proposition, sans changer les valeurs par defaut sures vers lesquelles vous repliez quand le bouton est desactive. Changez un facteur a la fois et lisez les journaux afin de pouvoir attribuer chaque changement de comportement a la molette que vous avez bougee.",
      ],
      example: "Vous voulez des trades frequents, petits et serres par le stop. Vous reglez la frequence des trades sur une confiance minimale de 55, la taille de position sur 5 pour cent du solde, la distance du stop loss sur 2 pour cent, et laissez la tolerance au slippage a 0,5 pour cent. Le bot propose souvent, dimensionne chaque ordre modestement, sort vite quand il a tort, et bloque toute execution qui cederait plus d'un demi pour cent.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Pourquoi y a-t-il six facteurs de risque independants au lieu d'un unique curseur de risque global ?",
      options: [
        { text: "Un seul niveau de risque est trop grossier ; des facteurs independants vous laissent melanger des reglages, comme des stops serres avec une frequence de trades elevee, qu'un curseur global forcerait a bouger ensemble.", explanation: "Correct. L'appetit pour le risque n'est pas unidimensionnel, donc separer les facteurs permet a un axe d'etre prudent pendant qu'un autre est agressif, exprimant votre veritable these." },
        { text: "Six molettes ne sont necessaires que parce que l'IA ne peut pas lire un seul nombre depuis le prompt.", explanation: "Incorrect. L'IA recoit chaque valeur numerique dans le prompt quel qu'en soit le nombre ; la separation porte sur l'expressivite, pas sur une limite du prompt." },
        { text: "Chaque facteur controle une application totalement sans rapport, et ils ne partagent un panneau que par hasard.", explanation: "Incorrect. Les six gouvernent le meme cycle de vie de trade pour ce bot ; ce sont des molettes distinctes sur un seul systeme, pas des applications distinctes." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "En Mode Expert, que controle reellement le facteur taille de position, et comment interagit-il avec le plafond par trade de l'IA ?",
      options: [
        { text: "Il fixe un montant fixe de tokens par ordre qui supplante toujours le plafond par trade de l'IA.", explanation: "Incorrect. La taille de position Expert est un pourcentage du solde, pas un montant fixe, et elle ne supplante pas le plafond ; la plus petite limite l'emporte." },
        { text: "Il fixe le score de confiance maximal, et le plafond est ignore.", explanation: "Incorrect. La confiance est le facteur frequence des trades ; la taille de position gouverne la taille de l'ordre en pourcentage du solde disponible." },
        { text: "Il fixe la taille de position maximale en pourcentage du solde disponible ; si ce pourcentage depassait le plafond par trade de l'IA, le panneau avertit et l'ordre est ramene au plafond.", explanation: "Correct. Le pourcentage suit votre solde via l'apercu en direct, et la plus petite entre la taille derivee du pourcentage et le plafond par trade est ce qui s'execute reellement." },
        { text: "Il ne change que la couleur du bouton d'ordre et n'a aucun effet sur la taille.", explanation: "Incorrect. Il determine directement la taille d'ordre autorisee en pourcentage du solde, affichee dans l'apercu en direct." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q3",
      prompt: "Vous reglez la frequence des trades en Mode Expert sur une confiance minimale de 70. L'IA note une proposition a 68. Que se passe-t-il ?",
      options: [
        { text: "La proposition s'auto-execute parce que 68 est assez proche de 70.", explanation: "Incorrect. Le seuil est un filtre strict ; seules les propositions au seuil ou au-dessus de 70 s'auto-executent, et 68 est en dessous." },
        { text: "La proposition est definitivement supprimee et jamais enregistree.", explanation: "Incorrect. Les propositions sous le seuil sont conservees pour revue manuelle et la raison est explicitement journalisee, pas supprimee." },
        { text: "La proposition est conservee pour revue manuelle et le journal enregistre quelque chose comme proposition ignoree, confiance 68 inferieure au seuil 70.", explanation: "Correct. Les propositions sous le seuil sont conservees, pas ecartees, et la ligne d'ignore attribuable vous laisse voir les quasi-ratages groupes juste sous votre seuil." },
        { text: "Tout le bot se met en pause pendant 24 heures.", explanation: "Incorrect. C'est le coupe-circuit de tolerance au drawdown, pas le filtre de confiance ; une seule proposition sous le seuil ne fait que conserver cette unique proposition." },
      ],
      correctIndex: 2,
    },
    {
      id: "c11-q4",
      prompt: "Vous voulez que l'IA trade souvent mais avec de petites positions et des stop loss serres. Quels reglages Expert conviennent ?",
      options: [
        { text: "Une frequence de trades elevee via un seuil de confiance minimal bas, un faible pourcentage de taille de position, et une petite distance de stop loss.", explanation: "Correct. Un seuil de confiance bas admet plus de propositions (frequence plus elevee), un faible pourcentage garde chaque ordre petit, et un stop serre limite la perte par trade." },
        { text: "Un seuil de confiance minimal eleve, un fort pourcentage de taille de position, et une large distance de stop loss.", explanation: "Incorrect. C'est le profil a forte conviction : des trades moins nombreux, plus gros, avec des stops plus larges, l'oppose de souvent, petit et serre." },
        { text: "Ne jamais mettre en pause sur drawdown, un slippage maximal, et un large stop a montant fixe.", explanation: "Incorrect. Aucun de ces elements ne controle la frequence des trades ni ne garde les positions petites ; ils traitent le drawdown, la qualite d'execution et le placement du stop dans le mauvais sens." },
        { text: "Un plafond de volatilite des actifs bas uniquement, en laissant tous les autres facteurs par defaut.", explanation: "Incorrect. Un plafond de volatilite bas retrecit l'univers de candidats au lieu d'augmenter la frequence, et il ne fait rien pour rendre les positions petites ou les stops serres." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Comment se comporte le coupe-circuit de tolerance au drawdown une fois le seuil sur 24 heures franchi, et comment l'option ne jamais mettre en pause se rapporte-t-elle au mode Basique ?",
      options: [
        { text: "Il fige le bot entier, bloquant a la fois les nouvelles entrees et les sorties jusqu'au lendemain.", explanation: "Incorrect. Les sorties ne sont jamais bloquees ; tout figer pourrait vous piecer dans une position perdante, ce que la conception evite specifiquement." },
        { text: "Il met en pause uniquement les nouvelles entrees de l'IA tandis que les sorties reductrices de risque sont toujours autorisees, et la case Ne jamais mettre en pause sur drawdown correspond au Basique ELEVE.", explanation: "Correct. Le coupe-circuit endigue l'exposition nouvelle sans empecher les sorties, et cocher ne jamais mettre en pause equivaut au niveau Basique ELEVE qui desactive le coupe-circuit." },
        { text: "Il double la taille de position pour recuperer le drawdown plus vite.", explanation: "Incorrect. C'est un comportement de martingale ; le coupe-circuit reduit le risque nouveau au lieu de l'augmenter." },
        { text: "Il assouplit le plafond de slippage pour que davantage de trades s'executent.", explanation: "Incorrect. La tolerance au drawdown met en pause les nouvelles entrees ; elle ne touche pas a la tolerance au slippage, qui est un facteur distinct." },
      ],
      correctIndex: 1,
    },
  ],
};
