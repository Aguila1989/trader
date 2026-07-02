// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapitre EXPERT sur l'IA dans le trading : comment les modèles sont entraînés,
// le surapprentissage, les risques éthiques et systémiques, en quoi l'IA
// transparente d'Atrium avec humain dans la boucle diffère d'un algo boîte noire,
// et quand désactiver l'IA. Même forme exacte que le contenu de référence
// content/en/chapter22.ts, avec la ligne `whoFor` propre au chapitre
// typée via une intersection locale afin que l'interface Chapter live reste
// intacte jusqu'à l'intégration. Ce chapitre ne possède aucun nouveau terme de
// glossaire.
import type { Chapter } from "../../types";

export const chapter36: Chapter & { whoFor: string } = {
  id: "c36",
  number: 36,
  level: "EXPERT",
  whoFor: "Pour les traders qui veulent faire confiance à une IA — et en douter — avec sagesse",
  title: "L'IA dans le trading — opportunités et dangers",
  description:
    "Comment les modèles de trading sont entraînés, où se glissent le surapprentissage et le biais d'anticipation, les risques éthiques et systémiques du trading automatisé, en quoi l'IA transparente d'Atrium diffère, et quand la désactiver.",
  lessons: [
    {
      id: "c36-l1",
      title: "Comment les modèles de trading par IA sont-ils entraînés ?",
      paragraphs: [
        "Un modèle de trading est ajusté à des données historiques. Vous choisissez des caractéristiques (les entrées que le modèle lit) et une étiquette (ce qu'il cherche à prédire). Les caractéristiques peuvent être les rendements récents, la profondeur du carnet d'ordres tirée de Horizon, le volume issu de l'agrégation des trades, la volatilité, ou encore un nombre de lignes de confiance servant d'indicateur d'adoption. L'étiquette est en général un résultat futur : le prix médian sera-t-il plus élevé dans une heure, ou une cible sera-t-elle atteinte avant un stop. Le modèle apprend la correspondance statistique entre caractéristiques et étiquette qui minimise son erreur sur ces données passées.",
        "L'hypothèse tacite est que demain ressemblera à hier. Cela ne tient que tant que le régime de marché reste stable. Quand le régime change — la liquidité se tarit sur un carnet XLM/USDC étroit, un stablecoin décroche de sa parité, les spreads s'élargissent, ou une nouvelle pool AMM redirige les flux — les relations que le modèle a mémorisées cessent de payer. C'est le changement de régime, et aucun entraînement sur l'ancien régime ne prépare un modèle à cela.",
        "Deux modes de défaillance dominent en pratique. Le principe « des données pourries en entrée » : si les données d'entraînement sont erronées — mauvais horodatages, biais du survivant dû à des tokens retirés de la cote, prix relevés à un instant de liquidité nulle — le modèle apprend fidèlement les données pourries. Le biais d'anticipation est plus subtil et plus dangereux : de l'information fuite à rebours dans le temps. Si une caractéristique à la barre T est calculée à partir de données qui n'étaient connaissables qu'à T+1 (un cours de clôture utilisé pour « prédire » cette même clôture, une étiquette lissée sur le futur, une exécution supposée à un prix auquel personne n'aurait pu transiger), le backtest paraît brillant parce que le modèle triche discrètement. En réel, ces données futures n'existent pas, et l'avantage s'évapore.",
        "S'en prémunir exige une discipline temporelle stricte : chaque caractéristique doit être calculable en n'utilisant que l'information disponible avant le point de décision, les découpages doivent être chronologiques (ne jamais mélanger les lignes d'une série temporelle), et les coûts doivent être modélisés au prix auquel vous auriez réellement pu trader, non au prix médian. Un modèle entraîné sans cette discipline ne mesure pas une compétence — il mesure sa propre capacité à jeter un œil en avance.",
      ],
      example:
        "Supposons que vous étiquetiez chaque barre horaire par 1 si le rendement de l'heure suivante est positif, et que vous fournissiez au modèle une caractéristique appelée « volatilité de cette barre », mais que vous calculiez par erreur cette volatilité à partir du plus haut et du plus bas de la barre que vous cherchez justement à prédire. Ce plus haut et ce plus bas ne sont connus qu'une fois l'heure écoulée. Le modèle apprend une règle quasi parfaite, la courbe de capital du backtest s'envole, et en réel il échoue instantanément — le chiffre de volatilité dont il a besoin n'est tout simplement pas encore disponible au moment où il doit décider. Voilà un biais d'anticipation caché dans une caractéristique d'apparence innocente.",
    },
    {
      id: "c36-l2",
      title: "Qu'est-ce que le surapprentissage et pourquoi une stratégie backtestée échoue-t-elle parfois en trading réel ?",
      paragraphs: [
        "Le surapprentissage, c'est quand un modèle apprend le bruit de ses données d'entraînement au lieu du signal. Toute série de prix est en partie structure réelle et en partie hasard. Un modèle doté d'assez de paramètres, ou une stratégie réglée sur assez de boutons, peut ajuster parfaitement les oscillations aléatoires d'un historique particulier. Il produit alors un backtest superbe — courbe de capital lisse, Sharpe élevé, drawdown minuscule — qui décrit le passé à merveille et ne prédit en rien l'avenir.",
        "Le signe révélateur est l'écart entre la performance sur l'échantillon d'entraînement (in-sample) et hors échantillon (out-of-sample). La performance in-sample (les données sur lesquelles vous avez ajusté) paraît toujours bonne ; c'est précisément ce que fait l'ajustement. Ce qui compte, c'est le hors échantillon : des données fraîches que le modèle n'a jamais vues, idéalement une fenêtre temporelle ultérieure. Si l'avantage survit hors échantillon et à travers un test de walk-forward — en entraînant de façon répétée sur le passé puis en validant sur la tranche suivante jamais touchée — il est peut-être réel. S'il n'existe qu'in-sample, vous avez surajusté du bruit. Méfiez-vous aussi du piège des comparaisons multiples : essayez deux cents combinaisons de paramètres et quelques-unes paraîtront merveilleuses par pur hasard, exactement comme lancer assez de pièces jusqu'à ce que l'une tombe sur face dix fois de suite.",
        "Même un avantage authentique peut mourir au contact de la réalité à cause des coûts. Chaque exécution paie quelque chose : le spread entre l'offre et la demande, le slippage quand votre ordre déplace le carnet, les frais de 0,30 % de la pool AMM sur Stellar, plus les minuscules frais de réseau en XLM. Un backtest exécuté au prix médian ignore tout cela. Une stratégie qui dégage quelques points de base par trade dans un backtest sans frictions peut se révéler carrément négative une fois déduits un spread et un slippage réalistes — l'avantage était plus petit que le coût pour le récolter. Pire, le coût augmente avec la fréquence : une stratégie à forte rotation paie le spread encore et encore, si bien que les modèles les plus actifs en apparence dans un backtest sont souvent les plus fragiles face aux frictions réelles.",
        "Ce n'est pas un avertissement abstrait, en particulier pour Atrium. Son propre banc de recherche a constaté qu'un avantage mesuré sur XLM/USDC n'était significatif qu'à des coûts très faibles et disparaissait entièrement une fois des frais réalistes appliqués — un jeu de capture de spread, non un avantage durable. La démarche honnête consiste donc à exiger d'abord la survie hors échantillon, puis à relancer avec des hypothèses de coûts pessimistes, et à ne croire qu'à un avantage qui franchit ces deux barres. Rien de tout cela n'est une promesse de profit ni un conseil en investissement ; c'est une discipline pour ne pas se leurrer soi-même.",
      ],
      example:
        "Un cas classique : une stratégie est optimisée sur une grille de longueurs de moyennes mobiles sur un an de données XLM/USDC, et le croisement 9/21 affiche un rendement époustouflant de 4x avec presque aucun drawdown. Faites-la avancer sur les six mois suivants qu'elle n'a jamais vus, et elle saigne régulièrement. La paire 9/21 ne capturait pas un vrai rythme de marché — elle s'est simplement alignée sur une poignée de mouvements chanceux de cette année précise. Ajoutez le spread et les frais AMM de 30 points de base qu'elle aurait réellement payés à chaque rotation, et même le résultat in-sample devient négatif. Le backtest mesurait de la chance plus des coûts nuls, non un avantage reproductible.",
    },
    {
      id: "c36-l3",
      title: "Quels sont les risques éthiques du trading par IA ?",
      paragraphs: [
        "L'automatisation démultiplie l'intention — y compris la mauvaise intention — bien au-delà de ce qu'un humain pourrait faire à la main. Des tactiques de manipulation illégales sur les marchés réglementés deviennent d'une rapidité triviale quand un bot les exécute : le spoofing (placer de gros ordres qu'on n'a aucune intention d'exécuter, pour feindre une demande, puis les annuler), le layering, ou le wash trading (trader avec soi-même pour gonfler le volume apparent et attirer de vrais acheteurs). Une IA qui découvre qu'une telle tactique est rentable dans un backtest la répétera volontiers des milliers de fois tant qu'un humain ne l'interdit pas. Faire cela n'est pas seulement contraire à l'éthique ; dans de nombreuses juridictions, c'est de l'abus de marché, et rien de tout cela n'est un conseil juridique — l'idée est qu'automatiser un stratagème ne blanchit pas sa légalité.",
        "La vitesse introduit son propre danger. Quand de nombreux participants automatisés réagissent au même signal en quelques millisecondes, un petit choc peut dégénérer en flash crash — une chute puis un rebond violents et auto-entretenus, provoqués par des algorithmes qui déclenchent mutuellement leurs stops et retirent la liquidité tous en même temps. Aucun acteur seul ne veut le krach ; il émerge de l'interaction. Le flash crash actions de 2010 en est l'exemple canonique, mais la même dynamique peut apparaître sur toute place de marché à flux automatisés, y compris les carnets d'ordres on-chain étroits.",
        "Le risque le plus profond est systémique et vient de l'uniformité. Si des milliers de modèles sont entraînés sur des données similaires avec des objectifs similaires, ils convergent vers des positions similaires et agissent de la même façon. Cette corrélation est invisible en marché calme et mortelle sous tension : tout le monde est long sur le même trade encombré, le modèle de risque de chacun dit « réduire » au même seuil, et tout le monde vend en même temps dans la même offre qui s'évanouit. La diversité des stratégies est un bien public pour la stabilité du marché ; la monoculture est fragile. En tant que trader individuel, vous ne pouvez pas réparer le système, mais vous pouvez reconnaître que « l'IA dit d'acheter » rassure bien moins si toutes les autres IA le disent aussi — et vous pouvez dimensionner vos positions pour qu'un débouclage encombré ne vous ruine pas.",
      ],
      example:
        "Imaginez un carnet XLM/USDC étroit où cinquante bots partagent une règle : « si le prix chute de 3 % en une minute, coupe la position. » Une vente modeste pousse le prix à la baisse de 3 %. Les cinquante se déclenchent d'un coup, chaque vente faisant baisser le prix, déclenchant à nouveau la même règle pour le bot suivant. En quelques secondes, le prix décroche bien en dessous de sa juste valeur sur presque aucune vraie nouvelle — un flash crash né purement d'une automatisation corrélée. Les bots qui ont fait une pause, ou dont la règle était légèrement différente, sont ceux qui ont survécu pour acheter le creux.",
    },
    {
      id: "c36-l4",
      title: "En quoi l'IA de cette application diffère-t-elle d'un algorithme de trading généraliste ?",
      paragraphs: [
        "Un algorithme de trading généraliste est typiquement une boîte noire qui trade de façon autonome : un signal entre, un ordre sort, aucune explication, et souvent aucun humain dans la boucle. Atrium repose sur le principe inverse — la transparence et le contrôle avec humain dans la boucle. L'IA est un analyste, pas un pilote automatique. Elle propose ; c'est vous qui disposez.",
        "Concrètement, chaque idée arrive sous forme de proposition assortie d'un score de confiance de 0 à 100, et le backend n'exécute automatiquement une proposition que si elle atteint ou dépasse le seuil que vous avez fixé. En dessous de votre seuil, rien ne se produit sans vous. Cette boucle proposer-puis-approuver est enveloppée dans des limites strictes que l'IA ne peut pas outrepasser : un plafond de trading et une barrière de pause sur drawdown qui interrompt l'activité quand les pertes franchissent un niveau défini. L'IA peut vouloir trader ; elle ne peut pas dépasser les garde-fous que vous avez configurés.",
        "Vous façonnez aussi son comportement à travers six facteurs de risque indépendants, chacun réglé sur LOW, MED ou HIGH : la taille de position, la distance du stop-loss, la tolérance au drawdown, la fréquence de trading, la tolérance à la volatilité des actifs et la tolérance au slippage. Ce ne sont pas des réglages cosmétiques — ils s'intègrent aux limites effectives que le moteur de politiques applique et au prompt à partir duquel l'analyste raisonne, de sorte qu'un profil prudent produit véritablement des trades plus petits, plus rares et à stops plus serrés. Tout ce que l'IA décide est journalisé : le sous-onglet Journal IA de l'onglet Journaux enregistre chaque proposition avec des filtres, un export CSV et une pagination, pour que vous puissiez auditer pourquoi elle a agi plutôt que de faire confiance à une boîte noire silencieuse.",
        "Ce chapitre reste délibérément au niveau des principes. Les mécanismes vivent ailleurs dans l'Academy : le chapitre « Plongée en profondeur dans le trading par IA » détaille comment l'analyste forme et note une proposition de bout en bout, et le chapitre « Réglages de risque de l'IA : contrôle total » couvre chacun des six facteurs et exactement comment ils bornent le comportement de l'IA. Si vous voulez le comment, allez-y ; ici, nous n'avons besoin que du pourquoi — une conception transparente, bornée et approuvée par l'humain est ce qui vous permet à la fois de faire confiance à l'IA et d'en douter à dessein.",
      ],
      example:
        "Disons que l'analyste propose d'acheter du XLM avec une confiance de 62 alors que votre seuil d'exécution automatique est de 75. Dans un algo boîte noire, ce trade partirait tout simplement. Dans Atrium, rien ne s'exécute — la proposition attend votre approbation, et même si vous l'approuvez, la barrière de pause sur drawdown et le plafond de trading s'appliquent toujours. La proposition, son score et votre décision atterrissent tous dans le Journal IA, de sorte qu'une semaine plus tard vous pouvez la filtrer, exporter la ligne, et voir exactement pourquoi le trade a été suggéré et ce que vous avez choisi de faire.",
    },
    {
      id: "c36-l5",
      title: "Quand faut-il désactiver l'IA ?",
      paragraphs: [
        "La règle unique derrière tous les signaux spécifiques est celle-ci : désactivez l'IA quand les conditions sortent de la plage sur laquelle le modèle a été entraîné. Un modèle n'est fiable qu'à l'intérieur de la distribution des données dont il a appris. Poussez-le dans un territoire qu'il n'a jamais vu et son score de confiance devient dénué de sens — il peut être suprêmement confiant et complètement dans l'erreur, parce qu'il extrapole au lieu de reconnaître.",
        "La volatilité extrême est le premier signal d'alarme. Quand le prix d'un token oscille bien au-delà de sa plage historique, les relations statistiques que le modèle a apprises ne décrivent plus ce qui se passe. L'illiquidité est le deuxième : sur un carnet étroit ou une pool AMM peu profonde, le slippage à l'exécution peut éclipser tout avantage, et les prix d'exécution supposés par le modèle deviennent de la fiction. Les chocs d'actualité sont le troisième — un décrochage de parité, un émetteur qui disparaît, une suspension d'échange, un titre réglementaire. Ce sont précisément les événements absents des données d'entraînement historiques lisses, et ils brisent les corrélations instantanément. Quand quelque chose de véritablement nouveau frappe le marché, le jugement d'un humain sur le contexte l'emporte sur la reconnaissance de motifs d'un modèle.",
        "Il existe aussi un système d'alerte précoce comportemental intégré à l'application elle-même. Si vous remarquez une série de propositions rejetées par le moteur de politiques, ou qui échouent de façon répétée à s'exécuter, ou l'analyste qui débite des idées à faible confiance qu'il n'utilisait jamais auparavant, prenez cela comme le modèle vous disant qu'il est perdu. Les sous-onglets Journal IA et Historique des trades rendent ce schéma visible. Le geste pratique est de passer en manuel : descendre sous le seuil d'exécution automatique ou désactiver entièrement l'exécution automatique, réduire la taille, et utiliser l'onglet Trading manuel avec une tolérance au slippage raisonnable jusqu'à ce que les conditions reviennent à quelque chose que le modèle a réellement déjà vu. Désactiver l'IA n'est pas un échec de l'outil — c'est l'utiliser avec sagesse, et c'est la même discipline que d'élargir vos propres stops quand vous êtes incertain.",
      ],
      example:
        "Un stablecoin que vous détenez commence à vaciller hors de sa parité pendant la nuit et les prix libellés en USDC deviennent erratiques ; le carnet d'ordres s'amincit à mesure que les teneurs de marché se retirent. Votre IA continue de lancer des propositions, plusieurs sont rejetées par la barrière de drawdown, et celles qui passent sont à faible confiance. Cette combinaison — une rupture de régime provoquée par l'actualité, une liquidité qui s'effondre, et un amas de propositions rejetées ou en échec dans le Journal IA — est le moment typique pour désactiver l'exécution automatique, réduire la taille et trader à la main jusqu'à ce que le décrochage se résorbe et que le marché redevienne lisible.",
    },
  ],
  quiz: [
    {
      id: "c36-q1",
      prompt: "Une caractéristique à l'instant T dans votre modèle est calculée à partir du cours de clôture de la barre à l'instant T, qui n'est connu qu'une fois cette barre terminée. Le backtest paraît spectaculaire mais les résultats en réel s'effondrent. Que s'est-il passé ?",
      options: [
        {
          text: "Un biais d'anticipation : la caractéristique a utilisé une information qui n'était pas encore disponible au point de décision, de sorte que le modèle regardait de fait le futur en douce.",
          explanation:
            "Correct. Utiliser des données connaissables seulement à T ou après pour prendre la décision à T laisse le modèle « tricher » dans le backtest. En réel, ces données futures n'existent pas encore, donc l'avantage apparent s'évanouit au contact de la réalité.",
        },
        {
          text: "Un changement de régime : le marché s'est simplement comporté différemment durant la période réelle.",
          explanation:
            "Le changement de régime est réel, mais ce n'est pas ce qui est décrit ici. Le problème est structurel — une caractéristique qui jette un œil sur des données futures — et il gonflerait le backtest même sur la même période. L'échec en réel est instantané, non une dérive de régime graduelle.",
        },
        {
          text: "Un surapprentissage : le modèle a mémorisé du bruit à travers trop de paramètres.",
          explanation:
            "Le surapprentissage est une défaillance distincte. Ici, le problème est une fuite temporelle dans une seule caractéristique, non un modèle trop flexible qui ajuste du hasard. Même un modèle simple paraîtrait excellent avec cette fuite et échouerait en réel.",
        },
        {
          text: "Des données pourries en entrée : les prix d'entraînement étaient erronés ou corrompus.",
          explanation:
            "Les prix peuvent être parfaitement propres. Le défaut est qu'un prix correct est utilisé à un instant où il ne pouvait pas encore être connu — une fuite de timing, non de mauvaises données.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c36-q2",
      prompt: "Vous avez une stratégie avec une magnifique courbe de capital de backtest. Quelle vérification unique distingue le mieux un avantage réel d'un surajustement de courbe ?",
      options: [
        {
          text: "Confirmer que le backtest a utilisé le prix médian pour que les résultats soient exempts de bruit.",
          explanation:
            "À rebours. Utiliser le prix médian masque des coûts réels comme le spread, le slippage et les frais AMM de 0,30 %, ce qui flatte les résultats. Vous voulez que les coûts soient modélisés au prix auquel vous auriez réellement pu trader, non écartés.",
        },
        {
          text: "Vérifier que la performance in-sample est aussi élevée que possible.",
          explanation:
            "La performance in-sample est toujours élevée — c'est ce que fait l'ajustement. Un excellent résultat in-sample ne vous dit rien sur la réalité de l'avantage ; c'est la vérification la moins informative.",
        },
        {
          text: "La tester hors échantillon sur des données ultérieures que le modèle n'a jamais vues, idéalement avec une procédure de walk-forward.",
          explanation:
            "Correct. Un avantage qui survit sur des données fraîches, chronologiquement ultérieures, sur lesquelles il ne s'est jamais entraîné — de façon répétée, via le walk-forward — a bien plus de chances d'être réel. S'il n'existe qu'in-sample, vous avez ajusté du bruit.",
        },
        {
          text: "Essayer encore plus de combinaisons de paramètres et garder celle qui a le meilleur aspect.",
          explanation:
            "Cela aggrave le surapprentissage. Tester des centaines de combinaisons garantit que certaines paraîtront merveilleuses par pur hasard — le piège des comparaisons multiples — non que l'une d'elles soit un avantage authentique.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c36-q3",
      prompt: "Cinquante bots sur un carnet XLM/USDC étroit partagent la règle « couper la position si le prix chute de 3 % en une minute ». Une vente modeste fait basculer le prix de 3 % à la baisse et le prix décroche bien en dessous de sa juste valeur en quelques secondes. Qu'est-ce que cela illustre ?",
      options: [
        {
          text: "Un manipulateur isolé qui fait du spoofing sur le carnet d'ordres.",
          explanation:
            "Personne ici ne place d'ordres fictifs. La cascade émerge de nombreux bots honnêtes réagissant en même temps au même déclencheur réel — un effet émergent, non la manipulation d'un acteur isolé.",
        },
        {
          text: "Un flash crash provoqué par une automatisation corrélée et l'uniformité systémique.",
          explanation:
            "Correct. Quand de nombreux modèles agissent de la même façon, un petit choc les déclenche tous simultanément, chaque vente entraînant la suivante, retirant la liquidité et faisant décrocher le prix. Personne ne veut le krach ; il émerge d'un comportement corrélé sur un carnet étroit.",
        },
        {
          text: "Une aversion à la perte qui pousse les humains à vendre dans la panique au plus bas.",
          explanation:
            "Il s'agit ici de règles automatisées qui se déclenchent en quelques millisecondes, non d'une réponse émotionnelle humaine. L'aversion à la perte est un concept de psychologie ; le mécanisme en jeu est l'exécution algorithmique corrélée.",
        },
        {
          text: "Un biais d'anticipation dans les données d'entraînement des bots.",
          explanation:
            "Le biais d'anticipation est un défaut de backtest où des données futures fuitent dans les caractéristiques. Il n'a rien à voir avec des bots live qui touchent de façon synchrone la même règle de stop et font cascader le prix.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q4",
      prompt: "L'analyste propose d'acheter du XLM avec un score de confiance de 62, mais votre seuil d'exécution automatique est de 75. Dans Atrium, que se passe-t-il ?",
      options: [
        {
          text: "Le trade part automatiquement, parce que l'IA a généré une proposition.",
          explanation:
            "C'est ainsi que se comporte un pilote automatique boîte noire, non Atrium. Une proposition sous votre seuil ne s'exécute pas automatiquement — la conception avec humain dans la boucle signifie que rien ne se produit sans votre approbation.",
        },
        {
          text: "Rien ne s'exécute automatiquement ; la proposition vous attend, et même à l'approbation la barrière de drawdown et le plafond de trading s'appliquent toujours.",
          explanation:
            "Correct. Le backend n'exécute automatiquement que si le seuil est atteint ou dépassé. En dessous, la proposition n'est qu'un conseil que vous pouvez approuver ou ignorer, et les plafonds stricts ainsi que la barrière de pause sur drawdown restent en vigueur quoi qu'il arrive.",
        },
        {
          text: "L'IA relève son propre score de confiance à 75 pour que le trade puisse avoir lieu.",
          explanation:
            "L'IA ne peut pas réécrire son score pour franchir votre seuil. Le seuil est un garde-fou que vous contrôlez ; tout l'intérêt de la conception est que l'IA ne peut pas outrepasser les limites que vous fixez.",
        },
        {
          text: "Les six facteurs de risque sont ignorés parce que la confiance est sous le seuil.",
          explanation:
            "Les facteurs de risque ne sont pas contournés — ils façonnent en continu les limites effectives et le raisonnement de l'analyste. Un score sous le seuil signifie simplement aucune exécution automatique, non que les garde-fous se désactivent.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c36-q5",
      prompt: "Un stablecoin que vous tradez commence à décrocher de sa parité pendant la nuit, le carnet d'ordres s'amincit, et votre Journal IA montre un amas de propositions rejetées et à faible confiance. Quel est le geste avisé ?",
      options: [
        {
          text: "Relever légèrement votre seuil d'exécution automatique et laisser l'IA continuer à trader au travers.",
          explanation:
            "Un ajustement du seuil ne règle pas le problème de fond : les conditions sont hors de la plage sur laquelle le modèle a été entraîné. Les scores de confiance ne sont pas fiables dans ce régime, donc s'appuyer sur eux — même à une barre plus haute — est une confiance mal placée.",
        },
        {
          text: "Faire confiance à la proposition à la plus forte confiance, puisque la confiance est la plus élevée exactement quand le modèle est le plus sûr.",
          explanation:
            "Un score de confiance n'a de sens qu'à l'intérieur de la distribution de données dont le modèle a appris. Pendant un décrochage, le modèle extrapole dans un territoire inconnu, où il peut se tromper avec assurance. Une forte confiance ici n'est pas rassurante.",
        },
        {
          text: "Désactiver l'exécution automatique, réduire la taille, et trader manuellement jusqu'à ce que le décrochage se résorbe et que le marché redevienne lisible.",
          explanation:
            "Correct. Une rupture de régime provoquée par l'actualité, plus une liquidité qui s'effondre, plus une série de propositions rejetées ou en échec est le signal typique que les conditions sortent de la plage du modèle. Passer en manuel et réduire la taille, c'est utiliser l'outil avec sagesse, non l'abandonner.",
        },
        {
          text: "Ne rien faire de différent — la barrière de drawdown gérera tout d'elle-même.",
          explanation:
            "La barrière de drawdown est un dernier rempart qui limite les pertes, non un substitut au jugement. Elle se déclenche une fois les dégâts accumulés ; reconnaître tôt la rupture de régime et passer en manuel évite les pertes que la barrière devrait sinon absorber.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
