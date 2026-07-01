// PENDING — do not activate until green light.
// Chapitre 31 (Tokenomics) : offre, capitalisation boursière, création et
// destruction de tokens, et l'usage de la tokenomics comme grille de lecture
// complémentaire face à une suggestion de ligne de confiance de l'IA. Rédigé sur
// le même modèle que content/en/chapter22.ts, niveau ADVANCED, avec le champ
// `whoFor` propre au chapitre typé via une intersection locale afin que
// l'interface Chapter en production reste intacte jusqu'à l'intégration. Ce
// chapitre ne possède aucun nouveau terme de glossaire.
import type { Chapter } from "../../../types";

export const chapter31: Chapter & { whoFor: string } = {
  id: "c31",
  number: 31,
  level: "ADVANCED",
  whoFor: "Pour les traders qui jugent un token à son offre, pas à son battage",
  title: "Tokenomics",
  description:
    "Offre, capitalisation boursière et inflation par la création et la destruction de tokens — et comment se servir de la tokenomics comme grille de lecture lorsque l'IA suggère une nouvelle ligne de confiance.",
  lessons: [
    {
      id: "c31-l1",
      title: "Qu'est-ce que la tokenomics ?",
      paragraphs: [
        "La tokenomics, c'est l'économie d'un token : combien d'unités existent, comment de nouvelles sont créées (l'émission), qui les détient (la distribution) et quels comportements le design récompense (les incitations). C'est le règlement qui gouverne la masse monétaire d'un actif unique, fixé par celui qui l'émet. Sur Stellar, le XLM possède sa propre politique monétaire figée, tandis que n'importe quel émetteur peut créer un token sur mesure et inscrire ses propres règles dans un fichier stellar.toml.",
        "Ces quatre piliers comptent, car le prix ne représente que la moitié de la valeur. Un token peut sembler actif sur le graphique tout en étant discrètement dilué par un émetteur qui en crée davantage, ou concentré si étroitement qu'une poignée de portefeuilles peut faire bouger le marché à volonté. Lire l'offre et la distribution vous dit si le prix que vous voyez reflète un actif rare et largement détenu, ou un actif abondant contrôlé par quelques initiés.",
        "Pas besoin d'un tableur pour commencer. Trois questions couvrent l'essentiel : combien de tokens sont en circulation aujourd'hui, combien pourront exister au maximum, et qui profite des variations de l'offre. La tokenomics n'est rien d'autre que la discipline consistant à se poser ces questions avant de confier votre capital à un token. Ce contenu est éducatif, pas un conseil financier — l'objectif est de vous aider à lire un token, pas de vous dire lequel acheter.",
      ],
      example:
        "Pensez à une salle de concert. Le nombre de places imprimées sur les billets, c'est l'offre ; la billetterie qui décide d'en imprimer davantage, c'est l'émission ; qui détient ces billets, c'est la distribution ; et les avantages liés à une place au premier rang, ce sont les incitations. Deux spectacles peuvent facturer le même prix de billet, mais celui qui continue d'imprimer des billets supplémentaires rend discrètement chaque billet existant moins précieux. La tokenomics, c'est lire le plan de salle avant de payer.",
    },
    {
      id: "c31-l2",
      title: "Offre en circulation et offre maximale : quelle différence ?",
      paragraphs: [
        "L'offre en circulation, c'est le nombre de tokens réellement disponibles et échangeables à l'instant présent. L'offre maximale, c'est le plus grand nombre qui puisse jamais exister selon les règles du token. L'écart entre les deux, ce sont les tokens promis mais pas encore libérés — bloqués dans des calendriers d'acquisition de l'équipe, réservés à de futures récompenses, ou simplement pas encore créés.",
        "Imaginez une ville. Les logements que l'on peut louer ou acheter aujourd'hui, c'est l'offre en circulation. Le plan d'aménagement complet inscrit dans les registres du conseil municipal — chaque parcelle zonée pour de futures constructions — c'est l'offre maximale. Si une ville compte 10 000 logements occupés mais prévoit d'en construire 100 000, vous savez qu'une vague de nouveaux logements arrive. Ces futures constructions concurrenceront les logements actuels et pourront peser sur leur prix, alors même que rien n'a encore été bâti.",
        "Pour un token, ce futur aménagement, c'est le risque de dilution. Si l'offre en circulation ne représente qu'une fine part de l'offre maximale, de gros lots de tokens sont programmés pour être débloqués, et chaque déblocage ajoute des vendeurs au marché. Un token qui s'échange bien aujourd'hui peut dériver à la baisse pendant des mois uniquement parce que son calendrier d'offre continue de libérer de nouvelles unités. Comparez toujours les deux chiffres avant de juger un prix élevé ou bas.",
      ],
      example:
        "Un token s'échange à 2 USDC avec 50 millions de tokens en circulation, mais son offre maximale est de 500 millions. Seuls 10 pour cent ont été libérés. Les 450 millions restants doivent se débloquer au cours des trois prochaines années au profit de l'équipe et des premiers investisseurs. Même si la demande reste stable, ce flux régulier de nouveaux vendeurs peut faire pression à la baisse sur le prix — de sorte que les 2 USDC que vous payez aujourd'hui ne rivalisent pas seulement avec les détenteurs actuels, mais avec neuf fois plus de tokens en attente dans le pipeline.",
    },
    {
      id: "c31-l3",
      title: "Qu'est-ce que la capitalisation boursière et comment la calculer ?",
      paragraphs: [
        "La capitalisation boursière, c'est la valeur totale de l'offre en circulation d'un token : capitalisation = prix x offre en circulation. Elle répond à une question plus large que le seul prix — non pas combien coûte une unité, mais combien vaut l'ensemble du pool échangeable. Une capitalisation de 50 millions d'USDC signifie que le marché valorise actuellement l'ensemble des tokens en circulation, additionnés, à ce montant environ.",
        "C'est pourquoi un prix par token faible ne veut pas dire bon marché. Le prix dépend entièrement de la façon dont l'offre est découpée. Un token à 0,001 USDC avec 100 milliards d'unités en circulation a une capitalisation de 100 millions d'USDC — bien plus élevée qu'un token à 200 USDC avec seulement 100 000 unités, qui ne vaut que 20 millions. Le prix d'une seule unité ne vous dit rien de la taille tant que vous ne l'avez pas multiplié par l'offre.",
        "Deux autres angles méritent d'être connus. La valorisation entièrement diluée applique le même calcul à l'offre maximale plutôt qu'à l'offre en circulation, montrant ce que vaudrait le token si chaque unité future existait déjà — un utile contrôle de cohérence face à la dilution vue à la leçon précédente. Et la capitalisation divisée par le volume d'échange quotidien donne un indice sur la liquidité : une énorme capitalisation avec un faible volume signifie que vous pourriez avoir du mal à sortir au prix affiché.",
      ],
      example:
        "Vous comparez deux tokens sur la page de détail des tokens. Le token A affiche 0,02 USDC l'unité ; le token B affiche 45 USDC l'unité. B a l'air \"cher\". Mais A compte 8 milliards de tokens en circulation (capitalisation de 160 millions d'USDC) tandis que B en compte 1 million (capitalisation de 45 millions d'USDC). A est de loin le plus gros actif, malgré son étiquette de prix minuscule. Vous fier au seul prix affiché vous aurait mis exactement à contre-sens.",
    },
    {
      id: "c31-l4",
      title: "Qu'est-ce que l'inflation en crypto ? Création et destruction de tokens",
      paragraphs: [
        "En crypto, l'inflation signifie que l'offre croît au fil du temps. Le mécanisme, c'est la création (le minting) : l'émetteur crée de nouveaux tokens et les ajoute à la circulation, souvent pour financer des récompenses, des versements de staking ou une trésorerie. Chaque token nouvellement créé est une créance sur la même valeur sous-jacente, si bien qu'à moins que la demande n'augmente d'autant, la part de chaque détenteur existant devient une fraction légèrement plus petite de l'ensemble — c'est la dilution.",
        "La destruction (le burning) est l'inverse. Des tokens sont envoyés vers une adresse d'où personne ne peut dépenser, ce qui les retire définitivement de l'offre. Un design déflationniste détruit les tokens plus vite qu'il n'en crée, de sorte que le total diminue et que chaque token restant représente une part plus grande. Sur Stellar, cela se fait en rappelant l'offre vers l'émetteur ou en l'envoyant vers un compte inutilisable ; le XLM lui-même a une offre figée sans création continue, il n'inflate donc pas.",
        "Pour un détenteur, le sens et le rythme de la variation de l'offre importent autant que le prix. Un token qui crée discrètement 10 pour cent d'unités supplémentaires chaque année est un vent contraire que vous payez même quand le prix semble stable, car votre part de propriété s'érode année après année. Un calendrier de destruction crédible est un vent favorable. Ni l'un ni l'autre n'est automatiquement bon ou mauvais — un projet naissant peut avoir besoin de créer des tokens pour amorcer son adoption — mais vous devriez savoir dans quel sens l'offre évolue, et pourquoi, avant de le détenir.",
      ],
      example:
        "Vous détenez 1 000 unités d'un token, soit 1 pour cent d'une offre de 100 000 unités. L'émetteur crée ensuite 100 000 nouvelles unités pour un programme de récompenses, doublant l'offre à 200 000. Vous détenez toujours 1 000 unités, mais cela ne représente désormais plus que 0,5 pour cent du token. Votre position n'a pas rétréci — c'est le gâteau qui a doublé — pourtant votre part a été divisée par deux. Si le prix n'avait pas monté pour refléter une nouvelle demande, votre participation venait de perdre discrètement la moitié de son poids relatif.",
    },
    {
      id: "c31-l5",
      title: "Comment utiliser la tokenomics pour évaluer une suggestion de ligne de confiance de l'IA",
      paragraphs: [
        "Lorsque l'analyse hebdomadaire et purement observatrice d'Atrium suggère une nouvelle ligne de confiance, la tokenomics est votre liste de vérification avant d'accorder votre confiance. Avant d'accepter de détenir un token — ce qui coûte une petite réserve de XLM et vous expose à l'émetteur — posez les trois questions de ce chapitre. Quelle est l'offre en circulation par rapport à l'offre maximale, pour jauger la dilution ? Quelle est la capitalisation boursière, pour ne pas vous laisser tromper par un prix par token faible ? Et le token est-il en création, en destruction ou figé, pour savoir dans quel sens votre part dérive ? Un token peut valider tous les signaux techniques et rester un mauvais actif à détenir si son offre est appelée à exploser.",
        "Cette grille de lecture est délibérément complémentaire de ce que l'IA mesure déjà. Les chapitres sur les suggestions de lignes de confiance, le chapitre 20 et le chapitre 21, expliquent comment l'analyse note quatre signaux par token — liquidité, légitimité, tendance et risque — en s'appuyant sur des indices comme la profondeur du carnet d'ordres, le nombre de lignes de confiance d'un token, et des signaux de confiance envers l'émetteur tels que la présence ou l'absence d'un stellar.toml, et comment elle suit les alertes de détérioration des tokens détenus sur douze semaines d'historique. Ces signaux lisent le comportement du marché autour d'un token. La tokenomics lit le design monétaire propre au token, ce qu'aucune profondeur de carnet d'ordres ni aucun nombre de lignes de confiance ne peut révéler. Ensemble, ils répondent à deux moitiés distinctes d'une même question : cet actif est-il à la fois bien échangé et bien structuré ?",
        "Gardez à l'esprit les garde-fous de l'application pendant que vous procédez. L'analyse n'ajoute ni ne retire jamais automatiquement une ligne de confiance — la décision vous revient toujours — et un stellar.toml manquant est un signal d'alerte précisément parce qu'il masque les métadonnées de l'émetteur dont vous vous serviriez pour vérifier l'offre et l'autorité de création. Si vous ne trouvez pas qui peut créer le token ni combien pourra en exister au maximum, traitez cette opacité elle-même comme un signal de risque, et appuyez-vous en conséquence sur vos facteurs de risque de taille de position et de volatilité. Ceci est un accompagnement éducatif, pas un conseil financier.",
      ],
      example:
        "L'analyse signale un token doté d'une forte profondeur de liquidité et d'un nombre sain de lignes de confiance — les signaux de l'IA sont au vert. Avant d'accepter, vous vérifiez la tokenomics. L'offre en circulation représente 5 pour cent de l'offre maximale, et le stellar.toml révèle que l'émetteur conserve toute l'autorité de création avec un calendrier de déblocage sur trois ans. Les signaux de marché disaient \"bien échangé\", mais le design de l'offre dit \"forte dilution à venir et contrôle de la création entre les mains d'un seul\". Vous renoncez à la ligne de confiance — non pas parce que l'IA avait tort, mais parce qu'une seconde grille de lecture, complémentaire, a repéré un risque que les signaux de marché ne pouvaient pas voir.",
    },
  ],
  quiz: [
    {
      id: "c31-q1",
      prompt: "Quel ensemble de facteurs décrit le mieux ce que couvre la \"tokenomics\" ?",
      options: [
        {
          text: "L'offre, l'émission, la distribution et les incitations du token.",
          explanation:
            "Correct. La tokenomics est l'économie d'un token — combien d'unités existent, comment de nouvelles sont créées, qui les détient et ce que le design récompense. Ensemble, ces éléments vous disent si le prix reflète un actif rare et largement détenu ou un actif abondant et concentré.",
        },
        {
          text: "Uniquement le prix de marché actuel et la variation en pourcentage sur 24 heures.",
          explanation:
            "Trop étroit. Le prix et sa variation récente sont des données de graphique, pas de la tokenomics. Ils ne disent rien de la quantité d'offre existante ni de qui en contrôle l'émission.",
        },
        {
          text: "La couleur des chandeliers et la forme des barres de volume.",
          explanation:
            "Non. Ce sont des repères de lecture graphique sur la page de détail des tokens. La tokenomics concerne le design monétaire sous-jacent du token, pas l'apparence de son graphique de prix.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q2",
      prompt: "Un token compte 50 millions de tokens en circulation et une offre maximale de 500 millions. Pourquoi cet écart vous importe-t-il en tant que détenteur ?",
      options: [
        {
          text: "Cela n'a pas d'importance — seule l'offre en circulation influence le prix.",
          explanation:
            "Incorrect. L'écart représente 450 millions de tokens programmés pour être débloqués. Chaque déblocage ajoute des vendeurs au marché, ce qui peut peser sur le prix pendant des mois même si la demande reste stable.",
        },
        {
          text: "Les 450 millions de tokens non libérés sont une dilution future : à mesure qu'ils se débloquent, ils ajoutent des vendeurs et peuvent faire pression sur le prix.",
          explanation:
            "Correct. Comme une ville dotée de 10 000 logements mais qui en prévoit 100 000, l'aménagement futur concurrence ce qui existe aujourd'hui. Une petite part en circulation d'une grande offre maximale est un vent contraire de dilution que vous devriez intégrer avant d'acheter.",
        },
        {
          text: "Une offre maximale élevée garantit que le prix montera à mesure que davantage de tokens seront créés.",
          explanation:
            "À l'envers. Créer davantage d'unités sans demande correspondante dilue la part de chaque détenteur. Plus d'offre est un vent contraire, pas une garantie de prix plus élevés.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c31-q3",
      prompt: "Le token A s'échange à 0,02 USDC avec 8 milliards d'unités en circulation. Le token B s'échange à 45 USDC avec 1 million d'unités en circulation. Lequel est le plus gros actif par capitalisation boursière, et pourquoi ?",
      options: [
        {
          text: "Le token B, car son prix par unité de 45 USDC est bien plus élevé que celui de A.",
          explanation:
            "C'est exactement le piège contre lequel la leçon met en garde. Un prix par token élevé ne signifie pas \"plus gros\" — vous devez multiplier le prix par l'offre en circulation pour obtenir la capitalisation boursière.",
        },
        {
          text: "Ils ont la même taille, car la capitalisation boursière ne dépend que du prix.",
          explanation:
            "Incorrect. La capitalisation boursière, c'est le prix multiplié par l'offre en circulation ; deux tokens aux offres très différentes n'ont donc presque jamais la même capitalisation, même à des prix similaires.",
        },
        {
          text: "Le token A, car 0,02 x 8 milliards = 160 millions d'USDC, contre 45 x 1 million = 45 millions d'USDC pour B.",
          explanation:
            "Correct. Capitalisation boursière = prix x offre en circulation. L'étiquette de prix minuscule de A masque un pool échangeable bien plus vaste. Un prix par token faible n'est jamais automatiquement \"bon marché\" tant que vous n'avez pas tenu compte de l'offre.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c31-q4",
      prompt: "Un émetteur crée 100 000 nouveaux tokens pour un programme de récompenses, doublant l'offre de 100 000 à 200 000. Vous déteniez 1 000 tokens. Qu'est-il advenu de votre part de propriété ?",
      options: [
        {
          text: "Votre part est passée de 1 pour cent à 0,5 pour cent — l'offre a doublé alors que votre avoir est resté identique.",
          explanation:
            "Correct. La création est de l'inflation : vos 1 000 tokens sont inchangés, mais ils représentent désormais une part deux fois plus petite d'un gâteau qui a doublé. À moins que le prix n'ait monté pour refléter une nouvelle demande, votre participation relative a été diluée.",
        },
        {
          text: "Votre part est restée à 1 pour cent, car vous possédez toujours le même nombre de tokens.",
          explanation:
            "Incorrect. Posséder le même nombre n'est pas la même chose que posséder la même part. Quand le total double, votre avoir fixe couvre une fraction plus petite de l'ensemble.",
        },
        {
          text: "Votre part a augmenté, car plus de tokens en circulation rend chaque détenteur plus important.",
          explanation:
            "C'est l'inverse. Une nouvelle création dilue les détenteurs existants — plus d'unités signifie que chacune, y compris la vôtre, représente une portion plus petite de l'ensemble.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c31-q5",
      prompt: "L'analyse des lignes de confiance de l'IA signale un token doté d'une forte profondeur de liquidité et d'un nombre élevé de lignes de confiance. Quelle place la tokenomics devrait-elle occuper dans votre décision ?",
      options: [
        {
          text: "Les signaux au vert de l'IA suffisent à eux seuls ; la tokenomics n'apporte rien de nouveau.",
          explanation:
            "Incorrect. Les quatre signaux de l'analyse — liquidité, légitimité, tendance et risque — lisent le comportement du marché autour d'un token. Ils ne peuvent pas voir le design d'offre propre au token, ce qui est précisément la lacune que comble la tokenomics.",
        },
        {
          text: "Utilisez la tokenomics comme grille de lecture complémentaire : vérifiez l'offre en circulation face à l'offre maximale, la capitalisation boursière, et la création ou la destruction avant d'accepter.",
          explanation:
            "Correct. Comme l'expliquent les chapitres 20 et 21, l'analyse note les signaux de marché ; la tokenomics lit le design monétaire du token. Un token peut valider tous les signaux techniques et rester un mauvais actif à détenir si son offre est appelée à exploser ou si son autorité de création est opaque.",
        },
        {
          text: "Ignorez complètement l'IA et laissez l'application ajouter automatiquement la ligne de confiance sur la seule base de la tokenomics.",
          explanation:
            "Faux sur deux points. Les deux grilles de lecture sont complémentaires, pas rivales — et l'application n'ajoute jamais automatiquement une ligne de confiance. En ajouter une est toujours votre propre décision, prise avec une petite réserve de XLM en jeu.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
