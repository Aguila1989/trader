import type { Chapter } from "../../types";

export const chapter09: Chapter = {
  id: "c9",
  number: 9,
  level: "ADVANCED",
  title: "Gestion de portefeuille",
  description:
    "Lisez la vue d'ensemble de votre portefeuille, comprenez les plafonds de trading et le drawdown, et jugez si vos trades fonctionnent vraiment.",
  lessons: [
    {
      id: "c9-l1",
      title: "Qu'est-ce que la valeur du portefeuille et comment est-elle calculee ?",
      paragraphs: [
        "La valeur de votre portefeuille, c'est tout simplement ce que vaut en ce moment tout ce que vous detenez, additionne. L'application la calcule en prenant chaque avoir, en multipliant son solde par le prix unitaire actuel de cet actif, puis en additionnant les resultats sur l'ensemble des avoirs. Comme chaque actif peut etre evalue de deux facons, l'en-tete affiche cote a cote un total en XLM et un total en USDC.",
        "Les prix proviennent des marches Stellar en temps reel, donc la valeur bouge des que les marches bougent. L'application reevalue a intervalle regulier, si bien que les totaux que vous voyez sont un instantane recent, pas un chiffre fige. Rafraichir ou attendre quelques secondes peut faire varier le montant meme si vous n'avez rien fait.",
        "Une mise en garde importante : certains actifs peuvent n'afficher aucun prix. S'il n'existe aucune route de trading sur le reseau Stellar pour convertir cet actif en XLM ou en USDC, l'application ne peut pas l'evaluer, et cet avoir ne contribue en rien au total chiffre. Considerez ces avoirs comme de valeur inconnue plutot que nulle.",
      ],
      example:
        "Supposons que vous deteniez 1000 XLM et 50 USDC. Si 1 USDC vaut 8.5 XLM, alors vos USDC valent 425 XLM. Votre total en XLM est de 1000 plus 425, soit 1425 XLM. Dans l'autre sens, si 1 XLM vaut environ 0.1176 USDC, vos 1000 XLM valent a peu pres 117.6 USDC, donc votre total en USDC est de 117.6 plus 50, soit environ 167.6 USDC. La meme richesse, dans deux monnaies.",
    },
    {
      id: "c9-l2",
      title: "Comment lire la vue d'ensemble du portefeuille dans cette application",
      paragraphs: [
        "La vue d'ensemble du portefeuille se trouve dans l'en-tete du tableau de bord. Elle liste chaque actif que vous detenez sur une ligne, en affichant le solde que vous possedez, la valeur de ce solde en XLM et la valeur de ce solde en USDC. Lire une ligne de gauche a droite vous indique combien d'un actif vous avez et ce qu'il vaut dans les deux monnaies de reference.",
        "Sous les lignes ou a cote, vous trouverez les totaux : la valeur totale du portefeuille en XLM et la valeur totale du portefeuille en USDC. Ce sont les sommes decrites dans la lecon precedente. Jetez-y un oeil en premier pour jauger votre situation globale avant de plonger dans une position en particulier.",
        "Surveillez les lignes ou un prix est manquant. Cela signale qu'il n'existe actuellement aucune route de marche pour cet actif, donc sa ligne peut afficher un solde mais aucune valeur. Ne confondez pas un prix manquant avec un actif sans valeur ; cela veut juste dire que l'application ne peut pas l'evaluer pour le moment, et les totaux l'excluent.",
      ],
      example:
        "Imaginez trois lignes : XLM avec un solde de 2000 valant 235 USDC, USDC avec un solde de 100 valant 100 USDC, et un jeton obscur avec un solde de 500 mais une valeur vide car aucune route n'existe. Le total en USDC affiche environ 335, qui ne compte que les lignes XLM et USDC. Les 500 jetons obscurs sont detenus mais non comptes, donc votre valeur reelle est d'au moins 335 plus ce qu'ils rapporteraient.",
    },
    {
      id: "c9-l3",
      title: "Qu'est-ce qu'un plafond de trading et pourquoi l'IA en a-t-elle un ?",
      paragraphs: [
        "Un plafond de trading est une limite que l'IA impose sur le montant de capital qu'elle engagera. Il y a deux niveaux : un montant maximum par trade individuel, et une exposition totale maximale sur l'ensemble des positions ouvertes en meme temps. Le plafond par trade est plus eleve pour les paires de stablecoins blue-chip, qui sont plus profondes et plus sures, et plus bas pour les paires plus minces ou plus risquees.",
        "Le but est le controle du risque. Les plafonds empechent un seul signal qui parait convaincant de miser tout le portefeuille, et le plafond d'exposition empeche de nombreux petits trades de s'accumuler discretement jusqu'a un total dangereux. Ensemble, ils bornent le maximum que vous pouvez perdre si le marche se retourne contre toutes les positions ouvertes en meme temps.",
        "Les ordres manuels fonctionnent differemment. Quand vous placez un trade vous-meme, vous contournez les plafonds de taille, de volume et d'exposition de l'IA, parce que vous prenez la responsabilite directe du dimensionnement. Les ordres manuels passent quand meme par les garde-fous de securite, donc les ordres imprudents ou manifestement defaillants restent bloques, mais les limites de dimensionnement prudent sont a vous de fixer.",
      ],
      example:
        "Disons que le plafond par trade de l'IA est de 200 USDC pour une paire de stablecoins et que le plafond d'exposition totale est de 500 USDC. Avec 350 USDC deja engages sur deux positions ouvertes, l'IA dispose encore de 150 USDC de marge. Un nouveau signal qui veut 200 USDC sera ramene a 150 pour respecter le plafond d'exposition. Vous, en placant le meme trade manuellement, pourriez engager les 200 entiers si vous le vouliez, mais vous porteriez ce risque supplementaire vous-meme.",
    },
    {
      id: "c9-l4",
      title: "Qu'est-ce que le drawdown et comment le gerer ?",
      paragraphs: [
        "Le drawdown est la baisse depuis un pic de valeur du portefeuille jusqu'a un creux ulterieur. Si votre portefeuille a atteint un point haut puis a chute, le drawdown est la distance en dessous de ce point haut a laquelle vous vous situez actuellement, generalement exprimee en pourcentage. Il mesure la douleur, pas juste un chiffre, car les drawdowns profonds sont difficiles a recuperer.",
        "Cette application aide a gerer le drawdown automatiquement grace a un budget de perte quotidien. A mesure que les pertes s'accumulent dans la journee, les tailles de position sont reduites progressivement, passant de la taille pleine a environ 100 pour cent du budget restant vers environ 25 pour cent a mesure que le budget est consomme. Le bot mise moins precisement quand il est deja en perte.",
        "Si le budget de perte quotidien est entierement consomme, le bot suspend les nouvelles entrees jusqu'au lendemain et n'autorise que les sorties qui reduisent le risque, ce qui veut dire qu'il peut encore cloturer ou alleger des positions pour reduire le risque mais ne peut pas en ouvrir de nouvelles. Ce coupe-circuit empeche une mauvaise journee de degenerer en journee catastrophique.",
      ],
      example:
        "Votre portefeuille culmine a 1000 USDC, puis glisse a 850 USDC. Le drawdown est de 150 USDC, soit 15 pour cent. Pour recuperer, il faut plus qu'un gain de 15 pour cent : depuis 850, vous devez remonter d'environ 17.6 pour cent pour revenir a 1000, parce que les gains se composent sur une base plus petite. Cette asymetrie est exactement pourquoi le budget de perte reduit le dimensionnement et finit par suspendre les entrees avant que le trou ne se creuse davantage.",
    },
    {
      id: "c9-l5",
      title: "Comment evaluer si vos trades sont performants",
      paragraphs: [
        "Commencez par le profit et perte realise contre non realise. L'application suit le PnL realise quotidien, soit l'argent reellement verrouille par les trades clotures, et le PnL non realise, soit le gain ou la perte en valeur de marche sur les positions que vous detenez encore. Un joli chiffre non realise n'est qu'une promesse tant que vous n'avez pas cloture la position et qu'il ne devient pas realise.",
        "Utilisez les statistiques et les courbes d'evolution pour voir la tendance plutot qu'un instant isole. Une ligne en dents de scie qui continue de faire de nouveaux sommets est plus saine qu'une ligne lisse qui derive vers le bas. Associez cela a la vue du drawdown pour juger combien de douleur vous avez endure pour gagner ces rendements.",
        "Enfin, jugez le bot et vous-meme separement. Le tableau d'historique est justement separe entre les trades manuels et les trades du bot pour cette raison. Comparer les deux vous permet de voir si votre instinct manuel bat l'IA, ou si l'IA surperforme discretement vos ordres places a la main, afin de vous appuyer sur celui qui fonctionne vraiment.",
      ],
      example:
        "Sur une journee, l'onglet du bot affiche dix trades clotures avec 12 USDC de profit realise et une position ouverte en hausse de 5 USDC non realises. L'onglet manuel affiche trois trades avec 4 USDC de perte realisee. Le total realise est de 8 USDC en hausse, mais la separation revele que le bot a gagne 12 tandis que vos trades manuels ont perdu 4. La lecture honnete est de laisser le bot continuer et d'examiner pourquoi vos entrees manuelles ont sous-performe.",
    },
    {
      id: "c9-l6",
      title: "Lire le graphique d'evolution du portefeuille",
      paragraphs: [
        "Le graphique d'evolution trace la valeur totale de votre portefeuille, en USDC, au fil du temps. Chaque point est un instantane de tout ce que vous deteniez a ce moment, evalue et additionne comme les lecons precedentes l'ont decrit. Lisez de gauche a droite et vous regardez l'histoire de votre compte : ou il a commence, ou il en est maintenant, et a quel point la route entre les deux a ete cahoteuse.",
        "La competence la plus importante est de distinguer deux raisons tres differentes pour lesquelles la ligne peut monter. L'appreciation de prix, c'est vos avoirs existants qui prennent de la valeur, et cela apparait comme une pente plutot lisse qui suit le marche. L'ajout de fonds, c'est de l'argent que vous avez depose, et cela apparait comme un saut vertical soudain qu'aucun mouvement de marche ne pourrait expliquer. Un bond de 100 a 300 USDC en une seule etape est presque surement un depot, pas une hausse de 200 pour cent, donc n'en creditez pas l'IA.",
        "La forme de la ligne vous renseigne sur le risque. Une ligne plate et horizontale signifie que votre valeur se maintient stable, avec peu de choses dans un sens ou dans l'autre. Une ligne en dents de scie avec de grands sommets et des creux profonds signifie une forte volatilite : de plus grandes variations, ce qui represente a la fois plus d'opportunite et plus de risque. Aucune des deux n'est automatiquement bonne ; une ligne plate pendant une hausse du marche peut vouloir dire que vous restez en stablecoins et manquez les mouvements, tandis qu'une ligne violente peut vouloir dire que vous prenez plus de risque que prevu.",
        "La periode change toute l'histoire, alors verifiez toujours celle que vous consultez. Une fenetre de 24 heures est surtout du bruit : les oscillations normales d'une journee paraissent dramatiques quand on zoome autant. Une vue sur 1 an lisse ce bruit en une vraie tendance, montrant si le compte croit reellement, derive ou saigne sur le long terme. Jugez la performance sur la longue periode et n'utilisez la courte que pour comprendre la journee.",
        "Mis ensemble, le graphique est la facon dont vous jugez si l'IA fait vraiment croitre le portefeuille. Soustrayez mentalement chaque saut de depot, puis demandez-vous si la pente restante tend vers le haut sur une fenetre significative. Si la ligne ne monte que parce que vous ajoutez sans cesse de l'argent, la strategie ne fonctionne pas, aussi vert que le total puisse paraitre.",
      ],
      example:
        "Votre ligne d'evolution sur 90 jours part de 200 USDC, monte en douceur jusqu'a 240, puis bondit tout droit a 440 en une seule etape le jour 45, et se termine a 455. Il est tentant d'appeler cela un gain de 127 pour cent. Mais le saut vertical de 200 le jour 45 est un depot, pas un profit de trading. Retirez-le et l'image reelle est 200 vers 240 avant le depot et 440 vers 455 apres, soit environ 20 plus 15, a peu pres 35 USDC d'appreciation reelle sur 400 de capital, pres de 9 pour cent. Sain, mais loin des 127, et seule la lecture corrigee des depots vous dit que l'IA fonctionne vraiment.",
    },
  ],
  quiz: [
    {
      id: "c9-q1",
      prompt:
        "Vous detenez 1000 XLM et 50 USDC, et 1 USDC vaut 8.5 XLM. Quelle est la valeur totale de votre portefeuille en XLM ?",
      options: [
        {
          text: "1050 XLM",
          explanation:
            "Incorrect. Cela additionne simplement les deux soldes comme si 1 USDC equivalait a 1 XLM, en ignorant le prix.",
        },
        {
          text: "1425 XLM",
          explanation:
            "Correct. Les 50 USDC valent 50 fois 8.5, soit 425 XLM, ajoutes a 1000 XLM cela donne 1425 XLM.",
        },
        {
          text: "8500 XLM",
          explanation:
            "Incorrect. Cela evalue seulement les USDC a la mauvaise echelle et laisse entierement de cote les 1000 XLM.",
        },
        {
          text: "425 XLM",
          explanation:
            "Incorrect. C'est juste la valeur de la part en USDC et cela oublie d'ajouter les 1000 XLM.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q2",
      prompt:
        "Dans la vue d'ensemble du portefeuille, un actif affiche un solde mais sa colonne de valeur est vide. Qu'est-ce que cela signifie ?",
      options: [
        {
          text: "L'actif est sans valeur et compte pour zero dans vos totaux.",
          explanation:
            "Incorrect. Une valeur vide n'est pas la meme chose qu'une valeur nulle ; l'application ne peut simplement pas l'evaluer.",
        },
        {
          text: "Il n'existe actuellement aucune route de marche pour l'evaluer, donc il est exclu des totaux chiffres.",
          explanation:
            "Correct. Sans route de trading vers XLM ou USDC, l'application ne peut pas l'evaluer, et les totaux le laissent de cote meme si vous le detenez toujours.",
        },
        {
          text: "Votre solde pour cet actif est nul.",
          explanation:
            "Incorrect. La colonne de solde affiche un avoir reel ; seule la valeur est manquante.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q3",
      prompt: "Pourquoi l'IA applique-t-elle un plafond par trade et un plafond d'exposition totale ouverte ?",
      options: [
        {
          text: "Pour borner le risque afin qu'aucun signal seul ne mise tout le portefeuille et que de nombreux trades ne puissent pas s'accumuler discretement jusqu'a un total dangereux.",
          explanation:
            "Correct. Le plafond par trade limite une mise unique et le plafond d'exposition limite le risque combine de toutes les positions ouvertes.",
        },
        {
          text: "Pour garantir que chaque trade est rentable.",
          explanation:
            "Incorrect. Les plafonds limitent le montant en risque ; ils ne peuvent rendre aucun trade rentable.",
        },
        {
          text: "Pour vous forcer a utiliser des ordres manuels pour les gros trades.",
          explanation:
            "Incorrect. Les ordres manuels contournent bien ces plafonds, mais c'est une consequence, pas le but des plafonds.",
        },
        {
          text: "Pour accelerer la frequence a laquelle le bot scanne le marche.",
          explanation:
            "Incorrect. Les plafonds gouvernent le capital en risque, pas la frequence de scan.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q4",
      prompt:
        "Votre portefeuille a culmine a 1000 USDC et est maintenant a 850 USDC. Quel est le drawdown, et que se passe-t-il a mesure que le budget de perte quotidien est consomme ?",
      options: [
        {
          text: "Le drawdown est de 15 pour cent, et a mesure que le budget est consomme les tailles de position sont reduites progressivement et les nouvelles entrees finissent par etre suspendues.",
          explanation:
            "Correct. Le drawdown est la baisse de 150 USDC depuis le pic de 1000, soit 15 pour cent, et le budget de perte fait passer le dimensionnement d'environ 100 pour cent vers 25 pour cent avant de suspendre les nouvelles entrees.",
        },
        {
          text: "Le drawdown est de 15 pour cent, et le bot augmente les tailles de position pour recuperer plus vite.",
          explanation:
            "Incorrect. Le chiffre du drawdown est juste, mais le bot reduit les tailles a mesure que les pertes montent, il ne mise pas plus gros.",
        },
        {
          text: "Le drawdown correspond aux 850 USDC que vous detenez encore, et rien ne change dans le dimensionnement.",
          explanation:
            "Incorrect. Le drawdown est la baisse depuis le pic, pas le solde restant, et le budget de perte modifie bien le dimensionnement.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q5",
      prompt:
        "Sur le graphique d'evolution, la ligne bondit tout droit de 100 a 300 USDC en une seule etape. Que s'est-il le plus probablement passe ?",
      options: [
        {
          text: "Vous avez ajoute des fonds ; un saut vertical soudain est un depot, pas une appreciation de prix.",
          explanation:
            "Correct. Les depots apparaissent comme des marches verticales instantanees, tandis que l'appreciation de prix se montre comme une pente qui suit le marche, donc ce saut ne doit pas etre credite a l'IA.",
        },
        {
          text: "L'IA a triple votre argent en un instant grace au trading.",
          explanation:
            "Incorrect. Les gains de trading s'accumulent comme une pente dans le temps, pas comme un unique bond vertical ; un saut comme celui-ci est presque toujours un depot.",
        },
        {
          text: "Le graphique est casse et le chiffre doit etre ignore.",
          explanation:
            "Incorrect. Le saut est reel et significatif, il reflete simplement de l'argent neuf que vous avez ajoute plutot qu'un mouvement de marche.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q6",
      prompt:
        "Vous voulez juger si l'IA fait vraiment croitre le portefeuille. Quelle lecture est la plus fiable ?",
      options: [
        {
          text: "La ligne sur 24 heures, parce qu'elle se met a jour le plus souvent.",
          explanation:
            "Incorrect. Une fenetre de 24 heures est surtout du bruit intrajournalier ; les petites oscillations paraissent dramatiques et cachent la vraie tendance de long terme.",
        },
        {
          text: "La tendance sur longue periode, avec les sauts de depot soustraits mentalement.",
          explanation:
            "Correct. Une longue fenetre revele la vraie tendance, et retirer les sauts de depot montre si la croissance vient de l'IA plutot que de l'argent que vous avez ajoute.",
        },
        {
          text: "Le point le plus haut que la ligne ait jamais atteint.",
          explanation:
            "Incorrect. Un seul pic ne dit rien de la tendance ni de la part de la valeur provenant des depots par rapport aux vrais gains.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
