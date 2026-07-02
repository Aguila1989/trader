// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Arbitrage et efficience des marchés (EXPERT) : ce qu'est l'arbitrage, comment
// les paiements par chemin de Stellar permettent de capturer atomiquement les
// écarts de prix, pourquoi les arbitragistes resserrent les spreads et ajoutent
// de la liquidité, si le MEV existe sur Stellar, et comment tout cela façonne les
// prix du SDEX et des AMM contre lesquels vous tradez dans l'application. Ne
// possède aucun nouveau terme de glossaire ; réutilise le vocabulaire enseigné
// dans les chapitres précédents. Rédigé selon la même forme exacte que
// content/en/chapter22.ts, avec la ligne `whoFor` propre au chapitre
// typée via une intersection locale afin que l'interface Chapter live reste
// intacte.
import type { Chapter } from "../../types";

export const chapter35: Chapter & { whoFor: string } = {
  id: "c35",
  number: 35,
  level: "EXPERT",
  whoFor: "Pour les traders qui veulent comprendre les forces qui maintiennent les prix honnêtes",
  title: "Arbitrage et efficience des marchés",
  description:
    "Ce qu'est l'arbitrage, comment les paiements par chemin de Stellar lui permettent de capturer atomiquement les écarts de prix, pourquoi les arbitragistes rendent les marchés plus efficients, si le MEV existe sur Stellar, et comment tout cela façonne les prix que vous voyez dans cette application.",
  lessons: [
    {
      id: "c35-l1",
      title: "Qu'est-ce que l'arbitrage ?",
      paragraphs: [
        "L'arbitrage consiste à acheter un actif là où il est bon marché et à vendre le même actif là où il est cher, en empochant la différence comme profit. Imaginez un trader qui remarque qu'une certaine marque de café coûte 2 USDC dans un supermarché discount et 3 USDC chez un épicier haut de gamme situé juste en face. S'il peut acheter dans la boutique bon marché et revendre aussitôt à la boutique chère, il empoche 1 USDC par paquet sans avoir la moindre opinion sur la question de savoir si le café est un bon placement à long terme. Il ne parie pas sur une hausse ou une baisse du prix ; il récolte l'écart entre deux prix pour la même chose au même instant.",
        "En crypto, la même logique s'applique d'un lieu de trading à l'autre. Ce même actif exact — disons le XLM libellé en USDC — peut se négocier à des taux légèrement différents sur le carnet d'ordres du SDEX, à l'intérieur d'un pool de liquidité AMM et sur une bourse centralisée ailleurs. Chaque fois que ces prix cotés s'écartent les uns des autres, un écart de prix s'ouvre, et capturer cet écart, c'est de l'arbitrage. La caractéristique déterminante est que les deux jambes renvoient à la même valeur sous-jacente, si bien que le profit ne dépend pas d'un mouvement du marché en votre faveur ; il dépend seulement du fait que le décalage persiste assez longtemps pour être exploité.",
        "Deux propriétés rendent le véritable arbitrage difficile. Premièrement, les écarts sont généralement minuscules, souvent une fraction de pour cent, parce que tout le monde les traque ; le profit par unité est faible et n'en vaut la peine qu'à grande échelle ou à grande vitesse. Deuxièmement, les deux jambes doivent être aussi simultanées que possible : si vous achetez au prix bas mais que le lieu cher bouge avant que vous ne vendiez, l'écart peut s'évaporer ou s'inverser, et votre trade sans risque se transforme en un simple pari directionnel. C'est pourquoi la mécanique d'exécution — le délai de règlement, les frais et l'atomicité — importe autant que le fait de repérer l'écart. Ceci est du contenu éducatif, pas un conseil financier.",
      ],
      example:
        "Supposons qu'un pool AMM cote le XLM à 0,1200 USDC tandis que le carnet d'ordres du SDEX présente des ordres d'achat en attente à 0,1210 USDC. Un arbitragiste achète du XLM au pool à 0,1200 et le vend à l'ordre d'achat du SDEX à 0,1210, dégageant 0,0010 USDC par XLM avant frais. Sur un trade de 10 000 XLM, cela représente 10 USDC de marge brute — mince, mais répétable et neutre sur le plan directionnel, car le profit provient de l'écart de 0,0010, et non d'une quelconque opinion sur la direction que prend le XLM.",
    },
    {
      id: "c35-l2",
      title: "Comment l'arbitrage fonctionne-t-il sur Stellar via les paiements par chemin ?",
      paragraphs: [
        "Stellar possède une fonctionnalité native presque conçue sur mesure pour l'arbitrage : le paiement par chemin. Comme présenté dans le chapitre sur les fonctionnalités avancées de Stellar, un paiement par chemin convertit un actif en un autre en sautant à travers une chaîne de marchés en une seule opération — par exemple du XLM vers de l'USDC vers du yXLM puis de nouveau vers du XLM — remplissant chaque saut contre les meilleurs carnets d'ordres du SDEX et pools de liquidité AMM disponibles le long de la route. L'ensemble du chemin s'exécute d'un seul tenant ou échoue et s'annule ; il n'existe aucun état où vous vous retrouveriez à moitié converti. Cette propriété du tout ou rien s'appelle l'atomicité, et c'est exactement ce dont un arbitragiste a besoin pour éliminer le risque de jambe décrit plus haut.",
        "Pour l'arbitrage, la variante puissante est un paiement par chemin qui commence et se termine dans le même actif. Vous envoyez, disons, 1 000 XLM par une route qui touche plusieurs marchés et vous précisez que vous devez recevoir au moins 1 001 XLM en retour ; si les prix de marché tout au long de la boucle ne s'additionnent pas pour donner un profit, l'opération échoue simplement et vous n'avez perdu que les frais de réseau dérisoires (~0,00001 XLM). Le protocole de Stellar va même chercher un chemin favorable parmi les carnets d'ordres et les pools qu'il connaît. Parce que toute la boucle se règle à la fermeture d'un seul registre, l'écart de prix que vous avez repéré ne peut pas se retourner contre vous entre deux jambes — le cauchemar classique de l'arbitragiste, à savoir la deuxième jambe qui s'échappe, est structurellement impossible.",
        "Le mécanisme est une conversion circulaire : l'argent sort dans un actif, ricoche à travers des carnets d'ordres intermédiaires et des pools AMM à 0,30 %, et revient dans le même actif avec un surplus net. Le trader précise un minimum reçu strict (une contrainte de sendMax et de montant de destination sous le capot), de sorte que le registre fait respecter le seuil de rentabilité. La concurrence est féroce et les marges se referment vite, si bien que réussir un arbitrage sur Stellar consiste largement à détecter des décalages fugaces d'un lieu à l'autre plus vite que ses rivaux et à les exprimer sous la forme d'un unique chemin atomique avant la fermeture du registre suivant.",
      ],
      example:
        "Un bot d'arbitrage surveille Horizon et repère que le pool AMM XLM/USDC est momentanément bon marché par rapport aux carnets d'ordres yXLM/USDC et yXLM/XLM. Il soumet un seul paiement par chemin : envoyer 1 000 XLM, router le XLM vers l'USDC (pool), l'USDC vers le yXLM (carnet d'ordres), le yXLM vers le XLM (carnet d'ordres), minimum de destination 1 000,6 XLM. Si chaque saut se remplit aux taux attendus, la boucle renvoie plus de XLM qu'elle n'en a envoyé et le bot conserve le surplus ; si un saut a déjà bougé, la vérification du minimum de destination échoue, toute l'opération s'annule, et seuls les frais de base minuscules sont dépensés.",
    },
    {
      id: "c35-l3",
      title: "Qu'apportent les arbitragistes au marché ? En quoi sont-ils utiles ?",
      paragraphs: [
        "Bien que les arbitragistes agissent uniquement pour leur propre profit, l'effet secondaire de leur activité est un marché plus honnête et plus exploitable pour tous les autres. Chaque fois qu'un arbitragiste achète au lieu bon marché et vend au lieu cher, il pousse le prix bas vers le haut et le prix élevé vers le bas. Répété sur des milliers de trades minuscules, cela tire le prix du même actif vers un quasi-alignement partout où il se négocie. Sans eux, le SDEX, les pools AMM et les bourses extérieures seraient régulièrement en désaccord, et un trader naïf pourrait, sans le savoir, transiger à un taux périmé, décalé du marché.",
        "Ce travail d'alignement des prix resserre aussi les spreads et ajoute de la liquidité effective. Un arbitragiste qui se tient prêt à acheter tout pool qui descend sous la juste valeur et à vendre tout carnet qui grimpe au-dessus fournit, en pratique, de la profondeur : sa disposition à trader l'écart signifie que les gros ordres font moins bouger le prix, parce que quelqu'un s'appuie toujours contre le décalage de prix. Le spread bid-ask — la distance entre le meilleur achat et la meilleure vente — se resserre parce que l'arbitrage retire le profit facile d'un large écart, et un spread plus étroit est une économie directe pour les traders ordinaires.",
        "Le nom économique de l'état final vers lequel ils poussent est l'efficience des marchés : un marché où les prix reflètent rapidement toute l'information disponible et où les occasions de profit évidentes et sans risque sont éliminées par la concurrence presque aussi vite qu'elles apparaissent. Aucun marché n'est parfaitement efficient, et des écarts fugaces existent toujours, mais l'arbitrage est le mécanisme qui maintient l'imperfection à un niveau réduit. Plus l'arbitrage est sain et disputé, plus les décalages de prix sont petits et éphémères, ce qui explique pourquoi les paires profondes et liquides restent arrimées à la juste valeur tandis que les tokens minces et délaissés peuvent dériver bien plus loin avant que quiconque ne se donne la peine de les corriger. En ce sens, les arbitragistes sont les concierges non rémunérés du système de prix — intéressés, mais maintenant cohérent et équitablement valorisé le lieu sur lequel vous vous appuyez ; et leur absence est en soi un signal d'alerte indiquant qu'un marché est illiquide ou difficile à trader.",
      ],
      example:
        "Imaginez que le pool AMM XLM/USDC fléchisse à 0,1180 USDC tandis que chaque carnet d'ordres et chaque bourse extérieure se négocient encore près de 0,1210. Les arbitragistes déversent des ordres d'achat dans le pool bon marché, le relevant, et vendent le XLM acquis dans les carnets plus élevés, les faisant redescendre, jusqu'à ce que le pool reconverge vers environ 0,1205 — à une fraction de pour cent de partout ailleurs. Un trader qui aurait ouvert l'application au milieu de l'épisode et aurait simplement pris le prix du pool aurait surpayé pour vendre ; la correction des arbitragistes est ce qui protège le trader suivant de cette cotation périmée.",
    },
    {
      id: "c35-l4",
      title: "Qu'est-ce que le MEV (Maximal Extractable Value) et existe-t-il sur Stellar ?",
      paragraphs: [
        "Le MEV, ou Maximal Extractable Value (valeur extractible maximale), est le profit que celui qui contrôle l'ordonnancement des transactions dans un bloc peut extraire en insérant, réordonnant ou censurant des transactions. Sur de nombreuses blockchains, les producteurs de blocs (ou les chercheurs qui enchérissent auprès d'eux) peuvent voir une transaction en attente dans le mempool public et agir en conséquence : le front-running (se placer devant un achat connu pour profiter de son impact sur le prix), le back-running (se placer derrière pour capturer l'écart qui en résulte), ou l'attaque sandwich (acheter juste avant et vendre juste après le gros ordre d'une victime). Cette valeur est extraite aux dépens des utilisateurs ordinaires, qui obtiennent des exécutions pires que celles que le marché leur donnerait autrement.",
        "L'architecture de Stellar rend le MEV classique nettement plus difficile que sur une chaîne typique à leader unique en preuve de travail ou preuve d'enjeu. Le consensus est atteint via le Stellar Consensus Protocol (SCP), un accord byzantin fédéré dans lequel les nœuds s'accordent sur un ensemble de transactions au moyen d'ensembles de quorum qui se chevauchent, plutôt qu'un mineur unique choisissant unilatéralement l'ordre du bloc. Les registres se ferment vite (quelques secondes) et il n'y a pas de lucrative enchère sur le prix du gaz : les transactions portent des frais minuscules à peu près fixes, et lorsqu'un registre est en surcapacité, Stellar recourt à une tarification de pointe avec sélection aléatoire parmi les transactions à frais égaux, plutôt qu'à un ordonnancement strict où le plus offrant l'emporte. Il n'existe pas de mempool public durable qu'un chercheur pourrait exploiter comme celui d'Ethereum est exploité, ce qui supprime une grande partie de la surface de front-running.",
        "Le MEV est toutefois limité sur Stellar, non éliminé. Quiconque observe Horizon peut encore voir les transactions diffusées et faire la course pour soumettre un paiement par chemin concurrent dans le même registre ; le départage déterministe au sein d'un ensemble de transactions peut être étudié et manipulé à la marge ; et l'arrivée des contrats intelligents Soroban (avec des protocoles DeFi tels que Blend, Soroswap et DeFindex) réintroduit un état composable plus riche où l'ordonnancement peut compter davantage, si bien que la surface extractible croît à mesure que la DeFi on-chain se développe. Le résumé honnête est que le modèle de frais de Stellar et son ordonnancement fondé sur le SCP et guidé par les quorums émoussent les schémas de MEV les plus prédateurs observés ailleurs, mais tout registre public à liquidité partagée laisse une certaine valeur d'ordonnancement sur la table.",
      ],
      example:
        "Sur une chaîne pilotée par un mempool, un chercheur qui voit votre gros achat de XLM en attente peut le prendre en sandwich : acheter juste avant vous pour pousser le prix à la hausse, laisser votre ordre s'exécuter au taux gonflé, puis vendre juste après — vous obtenez une moins bonne exécution et il empoche la différence. Sur Stellar, ce même chercheur n'a pas de mempool public persistant où tirer sa cible, les registres se ferment en quelques secondes, et les transactions à frais égaux sont sélectionnées sans pure enchère au plus offrant, si bien que ce sandwich net est bien plus difficile à réussir — mais un bot rapide qui fait la course avec un paiement par chemin concurrent pour entrer dans la toute prochaine fermeture de registre reste une forme d'extraction réelle, quoique plus étroite.",
    },
    {
      id: "c35-l5",
      title: "Comment l'arbitrage influence-t-il les prix que vous voyez dans cette application ?",
      paragraphs: [
        "Chaque prix que cette application vous affiche est en aval de l'arbitrage. Lorsque l'onglet Trading manuel cote un taux VOUS VENDEZ / VOUS ACHETEZ, ou que la page de détail d'un token trace des chandeliers avec des onglets heure, jour, semaine et année, ces chiffres proviennent de carnets d'ordres du SDEX et de pools AMM en direct que les arbitragistes surveillent en permanence. Parce qu'ils maintiennent étroitement alignés le prix du pool, le prix du carnet d'ordres et les prix des bourses extérieures, le taux contre lequel vous tradez est de fait un taux de marché plutôt qu'un taux périmé ou manipulé. Vous bénéficiez de leur travail sans jamais le voir se produire.",
        "Cela signifie aussi que l'application vous propose rarement un prix suspicieusement bon, et c'est une qualité, pas une déception. Si le SDEX ou un pool AMM affichait brièvement le XLM bien en dessous de sa valeur partout ailleurs, les arbitragistes auraient déjà exploité cet écart — généralement en un registre ou deux — avant que votre ordre ne puisse l'atteindre. Concrètement, cela vous indique que lorsque vous posez un ordre limite ou une tolérance de slippage modifiable sur un ordre au marché, vous devez vous référer au prix efficient en vigueur, car chercher à obtenir une exécution nettement meilleure que le marché aligné revient à essayer de devancer les mêmes bots qui ont effacé l'écart. Lorsque l'analyste IA propose un trade assorti d'un score de confiance, ses exécutions attendues supposent cette même tarification concurrentielle, resserrée par l'arbitrage.",
        "Il y a un revers de la médaille qu'il vaut la peine d'intérioriser. L'arbitrage resserre les spreads et aligne les lieux, mais il n'élimine pas les coûts intégrés à un trade : les frais de 0,30 % du pool AMM, le spread du carnet d'ordres sur les paires minces, les frais de réseau et votre propre tolérance de slippage s'appliquent tous encore, et sur les tokens à faible liquidité, le prix aligné peut tout de même être très éloigné de l'endroit où vous pourriez réellement sortir à grande échelle. Efficient ne veut pas dire gratuit ni infiniment profond. Lire le prix de l'application comme un instantané équitable, entretenu par l'arbitrage — tout en respectant les frais, la profondeur et le slippage — est le modèle mental réaliste. Rien de tout cela n'est un conseil en investissement ; c'est une description du comportement de la tuyauterie derrière vos cotations.",
      ],
      example:
        "Vous ouvrez la page de détail d'un token pour une paire liquide et voyez le XLM à 0,1207 USDC à la fois sur le graphique et sur le formulaire VOUS VENDEZ. Cette concordance n'est pas de la chance : des bots d'arbitrage ont déjà réconcilié le pool AMM, le carnet du SDEX et les lieux extérieurs à une fraction de pour cent près, si bien que l'application ne peut vous montrer que le taux de marché réel. Si vous posez ensuite un ordre de vente limite à 0,1240 en espérant battre le marché, il se peut qu'il ne se remplisse tout simplement jamais — vous demanderiez à vendre au-dessus du prix que les arbitragistes ont arrimé comme juste, et la même concurrence qui a resserré le spread est ce qui empêche cette exécution optimiste de se produire.",
    },
  ],
  quiz: [
    {
      id: "c35-q1",
      prompt: "Qu'est-ce qui définit le plus précisément un trade d'arbitrage ?",
      options: [
        {
          text: "Acheter un actif dont vous vous attendez à ce qu'il prenne de la valeur au cours des semaines à venir.",
          explanation:
            "C'est de la spéculation directionnelle, pas de l'arbitrage. L'arbitrage ne dépend pas d'un mouvement de prix futur ; il capture un écart qui existe entre des lieux à l'instant présent pour le même actif.",
        },
        {
          text: "Détenir un actif longtemps pour gagner des récompenses de réseau.",
          explanation:
            "Cela décrit un revenu de type rendement ou staking, pas de l'arbitrage. L'arbitrage consiste à exploiter un décalage de prix momentané d'un lieu à l'autre, et non à détenir pour des récompenses.",
        },
        {
          text: "Acheter le même actif là où il est bon marché et le vendre là où il est cher pratiquement au même moment, en capturant l'écart de prix.",
          explanation:
            "Correct. L'arbitrage récolte une différence de prix pour l'actif identique d'un lieu à l'autre, avec des jambes quasi simultanées, si bien que le profit est neutre sur le plan directionnel plutôt qu'un pari sur la direction du marché.",
        },
        {
          text: "Acheter délibérément au sommet d'une flambée de prix parce que la dynamique est forte.",
          explanation:
            "C'est de la poursuite de dynamique, qui porte un risque directionnel complet. L'arbitrage est l'inverse : il recherche un écart à risque minimisé entre deux prix pour la même chose, et non une entrée directionnelle.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q2",
      prompt: "Pourquoi un paiement par chemin de Stellar qui commence et se termine dans le même actif est-il un outil si naturel pour l'arbitrage ?",
      options: [
        {
          text: "Parce qu'il vous permet de convertir un actif sans jamais payer le moindre frais de réseau.",
          explanation:
            "Incorrect. Un paiement par chemin paie tout de même les frais de réseau de base minuscules (~0,00001 XLM). Sa valeur pour l'arbitrage est la conversion atomique à sauts multiples, pas l'évitement des frais.",
        },
        {
          text: "Parce qu'il saute à travers plusieurs carnets d'ordres et pools en une seule opération atomique, de sorte que si la boucle n'est pas rentable, elle s'annule et vous ne perdez que les frais dérisoires.",
          explanation:
            "Correct. La boucle du tout ou rien, assortie d'un minimum reçu strict, signifie que l'écart de prix ne peut pas s'échapper entre deux jambes — l'atomicité supprime le risque de jambe qui gangrène l'arbitrage manuel.",
        },
        {
          text: "Parce qu'il garantit que le prix bougera en votre faveur après l'envoi.",
          explanation:
            "Incorrect. Rien ne garantit un mouvement favorable. Tout l'intérêt est précisément qu'un paiement par chemin dans le même actif n'en a pas besoin — soit il remplit atomiquement la boucle rentable pré-calculée, soit il s'annule.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c35-q3",
      prompt: "Quelle affirmation résume le mieux ce que les arbitragistes apportent au marché dans son ensemble ?",
      options: [
        {
          text: "Ils alignent le prix d'un même actif à travers le SDEX, les pools AMM et les bourses extérieures, resserrant les spreads et ajoutant de la liquidité effective — poussant vers l'efficience des marchés.",
          explanation:
            "Correct. Acheter les lieux bon marché et vendre les lieux chers tire les prix vers l'alignement, resserre les spreads bid-ask et permet aux gros ordres de moins faire bouger le prix, ce qui décrit exactement l'efficience des marchés.",
        },
        {
          text: "Ils élargissent les spreads et écartent les prix des lieux les uns des autres, rendant le marché moins prévisible.",
          explanation:
            "C'est l'inverse de la réalité. L'arbitrage resserre les spreads et rapproche les prix ; c'est la force corrective contre la divergence, pas sa cause.",
        },
        {
          text: "Ils n'existent que pour manipuler les prix et nuisent toujours aux traders ordinaires.",
          explanation:
            "Incorrect. Les arbitragistes agissent pour leur propre profit, mais l'effet secondaire est des lieux plus cohérents et équitablement valorisés ; ils protègent les traders ordinaires des cotations périmées et décalées du marché plutôt que de leur nuire.",
        },
        {
          text: "Ils suppriment tous les coûts de trading, de sorte que les traders ordinaires ne paient rien pour trader.",
          explanation:
            "Incorrect. L'arbitrage resserre les spreads mais ne supprime jamais les frais de 0,30 % du pool AMM, le spread du carnet d'ordres sur les paires minces, les frais de réseau ni votre propre slippage ; efficient n'est pas synonyme de gratuit.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c35-q4",
      prompt: "Comment la conception de Stellar influence-t-elle le MEV (Maximal Extractable Value) par rapport à une chaîne typique pilotée par un mempool ?",
      options: [
        {
          text: "Stellar élimine complètement le MEV, si bien qu'aucune extraction fondée sur l'ordonnancement n'est possible.",
          explanation:
            "Exagéré. Stellar émousse les pires schémas, mais des observateurs peuvent encore faire la course avec des paiements par chemin concurrents dans le même registre, et la DeFi Soroban fait croître la surface extractible — le MEV est limité, pas éliminé.",
        },
        {
          text: "Stellar a plus de MEV que d'autres chaînes parce qu'il fait tourner une enchère de mempool public permanente comme Ethereum.",
          explanation:
            "Incorrect. Stellar ne fait pas tourner une enchère de mempool sur le prix du gaz à la manière d'Ethereum ; l'absence de mempool public durable est précisément la raison pour laquelle le front-running classique y est plus difficile.",
        },
        {
          text: "Stellar rend le MEV classique plus difficile — ordonnancement fondé sur les quorums du SCP, registres rapides, absence de mempool public durable et sélection aléatoire à frais égaux au lieu d'une pure enchère sur le gaz — mais ne l'élimine pas entièrement.",
          explanation:
            "Correct. L'accord byzantin fédéré du Stellar Consensus Protocol, les frais à peu près fixes avec sélection aléatoire à tarification de pointe, et l'absence d'un mempool exploitable émoussent le front-running et le sandwiching, tout en laissant toujours une certaine valeur d'ordonnancement sur un registre public.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q5",
      prompt: "Vous posez un ordre de vente limite pour du XLM bien au-dessus du prix que l'application affiche actuellement sur une paire liquide. Étant donné la façon dont l'arbitrage façonne les prix, à quoi devez-vous vous attendre ?",
      options: [
        {
          text: "Il se remplira presque certainement instantanément, car l'arbitrage garantit que les prix montent pour atteindre tout ordre limite.",
          explanation:
            "Incorrect. L'arbitrage aligne les prix sur la juste valeur ; il ne les pousse pas à la hausse pour satisfaire votre ordre optimiste. Une vente très au-dessus du marché aligné reste simplement non remplie.",
        },
        {
          text: "Il se peut qu'il ne se remplisse jamais, car les arbitragistes ont déjà arrimé le prix près de la juste valeur à travers les lieux, de sorte que demander à vendre bien au-dessus revient à essayer de devancer les mêmes bots qui ont refermé l'écart.",
          explanation:
            "Correct. Sur une paire liquide, le SDEX, les pools et les bourses extérieures sont étroitement alignés par l'arbitrage, si bien qu'une exécution nettement au-dessus de ce prix efficient est exactement ce que le marché concurrentiel empêche.",
        },
        {
          text: "L'application ajustera secrètement le prix de marché à la hausse pour que votre ordre se remplisse à votre objectif.",
          explanation:
            "Incorrect. L'application affiche des prix du SDEX et des AMM en direct, entretenus par l'arbitrage externe ; elle ne déplace pas et ne peut pas déplacer le marché pour satisfaire un ordre limite individuel.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
