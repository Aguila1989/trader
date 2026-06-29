import type { Chapter } from "../../types";

export const chapter17: Chapter = {
  id: "c17",
  number: 17,
  level: "BASIC",
  title: "Créer et protéger votre portefeuille",
  description:
    "Ce qu'est vraiment un portefeuille crypto, la différence entre votre clé publique et votre clé secrète, pourquoi vous ne devez jamais partager la secrète, et comment la conserver en sécurité hors ligne.",
  lessons: [
    {
      id: "c17-l1",
      title: "Qu'est-ce qu'un portefeuille crypto ?",
      paragraphs: [
        "Un portefeuille crypto n'est pas vraiment un endroit où vos coins sont conservés — vos coins vivent sur la blockchain. Un portefeuille est la paire de clés qui vous permet de prouver que les coins vous appartiennent et de les déplacer. Voyez-le comme votre identité et votre signature sur le réseau réunies en une seule chose.",
        "La façon la plus claire de se le représenter est une boîte aux lettres. Votre portefeuille a une adresse publique, comme l'adresse inscrite sur le devant d'une boîte aux lettres : tout le monde peut la lire, et tout le monde peut y déposer quelque chose. Pour ouvrir la boîte et prendre ce qui s'y trouve, il vous faut la clé — et vous seul devez jamais détenir cette clé.",
        "Un portefeuille a donc deux parties qui remplissent deux rôles différents. L'une est publique et faite pour être partagée, afin que les gens puissent vous envoyer des fonds. L'autre est privée et faite pour être cachée, car c'est la seule chose capable de dépenser ces fonds. Les leçons suivantes examinent chaque partie tour à tour.",
      ],
      example:
        "Imaginez une boîte aux lettres dans la rue. L'adresse (« 12 rue du Chêne ») est votre clé publique — vous l'inscrivez volontiers sur des courriers pour que les gens puissent vous écrire. La petite clé dans votre poche qui ouvre la boîte est votre clé secrète. Un voisin peut vous envoyer une carte grâce à l'adresse, mais sans la clé il ne pourra jamais ouvrir la boîte et prendre ce qui s'y trouve.",
    },
    {
      id: "c17-l2",
      title: "Qu'est-ce qu'une clé publique et qu'est-ce qu'une clé secrète ?",
      paragraphs: [
        "Votre clé publique est l'adresse de votre portefeuille. Vous pouvez la partager sans danger avec n'importe qui — vous la donnez pour que les gens puissent vous envoyer des coins, tout comme vous donnez votre adresse de boîte aux lettres pour qu'on vous écrive. La partager ne peut pas vous nuire ; le pire que quelqu'un puisse en faire, c'est vous envoyer de l'argent.",
        "Votre clé secrète (parfois appelée clé privée) est tout autre chose. C'est la seule et unique chose qui peut autoriser un paiement depuis votre portefeuille. Celui qui détient la clé secrète contrôle les fonds — point final. Il n'y a pas de mot de passe supplémentaire, pas de gestionnaire à appeler, et aucun moyen d'annuler un transfert une fois qu'il est signé.",
        "C'est pourquoi les deux clés doivent être traitées de façons opposées. La clé publique est faite pour être vue ; la clé secrète est faite pour rester cachée à jamais. Si jamais vous hésitez sur celle que vous vous apprêtez à partager, la règle sûre est simple : ne partagez jamais la secrète.",
      ],
      example:
        "Sur Stellar, les deux clés ont même un aspect différent pour qu'on puisse les distinguer. Une clé publique commence par la lettre G, comme « GABC... » — c'est celle que vous collez quand quelqu'un veut vous payer. Une clé secrète commence par la lettre S, comme « SABC... » — celle-là, vous la gardez pour vous et ne la montrez à personne, jamais.",
    },
    {
      id: "c17-l3",
      title: "Pourquoi vous ne devez jamais partager votre clé secrète — au grand jamais",
      paragraphs: [
        "Partager votre clé secrète revient à tendre votre portefeuille à quelqu'un sans aucun moyen de le récupérer. Quiconque la détient peut vider chaque coin en quelques secondes, et comme les transferts blockchain sont définitifs et irréversibles, il n'y a pas de banque à appeler ni de moyen de récupérer l'argent. La perte est permanente.",
        "Les escrocs savent que c'est la clé maîtresse, donc la plupart des attaques ne sont que des ruses pour vous la faire révéler. L'une des plus courantes est le faux « support » : quelqu'un se faisant passer pour un service d'assistance dans un chat dit avoir besoin de votre clé secrète ou de votre phrase de récupération pour « réparer » votre compte ou « débloquer » vos fonds. Un vrai support n'a jamais besoin de votre clé secrète — quiconque la demande cherche à vous voler.",
        "D'autres pièges paraissent tout aussi convaincants. Un site web ou une fenêtre surgissante peut vous demander d'« importer » ou de « vérifier » votre portefeuille en saisissant votre phrase de récupération — c'est du hameçonnage de phrase de récupération, et la saisir remet tout à l'attaquant. La règle ne souffre aucune exception : votre clé secrète et votre phrase de récupération ne se saisissent jamais dans un chat, un formulaire, un e-mail ou un site web vers lequel on vous a envoyé un lien.",
      ],
      example:
        "Quelqu'un vous écrit dans un chat de support : « Je vois le problème sur votre compte — collez simplement votre clé secrète pour que je rétablisse l'accès. » À l'instant où vous la collez, ils signent un transfert et chaque coin disparaît, sans aucun moyen d'annuler. La bonne réaction est de ne rien partager, de quitter le chat et de le signaler : aucun service légitime ne demandera jamais cette clé.",
    },
    {
      id: "c17-l4",
      title: "Que signifie « vos clés, vos cryptos » ?",
      paragraphs: [
        "« Vos clés, vos cryptos » est un adage qui résume toute l'idée de l'auto-conservation : si vous détenez vous-même les clés secrètes, vous possédez et contrôlez véritablement vos coins. Personne ne peut les geler, les prendre, ni vous empêcher de les déplacer, car le réseau n'obéit qu'à celui qui signe avec la clé.",
        "Le revers est l'avertissement : « pas vos clés, pas vos cryptos ». Quand vous laissez des coins sur une plateforme d'échange ou un service qui détient les clés à votre place — ce qu'on appelle la conservation par un tiers — vous ne les contrôlez pas vraiment. Vous faites confiance à cette entreprise pour honorer votre retrait. Si elle gèle des comptes, fait faillite ou se fait pirater, votre accès peut s'évanouir alors même que les coins étaient « les vôtres ».",
        "L'auto-conservation vous remet le contrôle et la responsabilité d'un même geste. Il n'y a aucune ligne d'assistance pour récupérer une clé perdue, donc la sécurité de vos fonds repose sur le soin que vous mettez à protéger cette clé. Ce compromis — contrôle total en échange d'une responsabilité totale — est au cœur du fait de détenir ses propres cryptos.",
      ],
      example:
        "Deux personnes « possèdent » chacune 100 coins. L'une les garde sur une plateforme qui détient les clés ; l'autre les garde dans un portefeuille dont elle seule a la clé secrète. Un matin, la plateforme suspend les retraits — la première personne ne peut pas toucher ses coins et ne peut qu'attendre et espérer. La seconde signe un transfert et déplace ses coins librement, car ses clés sont les siennes. C'est la différence que pointe l'adage.",
    },
    {
      id: "c17-l5",
      title: "Comment conserver votre clé secrète en sécurité hors ligne",
      paragraphs: [
        "L'endroit le plus sûr pour une clé secrète est hors ligne, loin de tout ce qui est connecté à internet. Tout ce qui est en ligne peut en principe être atteint par un attaquant, donc l'objectif est de garder la clé sur quelque chose qui ne peut pas être piraté à travers un réseau — au plus simple, sur du papier.",
        "Traitez la clé écrite comme la clé physique de votre maison. Vous ne scotcheriez pas la clé de votre maison sur la porte d'entrée et n'en publieriez pas une photo en ligne, et la même prudence s'applique ici. Écrivez la clé (ou la phrase de récupération) sur papier, conservez-la dans un endroit privé et sûr, et envisagez une seconde copie dans un autre lieu sécurisé au cas où la première serait perdue ou abîmée.",
        "Tout aussi important est de savoir où la clé ne doit jamais aller. Ne la gardez jamais dans une capture d'écran, dans votre galerie photo, dans un e-mail, dans des notes qui se synchronisent vers le cloud, ni dans un message à vous-même — tout cela peut être piraté, divulgué ou synchronisé vers un appareil que vous ne contrôlez plus. Pour de plus gros montants, un portefeuille matériel garde la clé sur un appareil hors ligne dédié et signe sans jamais l'exposer.",
      ],
      example:
        "Une approche prudente : écrivez votre clé secrète à la main sur une feuille de papier, scellez-la et enfermez-la dans un tiroir ou un coffre chez vous — éventuellement avec une seconde copie chez un proche de confiance. Une approche risquée : prenez une photo de la clé « pour ne pas la perdre ». Cette photo se télécharge en silence vers votre sauvegarde cloud, et dès que ce compte est compromis, votre portefeuille part avec.",
    },
  ],
  quiz: [
    {
      id: "c17-q1",
      prompt:
        "Quelqu'un dans un chat de support demande votre clé secrète pour « réparer » votre compte. Que faites-vous ?",
      options: [
        {
          text: "Ne la partagez jamais — quittez le chat et signalez-les ; un vrai support n'a jamais besoin de votre clé secrète.",
          explanation:
            "Correct. Quiconque demande votre clé secrète cherche à voler vos fonds. Un support légitime n'en a jamais besoin, donc le seul geste sûr est de ne rien partager.",
        },
        {
          text: "Partagez-la, mais seulement la première moitié, par prudence.",
          explanation:
            "Non. Votre clé secrète ne doit jamais être partagée, ni en entier ni en partie. Aucune façon de la remettre n'est sûre.",
        },
        {
          text: "Partagez-la, puisqu'on peut faire confiance au personnel de support pour vous aider.",
          explanation:
            "Non. Un « support » qui demande votre clé secrète est l'arnaque classique. Un vrai support n'en a jamais besoin, et la donner leur permet de vider votre portefeuille instantanément.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q2",
      prompt: "Quelle clé pouvez-vous donner sans danger pour que l'on vous envoie des coins ?",
      options: [
        {
          text: "Votre clé publique — comme une adresse de boîte aux lettres, elle est faite pour être partagée.",
          explanation:
            "Correct. La clé publique (sur Stellar elle commence par G) est votre adresse. La partager permet seulement de vous envoyer des fonds.",
        },
        {
          text: "Votre clé secrète — ils en ont besoin pour vous envoyer de l'argent.",
          explanation:
            "Non. On n'a jamais besoin de votre clé secrète pour vous payer. La clé secrète ne sert qu'à dépenser, donc la partager permet à quelqu'un de tout prendre.",
        },
        {
          text: "Les deux clés, pour que le paiement arrive à coup sûr.",
          explanation:
            "Non. Seule la clé publique est nécessaire pour recevoir des fonds. Votre clé secrète doit toujours rester privée.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q3",
      prompt: "Que signifie « vos clés, vos cryptos » ?",
      options: [
        {
          text: "Si vous détenez vous-même les clés secrètes, vous contrôlez vraiment vos coins ; si quelqu'un d'autre les détient, vous faites confiance à cette entreprise.",
          explanation:
            "Correct. L'auto-conservation signifie que le contrôle revient à celui qui détient les clés. Laissez-les à un service et votre accès dépend de ce service.",
        },
        {
          text: "Vos clés font prendre plus de valeur aux coins.",
          explanation:
            "Non. Détenir ses propres clés est une question de contrôle, pas de valeur. Le prix des coins n'a rien à voir avec qui détient les clés.",
        },
        {
          text: "Vous devriez créer une nouvelle clé pour chaque coin que vous possédez.",
          explanation:
            "Non. L'adage parle de qui contrôle les fonds, pas de créer une clé par coin.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q4",
      prompt: "Où est l'endroit le plus sûr pour conserver votre clé secrète ?",
      options: [
        {
          text: "Hors ligne — écrite sur papier dans un endroit sûr, ou sur un portefeuille matériel.",
          explanation:
            "Correct. Garder la clé hors ligne la met hors de portée des attaques réseau. Les sauvegardes papier et les portefeuilles matériels sont les options sûres habituelles.",
        },
        {
          text: "Dans une capture d'écran de la galerie photo de votre téléphone.",
          explanation:
            "Non. Les photos se synchronisent vers le cloud et peuvent être piratées ou divulguées. Une capture d'écran de votre clé est l'un des endroits les plus risqués où la garder.",
        },
        {
          text: "Dans un e-mail à vous-même pour toujours la retrouver.",
          explanation:
            "Non. L'e-mail est en ligne et peut être compromis. Une clé qui traîne dans une boîte de réception est exposée à quiconque accède à ce compte.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q5",
      prompt:
        "Un site web vous demande de saisir votre phrase de récupération pour « vérifier » votre portefeuille. Que se passe-t-il ?",
      options: [
        {
          text: "C'est une arnaque par hameçonnage — saisir la phrase de récupération remet à l'attaquant le contrôle total de votre portefeuille.",
          explanation:
            "Correct. Les applications légitimes ne vous demandent jamais de saisir votre phrase de récupération sur un site web. Le faire révèle le secret maître et permet à l'attaquant de tout prendre.",
        },
        {
          text: "C'est une étape de sécurité normale que tous les portefeuilles exigent.",
          explanation:
            "Non. Saisir votre phrase de récupération sur un site web n'est jamais une étape normale — c'est l'attaque classique de hameçonnage de phrase de récupération.",
        },
        {
          text: "Ce n'est pas grave tant que le site web a l'air professionnel.",
          explanation:
            "Non. Une apparence soignée est précisément la façon dont les arnaques gagnent la confiance. La phrase de récupération ne doit jamais être saisie sur un site web, quelle que soit son apparence.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
