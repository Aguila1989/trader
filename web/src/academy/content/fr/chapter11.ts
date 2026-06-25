import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Les reglages de risque et l'IA",
  description: "Comment des limites de politique configurables faconnent chaque trade, et comment des valeurs prudentes ou agressives traduisent un profil de risque.",
  lessons: [
    {
      id: "c11-l1",
      title: "Qu'est-ce que les facteurs de risque et pourquoi sont-ils importants ?",
      paragraphs: [
        "Les facteurs de risque sont les limites de politique qui s'intercalent entre le bot et votre portefeuille. Avant qu'un ordre ne parte, la proposition est verifiee face a chaque limite. Si elle en enfreint une, le trade est refuse, reduit, ou bloque entierement. Ces verifications existent parce qu'un seul trade trop gros ou mal synchronise peut faire plus de degats que des dizaines de petits bons trades.",
        "Voyez-les comme des garde-fous, pas comme une strategie. Ils ne decident pas quoi acheter ; ils decident combien, a quelle frequence, et dans quelles conditions de marche le bot a le droit d'agir. Un signal rentable qui arrive avec un spread catastrophique ou apres que le budget de perte quotidien a ete epuise sera quand meme refuse.",
        "Chaque limite a une valeur par defaut raisonnable, mais ces valeurs par defaut sont les votres a modifier. Les resserrer abaisse le pire scenario que vous pouvez subir en une journee ; les assouplir laisse le bot poursuivre plus d'opportunites au prix de drawdowns potentiels plus importants.",
      ],
      example: "Avec maxAmountPerTrade fixe a 10 unites de base et maxDailyLoss fixe a 25 XLM, le bot ne peut jamais engager plus de 10 sur une seule position et cesse d'ouvrir de nouveaux trades une fois que la journee a perdu 25 XLM, peu importe a quel point un signal a l'air convaincant.",
    },
    {
      id: "c11-l2",
      title: "Que controle chaque facteur de risque dans cette application ?",
      paragraphs: [
        "La taille est plafonnee par maxAmountPerTrade, avec un plafond plus eleve pour les paires de stablecoins blue-chip, de sorte qu'un trade familier XLM/USDC peut etre autorise plus gros qu'un trade exotique. L'activite est bornee par maxTradesPerDay et maxDailyVolume, qui empechent le bot de surtrader. Le risque total expose en meme temps est maintenu sous maxOpenExposure, et un multiplicateur par paire limite a quel point une seule paire peut se concentrer.",
        "La qualite d'execution est protegee par maxSlippageBps et maxEntrySpreadBps. Si le mouvement de prix attendu sur l'execution depasse votre tolerance de slippage, ou si le carnet d'ordres est plus large que votre limite de spread, le bot refuse plutot que de surpayer. Ces limites previennent discretement les pires executions.",
        "La structure du trade est regie par stopLossPct, la distance de protection sous l'entree, et minRiskReward, le ratio rendement/risque minimum mesure par rapport au niveau d'invalidation. Le budget de perte quotidien, maxDailyLoss, reduit aussi automatiquement la taille des positions a mesure que les pertes s'accumulent, avant de stopper les nouvelles entrees.",
      ],
      example: "Des valeurs par defaut de maxAmountPerTrade 10 (50 pour les paires blue-chip), maxDailyVolume 500 XLM, maxTradesPerDay 100, maxOpenExposure 150 XLM avec un multiplicateur par paire de 3x, maxSlippageBps 50 (0,5 %), maxEntrySpreadBps 100 (1 %), stopLossPct 5 % et minRiskReward 1,2 definissent ensemble une politique equilibree.",
    },
    {
      id: "c11-l3",
      title: "FAIBLE vs MOYEN vs ELEVE — qu'est-ce qui change a chaque niveau ?",
      paragraphs: [
        "Il n'y a pas de bouton ni de menu deroulant unique FAIBLE, MOYEN ou ELEVE dans cette application. Un profil de risque n'est pas un seul interrupteur ; c'est la forme globale que vous obtenez en choisissant des valeurs prudentes, equilibrees ou agressives sur l'ensemble des limites ci-dessus. FAIBLE, MOYEN et ELEVE ne sont que les noms que nous donnons a ces combinaisons.",
        "Un profil FAIBLE signifie des plafonds par trade plus petits, un budget de perte quotidien plus reduit, des limites d'exposition et de slippage plus serrees, et une marge de stop loss plus large pour eviter de se faire sortir. Un profil ELEVE est l'oppose : des trades plus gros, un budget de perte plus important, une exposition et un slippage plus laches, et un stop plus serre. MOYEN se situe entre les deux, proche des valeurs par defaut.",
        "Ne confondez pas cela avec la confiance de l'IA par proposition, elle aussi etiquetee faible, moyenne ou elevee. Cette confiance decrit a quel point l'IA croit en un trade specifique. En mode auto-trade, seules les propositions a confiance moyenne et elevee s'executent automatiquement. La confiance, c'est l'IA qui note un trade ; un profil de risque, c'est vous qui notez votre propre appetit via les valeurs des limites.",
      ],
      example: "Un utilisateur FAIBLE pourrait fixer maxAmountPerTrade a 4, maxDailyLoss a 10 XLM, maxSlippageBps a 25 et stopLossPct a 8 % ; un utilisateur ELEVE pourrait fixer 20, 60 XLM, 80 et 3 % sur ces memes champs.",
    },
    {
      id: "c11-l4",
      title: "Comment les reglages de risque influencent la taille de position et le placement du stop loss de l'IA",
      paragraphs: [
        "L'IA propose un trade, mais vos limites en decident la forme finale. La taille demandee est ramenee a maxAmountPerTrade et reduite davantage si elle poussait le risque total au-dela de maxOpenExposure ou du multiplicateur par paire. Ainsi, meme un achat a confiance elevee finit plus petit quand vos plafonds sont serres.",
        "Le budget de perte quotidien ajoute une couche dynamique. A mesure que les pertes realisees grimpent vers maxDailyLoss, le bot reduit automatiquement la taille des nouvelles positions d'environ 100 % jusqu'a a peu pres 25 %, puis stoppe les nouvelles entrees pour la journee tout en autorisant encore les sorties reductrices de risque. Un stopLossPct plus large donne au trade plus de marge pour respirer mais, a taille egale, implique une perte potentielle plus grande par trade, ce qui interagit avec ce budget.",
        "Le placement du stop et minRiskReward fonctionnent ensemble. Le stop fixe le point ou vous avez tort ; la cible doit franchir minRiskReward par rapport a cette distance, sinon la proposition est rejetee. Des stops plus serres exigent des cibles plus proches pour conserver le ratio, ce qui faconne quels trades survivent au filtrage.",
      ],
      example: "Si la journee est deja en perte de 20 sur un budget de 25 XLM, le bot est en pleine reduction : une proposition qu'il dimensionnerait normalement a 10 unites de base peut etre coupee a environ 2,5, et une fois les pertes a 25 XLM, plus aucune nouvelle entree ne s'ouvre.",
    },
    {
      id: "c11-l5",
      title: "Comment choisir le bon profil de risque pour votre situation",
      paragraphs: [
        "Partez de ce que vous pouvez vous permettre de perdre en une seule journee, puis fixez d'abord maxDailyLoss a ce montant ; beaucoup d'autres choix en decoulent. Un budget de perte que vous seriez mal a l'aise d'atteindre est trop eleve. A partir de la, dimensionnez maxAmountPerTrade et maxOpenExposure pour qu'une mauvaise journee normale reste bien a l'interieur de ce budget.",
        "Adaptez les limites de slippage et de spread aux paires que vous tradez reellement. Les paires liquides blue-chip tolerent des maxSlippageBps et maxEntrySpreadBps plus serres ; les paires peu liquides ont besoin de valeurs plus laches, sinon elles ne s'executeront tout simplement jamais. Reglez stopLossPct et minRiskReward pour refleter combien de bruit vous etes pret a encaisser face a quel point un trade doit etre favorable pour etre eligible.",
        "Traitez le profil comme un reglage vivant. Si le bot refuse presque tout, vos limites sont peut-etre trop serrees pour le marche ; si les drawdowns vous inquietent, resserrez la taille, l'exposition et le budget de perte. Changez un facteur a la fois pour pouvoir en observer l'effet.",
      ],
      example: "Un nouveau venu prudent tradant surtout XLM/USDC pourrait commencer en FAIBLE : maxDailyLoss 10 XLM, maxAmountPerTrade 4, maxOpenExposure 50 XLM, maxSlippageBps 25, stopLossPct 7 %, minRiskReward 1,5, puis assouplir vers les valeurs par defaut seulement une fois que les resultats le justifient.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Qu'est-ce qui decrit le mieux le role des facteurs de risque dans ce bot ?",
      options: [
        { text: "Ce sont des garde-fous qui plafonnent combien, a quelle frequence et dans quelles conditions le bot peut trader, refusant ou reduisant les trades qui enfreignent une limite.", explanation: "Correct. Les limites filtrent chaque proposition avant son execution ; elles contraignent le comportement plutot que de generer des signaux." },
        { text: "Ce sont la strategie de trading qui decide quels actifs acheter et vendre.", explanation: "Incorrect. Les limites ne choisissent pas les actifs ; elles contraignent la taille, la frequence, l'exposition et la qualite d'execution de ce que propose la strategie." },
        { text: "Ils ne s'appliquent qu'aux trades manuels et sont ignores quand l'IA est active.", explanation: "Incorrect. Les limites sont verifiees pour les propositions quelle que soit leur source, y compris l'IA en mode auto-trade." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "Que se passe-t-il a mesure que les pertes realisees grimpent vers maxDailyLoss (par ex. 25 XLM) ?",
      options: [
        { text: "Rien ne change tant que le budget n'est pas depasse, puis le portefeuille est verrouille completement.", explanation: "Incorrect. La reduction commence avant que le budget ne soit atteint, et meme a la limite, les sorties reductrices de risque restent autorisees." },
        { text: "Le bot reduit automatiquement la taille des nouvelles positions d'environ 100 % jusqu'a a peu pres 25 %, puis stoppe les nouvelles entrees tout en autorisant encore les sorties reductrices de risque.", explanation: "Correct. Le dimensionnement diminue dynamiquement a l'approche du budget, et seules les nouvelles entrees s'arretent a la limite." },
        { text: "Le bot double la taille de position pour recuperer les pertes plus vite.", explanation: "Incorrect. C'est un comportement de martingale ; le bot fait l'inverse en reduisant la taille." },
        { text: "maxSlippageBps est automatiquement assoupli pour executer plus de trades.", explanation: "Incorrect. Le budget de perte controle le dimensionnement et les entrees, pas la tolerance de slippage." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q3",
      prompt: "Comment regler le bot sur un profil de risque FAIBLE ?",
      options: [
        { text: "Selectionner FAIBLE dans l'unique menu deroulant de niveau de risque dans les reglages.", explanation: "Incorrect. Un tel bouton ou menu unique n'existe pas ; un profil n'est pas un seul interrupteur." },
        { text: "Choisir des valeurs prudentes sur l'ensemble des limites individuelles — des plafonds par trade et d'exposition plus petits, un budget de perte quotidien plus reduit, un slippage plus serre, et une marge de stop plus large.", explanation: "Correct. FAIBLE, MOYEN et ELEVE sont des noms pour des combinaisons de valeurs de limites que vous reglez vous-meme ; il n'y a pas d'interrupteur unique." },
        { text: "Mettre la confiance de l'IA sur faible pour qu'elle ne prenne que des trades surs.", explanation: "Incorrect. La confiance de l'IA note les propositions individuelles et est distincte de votre profil de risque, qui reside dans les valeurs des limites." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q4",
      prompt: "Une proposition de l'IA demande d'acheter plus que ce qu'autorise maxAmountPerTrade. Qu'advient-il de sa taille ?",
      options: [
        { text: "Elle est ramenee au plafond, et reduite davantage si elle franchissait maxOpenExposure ou le multiplicateur par paire.", explanation: "Correct. L'IA propose, mais vos limites de taille et d'exposition faconnent l'ordre final, meme pour les trades a confiance elevee." },
        { text: "Elle s'execute a la taille demandee parce qu'une confiance elevee de l'IA passe outre les plafonds.", explanation: "Incorrect. La confiance ne contourne pas les limites ; la taille est tout de meme ramenee a maxAmountPerTrade." },
        { text: "Toute la proposition est ecartee et journalisee comme une erreur.", explanation: "Incorrect. Une demande trop grosse est reduite pour s'ajuster plutot que rejetee purement et simplement." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Lors du choix d'un profil de risque, quelle approche correspond aux conseils de ce chapitre ?",
      options: [
        { text: "Maximiser d'abord maxAmountPerTrade et maxOpenExposure pour capter chaque opportunite.", explanation: "Incorrect. Cela commence par les leviers les plus agressifs et ignore ce que vous pouvez vous permettre de perdre." },
        { text: "Copier exactement les reglages d'un ami, puisqu'un seul profil convient a tout le monde.", explanation: "Incorrect. Les profils doivent refleter votre propre tolerance aux pertes et les paires que vous tradez, pas etre copies aveuglement." },
        { text: "Fixer d'abord maxDailyLoss a ce que vous pouvez vous permettre de perdre en une journee, dimensionner les autres plafonds pour rester a l'interieur, et ajuster un facteur a la fois.", explanation: "Correct. S'ancrer sur le budget de perte quotidien et ajuster progressivement est l'approche recommandee." },
        { text: "Utiliser les limites de slippage et de spread les plus serrees possibles sur chaque paire, quelle que soit la liquidite.", explanation: "Incorrect. Les paires peu liquides ont besoin de valeurs de slippage et de spread plus laches, sinon elles ne s'executeront jamais ; adaptez les limites a la paire." },
      ],
      correctIndex: 2,
    },
  ],
};
