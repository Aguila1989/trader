// PENDING — do not activate until green light.
// Chapitre expert sur l'architecture blockchain : le consensus et le problème
// de la double dépense, le Stellar Consensus Protocol en tant qu'accord byzantin
// fédéré, les nœuds et les ensembles de quorum, la vie complète d'une transaction
// à travers Horizon et la clôture du registre, et le trilemme de la scalabilité.
// Ce chapitre ne possède aucun nouveau terme de glossaire ; il réutilise des
// termes enseignés dans les chapitres précédents. Rédigé selon exactement la même
// forme que content/en/chapter22.ts, avec la formule `whoFor` propre au chapitre
// typée via une intersection locale afin que l'interface Chapter en production
// reste intacte.
import type { Chapter } from "../../../types";

export const chapter33: Chapter & { whoFor: string } = {
  id: "c33",
  number: 33,
  level: "EXPERT",
  whoFor: "Pour les curieux techniques qui veulent savoir comment Stellar se met vraiment d'accord sur la vérité",
  title: "Architecture blockchain — comment ça marche vraiment",
  description:
    "Comment un réseau d'inconnus s'accorde sur une seule vérité sans arbitre central : le consensus et le problème de la double dépense, le Stellar Consensus Protocol, les nœuds et les ensembles de quorum, la vie d'une transaction, et le trilemme de la scalabilité.",
  lessons: [
    {
      id: "c33-l1",
      title: "Qu'est-ce que le consensus et comment une blockchain résout-elle le problème de la double dépense ?",
      paragraphs: [
        "Le consensus est le processus par lequel de nombreux ordinateurs indépendants, dont aucun ne fait confiance à une autorité centrale, s'accordent sur un historique partagé unique : quelles transactions ont eu lieu, dans quel ordre, et quels en sont les soldes résultants. Sans accord sur l'ordre, une blockchain n'est qu'un amas de revendications contradictoires. Le plus difficile n'est pas de stocker les données, c'est d'amener des milliers d'inconnus mus par leurs propres intérêts à converger vers la même réponse, même lorsque certains d'entre eux sont défaillants ou malveillants.",
        "La menace classique est la double dépense. L'argent numérique n'est que des chiffres, et les chiffres peuvent être copiés. Si je détiens 100 USDC et que je les envoie en totalité à Alice et en totalité à Bob dans deux transactions diffusées au même instant, les deux paraissent valides prises isolément. Un registre digne de confiance doit en accepter exactement une et rejeter l'autre, afin que le même solde ne puisse jamais être dépensé deux fois. Le consensus est précisément le mécanisme qui choisit un ordre canonique, et une fois qu'une dépense est validée, l'autre devient invalide.",
        "Les différents réseaux résolvent cela avec des règles différentes. La preuve de travail (Bitcoin) rend l'écriture de l'historique coûteuse : les mineurs brûlent de l'électricité en course pour trouver un hash inférieur à une cible, et la plus longue chaîne de travail accumulé l'emporte, si bien que réécrire une dépense revient à surpasser en puissance de calcul le réseau tout entier. La preuve d'enjeu (l'Ethereum moderne) remplace l'électricité par un capital mis en jeu : les validateurs immobilisent des fonds, sont choisis pour proposer et attester des blocs, et perdent leur mise s'ils signent des historiques contradictoires. Les deux parviennent finalement à un accord, de façon probabiliste, et les deux permettent à quiconque de participer en dépensant la ressource requise.",
        "Le Stellar Consensus Protocol (SCP) emprunte une troisième voie. Il n'y a ni minage ni mise en jeu. Au lieu d'une règle globale unique qui décide qui peut écrire, chaque participant déclare à quels autres participants il fait confiance, et le réseau converge à travers ces cercles de confiance qui se chevauchent. Cela le rend rapide et bon marché, mais cela signifie que la sécurité repose sur les choix de confiance que font les participants plutôt que sur de l'énergie brûlée ou du capital immobilisé — un compromis que les leçons suivantes décortiquent.",
      ],
      example:
        "Imaginez la double dépense de façon concrète : un portefeuille contenant 100 USDC signe deux paiements par chemin dans la même seconde, l'un convertissant en XLM pour Alice et l'autre convertissant en yXLM pour Bob, chacun dépensant l'intégralité des 100. Les deux sont individuellement bien formés. Le consensus force le réseau à les sérialiser : la transaction qui atterrit la première dans un registre clos consomme le solde, et la seconde est rejetée au moment de l'application parce que les fonds n'existent plus. C'est le registre, et non l'émetteur, qui décide de l'ordre.",
    },
    {
      id: "c33-l2",
      title: "Qu'est-ce que le Stellar Consensus Protocol et pourquoi est-il différent ?",
      paragraphs: [
        "Le Stellar Consensus Protocol est une implémentation de l'accord byzantin fédéré (Federated Byzantine Agreement, FBA). « Byzantin » signifie qu'il tolère des nœuds qui ne sont pas seulement en panne, mais qui mentent ou se comportent mal activement. « Fédéré » est la subtilité qui le distingue : il n'existe pas de liste fixe, convenue à l'avance, des validateurs. Chaque nœud choisit librement son propre ensemble de nœuds de confiance, et l'appartenance globale au réseau émerge de l'union des choix individuels de chacun, plutôt que d'être imposée par un registre central.",
        "La brique de base est la tranche de quorum. Une tranche de quorum est un groupe de nœuds qu'un nœud donné juge suffisant pour le convaincre d'un énoncé. Un nœud accepte quelque chose comme vrai dès que tous les nœuds de l'une de ses tranches sont d'accord. Un quorum est un ensemble de nœuds qui contient une tranche pour chacun de ses membres — un groupe auto-renforçant capable de parvenir à un accord en interne. Fait crucial, personne ne vous remet un quorum ; il naît de la manière dont les tranches se chevauchent. Tant que les tranches des nœuds honnêtes se recoupent suffisamment, le réseau tout entier est entraîné vers une décision unique, car il est impossible pour deux groupes disjoints de satisfaire chacun ses tranches tout en validant des valeurs contradictoires.",
        "Parce qu'il n'y a pas d'énigme à résoudre ni de mise à immobiliser, le SCP n'a pas besoin d'un token de récompense pour motiver la production de blocs, et il ne brûle pas d'énergie. Un registre se clôt lorsqu'un quorum a confirmé le même ensemble de transactions, ce qui, sur Stellar, prend environ cinq secondes. Cette confirmation est définitive : contrairement à la preuve de travail, où un bloc peut être orphelin si une chaîne plus longue apparaît, un registre validé par le SCP ne sera pas annulé. Il n'y a pas de « attendre six confirmations » — une fois clos, c'est terminé.",
        "Le compromis, c'est l'honnêteté quant à ce qui sécurise le réseau. La preuve de travail et la preuve d'enjeu achètent la sécurité avec une ressource externe et mesurable. Le FBA l'achète avec une configuration de confiance : le réseau n'est sûr que si les participants choisissent des ensembles de quorum sensés et se chevauchant, et si un nombre suffisant de nœuds importants sont honnêtes et joignables. De mauvais choix de confiance — par exemple, si tout le monde s'appuie sur la même poignée de validateurs — peuvent créer de la fragilité ou, dans le pire des cas, une scission du réseau. Le SCP déplace la question de la sécurité de « combien avez-vous dépensé ? » vers « à qui avez-vous choisi de faire confiance, et ces choix se chevauchaient-ils ? ».",
      ],
      example:
        "Pensez à une petite ville qui cherche à déterminer si une rumeur est vraie. Vous, personnellement, y croirez dès que votre médecin et vos deux amis les plus prudents l'affirmeront tous — ce trio est votre tranche de quorum. Votre voisin a un trio différent. Mais votre médecin fait aussi partie de la tranche de votre voisin, et son ami prudent fait partie de la vôtre. Parce que les cercles de confiance se chevauchent, la ville ne peut pas finir à moitié à croire une chose et à moitié à croire le contraire ; le chevauchement force une conclusion partagée unique. Le SCP, c'est cette dynamique, exécutée par des serveurs au lieu d'habitants.",
    },
    {
      id: "c33-l3",
      title: "Que sont les nœuds, les validateurs et les ensembles de quorum sur Stellar ?",
      paragraphs: [
        "Un nœud est n'importe quel ordinateur exécutant le logiciel Stellar Core et participant au réseau. Les nœuds se transmettent les transactions entre eux, conservent une copie du registre et appliquent les changements d'état. Tous les nœuds ne votent pas : un nœud observateur suit le registre et sert des données, mais reste à l'écart du consensus, tandis qu'un validateur est un nœud configuré avec une clé de signature qui exprime activement des votes dans le SCP. En coulisses de l'application, Horizon — le serveur d'API HTTP de Stellar — se place généralement devant un nœud Core, traduisant du REST et du JSON conviviaux dans le protocole bas niveau que parle le réseau.",
        "Chaque validateur publie un ensemble de quorum : sa déclaration explicite des autres validateurs auxquels il fait confiance et du nombre d'entre eux qui doivent être d'accord avant qu'il n'accepte une valeur. Un ensemble de quorum n'est pas une liste plate ; c'est typiquement une structure à seuil, par exemple « être d'accord si 3 quelconques de ces 4 groupes sont d'accord », et ces groupes peuvent eux-mêmes être des seuils imbriqués. Cela permet à un opérateur d'exprimer une nuance telle que « je fais confiance au réseau si une majorité des grands fournisseurs d'infrastructure plus au moins un validateur indépendant concordent », encodant des relations de confiance du monde réel plutôt qu'un vote global unique.",
        "Les tranches de quorum sont alors dérivées de cet ensemble de quorum : toute combinaison de validateurs qui satisfait les seuils est une tranche, un groupe suffisant pour convaincre ce validateur. Le réseau parvient à un accord parce que les validateurs choisissent leurs ensembles de sorte que les tranches se chevauchent — ce chevauchement, appelé intersection de quorum, est ce qui garantit que deux validateurs honnêtes ne peuvent pas valider des registres contradictoires. Si les ensembles de quorum étaient configurés de telle sorte que deux groupes ne partagent aucun membre, le réseau pourrait forker ; une configuration Stellar saine achemine délibérément la confiance à travers un noyau commun afin que l'intersection soit toujours vérifiée.",
        "En pratique, la Stellar Development Foundation et un ensemble d'organisations indépendantes exploitent des validateurs, et chacun publie un fichier stellar.toml déclarant son identité et ses clés de validateur. Les opérateurs se référencent mutuellement à travers ces identités publiées lorsqu'ils construisent leurs ensembles de quorum, ce qui explique pourquoi une identité de nœud transparente et vérifiable est importante. Un validateur qui dissimule son identité ou auquel personne ne fait confiance n'apporte rien ; la résilience du réseau vient de nombreux opérateurs bien connus et honnêtes dont les choix de confiance qui se chevauchent ne laissent aucune place à une scission.",
      ],
      example:
        "Supposons que le backend de l'application soumette une transaction et ait besoin de savoir qu'elle a été réglée. Horizon la transmet à un nœud Core, qui est un validateur dont l'ensemble de quorum indique « accepter lorsqu'au moins 4 de ces 6 organisations nommées sont d'accord, et l'une de ces organisations doit être du niveau SDF ». Toute combinaison de 4 parmi 6 qui respecte la règle est une tranche valide. Lorsqu'une telle tranche confirme le registre, ce validateur le valide — et parce que l'ensemble de chaque autre validateur honnête achemine lui aussi la confiance à travers ces mêmes organisations bien connues, ils valident tous le registre identique.",
    },
    {
      id: "c33-l4",
      title: "Comment les transactions sont-elles traitées et ajoutées à un registre ?",
      paragraphs: [
        "Une transaction commence dans le client. L'application construit un objet transaction — un compte source, un numéro de séquence, des frais et une ou plusieurs opérations telles qu'un paiement, un paiement par chemin, une gestion d'ordre sur le SDEX, ou un changement de confiance qui ajoute une ligne de confiance. Elle est ensuite signée avec la clé secrète du compte, produisant une signature qui prouve l'autorisation sans révéler la clé. Rien n'a encore touché le réseau ; il ne s'agit là que de construction locale et de cryptographie, et une transaction non signée ou mal séquencée sera tout simplement rejetée.",
        "La transaction signée est soumise, dans cette application via le point de terminaison de transaction d'Horizon. Horizon effectue une validation de base, puis la remet à son nœud Stellar Core, qui la diffuse à travers le réseau pair à pair par propagation. Chaque validateur rassemble les transactions dont il a eu connaissance dans un ensemble de transactions candidat pour le prochain registre. Les frais et les numéros de séquence aident à ordonner et à dédupliquer ; si le réseau est congestionné, les transactions surenchérissent via les frais dans une enchère de tarification de pointe, et les offres les plus basses attendent un registre ultérieur.",
        "Le SCP s'exécute alors, en deux phases. Lors de la nomination, les validateurs proposent des ensembles de transactions candidats et convergent vers un seul ensemble convenu de transactions pour ce registre. Dans le protocole de scrutin, ils votent pour valider cet ensemble, échangeant des messages de préparation et de validation jusqu'à ce qu'un quorum confirme la même valeur. C'est là que réside la tolérance byzantine : même si certains validateurs mentent ou se taisent, le chevauchement des ensembles de quorum empêche que deux ensembles différents soient tous deux validés. La phase se termine lorsqu'un quorum a externalisé un ensemble de transactions.",
        "Le registre se clôt ensuite — environ toutes les cinq secondes. Core applique les transactions convenues dans leur ordre canonique, met à jour chaque compte, ordre et ligne de confiance concernés, calcule un nouveau hash de registre qui s'enchaîne au registre précédent, et le résultat est définitif et irréversible. Horizon ingère le registre clos et ce n'est qu'alors que l'appel de soumission de l'application renvoie le succès avec le résultat. C'est pourquoi un trade soumis n'est pas « terminé » à l'instant où vous cliquez : il est terminé lorsque le registre qui le contient se clôt, et la finalité sur Stellar est immédiate à ce moment-là, plutôt que probabiliste sur de nombreux blocs ultérieurs.",
      ],
      example:
        "Vous passez un ordre au marché pour vendre des XLM contre des USDC dans l'onglet Trading manuel. L'application construit et signe une opération de gestion d'ordre et l'envoie par POST à Horizon. Horizon la relaie à Core, qui la propage ; les validateurs l'intègrent au prochain ensemble candidat, exécutent la nomination et le protocole de scrutin, et un quorum externalise cet ensemble. Environ cinq secondes plus tard, le registre se clôt : votre ordre s'apparie contre le carnet d'ordres, les soldes se mettent à jour de façon atomique, un nouveau hash de registre est écrit, et Horizon renvoie l'exécution à l'application. L'attente de cinq secondes que vous ressentez est un cycle complet de consensus.",
    },
    {
      id: "c33-l5",
      title: "Quelles sont les limites d'une blockchain ?",
      paragraphs: [
        "Toute blockchain vit à l'intérieur du trilemme de la scalabilité : le constat qu'il est très difficile de maximiser en même temps la décentralisation, la sécurité et la scalabilité, et que pousser fort sur l'une coûte généralement une autre. La décentralisation signifie de nombreux participants indépendants sans point de contrôle unique. La sécurité signifie la résistance aux attaques et à la réécriture de l'historique. La scalabilité signifie un débit élevé et un faible coût par transaction. Les réseaux réels choisissent un équilibre plutôt que de remporter les trois.",
        "Les tensions sont concrètes. Si vous augmentez le débit en exigeant des validateurs plus puissants et plus coûteux, moins de gens peuvent se permettre d'en exploiter un et la décentralisation s'érode. Si vous gardez la validation bon marché pour que n'importe qui puisse participer, la capacité par nœud plafonne votre débit. La preuve de travail dépense de l'énergie réelle pour acheter de la sécurité et la paie en vitesse et en coût ; les grands systèmes de preuve d'enjeu concentrent l'influence entre les mains des plus gros détenteurs. Il n'y a pas de repas gratuit — chaque conception est un compromis choisi, non un problème résolu.",
        "Les choix de Stellar le placent délibérément du côté du rapide, du bon marché et du raisonnablement décentralisé, en acceptant un coût précis. Le SCP avec le FBA offre une finalité de cinq secondes et des frais d'une fraction de centime, ce qui est une excellente scalabilité pour les paiements et les transferts d'actifs. La sécurité ne vient pas de l'énergie ni de la mise, mais de l'honnêteté et du chevauchement des ensembles de quorum, de sorte que la sécurité de Stellar n'est aussi solide que sa topologie de confiance — un ensemble de validateurs plus restreint et fondé sur l'identité est plus efficace, mais s'appuie sur le bon comportement de ces opérateurs et sur la configuration de quorums qui s'intersectent. C'est une optimisation axée sur les paiements, non une posture de décentralisation maximale à usage général.",
        "Les blockchains ont aussi des limites qu'aucun ajustement du consensus ne supprime. Le code on-chain est public et permanent, si bien que les bugs sont coûteux et la confidentialité limitée. Le débit est fini, donc la congestion fait grimper les frais. Et le registre n'applique que ses propres règles — il ne peut pas se porter garant de la qualité, dans le monde réel, d'un actif, raison pour laquelle l'application note les tokens hors chaîne à l'aide d'agrégations de trades, de la profondeur du carnet d'ordres et de l'adoption, plutôt que de se fier à une simple présence on-chain. Des couches plus récentes comme Soroban, la plateforme de contrats intelligents de Stellar, étendent ce que le réseau peut faire mais héritent des mêmes compromis du trilemme. Rien de tout cela ne constitue un conseil en investissement, fiscal ou juridique ; c'est de l'architecture, et savoir où une chaîne se situe sur le trilemme vous indique ce à quoi elle est bonne et là où il faut rester prudent.",
      ],
      example:
        "Comparez deux extrêmes. Une base de données bancaire unique est extrêmement rapide et bon marché mais entièrement centralisée — la banque peut geler ou annuler n'importe quoi, si bien qu'elle échoue au test de la décentralisation et de la résistance à la censure. Bitcoin est hautement décentralisé et sécurisé mais ne traite qu'une poignée de transactions par seconde en période de frais élevés. Stellar se situe entre les deux : moins minimiseur de confiance que la preuve de travail, mais réglant un paiement par chemin à travers plusieurs marchés en environ cinq secondes pour une fraction de centime. Chaque conception a acheté deux coins du triangle et payé sur le troisième.",
    },
  ],
  quiz: [
    {
      id: "c33-q1",
      prompt: "Quel problème le consensus de la blockchain existe-t-il fondamentalement pour résoudre ?",
      options: [
        {
          text: "Chiffrer les transactions afin que personne ne puisse lire qui a payé qui.",
          explanation:
            "Incorrect. Le chiffrement et la confidentialité sont des préoccupations distinctes ; la plupart des registres publics, y compris Stellar, sont en réalité transparents. Le consensus consiste à s'accorder sur l'ordre, non à dissimuler des données.",
        },
        {
          text: "Amener de nombreux nœuds indépendants et méfiants à s'accorder sur un historique ordonné unique afin que le même solde ne puisse pas être dépensé deux fois.",
          explanation:
            "Correct. Le consensus produit un ordre canonique unique des transactions entre des nœuds qui se méfient mutuellement, ce qui est précisément ce qui déjoue la double dépense : une seule de deux dépenses contradictoires peut être validée.",
        },
        {
          text: "Rendre les transactions définitivement gratuites en supprimant tous les frais de réseau.",
          explanation:
            "Incorrect. Les frais existent précisément parce que l'espace de bloc est rare et pour dissuader le spam ; le consensus ne vise pas à les éliminer et Stellar facture toujours des frais infimes par opération.",
        },
        {
          text: "Garantir que le prix d'un actif ne fait que monter.",
          explanation:
            "Incorrect. Le consensus concerne l'intégrité et l'ordonnancement du registre, non les prix du marché, qu'aucun protocole ne contrôle.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c33-q2",
      prompt: "Comment le Stellar Consensus Protocol parvient-il à un accord, comparé à la preuve de travail et à la preuve d'enjeu ?",
      options: [
        {
          text: "Il fait résoudre aux validateurs des énigmes de hash gourmandes en énergie, et la plus longue chaîne de travail l'emporte.",
          explanation:
            "Incorrect. Cela décrit la preuve de travail. Le SCP n'effectue aucun minage et ne brûle aucune énergie.",
        },
        {
          text: "Il exige des validateurs qu'ils immobilisent un capital qui est confisqué s'ils signent des historiques contradictoires.",
          explanation:
            "Incorrect. Cela décrit la preuve d'enjeu. Le SCP n'a ni mise en jeu ni dépôt confiscable.",
        },
        {
          text: "Chaque nœud choisit à qui il fait confiance, et l'accord émerge des tranches de quorum qui se chevauchent — pas de minage, pas de mise en jeu, avec une finalité rapide.",
          explanation:
            "Correct. Le SCP implémente l'accord byzantin fédéré : la sécurité repose sur le chevauchement des choix de confiance plutôt que sur de l'énergie dépensée ou une mise immobilisée, offrant une finalité irréversible d'environ cinq secondes.",
        },
        {
          text: "Un serveur Stellar central signe chaque registre et le diffuse au réseau.",
          explanation:
            "Incorrect. Il n'existe aucun signataire central. De nombreux validateurs indépendants parviennent à un accord à travers leurs ensembles de quorum ; une autorité unique irait à l'encontre de l'objectif même du consensus.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q3",
      prompt: "Qu'est-ce que l'ensemble de quorum d'un validateur, et pourquoi le chevauchement entre ensembles de quorum est-il important ?",
      options: [
        {
          text: "C'est l'ensemble explicite de nœuds de confiance et de seuils du validateur ; des ensembles qui se chevauchent (l'intersection de quorum) empêchent deux validateurs honnêtes de valider des registres contradictoires.",
          explanation:
            "Correct. Un ensemble de quorum encode à qui un validateur fait confiance et combien doivent être d'accord. Parce que les validateurs honnêtes acheminent la confiance à travers des opérateurs communs et bien connus, leurs tranches s'intersectent, si bien que le réseau ne peut pas forker en deux historiques contradictoires.",
        },
        {
          text: "C'est le montant de XLM qu'un validateur doit mettre en jeu avant de pouvoir voter.",
          explanation:
            "Incorrect. Les validateurs de Stellar ne mettent pas de fonds en jeu pour voter ; un ensemble de quorum concerne des relations de confiance, non des fonds immobilisés.",
        },
        {
          text: "C'est un groupe aléatoire de nœuds assigné par le réseau à chaque registre, si bien que le chevauchement est impossible.",
          explanation:
            "Incorrect. Les ensembles de quorum sont choisis et publiés par chaque opérateur, non assignés aléatoirement, et le chevauchement délibéré est précisément ce qui maintient le réseau en sécurité.",
        },
        {
          text: "C'est la liste des tokens qu'un validateur est autorisé à trader ; le chevauchement leur permet de partager de la liquidité.",
          explanation:
            "Incorrect. Les ensembles de quorum concernent la confiance du consensus, non le trading ni la liquidité. Cela confond l'accord sur le registre avec la mécanique de marché.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c33-q4",
      prompt: "Dans la vie d'une transaction sur Stellar, que signifie le fait que l'appel de soumission de l'application renvoie enfin le succès ?",
      options: [
        {
          text: "Horizon a reçu la transaction et est encore en train de décider s'il va la diffuser.",
          explanation:
            "Incorrect. La simple réception par Horizon n'est pas un règlement ; la transaction doit encore être propagée, faire l'objet d'un accord par consensus, et être appliquée.",
        },
        {
          text: "Un seul validateur a accepté la transaction, bien qu'elle puisse encore être annulée par une chaîne plus longue.",
          explanation:
            "Incorrect. Un seul validateur ne suffit pas, et Stellar n'a aucune annulation par plus longue chaîne comme la preuve de travail. La finalité vient d'un quorum qui externalise le registre.",
        },
        {
          text: "Un quorum a externalisé l'ensemble de transactions, le registre s'est clos (environ toutes les cinq secondes), les opérations ont été appliquées, et le résultat est définitif et irréversible.",
          explanation:
            "Correct. Le succès signifie que le registre contenant la transaction s'est clos : les phases de nomination et de scrutin du SCP ont convergé, Core a appliqué les opérations dans l'ordre canonique, un nouveau hash de registre a été enchaîné, et Horizon a ingéré le résultat. La finalité sur Stellar est immédiate à la clôture du registre.",
        },
        {
          text: "La transaction a été écrite dans la base de données locale du client et se synchronisera avec le réseau pendant la nuit.",
          explanation:
            "Incorrect. Il n'y a aucune synchronisation par lots nocturne ; la transaction est diffusée et réglée en un seul cycle de consensus d'environ cinq secondes.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q5",
      prompt: "Le trilemme de la scalabilité dit qu'une blockchain peine à maximiser à la fois les trois : décentralisation, sécurité et scalabilité. Où se situe Stellar ?",
      options: [
        {
          text: "Il maximise les trois simultanément, ayant entièrement résolu le trilemme.",
          explanation:
            "Incorrect. Aucune chaîne en production n'échappe au trilemme ; prétendre l'avoir entièrement résolu est un signal d'alarme. Chaque conception paie quelque part.",
        },
        {
          text: "Il optimise pour un débit rapide et bon marché et une décentralisation raisonnable, en acceptant que sa sécurité dépende d'ensembles de quorum honnêtes et bien chevauchés plutôt que d'énergie dépensée ou de mise en jeu.",
          explanation:
            "Correct. Stellar échange délibérément un ensemble de validateurs plus restreint et fondé sur l'identité contre une finalité de cinq secondes et des frais inférieurs au centime ; sa sécurité n'est aussi solide que sa topologie de confiance, ce qui est une optimisation axée sur les paiements, non une posture de décentralisation maximale.",
        },
        {
          text: "Il maximise la décentralisation avant tout, fonctionnant comme Bitcoin avec une preuve de travail lente et coûteuse.",
          explanation:
            "Incorrect. Stellar utilise le SCP, non la preuve de travail, et privilégie la vitesse et le faible coût plutôt que la minimisation de la confiance à la manière de Bitcoin.",
        },
        {
          text: "Il abandonne entièrement la sécurité pour être aussi rapide que possible.",
          explanation:
            "Incorrect. Stellar conserve une sécurité tolérante aux fautes byzantines grâce à l'intersection de quorum ; il déplace le fondement de cette sécurité, il ne l'écarte pas.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
