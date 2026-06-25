import type { Chapter } from "../../types";

export const chapter12: Chapter = {
  id: "c12",
  number: 12,
  level: "EXPERT",
  title: "Fonctionnalites avancees de Stellar",
  description:
    "Approfondissez le carnet d'ordres du SDEX, les trustlines, les path payments, les pools AMM et la consolidation de vos avoirs vers XLM.",
  lessons: [
    {
      id: "c12-l1",
      title: "Comment fonctionne le SDEX : appariement des ordres, frais, reglement",
      paragraphs: [
        "Le SDEX, c'est le Stellar Decentralized Exchange, un carnet d'ordres qui vit a l'interieur du protocole lui-meme plutot que sur les serveurs d'une entreprise. Toute personne disposant d'un compte peut soumettre des offres. Un manageSellOffer dit je cede telle quantite de l'actif A contre au moins ce prix en actif B ; un manageBuyOffer exprime la meme intention depuis l'autre cote. Chaque offre repose on-chain dans le carnet d'ordres de son marche, par exemple XLM contre USDC, jusqu'a ce qu'elle soit prise, remplacee ou annulee.",
        "L'appariement suit une priorite prix-puis-temps. Le protocole execute d'abord l'offre en attente au meilleur prix, et lorsque deux offres partagent un prix, la plus ancienne s'apparie avant la plus recente. Une nouvelle offre qui croise le carnet existant est appariee immediatement contre ces offres en attente ; la quantite restante apres le croisement devient une nouvelle offre en attente a votre prix limite. L'appariement, les transferts d'actifs et le reglement se produisent tous de maniere atomique a l'interieur d'un seul ledger, qui se cloture environ toutes les cinq secondes. Il n'y a pas d'etape de compensation distincte ni d'attente de confirmations au-dela de cette cloture de ledger.",
        "Le modele de couts est inhabituel quand on vient des plateformes centralisees. Il n'y a pas de frais de trading en pourcentage. Vous payez le frais de base du reseau, actuellement 100 stroops, soit 0.00001 XLM par operation, une fraction de centime de dollar. Le veritable cout du trading, c'est le spread que vous croisez lorsque vous prenez de la liquidite, plus ce frais minuscule. Croiser un spread de 10 points de base pour obtenir une execution immediate coute bien plus que le frais de reseau ne le fera jamais.",
        "Ce bot est maker-first. Plutot que de croiser le spread et de payer l'ask (ou de frapper le bid) pour trader maintenant, il pose sa propre offre au meilleur bid ou au meilleur ask afin de rester sur le carnet en tant que maker. Quand quelqu'un d'autre le croise, le bot capte le spread au lieu de le payer. Il ne croise en tant que taker que lorsqu'il a vraiment besoin d'une execution immediate. Sur un edge mesure en quelques points de base, la difference entre payer le spread et le capter fait souvent la difference entre un trade rentable et un trade non rentable.",
      ],
      example:
        "Le carnet XLM/USDC affiche un meilleur bid a 0.1170 et un meilleur ask a 0.1180, soit un spread de 10 bps. Un taker qui achete maintenant paie 0.1180. Le bot maker-first pose plutot une offre d'achat a 0.1170, rejoignant le bid. Quand un vendeur croise plus tard a la baisse jusqu'a 0.1170, le bot est execute dans cette cloture de ledger. Il a paye 100 stroops de frais de reseau et a capte le spread au lieu de ceder 0.0010 par XLM.",
    },
    {
      id: "c12-l2",
      title: "Qu'est-ce qu'une trustline et quand est-elle requise ?",
      paragraphs: [
        "Une trustline est une adhesion explicite, creee avec l'operation changeTrust, qui autorise votre compte a detenir un actif non natif precis. Stellar identifie chaque actif non natif par un code plus son compte emetteur, ecrit CODE:ISSUER. Cet appariement compte : l'USDC emis par Circle est un actif completement different de tout autre token qui s'appellerait aussi USDC. Une trustline porte sur une paire code-et-emetteur exacte, donc faire confiance a l'USDC de Circle ne vous permet pas de detenir l'USDC d'un autre emetteur.",
        "Le seul actif qui n'a jamais besoin de trustline, c'est XLM, le lumen natif. Tout compte peut detenir et envoyer du XLM par defaut. Tout le reste, chaque token emis, exige une trustline avant que votre compte ne puisse en recevoir ou en detenir le moindre montant. Envoyez a quelqu'un un actif pour lequel il n'a pas de trustline et le paiement echoue tout simplement.",
        "Les trustlines ont un cout sous forme de reserve bloquee. Chaque trustline ouverte est une sous-entree sur votre compte, et chaque sous-entree releve votre reserve minimale en XLM de 0.5 XLM. Ces 0.5 XLM sont bloques tant que la ligne reste ouverte : ils ne peuvent etre ni depenses, ni tradees, ni retires jusqu'a ce que vous supprimiez la trustline. Cinq trustlines ouvertes bloquent donc 2.5 XLM au-dessus de la reserve de base, et ce montant bloque est purement un cout de detention, jamais depense ni gagne. Fermer une trustline pour un actif que vous ne detenez plus recupere ces 0.5 XLM, et c'est pourquoi les portefeuilles bien tenus ferment les lignes dont ils n'ont plus besoin.",
        "Ce bot se protege du piege du paiement echoue grace a une pre-verification de solde. Avant de signer le moindre trade, il verifie qu'une trustline existe deja pour l'actif que le trade recevrait. Un achat qui apporterait de l'USDC n'est signe que si le compte fait deja confiance a cet emetteur d'USDC precis. La verification a lieu avant la signature, et non apres un rejet, si bien que le bot ne gaspille jamais une transaction a decouvrir au moment du reglement qu'il n'avait nulle part ou placer l'actif qu'il venait d'acheter.",
      ],
      example:
        "Vous voulez que le bot achete de l'USDC chez Circle. Vous ouvrez d'abord une trustline vers USDC:emetteur-Circle sur le tableau de bord. Cette sous-entree releve votre reserve minimale en XLM de 0.5 XLM, bloquant ce montant tant que la ligne reste ouverte. Desormais, un achat qui recoit l'USDC de Circle passe la pre-verification et est signe. Vendez plus tard tout cet USDC et fermez la trustline, et les 0.5 XLM sont liberes de nouveau dans votre solde disponible.",
    },
    {
      id: "c12-l3",
      title: "Qu'est-ce qu'un path payment et comment cette application l'utilise pour swapper vers XLM",
      paragraphs: [
        "Un path payment convertit un actif envoye en un actif recu different a l'interieur d'une seule transaction atomique, en sautant par un ou plusieurs marches intermediaires pour trouver une route. Stellar expose deux formes. pathPaymentStrictSend fixe le montant que vous envoyez et laisse le montant recu descendre jusqu'a un minimum que vous definissez ; pathPaymentStrictReceive fixe le montant que vous voulez recevoir et laisse le montant envoye monter jusqu'a un maximum que vous definissez. Dans les deux cas le reseau parcourt un chemin, par exemple l'actif A vers un actif intermediaire vers l'actif C, et le saut entier se regle ensemble ou pas du tout.",
        "L'atomicite est la propriete cle. La conversion entiere soit s'accomplit a travers chaque saut, soit s'annule sans rien changer. Vous ne pouvez jamais rester coince a mi-chemin, detenant un actif intermediaire indesirable parce qu'une jambe a echoue. Cela fait des path payments un outil propre pour passer entre des actifs que vous voulez reellement detenir.",
        "Cette application utilise les path payments pour sa fonction de Swap et Conversion du portefeuille, et non pour la boucle de trading automatise sur le carnet d'ordres. Quand vous demandez un swap, l'application renvoie une cotation decrivant sendAsset, sendAmount, destAsset, destAmount, et le path qu'elle a trouve, la liste ordonnee des actifs intermediaires par lesquels la route passe. Vous examinez cette cotation avant de valider, donc vous voyez la conversion complete, la route et le montant estime que vous recevriez avant que quoi que ce soit ne soit signe.",
        "L'auto-swap vers XLM, c'est cette fonction pointee vers le lumen : consolider les avoirs non-XLM de nouveau en XLM via ce meme swap. Les deux raisons principales sont le positionnement et la reserve. Detenir du XLM libere le cote achat de la strategie, qui vend du XLM, parce que le bot ne peut vendre du XLM dans un creux que s'il detient effectivement du XLM. Et un solde de XLM plus important renfloue la reserve minimale qu'exigent le compte de base et chaque trustline ouverte. Le swap est le mecanisme ; l'auto-swap vers XLM, c'est simplement choisir XLM comme actif de destination.",
      ],
      example:
        "Vous detenez du yXLM et vous voulez du XLM simple, mais le carnet direct yXLM-vers-XLM est etroit. Vous demandez un swap. L'application renvoie une cotation : sendAsset yXLM, sendAmount 100, destAsset XLM, destAmount environ 99.4, avec un path routant le yXLM par USDC vers XLM. Vous l'examinez et l'acceptez. Le path payment execute les deux sauts de maniere atomique dans un seul ledger : soit vous vous retrouvez avec environ 99.4 XLM, soit toute la transaction s'annule et vous conservez vos 100 yXLM.",
    },
    {
      id: "c12-l4",
      title: "Pools de liquidite AMM contre carnet d'ordres",
      paragraphs: [
        "Stellar prend en charge deux facons de trader une paire d'actifs : le carnet d'ordres et les pools de teneurs de marche automatises. Le carnet d'ordres, le SDEX, est un ensemble d'offres en attente discretes a des prix precis, appariees prix-puis-temps comme vu plus haut. Un pool de liquidite AMM est different de forme. Il detient une reserve de deux actifs ensemble, alimentee par des fournisseurs de liquidite qui deposent les deux cotes, et les traders swappent contre le pool plutot que contre l'offre d'un autre trader.",
        "Un pool fixe le prix de chaque swap avec une formule a produit constant, x fois y egale k. Le produit des deux reserves reste constant a mesure qu'un cote est achete et l'autre vendu, donc plus vous retirez d'un actif, plus le prix evolue brusquement a votre desavantage. C'est l'impact sur le prix, et il croit avec la taille du trade : un petit swap deplace a peine le taux, un gros swap peut le deplacer beaucoup. Contre un carnet d'ordres, en revanche, vous parcourez des offres en attente discretes niveau par niveau. Les deux lieux ont des profils de slippage reellement differents pour le meme trade nominal.",
        "Soyez precis sur ce que fait ce bot. Son trading automatise utilise le carnet d'ordres du SDEX, en posant des offres maker-first comme decrit dans les lecons precedentes. La strategie ne vise pas les pools AMM et ne dimensionne pas les trades contre une courbe a produit constant. Les pools sont presentes ici comme un mecanisme Stellar general que vous rencontrerez, et non comme un lieu que vise la boucle de trading.",
        "Il y a un chevauchement subtil. Un path payment, qui alimente la fonction de Swap, peut accessoirement passer par un pool AMM au niveau du protocole si le reseau constate que le meilleur path passe par l'un d'eux. C'est le protocole qui choisit une route efficace pour une seule conversion ponctuelle, et c'est entierement distinct du trading sur carnet d'ordres que la boucle de scan realise. Un pool peut donc toucher votre portefeuille a travers un swap, mais jamais a travers la strategie automatisee.",
      ],
      example:
        "Imaginez un pool XLM/USDC detenant 100000 XLM et 12000 USDC, donc k vaut 1.2 milliard et le prix marginal est 0.12. Swappez 1200 USDC et la reserve d'USDC monte a 13200 ; pour garder k constant la reserve de XLM tombe a environ 90909, vous recevez donc environ 9091 XLM a un taux moyen pire que 0.12, l'impact sur le prix. Le bot ignore ce pool pour ses trades automatises, posant plutot des offres sur le carnet d'ordres, meme si une cotation de Swap ponctuelle pourrait legitimement router par lui.",
    },
    {
      id: "c12-l5",
      title: "Un auto-swap vers XLM en vaut-il la peine ? Le calcul de rentabilite",
      paragraphs: [
        "Il n'y a pas de verificateur de profit automatique a l'interieur de la boucle de trading qui decide a votre place si un auto-swap vers XLM est rentable. La boucle trade le carnet d'ordres ; elle n'evalue ni ne declenche silencieusement des swaps. Juger si un swap en vaut la peine est votre travail, et la cotation de Swap vous donne tout ce qu'il faut pour le faire. Traitez la cotation comme un petit tableur plutot que comme un bouton.",
        "La methode consiste a comparer destAmount, le XLM que la cotation dit que vous recevriez, a la valeur de ce que vous cedez. Ce que vous cedez, c'est sendAmount de l'actif envoye, valorise a un taux de reference juste. L'ecart entre les deux est mange par le spread que vous croisez le long du path plus le frais de reseau par operation de 100 stroops. Un path a plusieurs sauts est plus couteux qu'un saut unique, parce que vous croisez un spread a chaque marche que la route traverse, et pas une seule fois. Une route a deux sauts peut donc couter discretement deux spreads.",
        "Un swap en vaut la peine quand le XLM recu cote bat votre meilleure alternative. Les alternatives sont generalement : detenir l'actif tel quel, ou le vendre sur un marche direct plus profond puis acheter du XLM vous-meme. Si un marche direct pour votre actif est plus profond que le path du swap, y vendre et convertir manuellement peut perdre moins en spread qu'une route etroite a plusieurs sauts. La cotation ne connait pas vos alternatives ; c'est vous qui apportez ce jugement en comparant son destAmount a ce que ces autres routes rapporteraient.",
        "Travaillons un exemple avec des chiffres reels. Disons que vous detenez 50 USDC et que le prix juste du XLM est 0.12, donc une conversion sans friction donnerait 50 divise par 0.12, environ 416.7 XLM. La cotation de Swap renvoie un destAmount de 414.0 XLM via une route a saut unique. Le manque d'environ 2.7 XLM, soit environ 0.65 pour cent, c'est le spread croise plus le frais negligeable de 100 stroops. Si detenir l'USDC ou le vendre sur un carnet direct plus profond vous rapportait plus de 414.0 XLM de valeur, sautez le swap. Si 414.0 XLM est reellement le mieux que vous puissiez faire et que vous avez besoin de XLM pour liberer le cote achat ou renflouer la reserve, le swap en vaut la peine. C'est l'arithmetique, pas un verificateur integre, qui tranche.",
      ],
      example:
        "Vous detenez 50 USDC ; le taux juste est 0.12, donc sans friction cela fait environ 416.7 XLM. Une cotation de Swap a saut unique affiche un destAmount de 414.0 XLM, une decote de 0.65 pour cent pour le spread plus le frais de 100 stroops. Une cotation a deux sauts par AQUA affiche 410.5 XLM, pire parce qu'elle croise deux spreads. Vous prenez la route a saut unique a 414.0 uniquement parce que vous avez besoin de XLM pour la reserve et qu'aucun marche direct plus profond ne ferait mieux.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Comment le SDEX apparie-t-il les ordres et facture-t-il les frais, et comment ce bot y trade-t-il ?",
      options: [
        {
          text: "Il apparie prix-puis-temps et regle de maniere atomique a l'interieur d'un ledger ; il n'y a pas de frais en pourcentage, juste un petit frais de base par operation plus tout spread croise, et le bot est maker-first pour capter le spread.",
          explanation:
            "Correct. Le SDEX execute meilleur-prix-d'abord puis plus-ancien-d'abord, regle a l'interieur d'un ledger d'environ cinq secondes, ne facture que le frais de base de 100 stroops plus le spread que vous croisez, et ce bot pose des offres pour capter ce spread au lieu de le payer.",
        },
        {
          text: "Il facture un frais de trading en pourcentage sur chaque execution et regle apres plusieurs confirmations de bloc, et le bot croise toujours le spread en tant que taker.",
          explanation:
            "Faux. Il n'y a pas de frais en pourcentage, le reglement est atomique a l'interieur d'un seul ledger plutot qu'apres de nombreuses confirmations, et le bot est maker-first plutot que toujours taker.",
        },
        {
          text: "Il apparie les offres les plus recentes d'abord et regle off-chain via un operateur d'echange, le bot payant a cet operateur une commission.",
          explanation:
            "Faux. L'appariement est plus-ancien-d'abord a un prix donne, le reglement est on-chain et atomique, et il n'y a ni operateur ni commission.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q2",
      prompt: "Quand une trustline est-elle requise, et que coute l'ouverture d'une trustline ?",
      options: [
        {
          text: "Avant de detenir le moindre actif, XLM compris, et elle coute un frais en pourcentage sur chaque reception.",
          explanation:
            "Faux. XLM est natif et n'a jamais besoin de trustline, et le cout est une reserve bloquee, pas un frais en pourcentage.",
        },
        {
          text: "Avant que votre compte ne puisse detenir un actif non natif CODE:ISSUER precis comme l'USDC de Circle, et chaque trustline ouverte bloque 0.5 XLM dans votre reserve minimale.",
          explanation:
            "Correct. Une trustline est l'adhesion pour une paire code-et-emetteur exacte, XLM n'en a jamais besoin, et chaque ligne ouverte releve votre reserve minimale de 0.5 XLM jusqu'a sa fermeture.",
        },
        {
          text: "Seulement une fois qu'un trade a deja echoue faute d'en avoir une, et cela ne coute rien.",
          explanation:
            "Faux. La pre-verification verifie la trustline avant la signature plutot qu'apres un echec, et chaque ligne bloque 0.5 XLM de reserve.",
        },
        {
          text: "Avant d'envoyer du XLM a tout nouveau compte, et elle brule definitivement 0.5 XLM.",
          explanation:
            "Faux. Envoyer du XLM n'exige aucune trustline, et les 0.5 XLM sont une reserve bloquee qui est recuperee lorsque vous fermez la ligne, pas brulee.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q3",
      prompt: "Que fait un path payment, et comment cette application l'utilise-t-elle ?",
      options: [
        {
          text: "Il decoupe un paiement en plusieurs transactions independantes qui se reglent chacune de son cote.",
          explanation:
            "Faux. Un path payment est une seule transaction atomique ; soit la conversion entiere s'accomplit, soit elle s'annule entierement.",
        },
        {
          text: "C'est le mecanisme derriere chaque trade automatise sur carnet d'ordres que le bot realise.",
          explanation:
            "Faux. La boucle automatisee utilise les offres sur le carnet d'ordres du SDEX ; les path payments alimentent plutot la fonction de Swap et Conversion du portefeuille.",
        },
        {
          text: "Il convertit un actif envoye en un actif recu different de maniere atomique a travers un ou plusieurs sauts, et l'application l'utilise pour la fonction de Swap et Conversion du portefeuille, renvoyant une cotation avec sendAsset, destAmount et le path.",
          explanation:
            "Correct. Un path payment saute par des marches intermediaires en une seule transaction atomique, et l'application l'utilise pour les swaps, y compris l'auto-swap vers XLM, montrant la route et le montant recu estime avant que vous ne validiez.",
        },
        {
          text: "Il ouvre automatiquement une trustline pour tout actif que vous recevez.",
          explanation:
            "Faux. Les trustlines s'ouvrent separement avec changeTrust sur le tableau de bord ; un path payment convertit des actifs et ne cree pas de trustlines.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q4",
      prompt: "En quoi un pool AMM differe-t-il du carnet d'ordres, et lequel la boucle automatisee de ce bot trade-t-elle ?",
      options: [
        {
          text: "Un pool fixe le prix des swaps le long d'une courbe a produit constant avec un impact dependant de la taille, le carnet d'ordres apparie des offres en attente discretes, et la boucle automatisee du bot trade le carnet d'ordres.",
          explanation:
            "Correct. Les pools AMM utilisent x fois y egale k donc les trades plus gros deplacent davantage le prix, le carnet d'ordres utilise des offres discretes, et la boucle automatisee pose des offres maker-first sur le carnet d'ordres, pas dans les pools.",
        },
        {
          text: "Un pool et le carnet d'ordres sont le meme mecanisme, et le bot fait passer chaque trade automatise par le pool.",
          explanation:
            "Faux. Ce sont des mecanismes differents, et la boucle automatisee trade le carnet d'ordres plutot que de router par des pools.",
        },
        {
          text: "Un pool est un ensemble d'offres en attente discretes, le carnet d'ordres est une courbe a produit constant, et le bot trade la courbe.",
          explanation:
            "Faux. Les descriptions sont inversees : le carnet d'ordres detient des offres discretes et le pool est la courbe a produit constant, et le bot trade le carnet d'ordres.",
        },
        {
          text: "Un pool a un impact sur le prix nul a toute taille, donc le bot y route ses trades automatises pour eviter le slippage.",
          explanation:
            "Faux. Un pool a produit constant a un impact sur le prix qui croit avec la taille, et le bot trade le carnet d'ordres plutot que les pools.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q5",
      prompt: "Comment devez-vous juger si un auto-swap vers XLM en vaut la peine ?",
      options: [
        {
          text: "Faire confiance a un verificateur de profit integre dans la boucle de trading qui decide automatiquement si chaque swap est rentable.",
          explanation:
            "Faux. Il n'y a pas de verificateur de profit automatique dans la boucle de trading ; vous evaluez vous-meme le swap a partir de la cotation.",
        },
        {
          text: "Supposer que tout swap en vaut la peine parce que le frais de reseau est minuscule, en ignorant le spread.",
          explanation:
            "Faux. Le cout dominant est le spread croise le long du path, et une route a plusieurs sauts en croise un a chaque saut ; le frais minuscule n'est pas le facteur decisif.",
        },
        {
          text: "Comparer le destAmount de la cotation en XLM a la valeur de ce que vous cedez, en soustrayant le spread croise a chaque saut et le frais par operation, et ne le prendre que s'il bat le fait de detenir ou de vendre sur un marche direct plus profond.",
          explanation:
            "Correct. Vous lisez destAmount face a la valeur juste de sendAmount, tenez compte du spread a chaque saut plus le frais de 100 stroops, et ne swappez que lorsque le XLM recu bat vos alternatives.",
        },
        {
          text: "Choisir la cotation qui a le plus de sauts, puisque plus de sauts signifie toujours un meilleur prix.",
          explanation:
            "Faux. Plus de sauts signifie plus de spreads croises, ce qui rend generalement la route pire, pas meilleure.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
