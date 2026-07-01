// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Complément sur la microstructure de marché pour le chapitre 12 (« Fonctionnalités avancées de Stellar »).
// Il ne s'agit PAS d'un chapitre autonome. Au feu vert, ajouter c12ExtraLessons à
// chapter12.lessons[] (après c12-l5) et c12ExtraQuiz à chapter12.quiz[] (après
// c12-q5). Les ids poursuivent la numérotation existante : leçons c12-l6/c12-l7, quiz
// c12-q6/c12-q7. La leçon maker/taker reprend telles quelles les entrées du glossaire « maker » et
// « taker » pour que leur première occurrence se relie automatiquement à une infobulle.
import type { Lesson, QuizQuestion } from "../../../types";

export const c12ExtraLessons: Lesson[] = [
  {
    id: "c12-l6",
    title: "La dynamique maker vs taker et son influence sur la stratégie",
    paragraphs: [
      "Chaque exécution sur le carnet d'ordres du SDEX a deux faces, et le protocole les traite de façon très différente en matière de coût, même s'il ne facture de frais en pourcentage à aucune des deux. Le carnet d'ordres est apparié selon la priorité prix puis temps : à chaque niveau de prix, le meilleur prix est exécuté en premier, et parmi les offres partageant un même prix, la plus ancienne est exécutée avant la plus récente. Cette seule règle est ce qui crée les deux rôles que vous devez comprendre avant même de pouvoir raisonner sur la stratégie.",
      "Un maker est une offre qui repose sur le carnet et qui attend. Lorsque vous soumettez un manageSellOffer ou un manageBuyOffer à un prix qui ne croise pas le carnet actuel, il ne s'exécute pas immédiatement ; il rejoint la file d'attente à son niveau de prix et y reste, apportant de la liquidité pour que quelqu'un d'autre puisse trader contre lui. Parce qu'il a attendu, il obtient son prix : une offre d'achat au repos est exécutée au cours acheteur, une offre de vente au repos au cours vendeur. En pratique, le maker capte le spread au lieu de le payer. Le coût d'être un maker, c'est le temps et le risque d'exécution, car le marché peut s'éloigner avant que quiconque ne vienne vous croiser, et votre offre peut ne jamais être exécutée.",
      "Un taker est l'image inversée. Lorsque vous soumettez une offre dont le prix croise le carnet existant, ou que vous avez simplement besoin d'une exécution immédiate, vous prenez la meilleure offre au repos de l'autre côté. Vous obtenez la certitude d'une exécution avant la prochaine clôture de ledger, mais vous la payez en franchissant le spread : achat au cours vendeur, vente au cours acheteur. Sur un edge mesuré en quelques points de base, concéder un spread de 10 points de base à l'entrée puis un autre à la sortie peut effacer la totalité du profit théorique d'un aller-retour. C'est pourquoi la distinction maker/taker n'est pas une comptabilité académique ; c'est la différence entre un spread que vous gagnez et un spread que vous payez.",
      "La stratégie en découle directement. Une stratégie de capture de spread, ce qu'exécute ce bot, veut être un maker aussi souvent que possible, elle est donc maker-first : elle pose son offre au meilleur cours acheteur ou vendeur et laisse les contreparties venir la croiser, transformant le spread d'un coût en une source d'edge. Elle ne croise en tant que taker que lorsqu'une exécution immédiate compte véritablement plus que le spread, par exemple pour sortir d'une position qui a atteint son stop. Une stratégie de momentum ou pilotée par l'actualité fait le compromis inverse, acceptant le coût du spread du taker pour se garantir d'être sur le marché avant que le mouvement ne se poursuive. Aucun des deux rôles n'est universellement meilleur ; le bon dépend de savoir si la certitude d'exécution ou l'amélioration de prix vaut davantage pour le trade que vous avez devant vous.",
    ],
    example:
      "Le carnet XLM/USDC affiche un meilleur cours acheteur de 0,1170 et un meilleur cours vendeur de 0,1180, soit un spread de 10 points de base. En agissant comme taker pour acheter maintenant, vous prenez le cours vendeur et payez 0,1180. En agissant comme maker, vous posez plutôt une offre d'achat à 0,1170, rejoignant la file acheteuse derrière les offres plus anciennes qui s'y trouvent. Lorsqu'un vendeur croise plus tard jusqu'à 0,1170, votre offre est exécutée à 0,1170 lors de cette clôture de ledger. Même actif, même instant : le taker a payé 0,0010 par XLM de spread tandis que le maker l'a capté, un écart correspondant au spread complet de 10 points de base entre les deux rôles sur une seule exécution.",
  },
  {
    id: "c12-l7",
    title: "L'impact de prix et comment le calculer pour un ordre de grande taille",
    paragraphs: [
      "L'impact de prix est ce qui se produit lorsque votre ordre est plus grand que la liquidité présente au meilleur prix. Sur le SDEX, le carnet d'ordres est une pile d'offres au repos discrètes à des prix croissants (ou décroissants). Un petit ordre taker s'exécute entièrement contre le niveau supérieur et se réalise près du prix affiché. Un gros ordre taker épuise le niveau supérieur, puis s'exécute au niveau suivant à un prix moins favorable, puis au niveau d'après, remontant le carnet jusqu'à ce que la quantité entière soit exécutée. Votre prix d'exécution moyen est donc moins bon que le prix que vous aviez vu affiché, et l'écart entre les deux est l'impact de prix de votre ordre.",
      "Vous pouvez estimer l'impact avant de trader, directement à partir de la profondeur affichée, car le carnet vous indique exactement quelle taille repose à chaque niveau. Parcourez les niveaux dans l'ordre, en remplissant votre quantité de façon gloutonne : prenez tout au meilleur prix, puis ce dont vous avez encore besoin au prix suivant, et ainsi de suite jusqu'à épuisement de votre ordre. Multipliez la quantité prise à chaque niveau par le prix de ce niveau, additionnez ces produits, et divisez par votre quantité totale pour obtenir votre prix d'exécution moyen pondéré par le volume. Comparez cette moyenne au cours du meilleur prix dont vous êtes parti, et la différence, exprimée en pourcentage, est votre impact de prix estimé. Plus le carnet est profond près du sommet, plus l'impact est faible pour une même taille d'ordre ; un carnet mince signifie que même un ordre modeste parcourt plusieurs niveaux.",
      "L'impact de prix, le slippage et la liquidité sont trois façons de voir une même chose sous-jacente, et il vaut la peine d'être précis sur la manière dont ils sont liés. Le slippage, abordé dans « Comprendre les prix » (chapitre 2), est la différence entre le prix que vous attendiez et le prix que vous avez réellement obtenu ; l'impact de prix est la composante précise du slippage que votre propre ordre provoque en consommant la profondeur, par opposition au slippage dû au marché qui bouge entre le cours et l'exécution. La liquidité est simplement la quantité de profondeur empilée près du sommet du carnet : une liquidité profonde absorbe un gros ordre avec peu d'impact, une liquidité mince non. « Évaluation des tokens sur la chaîne Stellar » (chapitre 21) explique comment l'application additionne la profondeur du carnet d'ordres pour former les signaux de liquidité sur lesquels elle note les tokens ; cette profondeur additionnée est exactement la même échelle que vous parcourez pour estimer l'impact ici.",
      "Pour un ordre de grande taille, la réponse pratique consiste à réduire l'impact plutôt qu'à l'accepter. Découper un gros ordre en morceaux plus petits dans le temps permet à chaque morceau de s'exécuter plus près du sommet d'un carnet qui se reconstitue, au lieu de creuser un unique trou profond d'un seul coup. Poser l'ordre en tant que maker à un prix limite, plutôt que de croiser en tant que taker, évite entièrement de parcourir le carnet, au prix de la certitude d'exécution. Et la tolérance au slippage modifiable dans le formulaire de trading manuel de l'application est votre garde-fou : elle plafonne l'écart possible entre l'exécution et le cours, si bien qu'un ordre dont l'impact estimé dépasse votre tolérance est rejeté avant de s'exécuter à un prix que vous n'aviez jamais voulu.",
    ],
    example:
      "Vous voulez acheter 5 000 XLM en tant que taker. L'échelle des cours vendeurs côté USDC affiche 2 000 XLM proposés à 0,1180, 2 000 de plus à 0,1185, et 3 000 à 0,1195. Votre ordre exécute 2 000 à 0,1180, 2 000 à 0,1185, et les 1 000 derniers à 0,1195, pour un coût de 236,0 + 237,0 + 119,5 = 592,5 USDC. Divisez par 5 000 et votre prix d'exécution moyen est de 0,1185, contre les 0,1180 que vous voyiez affichés au sommet. Cela représente un impact de prix de 0,42 pour cent, entièrement provoqué par votre ordre parcourant le carnet. Le découper en cinq ordres de 1 000 XLM, ou poser une offre à cours limité à 0,1180, réduirait chacun cet impact.",
  },
];

export const c12ExtraQuiz: QuizQuestion[] = [
  {
    id: "c12-q6",
    prompt: "Dans le carnet d'ordres du SDEX, qu'est-ce qui distingue un maker d'un taker, et pourquoi ce bot préfère-t-il être un maker ?",
    options: [
      {
        text: "Un maker pose une offre sur le carnet et, quand quelqu'un vient la croiser, est exécuté à son propre prix et capte le spread ; un taker croise le carnet pour une exécution immédiate et paie le spread. Le bot est maker-first afin de gagner le spread au lieu de le payer.",
        explanation:
          "Correct. Sous la priorité prix puis temps, une offre maker au repos est exécutée à son prix affiché, transformant le spread en edge gagné, tandis qu'un taker prend le côté opposé et concède le spread pour la certitude d'exécution. Une stratégie de capture de spread pose donc ses offres maker-first et ne prend qu'en tant que taker lorsqu'une exécution immédiate compte plus que le spread.",
      },
      {
        text: "Un maker verse une commission en pourcentage à la bourse tandis qu'un taker trade gratuitement, de sorte que le bot évite d'être un maker pour esquiver les frais.",
        explanation:
          "Incorrect. Le SDEX ne facture aucune commission en pourcentage à l'une ou l'autre des faces, seulement le minuscule frais de base par opération ; la vraie différence est que le taker croise et paie le spread tandis que le maker repose et le capte, ce qui est précisément pourquoi le bot préfère être un maker.",
      },
      {
        text: "Un taker repose sur le carnet et attend tandis qu'un maker croise immédiatement, et le bot préfère le rôle de taker parce que les ordres au repos ne s'exécutent jamais.",
        explanation:
          "Incorrect. Les rôles sont inversés : le maker est celui qui repose et attend, le taker est celui qui croise immédiatement. Les ordres maker au repos s'exécutent bel et bien lorsqu'une contrepartie vient les croiser, et le bot est maker-first précisément pour capter le spread sur ces exécutions.",
      },
      {
        text: "Un maker s'exécute toujours plus vite qu'un taker parce que les offres les plus récentes sont appariées en premier, de sorte que le bot choisit maker pour la vitesse.",
        explanation:
          "Incorrect. L'appariement se fait de la plus ancienne à la plus récente à un prix donné, et non de la plus récente en premier, et le taker est le rôle bénéficiant d'une exécution immédiate garantie. Le bot préfère maker pour la capture de spread, en acceptant des exécutions plus lentes et incertaines, non pour la vitesse.",
      },
    ],
    correctIndex: 0,
  },
  {
    id: "c12-q7",
    prompt: "Une échelle de cours vendeurs affiche 2 000 XLM proposés à 0,1180, puis 2 000 à 0,1185, puis 3 000 à 0,1195. Vous envoyez un achat taker de 5 000 XLM. Comment estimez-vous l'impact de prix, et quel est-il ?",
    options: [
      {
        text: "Supposer que l'ordre entier s'exécute au prix le plus haut de 0,1180, de sorte que l'impact de prix est nul.",
        explanation:
          "Incorrect. Seuls 2 000 XLM reposent à 0,1180. Un ordre de 5 000 XLM épuise ce niveau et remonte vers des niveaux moins favorables, donc le prix d'exécution moyen est supérieur à 0,1180 et l'impact n'est pas nul.",
      },
      {
        text: "Parcourir l'échelle de façon gloutonne, prendre 2 000 à 0,1180, 2 000 à 0,1185, et 1 000 à 0,1195, ce qui donne une moyenne pondérée par le volume de 0,1185, soit environ 0,42 pour cent de moins que le cours de 0,1180.",
        explanation:
          "Correct. Exécuter l'ordre à travers les niveaux coûte 236,0 + 237,0 + 119,5 = 592,5 USDC pour 5 000 XLM, soit une moyenne de 0,1185. Face au cours de sommet de carnet de 0,1180, cela représente à peu près un impact de prix de 0,42 pour cent, le coût de votre propre ordre consommant la profondeur à mesure qu'il parcourt le carnet.",
      },
      {
        text: "Utiliser uniquement le niveau le plus profond, 0,1195, comme prix d'exécution, ce qui donne un impact d'environ 1,3 pour cent pour l'ensemble des 5 000 XLM.",
        explanation:
          "Incorrect. L'ordre ne s'exécute pas entièrement au niveau le moins favorable ; il s'exécute à chaque niveau tour à tour jusqu'à épuisement, il faut donc pondérer par le volume à travers 0,1180, 0,1185 et 0,1195. Cela donne une moyenne de 0,1185 et environ 0,42 pour cent d'impact, et non 1,3 pour cent.",
      },
    ],
    correctIndex: 1,
  },
];
