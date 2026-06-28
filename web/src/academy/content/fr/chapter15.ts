import type { Chapter } from "../../types";

export const chapter15: Chapter = {
  id: "c15",
  number: 15,
  level: "BASIC",
  title: "Se connecter et rester en sécurité",
  description:
    "Pourquoi une application de trading a besoin d'une connexion, ce qui rend un mot de passe robuste, pourquoi nous vérifions votre adresse e-mail, et que faire si vous oubliez un jour votre mot de passe.",
  lessons: [
    {
      id: "c15-l1",
      title: "Pourquoi faut-il une connexion pour une application de trading ?",
      paragraphs: [
        "La connexion est la façon dont l'application s'assure que vous, et vous seul, pouvez accéder à vos données de trading et aux commandes de votre portefeuille. Sans elle, quiconque ouvrirait la page pourrait voir votre historique, modifier vos paramètres ou tenter de déplacer des fonds. La connexion, c'est la porte d'entrée, et votre adresse e-mail ainsi que votre mot de passe en sont la clé.",
        "Voyez votre connexion comme la clé de votre propre casier. Le casier contient tout ce qui est personnel : vos transactions, vos paramètres de risque, vos ordres stop loss enregistrés. Tant que la clé reste entre vos mains, personne d'autre ne peut ouvrir le casier — même s'il se trouve dans la même pièce que ceux de tout le monde.",
        "Cela compte encore plus pour une application de trading que pour la plupart des sites web, parce que l'application peut effectuer de vraies actions avec de l'argent réel. Une porte d'entrée solide est la première couche de protection, et la plus importante : elle tient les inconnus à l'écart avant même que les autres dispositifs de sécurité n'entrent en jeu.",
      ],
      example:
        "Imaginez que vous laissiez votre ordinateur dans un café pendant deux minutes. Si l'application n'avait pas de connexion, la personne à la table voisine pourrait l'ouvrir et se mettre à cliquer. Avec une connexion, tout ce qu'elle voit, c'est un écran de connexion réclamant une adresse e-mail et un mot de passe qu'elle ne possède pas — votre casier reste fermé.",
    },
    {
      id: "c15-l2",
      title: "Qu'est-ce qui rend un mot de passe robuste ?",
      paragraphs: [
        "Un mot de passe robuste est long et varié. Cette application en exige au moins 12 caractères, comprenant au moins une majuscule, une minuscule, un chiffre et un caractère spécial (comme ! ou @). La longueur est le facteur le plus déterminant : chaque caractère supplémentaire ralentit énormément une attaque par devinette.",
        "L'ennemi d'un bon mot de passe, c'est la prévisibilité. Les mots réels, les prénoms, les dates de naissance et les schémas simples comme « MotDePasse123 ! » sont les premières choses qu'un attaquant essaie. Une phrase de passe — plusieurs mots sans rapport entre eux assemblés avec un chiffre et un symbole — est à la fois robuste et facile à retenir.",
        "Ne réutilisez jamais un mot de passe que vous employez ailleurs. Si un autre site web est piraté et que vous y aviez utilisé le même mot de passe qu'ici, les attaquants l'essaieront aussi sur votre compte de trading. Un gestionnaire de mots de passe peut générer et mémoriser un mot de passe robuste et unique pour vous éviter d'avoir à le faire.",
      ],
      example:
        "Faible : « jean2024 » — court, un prénom et une année ; deviné en quelques secondes. Plus robuste : « Loutre-Brave-Citron-7 ! » — quatre mots aléatoires, 20 caractères, avec un chiffre et un symbole. Bien plus difficile à deviner, mais facile à visualiser.",
    },
    {
      id: "c15-l3",
      title: "Qu'est-ce que la vérification d'e-mail et pourquoi est-elle obligatoire ?",
      paragraphs: [
        "La vérification d'e-mail est un contrôle rapide qui confirme que l'adresse e-mail avec laquelle vous vous êtes inscrit vous appartient réellement. Après votre inscription, l'application envoie un lien à usage unique à cette adresse ; cliquer dessus prouve que vous pouvez lire le courrier qui y est envoyé, et c'est seulement alors que votre compte est autorisé à se connecter.",
        "Cela vous protège de deux manières. D'abord, cela empêche quelqu'un de créer un compte avec votre adresse e-mail à votre insu. Ensuite, cela garantit que l'application dispose d'une adresse fonctionnelle pour vous joindre — précisément l'adresse à laquelle un lien de réinitialisation de mot de passe serait envoyé plus tard.",
        "Si l'application n'a pas été configurée pour envoyer des e-mails, la vérification est ignorée pour que vous puissiez tout de même l'utiliser, et une note est enregistrée indiquant que cette étape a été désactivée. Lorsque l'e-mail est configuré, la vérification est obligatoire, et votre compte reste en attente, dans un état non vérifié, jusqu'à ce que vous cliquiez sur le lien.",
      ],
      example:
        "Vous vous inscrivez avec « vous@exemple.com ». L'application envoie un lien à cette boîte de réception. Tant que vous n'ouvrez pas la boîte et ne cliquez pas dessus, toute tentative de connexion affiche « Veuillez d'abord vérifier votre adresse e-mail. » Une fois que vous cliquez, votre compte est confirmé et vous pouvez vous connecter normalement.",
    },
    {
      id: "c15-l4",
      title: "Que faire si vous oubliez votre mot de passe",
      paragraphs: [
        "Oublier un mot de passe est normal, et l'application est conçue pour cela. Sur l'écran de connexion se trouve un lien « Mot de passe oublié ? ». Vous saisissez votre adresse e-mail et, si un compte y est associé, l'application envoie un lien de réinitialisation à cette adresse. Par souci de confidentialité, le message que vous voyez est le même que l'e-mail soit enregistré ou non, de sorte qu'il ne révèle jamais qui possède un compte.",
        "Le lien de réinitialisation est volontairement de courte durée — il ne fonctionne qu'une heure et une seule fois. Dès que vous l'utilisez pour définir un nouveau mot de passe, le lien cesse de fonctionner, si bien qu'un ancien e-mail traînant dans votre boîte de réception ne peut pas être réutilisé. Votre nouveau mot de passe doit respecter les mêmes règles de robustesse qu'auparavant.",
        "Définir un nouveau mot de passe déconnecte également toutes les autres sessions actives ; ainsi, si quelqu'un s'était glissé à l'intérieur, la réinitialisation le met dehors. Si vous recevez un jour un e-mail de réinitialisation que vous n'avez pas demandé, vous pouvez l'ignorer sans crainte — rien ne change tant que le lien n'est pas réellement utilisé.",
      ],
      example:
        "Vous n'arrivez pas à vous souvenir de votre mot de passe. Vous cliquez sur « Mot de passe oublié ? », saisissez votre adresse e-mail, et en moins d'une minute un lien arrive. Vous l'ouvrez, choisissez « Loutre-Brave-Citron-7 ! » comme nouveau mot de passe, et vous voilà de retour — et tout appareil encore connecté est déconnecté par sécurité.",
    },
  ],
  quiz: [
    {
      id: "c15-q1",
      prompt: "Pourquoi une application de trading a-t-elle besoin d'une connexion ?",
      options: [
        {
          text: "Pour que vous seul puissiez accéder à vos données de trading et aux commandes de votre portefeuille — comme la clé de votre propre casier.",
          explanation:
            "Correct. La connexion est la porte d'entrée : elle tient tout le monde à l'écart de vos données et des commandes de votre argent, sauf vous.",
        },
        {
          text: "Pour que l'application se charge plus vite.",
          explanation: "Non. Une connexion concerne l'accès et la sécurité, pas la vitesse.",
        },
        {
          text: "Pour que tout le monde puisse partager les mêmes transactions et paramètres.",
          explanation:
            "Non. Le but est exactement l'inverse — vos données restent privées et ne sont pas partagées.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q2",
      prompt: "Lequel de ces mots de passe est le plus robuste ?",
      options: [
        {
          text: "« MotDePasse123 ! »",
          explanation:
            "Non. Il a l'air complexe, mais c'est l'un des premiers schémas que les attaquants essaient — un mot courant suivi d'un chiffre et d'un symbole évidents.",
        },
        {
          text: "« Loutre-Brave-Citron-7 ! »",
          explanation:
            "Correct. Il est long (20 caractères), mélange les types de caractères et est composé de mots sans rapport entre eux, donc difficile à deviner mais facile à retenir.",
        },
        {
          text: "Votre prénom et votre année de naissance",
          explanation:
            "Non. Les prénoms et les dates sont faciles à trouver ou à deviner et font un mot de passe faible.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c15-q3",
      prompt: "Pourquoi l'application vous demande-t-elle de vérifier votre adresse e-mail après l'inscription ?",
      options: [
        {
          text: "Pour prouver que l'adresse est bien la vôtre et que l'application peut vous joindre (par exemple pour les réinitialisations de mot de passe).",
          explanation:
            "Correct. La vérification confirme que vous contrôlez la boîte de réception et fournit à l'application une adresse fonctionnelle pour des choses comme les liens de réinitialisation.",
        },
        {
          text: "Pour vous envoyer de la publicité.",
          explanation: "Non. La vérification est un contrôle de sécurité et de contact, pas une démarche marketing.",
        },
        {
          text: "Pour rendre votre mot de passe plus robuste.",
          explanation:
            "Non. Vérifier votre adresse e-mail n'a rien à voir avec la robustesse de votre mot de passe.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q4",
      prompt: "Vous avez oublié votre mot de passe. Qu'est-ce qui est vrai à propos du lien de réinitialisation envoyé par l'application ?",
      options: [
        {
          text: "Il fonctionne pendant une durée limitée et une seule fois, et son utilisation déconnecte les autres sessions.",
          explanation:
            "Correct. Le lien est de courte durée et à usage unique, et définir un nouveau mot de passe déconnecte toute autre session active.",
        },
        {
          text: "Il est permanent, vous pouvez donc réutiliser le même lien chaque fois que vous oubliez de nouveau.",
          explanation:
            "Non. Le lien expire (au bout d'environ une heure) et cesse de fonctionner une fois utilisé — c'est ce qui le rend sûr.",
        },
        {
          text: "Il vous indique si l'adresse e-mail est enregistrée ou non.",
          explanation:
            "Non. Par souci de confidentialité, la réponse est la même dans les deux cas, de sorte qu'il ne révèle jamais qui possède un compte.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
