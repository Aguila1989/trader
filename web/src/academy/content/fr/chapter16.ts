import type { Chapter } from "../../types";

export const chapter16: Chapter = {
  id: "c16",
  number: 16,
  level: "ADVANCED",
  title: "Comment fonctionne l'authentification en coulisses",
  description:
    "Un regard derrière l'écran de connexion : ce qu'est un JWT, pourquoi le jeton vit dans un cookie httpOnly, comment fonctionne le verrouillage de compte, et pourquoi votre session finit par expirer.",
  lessons: [
    {
      id: "c16-l1",
      title: "Qu'est-ce qu'un JWT et comment prouve-t-il que vous êtes connecté ?",
      paragraphs: [
        "HTTP a la mémoire courte : chaque requête envoyée au serveur est indépendante, il faut donc quelque chose qui rappelle au serveur, à chaque requête, qui vous êtes. Un JWT (JSON Web Token) est ce rappel. Lorsque vous vous connectez avec succès, le serveur crée un petit jeton qui indique qui vous êtes et quand il expire, puis le signe avec un secret connu de lui seul.",
        "Imaginez un JWT comme un bracelet tamponné à un festival. À l'entrée, vous montrez votre pièce d'identité une seule fois ; en échange, on vous remet un bracelet. Ensuite, à chaque scène, le personnel jette simplement un coup d'œil au bracelet — il ne revérifie pas votre pièce d'identité à chaque fois. Le tampon est difficile à imiter, donc le bracelet lui-même prouve qu'on vous a laissé entrer.",
        "La signature, c'est le tampon. Le serveur peut regarder un jeton qu'on lui renvoie et vérifier la signature pour savoir qu'il a bien émis ce jeton et que personne ne l'a modifié — sans avoir à stocker le contenu du jeton où que ce soit. Si ne serait-ce qu'un seul caractère du jeton est changé, la signature ne correspond plus et le jeton est rejeté.",
      ],
      example:
        "Après la connexion, votre jeton contient en gros : \"utilisateur = vous, émis = 15 h, expire = 15 h demain\", plus une signature. Au clic suivant, le navigateur le renvoie ; le serveur vérifie la signature, constate qu'elle est valide et non expirée, et vous sert vos données — aucun second mot de passe requis.",
    },
    {
      id: "c16-l2",
      title: "Qu'est-ce qu'un cookie httpOnly et pourquoi est-il plus sûr que de stocker un jeton dans le navigateur ?",
      paragraphs: [
        "Un cookie est un petit morceau de données que le navigateur stocke pour un site et renvoie automatiquement à chaque requête vers ce site. Un cookie httpOnly possède un indicateur spécial qui dit au navigateur : transmets-le au serveur, mais ne laisse jamais le JavaScript de la page le lire.",
        "Cet indicateur est tout l'intérêt. Si un jeton est conservé à un endroit lisible par le JavaScript — comme le localStorage — alors un seul script malveillant ou bogué sur la page pourrait lire le jeton et l'envoyer à un attaquant (une attaque appelée XSS). Un jeton dans un cookie httpOnly ne peut être lu par aucun script, donc même un script qui se glisse en douce sur la page ne peut pas voler votre session.",
        "Les cookies qui voyagent automatiquement soulèvent un autre risque : un autre site pourrait essayer de faire déclencher par votre navigateur une requête utilisant votre cookie (ce qu'on appelle le CSRF). L'application bloque cela en vérifiant d'où provient chaque requête qui modifie un état et en marquant le cookie \"same-site\", de sorte que le navigateur ne l'attache pas aux requêtes lancées par d'autres sites.",
      ],
      example:
        "Deux façons de conserver le même jeton. Dans le localStorage : un script publicitaire malveillant exécute `localStorage.getItem('token')` et l'envoie par courriel — c'est fini. Dans un cookie httpOnly : le même script s'exécute et n'obtient rien, parce que le navigateur refuse purement et simplement de révéler le cookie au JavaScript.",
    },
    {
      id: "c16-l3",
      title: "Qu'est-ce que le verrouillage de compte et en quoi vous protège-t-il ?",
      paragraphs: [
        "Le verrouillage de compte limite le nombre de fois consécutives où quelqu'un peut deviner votre mot de passe. Après un nombre défini de tentatives échouées — cinq dans cette application — le compte est temporairement verrouillé pour une période de pause (quinze minutes), durant laquelle même le bon mot de passe est refusé.",
        "Cela déjoue la \"force brute\" : un programme qui essaie des milliers de mots de passe par seconde jusqu'à ce que l'un fonctionne. Avec le verrouillage, un attaquant n'a droit qu'à une poignée d'essais avant d'être contraint d'attendre, ce qui transforme une attaque de quelques minutes en une attaque qui prendrait des années. Chaque tentative échouée est en outre journalisée avec son heure et son adresse source, ce qui rend visibles les rafales suspectes.",
        "Il y a ici un équilibre délicat. Le verrouillage doit arrêter ceux qui devinent sans leur permettre de VOUS bloquer volontairement, et sans révéler si une adresse courriel est même enregistrée. C'est pourquoi le message générique \"adresse courriel ou mot de passe invalide\" s'affiche pour les mauvaises tentatives, et l'avis de verrouillage n'apparaît qu'à quelqu'un qui possède réellement le bon mot de passe — le véritable propriétaire.",
      ],
      example:
        "Un attaquant programme 1 000 tentatives de mot de passe contre votre compte. Après la cinquième mauvaise tentative, la porte se ferme pour quinze minutes, donc en une heure il ne parvient qu'à une vingtaine d'essais au lieu de millions. L'attaque devient désespérément lente, et le journal affiche un mur d'échecs provenant d'une seule adresse.",
    },
    {
      id: "c16-l4",
      title: "Qu'est-ce que l'expiration de session et pourquoi votre connexion se termine-t-elle ?",
      paragraphs: [
        "Chaque session a une expiration inscrite dans le jeton dès la connexion. Par défaut, cette application émet un jeton qui dure 24 heures ; si vous cochez \"Se souvenir de moi\", il dure 30 jours à la place. Une fois ce moment passé, le jeton n'est plus accepté et l'on vous demande de vous reconnecter.",
        "L'expiration limite les dégâts si un jeton venait à être exposé. Un jeton qui durerait éternellement serait une clé permanente ; un jeton qui expire est une clé qui cesse de fonctionner d'elle-même, de sorte qu'une copie prise sur une session abandonnée devient inutile une fois la fenêtre fermée. C'est la version numérique d'une carte-clé d'hôtel qui se désactive au moment du départ.",
        "Se déconnecter ne se contente pas d'attendre l'expiration — cela révoque la session sur le serveur immédiatement, de sorte que le jeton est rejeté dès cet instant, même si son heure d'expiration n'est pas encore arrivée. Réinitialiser votre mot de passe fait de même pour toutes les sessions, ce qui explique pourquoi une réinitialisation est le moyen le plus rapide d'expulser quiconque ne devrait pas être là.",
      ],
      example:
        "Vous vous connectez sur un ordinateur portable partagé sans cocher \"Se souvenir de moi\" et oubliez de vous déconnecter. Le jeton de 24 heures expire discrètement durant la nuit, si bien qu'au matin ce navigateur ne peut plus atteindre votre compte. Si vous aviez cliqué sur Se déconnecter, l'accès aurait été coupé dès votre départ — et une réinitialisation de mot de passe aurait mis fin à toutes les sessions partout d'un seul coup.",
    },
  ],
  quiz: [
    {
      id: "c16-q1",
      prompt: "Qu'est-ce qu'un JWT, dans l'analogie du bracelet de festival ?",
      options: [
        {
          text: "Un jeton signé que vous recevez après vous être connecté une fois, et que le serveur revérifie à chaque requête au lieu de redemander votre mot de passe.",
          explanation:
            "Correct. Comme un bracelet tamponné, le jeton signé prouve qu'on vous a laissé entrer, donc le serveur n'a pas besoin de revérifier votre mot de passe à chaque fois.",
        },
        {
          text: "Votre mot de passe, renvoyé à chaque requête.",
          explanation:
            "Non. Tout l'intérêt est que votre mot de passe est vérifié une seule fois ; le jeton le remplace ensuite.",
        },
        {
          text: "Une liste de toutes les pages que vous avez visitées.",
          explanation: "Non. Un JWT contient qui vous êtes et quand il expire, pas un historique de navigation.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q2",
      prompt: "Pourquoi conserver le jeton de session dans un cookie httpOnly est-il plus sûr que dans le localStorage ?",
      options: [
        {
          text: "Le JavaScript de la page ne peut pas lire un cookie httpOnly, donc un script malveillant (XSS) ne peut pas voler le jeton.",
          explanation:
            "Correct. L'indicateur httpOnly cache le cookie à tous les scripts de la page, supprimant le moyen le plus courant de voler un jeton.",
        },
        {
          text: "Les cookies httpOnly font charger l'application plus vite.",
          explanation: "Non. C'est une propriété de sécurité, pas de performance.",
        },
        {
          text: "Le localStorage est chiffré et les cookies ne le sont pas.",
          explanation:
            "Non. La différence est l'accès en lecture par les scripts, pas le chiffrement — le localStorage est tout simplement lisible par n'importe quel script de la page.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q3",
      prompt: "Comment le verrouillage de compte vous protège-t-il ?",
      options: [
        {
          text: "Il bloque les tentatives supplémentaires après plusieurs mauvais mots de passe, rendant impraticable la recherche rapide par force brute.",
          explanation:
            "Correct. Un court verrouillage après quelques échecs transforme des millions de tentatives possibles par heure en une infime poignée.",
        },
        {
          text: "Il supprime votre compte après un seul mauvais mot de passe.",
          explanation:
            "Non. Le verrouillage est une pause temporaire après plusieurs échecs, pas une suppression après un seul.",
        },
        {
          text: "Il vous envoie votre mot de passe par courriel quand vous échouez.",
          explanation:
            "Non. Les mots de passe ne sont jamais envoyés par courriel (ni même stockés sous une forme lisible) ; le verrouillage ralentit simplement les tentatives.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q4",
      prompt: "Pourquoi votre session de connexion finit-elle par expirer ?",
      options: [
        {
          text: "Pour qu'un jeton exposé ou oublié cesse de fonctionner de lui-même après une fenêtre définie, limitant ainsi les dégâts.",
          explanation:
            "Correct. L'expiration est comme une carte-clé d'hôtel qui se désactive au départ — un jeton fuité devient inutile une fois la fenêtre fermée.",
        },
        {
          text: "Parce que le serveur manque d'espace pour stocker les sessions.",
          explanation:
            "Non. L'expiration est une limite de sécurité délibérée, pas un problème de stockage — la durée de vie est inscrite dans le jeton lui-même.",
        },
        {
          text: "Pour vous forcer à changer votre mot de passe chaque jour.",
          explanation:
            "Non. L'expiration vous demande de vous reconnecter ; elle n'exige pas un nouveau mot de passe.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
