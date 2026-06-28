import type { Chapter } from "../../types";

export const chapter14: Chapter = {
  id: "c14",
  number: 14,
  level: "BASIC",
  title: "Votre compte et vos données",
  description:
    "Ce qu'est un compte utilisateur, comment vos données de trading restent séparées de celles des autres, et ce qu'il advient d'elles si vous supprimez un jour votre compte.",
  lessons: [
    {
      id: "c14-l1",
      title: "Qu'est-ce qu'un compte utilisateur et pourquoi est-ce important ?",
      paragraphs: [
        "Un compte est votre espace privé personnel au sein de l'application. C'est ce qui permet au tableau de bord de savoir quels trades, réglages, stop loss et historiques vous appartiennent à vous et à personne d'autre. Une fois connecté à votre compte, tout ce que vous voyez et tout ce que fait le bot est lié à vous seul.",
        "Pensez à votre compte comme à un casier personnel. Vous seul en avez la clé. Tout ce que vous y déposez — votre historique de trading, vos réglages de risque, vos stop loss enregistrés — reste dans votre casier, et aucun autre utilisateur ne peut l'ouvrir ni jeter un œil à ce qui s'y trouve.",
        "C'est important parce que le trading est quelque chose de personnel. Vos décisions, vos chiffres et vos erreurs ne regardent personne d'autre. Un compte garde vos informations privées et veille à ce que le bot agisse selon vos réglages, et non selon ceux de quelqu'un d'autre.",
      ],
      example:
        "Imaginez que deux personnes utilisent cette application. L'une fixe une limite de risque prudente et ne trade que de petits montants. L'autre laisse l'IA trader de façon plus agressive. Comme chaque personne a son propre compte — son propre casier — la limite du trader prudent n'est jamais mélangée avec celle du trader agressif. Chaque compte conserve ses propres réglages, son propre historique et son propre portefeuille, totalement séparés.",
    },
    {
      id: "c14-l2",
      title: "Comment vos données de trading restent séparées de celles des autres utilisateurs",
      paragraphs: [
        "En coulisses, chaque information que l'application enregistre — un trade, une ligne de journal, un stop loss, un réglage — porte l'estampille de l'identifiant du compte auquel elle appartient. Lorsque vous ouvrez le tableau de bord, l'application ne relit jamais que les lignes estampillées avec votre identifiant.",
        "C'est ce qui empêche les casiers de déborder les uns sur les autres. Même si les données de tout le monde vivent dans la même base de données, vos trades ne peuvent jamais apparaître sur l'écran d'un autre utilisateur, car l'application filtre d'abord tout selon votre compte.",
        "Cela signifie aussi que vos limites journalières, vos profits et pertes réalisés et vos résultats de scan sont calculés uniquement à partir de votre propre activité. Une autre personne qui trade sur le même serveur ne fait pas bouger vos chiffres d'un seul centime.",
      ],
      example:
        "Supposons que la base de données contienne 10 000 trades provenant de nombreux utilisateurs. Lorsque vous ouvrez votre historique, l'application ne demande que les trades estampillés avec l'identifiant de votre compte, si bien que vous pourriez n'en voir que 40 — les vôtres. Les 9 960 autres vous restent invisibles, exactement comme vos trades restent invisibles pour tout le monde.",
    },
    {
      id: "c14-l3",
      title: "Qu'advient-il de vos données si vous supprimez votre compte ?",
      paragraphs: [
        "Supprimer votre compte efface votre casier et tout ce que l'application y conserve. Vos trades enregistrés, vos réglages, vos stop loss, vos alertes et vos journaux sont effacés des registres de l'application, de sorte que plus personne ne peut les lire.",
        "Il y a une chose que la suppression ne peut pas défaire : la blockchain elle-même. Comme vous l'avez vu dans le premier chapitre, un trade déjà exécuté sur Stellar est permanent et public. Supprimer votre compte efface la copie de votre historique que détient l'application, mais cela ne peut pas réécrire le registre public des trades qui ont déjà eu lieu sur la chaîne.",
        "Votre portefeuille est lui aussi distinct de votre compte. Vos fonds vivent sur le réseau Stellar sous vos propres clés, et non à l'intérieur de cette application, donc supprimer votre compte ne touche pas à vos coins. (La connexion et la suppression d'un compte arriveront à une étape ultérieure ; cette leçon explique ce que cela fera, et ne fera pas, à vos données.)",
      ],
      example:
        "Disons que vous supprimez votre compte après un mois de trading. L'application oublie vos réglages, vos stop loss et votre historique enregistré — ils ont disparu du tableau de bord. Mais si vous recherchez vos anciens trades sur un explorateur Stellar public, ils y sont toujours, car la blockchain conserve son propre registre permanent qu'aucune application ne peut effacer.",
    },
  ],
  quiz: [
    {
      id: "c14-q1",
      prompt: "Pourquoi l'application donne-t-elle à chaque personne son propre compte ?",
      options: [
        {
          text: "Pour que tout le monde puisse partager un même ensemble commun de réglages et d'historique.",
          explanation:
            "Non. L'intérêt de comptes séparés est exactement l'inverse : les réglages et l'historique de chaque personne lui sont privés, et non partagés.",
        },
        {
          text: "Pour que les trades, les réglages et l'historique de chaque personne restent privés et séparés, comme un casier personnel que seul son propriétaire peut ouvrir.",
          explanation:
            "Correct. Un compte est votre casier privé : vos données vous appartiennent et aucun autre utilisateur ne peut les voir ni les modifier.",
        },
        {
          text: "Pour que l'application puisse montrer vos trades à d'autres utilisateurs à des fins de comparaison.",
          explanation:
            "Non. Vos trades sont privés à votre compte et ne sont jamais montrés à d'autres utilisateurs.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c14-q2",
      prompt:
        "Les données de nombreux utilisateurs vivent dans la même base de données. Comment l'application vous empêche-t-elle de voir les trades d'un autre utilisateur ?",
      options: [
        {
          text: "Elle estampille chaque ligne avec un identifiant de compte et ne relit jamais que les lignes estampillées avec le vôtre.",
          explanation:
            "Correct. Chaque trade, journal et réglage porte l'identifiant de compte de son propriétaire, et l'application filtre selon votre identifiant, de sorte que vous ne voyez jamais que vos propres données.",
        },
        {
          text: "Elle se contente de faire confiance à chaque utilisateur pour qu'il ne regarde pas les données des autres.",
          explanation:
            "Non. La séparation ne repose pas sur la confiance. L'application filtre techniquement chaque lecture selon l'identifiant de votre compte.",
        },
        {
          text: "Elle ne conserve les données que d'un seul utilisateur à la fois et supprime celles de tous les autres.",
          explanation:
            "Non. Les données de tous les utilisateurs peuvent être stockées en même temps ; l'application les garde séparées par identifiant de compte plutôt que de supprimer celles de qui que ce soit.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c14-q3",
      prompt: "Vous supprimez votre compte après avoir tradé pendant un certain temps. Que se passe-t-il ?",
      options: [
        {
          text: "L'application efface vos réglages enregistrés, vos stop loss et votre historique, mais les trades déjà exécutés sur Stellar restent sur la blockchain publique, et les fonds de votre portefeuille ne sont pas touchés.",
          explanation:
            "Correct. La suppression efface vos données de l'application, mais le registre des trades passés sur la chaîne est permanent sur la blockchain, et vos coins vivent dans votre portefeuille, pas dans l'application.",
        },
        {
          text: "Chaque trade que vous avez jamais effectué est lui aussi effacé de la blockchain.",
          explanation:
            "Non. La blockchain est permanente et publique ; aucune application ne peut effacer un trade déjà exécuté sur la chaîne.",
        },
        {
          text: "Vos coins sont supprimés en même temps que votre compte.",
          explanation:
            "Non. Vos fonds vivent sur le réseau Stellar sous vos propres clés, donc supprimer votre compte ne touche pas à vos coins.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
