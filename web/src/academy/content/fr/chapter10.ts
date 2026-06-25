import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "Trading par IA",
  description: "Comment l'analyste genere des propositions, les donnees qui les sous-tendent, et comment les lire, les accepter, les refuser et les combiner avec des trades manuels.",
  lessons: [
    {
      id: "c10-l1",
      title: "Comment l'IA genere-t-elle ses propositions de trade ?",
      paragraphs: [
        "Le bot appelle un modele d'IA appele l'analyste. Vous choisissez un fournisseur dans un menu deroulant, comme Anthropic Claude, OpenAI ou DeepSeek, et seuls les fournisseurs pour lesquels une cle est configuree sont selectionnables. L'analyste ne tourne pas en continu. Il s'execute quand vous appuyez sur Scanner la chaine, quand vous lancez l'analyse d'une seule paire, ou sur le minuteur de scan automatique si vous en avez active un.",
        "A chaque execution, l'analyste recoit un instantane du marche et de votre compte, et il renvoie zero proposition ou plus. Chaque proposition est un objet structure, pas du texte libre, pour que l'app puisse agir dessus. Elle porte un sens d'achat ou de vente, les actifs de base et de cotation, un montant, un prix limite, un slippage maximal, une raison ecrite, et une confiance basse, moyenne ou haute. Elle peut aussi ajouter un prix cible, un prix d'invalidation et une indication d'horizon de detention.",
        "Un delai de recharge empeche l'analyste de reproposer trop vite la meme paire dans le meme sens, pour que vous ne soyez pas inonde de la meme idee. Si l'analyste ne voit rien qui merite d'agir, il renvoie simplement aucune proposition pour cette paire.",
      ],
      example: "Vous appuyez sur Scanner la chaine. L'analyste examine XLM/USDC et renvoie une proposition : sens achat, montant 40 XLM, prix limite 0.1180 USDC, slippage maximal 0.5 pour cent, confiance moyenne, raison l'ask s'est eclairci et les trois derniers creux ont ete rachetes en quelques minutes.",
    },
    {
      id: "c10-l2",
      title: "Quelles donnees l'IA utilise-t-elle pour decider ?",
      paragraphs: [
        "L'analyste ne connait que ce que l'app lui transmet. Il voit le carnet d'ordres en direct, c'est-a-dire le meilleur bid et le meilleur ask plus la profondeur visible, ainsi que le volume sur 24h et les recentes bougies OHLC de la paire. Cela lui indique ou se situe le prix, a quel point le spread est serre, et quelle taille le carnet peut absorber.",
        "Il voit aussi votre situation : vos avoirs actuels, vos offres ouvertes, votre profit et perte realises du jour, et le profit et perte latents sur toute position ouverte. Une proposition est donc faconnee par ce que vous possedez deja, pas seulement par le graphique.",
        "Enfin, il voit les trades recents et, surtout, comment le prix a evolue apres chacun d'eux, plus le plafond de taille effectif par trade. Les resultats post-trade lui permettent de juger si les entrees recentes ont vraiment fonctionne, et le plafond de taille maintient le montant qu'il propose dans ce que la politique autorise.",
      ],
      example: "Donnees d'entree pour une execution sur XLM/USDC : meilleur bid 0.1176, meilleur ask 0.1182, volume 24h 92 000 XLM, avoirs 600 XLM et 0 USDC, aucune offre ouverte, PnL realise du jour plus 1.20 USDC, les deux derniers achats ont gagne environ 0.3 pour cent chacun ensuite, plafond par trade 50 XLM. L'analyste propose un montant de 40 XLM, confortablement sous le plafond.",
    },
    {
      id: "c10-l3",
      title: "Comment interpreter une proposition de l'IA",
      paragraphs: [
        "Lisez d'abord le sens. Achat signifie que l'analyste veut acquerir l'actif de base en depensant l'actif de cotation ; vente signifie l'inverse. Le prix limite est le pire prix qu'il acceptera, et le slippage maximal borne jusqu'ou le fill peut deriver, donc ensemble ils plafonnent a quel point l'execution peut mal tourner.",
        "Lisez ensuite la raison. Une bonne raison se rattache aux donnees vues dans la lecon precedente, par exemple un ask qui s'eclaircit, un creux rachete, ou un volume en hausse. Une raison vague est en soi un signal d'alerte. Les prix cible et d'invalidation optionnels vous indiquent ou l'analyste compte prendre son profit et a partir d'ou l'idee devient fausse, ce qui est votre carte de sortie.",
        "La confiance est la conviction propre de l'analyste, pas une probabilite. Traitez une confiance basse comme une idee provisoire, moyenne comme un signal normal, et haute comme un signal fort. La confiance ne prime jamais sur la politique : le backend applique toujours les limites, le slippage et le solde avant qu'une chose soit soumise.",
      ],
      example: "Une proposition de vente affiche : vendre 30 XLM, limite 0.1205 USDC, slippage maximal 0.4 pour cent, cible 0.1205, invalidation 0.1240, confiance haute, raison la resistance a tenu deux fois a 0.1208 sur volume en baisse. Vous voyez le plan : prendre le profit pres de 0.1205, abandonner l'idee si le prix repasse au-dessus de 0.1240.",
    },
    {
      id: "c10-l4",
      title: "Quand accepter et quand refuser une proposition",
      paragraphs: [
        "Vos deux modes d'approbation des trades se comportent differemment. En mode approuver-chaque-trade, chaque proposition attend que vous appuyiez sur Approuver ou Refuser, quelle que soit la confiance. En mode trade-automatique, seules les propositions de confiance moyenne et haute s'executent automatiquement ; une confiance basse ou absente attend toujours votre approbation manuelle.",
        "Il y a une exception constante dans les deux modes. Les sorties qui reduisent le risque, comme une cloture par stop qui reduit une position ouverte, s'executent immediatement. L'app ne vous fera pas attendre pour approuver la sortie d'un trade perdant.",
        "Quand c'est a vous de decider, jugez la raison face aux donnees, verifiez que le prix limite et le slippage sont sains, et confirmez que vous detenez bien le solde dont le trade a besoin. Refusez quand la raison est maigre, quand le prix limite s'est deja envole, ou quand la proposition vous surconcentrerait sur un seul actif. Le backend bloquera de toute facon un trade impossible, mais refuser tot garde votre historique propre.",
      ],
      example: "En mode trade-automatique, l'analyste propose achat 40 XLM a 0.1180, confiance haute. Comme la confiance est haute, ca s'execute automatiquement a travers les garde-fous de securite. Quelques instants plus tard, il propose vente 20 XLM a 0.1240, confiance basse ; celle-la se met en pause et attend dans la file que vous fassiez Approuver ou Refuser.",
    },
    {
      id: "c10-l5",
      title: "Comment l'IA et le trading manuel fonctionnent ensemble",
      paragraphs: [
        "L'analyste ne fait jamais que proposer. C'est le backend qui applique la politique et agit : il verifie la limite par trade, le slippage maximal, votre solde et le coupe-circuit, puis signe et soumet l'ordre. Tout trade manuel que vous passez a la main traverse exactement les memes garde-fous de securite, donc un ordre manuel ne peut jamais contourner une verification qu'un ordre IA respecte.",
        "Le mode de trading s'applique identiquement aux deux sources. En Lecture seule, l'app observe et propose mais ne trade jamais ; en Papier, elle simule les fills ; et en Reel, elle soumet de vrais ordres on-chain. Le coupe-circuit est au-dessus de tout et bloque tout le trading, IA comme manuel.",
        "Parce que les deux flux passent par un seul moteur, le tableau d'historique etiquette chaque fill comme Manuel ou Bot pour que vous puissiez les distinguer apres coup. Vous pouvez passer un trade manuel pendant que l'analyste est actif ; ils partagent vos soldes et vos limites, donc un achat manuel reduit la marge restante sous votre plafond de taille pour la prochaine idee de l'analyste.",
      ],
      example: "Le mode est Reel, l'approbation est trade-automatique. Vous vendez manuellement 100 XLM contre des USDC. L'analyste propose ensuite un achat de confiance moyenne ; il s'execute automatiquement mais seulement apres que la verification prealable de solde a confirme que les USDC que vous venez de recevoir le couvrent. Le tableau d'historique montre votre vente etiquetee Manuel et l'achat etiquete Bot.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Quand l'analyste s'execute-t-il reellement et produit-il des propositions ?",
      options: [
        { text: "En continu en arriere-plan a chaque tick de prix.", explanation: "Incorrect. L'analyste n'est pas un processus en flux continu ; il s'execute uniquement sur des declencheurs precis, pas a chaque tick." },
        { text: "Quand vous Scannez la chaine, analysez une paire, ou sur le minuteur de scan automatique.", explanation: "Correct. Ce sont les trois declencheurs qui invoquent l'analyste." },
        { text: "Une seule fois au demarrage, puis il met en cache un plan fixe pour la journee.", explanation: "Incorrect. Il n'y a pas de plan quotidien unique ; chaque execution produit de nouvelles propositions a partir d'un instantane actuel." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "Lequel de ces elements l'analyste NE recoit-il PAS en entree ?",
      options: [
        { text: "Le carnet d'ordres en direct, le volume 24h et les bougies OHLC.", explanation: "Incorrect. Ces donnees de marche font partie de l'instantane qu'il voit." },
        { text: "Vos avoirs, vos offres ouvertes, et votre PnL realise et latent du jour.", explanation: "Incorrect. L'etat de votre compte est transmis pour que les propositions collent a ce que vous detenez." },
        { text: "La valeur de la cle API de votre fournisseur pour qu'il puisse se refacturer.", explanation: "Correct. La cle brute ne fait jamais partie des entrees de decision de l'analyste ; elle sert uniquement a authentifier l'appel au fournisseur." },
        { text: "Les trades recents, l'evolution du prix apres eux, et le plafond de taille par trade.", explanation: "Incorrect. Ce sont des entrees ; les resultats post-trade et le plafond faconnent son jugement et son dimensionnement." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q3",
      prompt: "Sur une proposition, que represente le champ confiance basse, moyenne ou haute ?",
      options: [
        { text: "Une probabilite de gain garantie que le backend utilise pour dimensionner l'ordre.", explanation: "Incorrect. Ce n'est pas une probabilite et elle ne fixe pas la taille ; c'est le plafond par trade qui le fait." },
        { text: "La conviction propre de l'analyste dans l'idee, qui ne prime jamais sur les garde-fous de la politique.", explanation: "Correct. Elle signale a quel point l'analyste croit a l'idee, mais les limites, le slippage et le solde restent appliques." },
        { text: "A quelle vitesse l'ordre sera execute on-chain.", explanation: "Incorrect. La vitesse d'execution depend de la liquidite et du prix, pas de l'etiquette de confiance." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q4",
      prompt: "En mode trade-automatique, quelles propositions s'executent d'elles-memes ?",
      options: [
        { text: "Chaque proposition, quelle que soit la confiance.", explanation: "Incorrect. Cela decrit le mode approuver-chaque-trade, pas le trade-automatique." },
        { text: "Seulement les propositions de confiance basse, car elles sont les moins risquees.", explanation: "Incorrect. C'est l'inverse ; une confiance basse ou absente attend votre approbation." },
        { text: "Les propositions de confiance moyenne et haute, tandis qu'une confiance basse ou absente attend l'approbation.", explanation: "Correct. Le trade-automatique execute moyenne et haute automatiquement ; basse ou absente se met en pause pour vous. Les sorties qui reduisent le risque s'executent toujours immediatement." },
        { text: "Aucune ; le trade-automatique ne fait qu'esquisser les ordres et ne les soumet jamais.", explanation: "Incorrect. Le trade-automatique soumet bien les propositions qualifiees ; c'est sa raison d'etre." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "Comment les propositions de l'IA et les trades manuels coexistent-ils dans l'app ?",
      options: [
        { text: "Les deux passent par les memes garde-fous de securite du backend et sont etiquetes Manuel ou Bot dans l'historique.", explanation: "Correct. Un seul moteur applique les limites, le slippage, le solde et le coupe-circuit pour les deux, et l'historique etiquette chaque fill par source." },
        { text: "Les trades manuels sautent les garde-fous de securite pour que vous puissiez agir plus vite.", explanation: "Incorrect. Les ordres manuels passent par exactement les memes verifications que les ordres IA ; rien ne les contourne." },
        { text: "Le coupe-circuit bloque les trades IA mais laisse passer les trades manuels.", explanation: "Incorrect. Le coupe-circuit bloque tout le trading, IA comme manuel." },
        { text: "Les trades IA et manuels utilisent des soldes separes qui ne s'affectent jamais entre eux.", explanation: "Incorrect. Ils partagent vos soldes et vos limites, donc un trade manuel reduit la marge restante pour le prochain ordre de l'analyste." },
      ],
      correctIndex: 0,
    },
  ],
};
