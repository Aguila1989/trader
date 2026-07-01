// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../../types";

export const chapter24: Chapter & { whoFor: string } = {
  id: "c24",
  number: 24,
  level: "BASIC",
  whoFor: "Pour quiconque souhaite un port d'attache sûr pour son argent",
  title: "Les stablecoins et l'USDC",
  description:
    "Ce qu'est un stablecoin, ce qu'est l'USDC et qui le garantit, pourquoi il constitue une base stable pour votre portefeuille, les risques réels, et comment l'utiliser dans cette application.",
  lessons: [
    {
      id: "c24-l1",
      title: "Qu'est-ce qu'un stablecoin ?",
      paragraphs: [
        "Un stablecoin est un token conçu pour conserver une valeur stable au lieu de monter et descendre sans cesse. La plupart d'entre eux visent à correspondre à une monnaie ordinaire, un pour un, de sorte qu'un token soit toujours censé valoir un dollar ou un euro. Cette valeur cible s'appelle l'ancrage (peg), et tenir cet ancrage est la raison d'être même de la pièce.",
        "Une crypto classique comme le XLM peut bondir ou chuter fortement en une seule journée, ce qui est stimulant mais stressant si vous voulez simplement que votre argent reste tranquille. Un stablecoin vous offre la commodité de détenir de la valeur sur la blockchain, où vous pouvez l'envoyer et la trader instantanément, tout en gardant un prix ennuyeux et prévisible.",
        "Voyez un stablecoin comme une version numérique d'une monnaie que vous connaissez déjà. Il circule à la vitesse du réseau et vit dans votre portefeuille crypto, mais sa valeur est censée rester la même que celle de l'argent quotidien qu'il suit.",
      ],
      example:
        "Imaginez un euro numérique : exactement la même valeur qu'un euro sur votre compte en banque, un pour un, mais qui vit sur la blockchain plutôt que sur un compte bancaire. Vous pourriez l'envoyer à l'autre bout du monde en quelques secondes, et l'un de ces euros numériques vaudrait toujours un euro réel. Cette valeur stable, un pour un, c'est l'ancrage, et une pièce construite pour la tenir est un stablecoin.",
    },
    {
      id: "c24-l2",
      title: "Qu'est-ce que l'USDC et qui se porte garant ?",
      paragraphs: [
        "L'USDC est l'un des stablecoins les plus utilisés, et il vise à toujours valoir un dollar américain. Il est émis par une entreprise appelée Circle, ce qui signifie que Circle est la partie qui crée de nouveaux USDC et qui promet d'honorer chaque token comme valant un dollar. Sur le réseau Stellar, l'USDC est un token que vous pouvez détenir, envoyer et trader comme n'importe quel autre.",
        "Cette promesse ne fonctionne que si les dollars existent réellement. Pour chaque USDC en circulation, Circle affirme détenir un montant équivalent en réserves sûres, comme de véritables dollars américains et des obligations d'État à court terme. Si vous rendiez un jour vos USDC, vous devriez pouvoir obtenir un dollar réel en échange, et c'est cette garantie qui maintient la valeur stable.",
        "Faire confiance à l'USDC revient donc en réalité à faire confiance à Circle pour conserver suffisamment de réserves et pour être honnête à leur sujet. Ceci n'est pas un conseil financier, et aucune réserve n'est sans risque, mais l'idée de base est simple : le token est une créance sur un dollar réel déposé quelque part en sûreté.",
      ],
      example:
        "Imaginez un vestiaire. Vous confiez votre manteau et recevez un ticket numéroté. Le ticket n'est pas le manteau, mais tout le monde le traite comme valant exactement un manteau, parce que vous faites confiance au vestiaire pour rendre le manteau. L'USDC est ce ticket, Circle tient le vestiaire, et les réserves sont les manteaux dans l'arrière-salle. Tant qu'il y a un dollar réel pour chaque ticket, le ticket conserve sa valeur.",
    },
    {
      id: "c24-l3",
      title: "Pourquoi utiliser l'USDC comme monnaie de base de votre portefeuille ?",
      paragraphs: [
        "Lorsque vous détenez plusieurs pièces dont les prix bougent tous en même temps, il est difficile de savoir si vous vous en sortez vraiment bien. Un stablecoin résout ce problème en vous offrant un étalon stable. Comme l'USDC reste proche d'un dollar, tout mesurer par rapport à lui montre clairement vos gains et vos pertes réels, au lieu de deviner pendant que chaque prix vacille.",
        "L'USDC est aussi un endroit où mettre de la valeur à l'abri sans quitter la crypto. Si vous vendez une pièce et transférez le produit en USDC, votre argent échappe aux variations du marché tout en restant dans votre portefeuille, prêt à trader de nouveau en quelques secondes. Vous n'avez pas à retirer vers une banque et à attendre pour revenir.",
        "Dans cette application, l'USDC est la monnaie de base principale, si bien que la plupart des achats et des ventes sont mesurés et cotés par rapport à lui. Cela en fait le port d'attache naturel où vous revenez entre les trades, et un point de référence net pour lire l'évolution de votre portefeuille.",
      ],
      example:
        "Voyez l'USDC comme la base dans une partie de chat. Vous vous élancez pour faire un coup, un trade en l'occurrence, puis vous pouvez foncer revenir à la base, où vous êtes en sécurité et pouvez reprendre votre souffle. Comme la base ne bouge jamais, vous savez toujours exactement quelle distance vous avez parcourue, et c'est pourquoi détenir de la valeur en USDC rend vos gains et vos pertes faciles à lire.",
    },
    {
      id: "c24-l4",
      title: "Les stablecoins sont-ils toujours stables ? Les risques expliqués",
      paragraphs: [
        "Le mot stable est un objectif, pas une garantie. Un stablecoin peut perdre son ancrage et se trader pour moins que le dollar auquel il est censé correspondre, et cela s'appelle un décrochage (depeg). Cela peut durer quelques heures ou, dans les pires cas, ne jamais totalement se rétablir. La stabilité dépend entièrement de la solidité effective de la promesse qui soutient la pièce.",
        "La principale inquiétude porte sur la confiance dans l'émetteur et dans les réserves. Si les gens craignent que l'entreprise ne détienne pas vraiment suffisamment d'actifs sûrs, ou ne puisse pas y accéder, ils se précipitent pour vendre, et le prix glisse sous un dollar. Un décrochage est généralement une crise de confiance : dès que les détenteurs doutent de la garantie, la vente même provoquée par ce doute fait encore baisser le prix.",
        "Cela ne veut pas dire que les stablecoins sont mauvais, seulement qu'aucun token n'est totalement sans risque. Il vaut la peine de savoir qui émet une pièce et comment elle est garantie avant de lui faire confiance comme base. Ceci est purement éducatif et n'est pas un conseil financier.",
      ],
      example:
        "En 2022, un stablecoin appelé UST, qui reposait sur un logiciel astucieux plutôt que sur de vrais dollars en réserve, a perdu son ancrage et s'est effondré d'un dollar à quelques centimes en quelques jours, anéantissant d'énormes quantités de valeur. C'est un décrochage dans sa forme la plus sévère. C'est le rappel le plus net que stable est une cible que la pièce tente de tenir, pas une loi de la nature, et que la garantie qui soutient une pièce compte réellement.",
    },
    {
      id: "c24-l5",
      title: "Comment utiliser l'USDC dans cette application pour les swaps et les trades",
      paragraphs: [
        "Avant de pouvoir détenir de l'USDC sur Stellar, il vous faut une ligne de confiance vers Circle, l'émetteur. Une ligne de confiance est une petite adhésion volontaire qui indique au réseau que vous acceptez de détenir ce token précis ; elle coûte une minuscule réserve de XLM et ne doit être établie qu'une seule fois par token. Cette application peut vous guider pour l'ajouter, et tant qu'elle n'existe pas, votre portefeuille ne peut tout simplement pas recevoir d'USDC.",
        "Une fois que vous détenez des USDC, vous les utilisez via le formulaire VOUS VENDEZ et VOUS ACHETEZ de l'onglet Trading manuel. Pour acheter une pièce, vous placez l'USDC du côté VOUS VENDEZ et la pièce voulue du côté VOUS ACHETEZ ; pour revenir en sécurité, vous faites l'inverse et vous retrouvez à détenir de l'USDC. Vous pouvez trader au prix du marché actuel ou fixer un prix limite, et ajuster votre tolérance au slippage pour qu'un marché qui bouge vite n'exécute pas votre ordre à un taux surprise.",
        "Comme l'USDC est la monnaie de base de l'application, la plupart des swaps passent naturellement vers lui ou depuis lui, ce qui en fait la pièce dans laquelle vous restez entre les trades. Si vous souhaitez une explication plus approfondie du formulaire d'achat et de vente et du slippage, les chapitres sur le trading manuel le détaillent étape par étape.",
      ],
      example:
        "Supposons que vous déteniez 100 USDC et vouliez des XLM. Vous ouvrez le formulaire VOUS VENDEZ et VOUS ACHETEZ, placez l'USDC du côté vente et le XLM du côté achat, vérifiez la tolérance au slippage, et confirmez. Plus tard, pour sécuriser vos gains et vous reposer, vous utilisez le même formulaire dans l'autre sens, en revendant du XLM vers de l'USDC. Votre valeur est de retour au port dans la pièce de base stable, prête pour le prochain mouvement dès que vous déciderez de le faire.",
    },
  ],
  quiz: [
    {
      id: "c24-q1",
      prompt: "Qu'est-ce qui décrit le mieux un stablecoin ?",
      options: [
        {
          text: "Un token conçu pour conserver une valeur stable, correspondant généralement à une monnaie un pour un.",
          explanation:
            "Correct. La raison d'être d'un stablecoin est de rester stable, généralement ancré à un dollar ou un euro, de sorte qu'il se comporte comme une version numérique de l'argent ordinaire.",
        },
        {
          text: "Une pièce dont le prix est censé grimper le plus vite possible.",
          explanation:
            "Non. Cela décrit un actif spéculatif. Un stablecoin est l'inverse : il vise à rester ennuyeux et inchangé, et non à s'envoler.",
        },
        {
          text: "Le coin natif qui paie les frais de réseau de Stellar.",
          explanation:
            "C'est le XLM, pas un stablecoin. Le prix du XLM bouge librement, alors qu'un stablecoin est construit pour tenir une valeur fixe.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c24-q2",
      prompt: "Qui émet l'USDC et par quoi est-il censé être garanti ?",
      options: [
        {
          text: "Personne ne l'émet ; sa valeur provient uniquement de l'offre et de la demande.",
          explanation:
            "Non. L'USDC n'est pas garanti par les seules forces du marché. Une entreprise précise l'émet et promet de véritables réserves derrière chaque token.",
        },
        {
          text: "Le réseau Stellar lui-même le crée et garantit sa valeur en dollars.",
          explanation:
            "Pas tout à fait. Stellar n'est que le réseau sur lequel vit l'USDC. Le réseau ne l'émet pas et ne détient pas les réserves.",
        },
        {
          text: "Circle l'émet, et chaque token est censé être garanti par de vrais dollars et des réserves sûres.",
          explanation:
            "Correct. Circle crée l'USDC et affirme détenir une valeur équivalente en actifs sûrs, de sorte que chaque token est une créance sur un dollar réel. Faire confiance à l'USDC, c'est faire confiance à cette garantie.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c24-q3",
      prompt: "Pourquoi l'USDC fait-il une bonne monnaie de base pour mesurer votre portefeuille ?",
      options: [
        {
          text: "Parce que son prix monte régulièrement, si bien que vos avoirs augmentent toujours.",
          explanation:
            "Non. L'USDC n'est pas conçu pour monter du tout ; il reste proche d'un dollar. Son utilité vient de sa stabilité, pas de sa croissance.",
        },
        {
          text: "Parce qu'il reste proche d'un dollar, vous offrant un étalon stable et un endroit où mettre de la valeur à l'abri sans quitter la crypto.",
          explanation:
            "Correct. Une valeur stable vous permet de lire clairement vos gains et vos pertes et de rester à l'écart des variations du marché tout en gardant vos fonds dans votre portefeuille. Dans cette application, l'USDC est la monnaie de base principale.",
        },
        {
          text: "Parce qu'il ne peut jamais perdre de valeur en aucune circonstance.",
          explanation:
            "Faux. Même un stablecoin peut glisser de son ancrage. Sa valeur est stable en tant qu'objectif, pas en tant que garantie absolue.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c24-q4",
      prompt: "Que signifie un décrochage lorsqu'il touche un stablecoin ?",
      options: [
        {
          text: "Il devient définitivement plus précieux qu'un dollar.",
          explanation:
            "Non. Un décrochage n'est pas une amélioration. Cela signifie que la pièce s'est éloignée de sa valeur cible, généralement vers le bas, et qu'elle peut ne pas se rétablir totalement.",
        },
        {
          text: "Il s'éloigne de sa valeur cible et ne correspond plus au dollar qu'il est censé suivre.",
          explanation:
            "Correct. Un décrochage, c'est lorsqu'un stablecoin perd son ancrage, souvent parce que les détenteurs perdent confiance dans l'émetteur ou dans les réserves et se précipitent pour vendre, faisant tomber le prix sous un dollar.",
        },
        {
          text: "Il est automatiquement converti en XLM par le réseau.",
          explanation:
            "Non. Rien ne convertit la pièce en XLM. Un décrochage est simplement le prix qui ne parvient pas à tenir sa valeur cible d'un pour un.",
        },
        {
          text: "La ligne de confiance vers l'émetteur est fermée par l'application.",
          explanation:
            "Non. Un décrochage concerne le prix, pas les lignes de confiance, et cette application n'ajoute ni ne retire jamais une ligne de confiance de sa propre initiative. Un décrochage peut survenir alors que votre ligne de confiance reste parfaitement ouverte.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
