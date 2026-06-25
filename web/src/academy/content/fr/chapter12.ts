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
      title: "Qu'est-ce que le SDEX (Stellar Decentralized Exchange) ?",
      paragraphs: [
        "Le SDEX, c'est le Stellar Decentralized Exchange, un carnet d'ordres integre directement au protocole Stellar. Aucune entreprise distincte ne le fait tourner : n'importe qui ayant un compte peut placer des offres d'achat ou de vente, et ces offres se matchent entre elles on-chain. Chaque marche, comme XLM contre USDC, a son propre carnet d'ordres rempli d'offres en attente d'etre executees.",
        "Ce bot effectue tout son trading automatise sur le carnet d'ordres du SDEX, en y placant des offres a cours limite et au marche. Il ne trade pas sur une plateforme centralisee, et il ne fait pas passer sa boucle de trading par des pools de liquidite. Quand l'IA decide d'agir, elle soumet une offre au marche SDEX concerne et laisse le protocole la matcher.",
        "Un detail caracteristique tient a la maniere dont le bot entre en position : il utilise une execution maker-first. Plutot que de croiser le spread et de payer le prix demande par l'autre cote, il prefere poser sa propre offre au meilleur bid ou au meilleur ask du moment. En restant sur le carnet en tant que maker, il vise a capter le spread au lieu de le payer, ce qui compte enormement quand l'edge ne fait que quelques points de base.",
      ],
      example:
        "Supposons que le carnet XLM/USDC affiche un meilleur bid a 0.1170 et un meilleur ask a 0.1180. Pour acheter du XLM, un bot maker-first ne paie pas l'ask a 0.1180. Il pose plutot sa propre offre d'achat a 0.1170, rejoignant le cote bid. Si un vendeur arrive et frappe cette offre, le bot achete a 0.1170 et empoche le spread, au lieu de croiser a 0.1180 et de le ceder.",
    },
    {
      id: "c12-l2",
      title: "Qu'est-ce qu'une trustline et quand en avez-vous besoin ?",
      paragraphs: [
        "Une trustline est un accord explicite qui autorise votre compte Stellar a detenir un actif non natif precis provenant d'un emetteur precis. Les actifs sur Stellar sont definis par un code plus le compte qui les a emis, donc l'USDC emis par Circle est une chose differente de tout autre token qui s'appellerait aussi USDC. Avant que votre compte ne puisse recevoir ou detenir un actif, vous devez ouvrir une trustline vers cette paire code-et-emetteur exacte.",
        "Le seul actif qui n'a jamais besoin de trustline, c'est XLM, le lumen natif. Tout le reste en exige une. Vous ajoutez et supprimez les trustlines depuis le tableau de bord, et la pre-verification de solde de l'application confirme qu'une trustline existe deja pour tout actif qu'une transaction recevrait, si bien qu'un achat ne peut pas vous livrer un actif que vous n'avez aucun moyen de detenir.",
        "Les trustlines ne sont pas gratuites dans un sens : chaque trustline ouverte releve legerement la reserve minimale en XLM de votre compte. Cette reserve est bloquee et ne peut etre ni depensee ni tradee tant que la ligne reste ouverte. Il est donc utile de fermer les trustlines des actifs que vous ne detenez plus, a la fois pour recuperer un peu de reserve et pour garder le portefeuille en ordre.",
      ],
      example:
        "Vous voulez que le bot achete de l'USDC chez Circle. Vous ouvrez d'abord une trustline vers l'USDC emis par le compte emetteur de Circle, depuis le tableau de bord. Cette trustline pousse votre reserve minimale en XLM d'un cran vers le haut, bloquant un petit montant de XLM. Desormais, un achat qui recoit de l'USDC passe la pre-verification de solde. Si vous vendez plus tard tout votre USDC et fermez la trustline, cette reserve est de nouveau liberee.",
    },
    {
      id: "c12-l3",
      title: "Qu'est-ce qu'un path payment et comment cette application l'utilise-t-elle ?",
      paragraphs: [
        "Un path payment est un paiement Stellar qui convertit un actif en un autre actif a l'interieur d'une seule transaction atomique, en passant automatiquement par un ou plusieurs marches intermediaires pour trouver un chemin. Vous indiquez ce que vous voulez envoyer et ce que vous voulez recevoir, et le reseau parcourt un chemin, par exemple l'actif envoye vers un actif intermediaire puis vers l'actif recu, le tout reglee ensemble ou pas du tout.",
        "Cette application utilise les path payments pour sa fonction de Swap et Conversion du portefeuille, et non pour la boucle de trading automatise sur le carnet d'ordres. Quand vous demandez un swap, l'application produit une cotation montrant la route ou le chemin trouve et le montant estime que vous recevriez. Vous examinez cette cotation avant de valider, ce qui vous permet de voir la conversion avant qu'elle ne se produise.",
        "Parce que le saut entier est atomique, un path payment soit realise la conversion complete, soit echoue proprement sans rien changer. Il n'y a aucun risque de convertir a moitie et de se retrouver coince avec un actif intermediaire dont vous ne vouliez pas. Cela fait des path payments un outil propre pour passer d'un actif a un autre que vous souhaitez reellement detenir.",
      ],
      example:
        "Vous detenez du yXLM et vous voulez de l'USDC, mais il se peut qu'il n'existe pas de marche direct profond entre les deux. Vous demandez un swap. L'application renvoie une cotation dont le chemin route le yXLM vers XLM puis XLM vers USDC, estimant que vous recevriez environ 96 USDC. Vous acceptez, et le path payment execute les deux sauts en une seule transaction atomique : soit vous vous retrouvez avec l'USDC, soit tout est annule et vous conservez votre yXLM.",
    },
    {
      id: "c12-l4",
      title: "Qu'est-ce qu'un pool de liquidite AMM sur Stellar ?",
      paragraphs: [
        "Au-dela du carnet d'ordres, Stellar prend aussi en charge les pools de teneurs de marche automatises. Un pool de liquidite AMM detient deux actifs ensemble, alimente par des fournisseurs de liquidite qui deposent les deux cotes. Les traders swappent alors contre le pool plutot que contre l'offre d'un autre trader, et le pool fixe le prix de chaque swap a l'aide d'une formule a produit constant, ou le produit des deux reserves reste a peu pres constant a mesure qu'un cote est achete et l'autre vendu.",
        "Il est important d'etre clair sur ce que fait ce bot. Le bot ne fait pas passer ses trades automatises par des pools AMM. Sa boucle de trading travaille le carnet d'ordres du SDEX, en placant des offres maker-first comme decrit plus haut. Les pools AMM sont presentes ici comme un concept Stellar general que vous pourriez rencontrer, et non comme un lieu que vise la strategie du bot.",
        "Il y a une exception subtile a connaitre. Les path payments, qui alimentent la fonction de Swap, peuvent accessoirement passer par un pool AMM au niveau du protocole si le reseau constate que le meilleur chemin passe par l'un d'eux. C'est le protocole qui choisit une route efficace pour une conversion ponctuelle, et c'est distinct du trading sur carnet d'ordres que le bot realise dans sa boucle de scan.",
      ],
      example:
        "Imaginez un pool XLM/USDC detenant 100000 XLM et 12000 USDC. Un trader y swappe un peu d'USDC, la reserve d'USDC du pool augmente, sa reserve de XLM diminue, et la regle du produit constant ajuste le taux de sorte que le prix derive a mesure que la taille de l'echange grandit. Le bot ignore ce pool pour ses trades automatises, posant plutot des offres sur le carnet d'ordres, meme si une cotation de Swap ponctuelle pourrait legitimement router une conversion par un tel pool.",
    },
    {
      id: "c12-l5",
      title: "Qu'est-ce que l'auto-swap vers XLM et quand faut-il l'utiliser ?",
      paragraphs: [
        "L'auto-swap vers XLM consiste a consolider vos avoirs non-XLM de nouveau en XLM via la fonction de Swap et Conversion. Comme cette fonction repose sur les path payments, l'auto-swap n'est en realite qu'une commodite posee par-dessus le swap : au lieu de convertir chaque token a la main, il aide a rassembler des soldes non natifs eparpilles dans le lumen natif.",
        "Il y a quelques bonnes raisons d'y recourir. Consolider en XLM peut liberer le cote achat, puisque detenir du XLM permet au bot de vendre du XLM dans les creux quand une opportunite apparait. Cela simplifie aussi un portefeuille encombre de petits residus de tokens, et cela peut renflouer votre solde de XLM pour couvrir confortablement la reserve minimale qu'exigent les trustlines et les besoins de base du compte.",
        "Considerez l'auto-swap comme une fonction de commodite en evolution plutot que comme un processus de fond entierement automatique qui vide silencieusement votre portefeuille. Vous gardez le controle : il s'appuie sur les memes cotations de Swap que vous examineriez vous-meme, ce qui vous permet de voir ce que chaque conversion rapporterait avant qu'elle ne se produise. Utilisez-le de maniere deliberee, lors d'un rangement ou d'un repositionnement, et non comme un reglage qu'on active puis qu'on oublie.",
      ],
      example:
        "Votre portefeuille detient 40 USDC, 15 AQUA, et un maigre 300 XLM qui depasse a peine votre reserve. Vous voulez que le cote achat du bot, qui vend du XLM, soit actif et que votre reserve soit confortable. Vous utilisez l'auto-swap vers XLM, qui produit des cotations de swap convertissant l'USDC et l'AQUA en XLM. Apres acceptation, vous detenez un solde de XLM plus consequent, un portefeuille mieux range, et assez de marge au-dessus de la reserve minimale pour garder les trustlines ouvertes et trader librement.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Qu'est-ce que le SDEX, et comment ce bot y trade-t-il ?",
      options: [
        {
          text: "Une plateforme centralisee a laquelle le bot se connecte avec une cle API, croisant le spread a chaque ordre.",
          explanation:
            "Faux. Le SDEX est decentralise et integre au protocole, et le bot pose des offres maker plutot que de toujours croiser le spread.",
        },
        {
          text: "Un carnet d'ordres decentralise au niveau du protocole, ou le bot place des offres maker-first pour capter le spread.",
          explanation:
            "Correct. Le SDEX est le carnet d'ordres on-chain integre a Stellar, et le bot prefere poser des offres au meilleur bid ou ask plutot que de le croiser.",
        },
        {
          text: "Un pool de liquidite AMM contre lequel la boucle automatisee du bot swappe a chaque trade.",
          explanation:
            "Faux. Le bot trade le carnet d'ordres, pas les pools AMM ; les pools sont un concept Stellar distinct.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q2",
      prompt: "Quand devez-vous ouvrir une trustline ?",
      options: [
        {
          text: "Avant de detenir ou de recevoir n'importe quel actif, XLM compris.",
          explanation:
            "Faux. XLM est l'actif natif et n'a jamais besoin de trustline ; seuls les actifs non natifs en ont besoin.",
        },
        {
          text: "Seulement apres qu'une transaction a deja echoue faute d'en avoir une.",
          explanation:
            "Faux. La pre-verification de solde verifie d'abord la trustline, donc la trustline devrait exister avant la transaction, et non apres un echec.",
        },
        {
          text: "Avant que votre compte ne puisse detenir un actif non natif precis provenant d'un emetteur precis, comme l'USDC de Circle.",
          explanation:
            "Correct. Une trustline est l'accord pour une paire code-et-emetteur precise, et chaque trustline ouverte releve legerement votre reserve minimale en XLM.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q3",
      prompt: "Que fait un path payment, et comment cette application l'utilise-t-elle ?",
      options: [
        {
          text: "Il convertit un actif en un autre en une seule transaction atomique, et l'application l'utilise pour la fonction de Swap et Conversion du portefeuille.",
          explanation:
            "Correct. Un path payment saute par des marches intermediaires de maniere atomique, et l'application l'utilise pour des swaps qui affichent une route et un montant recu estime, et non pour la boucle sur carnet d'ordres.",
        },
        {
          text: "C'est le mecanisme que le bot utilise pour chaque trade automatise sur le carnet d'ordres.",
          explanation:
            "Faux. La boucle de trading automatise utilise les offres sur le carnet d'ordres du SDEX ; les path payments alimentent plutot la fonction de Swap.",
        },
        {
          text: "Il decoupe un paiement en plusieurs transactions distinctes qui se reglent chacune independamment.",
          explanation:
            "Faux. Un path payment est une seule transaction atomique qui soit realise la conversion complete, soit s'annule entierement.",
        },
        {
          text: "Il ouvre automatiquement une trustline pour tout actif que vous recevez.",
          explanation:
            "Faux. Les trustlines s'ouvrent separement depuis le tableau de bord ; un path payment convertit des actifs, il ne cree pas de trustlines.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q4",
      prompt: "Qu'est-ce qu'un pool de liquidite AMM sur Stellar, et ce bot trade-t-il a travers un tel pool ?",
      options: [
        {
          text: "C'est le carnet d'ordres principal du protocole, et le bot y pose toutes ses offres.",
          explanation:
            "Faux. Le carnet d'ordres et les pools AMM sont des mecanismes differents ; le bot pose des offres sur le carnet d'ordres, qui n'est pas un pool.",
        },
        {
          text: "C'est un pool a produit constant de deux actifs contre lequel les traders swappent, et le bot fait passer ses trades automatises par ce pool.",
          explanation:
            "Faux. La description du pool est juste, mais le bot ne fait pas passer ses trades automatises par des pools ; il trade le carnet d'ordres.",
        },
        {
          text: "C'est un pool a produit constant de deux actifs alimente par des fournisseurs de liquidite, et le bot trade le carnet d'ordres au lieu de faire passer ses trades automatises par des pools.",
          explanation:
            "Correct. Les pools AMM fixent le prix des swaps avec une formule a produit constant, mais la boucle automatisee du bot utilise le carnet d'ordres du SDEX ; seul un path payment ponctuel pourrait accessoirement passer par un pool.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q5",
      prompt: "A quoi sert principalement l'auto-swap vers XLM ?",
      options: [
        {
          text: "A consolider les avoirs non-XLM de nouveau en XLM pour liberer le cote achat, ranger le portefeuille ou renflouer la reserve.",
          explanation:
            "Correct. C'est une commodite batie sur la fonction de Swap qui rassemble les soldes non natifs en XLM, aidant a se repositionner pour vendre du XLM, simplifier le portefeuille et couvrir la reserve minimale.",
        },
        {
          text: "Un processus de fond entierement automatique qui vide silencieusement chaque token sans que vous n'examiniez rien.",
          explanation:
            "Faux. C'est une commodite en evolution batie sur des cotations de Swap que vous pouvez examiner ; ce n'est pas un balayage de fond sans intervention.",
        },
        {
          text: "Un moyen d'ouvrir des trustlines en masse pour de nouveaux actifs que vous voulez commencer a trader.",
          explanation:
            "Faux. L'auto-swap convertit des avoirs en XLM ; ouvrir des trustlines pour de nouveaux actifs est une action distincte du tableau de bord.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
