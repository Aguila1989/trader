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
  ],
};
