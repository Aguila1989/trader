import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Proteger vos actifs",
  description: "Les vrais risques de securite dans la crypto et comment ce bot vous protege contre eux, de la securite des cles a la pre-verification du solde.",
  lessons: [
    {
      id: "c13-l1",
      title: "Quels sont les plus grands risques de securite dans la crypto ?",
      paragraphs: [
        "La crypto est impitoyable sur un point precis : les actions sont definitives. Une fois qu'une transaction Stellar est confirmee, elle est irreversible. Il n'y a pas de banque a appeler, pas de retrofacturation, pas de service client capable de recuperer les fonds. Ce simple fait redessine tous les risques qui suivent, parce qu'une erreur est en general permanente.",
        "Les plus grands risques se regroupent en quelques categories. Perdre ou divulguer votre cle secrete de signature donne a un attaquant le controle total de vos fonds. Le phishing et les faux sites vous poussent a remettre vous-meme cette cle. Signer une transaction malveillante peut autoriser un transfert que vous n'aviez jamais prevu. Envoyer a la mauvaise adresse deplace de l'argent vers un inconnu pour toujours. Et faire confiance a un faux token ou a un faux emetteur peut vous laisser avec quelque chose de sans valeur qui a simplement l'air authentique.",
        "Remarquez que la plupart de ces risques ne sont pas des piratages exotiques. Ce sont des erreurs humaines ordinaires, amplifiees par l'irreversibilite. La defense n'est pas une question d'ingeniosite ; ce sont des habitudes lentes et reflechies, et des outils qui bloquent les mauvaises actions avant qu'elles n'atteignent la blockchain. C'est exactement ce que ce bot est concu pour faire.",
      ],
      example: "Vous collez une adresse de destination depuis votre presse-papiers, mais un logiciel malveillant l'a remplacee par celle de l'attaquant. Vous confirmez. Les fonds arrivent sur son compte en quelques secondes, et aucune force au monde ne peut faire marche arriere. Une verification de deux secondes des premiers et derniers caracteres l'aurait empechee.",
    },
    {
      id: "c13-l2",
      title: "Comment reconnaitre une arnaque ou une tentative de phishing",
      paragraphs: [
        "Le phishing est l'art de l'usurpation d'identite. Un attaquant cree un site ou un message qui ressemble a un portefeuille, a une plateforme d'echange ou a une equipe de support, puis vous incite a saisir votre cle secrete ou votre phrase de recuperation. Le piege repose sur l'urgence et la familiarite : une alerte indiquant que votre compte est en danger, un airdrop genereux, une page de connexion qui semble parfaitement legitime.",
        "Retenez une seule regle et la plupart des tentatives de phishing echouent : une application legitime ne vous demandera jamais votre cle secrete par e-mail, par chat ou via un formulaire web. Votre cle signe les transactions sur votre propre machine ; aucun vrai service n'a besoin de la voir. Si quoi que ce soit vous demande de coller une cle commencant par S, considerez cela comme la preuve qu'il s'agit d'une arnaque.",
        "Au-dela de ca, ralentissez et verifiez. Controlez le domaine exact, caractere par caractere, car les lettres qui se ressemblent et les mots supplementaires sont frequents. Mefiez-vous des liens non sollicites et de la pression a agir vite. En cas de doute, rendez-vous vous-meme sur le site plutot que de suivre un lien que quelqu'un vous a envoye.",
      ],
      example: "Un message arrive : Votre portefeuille a ete signale, verifiez dans l'heure sur stellar-wallett-secure.com sous peine de perdre l'acces. Le double t dans le domaine et l'exigence de votre phrase de recuperation sont les indices. Un vrai fournisseur n'aurait jamais besoin de votre cle secrete, et ne lancerait jamais un compte a rebours pour vous faire paniquer.",
    },
    {
      id: "c13-l3",
      title: "Qu'est-ce qu'une cle de signature et pourquoi faut-il la proteger ?",
      paragraphs: [
        "Un compte Stellar possede deux cles. La cle publique commence par G et peut etre partagee sans danger ; c'est comme un numero de compte que les autres utilisent pour vous payer. La cle secrete de signature commence par S et doit rester privee. Quiconque detient la cle secrete peut signer des transactions, ce qui signifie qu'il peut deplacer tous les actifs du compte. Il n'y a aucun mot de passe distinct par-dessus.",
        "Ce bot a besoin que la cle secrete soit configuree pour pouvoir signer des trades reels en votre nom. Pour contenir ce pouvoir, il demarre par defaut en mode lecture seule et ne soumettra de vraies transactions qu'une fois que vous aurez deliberement active le Trading en direct. Jusque-la, il peut observer et planifier mais ne peut rien depenser. La machine et l'environnement qui hebergent la cle sont donc aussi sensibles qu'un coffre-fort ; quiconque y a acces a de fait acces a vos fonds.",
        "Traitez toute exposition comme une urgence. Si la cle secrete apparait un jour dans une capture d'ecran, un journal, un fichier partage ou un depot de code, considerez qu'elle est compromise et procedez a sa rotation : creez un nouveau compte, transferez les fonds, et mettez l'ancienne cle au rebut. La rotation coute peu ; la recuperation apres un vol est impossible.",
      ],
      example: "Un developpeur commite un fichier de configuration contenant la cle S de production dans un depot git public pendant dix minutes avant de le supprimer. C'est suffisant. Des bots scannent les depots publics en permanence. La bonne reaction n'est pas d'esperer que personne ne l'a vue, mais de proceder immediatement a la rotation de la cle et de deplacer le solde vers un compte neuf.",
    },
    {
      id: "c13-l4",
      title: "Qu'est-ce que la pre-verification du solde et comment vous protege-t-elle ?",
      paragraphs: [
        "Avant de signer le moindre trade, le bot effectue une pre-verification du solde, aussi appelee preflight. C'est un garde-fou qui pose la question : cette transaction reussirait-elle reellement et laisserait-elle le compte en bonne sante ? Le bot ne passe a la signature que si chaque reponse est oui. Si une seule verification echoue, il bloque proprement le trade au lieu de soumettre quelque chose qui echouerait sur la blockchain ou qui depenserait silencieusement plus que disponible.",
        "La pre-verification controle trois choses en particulier. D'abord, que le compte existe et est finance. Ensuite, qu'il detient une trustline pour l'actif qu'il recevrait, puisque Stellar ne peut pas accepter un actif auquel vous n'avez pas explicitement accorde votre confiance. Enfin, qu'il y a assez de solde depensable une fois soustraits les montants bloques dans les offres ouvertes, la reserve minimale en XLM exigee par le reseau, et une petite marge pour les frais de transaction.",
        "L'objectif est la protection contre soi-meme. Sans le preflight, un trade limite pourrait echouer apres soumission, gaspiller des frais, ou entamer la reserve et mettre le compte en danger. Avec lui, les trades voues a l'echec sont stoppes avant de vous couter quoi que ce soit, et vous obtenez une raison claire plutot qu'une erreur cryptique sur la blockchain.",
      ],
      example: "Vous mettez en file d'attente un achat qui depenserait presque tout votre solde en XLM. Le preflight soustrait les fonds immobilises dans une offre ouverte existante, la reserve minimale et la marge pour les frais, et constate que le montant depensable est insuffisant. Il bloque le trade et signale un solde depensable insuffisant, vous epargnant une soumission echouee et une reserve epuisee.",
    },
    {
      id: "c13-l5",
      title: "Bonnes pratiques pour trader en securite avec cette application",
      paragraphs: [
        "Commencez la ou les erreurs sont gratuites. Entrainez-vous en mode Paper, qui simule les trades sans fonds reels, et fonctionnez sur le testnet Stellar avec un hot wallet jetable avant de toucher a de l'argent sur le mainnet. Quand vous passez en direct, commencez petit. Le cout de l'apprentissage devrait se mesurer en lecons, pas en capital perdu.",
        "Appuyez-vous sur les couches de securite integrees. Le mode lecture seule permet au bot d'observer sans depenser. Le coupe-circuit bloque instantanement tout le trading lorsque vous voulez vous arreter. Les limites par trade et par perte journaliere plafonnent ce qu'un seul trade ou une mauvaise journee peut vous couter. Une liste blanche de tokens autorises tient le bot a l'ecart des emetteurs faux ou non fiables. Ensemble, ils transforment un systeme automatise rapide en un systeme que vous pouvez maitriser.",
        "Enfin, protegez la cle et restez vigilant au moment de passer en direct. Gardez la cle secrete hors des machines partagees et a l'ecart des journaux et des depots. Laissez le bot dans son etat de lecture seule par defaut jusqu'a ce que vous ayez vraiment decide d'activer le Trading en direct, et reexaminez cette decision plutot que de le laisser active par habitude. Ici, la securite est surtout une question de discipline transformee en routine.",
      ],
      example: "Une premiere semaine raisonnable : faites tourner le mode Paper sur le testnet avec un portefeuille jetable pour confirmer que la strategie se comporte bien, fixez une limite de perte journaliere prudente et une liste blanche de tokens stricte, puis activez le Trading en direct avec un solde minuscule et le coupe-circuit a portee de clic. Vous decouvrez les limites du systeme sans miser quoi que ce soit dont la perte vous ennuierait.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Pourquoi l'irreversibilite rend-elle les risques crypto si graves ?",
      options: [
        { text: "Les transactions confirmees ne peuvent pas etre annulees, donc une mauvaise adresse ou une arnaque signee est en general permanente.", explanation: "Correct. Il n'y a ni retrofacturation ni banque pour defaire une transaction Stellar confirmee, c'est pourquoi des erreurs ordinaires deviennent des pertes permanentes." },
        { text: "Parce que les plateformes d'echange facturent des frais eleves pour annuler un paiement.", explanation: "Incorrect. L'annulation n'est pas une option couteuse, elle est tout simplement impossible une fois la transaction confirmee." },
        { text: "Parce que les prix de la crypto changent trop vite pour annuler un trade.", explanation: "Incorrect. La volatilite des prix est un probleme distinct ; le danger central est que le transfert lui-meme ne peut pas etre annule, quel que soit le prix." },
        { text: "Parce qu'il faut attendre plusieurs jours avant que les fonds soient regles.", explanation: "Incorrect. Stellar regle en quelques secondes, et ce reglement rapide fait en realite que l'irreversibilite frappe plus tot, pas plus tard." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q2",
      prompt: "Quel est le signe unique le plus fort qu'un message est une tentative de phishing ?",
      options: [
        { text: "Il mentionne Stellar ou votre portefeuille par leur nom.", explanation: "Incorrect. Les services legitimes nomment aussi la plateforme ; cela seul ne prouve rien." },
        { text: "Il vous demande de saisir ou de coller votre cle secrete ou votre phrase de recuperation.", explanation: "Correct. Une application legitime ne demande jamais votre cle secrete par e-mail, par chat ou via un formulaire web, donc toute demande de ce type est un signal clair d'arnaque." },
        { text: "Il arrive en dehors des heures de bureau normales.", explanation: "Incorrect. L'horaire n'a aucune importance ; les messages automatiques comme les vrais arrivent a n'importe quelle heure." },
        { text: "Il contient un lien cliquable.", explanation: "Incorrect. Les liens sont courants et ne sont pas intrinsequement malveillants ; c'est la demande de votre cle qui est le vrai indice, meme si vous devez toujours verifier les domaines." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q3",
      prompt: "Quelle est la difference entre une cle publique Stellar et une cle secrete ?",
      options: [
        { text: "La cle publique signe les trades et la cle secrete sert uniquement a recevoir des fonds.", explanation: "Incorrect. C'est l'inverse : la cle secrete signe et controle les fonds, la cle publique sert a recevoir." },
        { text: "Les deux cles peuvent etre partagees librement tant que le compte a un mot de passe.", explanation: "Incorrect. Les comptes Stellar n'ont pas de mot de passe distinct ; la cle secrete a elle seule controle les fonds et doit rester privee." },
        { text: "La cle publique commence par G et peut etre partagee sans danger, tandis que la cle secrete commence par S et controle tous les fonds.", explanation: "Correct. Quiconque detient la cle S peut signer des transactions et deplacer chaque actif, elle doit donc rester privee tandis que la cle G est partageable." },
        { text: "La cle secrete n'est qu'une version d'affichage de la cle publique.", explanation: "Incorrect. Elles sont cryptographiquement distinctes ; la cle secrete est la cle privee de signature, pas une vue de la cle publique." },
      ],
      correctIndex: 2,
    },
    {
      id: "c13-q4",
      prompt: "Que verifie la pre-verification du solde (preflight) avant que le bot signe un trade ?",
      options: [
        { text: "Uniquement que le prix actuel du marche est favorable.", explanation: "Incorrect. Le preflight verifie la sante et la faisabilite du compte, pas si le prix represente une bonne affaire." },
        { text: "Que le compte existe, qu'il a une trustline pour l'actif qu'il va recevoir, et qu'il dispose d'assez de solde depensable apres les offres, la reserve et les frais.", explanation: "Correct. Ces trois verifications garantissent que le trade peut reussir sur la blockchain et ne videra pas la reserve, de sorte que les trades voues a l'echec sont bloques proprement." },
        { text: "Que vous avez saisi la bonne cle secrete pour la session.", explanation: "Incorrect. La configuration de la cle est distincte ; le preflight valide les soldes et les trustlines, pas la saisie de la cle." },
        { text: "Qu'aucun autre bot ne trade le meme token au meme moment.", explanation: "Incorrect. Le preflight concerne la capacite de votre propre compte a financer le trade, pas l'activite des autres traders." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Quel ensemble d'habitudes reflete le mieux un trading sur en securite avec cette application ?",
      options: [
        { text: "Activer le Trading en direct immediatement, desactiver les limites de perte et trader tout l'univers de tokens pour maximiser les chances.", explanation: "Incorrect. Cela supprime toutes les couches de securite d'un coup ; les limites, une liste blanche et un debut prudent existent precisement pour eviter cela." },
        { text: "Stocker la cle secrete dans un dossier cloud partage pour pouvoir trader depuis n'importe quel appareil.", explanation: "Incorrect. La cle secrete doit rester hors des machines et des stockages partages ; quiconque y a acces controle vos fonds." },
        { text: "S'entrainer en mode Paper sur le testnet avec un portefeuille jetable, conserver les limites de perte et une liste blanche de tokens, puis passer en direct petit avec le coupe-circuit pret.", explanation: "Correct. Cela utilise les modes d'entrainement gratuits et les garde-fous integres pour decouvrir les limites du systeme sans risquer de capital significatif." },
        { text: "Laisser le Trading en direct active en permanence pour ne jamais manquer une opportunite.", explanation: "Incorrect. Le bot demarre en lecture seule pour une raison ; vous devriez activer le mode direct deliberement et reexaminer cette decision plutot que de le laisser actif par habitude." },
      ],
      correctIndex: 2,
    },
  ],
};
