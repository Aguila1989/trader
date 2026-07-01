// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../../types";

export const chapter22: Chapter & { whoFor: string } = {
  id: "c22",
  number: 22,
  level: "BASIC",
  whoFor: "Pour quiconque a déjà vendu dans la panique ou acheté au sommet",
  title: "Psychologie du trading",
  description:
    "Les pièges mentaux qui coûtent de l'argent aux traders : le FOMO, la FUD, l'aversion à la perte, et les habitudes simples qui gardent vos décisions calmes et guidées par des règles.",
  lessons: [
    {
      id: "c22-l1",
      title: "Qu'est-ce que le FOMO et pourquoi mène-t-il à de mauvaises décisions ?",
      paragraphs: [
        "Le FOMO désigne la peur de manquer une occasion. En trading, c'est ce sentiment anxieux qu'un coin s'envole sans vous, ce qui vous pousse à acheter précipitamment avant même d'y avoir réfléchi. La sensation est bien réelle, mais elle vous incite à acheter alors que le prix est déjà élevé et que les gains faciles sont derrière vous.",
        "Le problème, c'est le timing. Au moment où un coin envahit tous vos fils d'actualité et que tout le monde s'enthousiasme, l'essentiel du mouvement s'est en général déjà produit. Les acheteurs qui courent après cet emballement arrivent souvent juste avant que le prix ne retombe, puis regardent leur nouvelle position perdre de la valeur. La décision a été guidée par l'émotion, pas par un plan.",
        "Une approche plus posée consiste à décider à l'avance ce qu'un coin vaut à vos yeux et à attendre ce prix. S'il n'arrive jamais, vous laissez simplement passer le trade. Manquer un gain n'est pas la même chose que perdre de l'argent, et une autre occasion se présentera toujours.",
      ],
      example:
        "Imaginez que vous passiez devant un restaurant avec une longue file d'attente à l'entrée. Vous n'y avez jamais mangé et ne savez rien de la cuisine, mais la foule vous fait tout de même vous mettre dans la file. Voilà le FOMO. Vous avez fait la queue parce que d'autres le faisaient, pas parce que vous aviez vérifié si le repas en valait la peine. En trading, acheter un coin uniquement parce que son prix flambe relève du même réflexe.",
    },
    {
      id: "c22-l2",
      title: "Qu'est-ce que la FUD et comment la reconnaître ?",
      paragraphs: [
        "La FUD signifie peur, incertitude et doute (en anglais, fear, uncertainty, and doubt). Elle désigne un discours négatif, parfois vrai et parfois faux, diffusé pour vous effrayer suffisamment pour que vous vendiez. Ce peut être un avertissement honnête, comme ce peut être quelqu'un qui tente de faire baisser un prix pour acheter à bon compte.",
        "L'astuce pour gérer la FUD, c'est de séparer l'affirmation de l'émotion. Demandez-vous ce qui est dit exactement, s'il existe la moindre preuve, et qui a intérêt à ce que vous paniquiez. Un vague On va tous tout perdre est très différent d'un fait précis et vérifiable que vous pouvez contrôler par vous-même.",
        "Vous n'êtes pas obligé d'ignorer les mauvaises nouvelles, et les risques réels méritent une réelle attention. Mais vous ne devriez jamais vendre uniquement parce qu'un message effrayant vous a fait battre le cœur plus vite. Ralentissez, vérifiez, et décidez seulement ensuite.",
      ],
      example:
        "Pensez à quelqu'un qui crie au feu dans une salle de spectacle bondée. Parfois il y a bel et bien de la fumée et partir vite est le bon choix. Parfois il n'y a rien, et la personne voulait simplement libérer les places. La FUD, c'est pareil : avant de vous ruer vers la sortie et de tout vendre, jetez un œil autour de vous et vérifiez s'il y a vraiment de la fumée.",
    },
    {
      id: "c22-l3",
      title: "Pourquoi les gens vendent-ils exactement au plus bas ?",
      paragraphs: [
        "Cela se répète encore et encore : un prix chute, le détenteur tient bon un moment, puis finit par vendre par découragement, souvent juste avant que le prix ne se redresse. Ce schéma est provoqué par l'aversion à la perte, un biais bien étudié où la douleur de perdre est ressentie environ deux fois plus fort que le plaisir d'un gain équivalent.",
        "Comme une perte latente fait si mal, la regarder grandir devient insupportable. Vendre fait cesser la sensation désagréable sur-le-champ, si bien que le cerveau y voit un soulagement, même quand cela verrouille le pire prix possible. La décision règle un problème émotionnel, pas un problème financier.",
        "Le savoir à l'avance est la meilleure défense. Si vous décidez de votre prix de sortie avant de ressentir la peur, vous avez beaucoup moins de chances de brader au plus bas juste pour faire disparaître le malaise.",
      ],
      example:
        "Imaginez deux enveloppes. Dans l'une, vous trouvez 50 USDC, une belle surprise. Dans l'autre, vous perdez 50 USDC que vous possédiez déjà. La plupart des gens ressentent la perte bien plus vivement que le gain, alors même que le montant est identique. Ce ressenti déséquilibré est l'aversion à la perte, et c'est précisément ce qui pousse un trader à vendre au point le plus bas.",
    },
    {
      id: "c22-l4",
      title: "Qu'est-ce qu'un plan de trading et pourquoi en avez-vous besoin ?",
      paragraphs: [
        "Un plan de trading est un petit ensemble de règles que vous écrivez pour vous-même avant de trader : ce que vous allez acheter, en quelle quantité, à quel prix vous prenez vos bénéfices, et à quel prix vous acceptez une perte et sortez. Il transforme de vagues espoirs en actions claires et décidées à l'avance.",
        "L'intérêt d'un plan, c'est que vous le rédigez pendant que vous êtes calme, et non pendant qu'un prix s'effondre ou flambe. Lorsque les émotions montent plus tard, vous n'avez pas à inventer une décision sur le moment. Vous vous contentez de suivre les règles que vous aviez déjà fixées avec vous-même.",
        "Dans cette application, vous pouvez inscrire directement des parties de votre plan dans les outils. Un stop loss fixe le prix auquel vous sortez d'un trade perdant, et un prix cible fixe celui auquel vous prenez vos bénéfices, si bien que le plan s'exécute même lorsque vous ne surveillez pas.",
      ],
      example:
        "Partir en voyage sur la route sans carte ni GPS, c'est conduire au feeling, prendre de mauvais virages et se disputer à chaque carrefour. Avec un itinéraire planifié à l'avance, chaque virage est déjà décidé et le trajet reste serein. Un plan de trading est cet itinéraire : vous tranchez les choix difficiles avant de démarrer, et non dans la panique au volant.",
    },
    {
      id: "c22-l5",
      title: "Comment prendre une décision sans émotion ?",
      paragraphs: [
        "Vous ne pouvez pas éteindre vos émotions, mais vous pouvez les empêcher de tenir le volant. L'astuce centrale est de décider les règles avant que l'argent et l'émotion ne soient en jeu, puis de laisser ces règles trancher au moment venu. Un plan de trading, un stop loss et un prix cible font tous cela pour vous.",
        "Ralentir aide aussi. La plupart des mauvais trades naissent d'une action en quelques secondes. Attendre ne serait-ce que quelques minutes, ou dormir sur une grande décision, laisse le premier accès de peur ou d'avidité retomber pour que votre raisonnement puisse rattraper son retard. Si un trade n'a de sens que tant que vous êtes exalté, c'est en général un mauvais trade.",
        "Enfin, notez pourquoi vous avez effectué chaque trade. Relire vos propres notes plus tard vous montre honnêtement si c'était l'émotion ou la logique qui commandait, et ce retour d'information fait peu à peu de vous un trader plus posé.",
      ],
      example:
        "Un pilote ne se fie pas à son humeur en pleine tempête ; il déroule une check-list écrite, une étape calme à la fois. Vous pouvez aborder le trading de la même façon : une petite check-list du type Est-ce prévu dans mon plan ? Ai-je fixé ma sortie ? Est-ce que j'agis sur des faits ou sur la peur ? transforme une impulsion à chaud en une décision froide et réfléchie.",
    },
  ],
  quiz: [
    {
      id: "c22-q1",
      prompt: "Vous voyez un coin dont le prix flambe et tout le monde en parle en ligne. Vous ressentez l'envie d'acheter immédiatement. Quelle est la réaction la plus saine ?",
      options: [
        {
          text: "Acheter tout de suite, car si tout le monde s'enthousiasme, le prix ne peut que continuer à monter.",
          explanation:
            "C'est le FOMO en action. Au moment où un coin est partout, l'essentiel du mouvement s'est généralement déjà produit, et lui courir après revient souvent à acheter juste avant qu'il ne retombe.",
        },
        {
          text: "Marquer une pause, décider ce que le coin vaut réellement à vos yeux, et n'acheter qu'à ce prix — sinon, laisser passer.",
          explanation:
            "Correct. Décider de votre prix à l'avance remplace la course émotionnelle par une règle. Manquer un gain n'est pas une perte, et une autre occasion se présentera toujours.",
        },
        {
          text: "Vendre tout ce que vous possédez d'autre pour en acheter le plus possible.",
          explanation:
            "Non. En misant encore plus fort, vous aggravez l'erreur du FOMO au lieu de la réduire, et vous abandonnez le moindre plan que vous aviez.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q2",
      prompt: "Un message dramatique affirme qu'un coin est sur le point de s'effondrer et que vous devriez vendre maintenant. Comment devriez-vous le traiter ?",
      options: [
        {
          text: "Vendre immédiatement, parce que le message paraît urgent et effrayant.",
          explanation:
            "Agir sur la seule peur est précisément ce que la FUD cherche à déclencher. L'urgence et la dramatisation ne sont pas des preuves.",
        },
        {
          text: "Séparer l'affirmation de l'émotion : chercher de vraies preuves et se demander qui a intérêt à ce que vous paniquiez.",
          explanation:
            "Correct. La FUD mêle la peur à des affirmations vagues. Vérifier les faits précis, et repérer qui gagne à votre panique, garde la décision rationnelle.",
        },
        {
          text: "Ignorer toutes les mauvaises nouvelles à jamais, puisqu'elles sont toujours fausses.",
          explanation:
            "Pas tout à fait. Certaines mauvaises nouvelles sont réelles et méritent votre attention. Le savoir-faire consiste à vérifier les affirmations, pas à balayer tout avertissement.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q3",
      prompt: "Pourquoi l'aversion à la perte pousse-t-elle souvent les traders à vendre tout en bas ?",
      options: [
        {
          text: "Parce que vendre au plus bas est mathématiquement la meilleure façon de réaliser un bénéfice.",
          explanation:
            "Non. Vendre au plus bas verrouille le pire prix. Cela n'a rien à voir avec le bénéfice et tout à voir avec le fait de faire cesser une douleur émotionnelle.",
        },
        {
          text: "Parce que la douleur d'une perte qui s'aggrave est si forte que vendre pour faire cesser la sensation ressemble à un soulagement.",
          explanation:
            "Correct. L'aversion à la perte signifie que les pertes font environ deux fois plus mal que des gains équivalents ne font du bien, si bien que les gens vendent pour mettre fin au malaise, même au pire moment.",
        },
        {
          text: "Parce qu'un plan de trading les oblige à vendre au prix le plus bas.",
          explanation:
            "C'est l'inverse. Un plan avec une sortie fixée à l'avance est justement ce qui empêche de vendre dans la panique au plus bas.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q4",
      prompt: "Quel est le principal avantage d'écrire un plan de trading avant de trader ?",
      options: [
        {
          text: "Il garantit que chaque trade sera rentable.",
          explanation:
            "Aucun plan ne peut garantir un bénéfice. Les marchés sont incertains ; un plan gère votre comportement, pas le résultat.",
        },
        {
          text: "Vous décidez vos règles d'achat, de prise de bénéfices et de sortie au calme, de sorte que les émotions à chaud ne prennent pas la décision plus tard.",
          explanation:
            "Correct. Un plan établi dans un moment de calme signifie que, lorsqu'un prix s'agite, vous suivez des règles déjà choisies au lieu d'improviser sous le stress.",
        },
        {
          text: "Il vous permet de trader sans jamais avoir besoin d'un stop loss ni d'un prix cible.",
          explanation:
            "À l'envers. Un stop loss et un prix cible sont des outils qui mettent votre plan en action, et non des choses dont un plan supprime le besoin.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
