// PENDING — do not activate until green light.
// EXPERT chapter on regulation, compliance and crypto's future: MiCA for
// European traders, FSMA and platform licensing, GDPR for platforms holding
// personal data, CBDCs, and where crypto (and Stellar) is heading. This chapter
// owns no new glossary terms; it reuses concepts taught in earlier chapters.
// Same shape as content/en/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../../types";

export const chapter37: Chapter & { whoFor: string } = {
  id: "c37",
  number: 37,
  level: "EXPERT",
  whoFor: "Pour les traders et les développeurs qui s'intéressent à l'avenir réglementé de la crypto",
  title: "Réglementation, conformité et avenir de la crypto",
  description:
    "Comment MiCA, l'agrément FSMA et le GDPR façonnent la crypto européenne, en quoi les CBDC diffèrent de la monnaie décentralisée et des stablecoins, et vers où le marché se dirige, y compris le rôle de Stellar.",
  lessons: [
    {
      id: "c37-l1",
      title: "Qu'est-ce que MiCA et qu'est-ce que cela signifie concrètement pour les traders européens ?",
      paragraphs: [
        "MiCA, le règlement sur les marchés de crypto-actifs, est le corpus de règles unique de l'Union européenne pour les crypto-actifs qui ne sont pas déjà couverts par la législation financière existante. Il remplace la mosaïque des régimes nationaux par un cadre harmonisé unique dans tous les États membres, si bien qu'un émetteur ou un prestataire de services agréé dans un pays peut faire passeporter cet agrément dans l'ensemble du bloc. C'est un choix de conception délibéré : au lieu de vingt-sept corpus de règles divergents, il n'y en a plus qu'un.",
        "MiCA classe les tokens dans trois catégories, et la catégorie détermine les règles. Les jetons se référant à des actifs (ARTs) suivent un panier d'actifs ou de devises. Les jetons de monnaie électronique (EMTs) suivent une seule monnaie officielle au taux de un pour un, catégorie dans laquelle tombe la plupart des stablecoins adossés à une monnaie fiduciaire, qu'il s'agisse d'un stablecoin en euro ou en dollar. La catégorie résiduelle couvre les autres crypto-actifs, tels que les jetons utilitaires. Les émetteurs de stablecoins font face au traitement le plus strict : ils doivent détenir des réserves entièrement adossées, ségréguées et liquides, publier un livre blanc, et honorer le remboursement au pair sur demande. Le volume quotidien de transactions des grands stablecoins peut même être plafonné lorsqu'ils sont utilisés purement comme moyen de paiement.",
        "Le volet des services est régi par l'agrément CASP. Un prestataire de services sur crypto-actifs est toute entreprise qui propose la conservation, exploite une plateforme de négociation, échange des cryptos contre des monnaies fiduciaires ou d'autres cryptos, exécute ou place des ordres, ou fournit des conseils. Pour opérer légalement, un CASP doit être agréé par une autorité nationale compétente, puis il est soumis à des obligations continues : exigences de fonds propres, protection des actifs des clients, traitement clair des réclamations, divulgation des conflits d'intérêts, et règles contre les abus de marché qui interdisent les opérations d'initié et la manipulation. La protection du consommateur est un thème récurrent, avec des avertissements de risque obligatoires et un droit de rétractation peu après certains achats.",
        "Le déploiement s'est fait par étapes. Les règles sur les stablecoins (ART et EMT) s'appliquent depuis la mi-2024, et le régime CASP plus large depuis la fin 2024, avec des fenêtres transitoires de maintien des droits acquis que les régulateurs nationaux pouvaient raccourcir. Pour un trader, l'effet concret est que les plateformes d'échange et les conservateurs que vous utilisez devraient de plus en plus être agréés MiCA, que les stablecoins en euro non conformes peuvent être délistés pour les utilisateurs de l'UE, et que les informations que vous recevez deviennent plus standardisées. Rien de tout cela n'est un conseil en investissement ni un conseil juridique ; c'est du contexte pour que vous puissiez lire correctement les étiquettes et choisir des plateformes réglementées.",
      ],
      example:
        "Un stablecoin arrimé à l'euro et vendu à des utilisateurs de l'UE est, sous MiCA, un jeton de monnaie électronique. Son émetteur doit maintenir les réserves d'adossement entièrement ségréguées et remboursables au pair, publier un livre blanc, et détenir un agrément d'établissement de monnaie électronique ou d'établissement de crédit. S'il ne le peut pas, les plateformes de l'UE doivent le délister pour leurs clients européens. C'est pourquoi certains stablecoins ont discrètement disparu de certaines paires d'échange de l'UE en 2024, tandis qu'une alternative entièrement adossée et agréée est restée listée.",
    },
    {
      id: "c37-l2",
      title: "Qu'est-ce que la FSMA et quand faut-il un agrément pour exploiter une plateforme crypto ?",
      paragraphs: [
        "La FSMA, l'Autorité des services et marchés financiers, est le régulateur belge de la conduite financière. Aux côtés de la Banque nationale de Belgique, elle supervise les marchés, protège les consommateurs et encadre les communications promotionnelles financières. Sous MiCA, elle est l'une des autorités nationales compétentes qui agréent et surveillent les prestataires de services sur crypto-actifs établis en Belgique, et elle appliquait déjà un régime national d'enregistrement pour les prestataires d'échange et de portefeuilles de conservation au titre de la législation anti-blanchiment avant que MiCA ne prenne le relais.",
        "Le fait d'avoir besoin d'un agrément dépend de ce que votre plateforme fait réellement, et non de la manière dont vous l'appelez. Exploiter une plateforme à carnet d'ordres, détenir les clés ou les soldes des clients en conservation, convertir entre crypto et monnaie fiduciaire, ou exécuter et acheminer des ordres pour le compte des utilisateurs sont autant d'activités CASP réglementées. Dès l'instant où une plateforme touche à l'argent ou aux actifs d'autrui, ou apparie leurs trades, elle se trouve très probablement à l'intérieur du périmètre et a besoin d'un agrément, ainsi que de contrôles anti-blanchiment : vérifications d'identité de type connaissance du client, surveillance des transactions, et déclaration des activités suspectes. Commercialiser des produits crypto auprès du public déclenche également des règles de conduite exigeant une communication loyale, claire et non trompeuse.",
        "À l'inverse, les outils purement non dépositaires ou purement informationnels se situent plus près du bord du périmètre, même si la ligne est réellement floue et dépend des faits propres à chaque cas. Une application qui ne détient jamais les clés d'un utilisateur, n'apparie jamais d'ordres, et aide seulement une personne à signer ses propres transactions sur un réseau public fait quelque chose de différent d'une plateforme d'échange qui met en commun et conserve les fonds des clients. Les pages Academy d'un outil comme celui-ci, par exemple, relèvent de la pure éducation et ne nécessitent aucune connexion, ce qui est clairement en dehors de tout déclencheur d'agrément.",
        "Pour Atrium en particulier, l'architecture compte. Les portefeuilles sont propres à chaque utilisateur et chiffrés au repos en AES-256-GCM, et la couche de signature ne déchiffre une clé qu'au moment précis de la signature, si bien que la conception penche, par esprit, vers le non-dépositaire. Mais si une telle plateforme devait un jour s'ouvrir au public, accepter de véritables fonds de clients, ou apparier des trades entre utilisateurs, l'analyse changerait et un conseil juridique professionnel serait indispensable. Cette leçon relève de l'éducation générale, et non du conseil juridique ; la classification réglementaire est une question pour un juriste qualifié qui peut examiner les faits précis.",
      ],
      example:
        "Prenons deux applications. L'application A détient les clés privées de chaque client sur ses propres serveurs, met en commun les dépôts, et apparie les ordres d'achat et de vente dans son propre carnet d'ordres. C'est de la conservation associée à une plateforme de négociation, soit clairement un CASP qui a besoin d'un agrément de la FSMA et de contrôles anti-blanchiment complets. L'application B aide seulement un utilisateur à signer sa propre transaction Stellar avec une clé qui reste sous le contrôle de l'utilisateur et qui n'est déchiffrée que le temps nécessaire pour signer, sans rien apparier entre utilisateurs. L'application B est bien plus proche d'un outil non dépositaire, même si la classification exacte dépend encore des faits concrets et devrait être vérifiée avec un juriste.",
    },
    {
      id: "c37-l3",
      title: "Qu'est-ce que le GDPR et comment s'applique-t-il aux plateformes crypto qui stockent des données personnelles ?",
      paragraphs: [
        "Le GDPR, le règlement général de l'UE sur la protection des données, régit la manière dont les organisations collectent, utilisent et stockent les données personnelles relatives à des personnes identifiables. Une plateforme crypto entre pleinement dans son champ d'application dès l'instant où elle stocke une adresse e-mail, un identifiant de connexion, un journal d'adresses IP ou un nom, car tous ces éléments identifient une personne. Être sur une blockchain ne vous exonère pas : la couche de compte hors chaîne, où une plateforme relie une identité réelle à une activité, constitue de simples données personnelles soumises aux règles ordinaires.",
        "Le règlement repose sur quelques principes fondamentaux. Chaque utilisation de données personnelles nécessite une base légale, telle que l'exécution d'un contrat avec l'utilisateur, un intérêt légitime, une obligation légale comme la conservation de documents anti-blanchiment, ou un consentement librement donné. La minimisation des données impose de ne collecter que ce dont vous avez réellement besoin. La limitation des finalités impose de ne l'utiliser que pour la raison pour laquelle vous l'avez collectée. La limitation de la conservation impose de ne pas la garder indéfiniment. À cela s'ajoutent les droits des individus : accès à leurs données, rectification des erreurs, effacement dans des circonstances définies, portabilité et opposition. Les plateformes portent aussi des obligations, la plus tranchante étant celle de signaler une violation qualifiée de données personnelles au régulateur sans retard injustifié, généralement dans les soixante-douze heures.",
        "La crypto introduit une réelle tension, car un registre public est conçu pour être immuable et à ajout seulement, tandis que le GDPR accorde un droit à l'effacement et un droit à la rectification. Vous ne pouvez ni supprimer ni modifier une transaction confirmée sur la chaîne. La réponse d'ingénierie communément admise consiste à conserver les données personnelles hors chaîne et à ne mettre sur la chaîne que des références pseudonymes et non identifiantes. Une clé publique Stellar est un pseudonyme, pas un nom, donc elle n'est pas en soi directement identifiante, mais dès l'instant où votre base de données relie cette clé à un e-mail, elle devient, du côté du compte, une donnée personnelle que vous pouvez et devez gérer au titre du GDPR.",
        "Concrètement, cela façonne la manière dont une plateforme est construite. Stockez les e-mails, les empreintes de mots de passe et les enregistrements de compte dans une base de données hors chaîne que vous contrôlez entièrement, afin de pouvoir y honorer les demandes d'accès, de rectification et d'effacement. N'inscrivez jamais une identité brute sur le registre. Chiffrez les données sensibles au repos, minimisez ce que vous journalisez, et fixez des durées de conservation. Le modèle de compte d'Atrium correspond à cette forme, avec un portefeuille chiffré propre à chaque utilisateur et des données de compte conservées dans le propre stockage de la plateforme plutôt que sur la chaîne. Comme toujours, il s'agit d'éducation générale et non de conseil juridique, et un véritable programme de conformité devrait être revu par un professionnel de la protection des données.",
      ],
      example:
        "Un utilisateur demande à une plateforme de supprimer son compte. La plateforme peut effacer son e-mail, l'empreinte de son mot de passe et son profil de sa propre base de données hors chaîne et cesser de les traiter, satisfaisant ainsi la demande d'effacement pour les données d'identité qu'elle contrôle. Ce qu'elle ne peut pas faire, c'est réécrire les transactions Stellar passées de l'utilisateur, qui figurent de manière permanente sur le registre public. C'est précisément pour cela qu'une plateforme bien conçue conserve les données identifiantes hors chaîne et n'expose sur la chaîne qu'une clé publique pseudonyme, afin qu'une demande de suppression soit techniquement possible dès le départ.",
    },
    {
      id: "c37-l4",
      title: "Que sont les CBDC et quel est leur rapport avec la crypto ?",
      paragraphs: [
        "Une CBDC, une monnaie numérique de banque centrale, est de la monnaie numérique émise directement par une banque centrale. C'est une forme numérique de la monnaie souveraine, un engagement direct de l'État, au même titre que les espèces physiques, mais sous forme électronique. De nombreuses banques centrales les étudient ou les expérimentent, l'euro numérique étant l'exemple le plus pertinent pour les utilisateurs européens, aux côtés de projets en production ou avancés ailleurs. Les motivations affichées vont de la modernisation des paiements et de la préservation de la monnaie publique dans une économie sans espèces au maintien de la souveraineté monétaire à mesure que la monnaie numérique privée se développe.",
        "Il est important de voir en quoi une CBDC diffère de la crypto que la plupart des traders connaissent. Les crypto-actifs décentralisés comme le Bitcoin ou le XLM natif de Stellar fonctionnent sur des réseaux sans permission, sans émetteur central, et leur offre et leurs règles sont fixées par le protocole et le consensus plutôt que par un État. Une CBDC est l'opposé : centralisée, à permission, émise et contrôlée par la banque centrale, et son offre n'est généralement pas quelque chose que le marché découvre. La technologie peut sembler superficiellement similaire, et une CBDC pourrait même utiliser un registre distribué en interne, mais le modèle de confiance est inversé. L'une supprime une autorité centrale ; l'autre la numérise.",
        "Les CBDC diffèrent aussi des stablecoins, même si les deux visent une valeur stable. Un stablecoin adossé à une monnaie fiduciaire, comme un token réglementé de type USDC, est émis par une entreprise privée et adossé à des réserves détenues par l'émetteur ; sa stabilité dépend du fait que cet émetteur honore le remboursement et de la qualité des réserves. Une CBDC est la monnaie elle-même, une créance sur la banque centrale plutôt que sur une entreprise privée, si bien qu'elle ne porte pas de risque de crédit d'émetteur comme le fait un stablecoin privé. Sous MiCA, un stablecoin en euro privé est un jeton de monnaie électronique réglementé ; un euro numérique serait au contraire de la monnaie publique régie par son propre cadre juridique dédié.",
        "Pour un trader basé sur Stellar, l'image pratique est spéculative mais mérite d'être comprise. Stellar a été conçu comme un réseau de paiements et d'émission d'actifs, et en principe une CBDC ou un dépôt tokenisé pourrait être émis comme un actif sur un tel réseau, coexistant avec des stablecoins privés et des actifs décentralisés. Si cela se produit, vous pourriez un jour détenir un token de monnaie numérique publique et un stablecoin privé dans le même portefeuille, soumis à une ligne de confiance et à la réserve habituelle. C'est un contexte prospectif plutôt qu'une prédiction, et certainement pas un conseil financier.",
      ],
      example:
        "Pensez à trois euros sous trois formes. Un billet dans votre poche est de la monnaie publique, une créance directe sur la banque centrale. Un stablecoin libellé en euro est de la monnaie privée, une créance sur l'entreprise qui l'a émis et sur les réserves qui l'adossent. Un euro numérique CBDC serait le jumeau électronique du billet, toujours une créance directe sur la banque centrale mais utilisable numériquement. Les trois peuvent afficher un euro, mais qui vous doit cet euro, et donc quel risque vous portez, est complètement différent dans chaque cas.",
    },
    {
      id: "c37-l5",
      title: "Vers où se dirige la crypto ?",
      paragraphs: [
        "Deux forces dominent la vision d'avenir crédible : la tokenisation des actifs du monde réel et l'adoption institutionnelle. La tokenisation des actifs du monde réel consiste à représenter des actifs hors chaîne, tels que des obligations d'État, des fonds monétaires, de l'immobilier ou des factures, sous forme de tokens transférables sur une blockchain. L'attrait réside dans le règlement programmable, la propriété fractionnée et le transfert quasi instantané avec une piste d'audit claire, remplaçant des processus de back-office lents et cloisonnés. L'adoption institutionnelle est l'autre moitié : des fonds réglementés, des banques et des entreprises de paiement qui passent de l'expérimentation à la production, encouragés précisément par des cadres comme MiCA qui leur apportent une sécurité juridique. Ici, la réglementation et l'adoption se renforcent mutuellement plutôt que de s'opposer.",
        "Stellar est particulièrement bien positionné pour cette orientation précise, car il a été conçu sur mesure pour les paiements et l'émission d'actifs plutôt que comme un ordinateur mondial polyvalent. Émettre un actif sur Stellar est une opération de première classe et à faible coût ; les lignes de confiance donnent aux émetteurs et aux détenteurs un contrôle explicite par adhésion volontaire ; et les paiements par chemin règlent une conversion à travers les marchés de manière atomique, en sautant à travers le carnet d'ordres du SDEX et les pools AMM pour livrer l'actif de destination en une seule transaction. Les frais sont infimes, de l'ordre d'une fraction de centime, et le règlement se mesure en secondes sous le protocole de consensus Stellar, une implémentation de l'accord byzantin fédéré où les nœuds font confiance à des ensembles de quorum plutôt que de miner. Pour faire circuler un dollar ou une obligation tokenisés, ce sont exactement les propriétés qui comptent.",
        "L'élément plus récent est Soroban, la plateforme de contrats intelligents de Stellar, qui ajoute une logique programmable à cette base de paiements et d'actifs. Soroban rend possibles des protocoles on-chain pour le prêt, le rendement structuré et les swaps, et de vrais projets y construisent déjà : Blend pour les marchés de prêt, DeFindex pour les coffres de stratégies tokenisées, et Soroswap comme bourse et agrégateur on-chain. Combiné à des stablecoins natifs comme l'USDC et à la capacité de représenter les actifs du monde réel comme des actifs, cela oriente Stellar vers un rôle de plomberie de règlement où se rencontrent la valeur tokenisée réglementée et la composabilité de la DeFi, plutôt que celui d'un terrain de jeu purement spéculatif.",
        "Rien de tout cela n'est garanti, et une analyse honnête reste ancrée dans les faits. La tokenisation a déjà été survendue par le passé, les calendriers réglementaires glissent, et l'adoption peut caler. La lecture réaliste est directionnelle plutôt que certaine : davantage de rampes d'accès réglementées, davantage d'actifs traditionnels tokenisés, davantage de flux institutionnel, et des réseaux optimisés pour les paiements et l'émission, Stellar en bonne place parmi eux, en concurrence pour devenir les rails. Pour un trader, la leçon à retenir est de continuer à apprendre les mécanismes, d'utiliser des plateformes réglementées et bien comprises, et de traiter toute prévision unique, y compris celle-ci, comme un contexte plutôt que comme une promesse. Ceci est de l'éducation, pas un conseil financier.",
      ],
      example:
        "Imaginez un fonds de bons du Trésor à court terme tokenisé et émis comme un actif Stellar. Une institution le détient face à un solde en USDC dans le même portefeuille, chacun derrière sa propre ligne de confiance. Quand elle a besoin de liquidités, un paiement par chemin convertit atomiquement une tranche du fonds tokenisé en USDC en passant par le SDEX et les pools AMM, réglant en quelques secondes pour une fraction de centime, tandis qu'un contrat Soroban pourrait automatiquement balayer tout USDC inactif vers un marché de prêt Blend afin d'en tirer un rendement. Ce flux unique, actif tokenisé réglementé plus stablecoin plus règlement programmable, est la forme concrète de la direction que prend une grande partie de tout cela.",
    },
  ],
  quiz: [
    {
      id: "c37-q1",
      prompt: "Sous MiCA, comment un stablecoin en euro adossé à une monnaie fiduciaire et vendu à des utilisateurs de l'UE est-il généralement classé, et qu'est-ce que cela déclenche ?",
      options: [
        {
          text: "Comme un jeton de monnaie électronique (EMT), si bien que l'émetteur doit détenir des réserves entièrement adossées et ségréguées et honorer le remboursement au pair.",
          explanation:
            "Correct. Un token qui se réfère à une seule monnaie officielle au taux de un pour un tombe dans la catégorie EMT de MiCA, celle du traitement le plus strict : adossement intégral, réserves liquides ségréguées, un livre blanc, et remboursement au pair sur demande. Les stablecoins en euro non conformes peuvent être délistés pour les utilisateurs de l'UE.",
        },
        {
          text: "Comme un jeton utilitaire, si bien qu'il est exempté de toute exigence de réserve ou d'agrément.",
          explanation:
            "Faux. Les jetons utilitaires forment la catégorie résiduelle des « autres crypto-actifs ». Un stablecoin arrimé à une monnaie n'est précisément pas un jeton utilitaire, et il fait face aux obligations les plus exigeantes de MiCA sur les stablecoins, non à une exemption.",
        },
        {
          text: "Comme une valeur mobilière au titre des règles MiFID existantes, si bien que MiCA ne s'y applique pas du tout.",
          explanation:
            "Faux. MiCA régit les crypto-actifs qui ne sont pas déjà couverts par la législation financière existante ; un stablecoin se référant à une monnaie fiduciaire est traité au sein de MiCA comme un EMT, et non exclu comme une valeur mobilière MiFID.",
        },
        {
          text: "Comme un jeton se référant à des actifs (ART), parce que tout stablecoin suit un panier d'actifs.",
          explanation:
            "Faux. Les ARTs se réfèrent à un panier d'actifs ou de devises. Un stablecoin arrimé au taux de un pour un à une seule monnaie officielle est un EMT, pas un ART.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c37-q2",
      prompt: "Une plateforme belge détient les clés privées de chaque client, met en commun les dépôts, et apparie les ordres d'achat et de vente dans son propre carnet d'ordres. Quelle est la lecture réglementaire la plus juste ?",
      options: [
        {
          text: "Aucun agrément n'est nécessaire car la crypto n'est pas réglementée en Belgique.",
          explanation:
            "Faux. Les services crypto sont réglementés : la FSMA agrée et surveille les CASP sous MiCA, et les règles anti-blanchiment s'appliquaient déjà auparavant aux prestataires de conservation et d'échange.",
        },
        {
          text: "Elle fournit de la conservation et exploite une plateforme de négociation, si bien qu'elle est très probablement un CASP nécessitant un agrément de la FSMA ainsi que des contrôles anti-blanchiment.",
          explanation:
            "Correct. Détenir les clés des clients relève de la conservation et apparier les ordres des clients revient à exploiter une plateforme de négociation. Ce sont deux activités CASP réglementées, si bien que la plateforme a très probablement besoin d'un agrément de la FSMA ainsi que de contrôles de connaissance du client et de surveillance des transactions.",
        },
        {
          text: "Elle n'a besoin d'un agrément que si elle fournit aussi des conseils en investissement ; la conservation et l'appariement des ordres ne sont pas réglementés.",
          explanation:
            "Faux. La conservation et l'exploitation d'une plateforme de négociation sont chacune, indépendamment, des activités CASP réglementées. Le conseil est une activité réglementée de plus, pas le seul déclencheur.",
        },
        {
          text: "Elle est automatiquement en dehors du périmètre parce que tout se règle sur une blockchain publique.",
          explanation:
            "Faux. Ce qui compte, c'est ce que fait la plateforme, pas l'endroit où a lieu le règlement. Mettre en commun les dépôts, détenir les clés et apparier les ordres la placent clairement à l'intérieur du périmètre d'agrément, quel que soit le registre sous-jacent.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q3",
      prompt: "Comment une plateforme crypto conforme au GDPR devrait-elle concilier le droit à l'effacement avec un registre public immuable ?",
      options: [
        {
          text: "En réécrivant ou en supprimant les transactions on-chain passées de l'utilisateur lorsque l'effacement est demandé.",
          explanation:
            "Faux. Les transactions on-chain confirmées sont immuables et ne peuvent être ni supprimées ni réécrites ; c'est là toute la conception d'un registre public. La solution doit vivre hors chaîne.",
        },
        {
          text: "En ignorant complètement le GDPR, puisque les blockchains sont exemptées du droit de la protection des données.",
          explanation:
            "Faux. Il n'existe aucune exemption pour les blockchains. La couche de compte hors chaîne qui relie une identité à une activité, comme un e-mail lié à une clé publique, constitue de simples données personnelles soumises aux règles ordinaires.",
        },
        {
          text: "En conservant les données identifiantes hors chaîne dans une base de données contrôlée et en ne mettant sur la chaîne que des références pseudonymes, de sorte que l'effacement puisse être honoré hors chaîne.",
          explanation:
            "Correct. Une clé publique est un pseudonyme, pas un nom. Conserver les e-mails, les empreintes et les profils hors chaîne permet à la plateforme de supprimer ou de rectifier les données d'identité qu'elle contrôle, tandis que le registre ne contient que des références non identifiantes qui n'ont jamais été, dès le départ, une identité brute.",
        },
        {
          text: "En chiffrant l'ensemble de la blockchain, de sorte que les données puissent être considérées comme supprimées une fois la clé jetée.",
          explanation:
            "Faux. Vous ne pouvez pas chiffrer un registre public et partagé que vous ne contrôlez pas, et « broyer par la cryptographie » une chaîne à l'échelle du réseau n'est pas ainsi que cela fonctionne. La réponse admise est de conserver les données personnelles hors chaîne dès le départ.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c37-q4",
      prompt: "Quelle est la différence fondamentale entre une CBDC et un stablecoin privé adossé à une monnaie fiduciaire ?",
      options: [
        {
          text: "Il n'y a aucune différence ; les deux ne sont que des euros ou des dollars numériques.",
          explanation:
            "Faux. Ils peuvent tous deux viser une valeur stable, mais qui vous doit l'argent diffère complètement, et cette différence est tout l'enjeu.",
        },
        {
          text: "Une CBDC est une créance directe sur la banque centrale (monnaie publique), tandis qu'un stablecoin est une créance sur un émetteur privé et ses réserves.",
          explanation:
            "Correct. Une CBDC est de la monnaie souveraine émise par la banque centrale, ne portant aucun risque de crédit d'émetteur privé. Un stablecoin est émis par une entreprise et dépend du fait que cet émetteur honore le remboursement et détienne de bonnes réserves ; sous MiCA, c'est un jeton de monnaie électronique réglementé, alors qu'un euro numérique serait de la monnaie publique régie par son propre cadre.",
        },
        {
          text: "Une CBDC est décentralisée et sans permission, tandis qu'un stablecoin est émis de manière centralisée.",
          explanation:
            "Faux, et inversé. Une CBDC est centralisée et à permission, émise et contrôlée par la banque centrale. Ce sont les actifs décentralisés comme le Bitcoin ou le XLM qui sont sans permission, pas la CBDC.",
        },
        {
          text: "Un stablecoin ne peut jamais être réglementé, tandis qu'une CBDC est toujours réglementée.",
          explanation:
            "Faux. Les stablecoins adossés à une monnaie fiduciaire sont réglementés sous MiCA comme des jetons de monnaie électronique. La véritable distinction porte sur l'émetteur et la nature de la créance, non sur l'existence ou non d'une réglementation.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q5",
      prompt: "Pourquoi Stellar est-il souvent cité comme bien positionné pour la tokenisation des actifs du monde réel et les paiements ?",
      options: [
        {
          text: "Parce qu'il a été conçu sur mesure pour les paiements et l'émission d'actifs, avec une émission d'actifs de première classe et bon marché, des lignes de confiance, des paiements par chemin atomiques, et un règlement rapide sous le SCP.",
          explanation:
            "Correct. Stellar émet des actifs comme une opération de première classe et à faible coût, utilise les lignes de confiance pour un contrôle explicite par adhésion volontaire, règle les conversions de manière atomique via les paiements par chemin à travers le SDEX et les pools AMM, et finalise en quelques secondes sous le protocole de consensus Stellar. Soroban ajoute ensuite une logique programmable. Ce sont exactement les propriétés dont la valeur tokenisée a besoin.",
        },
        {
          text: "Parce que Stellar mine de nouveaux blocs plus vite que toute autre chaîne à preuve de travail, ce qui lui confère la plus haute sécurité.",
          explanation:
            "Faux. Stellar ne mine pas du tout. Il utilise le protocole de consensus Stellar, un accord byzantin fédéré où les nœuds font confiance à des ensembles de quorum, et non à une preuve de travail.",
        },
        {
          text: "Parce que Stellar n'a ni frais ni réserves, si bien que les actifs tokenisés sont totalement gratuits à détenir et à faire circuler.",
          explanation:
            "Faux. Les frais sont infimes, de l'ordre d'une fraction de centime, mais non nuls, et chaque compte conserve une petite réserve minimale de XLM, avec environ un demi-XLM de plus par ligne de confiance. « Bon marché » est exact ; « gratuit » ne l'est pas.",
        },
        {
          text: "Parce que Soroban permet à Stellar d'exécuter n'importe quelle application polyvalente, rendant les paiements et l'émission sans intérêt.",
          explanation:
            "Faux. Soroban ajoute des contrats intelligents par-dessus la base de paiements et d'émission de Stellar, et de vrais projets comme Blend, DeFindex et Soroswap y construisent, mais il complète les rails d'actifs plutôt que de les rendre sans intérêt. L'orientation vers les paiements est précisément la force.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
