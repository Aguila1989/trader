// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on On-Chain Data: reading wallet activity, whale moves, and
// TVL to look under the market's hood and sanity-check the AI's suggestions.
// Authored to the exact same shape as content/en/chapter22.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter30: Chapter & { whoFor: string } = {
  id: "c30",
  number: 30,
  level: "ADVANCED",
  whoFor: "Pour les traders qui veulent regarder sous le capot du marché",
  title: "Les données on-chain",
  description:
    "Ce que sont les données on-chain, ce que les portefeuilles actifs, les mouvements de baleines et la TVL révèlent sur un token, et comment utiliser ces signaux pour vérifier par vous-même les suggestions de l'IA.",
  lessons: [
    {
      id: "c30-l1",
      title: "Que sont les données on-chain et en quoi diffèrent-elles des données de marché ?",
      paragraphs: [
        "Les données de marché décrivent le prix : le dernier trade, l'offre et la demande, le volume, les chandeliers que vous voyez sur la page de détail d'un token, sous les onglets heure, jour, semaine et année. Elles vous disent à quel prix un token se négocie et quelle quantité a changé de mains. Les données on-chain décrivent tout autre chose : qui détient et déplace réellement l'actif. Comme Stellar est un registre public, chaque compte, chaque ligne de confiance, chaque paiement et chaque trade est enregistré de manière permanente et peut être relu par quiconque.",
        "Les deux répondent à des questions différentes. Les données de marché répondent à la question : que fait le prix en ce moment. Les données on-chain répondent à la question : qui se cache derrière ce prix. Un token peut afficher un graphique en hausse alors qu'une poignée seulement de portefeuilles se le repassent entre eux, ou un graphique plat alors que des milliers de nouveaux détenteurs ouvrent discrètement des lignes de confiance. Le prix seul masque cela ; le registre, non.",
        "L'intérêt pratique est que les données on-chain sont difficiles à falsifier à grande échelle et qu'elles précèdent plutôt qu'elles ne suivent. Un gros détenteur qui déplace des fonds, une vague de nouvelles lignes de confiance, ou de la liquidité qui s'écoule hors d'un pool, tout cela se produit on-chain avant de se refléter pleinement dans le prix. Lire le registre, c'est ainsi que vous vérifiez si un mouvement s'appuie sur une participation réelle ou n'est qu'un mince frémissement de prix. Voyez cela comme regarder sous le capot du marché plutôt que de fixer seulement le compteur de vitesse.",
      ],
      example:
        "Deux tokens affichent tous deux un graphique qui a doublé cette semaine. Le token A l'a fait sur des trades entre six portefeuilles qui n'arrêtent pas de se vendre les uns aux autres ; le token B l'a fait pendant que trois cents nouveaux comptes ouvraient des lignes de confiance et achetaient de petits montants. Les chandeliers se ressemblent presque à l'identique, mais le portrait on-chain est à l'opposé : A est une boucle fermée, B est une adoption authentique. Seul le registre, et non le graphique de prix, vous dit lequel est lequel.",
    },
    {
      id: "c30-l2",
      title: "Que vous apprend le nombre de portefeuilles actifs sur un token ?",
      paragraphs: [
        "Le nombre de portefeuilles qui détiennent un token, et combien d'entre eux effectuent activement des transactions, est l'un des signaux d'adoption on-chain les plus clairs. Un token détenu par des milliers de comptes indépendants qui le tradent et le transfèrent régulièrement possède une véritable base d'utilisateurs ; un token qui dort dans cinq portefeuilles ne bougeant jamais n'en a pas, quoi qu'en dise son prix. Sur Stellar, le nombre de lignes de confiance en est un indicateur direct : puisque vous devez ouvrir une ligne de confiance avant de pouvoir détenir un token non natif, le nombre de lignes de confiance correspond à peu près au nombre de comptes qui ont choisi de le détenir.",
        "C'est précisément l'une des données que l'application utilise déjà. Le score d'un token combine les agrégations de trades de Horizon, la profondeur du carnet d'ordres et le nombre de lignes de confiance comme mesure d'adoption, et le scanner de liquidité passe les tokens en revue pour évaluer à quel point ils sont négociables et largement détenus. Lorsque vous lisez une suggestion de ligne de confiance de l'IA, le score d'adoption qui la sous-tend reflète en partie ce portrait de portefeuilles et de lignes de confiance, suivi sur douze semaines pour que vous puissiez voir si les détenteurs affluent ou s'en vont.",
        "Le bémol, ce sont les portefeuilles sybil. Rien n'empêche une seule personne d'ouvrir des centaines de comptes et de lignes de confiance pour simuler une adoption, et créer un compte Stellar coûte peu. Les décomptes bruts peuvent donc être gonflés. Les parades consistent à privilégier la répartition sur le simple nombre de têtes (les avoirs sont-ils dispersés entre de nombreux portefeuilles indépendants ou concentrés dans quelques-uns) et à surveiller la tendance plutôt que l'instantané : une croissance organique et régulière est plus difficile à falsifier qu'un pic sur une seule journée de nouveaux comptes quasi identiques. Considérez un nombre de lignes de confiance en hausse comme un élément à l'appui, non comme une preuve.",
      ],
      example:
        "Le scanner de liquidité fait ressortir un token dont le nombre de lignes de confiance est passé de 400 à 1 600 en une semaine. Encourageant à première vue. Mais en y regardant de plus près, les 1 200 nouvelles lignes de confiance ont toutes été créées dans la même heure, par des comptes alimentés depuis une source unique, dont aucun n'a jamais tradé ensuite. C'est un schéma sybil : un seul acteur qui fabrique l'apparence d'une adoption. Un token qui aurait plutôt ajouté 1 200 lignes de confiance progressivement sur la fenêtre de douze semaines, réparties entre des portefeuilles financés de façon indépendante et qui tradent réellement, constitue un signal d'adoption bien plus solide.",
    },
    {
      id: "c30-l3",
      title: "Que sont les mouvements de baleines et pourquoi les traders les suivent-ils ?",
      paragraphs: [
        "Une baleine est un portefeuille suffisamment gros pour que ses mouvements puissent à eux seuls faire bouger un marché. Comme le registre est public, vous pouvez observer ces portefeuilles : une baleine qui envoie un gros solde vers l'adresse connue d'une plateforme d'échange ou d'un émetteur, qui ouvre ou ferme une ligne de confiance, ou qui ajoute et retire de la liquidité d'un pool AMM. Les traders suivent les baleines parce qu'un gros détenteur dispose souvent de meilleures informations, ou simplement d'une taille suffisante pour que sa seule action déplace le prix. Une baleine qui dépose un montant énorme pour vendre peut précéder une chute ; une baleine qui accumule discrètement peut précéder une hausse.",
        "Interpréter le mouvement compte davantage que simplement le voir. Un transfert vers une plateforme d'échange ou un émetteur laisse deviner une intention de vendre ou de racheter. Un transfert entre deux portefeuilles contrôlés par la même entité signifie que rien n'a réellement changé de mains. Retirer de la liquidité d'un pool assèche le marché et peut amplifier l'oscillation suivante. C'est la taille rapportée au volume normal du token qui rend un mouvement significatif : un transfert de la taille d'une baleine sur un token peu négocié est bien plus perturbateur que le même montant sur un token profond et liquide.",
        "Le danger, c'est de suivre aveuglément. Vous connaissez rarement la véritable intention de la baleine, et certains gros acteurs télégraphient délibérément de faux mouvements pour appâter les petits traders. On-chain, un mouvement peut aussi n'être qu'un remaniement interne, une migration de garde ou une opération de collatéral sans aucune signification directionnelle. Utilisez l'activité des baleines comme une incitation à regarder de plus près et à vérifier la liquidité ainsi que vos propres outils de risque, jamais comme un signal automatique d'achat ou de vente. Si un mouvement de baleine ne vous donne envie de trader que parce qu'il semble urgent, cette impulsion est du FOMO, pas de l'analyse.",
      ],
      example:
        "Vous remarquez qu'un portefeuille détenant 20 % de l'offre d'un petit token envoie la totalité de son solde vers une adresse d'émetteur à la Circle, juste au moment où le volume quotidien de ce token ne représente qu'une fraction de ce montant. C'est un signal significatif : un détenteur de cette taille qui se dirige vers la sortie peut submerger le carnet d'ordres et faire chuter le prix. La réaction disciplinée n'est pas de vendre en panique à ses côtés, mais de vérifier la profondeur du carnet d'ordres, de resserrer ou de confirmer votre stop loss, et de décider si votre thèse de départ tient toujours — pas de refléter la baleine par réflexe.",
    },
    {
      id: "c30-l4",
      title: "Qu'est-ce que la TVL (Total Value Locked) ?",
      paragraphs: [
        "La TVL, ou Total Value Locked (valeur totale verrouillée), est la valeur totale des actifs déposés dans un pool ou un protocole, généralement exprimée en USDC ou en dollars. Pour un seul pool AMM, c'est la somme des deux côtés du pool ; pour tout un protocole, c'est la somme sur l'ensemble de ses pools et coffres. Sur Stellar, vous voyez la TVL le plus directement dans les pools de liquidité AMM, qui prélèvent des frais de pool de 0,30 %, et dans les protocoles DeFi Soroban tels que Blend, DeFindex et Soroswap. La TVL est un signal de taille et de confiance : un pool où des millions sont verrouillés peut absorber de plus gros trades avec moins de slippage, et un protocole dans lequel les gens acceptent de verrouiller de l'argent réel a, au minimum, gagné une certaine confiance.",
        "Pour un trader, la lecture la plus utile est la profondeur. Une TVL plus élevée dans le pool contre lequel vous tradez signifie généralement qu'un ordre au marché déplace moins le prix, si bien que votre tolérance au slippage est plus facile à respecter. Une TVL en baisse est un avertissement : de la liquidité qui quitte un pool le rend plus mince et rend chaque trade suivant plus coûteux et plus volatil. Surveiller la direction de la TVL dans le temps vous en dit souvent plus que le chiffre absolu.",
        "La TVL a de réelles limites, alors ne la traitez pas comme une note de sécurité. Elle peut être gonflée par une seule baleine ou par des capitaux mercenaires courant après une récompense temporaire, et elle peut repartir tout aussi vite. Une TVL élevée ne signifie pas que les contrats sous-jacents sont audités ou sûrs ; les protocoles Soroban comportent un risque de smart contract, quelle que soit la somme verrouillée. Et une TVL élevée en dollars peut elle-même varier simplement parce que le prix des actifs déposés a bougé, et non parce que quelqu'un a ajouté ou retiré des fonds. Lisez la TVL comme une donnée parmi d'autres sur la profondeur et l'intérêt du marché, recoupée avec le carnet d'ordres réel et la composition du pool — non comme une preuve de qualité ou de sécurité.",
      ],
      example:
        "Vous voulez échanger un montant de taille moyenne contre un token et vous voyez deux routes : un pool AMM avec 2 000 000 USDC de TVL et un autre avec 40 000. Le pool profond peut remplir votre ordre avec un léger slippage ; le pool peu profond pourrait déplacer le prix de plusieurs pour cent en votre défaveur et faire exploser votre tolérance au slippage. Mais une semaine plus tard, vous remarquez que la TVL du pool profond est discrètement tombée à 300 000, car un gros fournisseur s'est retiré. Même token, mais le marché vient de s'amincir — un signal pour réduire la taille et revérifier la profondeur avant de trader, non pour supposer que la profondeur d'avant existe toujours.",
    },
    {
      id: "c30-l5",
      title: "Comment utiliser les données on-chain pour évaluer les suggestions de l'IA",
      paragraphs: [
        "L'analyste IA propose des trades assortis d'un score de confiance de 0 à 100, et le backend n'exécute automatiquement que les propositions égales ou supérieures à votre seuil, sous réserve du plafond de trading et du garde-fou de pause en cas de drawdown. Les données on-chain, c'est ainsi que vous vérifiez cette confiance de vos propres yeux plutôt que de prendre le chiffre pour argent comptant. Avant d'accepter une proposition, demandez-vous si le portrait on-chain concorde : le token est-il détenu par de nombreux portefeuilles indépendants, son nombre de lignes de confiance est-il en hausse, y a-t-il assez de TVL et de profondeur de carnet d'ordres pour remplir le trade dans votre tolérance au slippage, et des mouvements de baleines pointent-ils dans la direction opposée à celle de l'IA ?",
        "Le propre scoring de l'application intègre déjà une grande partie de tout cela, et deux chapitres antérieurs expliquent exactement comment. Le chapitre Lire les suggestions de lignes de confiance de l'IA explique le scan hebdomadaire, en observation seule, des tokens du top-N plus ceux détenus, les quatre scores par token, les douze semaines d'historique et les avertissements de détérioration — et il insiste sur le fait que l'application n'ajoute ni ne retire jamais automatiquement une ligne de confiance. Le chapitre Évaluer un token sur la chaîne Stellar explique comment le score d'un token se construit à partir des agrégations de trades de Horizon, de la profondeur du carnet d'ordres et de l'adoption fondée sur les lignes de confiance, plus le signal d'alarme d'un fichier émetteur stellar.toml manquant. Plutôt que de dupliquer tout cela, utilisez le prisme on-chain de ce chapitre pour confirmer ou remettre en question ce que ces scores résument.",
        "Lorsque les données on-chain et l'IA divergent, prenez-le comme une raison de ralentir, non comme un veto instantané. Une confiance bâtie sur une liquidité mince, une base de détenteurs qui rétrécit ou une baleine se dirigeant vers la sortie mérite plus de scepticisme que le score brut ne le suggère ; à l'inverse, un score modeste soutenu par une large adoption et une TVL profonde peut être plus robuste qu'il n'y paraît. Quelle que soit votre décision, inscrivez votre conclusion dans les outils de l'application — taille de position, stop loss, prix cible et prix d'invalidation dont le ratio rendement/risque conditionne le trade — pour que la décision soit fondée sur des règles plutôt que sur l'intuition. Les données on-chain ne remplacent ni l'IA ni les scores ; elles sont le second avis indépendant qui vous empêche de faire davantage confiance à un chiffre confiant qu'à un marché mince. Rien de tout cela ne constitue un conseil financier.",
      ],
      example:
        "L'IA propose d'acheter un token avec une confiance de 82, au-dessus de votre seuil, si bien qu'il s'exécuterait automatiquement. Vous vérifiez d'abord l'on-chain : le nombre de lignes de confiance recule depuis trois semaines d'affilée, la TVL du principal pool AMM a été divisée par deux, et un détenteur du top dix vient d'envoyer un gros solde vers une adresse d'émetteur. Trois signaux on-chain indépendants pointent tous à l'opposé de l'optimisme de l'IA. Vous ne vous contentez pas de couper l'IA — vous réduisez votre taille de position, fixez un stop loss plus serré et confirmez le prix d'invalidation pour que le ratio rendement/risque justifie encore le trade. Le score vous a donné un avis de départ ; le registre vous a dit de le trader plus petit et avec des garde-fous plus serrés.",
    },
  ],
  quiz: [
    {
      id: "c30-q1",
      prompt: "Quelle est la différence essentielle entre les données de marché et les données on-chain ?",
      options: [
        {
          text: "Les données de marché montrent le prix et le volume, tandis que les données on-chain montrent qui détient et déplace réellement l'actif sur le registre public.",
          explanation:
            "Correct. Les données de marché répondent à ce que fait le prix ; les données on-chain répondent à qui se cache derrière ce prix — détenteurs, lignes de confiance, transferts et activité des pools que le prix seul masque.",
        },
        {
          text: "Les données de marché sont publiques et vérifiables, tandis que les données on-chain sont privées et seules les plateformes d'échange peuvent les voir.",
          explanation:
            "C'est l'inverse. Les données on-chain sont la partie publique : le registre de Stellar enregistre chaque compte, ligne de confiance, paiement et trade, lisibles par quiconque. Les données de marché sont ce qui est agrégé par-dessus.",
        },
        {
          text: "C'est la même chose affichée dans deux couleurs différentes sur la page de détail du token.",
          explanation:
            "Non. Les onglets de chandeliers et de volume sont des données de marché ; les données on-chain sont une vue distincte de la participation, sur laquelle deux graphiques d'apparence identique peuvent totalement diverger.",
        },
        {
          text: "Les données on-chain suivent toujours le prix avec retard, si bien qu'elles ne sont utiles qu'une fois un mouvement terminé.",
          explanation:
            "Le contraire est plus proche de la vérité. Les transferts de baleines, les vagues de lignes de confiance et les variations de liquidité se produisent souvent on-chain avant de se refléter pleinement dans le prix, c'est pourquoi le registre peut précéder plutôt que suivre.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c30-q2",
      prompt: "Le nombre de lignes de confiance d'un token bondit de 400 à 1 600 en une seule heure, entièrement depuis des comptes alimentés par une source unique qui ne tradent jamais ensuite. Qu'est-ce que cela indique le plus probablement ?",
      options: [
        {
          text: "Une adoption forte et authentique à laquelle vous devriez faire confiance immédiatement.",
          explanation:
            "Pas à partir de ce schéma. Une adoption réelle a tendance à s'accumuler progressivement à travers des portefeuilles financés de façon indépendante qui effectuent réellement des transactions, non par une salve d'une heure depuis une source de financement unique.",
        },
        {
          text: "Un schéma sybil — un seul acteur qui fabrique l'apparence d'une adoption avec de nombreux comptes bon marché.",
          explanation:
            "Correct. Comme ouvrir un compte Stellar et une ligne de confiance coûte peu, une seule personne peut simuler le nombre de têtes. Même source, même heure et aucun trade ensuite sont des signes sybil classiques ; privilégiez la répartition et la tendance sur les décomptes bruts.",
        },
        {
          text: "Que le scanner de liquidité est défaillant, puisque le nombre de lignes de confiance ne peut pas changer aussi vite.",
          explanation:
            "Non. Le nombre de lignes de confiance peut réellement grimper aussi vite ; le scanner rapporte une activité réelle du registre. La question est de savoir si cette activité est organique, et ici elle ne l'est pas.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c30-q3",
      prompt: "Vous voyez une baleine envoyer 20 % de l'offre d'un petit token peu négocié vers une adresse d'émetteur de type plateforme d'échange. Quelle est la réaction disciplinée ?",
      options: [
        {
          text: "Vendre immédiatement tout, car les baleines savent toujours mieux que les autres.",
          explanation:
            "Non. Vous connaissez rarement la véritable intention d'une baleine, et certaines appâtent délibérément les petits traders. Refléter le mouvement par réflexe, c'est suivre aveuglément, ce qui est le principal danger de l'observation des baleines.",
        },
        {
          text: "L'ignorer complètement, puisqu'un seul portefeuille ne peut jamais influer sur le prix d'un petit token.",
          explanation:
            "Faux dans l'autre sens. Un transfert de la taille d'une baleine sur un token peu négocié est justement le cas qui peut submerger le carnet d'ordres et faire fortement bouger le prix, il ne faut donc pas l'ignorer.",
        },
        {
          text: "Le prendre comme une incitation à regarder de plus près : vérifier la profondeur du carnet d'ordres, confirmer votre stop loss et décider si votre thèse tient toujours.",
          explanation:
            "Correct. L'activité des baleines est un signal pour enquêter et gérer le risque, non un achat ou une vente automatique. Vérifiez la profondeur et appuyez-vous sur vos propres outils de risque plutôt que de réagir à l'urgence.",
        },
        {
          text: "Supposer que c'est un remaniement interne sans signification et ne rien faire du tout.",
          explanation:
            "Trop désinvolte. Ce pourrait être un mouvement interne, mais un transfert vers une adresse d'émetteur ou de plateforme d'échange laisse deviner une intention de vendre ou de racheter — une raison de regarder de plus près, non de supposer que ce n'est rien.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c30-q4",
      prompt: "Quelle affirmation à propos de la TVL (Total Value Locked) est exacte ?",
      options: [
        {
          text: "Une TVL élevée prouve que les contrats d'un protocole sont audités et sûrs à utiliser.",
          explanation:
            "Non. La TVL est un signal de taille et d'intérêt, non une note de sécurité. Les protocoles Soroban comportent un risque de smart contract quelle que soit la somme verrouillée, et la TVL peut être gonflée par une seule baleine ou des capitaux mercenaires.",
        },
        {
          text: "Une TVL plus élevée dans le pool contre lequel vous tradez signifie généralement moins de slippage, mais elle peut repartir rapidement et ne garantit pas la qualité.",
          explanation:
            "Correct. Les pools plus profonds absorbent de plus gros trades avec moins d'impact sur le prix, mais la TVL peut s'écouler vite, être gonflée par un seul fournisseur ou varier simplement parce que le prix des actifs déposés a bougé — lisez-la comme une donnée parmi d'autres, recoupée avec la profondeur réelle.",
        },
        {
          text: "La TVL ne change jamais que lorsque le prix des actifs verrouillés change, jamais à cause de dépôts ou de retraits.",
          explanation:
            "Incomplet et trompeur. Les variations de prix déplacent bien une TVL libellée en dollars, mais les dépôts et les retraits la modifient aussi — un gros fournisseur qui retire de la liquidité est une cause courante et importante de baisse de la TVL.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
