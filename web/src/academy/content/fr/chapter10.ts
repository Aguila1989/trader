import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "Trading par IA en profondeur",
  description: "Un regard technique sur la facon dont l'analyste raisonne, ce que contient une proposition, quand l'accepter ou la refuser, comment elle coexiste avec le trading manuel, et comment lire le journal de l'IA.",
  lessons: [
    {
      id: "c10-l1",
      title: "Comment l'IA genere ses propositions de trade : les donnees qu'elle utilise et la facon dont elle raisonne",
      paragraphs: [
        "L'IA de ce bot s'appelle l'analyste, et c'est un modele pilote par des outils plutot qu'une simple fenetre de discussion. Vous choisissez un fournisseur dans le menu deroulant (Anthropic Claude, OpenAI ou DeepSeek), et seuls les fournisseurs pour lesquels une cle API est configuree sont selectionnables. L'analyste fonctionne sur trois declencheurs : Analyser pour une seule paire, Scanner la chaine sur l'univers XLM organise plus quelques paires croisees, ou le minuteur de scan automatique si vous l'avez active. Il ne diffuse pas en continu ; chaque execution est une requete distincte qui se termine par zero proposition ou plus.",
        "Le raisonnement se fait par des appels d'outils, pas par des suppositions. L'analyste interroge get_account_balances pour voir vos avoirs et vos offres en attente, get_market pour le meilleur bid et le meilleur ask du carnet d'ordres ainsi que la profondeur visible, et get_price_history pour les bougies OHLC accompagnees d'indicateurs calcules sur le serveur. Ces indicateurs sont calcules sur le backend, pas par le modele, ils sont donc coherents d'une execution a l'autre : rsi14, ema8 face a ema24, atrPct et realizedVolPct, efficiencyRatio, rangePos de 0 au plus bas a 1 au plus haut, volRatio, flowBuyPct, et un tag de regime trending-up, trending-down, ranging ou volatile.",
        "Point crucial, l'analyste n'est pas sans memoire. Il recoit un bloc de memoire de trading : le PnL realise du jour en XLM, le PnL latent sur les positions ouvertes, vos positions actuelles, et les trades recents, chacun annote de son mouvement en pourcentage ajuste selon le sens a plus-1h et a plus-24h. Ces resultats post-trade lui permettent d'evaluer si les entrees recentes ont vraiment fonctionne, plutot que de relancer un graphique dans le vide. On lui communique aussi le profil de risque actif et le plafond de taille effectif par trade pour cette paire precise, de sorte que le montant qu'il propose est borne avant meme que la politique ne le voie.",
        "En resume, une seule execution se lit a peu pres ainsi : recuperer les avoirs et les offres, recuperer le carnet, recuperer les bougies et les indicateurs, integrer la memoire de la facon dont les dernieres entrees se sont deroulees, puis decider si le regime actuel et le carnet justifient une entree que le portefeuille peut reellement financer a l'interieur du plafond de taille. Si rien ne franchit ce seuil, l'analyste ne renvoie aucune proposition pour la paire, ce qui est un resultat normal et frequent.",
      ],
      example: "Une execution Scanner la chaine sur XLM/USDC : get_market renvoie un meilleur bid a 0.1176 et un ask a 0.1182, get_price_history renvoie un regime ranging avec rangePos 0.18, rsi14 41, ema8 venant juste de croiser au-dessus d'ema24, flowBuyPct 0.61. Le bloc de memoire montre que les deux derniers achats de creux ont gagne plus 0.3 pour cent a plus-1h. Le plafond par trade est de 50 XLM. L'analyste emet une proposition d'achat de 40 XLM.",
    },
    {
      id: "c10-l2",
      title: "A l'interieur d'une proposition de l'IA : score de confiance, raisonnement, instantane de risque, prix",
      paragraphs: [
        "Chaque proposition est emise via l'outil propose_stellar_trade sous forme d'objet structure, jamais de texte libre, pour que le backend puisse agir dessus de maniere deterministe. L'objet porte le sens (buy ou sell), les actifs de base et de cotation, un montant, un limit_price, un drapeau post_only, un max_slippage_bps, une raison ecrite, un score de confiance numerique de 0 a 100, un target_price, un invalidation_price, et un horizon optionnel exprime en heures, jours ou semaines.",
        "Le champ de confiance est un changement recent et important : il s'agit desormais d'un score numerique de 0 a 100, et non plus d'une etiquette basse, moyenne ou haute. Cette precision compte car le Mode Expert compare le score directement a votre seuil minConfidence exact. Si le score est insuffisant, la proposition est mise en attente de revision et un evenement est ecrit, par exemple Proposal skipped: confidence 68 < threshold 70. Une confiance manquante ou corrompue echoue toujours du cote prudent, de sorte qu'un score mal forme est traite comme un refus plutot que comme un passage.",
        "Le drapeau post_only encode l'intention maker-first. Lorsqu'il est active, l'ordre se pose au touch pour capturer le spread en tant que maker plutot que de croiser le carnet et de payer le cote taker. Lus conjointement avec max_slippage_bps, ces deux champs bornent la qualite d'execution : post_only vise a gagner le spread, tandis que le plafond de slippage limite jusqu'ou un fill croisant peut deriver si le carnet bouge.",
        "La raison, le target_price et l'invalidation_price forment la these et sa carte de sortie. Le backend derive un ratio rendement/risque a partir de la distance entre limit_price et target_price face a la distance entre limit_price et invalidation_price, et il impose un ratio minimal (1.2 par defaut) avant d'autoriser le trade. A cote de la proposition, l'instantane complet du profil de risque est journalise pour que les conditions soient auditables : le journal de l'IA enregistre un evenement proposal et un evenement risk_profile pour chaque execution, capturant le profil par facteur actif et les plafonds effectifs en vigueur a ce moment-la.",
      ],
      example: "Un payload propose_stellar_trade : side sell, base XLM, quote USDC, amount 30, limit_price 0.1205, post_only true, max_slippage_bps 40, confidence 74, target_price 0.1232, invalidation_price 0.1188. Le rendement/risque est d'environ 1.6, ce qui franchit le minimum de 1.2, et 74 franchit un minConfidence de 70, donc la proposition passe la barriere et est journalisee avec son instantane risk_profile.",
    },
    {
      id: "c10-l3",
      title: "Quand accepter et quand refuser une proposition de l'IA",
      paragraphs: [
        "L'acceptation est un jugement sur trois choses que la proposition vous remet : la raison, le score de confiance, et le rendement/risque entre la cible et l'invalidation. Une proposition merite d'etre acceptee quand sa raison ecrite se rattache nettement aux indicateurs et au carnet que vous pouvez verifier, quand sa confiance se situe confortablement au-dessus de votre seuil plutot que de le froler, et quand la distance jusqu'au target_price depasse de maniere significative la distance jusqu'a l'invalidation_price. Si l'un de ces trois points est faible, vous avez affaire a une idee marginale, meme si le backend la laisserait techniquement passer.",
        "La finançabilite est la barriere stricte qu'on oublie. Pour ACHETER l'actif de base, vous devez detenir l'actif de cotation, et pour VENDRE, vous devez detenir l'actif de base. La verification prealable de solde bloquera un trade non finançable, mais vous ne devriez pas vous y reposer ; un portefeuille tout en XLM ne peut financer aucune proposition d'achat, aussi solide que soit la these, et c'est precisement le piege de positionnement du portefeuille qui fait paraitre inactif un analyste pourtant sain. Si vous voulez que l'analyste agisse sur l'achat de creux, vous devez d'abord detenir un peu d'actif de cotation. C'est pourquoi un portefeuille entierement compose de l'actif de base accumulera des propositions d'achat non finançables tandis que chaque vente finançable s'execute quand meme : les occasions manquees sont des manques de positionnement, pas un modele trop prudent.",
        "Refusez de maniere decisive quand la these est mince, quand le score numerique est en dessous de votre seuil ou tout juste a son niveau, quand le limit_price s'est deja eloigne de l'endroit ou la raison a ete construite, ou quand accepter vous surconcentrerait sur un seul actif. En mode approuver-chaque-trade, rien n'est soumis tant que vous n'avez pas clique, donc un refus ne vous coute rien et garde votre historique de decisions propre et porteur de sens pour une revision ulterieure.",
        "Rappelez-vous que le backend applique toujours la politique, quelle que soit votre lecture. Meme une proposition que vous adorez doit franchir la liste blanche, le plafond de taille par trade, les plafonds quotidiens de volume, de trades et de pertes, la borne de slippage, le ratio rendement/risque minimal, les plafonds d'exposition, la pause sur drawdown 24h, et la verification prealable de solde. Votre acceptation est un feu vert, pas un passe-droit ; les barrieres sont le filet de securite.",
      ],
      example: "L'analyste propose d'acheter 40 XLM a 0.1180, confiance 82, cible 0.1240, invalidation 0.1160, rendement/risque d'environ 3.0, raison un ask qui s'eclaircit avec flowBuyPct 0.66. La these, le score et le rendement/risque tiennent tous, mais votre portefeuille contient 600 XLM et 0 USDC, donc c'est non finançable ; la verification prealable de solde le bloquerait et le bon geste est de detenir d'abord des USDC si vous voulez que ce cote achat s'execute.",
    },
    {
      id: "c10-l4",
      title: "Comment l'IA et le trading manuel interagissent : preseance, conflits, coexistence",
      paragraphs: [
        "Les trades manuels et IA passent par un seul moteur d'execution et partagent les memes barrieres de securite, mais ils different sur un point deliberement : un ordre manuel CONTOURNE le plafond de taille par trade de l'IA. Le plafond de taille existe pour borner ce que l'analyste dimensionne en votre nom, donc quand vous passez un ordre a la main, c'est vous qui le dimensionnez et le plafond ne s'applique pas. Toutes les autres barrieres s'appliquent encore, donc un ordre manuel ne peut jamais sauter la liste blanche, le slippage, les plafonds de pertes, la pause sur drawdown ou la verification prealable de solde.",
        "Les sorties qui reduisent le risque priment sur les frictions d'approbation. Une cloture par stop loss qui reduit une position ouverte s'execute automatiquement et immediatement, meme en mode approuver-chaque-trade, parce que le bot ne vous fera pas patienter pour approuver la sortie d'une position perdante. Les entrees et les ajouts attendent votre approbation la ou le mode l'exige ; les sorties protectrices, non, et cette asymetrie est intentionnelle pour que la protection ne soit jamais conditionnee a un clic que vous pourriez rater.",
        "Les stop loss IA et manuels coexistent plutot que de s'affronter. Si vous avez defini un stop manuel et que l'analyste en porte un aussi, le moniteur applique le plus protecteur des deux, c'est-a-dire que le stop qui sort plus tot sur un mouvement defavorable l'emporte. Vous ne vous retrouvez jamais avec un stop IA plus laxiste qui ecrase un stop manuel plus serre ; la protection se resserre toujours vers la securite. La meme logique s'applique si vous resserrez un stop manuel apres que l'analyste a defini le sien : le moniteur suit simplement le niveau desormais le plus proche, de sorte qu'une intervention manuelle peut rendre la protection plus stricte mais jamais plus laxiste.",
        "Parce que les deux flux partagent vos soldes et vos limites reels, ils interagissent a travers le portefeuille lui-meme. Un achat manuel consomme de l'actif de cotation et reduit la marge restante sous le plafond de taille pour la prochaine idee de l'analyste ; une vente manuelle libere de l'actif de cotation qui peut ensuite financer un achat IA. Le tableau d'historique etiquette chaque fill comme Manuel ou Bot pour que vous puissiez reconstituer qui a fait quoi, et le coupe-circuit se situe au-dessus des deux, bloquant tout le trading quelle que soit la source.",
      ],
      example: "Le mode est Reel avec approuver-chaque-trade. Vous vendez manuellement 200 XLM contre des USDC, avec une taille superieure au plafond par trade de l'analyste, ce qui est autorise car les ordres manuels contournent ce plafond precis. Le prix chute ensuite dans votre position longue ouverte et une cloture par stop loss se declenche ; elle s'execute automatiquement sans attendre d'approbation parce qu'elle reduit le risque. Le stop manuel a 0.1170 et le stop IA a 0.1165 coexistent, et le moniteur applique 0.1170 comme le plus protecteur.",
    },
    {
      id: "c10-l5",
      title: "Comment lire le journal de l'IA et interpreter l'historique des decisions",
      paragraphs: [
        "Le journal de l'IA se trouve sous l'onglet Logs, dans son propre sous-onglet Journal de l'IA. Il est pagine et filtrable par type d'evenement, par token et par date, et chaque ligne montre le raisonnement, l'instantane du profil de risque, la confiance, le sens et le prix de cet evenement. Bien le lire, c'est le traiter comme la piste de raisonnement de l'analyste, et pas seulement comme une liste de fills.",
        "Apprenez le vocabulaire des evenements, car chaque type raconte une partie differente de l'histoire. Un evenement proposal est une idee que l'analyste a emise ; accepted et rejected enregistrent ce qui lui est arrive ; risk_constraint marque une proposition qu'une barriere de politique a bloquee, comme un plafond de taille ou un echec de rendement/risque ; stop_loss enregistre une sortie protectrice ; trail_update montre un stop suiveur qui se resserre ; cooldown montre que l'analyste a ete empeche de reproposer trop tot la meme paire et le meme sens ; et risk_profile capture le profil actif et les plafonds effectifs au moment de l'execution.",
        "Les lectures les plus instructives associent les evenements deux a deux. Un proposal immediatement suivi d'un risk_constraint vous indique que l'idee etait saine mais que la politique l'a arretee, ce qui est un signal de reglage plutot qu'un echec du modele. Une execution qui ne journalise aucun proposal du tout, ou une ligne proposal skipped comme confidence 68 < threshold 70, vous indique que l'analyste a regarde et a decline, ce qui est exactement ce que vous voulez voir la plupart du temps. Une longue serie d'achats non finançables sans aucun fill est la signature du positionnement du portefeuille, pas un exces de prudence.",
        "Le LiveLogDrawer toujours actif complete le journal complet en montrant les quelque 20 derniers evenements combines avec des liens profonds, de sorte que vous pouvez jeter un coup d'oeil a l'activite recente sans ouvrir l'onglet Logs et sauter directement a l'entree complete quand quelque chose semble meriter une investigation. Utilisez le tiroir pour la surveillance en direct et le sous-onglet Journal de l'IA pour la revision forensique, en filtrant par token et par date quand vous voulez reconstituer de bout en bout l'historique des decisions d'une seule paire.",
      ],
      example: "En filtrant le journal de l'IA sur XLM sur une journee, on voit : un evenement risk_profile capturant le profil actif, puis un proposal d'achat a confiance 74, puis un risk_constraint indiquant un rendement/risque de 1.05 inferieur au minimum de 1.2, donc aucun fill. Une heure plus tard, un evenement cooldown bloque un achat presque identique. La piste vous indique que l'analyste etait actif et raisonnable, et que c'est la politique, pas le modele, qui vous a maintenu a plat.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Quel ensemble d'entrees l'analyste recoit-il reellement lors d'une execution ?",
      options: [
        { text: "Uniquement les bougies OHLC brutes, tous les indicateurs etant calcules par le modele lui-meme.", explanation: "Incorrect. Les indicateurs comme rsi14, ema8 face a ema24, atrPct, efficiencyRatio, rangePos, volRatio, flowBuyPct et le tag de regime sont calcules cote serveur et remis a l'analyste, pas derives par le modele." },
        { text: "Les soldes et les offres en attente, le carnet d'ordres et la profondeur, les bougies avec indicateurs calcules sur le serveur, un bloc de memoire de trading avec les resultats post-trade, et le plafond de taille par paire.", explanation: "Correct. L'analyste rassemble ces elements via get_account_balances, get_market et get_price_history, plus le bloc de memoire et le plafond effectif par trade pour la paire." },
        { text: "Un flux de prix continu qu'il observe tick par tick.", explanation: "Incorrect. L'analyste n'est pas un processus en flux continu ; il s'execute sur des declencheurs distincts (Analyser, Scanner la chaine, ou le minuteur de scan automatique) et lit un instantane a chaque fois." },
        { text: "La cle API de votre fournisseur plus le graphique, et rien sur vos positions existantes.", explanation: "Incorrect. L'analyste recoit vos positions, le PnL realise et latent, et les resultats post-trade recents ; la cle API brute n'est jamais une entree de decision." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "En Mode Expert, comment le champ de confiance de la proposition est-il traite ?",
      options: [
        { text: "C'est une etiquette basse, moyenne ou haute qui correspond a un palier d'execution automatique.", explanation: "Incorrect. C'est la barriere a etiquette du mode basique ; le champ est desormais un score numerique de 0 a 100, et le Mode Expert le compare a un seuil exact." },
        { text: "C'est un score numerique de 0 a 100 compare a votre minConfidence exact ; sous le seuil il est mis en attente et journalise, et une valeur manquante ou corrompue echoue du cote prudent.", explanation: "Correct. Le Mode Expert fait une comparaison numerique precise, ecrit une ligne de saut comme confidence 68 < threshold 70 quand le score est insuffisant, et traite un score mal forme comme un refus." },
        { text: "C'est une probabilite de gain que le backend utilise pour dimensionner l'ordre.", explanation: "Incorrect. La confiance est une conviction, pas une probabilite, et elle ne dimensionne pas l'ordre ; c'est le plafond de taille par trade et votre montant qui le font." },
        { text: "Il est entierement ignore des que le rendement/risque passe.", explanation: "Incorrect. La barriere de confiance est independante de la verification du rendement/risque ; les deux doivent passer, et le score est journalise dans tous les cas." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q3",
      prompt: "Une proposition a une raison solide, une confiance de 82 et un rendement/risque proche de 3.0, mais votre portefeuille ne detient que du XLM et la proposition est un achat de XLM avec des USDC. Que devez-vous conclure ?",
      options: [
        { text: "C'est non finançable ; la verification prealable de solde la bloquera, et pour agir sur le cote achat vous devez d'abord detenir des USDC.", explanation: "Correct. Acheter exige de detenir l'actif de cotation. Un portefeuille tout en XLM ne peut pas financer un achat cote en USDC, c'est le piege de positionnement du portefeuille, pas un exces de prudence." },
        { text: "Acceptez-la ; un score eleve et un bon rendement/risque dispensent de detenir l'actif de cotation.", explanation: "Incorrect. Aucun score ne dispense de la finançabilite. Pour acheter l'actif de base, vous devez detenir l'actif de cotation, ici des USDC." },
        { text: "Le backend convertira automatiquement vos XLM en USDC pour financer l'achat.", explanation: "Incorrect. Il n'y a pas de conversion automatique silencieuse pour satisfaire une proposition ; la verification prealable de solde bloque simplement un trade non finançable." },
        { text: "Refusez-la parce qu'une confiance de 82 est trop elevee pour qu'on s'y fie.", explanation: "Incorrect. Un score eleve n'est pas une raison de refuser ; le vrai obstacle ici est la finançabilite, pas la solidite de la these." },
      ],
      correctIndex: 0,
    },
    {
      id: "c10-q4",
      prompt: "Comment les ordres manuels et les ordres IA different-ils et coexistent-ils dans le moteur d'execution ?",
      options: [
        { text: "Les ordres manuels sautent toutes les barrieres de securite pour que vous puissiez agir plus vite.", explanation: "Incorrect. Les ordres manuels passent par les memes barrieres que les ordres IA ; ils contournent uniquement le plafond de taille par trade de l'IA, rien d'autre." },
        { text: "Une cloture par stop loss doit toujours etre approuvee manuellement, meme dans les modes automatiques.", explanation: "Incorrect. Les sorties qui reduisent le risque, y compris les clotures par stop loss, s'executent automatiquement et immediatement meme en mode approuver-chaque-trade." },
        { text: "Les ordres manuels contournent le plafond de taille par trade de l'IA, les sorties qui reduisent le risque s'executent automatiquement meme en mode approuver-chaque-trade, et quand les deux definissent des stops le moniteur applique le plus protecteur.", explanation: "Correct. Le dimensionnement manuel est le votre donc le plafond de taille de l'IA ne s'applique pas, les sorties n'attendent jamais d'approbation, et les stops se resserrent vers le niveau le plus serre et le plus protecteur." },
        { text: "Si un stop IA et un stop manuel existent tous deux, le stop IA plus laxiste l'emporte.", explanation: "Incorrect. Le moniteur applique le stop le plus protecteur, donc le plus serre l'emporte, jamais le plus laxiste." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "Dans le journal de l'IA, vous voyez un evenement proposal suivi immediatement d'un evenement risk_constraint indiquant un rendement/risque de 1.05 inferieur au minimum de 1.2. Que vous indique cela ?",
      options: [
        { text: "L'analyste est defaillant et a produit une proposition invalide.", explanation: "Incorrect. La proposition etait bien formee ; c'est une barriere de politique, pas un echec du modele, qui l'a empechee de s'executer." },
        { text: "Une violation de la liste blanche a bloque le trade.", explanation: "Incorrect. La contrainte journalisee est un deficit de rendement/risque, pas un rejet par la liste blanche ; ce sont des barrieres distinctes et le journal nomme celle qui s'est declenchee." },
        { text: "Le trade a ete execute mais a un prix moins bon que prevu.", explanation: "Incorrect. Un evenement risk_constraint signifie que le trade a ete bloque avant l'execution, il n'y a donc eu aucun fill du tout." },
        { text: "L'idee etait saine mais la politique l'a bloquee parce que le rendement/risque est tombe sous le minimum de 1.2, donc aucun fill n'a eu lieu ; c'est un signal de reglage, pas un defaut du modele.", explanation: "Correct. Associer le proposal au risk_constraint montre une application de la politique, pas un exces de prudence. Le minimum de rendement/risque vous a maintenu a plat, et c'est visible et auditable dans le journal." },
      ],
      correctIndex: 3,
    },
  ],
};
