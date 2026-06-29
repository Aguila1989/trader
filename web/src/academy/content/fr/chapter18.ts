import type { Chapter } from "../../types";

export const chapter18: Chapter = {
  id: "c18",
  number: 18,
  level: "ADVANCED",
  title: "Importer un portefeuille et comprendre les paires de clés",
  description:
    "Comment une paire de clés Stellar est générée, ce qui se passe réellement quand vous importez un portefeuille, comment cette application chiffre votre clé secrète au repos, comment fonctionne le financement sur testnet, et les risques de remplacer votre portefeuille.",
  lessons: [
    {
      id: "c18-l1",
      title: "Qu'est-ce qu'une paire de clés Stellar et comment est-elle générée ?",
      paragraphs: [
        "Une paire de clés Stellar, ce sont la clé publique et la clé secrète qui vont ensemble, générées comme une paire assortie. Stellar utilise un schéma de signature appelé ed25519, une forme moderne de cryptographie à clé publique qui est rapide, compacte et largement éprouvée. La paire est liée mathématiquement : la clé publique peut toujours être dérivée de la clé secrète, mais jamais l'inverse.",
        "Tout commence par une graine (seed) — une valeur aléatoire de 32 octets. La qualité de cet aléa est primordiale : si la graine est vraiment imprévisible, la clé qui en résulte ne peut être devinée, même par un attaquant doté d'une énorme puissance de calcul. La graine passe par ed25519 pour produire la clé secrète, et la clé secrète passe par les mêmes calculs pour produire la clé publique correspondante.",
        "Stellar encode ensuite les deux moitiés pour qu'on les distingue facilement. La clé publique est encodée pour commencer par la lettre G (c'est l'adresse de votre compte), et la clé secrète commence par la lettre S. Mêmes calculs sous-jacents, deux formes lisibles par un humain — l'une sûre à partager, l'autre à protéger.",
      ],
      example:
        "Générer une paire de clés, c'est comme lancer 32 fois un dé équilibré à 256 faces pour obtenir une graine secrète que personne ne pourrait prédire, puis la passer dans une machine à sens unique qui imprime deux étiquettes : une adresse G... que vous pouvez distribuer, et un secret S... que vous seul gardez. Comme la machine ne fonctionne que dans un sens, personne ne peut lire les étiquettes à l'envers pour retrouver votre graine.",
    },
    {
      id: "c18-l2",
      title: "Que se passe-t-il quand vous importez un portefeuille existant ?",
      paragraphs: [
        "Importer un portefeuille, c'est indiquer à l'application un compte que vous possédez déjà, plutôt que d'en créer un nouveau. Vous fournissez votre clé secrète existante (la valeur S...). À partir d'elle, l'application dérive la clé publique correspondante — l'adresse G... — avec les mêmes calculs ed25519, de sorte qu'elle apprend votre adresse sans que vous la tapiez jamais.",
        "Une fois l'adresse en main, l'application recherche le compte sur Horizon, la passerelle de Stellar vers le réseau, pour confirmer son existence et lire ses soldes actuels. C'est pourquoi, juste après l'import, vous voyez apparaître vos vrais soldes en XLM et en tokens : l'application les lit directement dans le registre public, elle ne les invente pas.",
        "Point essentiel : l'import ne déplace ni ne copie aucun coin. C'est le même compte qu'il a toujours été, vivant à la même adresse sur le même réseau ; vous l'avez simplement rendu utilisable depuis cette application. Rien n'est transféré, et le compte se comporte de façon identique que vous l'atteigniez d'ici ou depuis n'importe quel autre portefeuille Stellar.",
      ],
      example:
        "Vous collez une clé secrète S... dans l'écran d'import. L'application dérive l'adresse G..., interroge Horizon et affiche « Solde : 250 XLM, 40 USDC ». Ces fonds ne sont pas arrivés à cause de l'import — ils étaient depuis toujours à cette adresse. L'import a juste relié cette application au compte que vous contrôliez déjà.",
    },
    {
      id: "c18-l3",
      title: "Qu'est-ce que le chiffrement AES-256-GCM et comment cette application protège-t-elle votre clé secrète au repos ?",
      paragraphs: [
        "AES-256-GCM est une forme de chiffrement symétrique authentifié. « Symétrique » signifie que la même clé verrouille et déverrouille les données ; « 256 » renvoie à la taille de la clé, bien au-delà de ce qu'un ordinateur peut casser par force brute ; et « GCM » ajoute une étiquette d'authentification qui détecte toute altération, si bien qu'un texte chiffré modifié est rejeté plutôt que déchiffré en silence en données illisibles.",
        "Cette application l'utilise pour protéger votre clé secrète au repos — c'est-à-dire pendant qu'elle est stockée dans la base de données. Votre secret est chiffré avec une clé côté serveur dérivée pour chaque utilisateur, et seul le texte chiffré résultant est stocké. La clé secrète en clair n'est jamais écrite sur le disque ni renvoyée à votre navigateur, donc une copie volée de la base de données ne livre qu'un texte chiffré illisible.",
        "Le secret en clair n'existe que brièvement dans la mémoire du serveur, au moment précis où une transaction doit être signée, et il est aussitôt jeté. C'est pourquoi la signature a lieu sur le serveur et que la clé n'atteint jamais le front-end : le navigateur est considéré comme non fiable, et le secret non chiffré est gardé aussi éphémère et confiné que possible.",
      ],
      example:
        "Supposons qu'un attaquant vole une copie de la base de données. Pour votre portefeuille, il trouve un bloc comme « 9f3a...c1 » — le texte chiffré AES-256-GCM — et rien d'autre. Sans la clé côté serveur propre à chaque utilisateur, il ne peut être déchiffré, et l'étiquette GCM fait qu'il ne peut même pas être altéré utilement. La clé secrète elle-même n'a jamais été stockée sous une forme lisible qu'il aurait pu trouver.",
    },
    {
      id: "c18-l4",
      title: "Qu'est-ce que Friendbot et comment fonctionne le financement sur testnet ?",
      paragraphs: [
        "Stellar fait tourner un réseau d'entraînement distinct appelé testnet, où les coins n'ont aucune valeur réelle et n'existent que pour que développeurs et apprenants puissent expérimenter en toute sécurité. Pour faciliter cela, le testnet dispose d'un robinet appelé Friendbot : interrogez-le sur une nouvelle adresse et il crée le compte et le finance avec des XLM de test gratuits.",
        "Cette étape de financement compte parce que, sur Stellar, une adresse n'est un vrai compte que lorsqu'elle détient un solde minimum — la réserve de base. Friendbot s'en charge pour vous sur testnet, transformant une paire de clés fraîchement générée en un compte vivant et utilisable en un clic, avec des XLM de test pour jouer.",
        "Le mainnet — le vrai réseau — n'a pas de Friendbot, et c'est tout l'intérêt. Sur mainnet, vous devez financer vous-même un nouveau compte avec de vrais XLM pour atteindre la réserve de base avant qu'il ne devienne actif. Les coins de test ne peuvent jamais passer sur mainnet, donc s'entraîner sur testnet ne coûte rien et ne risque rien, tandis qu'un vrai compte démarre toujours avec de l'argent réel que vous fournissez.",
      ],
      example:
        "Sur testnet, vous générez une adresse G... toute neuve et cliquez sur « Financer avec Friendbot ». Quelques secondes plus tard, le compte existe avec 10 000 XLM de test — parfait pour s'entraîner. Essayez la même chose sur mainnet et il n'y a pas de bouton Friendbot : le compte reste inactif jusqu'à ce que vous lui envoyiez de vrais XLM depuis un autre portefeuille pour couvrir la réserve de base.",
    },
    {
      id: "c18-l5",
      title: "Quels sont les risques de remplacer votre portefeuille dans l'application ?",
      paragraphs: [
        "L'application ne garde qu'un seul portefeuille actif à la fois, donc en importer un nouveau remplace l'ancien au lieu de conserver les deux. Comme c'est une action sensible, elle exige votre mot de passe — une protection volontaire pour qu'un instant d'inattention ou un attaquant devant votre écran déverrouillé ne puisse pas remplacer en silence le portefeuille avec lequel le bot trade.",
        "Remplacer le portefeuille affecte aussi le travail déjà en cours. Les ordres ouverts et les stop loss actifs sont liés au portefeuille qui les a créés ; lorsque vous changez de portefeuille, ils sont annulés, car ils ne correspondent plus au compte désormais aux commandes. Planifiez le changement pour un moment où laisser des positions sans surveillance est acceptable.",
        "Le risque le plus profond est de votre côté, pas de celui de l'application. Si vous remplacez un portefeuille sans avoir conservé en sécurité l'ancienne clé secrète, vous perdez l'accès à ce compte et aux fonds qu'il détient — l'application ne peut pas récupérer un secret qu'elle ne stocke jamais sous forme lisible. Avant de remplacer, assurez-vous que l'ancienne clé secrète est sauvegardée hors ligne, exactement comme le décrivait le chapitre précédent.",
      ],
      example:
        "Vous importez le portefeuille B pour remplacer le portefeuille A. L'application demande votre mot de passe, puis annule les deux stop loss ouverts de A et bascule. Plus tard, vous voulez déplacer les fonds restants de A — mais vous n'avez jamais noté la clé secrète de A, et l'application ne la stockait que chiffrée et l'a désormais remplacée. Ces fonds sont bloqués, non à cause d'un bug, mais parce que l'unique clé qui pouvait les atteindre a disparu.",
    },
  ],
  quiz: [
    {
      id: "c18-q1",
      prompt: "Comment une paire de clés Stellar est-elle reliée, et quelle clé commence par quelle lettre ?",
      options: [
        {
          text: "C'est une paire ed25519 dérivée d'une graine aléatoire ; la clé publique commence par G et la clé secrète par S, et la publique peut être dérivée de la secrète mais pas l'inverse.",
          explanation:
            "Correct. ed25519 relie la paire dans un seul sens : la clé publique (G...) provient de la clé secrète (S...), qui provient d'une graine aléatoire — et les calculs ne peuvent pas se faire à l'envers.",
        },
        {
          text: "Ce sont deux valeurs aléatoires sans rapport, l'une commençant par G et l'autre par S.",
          explanation:
            "Non. Les clés sont liées mathématiquement, pas indépendantes — la clé publique est dérivée de la clé secrète.",
        },
        {
          text: "La clé secrète commence par G et la clé publique par S.",
          explanation:
            "Non. C'est l'inverse : G est l'adresse publique, S est la clé secrète.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q2",
      prompt: "Quand vous importez un portefeuille en saisissant votre clé secrète, qu'arrive-t-il à vos coins ?",
      options: [
        {
          text: "Rien ne bouge — l'application dérive votre clé publique, lit le compte sur Horizon et affiche des soldes qui étaient là depuis toujours.",
          explanation:
            "Correct. L'import ne fait que relier l'application à un compte que vous contrôlez déjà. Elle dérive l'adresse G... et lit les soldes existants ; aucun coin n'est transféré.",
        },
        {
          text: "Vos coins sont déplacés vers un nouveau compte créé par l'application.",
          explanation:
            "Non. L'import ne déplace ni ne crée de fonds. C'est le même compte à la même adresse, désormais utilisable ici.",
        },
        {
          text: "L'application copie vos coins pour qu'ils existent à deux endroits à la fois.",
          explanation:
            "Non. Les coins ne sont pas copiés. Il y a un seul compte dans le registre ; l'import permet juste à cette application de le lire et de l'utiliser.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q3",
      prompt: "Comment cette application protège-t-elle votre clé secrète au repos avec AES-256-GCM ?",
      options: [
        {
          text: "Elle ne stocke que le texte chiffré, ne déchiffre le secret qu'en mémoire au moment de signer, et ne le renvoie jamais au navigateur.",
          explanation:
            "Correct. Le secret est chiffré avec une clé côté serveur propre à chaque utilisateur ; seul le texte chiffré est stocké, la clé en clair vit brièvement en mémoire pour signer, et le navigateur ne la voit jamais.",
        },
        {
          text: "Elle stocke votre clé secrète en clair mais derrière une connexion.",
          explanation:
            "Non. Le secret n'est jamais stocké en clair. Une simple connexion ne protégerait pas une copie volée de la base de données — le chiffrement, lui, le fait.",
        },
        {
          text: "Elle envoie la clé secrète à votre navigateur, qui la chiffre localement.",
          explanation:
            "Non. Le secret n'atteint jamais le navigateur. La signature a lieu côté serveur précisément pour que la clé en clair reste hors du front-end non fiable.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q4",
      prompt: "Qu'est-ce qui est vrai à propos de Friendbot et du financement des comptes ?",
      options: [
        {
          text: "Friendbot est un robinet présent uniquement sur testnet qui crée et finance un compte avec des XLM de test gratuits ; sur mainnet, vous devez financer avec de vrais XLM pour atteindre la réserve de base.",
          explanation:
            "Correct. Friendbot n'existe que sur testnet pour s'entraîner sans risque. Le mainnet n'a pas de robinet, donc un vrai compte doit être financé avec de vrais XLM pour couvrir la réserve de base.",
        },
        {
          text: "Friendbot finance votre compte mainnet avec de vrais XLM gratuitement.",
          explanation:
            "Non. Friendbot n'existe que sur testnet et ses coins n'ont aucune valeur réelle. Rien ne finance gratuitement un compte mainnet.",
        },
        {
          text: "Les XLM de test de Friendbot peuvent être déplacés sur mainnet et dépensés.",
          explanation:
            "Non. Testnet et mainnet sont des réseaux distincts ; les XLM de test ne peuvent pas passer et n'ont aucune valeur réelle.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
