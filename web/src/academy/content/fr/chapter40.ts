// Chapitre 40 : éducation générale sur la structure de marché. Un chapitre
// ADVANCED qui enseigne des concepts valables pour les marchés crypto en
// général (indépendants de toute plateforme ou produit spécifique) : carnets
// d'ordres vs AMM, makers vs takers, spread et slippage, futures perpétuels et
// funding rates, et pourquoi le coût d'exécution décide si un edge statistique
// fin survit réellement au trading. Contenu strictement à portée publique —
// aucune mention d'un mode de fonctionnement, d'un fournisseur ou d'une
// fonctionnalité interne spécifique ; il enseigne les concepts dont un trader
// a besoin pour raisonner sur n'importe quelle plateforme d'échange.
import type { Chapter } from "../../types";

export const chapter40: Chapter & { whoFor: string } = {
  id: "c40",
  number: 40,
  level: "ADVANCED",
  whoFor: "Pour quiconque veut comprendre comment les exchanges crypto fonctionnent réellement en coulisses",
  title: "Structure de marché : carnets d'ordres, AMM et coût d'exécution",
  description:
    "Carnets d'ordres contre AMM, makers contre takers, spread et slippage, futures perpétuels et funding rates, et pourquoi le coût d'exécution décide si un edge survit.",
  lessons: [
    {
      id: "c40-l1",
      title: "Deux façons pour un marché d'organiser les échanges : le carnet d'ordres et l'AMM",
      paragraphs: [
        "Toute plateforme d'échange doit résoudre le même problème : faire correspondre quelqu'un qui veut acheter avec quelqu'un qui veut vendre, à un prix accepté par les deux parties. Il existe deux modèles dominants pour y parvenir, et presque tous les exchanges que vous utiliserez un jour, sur n'importe quelle blockchain, reposent sur l'un des deux.",
        "Le premier est le carnet d'ordres, parfois appelé central limit order book ou CLOB. C'est une liste vivante et classée d'offres en attente : tous ceux qui veulent acheter indiquent un prix et une quantité, tous ceux qui veulent vendre font de même, et la plateforme les fait correspondre dès qu'un prix d'achat et un prix de vente se croisent. Vous en avez presque certainement déjà vu un — c'est cette classique pile de prix d'achat verts et de prix de vente rouges que l'on voit sur l'écran de trading de n'importe quel exchange. Un carnet d'ordres ne fonctionne que s'il y a quelqu'un en face prêt à échanger à (ou près de) votre prix ; si personne n'offre près de l'endroit où vous voulez échanger, votre ordre reste simplement non exécuté.",
        "Le second est l'automated market maker, ou AMM. Au lieu de mettre en correspondance des individus, un AMM détient une réserve commune de deux actifs et fixe le prix de chaque échange via une formule basée sur la quantité de chaque actif actuellement dans la réserve. Il n'y a pas de contrepartie à trouver — vous échangez toujours contre la réserve elle-même, et la réserve affiche toujours un prix, même pour une paire que personne n'a échangée depuis des heures. La contrepartie est qu'un ordre important déplace sensiblement le prix propre de la réserve (on parle d'impact sur le prix), car vous modifiez le ratio d'actifs sur lequel la formule se base pour fixer le prix.",
        "Aucun des deux modèles n'est simplement meilleur que l'autre — ils conviennent à des situations différentes. Un carnet d'ordres offre un contrôle précis (vous pouvez fixer un prix exact et attendre) et tend à offrir des prix plus serrés sur les paires activement échangées où beaucoup de gens cotent. Un AMM garantit que vous pouvez toujours échanger quelque chose, instantanément, même sur une paire obscure, au prix d'un déplacement plus marqué du prix à mesure que l'ordre grossit. Comprendre contre lequel des deux vous échangez change la façon dont vous devez interpréter le prix qui vous est proposé.",
      ],
      example:
        "Supposons que vous vouliez échanger une paire bien connue comme ETH/USDC. Sur un exchange à carnet d'ordres, vous verriez une échelle d'ordres d'achat et de vente en attente, et votre ordre s'exécuterait contre le meilleur d'entre eux. Sur un exchange basé sur un AMM, il n'y a aucune échelle à consulter — vous voyez simplement un prix coté calculé à partir des réserves actuelles de la réserve, et un petit ordre le déplace à peine tandis qu'un très gros ordre le déplace visiblement, car l'ordre lui-même modifie le ratio sur lequel la formule se base pour fixer le prix.",
    },
    {
      id: "c40-l2",
      title: "Makers et takers : qui fournit la liquidité, et qui la paie",
      paragraphs: [
        "Sur un exchange à carnet d'ordres, chaque trader se retrouve dans l'un des deux rôles pour un échange donné, et cette distinction compte car elle détermine généralement ce que vous payez en frais. Un maker place un ordre qui ne s'exécute pas immédiatement — il reste en attente dans le carnet, ajoutant un prix visible contre lequel quelqu'un d'autre peut échanger, et fournit ainsi effectivement de la liquidité aux autres. Un taker place un ordre qui s'exécute immédiatement contre un ordre déjà en attente dans le carnet — il consomme la liquidité fournie par le maker, en prenant le prix proposé plutôt que d'attendre le sien.",
        "Parce que les makers sont ceux qui fournissent des prix au carnet contre lesquels échanger, la plupart des exchanges récompensent ce comportement : les frais makers sont généralement plus bas que les frais takers, et sur certaines plateformes, les makers reçoivent même un petit rebate pour placer des ordres en attente, financé par les frais plus élevés prélevés sur les takers. La logique est simple — une plateforme avec un carnet d'ordres mince et vide est peu attrayante pour échanger, donc les exchanges ont un intérêt direct à payer les gens pour le garder alimenté en cotations en attente.",
        "La même répartition maker/taker apparaît aussi dans un contexte AMM, simplement sous d'autres noms : un liquidity provider dépose des actifs dans la réserve (la version AMM d'un maker, fournissant les réserves contre lesquelles tout le monde échange) et gagne une part de chaque frais d'échange que la réserve perçoit, tandis que quiconque échange contre la réserve (le taker) paie ce frais comme prix d'une exécution instantanée.",
        "Cette distinction vaut la peine d'être intégrée à chaque fois que vous placez un ordre, sur n'importe quelle plateforme : un ordre limite qui reste en attente se comporte comme un ordre maker, généralement moins cher, mais sans garantie d'être un jour exécuté ; un ordre au marché qui prend ce qui est actuellement proposé se comporte comme un ordre taker, généralement un peu plus cher, mais il s'exécute immédiatement.",
      ],
      example:
        "Deux traders veulent tous deux acheter le même actif au même moment. Le premier place un ordre limite légèrement en dessous du prix de marché actuel et attend — il reste en attente dans le carnet comme ordre maker, payant les frais maker plus bas, mais ne s'exécute que si le prix descend réellement à sa rencontre. Le second place un ordre au marché immédiatement, prenant les ordres de vente actuellement en attente dans le carnet — il s'exécute instantanément, paie les frais taker plus élevés, et obtient le prix que ces ordres en attente proposaient, qui peut être un peu moins bon que le prix limite patient du premier trader.",
    },
    {
      id: "c40-l3",
      title: "Spread et slippage : les deux coûts cachés dans chaque échange",
      paragraphs: [
        "Le spread est l'écart entre le meilleur prix auquel quelqu'un est prêt à acheter et le meilleur prix auquel quelqu'un est prêt à vendre, à l'instant, sur un carnet d'ordres. Un spread serré (prix d'achat et de vente proches l'un de l'autre) signifie que le marché est liquide et fortement échangé ; un spread large signifie que moins de gens cotent activement, donc il y a un coût intégré plus important simplement pour passer d'un côté à l'autre. Même un échange qui s'exécute instantanément, au meilleur prix disponible, paie encore ce coût — c'est la différence entre où vous pourriez vendre et où vous pourriez acheter à ce même instant.",
        "Le slippage est différent : c'est l'écart entre le prix que vous attendiez au moment de passer un ordre et le prix que vous avez réellement obtenu une fois l'ordre exécuté. Cela arrive dès que votre ordre est assez important, ou que le marché bouge assez vite, pour que l'exécution consomme plus que le tout meilleur prix proposé — un gros ordre au marché peut exécuter une partie de lui-même au meilleur prix, puis le reste à un prix légèrement moins bon, et ainsi de suite, jusqu'à ce que toute la quantité soit exécutée. Sur un AMM, le slippage est en réalité la même idée exprimée à travers la formule de tarification : plus votre ordre est important par rapport à la réserve, plus le prix de la réserve se déplace contre vous d'ici la fin de votre échange.",
        "Ces deux coûts augmentent avec deux facteurs : la taille de votre ordre par rapport à la liquidité disponible, et le degré de faible activité de l'actif en général. Un petit ordre sur une paire fortement échangée touche à peine l'un ou l'autre coût ; le même ordre sur une paire illiquide et rarement échangée peut coûter nettement plus, uniquement à cause du spread et du slippage, avant même qu'un quelconque frais d'exchange ne soit appliqué.",
        "La plupart des exchanges vous permettent de fixer une tolérance maximale au slippage sur un échange — l'écart maximal entre le prix attendu et le prix réel que vous êtes prêt à accepter avant que l'ordre soit rejeté plutôt qu'exécuté. Cela existe pour vous protéger : sans cela, un accès soudain de volatilité entre le placement d'un ordre et son exécution pourrait vous faire exécuter à un prix bien plus défavorable que prévu.",
      ],
      example:
        "Imaginez un token peu échangé où la meilleure offre d'achat est à 0,098 et la meilleure offre de vente à 0,102 — un large spread de 4 % rien que pour traverser le carnet. Vous passez un ordre au marché pour acheter une grande quantité : il exécute une partie de la quantité à 0,102, mais il n'y en a pas assez à ce niveau, donc le reste s'exécute à 0,104, puis à 0,107, pour un prix d'exécution moyen bien au-dessus des 0,102 initialement cotés. Cet écart entre les 0,102 attendus et la moyenne d'environ 0,105 réellement payée, c'est le slippage, qui s'ajoute au spread déjà payé simplement en étant taker.",
    },
    {
      id: "c40-l4",
      title: "Futures perpétuels et funding rates",
      paragraphs: [
        "Un future perpétuel (souvent abrégé en « perp ») est un contrat dérivé qui permet de prendre un pari directionnel à effet de levier sur le prix d'un actif sans jamais posséder l'actif sous-jacent lui-même. Contrairement à un contrat futures traditionnel, un perp n'a pas de date d'expiration — il peut, en principe, être détenu indéfiniment — ce qui est précisément ce qui le rend « perpétuel » et pourquoi il est devenu l'un des types d'instruments les plus échangés en crypto.",
        "Comme un perp n'expire et ne se règle jamais, les exchanges ont besoin d'un mécanisme pour maintenir son prix étroitement aligné sur le prix spot réel de l'actif sous-jacent — sinon les deux pourraient dériver indéfiniment sans rien pour les rapprocher à nouveau. Ce mécanisme, c'est le funding rate : un paiement périodique échangé directement entre les traders détenant des positions longues (qui parient sur une hausse du prix) et ceux détenant des positions courtes (qui parient sur une baisse), calculé selon l'écart entre le prix du perp et le prix spot.",
        "La direction du paiement de funding indique de quel côté penche la foule. Quand le perp s'échange au-dessus du spot (plus de demande pour aller long que short), les longs paient les shorts — un coût pour rester long qui pousse certains longs à clôturer et certains shorts à ouvrir, ramenant le prix du perp vers le spot. Quand le perp s'échange en dessous du spot, le paiement s'inverse : les shorts paient les longs, poussant le prix vers le haut. Le funding n'est pas un frais versé à l'exchange ; c'est un transfert direct entre les deux côtés du marché, ce qui explique qu'il puisse occasionnellement constituer une véritable source de rendement (être du côté qui perçoit le funding) plutôt qu'un simple coût.",
        "Les funding rates sont généralement cotés par période (souvent toutes les une ou huit heures) et peuvent osciller d'un léger positif à un net négatif, selon à quel point le sentiment de marché est devenu unilatéral. Un funding rate persistant et important est lui-même une information : il signale qu'un côté de l'échange est devenu surchargé, et un positionnement surchargé précède souvent un mouvement brutal lorsque ces positions surextendues sont forcées de se clôturer.",
      ],
      example:
        "Imaginez qu'un future perpétuel sur un actif s'échange nettement au-dessus de son prix spot parce que beaucoup plus de traders veulent être longs que shorts. À chaque intervalle de funding, les longs paient collectivement un petit pourcentage de la valeur de leur position aux shorts. Si vous êtes long et que vous conservez la position à travers de nombreux intervalles de funding pendant que le marché reste ainsi déséquilibré, ce goutte-à-goutte régulier de paiements de funding peut discrètement éroder le rendement de votre position même si le prix lui-même reste stable — un coût qui n'a rien à voir avec le spread ou le slippage, et tout à voir avec le côté de l'échange surchargé où vous vous trouvez.",
    },
    {
      id: "c40-l5",
      title: "Pourquoi le coût d'exécution décide si un edge fin survit",
      paragraphs: [
        "Un « edge » de trading est une tendance statistique — un schéma qui, en moyenne, rend un côté d'un échange légèrement plus susceptible d'être rentable que l'autre. Presque tout edge qui vaut la peine d'être exploité est fin : quelques points de base (centièmes de pourcent) d'avantage attendu par échange, pas une distorsion de prix spectaculaire. Cette finesse est précisément la raison pour laquelle le coût d'exécution compte beaucoup plus qu'il n'y paraît au premier abord.",
        "Chaque échange que vous effectuez paie une combinaison de spread, de slippage et de frais d'exchange (maker ou taker), plus — sur un perp — une éventuelle érosion par le funding si vous conservez la position pendant des périodes défavorables. Aucun de ces coûts ne se soucie de savoir si votre edge sous-jacent est réel ; ils sont facturés à chaque échange, que vous gagniez ou perdiez. Si votre edge vaut en moyenne 10 points de base par échange, mais que spread plus slippage plus frais vous coûtent 8 points de base à chaque fois que vous agissez dessus, vous n'avez pas capté un edge de 10 points de base — vous en avez capté 2, et un seul échange malchanceux avec un slippage plus élevé que d'habitude peut effacer cela entièrement.",
        "C'est pourquoi le même edge statistique sous-jacent peut être réellement rentable sur une plateforme profonde, liquide et peu coûteuse, et véritablement perdant sur une plateforme mince, à spread large et coûteuse, alors même que le schéma dans les données de prix est identique aux deux endroits. L'edge n'existe pas dans le vide — il existe à l'intérieur d'une structure de coûts spécifique, et cette structure de coûts est déterminée par la liquidité du marché, la largeur du spread, le slippage causé par une taille d'ordre donnée, et le côté maker/taker sur lequel vous atterrissez.",
        "L'enseignement pratique est de toujours évaluer l'edge d'une stratégie net des coûts d'exécution réalistes, et non par rapport au prix médian net qu'un graphique vous montre. Un backtest qui ignore le spread, le slippage et les frais surestimera systématiquement à quel point une stratégie semble bonne, car il mesure un prix auquel personne n'aurait pu réellement échanger. La taille de l'edge réel, mesuré face aux coûts de trading réels sur la plateforme et la taille d'ordre que vous comptez utiliser, est ce qui décide en fin de compte si une idée vaut la peine d'être exploitée.",
      ],
      example:
        "Supposons qu'une recherche montre un schéma rentable en moyenne de 12 points de base par échange, mesuré au prix médian. Sur un marché profond et à spread serré où les coûts aller-retour tournent autour de 3 points de base, cet edge survit confortablement, laissant environ 9 points de base de profit réel attendu par échange. Exécutez exactement le même schéma sur un marché mince où le spread seul consomme 15 points de base aller-retour, et ce même edge statistique devient perdant avant même de compter le slippage — le schéma dans les données de prix n'a jamais changé, seul le coût pour agir dessus a changé.",
    },
  ],
  quiz: [
    {
      id: "c40-q1",
      prompt: "Quelle est la différence structurelle clé entre un exchange à carnet d'ordres (CLOB) et un AMM ?",
      options: [
        {
          text: "Un carnet d'ordres met en correspondance des ordres d'achat et de vente individuels à des prix fixés par les gens ; un AMM tarife chaque échange via une formule contre une réserve commune, sans contrepartie individuelle à faire correspondre.",
          explanation:
            "Correct. Un carnet d'ordres a besoin d'une contrepartie qui correspond à votre prix ; un AMM cote toujours un prix depuis sa réserve via une formule, au prix d'un déplacement plus important pour les gros ordres.",
        },
        {
          text: "Un carnet d'ordres n'existe que sur les exchanges centralisés, tandis que les AMM n'existent que sur les décentralisés.",
          explanation:
            "Faux. Carnets d'ordres et AMM existent sur des plateformes centralisées comme décentralisées — la distinction porte sur la façon dont les échanges sont mis en correspondance et tarifés, pas sur la garde des fonds ou le type de plateforme.",
        },
        {
          text: "Un AMM garantit toujours un meilleur prix qu'un carnet d'ordres.",
          explanation:
            "Faux. Aucun des deux modèles n'offre intrinsèquement un meilleur prix — un carnet d'ordres peut offrir des prix plus serrés sur des paires activement cotées, tandis qu'un AMM garantit que vous pouvez toujours échanger, au prix d'un impact sur le prix pour les gros ordres.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q2",
      prompt: "Pourquoi la plupart des exchanges à carnet d'ordres facturent-ils des frais plus bas aux makers (ou leur versent-ils même un rebate) comparé aux takers ?",
      options: [
        {
          text: "Les makers placent des ordres en attente qui fournissent au carnet de la liquidité pour que d'autres puissent échanger, et un carnet mince et vide est peu attrayant pour échanger — les exchanges ont donc intérêt à récompenser le comportement qui le maintient alimenté.",
          explanation:
            "Correct. Les makers ajoutent de la profondeur au carnet en attendant ; les takers consomment cette profondeur immédiatement. Récompenser les makers maintient le carnet liquide, au bénéfice de l'exchange et de chaque trader.",
        },
        {
          text: "Les makers sont de grands traders institutionnels et les takers sont toujours de petits traders particuliers.",
          explanation:
            "Faux. Maker et taker sont des rôles déterminés par le fait qu'un ordre reste en attente dans le carnet ou s'exécute immédiatement — n'importe qui, particulier ou institutionnel, peut être l'un ou l'autre selon le type d'ordre utilisé.",
        },
        {
          text: "Les frais taker sont en réalité toujours plus bas, car les takers aident à faire correspondre les ordres ouverts plus rapidement.",
          explanation:
            "Faux. C'est généralement l'inverse — les makers paient habituellement des frais plus bas (parfois même un rebate) car ce sont eux qui fournissent la liquidité, tandis que les takers paient plus pour la commodité d'une exécution immédiate.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q3",
      prompt: "Quelle est la différence entre le spread et le slippage ?",
      options: [
        {
          text: "Le spread est l'écart entre le meilleur prix d'achat et de vente actuel sur le carnet à l'instant présent ; le slippage est l'écart entre le prix attendu au moment de passer un ordre et le prix réellement obtenu une fois l'ordre exécuté.",
          explanation:
            "Correct. Le spread existe même pour un échange instantané et minuscule au meilleur prix. Le slippage apparaît quand votre ordre est assez important ou que le marché bouge assez vite pour que l'exécution consomme plus qu'un seul meilleur prix.",
        },
        {
          text: "Ce sont deux noms pour exactement le même coût, et les exchanges utilisent simplement celui qui convient à leur marketing.",
          explanation:
            "Faux. Ce sont des coûts distincts qui grèvent tous deux un échange — le spread est un écart intégré dans le carnet, le slippage est le coût supplémentaire d'une exécution qui traverse plusieurs niveaux de prix ou d'une formule d'AMM qui se déplace en cours d'échange.",
        },
        {
          text: "Le spread ne s'applique qu'aux AMM et le slippage qu'aux carnets d'ordres.",
          explanation:
            "Faux. Le spread est le plus visible sur les carnets d'ordres, mais les deux concepts s'appliquent aux deux modèles — la dégradation d'exécution d'un AMM due à l'impact sur le prix est fonctionnellement la même idée que le slippage sur un carnet d'ordres.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q4",
      prompt: "Qu'est-ce qui détermine réellement la direction du paiement de funding d'un future perpétuel ?",
      options: [
        {
          text: "L'écart entre le prix du perp et le prix spot sous-jacent — les longs paient les shorts quand le perp s'échange au-dessus du spot, et les shorts paient les longs quand il s'échange en dessous.",
          explanation:
            "Correct. Le funding est le mécanisme qui ramène le prix d'un perp sans expiration vers le spot, payé directement entre le côté surchargé et l'autre côté du marché.",
        },
        {
          text: "L'exchange décide de la direction du funding selon le montant de revenus de frais qu'il souhaite percevoir cette période.",
          explanation:
            "Faux. Le funding est un transfert entre traders, pas un frais perçu par l'exchange — sa direction est déterminée par la comparaison entre le prix du perp et le spot, pas par des objectifs de revenus de l'exchange.",
        },
        {
          text: "Le funding va toujours des shorts vers les longs, quel que soit le prix, en compensation du risque d'être short.",
          explanation:
            "Faux. La direction du funding n'est pas fixe — elle s'inverse selon que le perp s'échange au-dessus ou en dessous du prix spot sous-jacent à ce moment-là.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q5",
      prompt: "Un schéma dans les données de prix montre un edge moyen de 12 points de base par échange au prix médian. Pourquoi ce même schéma pourrait-il quand même faire perdre de l'argent en pratique ?",
      options: [
        {
          text: "Parce que le spread, le slippage et les frais sont facturés à chaque échange, que le schéma sous-jacent soit réel ou non, et si ces coûts dépassent l'edge, la stratégie est nette perdante même si le schéma au prix médian est authentique.",
          explanation:
            "Correct. Un edge statistique fin n'est un profit réel qu'une fois les coûts d'exécution réalistes soustraits — le même schéma peut être rentable sur une plateforme peu coûteuse et perdant sur une plateforme coûteuse.",
        },
        {
          text: "Parce qu'un edge authentique au prix médian est toujours entièrement réalisé indépendamment des coûts de trading — les coûts ne comptent que pour les edges qui n'ont jamais été réels au départ.",
          explanation:
            "Faux. Même un schéma authentique au prix médian peut être entièrement effacé par les coûts d'exécution ; la taille de l'edge réel, exploitable, est toujours l'edge au prix médian moins le spread, le slippage et les frais réalistes.",
        },
        {
          text: "Parce que les edges au prix médian sont un mythe et qu'aucun schéma mesuré ainsi n'est jamais exploitable.",
          explanation:
            "Faux. Les schémas au prix médian peuvent être authentiquement prédictifs — le point est que leur rentabilité réelle dépend entièrement des coûts d'exécution de la plateforme et de la taille d'ordre utilisées.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
