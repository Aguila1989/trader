import type { Chapter } from "../../types";

export const chapter19: Chapter = {
  id: "c19",
  number: 19,
  level: "BASIC",
  title: "Qu'est-ce qu'une trustline et faut-il en ajouter une ?",
  description: "Les trustlines expliquées simplement : ce qu'elles sont, pourquoi elles coûtent 0,5 XLM, les vrais risques, comment vérifier un token au préalable et comment en supprimer une plus tard.",
  lessons: [
    {
      id: "c19-l1",
      title: "Qu'est-ce qu'une trustline ?",
      paragraphs: [
        "Sur Stellar, votre compte détient des XLM par défaut, mais il ne peut détenir aucun autre token tant que vous n'y avez pas explicitement consenti. Ce consentement s'appelle une trustline. Voyez cela comme le fait d'autoriser un commerce précis à déposer des articles dans votre portefeuille : vous choisissez exactement à quels commerces vous faites confiance, et rien d'autre ne peut y déposer quoi que ce soit sans votre accord.",
        "Une trustline désigne un token de façon précise : son code d'actif ainsi que le compte qui l'émet. Ajouter la trustline revient à dire \"je suis disposé à détenir la version de ce token émise par cet émetteur précis\". Cela n'achète pas le token, cela ne vous coûte pas le prix du token, et cela ne donne pas à l'émetteur accès à vos XLM. Cela ouvre simplement un emplacement pour que le token puisse arriver.",
        "Tant qu'une trustline n'existe pas, quiconque tente de vous envoyer ce token, ou toute transaction qui le livrerait, échoue tout simplement. Ajouter une trustline est donc l'étape préalable indispensable avant de pouvoir recevoir, acheter ou échanger un actif autre que le XLM, et choisir quelles trustlines ouvrir, c'est choisir avec quels émetteurs vous acceptez de traiter.",
      ],
      example: "Vous voulez détenir de l'USDC. Avant de pouvoir en recevoir une seule unité, votre compte a besoin d'une trustline vers l'USDC émis par le compte émetteur spécifique de Circle. Une fois cette trustline en place, l'USDC peut arriver dans votre portefeuille. Sans elle, un ami qui essaie de vous envoyer 10 USDC obtient une erreur et le paiement n'arrive jamais.",
    },
    {
      id: "c19-l2",
      title: "Pourquoi ajouter une trustline coûte-t-il 0,5 XLM ?",
      paragraphs: [
        "Ajouter une trustline ne dépense pas 0,5 XLM, cela les réserve. Stellar impose à chaque compte de conserver un solde minimum, et chaque trustline que vous ouvrez augmente ce minimum de 0,5 XLM. Ces 0,5 XLM restent les vôtres ; ils sont simplement bloqués et ne peuvent être ni dépensés ni envoyés tant que la trustline est ouverte.",
        "Cette réserve existe pour empêcher le spam. Comme chaque trustline coûte du solde bloqué, personne ne peut créer à bas coût des millions d'entrées vides pour gonfler le réseau. Cela garde le registre léger et fait de chaque trustline un petit engagement réfléchi, plutôt que quelque chose que l'on dissémine sans y penser.",
        "La conséquence pratique : ouvrir de nombreuses trustlines immobilise de vrais XLM. Dix trustlines réservent 5 XLM que vous ne pouvez plus déplacer. Lorsque vous fermez une trustline dont vous n'avez plus besoin, ces 0,5 XLM sont restitués à votre solde dépensable.",
      ],
      example: "Votre compte détient 20 XLM sans aucune trustline. Vous ajoutez une trustline vers l'USDC et une autre vers AQUA. Votre minimum réservé augmente de 1 XLM (0,5 chacune), donc seuls environ 19 XLM moins la réserve de base sont désormais dépensables. Supprimez plus tard la trustline AQUA et 0,5 XLM se libère à nouveau.",
    },
    {
      id: "c19-l3",
      title: "Quels sont les risques liés à l'ajout d'une trustline ?",
      paragraphs: [
        "Une trustline vous lie à un émetteur, et tous les émetteurs ne sont pas dignes de confiance. Le danger classique est le rug pull : un projet attire des détenteurs, puis l'émetteur émet un déluge de nouveaux tokens ou retire la liquidité, et le prix s'effondre à zéro. Votre trustline n'en est pas la cause, mais c'est elle qui vous a permis de détenir le token devenu sans valeur.",
        "Les émetteurs anonymes sont un signal d'alerte particulier. Si vous ne pouvez pas savoir qui gère le projet, qui contrôle la clé d'émission, ou si l'offre peut être gonflée à volonté, vous faites confiance à un inconnu sans aucune responsabilité. Beaucoup de tokens sans valeur sont des clones frauduleux qui copient le code d'un actif connu mais utilisent un émetteur différent, contrôlé par un attaquant.",
        "Une trustline en elle-même ne peut pas vider vos XLM ni vos autres tokens : cette partie est sûre. Le risque porte entièrement sur la valeur du token que vous choisissez de détenir et sur le comportement de son émetteur. Le seul coût direct est la réserve de 0,5 XLM, que vous récupérez en fermant la trustline.",
      ],
      example: "Un token appelé \"USDC\" apparaît avec un rendement annoncé énorme, mais son compte émetteur est tout neuf, n'a pas de site web et pourrait émettre une offre illimitée. Vous ajoutez la trustline et investissez. Une semaine plus tard, l'émetteur crée dix millions d'unités supplémentaires et les liquide ; le prix chute de 99 %. Vos XLM n'ont jamais été en danger, mais les tokens que vous avez achetés sont désormais quasiment sans valeur.",
    },
    {
      id: "c19-l4",
      title: "Comment vérifier un token avant d'ajouter une trustline",
      paragraphs: [
        "Commencez par l'identité de l'émetteur. Un token crédible publie un fichier stellar.toml sur son domaine d'origine, qui nomme l'organisation, renvoie vers son site web et indique le compte émetteur exact. S'il n'existe aucun fichier de ce type, aucun domaine, et aucun moyen d'identifier qui se cache derrière, considérez cela comme une bonne raison de rester à l'écart.",
        "Examinez ensuite la liquidité et l'adoption. Combien de comptes détiennent déjà une trustline vers ce token ? Y a-t-il un véritable volume d'échanges contre le XLM, ou l'order book est-il vide ? Un token avec des milliers de détenteurs et un volume régulier est une proposition très différente d'un token avec une poignée de détenteurs et aucune transaction. L'analyse hebdomadaire des trustlines de l'application résume précisément ces signaux pour vous.",
        "Enfin, méfiez-vous de l'urgence et des promesses démesurées. Des rendements élevés garantis, des comptes à rebours et la pression pour ajouter la trustline \"avant qu'il ne soit trop tard\" sont des manipulations classiques. Un token sérieux n'a pas besoin de vous presser ; prenez donc le temps de vérifier vous-même l'émetteur et les chiffres.",
      ],
      example: "Avant de faire confiance à un nouveau token, vous ouvrez son domaine d'origine et y trouvez un stellar.toml listant le projet, son site web et la clé de l'émetteur, qui correspond à l'émetteur qu'on vous a indiqué. Vous voyez aussi qu'il compte 8 000 détenteurs et un order book XLM en bonne santé. Cela tient la route. Un second token n'a aucun domaine, 12 détenteurs et aucune transaction ; vous le refusez.",
    },
    {
      id: "c19-l5",
      title: "Comment supprimer une trustline dont vous ne voulez plus",
      paragraphs: [
        "Vous n'êtes jamais bloqué avec une trustline. En supprimer une ferme l'emplacement et restitue la réserve de 0,5 XLM à votre solde dépensable. Dans cette application, vous supprimez une trustline depuis le panneau Trustlines : chaque token détenu dispose d'un bouton Supprimer à côté de lui.",
        "Il y a une règle : vous ne pouvez supprimer une trustline que lorsque votre solde de ce token est exactement à zéro. Stellar ne vous laissera pas fermer une trustline tant que vous détenez encore le token, car cela laisserait le solde en suspens. Vendez ou transférez donc le token jusqu'à zéro d'abord, puis le bouton Supprimer devient disponible.",
        "Supprimer une trustline est une opération d'entretien normale et réversible. Si vous changez d'avis plus tard, il vous suffit d'ajouter à nouveau la trustline (en payant à nouveau la réserve de 0,5 XLM). Fermer les trustlines inutilisées est une bonne pratique : cela libère des XLM réservés et réduit la liste des émetteurs auxquels vous êtes exposé.",
      ],
      example: "Vous détenez 0 unité d'un token dont vous ne voulez plus mais dont la trustline est encore ouverte. Dans le panneau Trustlines, son bouton Supprimer est actif, vous cliquez donc dessus ; la trustline se ferme et 0,5 XLM revient à votre solde dépensable. Un autre token affiche encore un solde de 30, donc son bouton Supprimer est désactivé jusqu'à ce que vous ayez vendu ces 30 jusqu'à zéro.",
    },
  ],
  quiz: [
    {
      id: "c19-q1",
      prompt: "Que fait réellement l'ajout d'une trustline ?",
      options: [
        { text: "Elle achète le token pour vous au prix actuel du marché.", explanation: "Incorrect. Une trustline n'achète rien ; elle permet seulement à votre compte de détenir le token. Vous devez encore l'acquérir séparément." },
        { text: "Elle autorise votre compte à détenir un token spécifique provenant d'un émetteur spécifique.", explanation: "Correct. Une trustline désigne un token et son émetteur et ouvre un emplacement pour que ce token puisse être reçu, acheté ou échangé." },
        { text: "Elle donne à l'émetteur du token la permission de dépenser vos XLM.", explanation: "Incorrect. Une trustline n'accorde jamais à personne l'accès à vos XLM ou à vos autres tokens ; elle vous permet seulement de détenir l'actif désigné." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q2",
      prompt: "Qu'advient-il des 0,5 XLM lorsque vous ajoutez une trustline ?",
      options: [
        { text: "Ils sont versés à l'émetteur du token sous forme de frais.", explanation: "Incorrect. L'émetteur ne reçoit rien. Les 0,5 XLM ne constituent pas un paiement." },
        { text: "Ils sont dépensés définitivement et ne peuvent pas être récupérés.", explanation: "Incorrect. Ils ne sont pas dépensés : ils sont réservés, et vous les récupérez en fermant la trustline." },
        { text: "Ils sont réservés (bloqués) sur votre propre compte et libérés à nouveau si vous supprimez la trustline.", explanation: "Correct. Chaque trustline augmente votre solde minimum de 0,5 XLM ; le montant reste le vôtre mais est bloqué jusqu'à la fermeture de la trustline." },
      ],
      correctIndex: 2,
    },
    {
      id: "c19-q3",
      prompt: "Lequel de ces éléments est un véritable signal d'alerte avant d'ajouter une trustline ?",
      options: [
        { text: "L'émetteur publie un stellar.toml avec son nom, son site web et sa clé d'émission.", explanation: "Incorrect. C'est un bon signe : cela vous permet d'identifier et de vérifier qui se cache derrière le token." },
        { text: "L'émetteur est anonyme, n'a pas de site web, et l'offre pourrait être gonflée à volonté.", explanation: "Correct. Un émetteur non identifiable avec une offre non plafonnée est un montage classique de rug pull ; il n'y a aucune responsabilité si les choses tournent mal." },
        { text: "Le token compte des milliers de détenteurs et un order book XLM régulier.", explanation: "Incorrect. Une adoption et une liquidité réelles sont des signaux rassurants, pas des signaux d'alerte." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q4",
      prompt: "Quand pouvez-vous supprimer une trustline dont vous ne voulez plus ?",
      options: [
        { text: "Uniquement lorsque votre solde de ce token est exactement à zéro.", explanation: "Correct. Stellar refuse de fermer une trustline tant que vous détenez encore le token, vous le vendez ou le transférez donc jusqu'à zéro d'abord ; ensuite la réserve de 0,5 XLM est libérée." },
        { text: "À tout moment, même avec un solde important encore détenu.", explanation: "Incorrect. Un solde non nul empêche la suppression, car la fermeture laisserait les tokens en suspens." },
        { text: "Jamais : une fois ajoutée, une trustline est permanente.", explanation: "Incorrect. Les trustlines sont réversibles ; vous pouvez en supprimer une (avec un solde à zéro) et même l'ajouter à nouveau plus tard." },
      ],
      correctIndex: 0,
    },
  ],
};
