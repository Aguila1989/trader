// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter26: Chapter & { whoFor: string } = {
  id: "c26",
  number: 26,
  level: "BASIC",
  whoFor: "Pour quiconque lit les gros titres de la crypto et se demande ce qui est vrai",
  title: "Comment lire l'actualité crypto avec esprit critique",
  description:
    "Pourquoi l'actualité crypto est différente, les manipulations courantes comme les pump-and-dump et les fausses associations, comment vérifier soi-même une affirmation, et à quelles sources vous pouvez réellement vous fier.",
  lessons: [
    {
      id: "c26-l1",
      title: "En quoi l'actualité crypto diffère-t-elle de l'actualité ordinaire ?",
      paragraphs: [
        "Dans l'actualité traditionnelle, une information passe généralement entre les mains de rédacteurs et de journalistes censés vérifier les faits avant publication. L'actualité crypto est différente, car n'importe qui disposant d'un compte peut publier n'importe quoi, instantanément, devant une audience immense. Il n'y a souvent aucun rédacteur, aucune vérification des faits, et personne à qui demander des comptes si l'affirmation se révèle fausse.",
        "À cela s'ajoute qu'il y a de l'argent réel en jeu derrière l'humeur ambiante. Quand le prix d'un token monte, ceux qui le détiennent déjà s'enrichissent, si bien qu'ils ont une bonne raison d'enthousiasmer tout le monde. Beaucoup des voix les plus bruyantes en ligne possèdent précisément la chose dont elles parlent, et elles vous le disent rarement. Leur objectif est peut-être de faire bouger un prix, non de vous informer.",
        "Cela ne veut pas dire que chaque publication est un mensonge. Cela veut dire que vous devriez traiter une affirmation crypto comme un tuyau non vérifié venant d'un inconnu, et non comme un fait avéré. Le reste de ce chapitre vous montre les astuces courantes et comment vérifier les choses par vous-même.",
      ],
      example:
        "Pensez à la différence entre un article de journal et un tract collé sur un lampadaire. Le journal a un nom derrière lui et peut être tenu pour responsable ; le tract a pu être imprimé par n'importe qui, y compris par quelqu'un qui profite si vous le croyez. La plupart de l'actualité crypto se trouve sur le lampadaire, alors lisez-la de cette manière.",
    },
    {
      id: "c26-l2",
      title: "Quelles sont les manipulations les plus courantes ?",
      paragraphs: [
        "L'astuce la plus dévastatrice est le pump-and-dump. Un groupe fait monter la sauce autour d'un petit token bon marché partout à la fois, si bien que son prix s'envole. De nouveaux acheteurs se précipitent, portés par l'euphorie, et les promoteurs initiaux revendent discrètement leurs coins pour répondre à cette demande. Le prix s'effondre alors, laissant les retardataires avec des tokens valant une fraction de ce qu'ils ont payé.",
        "Un proche cousin est le shilling. C'est le fait de promouvoir bruyamment un token tout en cachant qu'on le détient et qu'on en tire profit si d'autres achètent. La publication ressemble à un conseil amical et impartial, mais son auteur a un intérêt financier qu'il ne mentionne jamais. Si un inconnu tient particulièrement à ce que vous achetiez quelque chose, demandez-vous ce qu'il y gagne.",
        "La troisième manipulation est la fausse association. C'est une affirmation inventée ou exagérée selon laquelle un token serait lié à une entreprise célèbre, utilisée pour emprunter la confiance dont jouit cette entreprise. Une capture d'écran ou un vague Nous travaillons avec une grande banque peut faire flamber un prix avant que quiconque ne vérifie. Bien souvent, la grande entreprise n'a même jamais entendu parler du token.",
      ],
      example:
        "Imaginez un stand improvisé sur une place animée. Quelques comédiens dans la foule annoncent bruyamment qu'un simple bracelet est une pièce de collection rare et se mettent à enchérir dessus. Les badauds, ne voulant pas manquer l'occasion, paient des prix élevés. Puis les comédiens et le vendeur remballent et disparaissent, et le bracelet n'est qu'un bracelet. Cet enthousiasme mis en scène est exactement la façon dont un pump-and-dump, le shilling et une fausse association fonctionnent ensemble en ligne.",
    },
    {
      id: "c26-l3",
      title: "Comment vérifier une affirmation à propos d'un token ?",
      paragraphs: [
        "Commencez par la source primaire. Si une publication affirme qu'un token a lancé une nouvelle fonctionnalité ou signé un accord, cherchez l'annonce sur le site officiel du projet ou sur son compte vérifié, et pas seulement la capture d'écran que quelqu'un a repartagée. Une affirmation qui n'existe que sous la forme d'une image transférée, sans original que vous puissiez retracer, est un signal d'alerte.",
        "Pour un token Stellar, vous pouvez consulter les métadonnées propres à l'émetteur. Tout émetteur sérieux publie un fichier stellar.toml, un petit fichier texte qui indique qui il est et comment le joindre. Son absence est un signal d'alarme. Les suggestions de lignes de confiance d'Atrium, hebdomadaires et purement en observation, lisent déjà ce fichier et notent les tokens à partir de données on-chain telles que l'activité de trading, la profondeur du carnet d'ordres et le nombre de comptes qui détiennent une ligne de confiance, qui est une mesure de l'adoption réelle. Vous pouvez examiner ces scores vous-même au lieu de vous fier à une publication tapageuse.",
        "Enfin, si une affirmation nomme un partenaire, allez vérifier auprès de ce partenaire. Un partenariat réel sera généralement confirmé des deux côtés. Les données on-chain sont publiques, si bien que vous pouvez aussi vérifier qu'un portefeuille ou une transaction dont quelqu'un se vante existe réellement. Si l'histoire ne tient qu'à un seul endroit et que personne d'indépendant ne la confirme, considérez-la comme non prouvée.",
      ],
      example:
        "Supposons qu'un message dise Une bourse célèbre vient d'ajouter CoinX. Avant d'agir, vous ouvrez le site officiel de cette bourse et vous y cherchez CoinX. S'il n'y figure pas, l'affirmation échoue à une vérification élémentaire, peu importe combien de gens la répètent. Une minute passée à regarder la source primaire vaut mieux qu'une heure à faire défiler des commentaires enthousiastes.",
    },
    {
      id: "c26-l4",
      title: "Quelles sont les sources fiables ?",
      paragraphs: [
        "La source la plus fiable est la source primaire : le site officiel du projet, ses comptes vérifiés et son fichier stellar.toml. Viennent ensuite les explorateurs de blocs, des outils publics qui permettent à quiconque de consulter les vraies transactions et les vrais soldes sur le réseau. Parce que les explorateurs de blocs lisent directement dans la blockchain, ils montrent ce qui s'est réellement passé, et non ce que quelqu'un prétend qu'il s'est passé.",
        "Les médias établis qui emploient de vrais journalistes et corrigent leurs erreurs sont plus dignes de confiance qu'un compte anonyme, même si les bons médias peuvent eux aussi se tromper sur les sujets crypto ; recoupez donc tout ce qui vous amènerait à déplacer de l'argent. Méfiez-vous particulièrement des comptes anonymes, tout nouveaux, ou qui ne publient jamais que des raisons d'acheter. L'assurance bruyante n'est pas une preuve.",
        "Rien de tout cela n'est un conseil financier, et les règles varient selon les pays ; considérez donc ces éléments comme des habitudes pour penser clairement plutôt que comme des instructions sur ce qu'il faut acheter. Le chapitre sur la psychologie du trading explique pourquoi la peur et l'euphorie nous font sauter ces vérifications précisément au moment où nous en avons le plus besoin.",
      ],
      example:
        "Traitez une affirmation crypto comme un acheteur avisé traite un avis en ligne. Un unique avis dithyrambique cinq étoiles émanant d'un compte tout neuf ne vous apprend presque rien. Un ensemble d'avis détaillés répartis sur plusieurs sites indépendants et établis, appuyé par un justificatif que vous pouvez vérifier, vous en apprend beaucoup. Faites pencher votre confiance vers les sources que l'on peut vérifier, et éloignez-la de la voix anonyme la plus bruyante.",
    },
  ],
  quiz: [
    {
      id: "c26-q1",
      prompt: "Pourquoi devriez-vous traiter une affirmation crypto publiée en ligne avec plus de prudence qu'un article dans un journal établi ?",
      options: [
        {
          text: "Parce que n'importe qui peut publier instantanément sans rédacteur ni vérification des faits, et que les auteurs profitent souvent de ce que vous les croyiez.",
          explanation:
            "Correct. Les publications crypto contournent généralement la relecture et la responsabilité de l'actualité traditionnelle, et beaucoup de voix bruyantes possèdent le token qu'elles promeuvent, si bien que leur objectif peut être de faire bouger un prix plutôt que de vous informer.",
        },
        {
          text: "Parce que l'actualité crypto est toujours rédigée par des journalistes professionnels qui vérifient chaque fait.",
          explanation:
            "C'est le contraire qui est vrai. La plupart des affirmations crypto viennent de comptes sans comptes à rendre et sans vérification des faits, ce qui est précisément pourquoi une prudence supplémentaire s'impose.",
        },
        {
          text: "Parce que les journaux ne se trompent jamais et que les sites crypto se trompent toujours.",
          explanation:
            "Non. Les deux peuvent se tromper. La vraie différence tient à la responsabilité et aux incitations : un auteur crypto profite souvent directement si vous agissez sur son affirmation.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c26-q2",
      prompt: "Un tout petit token bon marché fait soudain l'objet d'un battage partout, son prix flambe, puis il s'effondre juste après que de nouveaux acheteurs se sont rués dessus. Comment appelle-t-on ce schéma ?",
      options: [
        {
          text: "Un fichier stellar.toml.",
          explanation:
            "Non. Un stellar.toml est constitué de métadonnées d'émetteur qui vous aident à vérifier qui se cache derrière un token ; c'est un outil de vérification, pas un schéma d'arnaque.",
        },
        {
          text: "Un explorateur de blocs.",
          explanation:
            "Non. Un explorateur de blocs est un outil public pour consulter les vraies transactions sur la blockchain, pas une manœuvre de manipulation.",
        },
        {
          text: "Un pump-and-dump.",
          explanation:
            "Correct. Les promoteurs font monter la sauce autour du token pour pousser le prix à la hausse, puis revendent aux nouveaux acheteurs et le laissent s'effondrer, laissant les retardataires avec des tokens presque sans valeur.",
        },
        {
          text: "Une ligne de confiance.",
          explanation:
            "Non. Une ligne de confiance est l'autorisation que vous ajoutez avant de détenir un token non natif ; elle n'a rien à voir avec le schéma de battage suivi d'effondrement.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c26-q3",
      prompt: "Une publication affirme qu'un token Stellar vient de s'associer à une banque célèbre. Quelle est la meilleure façon de le vérifier ?",
      options: [
        {
          text: "Acheter vite avant que le prix ne monte davantage, puisqu'un grand partenariat est une excellente nouvelle.",
          explanation:
            "Non. Agir avant de vérifier est exactement le réflexe sur lequel repose une fausse association. L'enthousiasme n'est pas une preuve.",
        },
        {
          text: "Vérifier les sources primaires : l'annonce officielle du projet, le stellar.toml de l'émetteur, les données on-chain, et si le partenaire nommé le confirme lui aussi.",
          explanation:
            "Correct. Les partenariats réels sont généralement confirmés des deux côtés, et les données on-chain, en plus du stellar.toml de l'émetteur, vous permettent de vérifier vous-même l'affirmation au lieu de vous fier à une capture d'écran.",
        },
        {
          text: "Compter combien de personnes repartagent l'affirmation et lui faire confiance si le nombre est élevé.",
          explanation:
            "Non. Beaucoup de gens répétant une affirmation non vérifiée ne la rendent pas vraie ; cela peut simplement signifier que le battage a fonctionné. Retracez-la plutôt jusqu'à une source primaire.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
