import type { Chapter } from "../../types";

export const chapter20: Chapter = {
  id: "c20",
  number: 20,
  level: "ADVANCED",
  title: "Lire les suggestions de trustlines de l'IA",
  description: "Comment l'analyse hebdomadaire note les tokens, ce qu'est un fichier TOML, comment lire un avertissement de dégradation, pourquoi un pic de volume peut être un piège, et pourquoi une suggestion est un point de départ — pas un verdict.",
  lessons: [
    {
      id: "c20-l1",
      title: "Comment l'application note les tokens en tant que candidats à une trustline",
      paragraphs: [
        "Une fois par semaine, l'application analyse les principaux tokens Stellar (ainsi que ceux que vous détenez déjà) et demande à l'IA de noter chacun d'eux en tant que candidat à une trustline. Chaque token reçoit quatre notes de 1 à 10, plus une note globale qui les résume. Les quatre sont : liquidité, légitimité, tendance et risque.",
        "La liquidité évalue la facilité avec laquelle vous pourriez échanger le token — son volume réel contre XLM et la profondeur de son carnet d'ordres. La légitimité évalue la crédibilité apparente du projet : un fichier stellar.toml publié, un vrai domaine d'accueil, un émetteur connu, une adoption authentique. La tendance évalue l'orientation récente du prix sur 7 jours. Le risque est noté de façon à ce qu'une note plus élevée soit plus sûre — un 10 signifie le risque le plus faible, un 1 signifie très risqué.",
        "Comme le risque suit la logique « plus haut = plus sûr », les quatre notes et la note globale pointent toutes dans le même sens : plus c'est élevé, mieux c'est. La note globale est le jugement de l'IA en un coup d'œil, mais les quatre composantes vous disent pourquoi. Un token peut avoir une excellente liquidité tout en ayant une faible note de légitimité, et c'est précisément cette combinaison que le détail est là pour révéler.",
      ],
      example: "Une fiche de suggestion affiche USDC avec une note Globale de 9, et en dessous Liquidité 9, Légitimité 10, Tendance 7, Sécurité 9. Une autre fiche affiche un nouveau token avec une note Globale de 4 : Liquidité 6 mais Légitimité 2 et Sécurité 3. Les seules notes globales vous attireraient vers le premier ; le détail explique précisément pourquoi le second obtient une note faible malgré une liquidité correcte.",
    },
    {
      id: "c20-l2",
      title: "Qu'est-ce qu'un fichier TOML et pourquoi son absence compte-t-elle ?",
      paragraphs: [
        "Un stellar.toml est un petit fichier public qu'un émetteur héberge sur son domaine d'accueil (par exemple à l'adresse example.com/.well-known/stellar.toml). C'est là qu'un projet légitime se déclare : le nom de l'organisation, le site web, les coordonnées de contact, et les comptes émetteurs exacts de ses tokens. C'est l'équivalent, sur la chaîne, d'une carte de visite vérifiable.",
        "L'analyse récupère ce fichier pour chaque token. Lorsqu'il existe, l'application peut vous montrer le nom du projet, sa description et son site web sur la fiche de suggestion, et vous pouvez vérifier que l'émetteur indiqué dans le fichier correspond à l'émetteur auquel vous accorderiez votre confiance. Lorsqu'il est absent, rien de tout cela n'est possible — vous feriez confiance à un émetteur qui a choisi de ne pas s'identifier.",
        "C'est pourquoi un TOML manquant est traité comme un signal d'alerte plutôt que comme un fait neutre. Cela ne prouve pas qu'un token est une arnaque, mais cela supprime le moyen le plus simple de vérifier le projet, et c'est une bonne raison d'être prudent. Un token qui perd un TOML qu'il avait auparavant est considéré comme encore plus préoccupant, car quelque chose qui était documenté a disparu dans l'ombre.",
      ],
      example: "Une suggestion affiche « Projet : Aquarius — aqua.network » tirée directement du TOML de l'émetteur, et la clé d'émetteur du fichier correspond à celle de la fiche. Une deuxième suggestion affiche « Aucun stellar.toml trouvé » accompagné d'un signal d'alerte correspondant. Même analyse, des niveaux d'identité vérifiable très différents.",
    },
    {
      id: "c20-l3",
      title: "Comment interpréter un avertissement de dégradation",
      paragraphs: [
        "Les suggestions pointent vers des tokens que vous pourriez ajouter ; les avertissements pointent vers des tokens que vous détenez déjà et dont la situation s'est détériorée depuis la semaine dernière. Chaque avertissement énumère les déclencheurs précis qui se sont activés, de sorte que vous ne devinez jamais pourquoi un token a été signalé. Le bot se contente d'avertir — il ne supprimera jamais une trustline à votre place.",
        "Il existe sept déclencheurs. Chute de note : la note globale a baissé de deux points ou plus d'une semaine à l'autre. Faible liquidité : la note de liquidité est inférieure à 3. Chute de volume : le volume sur 7 jours a diminué de plus de moitié. Nouveaux signaux d'alerte : un signal est apparu qui n'existait pas auparavant. Moins de détenteurs : le nombre de trustlines a baissé de plus de 10 %. TOML disparu : un stellar.toml qui existait auparavant n'est plus accessible. Tendance à la baisse : la tendance du prix est passée de haussière ou stable à baissière.",
        "Un seul déclencheur est une incitation à regarder ; plusieurs à la fois constituent un signal plus fort. La fiche affiche aussi votre solde actuel et sa valeur estimée en XLM, afin que vous puissiez évaluer ce qui est réellement en jeu avant de décider de faire des recherches, de conserver, de réduire ou de sortir. Vous pouvez mettre un avertissement en sourdine pendant sept jours si vous l'avez examiné et souhaitez y revenir plus tard.",
      ],
      example: "Un token que vous détenez affiche deux déclencheurs : « Chute de volume » et « Moins de détenteurs ». La fiche indique que le volume sur 7 jours a chuté de 64 % et que les détenteurs de trustlines ont baissé de 18 % (5 000 → 4 100), avec votre solde de 1 200 valant environ 90 XLM. Deux signes indépendants d'un projet qui perd de l'élan, plus une somme réelle en jeu — une incitation claire à enquêter plutôt qu'à ignorer.",
    },
    {
      id: "c20-l4",
      title: "Qu'est-ce qu'un pic de volume sans fondamentaux ?",
      paragraphs: [
        "Le volume d'échanges est généralement un signe sain, mais un pic soudain sans rien de réel derrière est tout le contraire. Un pic de volume sans fondamentaux est une explosion d'échanges qui ne s'accompagne d'aucune amélioration des éléments qui donnent de la valeur à un token — pas plus de détenteurs, pas d'actualité du projet, pas de carnet d'ordres plus profond, souvent aucun émetteur identifiable du tout.",
        "C'est un schéma de manipulation classique. Une poignée de comptes peut faire du wash trading sur un token, l'échangeant d'avant en arrière pour fabriquer du volume et le faire bien figurer dans les classements, en espérant que l'activité elle-même attire les acheteurs. Le prix bondit sous l'effet de cet intérêt artificiel, les initiés vendent dans la nouvelle demande, et le volume s'évapore aussi vite qu'il est apparu.",
        "C'est pourquoi l'IA est instruite de signaler un pic de volume sans fondamentaux comme un signal d'alerte plutôt que de le récompenser. Le volume n'a de sens que lorsqu'il est soutenu par une adoption et une liquidité authentiques. Lorsque le détail des notes affiche un volume récent élevé mais une légitimité faible et peu de détenteurs, c'est cette incohérence qui trahit la manœuvre.",
      ],
      example: "Un token grimpe en flèche dans le classement hebdomadaire à la faveur d'un bond de volume de 20x, mais son nombre de détenteurs reste figé à 40, il n'a pas de stellar.toml, et son carnet d'ordres est extrêmement mince. L'IA note sa tendance comme élevée mais sa légitimité et sa sécurité comme faibles, et ajoute le signal d'alerte « pic de volume soudain sans fondamentaux ». Le volume est réel ; la substance derrière ne l'est pas.",
    },
    {
      id: "c20-l5",
      title: "Utiliser les suggestions de l'IA comme un point de départ, pas comme une réponse finale",
      paragraphs: [
        "L'analyse est un assistant de recherche, pas un oracle. Elle condense une grande quantité de données on-chain en quelques notes pour que vous puissiez trier rapidement, mais elle s'appuie sur des signaux publics limités et sur le jugement d'un modèle de langage. Elle ne peut pas connaître les véritables intentions d'un émetteur ni lire l'actualité de demain. Une note élevée affine votre liste restreinte ; elle ne certifie pas un token.",
        "Chaque fiche de suggestion porte la même mise en garde pour une bonne raison : ajouter une trustline est toujours un risque, cela réserve 0,5 XLM, et cela vous expose à l'émetteur. N'ajoutez jamais une trustline sur la seule foi de la suggestion. Utilisez-la pour décider de ce qui mérite d'être examiné, puis vérifiez vous-même l'émetteur, le TOML, les détenteurs et la liquidité.",
        "Traitez les notes comme le point de départ d'une discussion avec votre propre due diligence. Le meilleur déroulé est le suivant : laisser l'analyse faire remonter les candidats, lire le détail et les signaux d'alerte, confirmer les faits de manière indépendante, et seulement ensuite décider. La décision finale — et la responsabilité — vous reviennent toujours.",
      ],
      example: "L'analyse suggère un token avec une note Globale de 8. Plutôt que de l'ajouter immédiatement, vous ouvrez son site web depuis le TOML, vous confirmez que la clé d'émetteur correspond, vous examinez l'évolution de son nombre de détenteurs sur plusieurs semaines, et vous vérifiez que le carnet d'ordres XLM est réellement profond. Tout tient la route, alors vous ajoutez la trustline de façon délibérée — la suggestion a lancé le processus, vos propres recherches l'ont conclu.",
    },
  ],
  quiz: [
    {
      id: "c20-q1",
      prompt: "Sur une fiche de suggestion, que signifie une note de risque (sécurité) élevée ?",
      options: [
        { text: "Le token est très risqué — plus c'est élevé, plus c'est dangereux.", explanation: "Incorrect. L'échelle est inversée par rapport à cette intuition : dans cette application, la note de risque/sécurité suit la logique plus haut = plus sûr." },
        { text: "Le token est moins risqué — 10 signifie le risque le plus faible, 1 signifie très risqué.", explanation: "Correct. Le risque est noté de façon à ce qu'une note plus élevée soit plus sûre, ce qui maintient les quatre notes et la note globale dans le même sens : plus c'est élevé, mieux c'est." },
        { text: "Le risque n'a rien à voir avec la note globale.", explanation: "Incorrect. Le risque est l'une des quatre composantes qui alimentent la note globale." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q2",
      prompt: "Pourquoi un stellar.toml manquant est-il considéré comme un signal d'alerte ?",
      options: [
        { text: "Parce que le token est automatiquement une arnaque sans lui.", explanation: "Incorrect. Un TOML manquant ne prouve pas la fraude — mais il supprime le moyen le plus simple de vérifier le projet, c'est pourquoi il est traité avec prudence." },
        { text: "Parce qu'il supprime le principal moyen d'identifier et de vérifier l'émetteur et le projet.", explanation: "Correct. Le TOML est l'endroit où un émetteur déclare son identité, son site web et ses clés d'émission ; sans lui, vous faites confiance à un émetteur qui ne s'est pas identifié." },
        { text: "Parce qu'il augmente la réserve de 0,5 XLM.", explanation: "Incorrect. La réserve est toujours de 0,5 XLM par trustline, qu'un TOML existe ou non." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q3",
      prompt: "L'avertissement d'un token détenu énumère « Chute de volume » et « Moins de détenteurs ». Que devez-vous en conclure ?",
      options: [
        { text: "Le bot a déjà vendu le token pour vous protéger.", explanation: "Incorrect. Le bot se contente d'avertir ; il ne supprime jamais une trustline et ne vend jamais sur la foi d'un avertissement. La décision vous revient." },
        { text: "Deux signes indépendants que le projet perd de l'élan — une incitation à enquêter.", explanation: "Correct. Chaque déclencheur est un signal de dégradation précis ; plusieurs ensemble constituent une incitation plus forte à faire des recherches et à décider quoi faire." },
        { text: "Rien — les avertissements sont aléatoires et peuvent être ignorés.", explanation: "Incorrect. Chaque déclencheur correspond au franchissement d'un seuil concret dans les données d'une semaine à l'autre." },
      ],
      correctIndex: 1,
    },
    {
      id: "c20-q4",
      prompt: "Qu'est-ce qu'un « pic de volume sans fondamentaux » ?",
      options: [
        { text: "Une explosion d'échanges qui ne s'accompagne ni de plus de détenteurs, ni d'une liquidité plus profonde, ni d'un émetteur crédible.", explanation: "Correct. L'activité est fabriquée (souvent par wash trading) plutôt que soutenue par une adoption authentique, c'est pourquoi elle est signalée plutôt que récompensée." },
        { text: "Une hausse régulière et durable du volume, accompagnée d'une base de détenteurs en croissance.", explanation: "Incorrect. Il s'agit d'une croissance saine, soutenue par des fondamentaux — l'opposé du signal d'alerte." },
        { text: "Une baisse de volume causée par un repli généralisé du marché.", explanation: "Incorrect. Le schéma est un pic à la hausse du volume sans substance, pas un déclin." },
      ],
      correctIndex: 0,
    },
    {
      id: "c20-q5",
      prompt: "Comment devez-vous traiter une suggestion de l'IA bien notée ?",
      options: [
        { text: "Comme un token certifié sûr que vous pouvez ajouter sans plus réfléchir.", explanation: "Incorrect. L'analyse s'appuie sur des signaux publics limités ; elle ne peut pas certifier un token, et chaque fiche met en garde contre un ajout sur la seule foi de la suggestion." },
        { text: "Comme un point de départ pour vos propres recherches — vérifiez l'émetteur, le TOML, les détenteurs et la liquidité avant de décider.", explanation: "Correct. Une note élevée affine votre liste restreinte ; la vérification indépendante et la décision finale restent les vôtres." },
        { text: "Comme sans intérêt, puisque les notes de l'IA ne sont jamais utiles.", explanation: "Incorrect. Les notes sont un outil de tri utile — elles ne remplacent simplement pas la due diligence." },
      ],
      correctIndex: 1,
    },
  ],
};
