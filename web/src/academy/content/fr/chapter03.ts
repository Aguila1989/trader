import type { Chapter } from "../../types";

export const chapter03: Chapter = {
  id: "c3",
  number: 3,
  level: "BASIC",
  title: "Votre premier trade",
  description: "Passez votre premier trade manuel : lisez le formulaire VOUS VENDEZ / VOUS ACHETEZ, choisissez entre ordre au marche ou a cours limite, comprenez les frais, et envoyez vos tokens en toute securite.",
  lessons: [
    {
      id: "c3-l1",
      title: "Que signifie acheter et vendre un token ?",
      paragraphs: [
        "Chaque trade est en realite un swap. Vous cedez un token que vous detenez deja et vous recevez un autre token en echange. Il n y a pas de compte en especes separe en coulisses, donc pour acheter quelque chose vous devez forcement depenser autre chose que vous possedez deja.",
        "Dans cette app, le swap est toujours presente comme une vente. Vous choisissez un token sous VOUS VENDEZ, puis le token souhaite sous VOUS ACHETEZ. En interne, le bot traite cela comme la vente de l actif VOUS VENDEZ contre l actif VOUS ACHETEZ, meme quand vous avez l impression de simplement acheter.",
        "Comme vous ne pouvez ceder que ce que vous detenez, le menu deroulant VOUS VENDEZ ne liste que les tokens deja presents dans votre portefeuille. Si un token n y figure pas, c est que vous n en avez pas a depenser : faites d abord un swap vers ce token depuis quelque chose que vous detenez.",
      ],
      example: "Vous detenez 500 XLM et vous voulez du USDC. Vous reglez VOUS VENDEZ sur XLM et VOUS ACHETEZ sur USDC, en depensant 100 XLM. Le bot vend 100 XLM contre du USDC au cours en vigueur. Pour revenir plus tard a du XLM, vous feriez le swap inverse : VOUS VENDEZ USDC, VOUS ACHETEZ XLM.",
    },
    {
      id: "c3-l2",
      title: "Quelle est la difference entre un ordre au marche et un ordre a cours limite ?",
      paragraphs: [
        "Le formulaire propose un bouton Limite / Marche. L app les decrit ainsi : un ordre Limite reste en attente au prix que vous fixez et ne s execute qu a ce prix ou mieux. Un ordre Marche s execute immediatement contre le meilleur prix actuel du carnet d ordres.",
        "Un ordre au marche est rapide et simple. Il prend le meilleur prix disponible a l instant, il s execute donc presque toujours, mais vous ne maitrisez pas le cours exact obtenu. Un ordre a cours limite vous laisse fixer votre prix et attendre, mais il ne s execute que si le marche atteint ce prix, et il se peut qu il ne s execute jamais.",
        "Quand vous choisissez Limite, vous devez saisir un prix. Quand vous choisissez Marche, le bot utilise pour vous le meilleur cours acheteur en direct, aucun prix n est donc requis. Les debutants commencent souvent par de petits ordres au marche pour apprendre, puis passent aux ordres a cours limite pour la patience et le controle.",
      ],
      example: "Le USDC se negocie autour de 0.085 XLM l unite. Un ordre au marche pour vendre du XLM s execute instantanement aux alentours de 0.085. Un ordre a cours limite regle pour acheter du USDC seulement quand le ratio XLM par USDC descend a 0.080 reste en attente dans le carnet et ne s execute que si le prix tombe la ; s il n y descend jamais, rien ne se passe.",
    },
    {
      id: "c3-l3",
      title: "Comment lire l interface VOUS VENDEZ / VOUS ACHETEZ de cette app",
      paragraphs: [
        "Le formulaire se lit de haut en bas. VOUS VENDEZ est le token que vous cedez, choisi dans un menu deroulant des tokens que vous detenez. VOUS ACHETEZ est le token que vous recevez, choisi dans l ensemble complet des tokens selectionnes. Un recapitulatif en direct reformule cela par Vous vendez X, vous achetez Y afin d eviter toute confusion.",
        "Le champ Prix indique le montant VOUS ACHETEZ pour 1 unite de VOUS VENDEZ. Le solde disponible vous indique combien du token VOUS VENDEZ vous pouvez depenser. La tolerance au slippage, exprimee en pourcentage, correspond a l ecart de prix admis avant que l ordre ne soit annule pour vous proteger.",
        "Une section Avance ajoute un Prix cible et un Prix d invalidation optionnels. Ce sont des reperes pour votre propre plan et ils sont facultatifs. Chaque ordre passe aussi par une pre-verification du solde avant la signature, le bot refuse donc de soumettre un trade que vous ne pouvez pas reellement financer.",
      ],
      example: "Vous reglez VOUS VENDEZ sur XLM, VOUS ACHETEZ sur USDC, le Prix sur 0.085 et le slippage sur 1 pour cent. Le solde disponible affiche 500 XLM. Vous saisissez 100 XLM. Le recapitulatif indique Vous vendez 100 XLM, vous achetez environ 8.5 USDC. Si le cours bouge de plus de 1 pour cent avant l execution, l ordre est annule plutot que de vous offrir une moins bonne affaire.",
    },
    {
      id: "c3-l4",
      title: "Qu est-ce qu un frais de trading et combien Stellar facture-t-il ?",
      paragraphs: [
        "Sur de nombreuses plateformes, vous payez un frais en pourcentage sur chaque trade, parfois un ou deux pour cent. Stellar fonctionne differemment. Le SDEX, l echange decentralise sur lequel ce bot trade, ne facture aucun frais de trading en pourcentage. Vous ne payez qu un minuscule frais de reseau plus le spread.",
        "Le frais de reseau se paie en XLM et est preleve par operation. Le frais de base actuel est de 100 stroops, soit 0.00001 XLM par operation, une fraction de centime de dollar. Un stroop est la plus petite unite de XLM, un dix-millionieme d un seul XLM.",
        "Le vrai cout a surveiller est le spread, l ecart entre le meilleur prix acheteur et le meilleur prix vendeur. Franchir un spread large coute bien plus cher que le frais de reseau. Dimensionnez donc vos trades autour du spread, et non autour du frais de reseau, qui est quasi negligeable.",
      ],
      example: "Vous passez un ordre au marche pour vendre du XLM contre du USDC. Le frais de reseau est de 100 stroops, soit 0.00001 XLM, bien en dessous d un centime. Il n y a aucune ponction en pourcentage par-dessus. Si le spread entre les prix acheteur et vendeur est de 0.3 pour cent, c est ce spread, et non le frais, qui constitue votre principal cout de trading sur le swap.",
    },
    {
      id: "c3-l5",
      title: "Comment envoyer des tokens vers un autre portefeuille en toute securite",
      paragraphs: [
        "En dehors du trading, le portefeuille dispose d une fonction Envoyer et Payer pour transferer des tokens vers une autre adresse. Vous saisissez une cle publique de destination, qui commence par la lettre G, puis vous choisissez l actif, le montant et un memo optionnel. Certaines plateformes exigent ce memo pour crediter votre depot, ne le sautez donc pas quand il est demande.",
        "Les paiements Stellar sont irreversibles. Si vous saisissez la mauvaise adresse, il n y a pas d annulation possible ni de service d assistance pour recuperer les fonds. Verifiez donc la destination caractere par caractere, et ne collez jamais une adresse que vous n avez pas confirmee depuis une source de confiance.",
        "Pour tout actif non natif, comme le USDC, le destinataire doit deja detenir une trustline pour cet actif, sinon le paiement echoue. La bonne habitude est toujours la meme : envoyez d abord un tout petit montant test, confirmez qu il arrive, puis envoyez le reste.",
      ],
      example: "Vous voulez envoyer 200 USDC a un ami dont l adresse commence par GBXY et se termine par 7QWP. Vous envoyez d abord 1 USDC en test. Il arrive, ce qui confirme a la fois l adresse et le fait que son portefeuille dispose d une trustline USDC. C est seulement alors que vous envoyez les 199 USDC restants, en ajoutant le memo demande par sa plateforme.",
    },
  ],
  quiz: [
    {
      id: "c3-q1",
      prompt: "Dans cette app, que se passe-t-il reellement quand vous remplissez VOUS VENDEZ XLM et VOUS ACHETEZ USDC ?",
      options: [
        { text: "Vous vendez du XLM en echange de USDC.", explanation: "Correct. Chaque trade est un swap, et l app le presente toujours comme la vente de l actif VOUS VENDEZ contre l actif VOUS ACHETEZ." },
        { text: "Vous deposez du XLM sur un compte en especes separe.", explanation: "Incorrect. Il n y a pas de compte en especes separe ; un trade echange directement un token contre un autre." },
        { text: "Vous empruntez du USDC en garantie de votre XLM.", explanation: "Incorrect. Aucun emprunt n a lieu. Vous cedez simplement du XLM et recevez du USDC." },
      ],
      correctIndex: 0,
    },
    {
      id: "c3-q2",
      prompt: "Selon l app, que fait un ordre au marche ?",
      options: [
        { text: "Il reste en attente jusqu a ce que le prix atteigne un niveau que vous avez saisi.", explanation: "Incorrect. Cela decrit un ordre a cours limite, qui ne s execute qu a votre prix fixe ou mieux." },
        { text: "Il s execute immediatement contre le meilleur prix actuel du carnet d ordres.", explanation: "Correct. Un ordre au marche prend tout de suite le meilleur prix en direct, il s execute donc presque toujours." },
        { text: "Il annule le trade des qu un frais s applique.", explanation: "Incorrect. Le type d ordre n a rien a voir avec une annulation liee aux frais." },
        { text: "Il garantit le prix exact que vous vouliez.", explanation: "Incorrect. Un ordre au marche offre de la rapidite, pas le controle du prix ; le cours peut bouger pendant l execution." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q3",
      prompt: "Pourquoi le menu deroulant VOUS VENDEZ ne liste-t-il que certains tokens ?",
      options: [
        { text: "Il n affiche que les tokens que le bot recommande d acheter.", explanation: "Incorrect. VOUS VENDEZ concerne ce que vous cedez, pas des recommandations." },
        { text: "Il n affiche que les tokens sans frais de reseau.", explanation: "Incorrect. Le frais de reseau s applique aux operations quel que soit le token que vous vendez." },
        { text: "Il ne liste que les tokens que vous detenez deja, puisque vous ne pouvez depenser que ce que vous possedez.", explanation: "Correct. Vous ne pouvez vendre que les tokens presents dans votre portefeuille, le menu deroulant se limite donc aux actifs detenus." },
      ],
      correctIndex: 2,
    },
    {
      id: "c3-q4",
      prompt: "Combien le SDEX de Stellar facture-t-il en frais de trading ?",
      options: [
        { text: "Un forfait de un pour cent sur chaque trade.", explanation: "Incorrect. Le SDEX ne facture aucun frais de trading en pourcentage." },
        { text: "Aucun frais de trading en pourcentage ; uniquement un minuscule frais de reseau de 100 stroops par operation plus le spread.", explanation: "Correct. Le frais de base est de 100 stroops, soit 0.00001 XLM par operation, et le vrai cout a surveiller est le spread." },
        { text: "Un frais de deux pour cent paye en USDC.", explanation: "Incorrect. Il n y a aucune ponction en pourcentage, et le frais de reseau se paie en XLM, pas en USDC." },
        { text: "Rien du tout, pas meme un frais de reseau.", explanation: "Incorrect. Il subsiste un minuscule frais de reseau de 100 stroops par operation, meme s il n y a pas de frais de trading en pourcentage." },
      ],
      correctIndex: 1,
    },
    {
      id: "c3-q5",
      prompt: "Quelle est la premiere etape la plus sure avant d envoyer une grosse somme de USDC vers un autre portefeuille ?",
      options: [
        { text: "Envoyer d abord un tout petit montant test pour confirmer l adresse et la trustline.", explanation: "Correct. Les paiements sont irreversibles, un petit test confirme donc que l adresse est correcte et que le destinataire dispose d une trustline USDC avant d envoyer le reste." },
        { text: "Envoyer immediatement la totalite du montant pour qu il ne puisse pas etre intercepte.", explanation: "Incorrect. Les paiements Stellar sont irreversibles ; une mauvaise adresse ne peut pas etre annulee, se precipiter est donc risque." },
        { text: "Sauter le memo pour garder le transfert prive.", explanation: "Incorrect. Certaines plateformes ont besoin du memo pour crediter votre depot, le sauter peut donc faire perdre les fonds." },
        { text: "Utiliser une adresse trouvee sans en confirmer la source.", explanation: "Incorrect. Confirmez toujours la destination depuis une source de confiance, car une mauvaise adresse signifie une perte definitive." },
      ],
      correctIndex: 0,
    },
  ],
};
