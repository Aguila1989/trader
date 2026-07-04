// Chapitre 39 : Configurer le trading par IA. Voir content/en/chapter39.ts
// pour la note structurelle (traduction naturelle, pas mot à mot).
import type { Chapter } from "../../types";

export const chapter39: Chapter & { whoFor: string } = {
  id: "c39",
  number: 39,
  level: "BASIC",
  whoFor: "Pour les utilisateurs Premium qui configurent le trading par IA pour la première fois",
  title: "Configurer le trading par IA",
  description:
    "Ce qu'est une clé API d'IA et pourquoi il en faut une, comment en obtenir une chez Anthropic, OpenAI, Google ou DeepSeek, et comment comprendre ce que l'IA vous coûte réellement.",
  lessons: [
    {
      id: "c39-l1",
      title: "Qu'est-ce qu'une clé API d'IA et pourquoi en avez-vous besoin ?",
      paragraphs: [
        "Quand l'IA trade pour vous, elle ne s'exécute pas à l'intérieur d'Atrium lui-même — chaque fois qu'elle doit « réfléchir », Atrium envoie une requête sur internet à un fournisseur de grand modèle de langage (une entreprise comme Anthropic, OpenAI, Google ou DeepSeek), qui renvoie une réponse. C'est cet aller-retour qui produit chaque proposition de trade par IA que vous voyez.",
        "Atrium ne revend pas d'accès à l'IA et n'ajoute aucune marge sur ce que ces fournisseurs facturent. Les utilisateurs Premium apportent plutôt leur propre clé API : un compte que vous créez directement chez le fournisseur de votre choix, facturé directement par ce fournisseur. Vous gardez ainsi toujours le contrôle du fournisseur et du modèle utilisés par votre trading par IA, et vous pouvez consulter et ajuster vos propres limites de dépense directement dans le tableau de bord de ce fournisseur, plutôt que de faire confiance à la marge d'un intermédiaire.",
        "Le plus simple est de voir une clé API comme un mot de passe personnel pour un service payant — quiconque la possède peut dépenser de l'argent sur votre compte chez ce fournisseur, elle doit donc être traitée avec le même soin qu'un mot de passe bancaire. Ce n'est ni votre identifiant Atrium, ni la clé secrète de votre portefeuille ; elle ne communique qu'avec le fournisseur d'IA, jamais avec le réseau Stellar.",
        "Atrium stocke votre clé API de façon chiffrée, avec le même chiffrement AES-256-GCM déjà utilisé pour protéger la clé secrète de votre portefeuille. La clé n'est déchiffrée qu'en mémoire, pendant une fraction de seconde, au moment exact où l'IA doit faire une requête — elle n'est jamais réécrite en clair sur le disque, jamais réaffichée à l'écran après votre première saisie, et jamais consignée dans un quelconque journal.",
      ],
      example:
        "Voyez Atrium comme un répartiteur et le fournisseur d'IA comme le véritable penseur : quand l'IA analyse le marché, le serveur d'Atrium récupère votre clé chiffrée, la déchiffre en mémoire juste le temps de faire une requête auprès, disons, d'Anthropic, reçoit une suggestion de trade, puis efface aussitôt la copie déchiffrée. Vous ne revoyez plus jamais la clé après le jour où vous l'avez saisie, et rien à son sujet n'apparaît jamais dans les journaux d'Atrium.",
    },
    {
      id: "c39-l2",
      title: "Comment obtenir une clé API Claude (Anthropic)",
      paragraphs: [
        "Anthropic est l'entreprise derrière la famille de modèles Claude, dont Claude Sonnet et Claude Opus, tous deux utilisables par Atrium pour le trading par IA. Pour obtenir une clé, rendez-vous sur console.anthropic.com dans votre navigateur et connectez-vous, ou créez un nouveau compte si vous n'en avez pas encore.",
        "Une fois connecté, trouvez la section API Keys dans la console, cliquez sur Create Key, donnez-lui un nom si on vous le demande (quelque chose comme « Atrium trading » la rendra facile à reconnaître plus tard), et copiez la clé générée. C'est la seule fois où la clé complète vous est montrée — Anthropic ne l'affichera plus jamais ensuite, alors copiez-la immédiatement avant de changer de page.",
        "Les coûts d'API d'IA sont facturés directement par Anthropic sur votre compte. Ils sont entièrement distincts de votre abonnement Atrium. Le coût typique du trading par IA se situe environ entre 0,001 € et 0,05 € par proposition de trade, selon le modèle choisi et la quantité de données de marché intégrées à chaque analyse. Il vaut la peine de vérifier votre consommation de temps en temps dans la console d'Anthropic elle-même, où vous voyez exactement ce que vous avez dépensé et pouvez fixer des limites de dépense.",
        "De retour dans Atrium, collez la clé dans Paramètres → Compte → Clé API d'IA, choisissez Anthropic comme fournisseur, cliquez sur Tester la connexion pour confirmer qu'elle fonctionne, puis sur Enregistrer.",
        "Traitez cette clé comme n'importe quel autre mot de passe : ne la partagez avec personne, et ne la collez nulle part ailleurs que dans ce champ de paramètres d'Atrium.",
      ],
      example:
        "Vous vous connectez à console.anthropic.com, cliquez sur API Keys → Create Key, la nommez « Atrium trading », et copiez la chaîne affichée (elle commence par sk-ant-...). Dans Atrium, vous ouvrez Paramètres → Compte → Clé API d'IA, sélectionnez Anthropic dans la liste des fournisseurs, collez la clé, cliquez sur Tester la connexion et voyez un message de succès vert, puis cliquez sur Enregistrer — le trading par IA peut désormais utiliser Claude.",
    },
    {
      id: "c39-l3",
      title: "Comment obtenir une clé API GPT (OpenAI)",
      paragraphs: [
        "OpenAI est l'entreprise derrière la famille de modèles GPT, dont GPT-4 et GPT-4o, qu'Atrium peut également utiliser pour le trading par IA. Pour obtenir une clé, rendez-vous sur platform.openai.com dans votre navigateur et connectez-vous, ou créez un compte si vous n'en avez pas encore.",
        "Sur la plateforme, trouvez la section API Keys, cliquez sur Create new secret key, donnez-lui un nom reconnaissable comme « Atrium trading », et copiez la clé immédiatement — comme chez Anthropic, OpenAI n'affiche la clé complète qu'une seule fois, au moment de sa création.",
        "Les coûts d'API d'IA sont ici facturés directement par OpenAI sur votre compte, entièrement distincts de votre abonnement Atrium. Le coût typique du trading par IA se situe environ entre 0,001 € et 0,05 € par proposition de trade, selon le modèle et la taille de chaque analyse. Le tableau de bord d'OpenAI affiche un total de consommation en continu, donc consultez-le périodiquement pour surveiller vos dépenses.",
        "De retour dans Atrium, collez la clé dans Paramètres → Compte → Clé API d'IA, choisissez OpenAI comme fournisseur, cliquez sur Tester la connexion pour confirmer qu'elle fonctionne, puis sur Enregistrer.",
        "Comme toujours : ne partagez cette clé avec personne, et ne la collez nulle part ailleurs que dans ce champ de paramètres d'Atrium.",
      ],
      example:
        "Vous vous connectez à platform.openai.com, ouvrez API Keys, cliquez sur Create new secret key, la nommez « Atrium trading », et copiez la chaîne affichée (elle commence par sk-...). Dans Atrium, vous ouvrez Paramètres → Compte → Clé API d'IA, sélectionnez OpenAI dans la liste des fournisseurs, collez la clé, cliquez sur Tester la connexion et voyez un message de succès vert, puis cliquez sur Enregistrer — le trading par IA peut désormais utiliser GPT.",
    },
    {
      id: "c39-l4",
      title: "Comment obtenir une clé API Gemini (Google)",
      paragraphs: [
        "Google propose la famille de modèles Gemini, dont Gemini Pro et Gemini Ultra, comme autre option pour le trading par IA dans Atrium. Pour obtenir une clé, rendez-vous sur aistudio.google.com dans votre navigateur et connectez-vous avec votre compte Google.",
        "Dans Google AI Studio, cherchez le bouton Get API Key, suivez les instructions pour créer une nouvelle clé (il se peut qu'on vous demande de la lier à un projet Google Cloud), et copiez la clé une fois générée.",
        "Les coûts d'API d'IA sont ici facturés directement par Google sur votre compte, entièrement distincts de votre abonnement Atrium. Le coût typique du trading par IA se situe environ entre 0,001 € et 0,05 € par proposition de trade, selon le modèle et la taille de l'analyse. La console de facturation de Google Cloud affiche votre consommation, donc il vaut la peine d'y jeter un œil périodiquement et de configurer une alerte de budget si vous voulez être prévenu tôt.",
        "De retour dans Atrium, collez la clé dans Paramètres → Compte → Clé API d'IA, choisissez Google comme fournisseur, cliquez sur Tester la connexion pour confirmer qu'elle fonctionne, puis sur Enregistrer.",
        "Comme toujours : ne partagez cette clé avec personne, et ne la collez nulle part ailleurs que dans ce champ de paramètres d'Atrium.",
      ],
      example:
        "Vous vous connectez à aistudio.google.com, cliquez sur Get API Key, suivez les instructions pour en créer une, et copiez la chaîne affichée. Dans Atrium, vous ouvrez Paramètres → Compte → Clé API d'IA, sélectionnez Google dans la liste des fournisseurs, collez la clé, cliquez sur Tester la connexion et voyez un message de succès vert, puis cliquez sur Enregistrer — le trading par IA peut désormais utiliser Gemini.",
    },
    {
      id: "c39-l5",
      title: "Comment obtenir une clé API DeepSeek",
      paragraphs: [
        "DeepSeek est un autre fournisseur d'IA pris en charge par Atrium, souvent le moins cher des quatre à l'usage. Pour obtenir une clé, rendez-vous sur platform.deepseek.com dans votre navigateur et connectez-vous, ou créez un compte si vous n'en avez pas encore.",
        "Sur la plateforme, trouvez la section API Keys, cliquez sur Create Key, donnez-lui un nom reconnaissable comme « Atrium trading », et copiez la clé immédiatement — comme les autres fournisseurs, DeepSeek n'affiche la clé complète qu'une seule fois.",
        "Les coûts d'API d'IA sont ici facturés directement par DeepSeek sur votre compte, entièrement distincts de votre abonnement Atrium. Le coût typique du trading par IA se situe environ entre 0,001 € et 0,05 € par proposition de trade, et DeepSeek est généralement le moins cher des fournisseurs pris en charge par requête. Son tableau de bord affiche votre consommation en continu, donc consultez-le périodiquement pour suivre vos dépenses.",
        "De retour dans Atrium, collez la clé dans Paramètres → Compte → Clé API d'IA, choisissez DeepSeek comme fournisseur, cliquez sur Tester la connexion pour confirmer qu'elle fonctionne, puis sur Enregistrer.",
        "Comme toujours : ne partagez cette clé avec personne, et ne la collez nulle part ailleurs que dans ce champ de paramètres d'Atrium.",
      ],
      example:
        "Vous vous connectez à platform.deepseek.com, ouvrez API Keys, cliquez sur Create Key, la nommez « Atrium trading », et copiez la chaîne affichée. Dans Atrium, vous ouvrez Paramètres → Compte → Clé API d'IA, sélectionnez DeepSeek dans la liste des fournisseurs, collez la clé, cliquez sur Tester la connexion et voyez un message de succès vert, puis cliquez sur Enregistrer — le trading par IA peut désormais utiliser DeepSeek, généralement au coût par requête le plus bas des quatre.",
    },
    {
      id: "c39-l6",
      title: "Comprendre vos coûts d'API d'IA",
      paragraphs: [
        "Chaque fois que l'IA évalue le marché et produit une proposition de trade, cette « réflexion » coûte un petit montant — typiquement entre 0,001 € et 0,05 € environ, selon le fournisseur et le modèle choisis et la quantité de données de marché incluses dans cette analyse précise. C'est un montant minuscule par proposition, mais cela s'accumule avec la fréquence.",
        "C'est le point clé à comprendre sur la mise à l'échelle : les coûts dépendent surtout de la fréquence à laquelle l'IA analyse le marché, pas du volume que vous tradez. Un intervalle d'analyse automatique plus court signifie plus d'analyses par jour, donc plus de frais individuels facturés par votre fournisseur d'IA, même les jours où l'IA ne finit par rien proposer de valable. Si vous voulez garder des coûts d'IA prévisibles, l'intervalle d'analyse est le levier qui compte le plus.",
        "Il est utile de voir vos coûts comme trois enveloppes totalement distinctes. Votre abonnement Atrium (Premium, facturé mensuellement ou annuellement) paie pour la plateforme elle-même. Les frais de trade sont payés en XLM à la plateforme sur chaque trade que vous effectuez, manuel ou par IA, à un pourcentage fixé par votre palier de frais. L'usage de l'IA est payé directement au fournisseur d'IA que vous avez choisi, pour chaque analyse et proposition qu'il génère. Ces trois enveloppes ne se chevauchent jamais et ne sont jamais regroupées — chacune est facturée par une partie différente, pour une chose différente.",
        "Le tableau de bord de chaque fournisseur permet de fixer des limites de dépense ou des alertes de budget, et cela vaut la peine de le faire une fois lors de la configuration de votre clé : la console d'Anthropic, la plateforme d'OpenAI, la console de facturation de Google Cloud, et le tableau de bord de DeepSeek offrent tous une forme de plafond mensuel ou de notification d'usage, pour être alerté tôt si les coûts grimpent plus vite que prévu.",
        "Si une clé vient à manquer de crédit ou atteint une limite de dépense que vous avez fixée, le fournisseur d'IA commencera à rejeter les requêtes. Dans Atrium, cela signifie simplement que les propositions de trade par IA cessent d'apparaître, avec une erreur claire affichée à l'endroit où la proposition aurait dû se trouver — cela n'affecte ni votre compte, ni votre portefeuille, ni votre capacité à trader. Le trading manuel continue de fonctionner exactement comme avant, puisqu'il ne dépend jamais d'un fournisseur d'IA ; il vous suffira de recharger du crédit ou d'augmenter la limite chez votre fournisseur pour que les propositions d'IA reprennent.",
      ],
      example:
        "Disons que vous utilisez Claude Sonnet avec un intervalle d'analyse automatique de 15 minutes — cela fait 96 analyses par jour, chacune coûtant quelques millièmes d'euro, ce qui reste bien en dessous d'un euro par jour en coûts d'IA même une journée active. Par ailleurs, votre abonnement Premium facture 10 € ce mois-là quel que soit votre volume de trading, et chaque trade exécuté paie ses propres petits frais en XLM selon votre palier de volume. Un jour, votre clé Anthropic atteint le plafond mensuel de 20 € que vous aviez fixé dans sa console : les propositions d'IA s'arrêtent avec un message d'erreur dans Atrium, mais vous pouvez toujours ouvrir l'onglet Manuel et trader à la main sans aucune interruption, et augmenter le plafond (ou attendre le mois suivant) ramène immédiatement les propositions d'IA.",
    },
  ],
  quiz: [
    {
      id: "c39-q1",
      prompt: "Qui vous facture réellement pour l'usage de l'IA lorsqu'elle analyse le marché ou produit une proposition de trade ?",
      options: [
        {
          text: "Le fournisseur d'IA que vous avez choisi (Anthropic, OpenAI, Google ou DeepSeek), directement et séparément de votre abonnement Atrium.",
          explanation:
            "Correct. Atrium ne revend pas d'accès à l'IA et n'ajoute pas de marge — vous apportez votre propre clé API, et le fournisseur derrière celle-ci facture directement votre compte pour ce que l'IA utilise.",
        },
        {
          text: "Atrium, inclus dans votre abonnement Premium mensuel.",
          explanation:
            "Non. Votre abonnement Premium ne paie que pour la plateforme elle-même. L'usage de l'IA est un coût distinct, facturé directement par le fournisseur d'IA dont vous avez fourni la clé.",
        },
        {
          text: "Personne — l'usage de l'IA est gratuit dès que vous avez un abonnement Premium.",
          explanation:
            "Non. Chaque requête à l'IA coûte un petit montant, facturé par le fournisseur sur le compte derrière votre clé API — c'est de l'argent réel, généralement un montant très faible par proposition.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q2",
      prompt: "Où devez-vous coller la clé API de votre fournisseur d'IA dans Atrium ?",
      options: [
        {
          text: "Paramètres → Compte → Clé API d'IA, et nulle part ailleurs.",
          explanation:
            "Correct. Ce champ de paramètres unique est le seul endroit où votre clé doit jamais être collée dans Atrium — traitez-la comme un mot de passe et ne la collez jamais ailleurs.",
        },
        {
          text: "Directement dans un message de discussion à l'IA, pour qu'elle puisse s'identifier auprès de son fournisseur.",
          explanation:
            "Non. L'IA ne vous demande jamais votre clé en conversation. Elle n'a sa place que dans Paramètres → Compte → Clé API d'IA.",
        },
        {
          text: "Dans l'onglet Bot de la page Trading, à côté du réglage Lecture seule / Paper / Live.",
          explanation:
            "Non. Le réglage d'accès au trading et la clé API se trouvent à des endroits différents — la clé a sa place dans Paramètres → Compte → Clé API d'IA.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q3",
      prompt: "Que devient réellement votre clé API une fois enregistrée dans Atrium ?",
      options: [
        {
          text: "Elle est stockée chiffrée (le même chiffrement AES-256-GCM que pour les clés de portefeuille) et déchiffrée seulement en mémoire, un instant, à chaque requête de l'IA — elle n'est plus jamais affichée ni consignée dans un journal.",
          explanation:
            "Correct. La clé est protégée de la même façon que la clé secrète de votre portefeuille : chiffrée au repos, brièvement déchiffrée en mémoire seulement au moment de l'usage, jamais réaffichée, et jamais écrite dans un journal.",
        },
        {
          text: "Elle est stockée en texte clair pour que le support puisse vous la relire si vous l'oubliez.",
          explanation:
            "Non. La clé est chiffrée au repos et n'est plus jamais affichée après votre première saisie — il n'existe aucun moyen de la récupérer ou de l'afficher plus tard, ni pour vous ni pour quiconque d'autre.",
        },
        {
          text: "Elle est transmise en permanence aux serveurs d'Atrium et réutilisée pour les requêtes d'IA de tous les utilisateurs.",
          explanation:
            "Non. Votre clé n'appartient qu'à vous — elle n'est déchiffrée que momentanément pour faire une requête en votre nom, et n'est jamais partagée avec d'autres utilisateurs ni réutilisée pour eux.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q4",
      prompt: "Lequel de ces éléments n'a AUCUNE influence sur ce que vous dépensez en coûts d'API d'IA ?",
      options: [
        {
          text: "Depuis combien de temps vous avez créé votre compte Atrium.",
          explanation:
            "Correct — c'est celui qui n'a aucune importance. L'ancienneté du compte n'a strictement aucun effet sur les coûts d'IA.",
        },
        {
          text: "La fréquence à laquelle l'IA analyse automatiquement le marché.",
          explanation:
            "Cela a de l'importance — un intervalle d'analyse plus court signifie plus d'analyses par jour, et chaque analyse est une requête facturée séparément par votre fournisseur d'IA.",
        },
        {
          text: "Le fournisseur et le modèle que vous avez choisis.",
          explanation:
            "Cela a de l'importance — différents fournisseurs et modèles facturent des montants différents par requête, ce qui explique en partie pourquoi Atrium vous laisse apporter votre propre clé et choisir librement.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
