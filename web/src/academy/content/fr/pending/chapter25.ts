// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Crypto et impôts : un chapitre BASIC en langage clair sur l'obligation ou non
// de déclarer vos cryptos, ce qui compte comme fait générateur d'impôt, comment
// tenir vos registres avec l'onglet Journaux de cette application, et ce que MiCA
// signifie pour vous en tant qu'utilisateur du quotidien. Rédigé selon la forme
// exacte de content/en/chapter22.ts, avec le whoFor propre au chapitre typé
// via une intersection locale afin que l'interface Chapter en production reste
// intacte jusqu'à l'intégration. Les nouveaux termes du glossaire BASIC introduits
// ici (fait generateur d'impot, MiCA, plus-value) vivent dans glossary.pending.ts,
// PAS dans le glossaire en production, et sont écrits verbatim dans le texte pour
// que la première occurrence s'associe automatiquement à une infobulle.
// À vocation pédagogique uniquement — ceci ne constitue pas un conseil fiscal, juridique ou financier.
import type { Chapter } from "../../../types";

export const chapter25: Chapter & { whoFor: string } = {
  id: "c25",
  number: 25,
  level: "BASIC",
  whoFor: "Pour les traders qui veulent rester en règle avec le fisc",
  title: "Crypto et impôts",
  description:
    "Devez-vous déclarer vos cryptos, qu'est-ce qui compte comme fait générateur d'impôt, comment tenir des registres propres avec cette application, et ce que MiCA signifie pour vous en tant qu'utilisateur.",
  lessons: [
    {
      id: "c25-l1",
      title: "Devez-vous déclarer vos cryptos au fisc ?",
      paragraphs: [
        "Dans la plupart des pays, la réponse honnête est oui. Les administrations fiscales traitent de plus en plus les cryptos comme n'importe quel autre actif : les plus-values, les revenus et certains échanges peuvent tous devoir figurer sur votre déclaration d'impôts. Les règles exactes varient énormément d'un pays à l'autre, et elles changent souvent, si bien que ce chapitre relève de la culture générale et non du conseil fiscal.",
        "Ce qui est imposable, quand ça l'est et combien vous devez dépend entièrement de l'endroit où vous vivez. Certains pays imposent chaque profit, d'autres seulement les gains au-delà d'un seuil, et quelques-uns n'imposent quasiment pas les cryptos détenues à titre privé. Comme les détails varient tellement, la seule habitude sûre est de vérifier les règles de votre propre pays ou de consulter un comptable qualifié avant de tenir quoi que ce soit pour acquis.",
        "La bonne nouvelle, c'est que déclarer ses cryptos est généralement simple dès lors que vous tenez des registres corrects. Les traders qui ont des ennuis sont rarement ceux qui ont déclaré avec soin ; ce sont ceux qui ont supposé que personne ne regardait et n'ont conservé aucun historique.",
      ],
      example:
        "Voyez les cryptos comme vous verriez un revenu d'appoint tiré de la location d'une chambre libre. Vous avez peut-être l'impression que c'est modeste et privé, mais le fisc veut généralement quand même en être informé. Les ignorer ne les fait pas disparaître ; cela transforme simplement un simple formulaire en un problème plus tard. Dans le doute, une brève discussion avec un comptable coûte bien moins cher qu'un redressement fiscal inattendu.",
    },
    {
      id: "c25-l2",
      title: "Qu'est-ce qu'un fait générateur d'impôt en crypto ?",
      paragraphs: [
        "Un fait générateur d'impôt est tout moment que le fisc peut considérer comme imposable. En crypto, les plus courants sont la vente d'un token contre de la monnaie classique, l'échange d'un token contre un autre, et la réception de crypto en paiement d'un travail ou d'un service. Chacun de ces cas peut créer quelque chose à déclarer, même l'échange où aucune monnaie ordinaire ne touche jamais votre compte bancaire.",
        "Le simple fait de détenir un token n'est généralement pas un fait générateur d'impôt. Si vous achetez des XLM ou des USDC et que vous les gardez simplement dans votre portefeuille, la plupart des régimes fiscaux vous laissent tranquille jusqu'à ce que vous vendiez, échangiez ou dépensiez réellement. L'impôt porte souvent sur votre plus-value — le profit entre ce que vous avez payé et ce que vous avez obtenu lorsque vous avez finalement cédé l'actif.",
        "C'est pourquoi un échange peut surprendre. Troquer un token contre un autre donne l'impression de simplement déplacer des choses à l'intérieur de son propre portefeuille, mais de nombreuses administrations fiscales y voient la vente du premier actif et l'achat du second : une plus-value sur le premier token peut donc être comptabilisée à cet instant précis. Les règles varient selon les pays, alors voyez-y une raison de tenir des registres, et non un verdict définitif pour votre situation.",
      ],
      example:
        "Imaginez que vous ayez acheté un timbre rare pour 50 USDC et que vous l'ayez ensuite échangé directement contre une pièce valant 90 USDC. Vous n'avez jamais reçu d'argent liquide, et pourtant vous vous êtes clairement séparé de quelque chose valant plus que ce que vous aviez payé. De nombreux régimes fiscaux considèrent un échange de crypto de la même manière : les 40 USDC de plus-value sont bien réels même si aucun argent n'a atterri sur votre compte, et ce moment est le fait générateur d'impôt.",
    },
    {
      id: "c25-l3",
      title: "Comment suivre vos transactions pour les impôts",
      paragraphs: [
        "Une bonne tenue de registres, c'est tout l'enjeu. Pour chaque trade, vous voulez généralement la date, les tokens concernés, les montants, le prix au moment de l'opération et les éventuels frais de réseau payés. Avec ces informations, votre comptable, ou votre logiciel fiscal, peut calculer vos plus-values sans deviner. Tenter de tout reconstituer de mémoire des mois plus tard est pénible et source d'erreurs.",
        "Cette application facilite la tâche plus que la plupart des autres. L'onglet Journaux comporte un sous-onglet Historique des trades qui enregistre votre activité, et son bouton d'export CSV vous permet de télécharger cet historique sous forme de fichier tableur que vous pouvez remettre à un comptable ou importer dans des outils fiscaux. Exporter un CSV propre une fois par an, ou même une fois par trimestre, est l'une des habitudes les plus simples à prendre.",
        "Comme les tokens sur Stellar peuvent circuler via le carnet d'ordres du SDEX et les pools de liquidité AMM, et comme les paiements par chemin sautent automatiquement de marché en marché, votre parcours peut comporter plusieurs petites étapes. Conserver les registres exportés vous permet de montrer exactement ce qui s'est passé sans avoir à expliquer toute la mécanique.",
      ],
      example:
        "Imaginez une boîte à chaussures dans laquelle vous glissez chaque reçu dès que vous le recevez. Au moment des impôts, vous la videz et tout est déjà là, daté et complet. L'onglet Journaux est votre boîte à chaussures : au lieu de griffonner vos trades sur des bouts de papier, vous appuyez sur l'export CSV et vous obtenez un fichier ordonné et daté de chaque transaction, prêt à être remis.",
    },
    {
      id: "c25-l4",
      title: "Qu'est-ce que MiCA et qu'est-ce que cela signifie pour vous en tant qu'utilisateur ?",
      paragraphs: [
        "MiCA signifie Markets in Crypto-Assets, le règlement de l'Union européenne pour les services de cryptos et les stablecoins. C'est une loi qui fixe des normes communes à tous les pays de l'UE, afin que les entreprises crypto, en particulier celles qui émettent des stablecoins comme l'USDC ou qui exploitent des plateformes d'échange, doivent suivre des règles plus claires plutôt que d'opérer dans une zone grise.",
        "Pour vous, en tant qu'utilisateur du quotidien, MiCA se traduit surtout par davantage de protection du consommateur et davantage de transparence. Les entreprises concernées font face à des exigences plus claires sur la façon dont elles fonctionnent, sur ce qu'elles doivent divulguer et sur la manière dont elles protègent vos fonds. L'objectif est que les services que vous utilisez soient un peu plus sûrs et un peu moins « Far West », et non que votre trading personnel devienne plus compliqué.",
        "MiCA concerne la façon dont les entreprises crypto sont régulées, ce qui n'est pas tout à fait la même chose que la manière dont vos gains personnels sont imposés ; ces règles fiscales relèvent toujours de votre propre pays. Cette leçon reste volontairement légère, et rien de tout cela ne constitue un conseil juridique. Si vous voulez le détail plus approfondi sur la réglementation, le chapitre Réglementation de niveau Expert va bien plus loin.",
      ],
      example:
        "Voyez MiCA comme les règles de sécurité et d'étiquetage des aliments dans un supermarché. Vous ne lisez pas vous-même les réglementations, mais parce qu'elles existent, les produits sur le rayon doivent respecter des normes de base et vous indiquer ce qu'ils contiennent. De la même manière, MiCA agit en arrière-plan pour que les services crypto que vous utilisez doivent respecter des règles communes, ce qui vous donne un peu plus de confiance dans ce que vous achetez.",
    },
  ],
  quiz: [
    {
      id: "c25-q1",
      prompt: "Dans la plupart des pays, devez-vous généralement déclarer votre activité crypto au fisc ?",
      options: [
        {
          text: "Non, les cryptos sont totalement privées et aucun pays ne pose jamais de questions à leur sujet.",
          explanation:
            "Faux. La plupart des administrations fiscales traitent désormais les cryptos comme les autres actifs et attendent que les plus-values ou les revenus soient déclarés. Supposer que personne ne regarde est exactement la façon dont les gens s'attirent des ennuis.",
        },
        {
          text: "Oui, dans la plupart des pays, même si les règles exactes varient — il est donc prudent de vérifier les règles locales ou de consulter un comptable.",
          explanation:
            "Correct. Déclarer ses cryptos est généralement obligatoire, mais les détails diffèrent selon les pays et changent souvent, si bien que vérifier ses propres règles ou consulter un comptable qualifié est l'habitude sûre.",
        },
        {
          text: "Seulement si vous réalisez plus d'un million de bénéfices.",
          explanation:
            "Non. Certains pays ont bien des seuils, mais ils varient beaucoup et sont généralement bien plus bas que cela. Il n'existe pas de plafond mondial unique, c'est pourquoi vous devez vérifier vos règles locales.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c25-q2",
      prompt: "Lequel de ces cas est le plus susceptible de compter comme un fait générateur d'impôt ?",
      options: [
        {
          text: "Échanger un token contre un autre, par exemple troquer des XLM contre des USDC.",
          explanation:
            "Correct. De nombreuses administrations fiscales traitent un échange comme la vente du premier actif et l'achat du second, si bien qu'une plus-value sur le premier token peut être imposée à cet instant précis, même si aucune monnaie ordinaire n'était en jeu.",
        },
        {
          text: "Le simple fait de détenir un token dans votre portefeuille sans le vendre ni l'échanger.",
          explanation:
            "Généralement non. Le simple fait de détenir est en règle générale laissé tranquille jusqu'à ce que vous vendiez, échangiez ou dépensiez réellement l'actif. L'impôt s'applique typiquement quand vous cédez l'actif, pas pendant que vous le détenez.",
        },
        {
          text: "Ouvrir l'application pour regarder un graphique de prix.",
          explanation:
            "Non. Regarder les prix ou les graphiques ne déplace aucun actif et ne crée rien à déclarer. Un fait générateur d'impôt nécessite une véritable cession, un paiement ou un revenu.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c25-q3",
      prompt: "Quel est le moyen le plus simple d'extraire l'historique de vos transactions de cette application pour vos registres fiscaux ?",
      options: [
        {
          text: "Essayer de se souvenir de chaque trade en fin d'année.",
          explanation:
            "Reconstituer ses trades de mémoire est pénible et source d'erreurs. Les dates, les montants et les prix sont difficiles à retenir avec précision, ce qui est justement l'erreur qu'une bonne tenue de registres évite.",
        },
        {
          text: "Prendre une capture d'écran du graphique de prix.",
          explanation:
            "Une capture d'écran d'un graphique montre un prix, pas vos trades réels. Elle ne contient aucune des dates, montants ou frais dont un comptable a besoin pour calculer vos plus-values.",
        },
        {
          text: "Utiliser le sous-onglet Historique des trades de l'onglet Journaux et son export CSV pour télécharger un fichier daté de vos transactions.",
          explanation:
            "Correct. L'onglet Journaux enregistre votre activité, et l'export CSV vous donne un tableur ordonné et daté que vous pouvez remettre à un comptable ou importer dans des outils fiscaux — comme vider une boîte à chaussures de reçus déjà triés.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
