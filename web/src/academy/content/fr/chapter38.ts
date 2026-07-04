// Chapitre 38 : Bien démarrer avec Atrium. Voir content/en/chapter38.ts pour la
// note structurelle (traduction naturelle, pas mot à mot).
import type { Chapter } from "../../types";

export const chapter38: Chapter & { whoFor: string } = {
  id: "c38",
  number: 38,
  level: "BASIC",
  whoFor: "Pour quiconque ouvre Atrium pour la première fois",
  title: "Bien démarrer avec Atrium",
  description:
    "Un tour rapide de l'application : la barre latérale, votre portefeuille, les modes de trading, le trading Manuel contre le trading via le Bot, et où retrouver de l'aide plus tard.",
  lessons: [
    {
      id: "c38-l1",
      title: "Comment démarrer avec cette application",
      paragraphs: [
        "La barre latérale à gauche est votre principal moyen de vous déplacer dans l'application — Trading, Recevoir et envoyer, Paiements en attente, Journaux et l'Academy s'y trouvent tous. Sur un écran d'ordinateur ou de tablette, elle reste fixée sur le bord gauche, et vous pouvez la réduire à de simples icônes en cliquant sur la petite flèche en haut, pour libérer de la place pour la page elle-même. Sur un téléphone, la barre latérale est masquée par défaut et devient un menu qui glisse à l'écran : appuyez sur le bouton ☰ pour l'ouvrir, appuyez sur un lien (ou sur l'arrière-plan) pour la refermer.",
        "En haut de l'application, la section portefeuille dans l'en-tête affiche toujours la valeur totale de votre portefeuille, afin que vous puissiez suivre votre situation quelle que soit la page où vous êtes. Touchez ou cliquez sur un jeton qui y figure et vous accédez à la page de détail de ce jeton, où vous pouvez consulter son prix, votre position, et régler des paramètres comme les stop-loss.",
        "La page Trading comporte deux onglets, et il est utile de savoir précisément ce que chacun contrôle. L'onglet Bot regroupe le réglage d'accès au trading Lecture seule / Paper / Live. Ce réglage ne concerne que l'IA, jamais vous : en Lecture seule, l'IA se contente d'observer et vous seul pouvez trader manuellement ; en Paper, l'IA simule des trades sans qu'aucun argent réel ne bouge ; en Live, l'IA peut soumettre de vrais ordres on-chain. Live est le seul mode ayant de réelles conséquences pour le bot, alors lisez attentivement l'avertissement affiché à l'écran avant d'y basculer un jour — un ordre live ne peut pas être annulé.",
        "L'onglet Manuel est l'endroit où vous placez vous-même vos trades. Les ordres manuels ne sont jamais mis en attente d'approbation, quel que soit le mode d'accès au trading actif — dès que vous soumettez un trade manuel, il s'exécute immédiatement (ou, si le mode d'accès est Paper, il s'exécute comme un trade simulé). L'onglet Bot abrite aussi le trading par IA lui-même : activer l'IA et la laisser trader nécessite un abonnement Premium, et vous devrez également fournir votre propre clé API pour le fournisseur d'IA que vous souhaitez utiliser.",
        "L'Academy — où vous lisez ceci en ce moment — est entièrement gratuite pour tout le monde, à tous les niveaux, et vous n'avez même pas besoin d'être connecté pour l'utiliser. Revenez-y à tout moment pour rafraîchir une notion.",
        "Enfin, si vous souhaitez un jour revoir la visite guidée interactive de l'application, inutile de la chercher : ouvrez les Paramètres, allez dans Compte, et choisissez Redémarrer le tutoriel pour la revivre depuis le début.",
      ],
      example:
        "Imaginez vos cinq premières minutes dans l'application : vous jetez un œil à l'en-tête et voyez la valeur totale de votre portefeuille ; sur votre téléphone, vous appuyez sur ☰ pour consulter la barre latérale et repérez le lien vers l'Academy ; vous ouvrez l'onglet Bot de la page Trading et remarquez que le mode d'accès est réglé sur Lecture seule, alors vous passez à l'onglet Manuel et y placez vous-même un petit trade manuel, qui s'exécute aussitôt ; plus tard, pour vous rafraîchir la mémoire, vous ouvrez Paramètres → Compte → Redémarrer le tutoriel et revisionnez la visite guidée depuis le début.",
    },
    {
      id: "c38-l2",
      title: "Quelle est la différence entre Gratuit et Premium ?",
      paragraphs: [
        "La formule Gratuite vous donne déjà quasiment tout ce que l'application sait faire. Le trading manuel est en accès complet, sans aucune restriction — vous pouvez placer, annuler et modifier des ordres, et régler un stop-loss ou un trailing stop pour protéger une position pendant votre absence. Le scanner de liquidité est lui aussi gratuit, pour vérifier à quel point un jeton se négocie facilement avant de vous y engager, et l'auto-swap vers XLM est disponible pour reconvertir automatiquement des jetons épars vers votre actif de base. L'Academy dans son intégralité, chaque chapitre et chaque quiz, est gratuite à tous les niveaux. La seule chose que la formule Gratuite n'inclut pas, c'est le trading par IA.",
        "Premium débloque deux choses. D'abord le trading par IA lui-même : une fois abonné, vous pouvez activer l'IA et la piloter avec des réglages par facteur de risque, de sorte qu'elle trade dans des limites que vous choisissez plutôt que de fonctionner comme un interrupteur tout-ou-rien. Ensuite, Premium abaisse vos frais de trading à chaque palier de volume, indépendamment de ce que le trading par IA peut lui-même apporter à vos résultats. Premium coûte 10 € par mois, ou 96 € par an — soit une économie d'environ 20 % par rapport au paiement mensuel. Pour réellement laisser l'IA trader, il vous faudra aussi votre propre clé API auprès d'un fournisseur d'IA comme Anthropic ou OpenAI, ce qui est couvert dans un chapitre ultérieur ; ce fournisseur d'IA vous facture séparément ce que l'IA elle-même consomme, en plus de votre abonnement Atrium.",
        "Chaque trade sur la plateforme, manuel ou par IA, paie un petit pourcentage de frais, et ce pourcentage dépend de votre palier de volume. Votre palier est recalculé chaque jour à partir de votre volume de trading sur la plateforme au cours du mois civil précédent, et peut donc monter ou descendre selon l'évolution de votre activité : Bronze correspond à moins de 5 000 XLM de volume mensuel, Argent à 5 000–20 000, Or à 20 000–50 000, et Platine à plus de 50 000. Au sein de chaque palier, la formule Gratuite paie le pourcentage le plus élevé, le trading manuel Premium paie moins, et le trading par IA Premium paie le moins de tous. Chaque nouveau compte démarre en Bronze. Il n'y a pas de frais minimum en valeur absolue, mais les trades inférieurs à 1 XLM ne comptent pas pour faire progresser votre palier, même s'ils paient tout de même les frais de ce palier.",
        "On peut voir ça comme un abonnement de salle de sport : plus vous l'utilisez, moins chaque séance coûte cher. Un trader actif est traité comme un habitué de la salle et paie un pourcentage plus faible par trade simplement parce qu'il vient plus souvent, et un abonnement Premium correspond au tarif membre en plus de cela — une réduction supplémentaire à chaque palier.",
        "En règle générale, si vous tradez plus d'environ 500 € par mois, la seule baisse des frais Premium suffit généralement à couvrir le coût mensuel de 10 €, avant même de compter ce que le trading par IA pourrait ajouter.",
      ],
      example:
        "Disons que vous tradez pour 8 000 XLM de volume sur un mois — cela vous place au palier Argent. En tant qu'utilisateur Gratuit, vos trades ce mois-là coûtent 0,23 % chacun. Passez à Premium et tradez manuellement au même volume, et les frais tombent à 0,16 % par trade ; laissez l'IA trader pour vous en Argent, et ils tombent encore à 0,12 %. Le palier est réévalué chaque jour à partir du volume du mois précédent, donc si le mois suivant vous tradez pour 25 000 XLM, vous passez au palier Or et les pourcentages baissent à nouveau — que vous soyez en Gratuit ou en Premium.",
    },
  ],
  quiz: [
    {
      id: "c38-q1",
      prompt: "Où se trouve le réglage d'accès au trading Lecture seule / Paper / Live, et que contrôle-t-il réellement ?",
      options: [
        {
          text: "Sur l'onglet Bot de la page Trading, et il ne concerne que l'IA — vos propres trades manuels sont toujours autorisés.",
          explanation:
            "Correct. Le réglage d'accès au trading se trouve sur l'onglet Bot. Lecture seule empêche l'IA de trader, Paper la laisse simuler, et Live lui permet de soumettre de vrais ordres — mais le trading manuel n'est jamais bloqué par ce réglage.",
        },
        {
          text: "Dans la barre latérale, et il vous bloque l'accès à toute l'application tant que vous n'avez pas choisi un mode.",
          explanation:
            "Non. Le réglage se trouve sur l'onglet Bot de la page Trading, et il ne bloque jamais le trading manuel ni aucune autre partie de l'application.",
        },
        {
          text: "Sur l'onglet Manuel, et il détermine si vos propres trades ont besoin d'une approbation.",
          explanation:
            "Pas tout à fait. Le réglage se trouve sur l'onglet Bot et concerne l'IA, pas vos trades manuels. Les trades manuels s'exécutent toujours immédiatement, quel que soit ce réglage.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q2",
      prompt: "Vous placez un trade sur l'onglet Manuel. Doit-il être approuvé avant de s'exécuter ?",
      options: [
        {
          text: "Oui, chaque trade manuel attend une étape d'approbation distincte, tout comme certains trades de l'IA.",
          explanation:
            "Non. Les trades manuels ne sont jamais mis en file d'attente pour approbation — cela ne s'applique qu'aux propositions générées par l'IA lorsque l'auto-trade est désactivé.",
        },
        {
          text: "Non — vos propres trades manuels s'exécutent immédiatement (ou comme un trade simulé en mode Paper), sans étape d'approbation.",
          explanation:
            "Correct. Le trading manuel vous appartient entièrement : ce que vous soumettez sur l'onglet Manuel passe directement, immédiatement.",
        },
        {
          text: "Cela dépend de si vous avez un abonnement Premium.",
          explanation:
            "Non. Un abonnement Premium est nécessaire pour permettre à l'IA de trader — il n'a aucune incidence sur vos propres trades manuels, qui s'exécutent toujours immédiatement.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q3",
      prompt: "Vous avez déjà suivi une fois la visite guidée interactive de l'application, mais vous voulez la revoir. Où allez-vous ?",
      options: [
        {
          text: "Paramètres → Compte → Redémarrer le tutoriel.",
          explanation:
            "Correct. Le tutoriel peut être redémarré à tout moment depuis la section Compte des Paramètres.",
        },
        {
          text: "L'Academy, dans un chapitre dédié « Tutoriel ».",
          explanation:
            "Pas tout à fait. L'Academy est un centre d'apprentissage gratuit distinct — la visite guidée interactive elle-même se redémarre depuis Paramètres → Compte, pas depuis un chapitre de l'Academy.",
        },
        {
          text: "Il n'y a aucun moyen de la revoir une fois qu'elle a été fermée.",
          explanation:
            "Non. Vous pouvez toujours la relancer depuis Paramètres → Compte → Redémarrer le tutoriel.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q4",
      prompt: "Laquelle de ces fonctionnalités est réservée aux abonnés Premium ?",
      options: [
        {
          text: "Le trading par IA, avec des réglages par facteur de risque.",
          explanation:
            "Correct. Le trading par IA est la seule fonctionnalité réservée à Premium. Le trading manuel, les stop-loss et trailing stops, le scanner de liquidité, l'auto-swap vers XLM et l'Academy complète sont tous gratuits.",
        },
        {
          text: "Le trading manuel et les stop-loss.",
          explanation:
            "Non. Le trading manuel, y compris les stop-loss et trailing stops, est pleinement disponible en Gratuit — rien là-dedans n'est réservé à Premium.",
        },
        {
          text: "L'Academy.",
          explanation:
            "Non. L'Academy est gratuite pour tout le monde, à tous les niveaux, que vous soyez abonné Premium ou non.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q5",
      prompt: "Qu'est-ce qui détermine votre palier de frais (Bronze, Argent, Or, Platine) ?",
      options: [
        {
          text: "Depuis combien de temps vous avez créé votre compte.",
          explanation:
            "Non. L'ancienneté du compte n'a aucun effet sur votre palier — un compte tout juste créé et un compte vieux de plusieurs années sont jugés de la même façon, uniquement sur le volume.",
        },
        {
          text: "Votre volume de trading sur la plateforme au cours du mois civil précédent, recalculé chaque jour.",
          explanation:
            "Correct. Votre palier repose uniquement sur ce que vous avez tradé sur la plateforme le mois civil précédent, et il est recalculé chaque jour, ce qui lui permet de monter ou de descendre selon l'évolution de votre volume.",
        },
        {
          text: "Le fait d'avoir effectué un paiement ponctuel pour débloquer un palier supérieur.",
          explanation:
            "Non. Il n'existe aucun moyen d'acheter directement un palier — les paliers résultent uniquement du volume de trading réel, et un abonnement Premium modifie le pourcentage payé au sein d'un palier, pas le palier lui-même.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
