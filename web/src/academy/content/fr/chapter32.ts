// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Chapitre AVANCÉ sur les pools de liquidité et le rendement : comment fonctionnent et
// rémunèrent les pools AMM, le risque caché de la perte impermanente, le yield farming,
// les frais de pool de 0,30 % sur Stellar et qui les perçoit, et quand fournir de la
// liquidité est préférable à un simple trade ponctuel.
// Ce chapitre ne possède aucun nouveau terme de glossaire ; il réutilise des termes vus plus tôt.
import type { Chapter } from "../../types";

export const chapter32: Chapter & { whoFor: string } = {
  id: "c32",
  number: 32,
  level: "ADVANCED",
  whoFor: "Pour les traders qui pèsent le rendement d'un pool face à son risque caché",
  title: "Pools de liquidité et rendement",
  description:
    "Comment les pools fonctionnent et rémunèrent, la perte impermanente, le yield farming, les frais AMM de 0,30 % sur Stellar, et quand un pool l'emporte sur un simple trade.",
  lessons: [
    {
      id: "c32-l1",
      title: "Qu'est-ce qu'un pool de liquidité et comment en tire-t-on un revenu ?",
      paragraphs: [
        "Un pool de liquidité est une réserve partagée on-chain de deux actifs contre laquelle les traders échangent automatiquement, sans carnet d'ordres ni contrepartie à trouver. Sur Stellar, vous déposez les deux côtés d'une paire — disons du XLM et de l'USDC — à valeur égale, et en retour vous recevez des parts de pool qui représentent votre tranche des réserves. Comme un token non natif tel que l'USDC nécessite d'abord une ligne de confiance, vous devez déjà être configuré pour détenir les deux actifs avant de déposer.",
        "Vous percevez un revenu parce que chaque échange qui passe par le pool paie des frais de 0,30 %, et ces frais sont réinjectés directement dans les réserves. Vos parts de pool donnent donc droit à une quantité croissante des actifs sous-jacents au fil du temps : plus votre pool est utilisé, plus vos parts valent cher lorsque vous finissez par retirer. Il n'y a pas de taux d'intérêt fixe — votre rendement n'est que votre part au prorata des frais de trading que le pool collecte.",
        "Le chapitre sur les fonctionnalités avancées de Stellar compare en profondeur les pools AMM et le carnet d'ordres du SDEX. En résumé, le carnet d'ordres vous laisse fixer un prix limite exact et attendre une correspondance, tandis qu'un AMM détermine le prix de chaque échange à partir d'une formule appliquée aux réserves actuelles et exécute toujours instantanément. Fournir de la liquidité est l'image inversée du trading : au lieu de prendre un prix, vous fournissez l'inventaire contre lequel les autres échangent, et vous percevez des frais pour cela.",
      ],
      example:
        "Vous déposez 100 USDC et une valeur équivalente en XLM dans un pool XLM/USDC qui détient au total 10 000 USDC de réserves. Vos parts représentent 1 % du pool. En une semaine, le pool traite 50 000 USDC de volume d'échange, collectant 150 USDC de frais (0,30 %). Votre part de 1 % en gagne environ l'équivalent de 1,50 USDC, qui se capitalise discrètement dans vos réserves sans que vous ayez passé le moindre ordre.",
    },
    {
      id: "c32-l2",
      title: "Qu'est-ce que la perte impermanente et pourquoi est-ce un risque caché ?",
      paragraphs: [
        "La perte impermanente est l'écart entre ce que vaudraient vos actifs déposés si vous les aviez simplement conservés et ce qu'ils valent après avoir séjourné dans le pool pendant que leurs prix divergeaient. Un AMM rééquilibre automatiquement vos deux actifs pour maintenir leurs valeurs égales : quand un actif monte, le pool en vend une partie et achète davantage de celui qui baisse. C'est l'inverse de ce que veut un détenteur, car vous finissez par détenir moins du gagnant et plus du perdant.",
        "On appelle cette perte impermanente parce qu'elle ne se cristallise que lorsque vous retirez. Si les deux prix reviennent à leur ratio d'origine, l'écart se referme et vous conservez vos frais nets de tout. Mais si la divergence est permanente, la perte l'est aussi. Point crucial : la perte impermanente est la plus forte pour les paires volatiles et non corrélées, et la plus faible pour les paires qui évoluent de concert, ce qui explique pourquoi les pools entre stablecoins sont relativement sûrs.",
        "C'est le risque caché car le solde du pool peut paraître sain alors que vous êtes discrètement moins bien loti qu'un détenteur. La vraie question est toujours de savoir si les frais que vous avez collectés l'emportent sur la perte impermanente que vous avez subie. Si la paire a à peine bougé et que le volume était élevé, les frais gagnent ; si un actif a doublé pendant que l'autre stagnait, la perte impermanente peut facilement engloutir une semaine de frais.",
      ],
      example:
        "Vous déposez 100 USDC et 1 000 XLM alors que le XLM vaut 0,10 USDC — une position équilibrée de 200 USDC. Le XLM double ensuite à 0,20 USDC. L'AMM a vendu du XLM tout au long de la hausse, si bien que vous retirez environ 707 XLM et 141 USDC, valant à peu près 283 USDC. Si vous aviez simplement conservé, vos 100 USDC plus 1 000 XLM (désormais 200 USDC) feraient 300 USDC. Ce manque à gagner de 17 USDC est la perte impermanente ; si vos revenus de frais sur la période étaient inférieurs à 17 USDC, vous êtes perdant.",
    },
    {
      id: "c32-l3",
      title: "Qu'est-ce que le yield farming ?",
      paragraphs: [
        "Le yield farming consiste à déplacer activement votre liquidité entre pools et protocoles pour chercher le rendement le plus élevé. Plutôt que de garer ses actifs dans un seul pool et de les oublier, un farmer traque les pools offrant la meilleure combinaison de revenus de frais et d'éventuelles récompenses incitatives supplémentaires, puis réalloue à mesure que ces opportunités évoluent. Sur la plateforme de contrats intelligents Soroban de Stellar, des protocoles DeFi comme Blend, DeFindex et Soroswap ajoutent des rendements de prêt et des tokens de récompense par-dessus les simples frais AMM.",
        "L'attrait tient au fait que les rendements affichés peuvent sembler bien supérieurs à une simple part de frais, car les protocoles distribuent parfois leurs propres tokens pour attirer la liquidité. Le hic, c'est que ces chiffres annoncés sont rarement le rendement réel. Ils ignorent généralement la perte impermanente, le risque de prix de tout token de récompense qui vous est versé, et le fait que les rendements élevés ont tendance à s'éroder vite dès que la liquidité afflue.",
        "Le farming empile les risques au lieu de les supprimer : bugs de contrats intelligents, pools à faible liquidité, tokens de récompense qui s'effondrent, et le simple coût des rééquilibrages fréquents. C'est une activité avancée et exigeante, pas un revenu passif, et les rendements ne sont jamais garantis. Rien de tout cela n'est un conseil financier — traitez chaque rendement affiché comme une question de départ, pas comme une promesse, et dimensionnez vos positions en fonction de ce que vous pouvez vous permettre de perdre.",
      ],
      example:
        "Un nouveau pool Soroswap affiche un rendement annualisé de 40 %, versé pour l'essentiel dans son propre token de récompense. Un farmer y déplace de la liquidité, mais deux semaines plus tard une vague de nouveaux déposants dilue la récompense, le token incitatif chute de 30 %, et le mouvement du XLM face à l'USDC a ajouté de la perte impermanente. Le titre de 40 % devient discrètement un rendement réel de quelques pour cent — avant même de compter les frais dépensés à entrer et sortir.",
    },
    {
      id: "c32-l4",
      title: "Comment fonctionnent les frais AMM sur Stellar (0,30 %) et qui les perçoit ?",
      paragraphs: [
        "Chaque échange routé par un pool de liquidité Stellar paie des frais de pool fixes de 0,30 %, prélevés sur le montant entrant avant que la formule de pricing ne s'applique. C'est distinct des minuscules frais de réseau d'environ 0,00001 XLM que paie chaque transaction Stellar, et distinct encore de la petite réserve minimale de XLM que conserve chaque compte. Les 0,30 % sont le coût, pour celui qui échange, d'utiliser le pool, et ils ne quittent jamais le pool.",
        "Ces frais ne sont perçus ni par Stellar, ni par Atrium, ni par aucun opérateur central. Ils sont ajoutés directement aux réserves du pool, ce qui augmente la valeur de chaque part de pool en circulation. Cela signifie que ce sont les fournisseurs de liquidité qui les reçoivent, au prorata : si vous détenez 5 % des parts, vous gagnez effectivement 5 % de chaque frais que le pool collecte. Vous ne le concrétisez qu'au moment du retrait, en constatant que vos parts s'échangent désormais contre plus d'actifs que vous n'en aviez apportés.",
        "Comme les frais augmentent avec le volume, le rendement réel d'un pool pour les fournisseurs dépend bien plus du volume de trading qui le traverse que de sa taille. Un petit pool très actif peut rapporter davantage qu'un gros pool inactif. Lorsque vous échangez dans l'onglet Trading manuel d'Atrium, un paiement par chemin peut être routé par l'un de ces pools, et les 0,30 % sont intégrés au prix effectif que vous voyez, aux côtés de votre tolérance au slippage.",
      ],
      example:
        "Un pool détient 200 000 USDC de réserves et réalise 400 000 USDC de volume d'échange en un mois, collectant 1 200 USDC de frais (0,30 %). Ces frais rejoignent les réserves, si bien que le pool adosse désormais les mêmes parts à 201 200 USDC d'actifs. Un fournisseur détenant 5 % des parts voit sa mise grimper d'environ 60 USDC — sa part au prorata — exigible au moment du retrait.",
    },
    {
      id: "c32-l5",
      title: "Quand un pool de liquidité est-il plus attrayant qu'un trade ordinaire ?",
      paragraphs: [
        "Un trade ordinaire est un pari directionnel ponctuel : vous achetez ou vendez sur le SDEX ou via un échange AMM, vous prenez un prix, et c'est terminé. Fournir de la liquidité est la posture inverse — vous êtes neutre sur la direction et vous louez plutôt votre inventaire pour gagner un flux de frais. Le chapitre sur les fonctionnalités avancées de Stellar explique en quoi le pricing AMM et la correspondance du carnet d'ordres diffèrent ; la décision ici n'est pas de savoir quel lieu fixe le meilleur prix, mais si vous voulez trader ou être tradé contre.",
        "Un pool devient attrayant quand vous comptez de toute façon détenir les deux actifs, quand la paire est relativement stable ou fortement corrélée, et quand le volume de trading est assez élevé pour que les frais l'emportent confortablement sur la perte impermanente. Les paires de stablecoins sont le cas classique : divergence infime, donc quasiment pas de perte impermanente, tandis qu'un volume d'échange régulier fait affluer les frais. Dans ce cadre, vos actifs rapportent pendant qu'ils dorment, ce qu'un simple trade ne peut jamais faire.",
        "Un trade ordinaire l'emporte quand vous avez une vraie vision directionnelle, quand la paire est volatile et non corrélée au point que la perte impermanente mordrait, ou quand vous devez sortir proprement à un prix choisi — ce qui est précisément ce qu'un ordre limite sur le SDEX vous offre. L'arbitrage central est toujours le rendement contre la perte impermanente : un pool vous paie pour rester neutre, et vous ne devriez accepter ce paiement que lorsque les frais attendus l'emportent sur le frein de la divergence.",
      ],
      example:
        "Vous détenez de l'USDC et un second stablecoin de type Circle et vous n'avez de vision forte sur ni l'un ni l'autre. Échanger l'un contre l'autre une fois ne vous rapporte rien au-delà du spread. Déposer les deux dans un pool stable leur permet en revanche de gagner les frais de 0,30 % sur chaque échange qui passe, avec une perte impermanente quasi nulle puisque les deux prix bougent à peine. Ici, le pool l'emporte clairement sur le trade ponctuel. Remplacez cette paire stable par un pool volatil XLM/nouveautoken et le calcul peut basculer dans l'autre sens.",
    },
  ],
  quiz: [
    {
      id: "c32-q1",
      prompt: "Vous déposez du XLM et de l'USDC dans un pool de liquidité Stellar. D'où provient réellement votre rendement ?",
      options: [
        {
          text: "D'un taux d'intérêt fixe versé par Atrium pour l'immobilisation de vos actifs.",
          explanation:
            "Non. Atrium ne verse aucun intérêt et ne prend aucune garde sur les frais de pool. Le rendement d'un pool est variable et provient de l'activité de trading, pas d'un taux promis.",
        },
        {
          text: "De votre part au prorata des frais de 0,30 % que chaque échange dans le pool verse dans les réserves.",
          explanation:
            "Correct. Chaque échange ajoute des frais de 0,30 % aux réserves du pool, si bien que vos parts s'échangent contre plus d'actifs au fil du temps. Votre rendement n'est que votre tranche de ce flux de frais.",
        },
        {
          text: "Des minuscules frais de réseau d'environ 0,00001 XLM que Stellar prélève sur chaque transaction.",
          explanation:
            "Faux. Les frais de réseau sont un coût de protocole distinct qui ne va pas aux fournisseurs de liquidité. Le rendement du fournisseur provient des frais de pool de 0,30 %, pas des frais de réseau.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q2",
      prompt: "Quelle situation produit la PLUS GRANDE perte impermanente pour un fournisseur de liquidité ?",
      options: [
        {
          text: "Un pool de deux stablecoins dont les prix restent à une fraction de pour cent l'un de l'autre.",
          explanation:
            "Non. Des prix corrélés et quasi identiques divergent à peine, donc la perte impermanente est minime. C'est pour cette raison le type de pool le plus sûr.",
        },
        {
          text: "Une paire volatile et non corrélée où un actif double pendant que l'autre stagne.",
          explanation:
            "Correct. La perte impermanente croît avec la divergence entre les deux actifs. Un grand mouvement à sens unique est le pire cas, car l'AMM a vendu le gagnant tout au long de la hausse.",
        },
        {
          text: "Un pool dont les deux actifs montent exactement du même pourcentage.",
          explanation:
            "Faux. Si les deux actifs évoluent de concert, leur ratio reste inchangé, donc il n'y a pratiquement aucune perte impermanente — c'est la divergence, et non la direction, qui la provoque.",
        },
        {
          text: "Un pool avec un volume d'échange très élevé mais un ratio de prix stable.",
          explanation:
            "Faux. Un volume élevé signifie plus de frais, et un ratio stable signifie peu de divergence — c'est un pool favorable, pas une source de grande perte impermanente.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q3",
      prompt: "Un nouveau pool Soroban affiche un rendement annualisé de 40 %, versé pour l'essentiel dans son propre token de récompense. Que devrait supposer un trader avancé ?",
      options: [
        {
          text: "Les 40 % sont un rendement fiable et garanti que vous conserverez.",
          explanation:
            "Non. Les rendements de farming affichés sont rarement le rendement réel et ne sont jamais garantis. Ils ignorent généralement la perte impermanente et le risque de prix du token de récompense.",
        },
        {
          text: "Le chiffre affiché ignore la perte impermanente, le risque de prix du token de récompense et l'érosion du rendement, donc le rendement réel est probablement bien plus faible.",
          explanation:
            "Correct. Le yield farming empile les risques : dilution à mesure que la liquidité afflue, un token de récompense qui peut chuter, la perte impermanente et les coûts de rééquilibrage. Traitez le chiffre comme une question, pas comme une promesse.",
        },
        {
          text: "Les tokens de récompense ne portent aucun risque de prix parce qu'un protocole les a émis.",
          explanation:
            "Faux. Le token propre d'un protocole peut chuter brutalement, et les tokens incitatifs le font souvent une fois que les émissions diluent. Être émis par un protocole n'offre aucune protection de prix.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q4",
      prompt: "Sur Stellar, qui perçoit en fin de compte les frais de pool de 0,30 % payés sur un échange ?",
      options: [
        {
          text: "Atrium, en tant qu'application qui a routé l'échange.",
          explanation:
            "Non. Atrium ne collecte pas les frais de pool. Les 0,30 % ne quittent jamais le pool et reviennent à ceux qui ont fourni la liquidité.",
        },
        {
          text: "Les validateurs du réseau Stellar, aux côtés des frais de réseau de base.",
          explanation:
            "Faux. Les validateurs sont rémunérés par les frais de réseau distincts d'environ 0,00001 XLM, pas par les frais de pool de 0,30 %, qui restent dans le pool.",
        },
        {
          text: "Les fournisseurs de liquidité, au prorata, via des réserves réinjectées directement dans le pool.",
          explanation:
            "Correct. Les frais sont ajoutés aux réserves du pool, ce qui augmente la valeur de chaque part. Les fournisseurs concrétisent leur part au prorata lorsqu'ils retirent plus d'actifs qu'ils n'en ont déposés.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c32-q5",
      prompt: "Quand fournir de la liquidité est-il nettement plus attrayant que de faire un trade ponctuel sur le SDEX ?",
      options: [
        {
          text: "Quand vous avez une vision directionnelle forte et voulez sortir à un prix précis.",
          explanation:
            "Non. C'est précisément là qu'un trade ordinaire l'emporte — un ordre limite sur le SDEX vous laisse fixer votre prix de sortie. Un pool vous maintient neutre, ce qui va à l'encontre d'une vision directionnelle.",
        },
        {
          text: "Quand vous comptez de toute façon détenir les deux actifs, que la paire est stable ou corrélée, et que le volume est assez élevé pour que les frais l'emportent sur la perte impermanente.",
          explanation:
            "Correct. Posture neutre plus faible divergence plus volume régulier, c'est le point idéal : vos actifs gagnent les frais de 0,30 % pendant qu'ils dorment, ce qu'un trade ponctuel ne peut jamais faire.",
        },
        {
          text: "Quand la paire est très volatile et non corrélée, de sorte que les prix oscillent beaucoup.",
          explanation:
            "Faux. Une forte divergence maximise la perte impermanente, qui peut engloutir vos frais. Une paire volatile et non corrélée favorise un trade directionnel, pas la fourniture de liquidité.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
