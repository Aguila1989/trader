import type { Chapter } from "../../types";

export const chapter05: Chapter = {
  id: "c5",
  number: 5,
  level: "ADVANCED",
  title: "Les stop loss",
  description: "Comment un stop loss plafonne les pertes, comment en placer un manuellement, comment l'IA les gere, et ce qui se passe a l'instant ou un stop se declenche.",
  lessons: [
    {
      id: "c5-l1",
      title: "Qu'est-ce qu'un stop loss et pourquoi en utiliser un ?",
      paragraphs: [
        "Un stop loss est une sortie definie a l'avance. Vous decidez au prealable le pire prix que vous etes pret a accepter, et le bot surveille le marche a votre place. Des que le marche atteint ce niveau, il cloture la position pour qu'une petite perte ne devienne jamais sournoisement une grosse perte. Tout l'interet est de retirer l'emotion et le temps de reaction de la decision pendant que vous dormez ou que vous etes loin du tableau de bord.",
        "Un stop tient compte du sens de la position. Pour une position longue, c'est-a-dire que vous detenez reellement l'actif, le stop se place sous le prix actuel et se declenche quand le prix tombe au niveau du seuil ou le touche. Cela protege la valeur que vous detenez deja plutot que de courir apres de nouvelles entrees.",
        "Les stops ne sont pas une assurance gratuite. Placez le seuil trop pres du prix et le bruit normal du marche vous sortira de la position ; placez-le trop loin et vous encaisserez une perte plus lourde. L'application conserve aussi un pourcentage de stop loss de secours par defaut comme filet de securite, de sorte que meme une position non protegee dispose d'un plancher.",
      ],
      example: "Vous detenez 1 000 XLM achetes a 0,118 USDC. Vous placez un seuil de stop a 0,112 USDC. Tant que le XLM oscille entre 0,118 et 0,114, rien ne se passe. Si une vente massive fait chuter le prix a 0,112, le stop se declenche et le bot sort, plafonnant votre perte a environ 6 USDC au lieu de la subir jusqu'a 0,100, ce qui aurait coute a peu pres 18 USDC.",
    },
    {
      id: "c5-l2",
      title: "Comment placer un stop loss dans cette application (manuel)",
      paragraphs: [
        "Ouvrez le panneau des stop loss et utilisez la section des stop loss manuels. Il y a un selecteur entre le Stop Loss classique, un seuil de declenchement fixe, et le Trailing Stop Loss, qui suit le prix vers le haut et qui est aborde au chapitre suivant. Pour un stop manuel, choisissez Classique.",
        "Renseignez les quatre champs. Choisissez le jeton que vous detenez et la devise de cotation, generalement l'USDC. Saisissez le prix de declenchement, le niveau auquel vous voulez sortir. Choisissez ensuite quelle quantite cloturer : Tout vendre liquide l'ensemble de la position, ou indiquez une quantite precise pour ne sortir qu'une partie et garder le reste expose.",
        "Une fois enregistre, le stop apparait dans la liste manuelle avec un bouton Annuler. Il ne fait rien tant que le prix n'atteint pas le seuil ; l'annuler retire la protection immediatement. Vous pouvez conserver plusieurs stops sur la meme paire en meme temps, par exemple un stop partiel plus haut et un stop de secours total plus bas.",
      ],
      example: "Vous detenez 2 000 XLM et voulez en proteger la majeure partie. Basculez sur Stop Loss classique, mettez le jeton XLM, la cotation USDC, le seuil a 0,110 et la quantite a 1 500 plutot que Tout vendre. Si le XLM tombe a 0,110, le bot vend 1 500 XLM et vous gardez 500 XLM encore sur le marche. Le stop s'affiche alors dans la liste manuelle, ou vous pouvez l'Annuler si vous changez d'avis.",
    },
    {
      id: "c5-l3",
      title: "Comment l'IA place et gere les stop loss automatiquement",
      paragraphs: [
        "En plus des stops manuels, l'IA peut placer les siens. Ils apparaissent dans une section distincte des stop loss IA, et surtout chacun comporte une colonne de notes expliquant le raisonnement de l'IA, par exemple pourquoi elle a choisi ce niveau de seuil pour cette position. Vous n'etes jamais laisse a deviner contre quoi un stop automatique vous protege.",
        "L'IA utilise la meme mecanique que vous. Elle choisit un jeton, une cotation, un seuil et une quantite, et le resultat est un vrai stop qui figure dans une liste que vous pouvez consulter. La difference, c'est que l'IA dimensionne le seuil a partir de sa propre lecture de la volatilite et du risque plutot qu'a partir d'un chiffre que vous auriez saisi.",
        "Les stops IA ne vous sont pas inaccessibles. Chaque stop IA de la liste a un bouton Annuler, exactement comme un stop manuel, donc vous gardez le controle. Si vous n'etes pas d'accord avec le niveau de l'IA, vous pouvez l'annuler et placer le votre, ou laisser le stop IA en place comme couche supplementaire sous votre stop manuel.",
      ],
      example: "Apres que vous avez achete 1 000 XLM a 0,118, l'IA ajoute son propre stop a 0,113 avec la note Bas de la fourchette des 24h proche de 0,114, stop place juste sous le support. Vous lisez ce raisonnement dans la colonne de notes, vous jugez qu'il est sense et vous le laissez. Si la note avait indique seuil place a 0,117, dangereusement serre, vous auriez pu cliquer sur Annuler et le remplacer par un stop plus large de votre cru.",
    },
    {
      id: "c5-l4",
      title: "Resolution des conflits, quand vous et l'IA placez tous deux un stop",
      paragraphs: [
        "Vous et l'IA pouvez chacun detenir un stop sur le meme jeton au meme moment. Ils vivent dans des sections distinctes, stop loss manuels et stop loss IA, et aucun n'ecrase l'autre. Le moniteur de position n'est jamais perturbe par deux stops : il les reduit a un seul seuil effectif avant d'agir.",
        "La regle est simple, le stop le plus protecteur l'emporte. Pour une position longue, le moniteur applique celui des stops actifs qui se situe le plus haut, le plus proche sous le prix actuel, car c'est celui-la qui se declenche en premier et plafonne la perte le plus tot ; le stop plus lache n'a jamais l'occasion de se declencher tant que le plus serre est arme. Pour un trailing stop, c'est le seuil de suivi en direct qui est compare, et non la valeur initiale. Annulez le plus protecteur et le moniteur bascule aussitot sur l'autre.",
        "Une consequence utile : ajouter un second stop ne peut que renforcer votre protection, jamais l'affaiblir. Un schema courant consiste a laisser votre stop manuel etre votre limite personnelle stricte tandis que le stop IA, avec sa justification ecrite, fait office de deuxieme avis : celui qui est le plus protecteur a un instant donne est celui qui agit. Chacun garde son propre bouton Annuler, de sorte qu'en retirer un laisse l'autre en fonction.",
      ],
      example: "Vous detenez 1 000 XLM. Vous placez un stop manuel a 0,110, votre ligne de confort, et l'IA place le sien a 0,113 avec une note sur le support. Les deux figurent dans leurs listes distinctes, mais le moniteur n'applique que le plus protecteur, 0,113. Si le XLM glisse, la cloture se declenche a 0,113. Si vous annulez le stop IA, votre stop manuel a 0,110 prend le relais automatiquement. Deux stops ne vendent jamais en double ; le plus haut prend simplement les commandes.",
    },
    {
      id: "c5-l5",
      title: "Ce qui se passe quand un stop loss se declenche, etape par etape",
      paragraphs: [
        "D'abord, le moniteur de position detecte que le prix du marche a franchi votre seuil. Il n'attend pas la cloture d'une bougie ; le franchissement lui-meme declenche la sortie. Le bot soumet alors un ordre de cloture agressif, prix pour croiser le meilleur prix actuel afin qu'il soit execute tout de suite. Il evite deliberement de se poser passivement a cote d'un marche en chute, car un marche en baisse laisserait un ordre passif non execute pendant que les pertes s'accumulent.",
        "Cet ordre de cloture reste une vraie transaction, il passe donc par chaque controle de securite : le coupe-circuit, la liste blanche, les limites de slippage et la verification prealable du solde. Comme cloturer une position reduit le risque, la sortie s'execute automatiquement et immediatement, meme en mode approbation de chaque transaction. Un stop n'est jamais laisse en plan a attendre qu'un humain clique sur approuver.",
        "Si la liquidite est faible, l'ordre peut n'etre execute que partiellement. Le reste se pose, et le stop peut se redeclencher pour terminer le travail, limite a environ une fois toutes les cinq minutes par paire pour ne pas inonder le marche d'ordres. La seule chose qui arrete un stop, c'est le coupe-circuit, qui bloque toute transaction y compris les sorties ; un coupe-circuit active signifie donc que votre stop est enregistre mais ne se declenchera pas.",
      ],
      example: "Votre stop sur 1 000 XLM est place a 0,112. Le prix affiche 0,1119, ce qui le franchit. Le moniteur se declenche et le bot envoie une vente croisee contre la meilleure offre d'achat actuelle proche de 0,1118 pour qu'elle s'execute aussitot, en passant les controles de slippage et de solde. Seuls 600 XLM sont executes face aux offres disponibles ; les 400 autres se posent. Environ cinq minutes plus tard, le prix etant toujours sous 0,112, le stop se redeclenche et cloture les 400 restants.",
    },
  ],
  quiz: [
    {
      id: "c5-q1",
      prompt: "Quel est l'objectif principal d'un stop loss ?",
      options: [
        { text: "Acheter automatiquement davantage d'un actif quand son prix monte.", explanation: "Incorrect. Un stop loss pour une position longue est une sortie qui vend, et non un ordre d'achat qui renforce une position gagnante." },
        { text: "Definir a l'avance une sortie qui plafonne une perte en cloturant la position des que le prix atteint un niveau choisi.", explanation: "Correct. Le seuil est decide a l'avance pour qu'une petite perte ne puisse pas devenir sournoisement une grosse perte, sans aucun temps de reaction requis de votre part." },
        { text: "Garantir que vous vendez toujours au prix le plus eleve possible.", explanation: "Incorrect. Un stop protege le cote baissier ; il ne capture pas les sommets, et un stop trop serre peut meme vous sortir pendant le bruit normal du marche." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q2",
      prompt: "Pour placer un Stop Loss classique manuel, quels champs renseignez-vous ?",
      options: [
        { text: "Uniquement un pourcentage de baisse ; l'application remplit tout le reste.", explanation: "Incorrect. Un pourcentage fixe correspond au filet de securite de secours par defaut, pas a ce que vous saisissez pour un stop classique manuel." },
        { text: "Le jeton, la cotation, un prix de declenchement, et soit Tout vendre soit une quantite precise.", explanation: "Correct. Vous choisissez l'actif et sa cotation, le niveau de declenchement, et quelle quantite cloturer, en optant pour Tout vendre ou une quantite partielle." },
        { text: "Un prix d'achat et un prix de vente que le bot moyenne ensemble.", explanation: "Incorrect. Un stop classique est un seul prix de declenchement pour une sortie, pas une paire de prix a moyenner." },
        { text: "Seulement le jeton ; l'IA decide du seuil a votre place.", explanation: "Incorrect. Cela decrit un stop IA. Un stop manuel exige que vous definissiez vous-meme le seuil et la quantite." },
      ],
      correctIndex: 1,
    },
    {
      id: "c5-q3",
      prompt: "En quoi un stop loss IA differe-t-il d'un stop loss manuel ?",
      options: [
        { text: "Les stops IA ne peuvent pas etre annules, alors que les stops manuels le peuvent.", explanation: "Incorrect. Chaque stop IA dispose d'un bouton Annuler dans sa liste, exactement comme un stop manuel." },
        { text: "Les stops IA contournent les controles de securite que les stops manuels doivent passer.", explanation: "Incorrect. Les deux types passent par chaque controle de securite lorsqu'ils se declenchent ; la mecanique est identique." },
        { text: "L'IA a choisi les chiffres et le stop est repertorie separement avec une colonne de notes montrant son raisonnement.", explanation: "Correct. Mecaniquement ils sont identiques ; la difference tient a qui a defini le seuil et au fait que les stops IA portent une justification ecrite dans leur propre section." },
      ],
      correctIndex: 2,
    },
    {
      id: "c5-q4",
      prompt: "Quand un stop loss se declenche, comment le bot place-t-il l'ordre de cloture ?",
      options: [
        { text: "Il soumet un ordre agressif prix pour croiser le meilleur prix actuel afin qu'il soit execute tout de suite.", explanation: "Correct. Le bot ne se pose pas passivement a cote d'un marche en chute ; il croise le spread pour s'executer immediatement et plafonner la perte." },
        { text: "Il pose un ordre passif au prix de declenchement et attend un acheteur.", explanation: "Incorrect. Se poser passivement dans un marche en baisse laisserait l'ordre non execute pendant que les pertes s'accumulent, ce que le bot evite justement." },
        { text: "Il annule la position instantanement sans aucun ordre envoye au marche.", explanation: "Incorrect. Cloturer signifie quand meme soumettre un vrai ordre qui s'execute face au carnet d'ordres et passe les controles de securite." },
        { text: "Il attend qu'un humain approuve la sortie avant de faire quoi que ce soit.", explanation: "Incorrect. Les clotures qui reduisent le risque s'executent automatiquement et immediatement, meme en mode approbation de chaque transaction, de sorte qu'un stop n'est jamais laisse en plan." },
      ],
      correctIndex: 0,
    },
    {
      id: "c5-q5",
      prompt: "Qu'arrive-t-il a vos stop loss tant que le coupe-circuit est active ?",
      options: [
        { text: "Les stops se declenchent normalement car les sorties sont exemptees du coupe-circuit.", explanation: "Incorrect. Le coupe-circuit bloque toute transaction, y compris les sorties par stop loss, donc les sorties ne sont pas exemptees." },
        { text: "Les stops sont enregistres mais ne se declenchent pas, car le coupe-circuit bloque toute transaction y compris les sorties.", explanation: "Correct. Un coupe-circuit active arrete chaque ordre, donc un seuil franchi est consigne mais aucun ordre de cloture n'est envoye tant que vous ne le desactivez pas." },
        { text: "Tous les stops sont definitivement supprimes a l'instant ou le coupe-circuit s'active.", explanation: "Incorrect. Les stops restent enregistres ; ils sont simplement suspendus jusqu'a ce que le coupe-circuit soit relache." },
      ],
      correctIndex: 1,
    },
  ],
};
