// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapitre expert sur les contrats intelligents et Soroban, la plateforme de
// contrats intelligents Rust/WASM de Stellar : ce qu'est un contrat, en quoi il
// diffère d'une opération classique, ses risques, et la composabilité DeFi via
// Blend, DeFindex et Soroswap. Rédigé selon exactement la même forme que
// content/en/chapter22.ts, avec la formule `whoFor` propre au chapitre typée via
// une intersection locale afin que l'interface Chapter en production reste
// intacte jusqu'à l'intégration. Ce chapitre ne possède aucun nouveau terme de
// glossaire ; il réutilise des termes enseignés dans les chapitres précédents.
import type { Chapter } from "../../../types";

export const chapter34: Chapter & { whoFor: string } = {
  id: "c34",
  number: 34,
  level: "EXPERT",
  whoFor: "Pour les traders qui explorent la frontière programmable et on-chain de Stellar",
  title: "Les contrats intelligents et Soroban sur Stellar",
  description:
    "Ce qu'est un contrat intelligent, ce que Soroban change pour Stellar, en quoi il diffère d'une simple transaction, ses risques, et comment il se compose en DeFi via Blend, DeFindex et Soroswap.",
  lessons: [
    {
      id: "c34-l1",
      title: "Qu'est-ce qu'un contrat intelligent ?",
      paragraphs: [
        "Le modèle mental le plus limpide pour un contrat intelligent est celui d'un distributeur automatique. Vous glissez une pièce dans la fente, appuyez sur le bouton de la boisson que vous voulez, et la machine vous la remet — automatiquement, sans caissier, et seulement si votre paiement couvre le prix. On ne peut pas la convaincre de vous offrir une boisson gratuite, et elle ne peut pas décider de garder votre argent sans rien vous donner. Les règles sont gravées dans la machine, et elles s'exécutent de la même manière chaque fois que les conditions sont réunies.",
        "Un contrat intelligent, c'est ce distributeur automatique écrit sous forme de code et déployé sur une blockchain. Techniquement, c'est un programme, stocké on-chain, dont la logique s'exécute de façon déterministe sur chaque nœud validateur. Déterministe signifie que les mêmes entrées produisent toujours les mêmes sorties et les mêmes changements d'état, quel que soit l'ordinateur qui l'exécute — une exigence stricte, car des milliers de validateurs indépendants doivent aboutir à des résultats identiques pour s'accorder sur le registre. Lorsque vous invoquez un contrat, vous ne demandez pas à une personne d'agir ; vous déclenchez un code convenu à l'avance qui fait respecter ses propres conditions et règle le résultat directement sur le registre.",
        "Deux propriétés rendent cela puissant pour un trader. Premièrement, le code est public et son comportement est vérifiable : n'importe qui peut lire ce qu'un contrat va faire avant d'interagir avec lui. Deuxièmement, une fois les conditions réunies, l'exécution est garantie et ne peut pas être annulée de façon sélective par une contrepartie — il n'y a aucun employé qui pourrait changer d'avis. C'est la promesse qui sous-tend la finance décentralisée : des accords financiers qui s'exécutent d'eux-mêmes, en toute transparence, sans intermédiaire de confiance détenant vos fonds.",
        "Le revers de la médaille, c'est qu'un contrat intelligent fait exactement ce que dit son code — ni plus, ni moins. Il n'a ni jugement ni bonne volonté. Si le code comporte une faille, la faille s'exécute tout aussi fidèlement que la logique voulue. C'est pourquoi lire, auditer et comprendre un contrat compte bien plus que faire confiance à une marque ou à une interface avenante.",
      ],
      example:
        "Un simple contrat d'entiercement encode ceci : \"Si le portefeuille A envoie 100 USDC et que le portefeuille B livre l'actif convenu avant l'instant T du bloc, libère les USDC vers B ; sinon, rembourse A après T.\" Aucun agent d'entiercement ne détient l'argent. Le contrat verrouille les fonds, surveille la condition et règle automatiquement — la logique du distributeur automatique, appliquée à un trade plutôt qu'à une canette.",
    },
    {
      id: "c34-l2",
      title: "Qu'est-ce que Soroban et qu'est-ce que cela change pour Stellar ?",
      paragraphs: [
        "Pendant la plus grande partie de son histoire, Stellar n'était volontairement pas programmable au sens général. Il proposait un menu figé d'opérations intégrées — paiements, offres sur le SDEX, lignes de confiance, paiements par chemin — qui sont rapides, peu coûteuses et prévisibles, mais vous ne pouviez combiner que les opérations déjà fournies par Stellar. Vous ne pouviez pas écrire votre propre logique on-chain. C'est cela que Soroban change. C'est la plateforme de contrats intelligents de Stellar : un environnement d'exécution qui permet aux développeurs de déployer des programmes arbitraires sur le réseau, aux côtés des opérations classiques que vous utilisez déjà dans Atrium.",
        "Sous le capot, les contrats Soroban sont écrits en Rust et compilés en WebAssembly (WASM). Le WASM est un format de bytecode compact et portable qui s'exécute à l'intérieur d'une machine virtuelle étroitement isolée, si bien qu'un contrat ne peut pas franchir les limites qui lui sont autorisées ni toucher au reste du système. Rust a été choisi pour ses solides garanties de sûreté et pour sa chaîne d'outils WASM mature ; la combinaison offre au réseau un moyen d'exécuter du code tiers non fiable sans laisser ce code déstabiliser le registre. Les contrats sont mesurés de sorte que chaque étape de calcul et chaque octet de stockage ait un coût, ce qui maintient l'exécution dans des bornes et rend les attaques par déni de service coûteuses.",
        "Ce que Soroban ajoute, c'est une programmabilité qui va au-delà du menu classique : marchés de prêt, coffres automatisés, AMM sur mesure, options et autres logiques qui n'avaient tout simplement aucune représentation dans les opérations intégrées de Stellar. Élément crucial, Soroban a été conçu pour coexister avec le modèle de comptes et les actifs existants. Un contrat Soroban peut détenir et déplacer les mêmes USDC et XLM que vous tradez déjà, si bien que les rails de paiement classiques rapides et peu coûteux et la nouvelle couche programmable vivent sur un seul et même registre plutôt que dans deux mondes déconnectés.",
        "Pour vous en tant que trader, le changement concret est que Stellar devient un lieu où des protocoles DeFi peuvent être construits, et non plus seulement un réseau de règlement rapide. Cela ouvre des capacités véritablement nouvelles — gagner du rendement, emprunter contre une garantie, acheminer des swaps à travers des pools programmables. Cela élargit aussi la surface de risque, car interagir avec un protocole Soroban revient à faire confiance à du code tiers, et non plus seulement aux opérations centrales de Stellar éprouvées au combat. Les prochaines leçons décortiquent précisément cette différence.",
      ],
      example:
        "Un swap Stellar classique utilise l'opération intégrée de paiement par chemin pour sauter à travers le SDEX et les pools AMM que Stellar fournit lui-même — vous ne pouvez pas modifier le fonctionnement de ce routage. Un swap Soroswap, en revanche, appelle un contrat Soroban : du code WASM écrit par un développeur qui met en œuvre ses propres calculs de pool et sa propre logique de frais. Les mêmes USDC et XLM sous-jacents, mais le second s'exécute sur du code programmable déployé sur le réseau plutôt que sur une opération intégrée figée.",
    },
    {
      id: "c34-l3",
      title: "En quoi un contrat intelligent diffère-t-il d'une transaction ordinaire ?",
      paragraphs: [
        "Une transaction Stellar ordinaire est un ensemble d'opérations intégrées choisies parmi un jeu figé : un paiement, une gestion d'offre sur le SDEX, un changement de confiance pour ajouter une ligne de confiance, un paiement par chemin. Chaque opération possède une sémantique prédéfinie que le cœur de Stellar fait respecter de manière identique pour tout le monde. Vous choisissez dans un menu que le réseau comprend déjà, et les validateurs savent à l'avance exactement ce que chaque opération peut et ne peut pas faire. C'est cette prévisibilité qui fait que les opérations classiques sont peu coûteuses, rapides et extrêmement bien comprises.",
        "Invoquer un contrat intelligent est fondamentalement différent : au lieu de choisir une opération connue, vous appelez une logique arbitraire qu'un développeur a écrite et déployée. Cette logique peut maintenir son propre état persistant on-chain — soldes, positions, configuration, données de prix — et lire et modifier cet état dans le cadre de l'appel. Un paiement classique déplace simplement de la valeur entre deux comptes ; une invocation de contrat peut exécuter des boucles, se ramifier selon des conditions, mettre à jour son propre stockage et même appeler d'autres contrats, le tout au sein d'une seule transaction atomique qui réussit entièrement ou échoue entièrement.",
        "Les deux mondes partagent la même propriété non négociable : le déterminisme. Que vous envoyiez un simple paiement ou que vous invoquiez un coffre complexe, chaque validateur doit aboutir au résultat identique, car le consensus de Stellar — le SCP, le Stellar Consensus Protocol, un accord byzantin fédéré bâti sur des ensembles de quorum — exige que les nœuds s'accordent octet pour octet sur le nouveau registre. Les contrats ne peuvent donc pas faire de choses non déterministes comme lire un nombre aléatoire depuis le système d'exploitation ou effectuer une requête réseau en direct ; toute donnée externe doit être fournie sous forme d'entrée explicite.",
        "Deux mécaniques propres à Soroban comptent ici. D'abord, les frais : une opération classique coûte des frais de réseau minuscules et quasi fixes (des fractions de centime en XLM), tandis qu'un appel de contrat est mesuré selon les ressources qu'il consomme — instructions CPU, mémoire et stockage — de sorte qu'une invocation lourde coûte plus cher qu'une invocation légère. Ensuite, l'empreinte : une transaction Soroban doit déclarer à l'avance exactement quels morceaux d'état du registre (quelles clés de stockage) elle va lire et écrire. Cette empreinte explicite permet aux validateurs d'aller chercher et de verrouiller uniquement l'état pertinent et d'exécuter les contrats en parallèle en toute sécurité, mais elle signifie aussi qu'un appel qui touche un état imprévu échouera au lieu de s'étaler silencieusement.",
      ],
      example:
        "Vendre des XLM contre des USDC dans l'onglet Trading manuel soumet généralement une opération classique de gestion d'offre ou de paiement par chemin : une opération connue, des frais fixes minuscules, aucun état personnalisé. Déposer ces mêmes USDC dans un pool de prêt Blend invoque un contrat Soroban : il met à jour les soldes stockés du pool, accumule des intérêts par rapport à son propre état, doit déclarer les entrées de stockage qu'il va toucher au titre de son empreinte, et se voit facturer des frais mesurés à la ressource. Le même actif, deux modèles d'exécution très différents.",
    },
    {
      id: "c34-l4",
      title: "Quels sont les risques des contrats intelligents ?",
      paragraphs: [
        "Le risque déterminant des contrats intelligents découle directement de leur plus grande force. Parce que le code s'exécute de façon déterministe et que le règlement est définitif, un bug s'exécute avec la même certitude qu'une logique correcte. Il n'y a aucun service d'assistance pour annuler un transfert erroné, ni aucune rétrofacturation. \"Le code fait loi\" tranche dans les deux sens : le contrat honorera un accord équitable sans intermédiaire, et il honorera tout aussi fidèlement une porte dérobée cachée ou une erreur arithmétique qui le vide.",
        "Les menaces se regroupent en quelques catégories. Les bugs sont des erreurs honnêtes — un cas limite mal géré, une erreur d'arrondi, un calcul de prix défectueux — qu'un attaquant peut exploiter pour retirer plus qu'il ne le devrait. Les exploits sont des attaques délibérées qui enchaînent de petites faiblesses jusqu'à provoquer une lourde perte ; parce que les contrats sont composables et s'appellent les uns les autres, une faille dans un protocole peut se propager en cascade vers d'autres qui lui font confiance. Les rug pulls sont malveillants par conception : le contrat contient des fonctions privilégiées — une clé de propriétaire capable de suspendre les retraits, d'émettre des tokens sans limite ou de vider le pool — de sorte que la façade \"sans confiance\" dissimule un interrupteur que le créateur peut actionner à tout moment. C'est là que le scan de lignes de confiance par l'IA dont vous avez peut-être entendu parler ailleurs dans l'Academy est pertinent : un stellar.toml manquant ou des métadonnées d'émetteur maigres et invérifiables sont un signal d'alerte pour la couche des actifs, et le même scepticisme s'applique aux contrats sur lesquels l'écosystème d'un actif repose.",
        "Les véritables défenses sont les permissions et les audits. Lisez qui contrôle le contrat : la propriété est-elle abandonnée ou détenue par une clé unique ? Une fonction privilégiée peut-elle déplacer vos fonds, et ce pouvoir est-il protégé par un verrou temporel ou une configuration multisignature plutôt que par le portefeuille d'une seule personne ? Un audit de sécurité professionnel — une revue indépendante du code par des spécialistes — réduit le risque sans jamais l'éliminer ; du code non audité mérite une profonde méfiance, et même du code audité a déjà échoué. Privilégiez les contrats dont la source est vérifiée par rapport au WASM déployé, afin que le code que vous lisez soit, de manière prouvable, le code qui s'exécute.",
        "Concrètement, traitez chaque interaction avec un contrat intelligent comme un risque de contrepartie sous une forme nouvelle. Dimensionnez vos positions de sorte que la perte totale d'un protocole donné ne soit pas catastrophique, privilégiez les contrats établis affichant dans la durée un long historique sans exploitation et une valeur réellement verrouillée, et comprenez qu'un rendement qui paraît bien au-dessus du marché est généralement la compensation d'un risque que vous n'avez pas pleinement identifié. Rien de tout cela n'est un conseil financier — c'est la même discipline qu'un trader prudent applique déjà, étendue au fait qu'ici votre contrepartie est un code autonome.",
      ],
      example:
        "Un contrat de coffre affiche un rendement élevé et des milliers d'utilisateurs y déposent des USDC. Enfouie dans son code se trouve une fonction \"retrait d'urgence\" réservée au propriétaire, sans verrou temporel. Un jour, le déployeur l'appelle et balaie tous les dépôts vers son propre portefeuille en une seule transaction irréversible et parfaitement valide. Rien n'a été piraté — le contrat a fait exactement ce que son code a toujours autorisé. Lire les permissions avant de déposer aurait mis au jour ce point de défaillance unique.",
    },
    {
      id: "c34-l5",
      title: "Comment la composabilité sur Stellar élargit-elle les possibilités de la DeFi ?",
      paragraphs: [
        "La composabilité est la propriété selon laquelle les protocoles on-chain peuvent s'appeler les uns les autres et s'empiler comme des briques, parce qu'ils partagent le même registre, les mêmes actifs et des interfaces publiques. Un contrat peut détenir une position dans un deuxième contrat, qui à son tour achemine vers un troisième — le tout au sein d'une seule transaction atomique qui aboutit entièrement ou échoue entièrement. C'est pourquoi on décrit souvent la DeFi comme des \"legos de l'argent\" : chaque protocole est une pièce, et les développeurs assemblent les pièces pour obtenir un comportement qu'aucune d'elles ne fournit seule. Sur Soroban, les mêmes USDC et XLM circulent librement entre les contrats, si bien que les pièces s'emboîtent véritablement au lieu de vivre dans des silos isolés.",
        "Soroswap est la couche AMM et DEX — la primitive de swap de base. Il met en œuvre des pools de liquidité et, surtout, l'agrégation et le routage à travers les places de marché, de sorte qu'un trade peut être fractionné et sauté pour trouver la meilleure exécution. Parce qu'il expose une interface de swap nette, d'autres contrats peuvent appeler Soroswap pour convertir un actif en un autre au milieu d'une transaction, plutôt que de forcer l'utilisateur à faire d'abord le swap manuellement. C'est la pièce qui répond à \"transforme l'actif X en actif Y tout de suite, on-chain.\"",
        "Blend est la couche de prêt et d'emprunt. Il fait tourner des pools de prêt isolés où les fournisseurs déposent des actifs pour gagner des intérêts et où les emprunteurs déposent une garantie pour contracter des prêts, avec des taux d'intérêt pilotés algorithmiquement par le taux d'utilisation du pool. Blend se compose avec une couche de swap d'une manière très concrète : les liquidations. Lorsque la garantie d'un emprunteur tombe sous le ratio requis, un liquidateur doit rembourser la dette et saisir la garantie — et il peut se procurer ou écouler les actifs nécessaires via un DEX comme Soroswap au sein du même flux. Le prêt à lui seul est utile ; le prêt qui peut atteindre atomiquement une place de swap est robuste.",
        "DeFindex est la couche de stratégie et de coffres qui se place au-dessus. Un coffre est un contrat qui accepte votre dépôt puis exécute une stratégie automatisée à travers les protocoles sous-jacents — par exemple, alimenter un pool Blend pour le rendement et rééquilibrer via Soroswap — de sorte qu'un utilisateur obtient une interface unique et simple de dépôt-et-gain tandis que la complexité tourne en dessous. C'est la composabilité rendue visible : DeFindex s'appuie sur Blend, Blend s'appuie sur un DEX pour les liquidations, et le DEX (Soroswap) n'est lui-même qu'une brique de plus. L'atout, c'est une flexibilité et une efficacité du capital énormes ; le contrepoint lucide, c'est que des dépendances empilées empilent le risque, car une défaillance dans n'importe quelle brique inférieure peut remonter à travers tout ce qui a été bâti dessus — ce qui est précisément la raison pour laquelle la discipline d'audit et de permissions de la leçon précédente compte le plus là où les protocoles se composent. Rien de tout cela n'est un conseil financier, fiscal ou juridique ; les rendements de la DeFi et leur traitement fiscal varient selon les juridictions.",
      ],
      example:
        "Vous déposez des USDC dans un coffre DeFindex et recevez un token de part de coffre. Sous le capot, le coffre alimente vos USDC vers un pool de prêt Blend pour gagner des intérêts ; si une partie de la stratégie nécessite un actif différent, il achemine la conversion via Soroswap — le tout automatiquement. Trois protocoles indépendants coopèrent dans un seul dépôt, et vous n'interagissez qu'avec un seul bouton tout simple. Cette pile, c'est la composabilité, et sa commodité repose sur la confiance accordée à chaque couche située en dessous.",
    },
  ],
  quiz: [
    {
      id: "c34-q1",
      prompt: "L'analogie du distributeur automatique saisit quelle propriété essentielle d'un contrat intelligent ?",
      options: [
        {
          text: "Il fait automatiquement respecter ses règles et règle le résultat lorsque les conditions sont réunies, sans qu'aucun intermédiaire puisse le contourner.",
          explanation:
            "Correct. Comme un distributeur automatique qui ne délivre que lorsqu'on l'a payé, un contrat exécute sa logique convenue de façon déterministe on-chain et règle directement sur le registre — aucun employé ne peut décider de garder votre argent ni d'offrir une boisson gratuite.",
        },
        {
          text: "Un opérateur de confiance examine chaque interaction et l'approuve ou l'annule manuellement.",
          explanation:
            "Faux, et c'est l'inverse de l'idée. Tout le principe est qu'aucun opérateur ne siège au milieu ; le code lui-même fait respecter les conditions sans approbation ni annulation humaine.",
        },
        {
          text: "Son comportement change selon le nœud qui l'exécute, si bien que les résultats varient d'un validateur à l'autre.",
          explanation:
            "Faux. Les contrats doivent être déterministes — des entrées identiques produisent des résultats identiques sur chaque nœud — précisément pour que tous les validateurs puissent s'accorder sur le registre. Un distributeur automatique donne le même résultat pour les mêmes pièces à chaque fois.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c34-q2",
      prompt: "Qu'ajoute Soroban à Stellar, sur le plan technique ?",
      options: [
        {
          text: "Il remplace le XLM par un nouveau token natif et met fin aux opérations de paiement classiques.",
          explanation:
            "Faux. Soroban ne remplace pas le XLM et ne supprime pas les opérations classiques ; il a été conçu pour coexister avec elles, et les contrats déplacent les XLM et USDC que vous tradez déjà.",
        },
        {
          text: "Un environnement d'exécution pour des contrats intelligents arbitraires écrits en Rust et compilés en WASM isolé, ajoutant une programmabilité qui va au-delà des opérations intégrées figées de Stellar.",
          explanation:
            "Correct. Soroban est la plateforme de contrats intelligents de Stellar : du code source Rust compilé en WebAssembly mesuré et isolé, permettant aux développeurs de déployer une logique on-chain sur mesure aux côtés du menu d'opérations classiques.",
        },
        {
          text: "Un algorithme de consensus plus rapide qui remplace le SCP par du minage en preuve de travail.",
          explanation:
            "Faux sur deux points. Soroban est une plateforme de contrats, et non un changement de consensus, et le consensus de Stellar reste le SCP (un accord byzantin fédéré), et non de la preuve de travail.",
        },
        {
          text: "Un serveur centralisé géré par la fondation Stellar qui exécute des scripts off-chain pour les utilisateurs.",
          explanation:
            "Faux. Les contrats Soroban s'exécutent on-chain sur chaque nœud validateur, de manière décentralisée et déterministe — et non sur un unique serveur central faisant tourner des scripts off-chain.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q3",
      prompt: "Quelle affirmation distingue le mieux l'invocation d'un contrat Soroban de la soumission d'une opération classique comme un paiement ?",
      options: [
        {
          text: "Les opérations classiques sont non déterministes tandis que les appels de contrat sont déterministes.",
          explanation:
            "Faux. Les deux sont strictement déterministes — le SCP exige que chaque validateur aboutisse à des résultats identiques dans les deux cas. Le déterminisme est une exigence commune, pas une différence.",
        },
        {
          text: "Un paiement classique peut appeler d'autres contrats et boucler sur son propre stockage, alors qu'un contrat ne le peut pas.",
          explanation:
            "À l'envers. C'est l'invocation de contrat qui peut se ramifier, boucler, modifier son propre stockage et appeler d'autres contrats ; un paiement classique déplace simplement de la valeur entre deux comptes.",
        },
        {
          text: "Un appel de contrat exécute une logique écrite par un développeur avec son propre état persistant, est mesuré selon les ressources qu'il utilise, et doit déclarer l'empreinte du registre qu'il va lire et écrire.",
          explanation:
            "Correct. Contrairement à une opération intégrée figée assortie de frais quasi fixes, une invocation de contrat exécute une logique arbitraire modifiant l'état, se voit facturée selon le CPU/la mémoire/le stockage consommés, et doit pré-déclarer son empreinte de stockage pour que les validateurs puissent verrouiller et paralléliser en toute sécurité.",
        },
        {
          text: "Les appels de contrat sont toujours gratuits, tandis que les paiements classiques coûtent toujours plus cher.",
          explanation:
            "Faux. Les opérations classiques portent des frais minuscules et quasi fixes ; les appels de contrat sont mesurés à la ressource et une invocation lourde coûte généralement plus cher qu'un simple paiement, et non moins.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c34-q4",
      prompt: "Un coffre DeFi détient les USDC de milliers d'utilisateurs. Son code contient une fonction réservée au propriétaire capable de retirer tous les dépôts sans verrou temporel. Un jour, le déployeur l'appelle et vide tout. De quel type de risque s'agit-il, et qu'est-ce qui l'aurait signalé ?",
      options: [
        {
          text: "C'était un piratage du réseau ; rien dans le contrat lui-même n'aurait pu avertir les utilisateurs.",
          explanation:
            "Faux. Rien n'a été piraté — le contrat a exécuté exactement ce que son code a toujours permis. Le danger résidait dans la logique privilégiée propre au contrat, qui était inspectable au préalable.",
        },
        {
          text: "Un rug pull via des permissions privilégiées ; lire qui contrôle le contrat et si une clé de propriétaire peut déplacer les fonds l'aurait mis au jour.",
          explanation:
            "Correct. C'est un rug pull inscrit dans les permissions. Vérifier le contrôle du contrat — une clé de propriétaire unique dotée d'une fonction de retrait sans restriction ni verrou temporel — est exactement la discipline d'audit et de permissions qui signale le point de défaillance unique avant que vous ne déposiez.",
        },
        {
          text: "L'aversion à la perte a poussé le déployeur à vendre ; c'est un problème de psychologie du trader, et non un problème de contrat.",
          explanation:
            "Faux. L'aversion à la perte concerne les sorties émotionnelles d'un trader, et non un déployeur qui vide un pool. Il s'agit ici d'un risque de permissions d'un contrat intelligent, sans rapport avec ce concept.",
        },
        {
          text: "C'était une conséquence inévitable du déterminisme qu'aucune revue de code n'aurait pu révéler.",
          explanation:
            "Faux. Le déterminisme explique pourquoi le vol était irréversible une fois déclenché, mais la porte dérobée était clairement présente dans le code et les permissions — les lire au préalable l'aurait révélée.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q5",
      prompt: "Dans la pile DeFi de Stellar, comment Soroswap, Blend et DeFindex se composent-ils ?",
      options: [
        {
          text: "Ce sont trois applications isolées qui ne peuvent pas interagir, puisque les contrats Soroban ne peuvent pas s'appeler les uns les autres.",
          explanation:
            "Faux. La composabilité est tout l'enjeu : les contrats Soroban partagent le même registre et les mêmes actifs et peuvent s'appeler de manière atomique au sein d'une seule transaction.",
        },
        {
          text: "DeFindex est le moteur de swap de base, Blend se place au-dessus de lui, et Soroswap est un gestionnaire de coffres bâti sur Blend.",
          explanation:
            "Faux — les rôles sont mélangés. Soroswap est la primitive de swap AMM/DEX, Blend est le prêt/emprunt, et DeFindex est la couche de stratégie et de coffres qui se place au-dessus des autres.",
        },
        {
          text: "Ils ne se composent qu'en faisant tourner chacun sa propre blockchain distincte et en pontant les actifs entre elles.",
          explanation:
            "Faux. Tous les trois sont des contrats Soroban sur le même registre Stellar, partageant directement les mêmes USDC et XLM — aucune chaîne distincte ni aucun pont d'actifs n'est nécessaire pour qu'ils s'emboîtent.",
        },
        {
          text: "Soroswap fournit les swaps, Blend fournit un prêt qui peut atteindre un DEX pour les liquidations, et DeFindex bâtit des stratégies de coffres au-dessus des deux — un empilement comme des legos de l'argent, qui empile aussi leur risque.",
          explanation:
            "Correct. Soroswap est la primitive de base AMM/routage, Blend est la couche de prêt qui peut se procurer ou écouler des actifs via un DEX pendant les liquidations, et les coffres DeFindex orchestrent des stratégies à travers les deux. La commodité de la pile repose sur la confiance accordée à chaque couche située en dessous.",
        },
      ],
      correctIndex: 3,
    },
  ],
};
