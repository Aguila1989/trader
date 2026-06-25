import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Proteger vos actifs",
  description: "Les vrais risques de securite dans la crypto et comment ce bot vous en protege, de la gestion des cles cote serveur a la pre-verification du solde qui fait autorite.",
  lessons: [
    {
      id: "c13-l1",
      title: "Les plus grands risques de securite dans la crypto — cles, phishing, fausses applications",
      paragraphs: [
        "Chaque risque de securite dans la crypto herite d'une seule propriete : la finalite. Lorsqu'une transaction Stellar est incluse dans un ledger, elle est irreversible. Il n'y a pas de retrofacturation, pas de banque, pas de service client capable de recuperer les fonds. La plupart des autres risques ne sont que celui-ci amplifie par une erreur, si bien que le bon modele mental n'est pas comment annuler les degats mais comment bloquer les mauvaises actions avant qu'elles n'atteignent la blockchain.",
        "Un compte Stellar est defini par une paire de cles. La cle publique commence par G et peut etre partagee sans danger ; c'est l'adresse a laquelle les autres vous paient. La cle secrete commence par S et confere un controle total. Quiconque detient la cle S peut signer des transactions et deplacer chaque actif du compte, sans aucun second mot de passe par-dessus. Une cle secrete divulguee n'est donc pas une breche partielle. C'est la garde complete, transferee a l'attaquant.",
        "La liste des menaces est courte et concrete. Une cle secrete divulguee donne tout a un attaquant. Le phishing et les faux sites ou applications vous poussent a remettre vous-meme la cle. Signer une transaction malveillante autorise un transfert que vous n'aviez jamais prevu. Envoyer a la mauvaise adresse deplace les fonds vers un inconnu, pour toujours. Et faire confiance a un faux token ou a un faux emetteur vous laisse avec quelque chose de sans valeur qui ressemble simplement au vrai actif.",
        "Remarquez que la plupart de ces risques sont des erreurs humaines, pas des exploits exotiques. Ils reussissent parce que l'irreversibilite supprime le filet de securite sur lequel reposent les autres systemes financiers. La defense est en couches et ennuyeuse : gardez la cle la ou les attaquants ne peuvent pas l'atteindre, verifiez chaque destination, mefiez-vous des contacts non sollicites, et laissez les garde-fous automatises refuser les operations vouees a l'echec ou non financees. Ce bot est construit autour exactement de cette posture, et le reste de ce chapitre en montre les mecanismes precis.",
      ],
      example: "Vous copiez une adresse de destination depuis votre presse-papiers, mais un logiciel malveillant de detournement de presse-papiers l'a silencieusement remplacee par l'adresse de l'attaquant. Vous confirmez. L'actif arrive sur son compte en quelques secondes et ne peut pas etre recupere. Comparer les quatre premiers et les quatre derniers caracteres de l'adresse avec la source en laquelle vous avez confiance aurait detecte l'echange avant la signature.",
    },
    {
      id: "c13-l2",
      title: "Comment reconnaitre une arnaque — signaux d'alerte et exemples",
      paragraphs: [
        "Le phishing est une usurpation d'identite concue pour vous faire agir avant de reflechir. L'attaquant reconstitue de maniere convaincante un portefeuille, une plateforme d'echange ou une equipe de support, puis fabrique une raison de se depecher : une alerte de securite, une fenetre d'airdrop sur le point de se fermer, une page de connexion qui semble parfaite au pixel pres. L'objectif est presque toujours le meme : vous faire reveler votre cle secrete ou votre phrase de recuperation, ou signer une transaction que vous ne comprenez pas.",
        "Une seule regle dejoue la plupart des tentatives : une application legitime n'a jamais besoin de votre cle secrete ni de votre phrase de recuperation. Votre cle signe localement ; aucun vrai service ne vous demande de taper, coller, envoyer par e-mail ou par message direct une chaine commencant par S. Considerez toute demande de ce type comme la preuve definitive d'une arnaque, quelle que soit l'apparence officielle de l'habillage.",
        "Apprenez les indices secondaires pour detecter les tentatives plus rusees. Un support qui vous contacte en premier est un signal d'alerte, car un vrai support attend que vous ouvriez un ticket. Des rendements garantis ou trop beaux pour etre vrais sont un appat. Les domaines sosies substituent ou doublent des lettres et ajoutent des mots rassurants comme secure ou verify. L'urgence et les comptes a rebours existent pour court-circuiter votre jugement. Et les airdrops non sollicites ou le spam de trustlines sont concus pour vous attirer vers une interaction avec un emetteur malveillant, raison pour laquelle ce bot ne trade qu'une liste blanche d'actifs verifies plutot que tout ce qui apparait dans votre compte.",
        "C'est votre habitude, pas votre intelligence, qui constitue la defense. Ralentissez, tapez vous-meme les domaines connus au lieu de suivre des liens, et verifiez l'adresse exacte caractere par caractere. Quand quelque chose vous pousse a sauter ces etapes, cette pression est elle-meme le signal.",
      ],
      example: "Un message direct arrive sans sollicitation : Ici le support Stellar, votre portefeuille a ete signale pour activite suspecte, restaurez l'acces dans l'heure sur stellar-wallett-verify.com et confirmez votre phrase de recuperation. Trois indices s'accumulent : un support qui vous contacte en premier, le domaine sosie au t double, et une demande de votre phrase de recuperation sous un compte a rebours d'une heure. Un vrai fournisseur ne ferait rien de tout cela, et n'a jamais besoin de votre cle secrete.",
    },
    {
      id: "c13-l3",
      title: "Cles de signature, pourquoi elles ne quittent jamais l'appareil, et comment cette application les gere",
      paragraphs: [
        "La raison pour laquelle une cle secrete ne doit jamais quitter un appareil de confiance est structurelle : sur Stellar, il n'y a aucun processus de recuperation ni mot de passe de compte distinct. La possession de la cle S est l'autorite. Une cle qui transite par un formulaire de navigateur, un message de chat, une capture d'ecran ou un fichier partage a, du point de vue de la securite, deja ete divulguee, car vous ne pouvez plus prouver qu'elle n'a pas ete interceptee en chemin.",
        "Cette application est concue pour que la cle reste sur le serveur et nulle part ailleurs. Le secret n'est fourni que sous forme de variable d'environnement cote serveur, STELLAR_SECRET, lue une seule fois au demarrage. Le frontend du navigateur ne la recoit jamais, ne la stocke jamais et ne la transmet jamais. Chaque operation de signature a lieu dans le signataire backend, de sorte que le materiel de la cle ne traverse jamais le reseau vers le client. Le frontend n'envoie jamais qu'une instruction de trader ; il ne peut rien signer par lui-meme.",
        "L'autorite est ensuite controlee par le mode. Sans secret configure, l'application s'evalue en lecture seule : elle peut observer et planifier mais ne peut pas soumettre sur la blockchain. Meme avec une cle presente, elle demarre en lecture seule par defaut — le drapeau d'armement automatique est desactive — et le Trading en direct doit etre arme deliberement, et exige en outre que le moniteur de position soit en cours d'execution avant qu'une vraie soumission puisse avoir lieu. Le Paper trading n'a besoin d'aucune cle, puisque les executions sont simulees. Un Kill switch domine tout cela et bloque chaque trade instantanement.",
        "Si le secret est un jour expose, traitez cela comme un incident actif, pas comme une simple inquietude. Les depots publics et les extraits colles sont scannes par des bots en quelques minutes, et la divulgation equivaut au vol des qu'un attaquant signe en premier. La bonne reaction est la rotation : creez une nouvelle paire de cles, deplacez tous les fonds vers elle, mettez l'ancien compte au rebut, et remplacez STELLAR_SECRET. La rotation coute des frais de transaction ; la recuperation apres une vidange coute tout.",
      ],
      example: "Un collegue colle la configuration de production, cle secrete incluse, dans un outil de suivi de tickets public pendant huit minutes avant de la supprimer. Huit minutes suffisent largement : des scanners automatises surveillent les sources publiques en permanence. Supprimer la publication n'annule pas l'exposition. La seule action sure est de proceder immediatement a la rotation de STELLAR_SECRET vers une nouvelle paire de cles et de balayer le solde vers elle avant qu'un attaquant ne signe.",
    },
    {
      id: "c13-l4",
      title: "La pre-verification du solde — comment le frontend et le backend vous protegent",
      paragraphs: [
        "Avant que le moindre trade reel ne soit signe, le bot effectue une pre-verification du solde, appelee preflight. Elle repond a une seule question : cette transaction se reglerait-elle reellement, et laisserait-elle le compte en bonne sante ? Seul un feu vert complet permet au bot de passer a la signature. Tout echec produit un blocage propre avec un code de raison lisible par machine plutot qu'une soumission vouee a l'echec, et surtout le blocage se produit avant la signature, de sorte qu'un echec garanti sur la blockchain comme op_underfunded ou op_no_trust ne brule jamais de frais de reseau.",
        "La protection commence dans le frontend, comme premier filtre rapide. Le formulaire de commande manuel ne vous laisse vendre que les actifs que vous detenez reellement, via un menu deroulant restreint aux actifs detenus, affiche votre solde disponible en ligne, et desactive ou signale la commande lorsque le montant depasse ce que vous possedez. Cela attrape l'erreur evidente au clavier, avant qu'aucune requete ne quitte le navigateur. Mais le frontend est un confort, pas une autorite : il peut etre contourne, il n'a donc jamais le dernier mot.",
        "La verification backend dans src/stellar/preflight.ts fait autorite et s'execute quoi que le frontend ait cru. Elle confirme que la cle publique est configuree, que le compte existe et est finance sur le bon reseau, et qu'une trustline existe pour l'actif que le trade RECEVRAIT, puisque Stellar ne peut pas accepter un actif auquel vous n'avez pas explicitement accorde votre confiance. Elle calcule ensuite le solde depensable, pas le solde brut. Le depensable equivaut au solde moins les montants bloques dans vos offres ouvertes (selling_liabilities), moins la reserve de base en XLM de (2 + subentry_count) x 0.5 XLM, moins une marge de frais d'environ 0.05 XLM.",
        "En cas d'echec, elle renvoie un blocage structure portant un code de raison — no_public, account, no_trustline, ou insufficient_balance — accompagne des montants requis par rapport aux montants disponibles, afin que la cause soit sans ambiguite. Pour les trades inities par l'IA ou le systeme, elle va une etape plus loin et arme un delai d'attente de cinq minutes pour solde insuffisant sur cette paire et ce sens, afin que la meme proposition non finançable ne soit pas relancee pendant que vous rechargez. C'est un garde-fou temporel grossier : deposer l'actif manquant en plein delai d'attente ne le leve donc pas en avance.",
      ],
      example: "Un achat propose par l'IA depenserait presque tout votre solde en XLM. Le preflight soustrait les XLM bloques dans une offre ouverte existante, la reserve de (2 + subentry_count) x 0.5, et la marge de frais, constate que le depensable est inferieur au cout, et renvoie insufficient_balance avec les chiffres requis par rapport aux disponibles. Aucune transaction n'est signee, donc aucun frais n'est gaspille, et la paire et le sens sont mis de cote sous un delai d'attente de cinq minutes au lieu d'etre reproposes a chaque scan.",
    },
    {
      id: "c13-l5",
      title: "Bonnes pratiques pour trader en securite avec cette application — une checklist",
      paragraphs: [
        "Commencez la ou les erreurs sont gratuites, puis gagnez votre montee en puissance. Lancez d'abord le bot sur le testnet Stellar avec un hot wallet jetable, et utilisez le mode Paper, qui simule les executions et n'a besoin d'aucune cle, pour confirmer que la strategie se comporte bien avant que la moindre valeur sur le mainnet ne soit en jeu. Gardez de petites tailles de position au debut et attachez des stops suiveurs, afin que le prix de l'apprentissage se paie en lecons plutot qu'en capital.",
        "Protegez la cle comme le point unique d'autorite totale. Gardez STELLAR_SECRET hors ligne et cote serveur, ne la collez jamais dans un site web ou un chat, et ne la laissez jamais atteindre une capture d'ecran, un journal ou un depot. Restez en mode Lecture seule ou Paper jusqu'a ce que vous ayez veritablement decide de passer en direct, armez le Trading en direct deliberement plutot que par habitude, et confirmez que le moniteur de position est en cours d'execution afin que les stops et les sorties soient reellement appliques. Gardez le Kill switch a portee de main pour un arret total instantane.",
        "Laissez les garde-fous structurels faire leur travail, et respectez leurs refus. Ne tradez que des tokens en liste blanche afin de ne jamais interagir avec un emetteur faux ou hostile. Faites confiance au blocage du preflight : lorsqu'il signale no_trustline ou insufficient_balance, la solution est d'etablir la trustline ou de financer le compte, pas de contourner la verification. Verifiez deux fois chaque adresse de destination et envoyez d'abord un petit montant de test lorsque vous envoyez vers un nouvel endroit, car l'irreversibilite signifie qu'il n'y a pas de seconde chance.",
        "Enfin, integrez une boucle de verification a votre routine. Surveillez le journal de l'IA pour comprendre pourquoi les trades sont proposes, acceptes ou bloques, afin qu'une mauvaise configuration apparaisse comme un schema plutot que comme une perte surprise. Et si une cle est un jour exposee sous quelque forme que ce soit, arretez de trader, effectuez une rotation vers une nouvelle paire de cles, et balayez les fonds vers elle immediatement. Ici, la securite est surtout une habitude disciplinee appliquee de maniere coherente, soutenue par des garde-fous qui echouent en se fermant.",
      ],
      example: "Une premiere semaine saine : entrainez-vous en mode Paper sur le testnet avec un portefeuille jetable, fixez un dimensionnement par trade prudent et une liste blanche de tokens restreinte, puis armez le Trading en direct avec un solde mainnet minuscule, le moniteur de position en cours d'execution et le Kill switch a un clic. Vous surveillez le journal de l'IA a chaque session et gardez STELLAR_SECRET strictement cote serveur, de sorte que vous apprenez les limites du systeme sans risquer quoi que ce soit dont la perte vous ennuierait.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Pourquoi l'irreversibilite rend-elle les risques crypto comme une mauvaise adresse ou une cle divulguee si graves ?",
      options: [
        { text: "Parce qu'annuler une transaction confirmee coute des frais de reseau eleves.", explanation: "Incorrect. L'annulation n'est pas une option couteuse, elle est tout simplement impossible une fois la transaction dans un ledger ; les frais n'ont aucune importance." },
        { text: "Une fois qu'une transaction est dans un ledger, elle ne peut pas etre annulee, donc une mauvaise adresse ou une arnaque signee est permanente et le vol via une cle divulguee est definitif.", explanation: "Correct. Stellar n'a ni retrofacturation ni annulation, si bien que des erreurs ordinaires et des fuites de cles deviennent des pertes permanentes, raison pour laquelle la prevention compte plus que la recuperation." },
        { text: "Parce que la volatilite des prix rend impossible d'evaluer la perte.", explanation: "Incorrect. La volatilite des prix est un probleme distinct ; le danger central est que le transfert lui-meme ne peut pas etre annule, quel que soit le prix." },
        { text: "Parce que les fonds mettent plusieurs jours a etre regles, laissant une longue fenetre d'exposition.", explanation: "Incorrect. Stellar regle en quelques secondes, et ce reglement rapide fait en realite que l'irreversibilite frappe plus tot, pas plus tard." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q2",
      prompt: "Quel est le signe unique le plus fort qu'un message est une tentative de phishing ou d'arnaque ?",
      options: [
        { text: "Il vous demande de saisir, coller ou confirmer votre cle secrete ou votre phrase de recuperation.", explanation: "Correct. Une application legitime n'a jamais besoin de votre cle secrete ni de votre phrase de recuperation, donc toute demande de ce type est la preuve definitive d'une arnaque, quel que soit l'habillage." },
        { text: "Il mentionne Stellar ou votre portefeuille par leur nom.", explanation: "Incorrect. Les vrais services nomment aussi la plateforme, donc ce detail a lui seul ne prouve rien." },
        { text: "Il contient un lien cliquable.", explanation: "Incorrect. Les liens sont courants et ne sont pas intrinsequement malveillants ; la demande de votre cle est le vrai indice, meme si vous devez toujours verifier les domaines vous-meme." },
        { text: "Il arrive tard le soir ou pendant le week-end.", explanation: "Incorrect. L'horaire n'a aucune importance ; les messages automatiques comme les messages legitimes peuvent arriver a n'importe quelle heure." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q3",
      prompt: "Comment cette application gere-t-elle la cle secrete de signature, et a quoi sert la cle publique ?",
      options: [
        { text: "Le frontend stocke la cle secrete dans le navigateur pour pouvoir signer les trades rapidement, et la cle publique en est une sauvegarde.", explanation: "Incorrect. Le frontend ne voit jamais la cle secrete, et la cle publique n'est pas une sauvegarde ; c'est l'adresse partageable, cryptographiquement distincte." },
        { text: "Les deux cles peuvent etre partagees tant que le compte est aussi protege par un mot de passe.", explanation: "Incorrect. Les comptes Stellar n'ont pas de mot de passe distinct, et la cle secrete a elle seule controle tous les fonds, elle ne doit donc jamais etre partagee." },
        { text: "La cle secrete est la cle publique inversee, donc proteger l'une protege les deux.", explanation: "Incorrect. Ce sont des valeurs independantes issues d'une paire de cles, pas des transformations l'une de l'autre ; la cle publique ne peut pas etre reconvertie en cle secrete." },
        { text: "La cle secrete (S...) controle tous les fonds et n'est configuree que cote serveur sous STELLAR_SECRET, de sorte que le navigateur ne la voit jamais, tandis que la cle publique (G...) est l'adresse partageable ; l'application demarre aussi en lecture seule par defaut.", explanation: "Correct. La signature n'a lieu que dans le backend, le frontend ne recoit jamais la cle, l'application demarre en lecture seule jusqu'a ce que le mode direct soit arme deliberement, et la cle G peut etre partagee sans danger pour recevoir." },
      ],
      correctIndex: 3,
    },
    {
      id: "c13-q4",
      prompt: "Que verifie la pre-verification du solde backend (preflight) avant que le bot signe, et pourquoi bloquer tot est-il utile ?",
      options: [
        { text: "Uniquement que le prix actuel du marche est assez favorable pour etre rentable.", explanation: "Incorrect. Le preflight verifie la faisabilite du reglement et la sante du compte, pas si le prix est une bonne affaire." },
        { text: "Que le compte existe, detient une trustline pour l'actif qu'il va recevoir, et dispose d'assez de solde depensable apres les offres ouvertes, la reserve en XLM et la marge de frais ; bloquer avant la signature ne gaspille aucun frais de reseau sur un op_underfunded ou op_no_trust voue a l'echec.", explanation: "Correct. Le depensable est le solde moins selling_liabilities, la reserve de (2 + subentry_count) x 0.5 XLM, et une marge de frais d'environ 0.05 XLM, et s'arreter avant la signature signifie qu'un echec garanti sur la blockchain ne coute rien." },
        { text: "Que vous avez saisi la bonne cle secrete pour cette session de trading.", explanation: "Incorrect. La cle est une configuration cote serveur, pas une saisie de session ; le preflight valide les trustlines et le solde depensable, pas la saisie de la cle." },
        { text: "Qu'aucun autre trader n'est actif sur le meme marche au meme moment.", explanation: "Incorrect. Le preflight ne concerne que la capacite de votre propre compte a financer et recevoir le trade, pas les autres participants." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Quel ensemble d'habitudes reflete le mieux un trading sur en securite avec cette application ?",
      options: [
        { text: "Armer le Trading en direct immediatement, desactiver le moniteur de position, et trader tous les tokens qui apparaissent dans le compte.", explanation: "Incorrect. Cela supprime la valeur par defaut en lecture seule, le moniteur qui applique les stops, et la liste blanche qui vous tient a l'ecart des emetteurs hostiles." },
        { text: "Garder STELLAR_SECRET dans un dossier cloud partage pour que le bot puisse tourner depuis n'importe quelle machine.", explanation: "Incorrect. La cle secrete doit rester hors ligne et cote serveur ; quiconque a acces a ce dossier obtient le controle total des fonds." },
        { text: "S'entrainer en mode Paper sur le testnet avec un portefeuille jetable, ne trader que des tokens en liste blanche, armer le mode direct petit avec le moniteur en cours d'execution et le Kill switch pret, et effectuer la rotation de toute cle exposee.", explanation: "Correct. Cela utilise les modes d'entrainement gratuits et chaque garde-fou integre, respecte les blocages du preflight, et traite l'exposition d'une cle comme un incident, de sorte que vous apprenez sans risquer de capital significatif." },
        { text: "Contourner les blocages du preflight lorsqu'ils signalent insufficient_balance afin de ne jamais manquer un trade.", explanation: "Incorrect. Un blocage du preflight signifie que le trade echouerait ou entamerait la reserve ; la solution est de financer le compte ou d'ajouter la trustline, pas de contourner la verification." },
      ],
      correctIndex: 2,
    },
  ],
};
