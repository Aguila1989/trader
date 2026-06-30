import type { Chapter } from "../../types";

export const chapter21: Chapter = {
  id: "c21",
  number: 21,
  level: "EXPERT",
  title: "Évaluation des tokens sur la chaîne Stellar",
  description: "Les mécanismes derrière les scores : ce que mesurent les agrégations de transactions de Horizon, comment la profondeur du carnet d'ordres est additionnée, ce que révèle vraiment le nombre de trustlines, comment lire 12 semaines d'historique de scores, et quand passer outre l'IA.",
  lessons: [
    {
      id: "c21-l1",
      title: "Comment fonctionnent les agrégations de transactions de Horizon",
      paragraphs: [
        "Les chiffres de volume affichés dans le scan proviennent du point d'accès des agrégations de transactions de Horizon. Il regroupe les transactions exécutées pour une paire d'actifs dans des intervalles de temps fixes — l'application utilise des intervalles horaires pour le chiffre sur 24 heures et des intervalles journaliers pour le chiffre sur 7 jours — et indique, par intervalle, le prix d'ouverture/de clôture, le plus haut/le plus bas, le nombre de transactions et le volume de l'actif de base échangé.",
        "Deux détails comptent. Premièrement, il s'agit de l'activité DEX réglée sur la chaîne pour cette paire précise (le token contre XLM), et non d'un chiffre rapporté par une plateforme d'échange ni des swaps de pools AMM que le scan du carnet d'ordres ne peut pas voir — un token dont la liquidité se trouve face à USDC ou dans un pool peut donc sembler plus mince ici qu'il ne l'est en réalité. Deuxièmement, Horizon omet entièrement les intervalles vides, si bien que « 24 chandeliers horaires » sur un marché peu actif peuvent en fait s'étaler sur plusieurs jours.",
        "L'application additionne le volume de base sur l'ensemble des intervalles pour obtenir ses chiffres de volume sur 24 h et sur 7 jours, et compare l'ouverture du premier intervalle avec la clôture du dernier pour qualifier la tendance sur 7 jours de haussière, stable ou baissière. Connaître la source explique les limites : un faible volume ici signifie un faible volume DEX sur la paire XLM spécifiquement, ce qui est le signal honnête pour savoir si vous pourriez réellement échanger le token sur ce lieu de marché.",
      ],
      example: "Un token affiche un volume sur 7 jours de 40 000 d'après les agrégations journalières contre XLM. Vous vérifiez et ne voyez que 5 intervalles journaliers non vides — les échanges ont eu lieu 5 jours sur 7. Le chiffre est réel mais irrégulier, et il ne dit rien sur le marché USDC peut-être plus profond de ce token. Vous le pondérez en conséquence plutôt que de lire 40 000 comme une liquidité journalière régulière.",
    },
    {
      id: "c21-l2",
      title: "Comment la profondeur du carnet d'ordres est calculée",
      paragraphs: [
        "La profondeur dans le scan est un instantané de la liquidité disponible, distincte du volume échangé. L'application récupère le carnet d'ordres en direct du token contre XLM et additionne les montants des dix meilleurs niveaux d'achat et des dix meilleurs niveaux de vente, normalisés en unités de l'actif de base. Le volume vous dit ce qui a été échangé ; la profondeur vous dit ce qui est posé là, prêt à être échangé dès maintenant.",
        "La profondeur est ce qui détermine votre slippage sur un ordre réel. Un carnet avec une grande taille empilée près du meilleur prix absorbe une transaction conséquente avec peu de mouvement de prix ; un carnet mince signifie qu'un ordre même modeste traverse plusieurs niveaux et se remplit à un prix moyen bien moins favorable. Deux tokens au volume sur 24 h identique peuvent avoir des profondeurs totalement différentes, et le plus mince est le plus dangereux à l'entrée comme à la sortie.",
        "Comme il s'agit d'un instantané à un instant précis, la profondeur peut changer d'une minute à l'autre, et un seul gros ordre posé peut la flatter. Lisez-la conjointement avec le volume et le spread : une liquidité saine, c'est un volume régulier, un spread serré et de la profondeur des deux côtés du carnet — pas seulement un chiffre impressionnant isolé.",
      ],
      example: "Le token A et le token B affichent tous deux un volume sur 24 h proche de 50 000. Mais la profondeur des dix meilleurs niveaux de A totalise 30 000 unités de base avec un spread de 20 bps, tandis que celle de B totalise 1 200 avec un spread de 400 bps. Une sortie de 10 000 unités déplace à peine le prix de A ; sur B, elle traverse tous les niveaux. Même volume, liquidité réelle très différente — c'est la profondeur qui vous l'a indiqué.",
    },
    {
      id: "c21-l3",
      title: "Ce que révèle le nombre de trustlines sur l'adoption",
      paragraphs: [
        "Le nombre de trustlines provient du point d'accès des actifs de Horizon — le champ num_accounts — et correspond au nombre de comptes qui ont ouvert une trustline vers ce token. C'est l'indicateur indirect d'adoption le plus large disponible : combien de comptes distincts ont choisi de pouvoir détenir cet actif. Un token avec 15 000 trustlines a franchi une barre très différente d'un token qui en a 30.",
        "Mais sachez exactement ce que cela signifie et ne signifie pas. Cela compte les détenteurs (ceux qui ont ouvert une trustline), pas les traders actifs, et cela inclut les comptes dormants et à solde nul — chaque compte ayant un jour ouvert la trustline sans l'avoir refermée. C'est donc une mesure de portée cumulée, pas d'activité actuelle. Un nombre élevé avec un volume quasi nul est un token jadis adopté et désormais silencieux.",
        "La façon la plus utile de l'utiliser est comme dénominateur et comme tendance. Recoupez-le avec le volume et la profondeur : de nombreux détenteurs plus une vraie liquidité, c'est une adoption authentique ; de nombreux détenteurs sans liquidité, c'est un token figé ou abandonné. Et d'une semaine à l'autre, un nombre de trustlines en baisse — des détenteurs qui ferment activement leur position — est l'un des déclencheurs de détérioration, précisément parce que des gens qui partent constituent un signal significatif.",
      ],
      example: "Un token affiche 9 000 trustlines, ce qui paraît solide — jusqu'à ce que vous remarquiez un volume sur 24 h proche de zéro et un prix plat depuis des semaines. Le recoupement révèle un actif qui a attiré des détenteurs il y a longtemps et qui est désormais dormant. La semaine suivante, le nombre indique 8 000 : une baisse de 11 % déclenche l'avertissement « moins de détenteurs », confirmant que les détenteurs partent activement plutôt que de rester simplement inactifs.",
    },
    {
      id: "c21-l4",
      title: "Interpréter 12 semaines d'historique de scores",
      paragraphs: [
        "Chaque scan hebdomadaire stocke un instantané par token, et l'application conserve au moins 12 semaines de cet historique. Les scores d'une semaine sont une photo ; douze semaines, c'est un film. La trajectoire du score global et de ses quatre composantes est bien plus instructive qu'une lecture isolée, car elle montre si un token se renforce, se dégrade, ou n'est que bruité.",
        "Cherchez la direction et la constance. Un token dont les scores de légitimité et de liquidité tiennent bon ou grimpent sur de nombreuses semaines gagne en confiance ; un token dont les scores s'érodent vous dit quelque chose même si aucune semaine ne déclenche d'avertissement. Distinguez une vraie tendance d'un soubresaut ponctuel — une seule mauvaise semaine parmi onze bonnes est généralement du bruit, alors que trois baisses consécutives sont un schéma.",
        "Les déclencheurs d'une semaine sur l'autre se basent sur des variations d'un seul pas, mais la vue sur 12 semaines est là où vous repérez l'hémorragie lente que ces seuils peuvent manquer — un token glissant de 8 à 7 à 6 à 5 sur un mois ne déclenche jamais la règle de baisse de deux points en une seule semaine, et pourtant il s'est nettement détérioré. Utilisez l'historique pour confirmer qu'un avertissement fait partie d'une tendance, ou pour repérer une dégradation que les déclencheurs n'ont pas encore signalée.",
      ],
      example: "Un token ne déclenche jamais d'avertissement, mais son score global sur 12 semaines indique 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3 — un glissement mensuel régulier que la règle des deux points sur une seule semaine n'attrape jamais. C'est le film, pas la photo, qui vous dit d'alléger ou de sortir. Un autre token oscille à 7, 8, 6, 8, 7 — bruité mais sans tendance, et sans raison de s'alarmer.",
    },
    {
      id: "c21-l5",
      title: "Quand passer outre une suggestion de l'IA et comment le documenter",
      paragraphs: [
        "C'est vous qui décidez en dernier ressort, et il existe de bonnes raisons de contredire le scan dans les deux sens. Vous pourriez refuser un token bien noté parce que vous disposez d'une connaissance hors chaîne que le modèle n'a pas — un litige connu au sein de l'équipe, un nuage réglementaire, un risque de depeg. Ou vous pourriez ajouter un token mal noté parce que vous comprenez pourquoi son score est bas et que vous acceptez ce risque délibérément, par exemple un projet tout neuf mais crédible que le modèle pénalise uniquement pour son court historique.",
        "Passez outre sur la base de preuves, pas d'une intuition. Avant d'aller à l'encontre d'un score, notez les faits précis qui le justifient : ce que le scan a vu, ce que vous savez qu'il ignore, et quels signaux concrets (identité de l'émetteur, profondeur, tendance des détenteurs, contenu du TOML) appuient votre décision. Si vous ne parvenez pas à formuler une raison pour laquelle le modèle a tort, c'est généralement le signe qu'il faut vous y conformer.",
        "Documenter votre raisonnement est ce qui rend les décisions de contournement révisables plus tard. Consignez la date, le token, les scores au moment des faits, votre décision et votre justification — la mise en veille d'un avertissement, une note dans votre propre journal, ou un commentaire à côté de la position. Quand vous y reviendrez dans quelques semaines, vous pourrez juger si votre choix était justifié par le résultat, et vous bâtissez un historique au lieu de répéter des intuitions non vérifiées.",
      ],
      example: "Le scan signale un token détenu avec un avertissement de détérioration, mais vous savez que la chute de volume est une panne d'une semaine sur une plateforme d'échange, pas une dégradation. Vous mettez l'avertissement en veille pour sept jours et notez : « 2026-07-01, token X, global 5 (était 7) ; la chute de volume est la fenêtre de maintenance de la plateforme Acme, pas les fondamentaux ; détenteurs et TOML inchangés ; à réexaminer au prochain scan. » La semaine suivante, les indicateurs se redressent, votre décision documentée est confirmée, et la note prouve pourquoi vous avez conservé.",
    },
  ],
  quiz: [
    {
      id: "c21-q1",
      prompt: "Un token affiche un volume sain sur 7 jours dans le scan, mais vous soupçonnez que l'essentiel de sa liquidité se trouve ailleurs. Que mesure réellement le chiffre de volume ?",
      options: [
        { text: "Les transactions DEX réglées sur la chaîne pour ce token contre XLM, additionnées à partir des intervalles d'agrégation de Horizon.", explanation: "Correct. Il s'agit du volume DEX sur la paire XLM spécifiquement — il exclut les pools AMM et les autres paires de cotation, si bien qu'un token fortement orienté USDC peut sembler plus mince ici qu'il ne l'est vraiment." },
        { text: "Le volume d'échange total du token sur toutes les plateformes et tous les lieux de marché dans le monde.", explanation: "Incorrect. Horizon ne rapporte que les transactions SDEX réglées pour la paire interrogée, pas le volume externe ou agrégé." },
        { text: "Le nombre de comptes détenant actuellement le token.", explanation: "Incorrect. C'est le nombre de trustlines issu du point d'accès des actifs, un indicateur entièrement différent." },
      ],
      correctIndex: 0,
    },
    {
      id: "c21-q2",
      prompt: "Deux tokens ont un volume sur 24 h quasiment identique, mais vous devez sortir rapidement d'une position importante. Quel indicateur vous indique le mieux ce que cette sortie coûtera ?",
      options: [
        { text: "Le nombre de trustlines, car plus de détenteurs signifie une sortie plus facile.", explanation: "Incorrect. Le nombre de détenteurs ne dit rien sur la liquidité disponible à l'instant présent ; vous pouvez avoir de nombreux détenteurs dormants et un carnet vide." },
        { text: "La profondeur du carnet d'ordres — la taille additionnée des meilleurs niveaux d'achat/de vente — car elle détermine votre slippage.", explanation: "Correct. La profondeur est la liquidité disponible maintenant ; un carnet mince fait traverser les niveaux à un gros ordre et le remplit à un prix moyen bien moins favorable, quel que soit le volume passé." },
        { text: "L'étiquette de tendance de prix sur 7 jours.", explanation: "Incorrect. La tendance vous donne la direction, pas la taille que le carnet peut absorber à la sortie." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q3",
      prompt: "Un token affiche 9 000 trustlines mais presque aucun volume d'échange et un prix plat. Quelle est la lecture la plus exacte ?",
      options: [
        { text: "Il est très actif en ce moment, car le nombre de trustlines prouve un trading en direct.", explanation: "Incorrect. Le nombre de trustlines inclut les comptes dormants et à solde nul ; il mesure la portée cumulée, pas l'activité actuelle." },
        { text: "Il a été adopté à un moment donné mais est désormais largement dormant — forte portée cumulée, peu d'activité actuelle.", explanation: "Correct. De nombreux détenteurs avec un volume quasi nul indiquent un token jadis adopté, désormais silencieux ; le nombre est un dénominateur, lisez-le face au volume et à la profondeur." },
        { text: "Le nombre de trustlines doit être une erreur, car les détenteurs échangent toujours.", explanation: "Incorrect. Les détenteurs restent fréquemment inactifs ; un nombre élevé sans volume est un schéma courant et significatif, pas une erreur de données." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q4",
      prompt: "Le score global d'un token détenu indique 8, 7, 6, 5 sur quatre semaines consécutives mais ne déclenche jamais l'avertissement de baisse de deux points. Que devez-vous tirer de l'historique sur 12 semaines ?",
      options: [
        { text: "Rien ne va mal, car aucune semaine n'a perdu deux points.", explanation: "Incorrect. Le déclencheur d'une seule semaine manque une baisse lente et régulière ; la trajectoire est tout l'intérêt de conserver l'historique." },
        { text: "Une nette tendance baissière que les seuils par semaine manquent — un signal pour alléger ou sortir.", explanation: "Correct. Quatre baisses consécutives d'un seul point ne déclenchent jamais la règle des deux points, et pourtant le film montre une détérioration évidente que la photo ne peut pas révéler." },
        { text: "Les scores ne sont que du bruit et peuvent être ignorés.", explanation: "Incorrect. Un glissement monotone sur quatre semaines est une tendance, pas du bruit ; la constance dans une seule direction est exactement ce sur quoi il faut agir." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q5",
      prompt: "Le scan signale un token détenu, mais vous disposez de preuves précises que la baisse est une panne temporaire d'une plateforme d'échange. Quelle est la façon disciplinée de passer outre l'avertissement ?",
      options: [
        { text: "Ignorer l'avertissement en silence et passer à autre chose, puisque vous avez le sentiment que tout va bien.", explanation: "Incorrect. Une intuition non documentée ne peut pas être révisée plus tard ; passez outre sur la base de preuves formulées, pas d'un sentiment." },
        { text: "Mettre l'avertissement en veille et consigner la date, les scores, votre raisonnement et un plan de réexamen pour que la décision soit révisable.", explanation: "Correct. Documenter les faits précis (ce que le scan a vu, ce que vous savez qu'il ignore, quand revérifier) rend le contournement responsable et bâtit un historique." },
        { text: "Vendre immédiatement toute la position par prudence.", explanation: "Incorrect. Si vos preuves indiquent que la baisse est temporaire, une sortie forcée contredit votre propre analyse ; le but est une décision raisonnée et documentée." },
      ],
      correctIndex: 1,
    },
  ],
};
