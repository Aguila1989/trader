// PENDING — do not activate until green light.
import type { Chapter } from "../../../types";

export const chapter23: Chapter & { whoFor: string } = {
  id: "c23",
  number: 23,
  level: "BASIC",
  whoFor: "Pour les traders qui veulent rester sereins à travers les hauts et les bas",
  title: "Les cycles de marché",
  description:
    "Marchés haussiers et baissiers, saisons des altcoins, corrections contre krachs, pourquoi les coins ont tendance à bouger ensemble, et comment se comporter quand le marché retourne à la baisse.",
  lessons: [
    {
      id: "c23-l1",
      title: "Qu'est-ce qu'un marché haussier et un marché baissier ?",
      paragraphs: [
        "Les marchés évoluent par longues phases, pas en ligne droite. Un marché haussier est une période prolongée durant laquelle les prix montent globalement et où la plupart des gens se sentent optimistes. Un marché baissier, c'est l'inverse : une période prolongée durant laquelle les prix baissent globalement et où la prudence prend le dessus. Ni l'un ni l'autre ne dure éternellement, et l'un finit toujours par céder la place à l'autre.",
        "Les noms viennent de la façon dont chaque animal attaque. Le taureau projette ses cornes vers le haut, et l'ours abat sa patte vers le bas, ce qui est un moyen commode de se rappeler qui est qui. Dans un marché haussier, l'ambiance est confiante et les acheteurs sont avides ; dans un marché baissier, l'ambiance est craintive et les vendeurs dominent.",
        "La chose la plus importante à comprendre pour un débutant, c'est que les deux sont tout à fait normaux. Les prix ne font pas que monter, et ils ne font pas que baisser. S'attendre à l'avance à ces deux types de temps vous évite d'être pris au dépourvu quand la saison change.",
      ],
      example:
        "Voyez l'année comme rythmée par les saisons. Le printemps est un marché haussier : tout pousse, tout est vert, et on a l'impression que cela va durer. L'hiver est un marché baissier : la croissance s'arrête, les jours sont gris, et on peut avoir l'impression que le froid ne finira jamais. Mais le printemps revient toujours et l'hiver revient toujours. Les deux sont normaux, et les deux passent. Un trader qui panique en hiver a simplement oublié que les saisons tournent.",
    },
    {
      id: "c23-l2",
      title: "Qu'est-ce qu'une saison des altcoins ?",
      paragraphs: [
        "En crypto, ce sont d'ordinaire les coins les plus importants et les plus connus qui montrent la voie. Quand ces géants ont déjà beaucoup grimpé, l'attention se reporte souvent sur des coins plus petits, parfois appelés coins « alt », abréviation d'alternatives. Une période durant laquelle ces coins plus petits montent particulièrement vite, dépassant les plus gros, s'appelle une saison des altcoins.",
        "Pendant une saison des altcoins, l'excitation peut être intense, parce que les petits coins peuvent bouger d'un très gros pourcentage en peu de temps. Cela fonctionne toutefois dans les deux sens. Les mêmes coins qui grimpent en flèche peuvent aussi chuter tout aussi vite quand l'ambiance se refroidit, si bien que les gains rapides s'accompagnent d'un risque rapide.",
        "Pour un trader serein, la leçon est de ne pas courir après chaque coin qui bouge vite. Les mouvements rapides sont grisants, mais un coin capable de doubler en une semaine peut aussi être divisé par deux en une semaine. Comprendre ce qu'est une saison des altcoins vous aide à voir l'excitation pour ce qu'elle est, plutôt que de vous laisser emporter par elle.",
      ],
      example:
        "Imaginez un grand défilé où les immenses chars passent en premier et attirent les plus grandes foules. Une fois qu'ils sont passés, les artistes plus modestes derrière eux ont leur moment de gloire, et pendant un temps la foule les acclame le plus fort. Une saison des altcoins, c'est ce passage du défilé : les petits numéros éclipsent soudain les géants, le temps d'un bref élan plein d'énergie, avant que le défilé ne reprenne sa route.",
    },
    {
      id: "c23-l3",
      title: "Qu'est-ce qu'une correction de marché par rapport à un krach ?",
      paragraphs: [
        "Toute baisse n'est pas un désastre. Une correction de marché est un repli modéré et normal, souvent d'environ dix pour cent, qui interrompt une tendance haussière sans y mettre fin. Les corrections sont saines : elles laissent un prix surexcité se calmer et reprendre son souffle, et elles surviennent régulièrement, même dans un marché haussier vigoureux.",
        "Un krach de marché est une tout autre bête. C'est une chute soudaine et sévère, bien plus brutale et profonde qu'une correction normale, et elle s'accompagne généralement d'une véritable peur. Là où une correction est une pause, un krach peut donner l'impression que le sol se dérobe, les prix chutant vite en quelques heures ou quelques jours.",
        "Savoir distinguer les deux compte, parce qu'ils appellent des réactions différentes. Paniquer devant une correction de routine peut vous faire vendre une bonne position sans raison, tandis que traiter un véritable krach comme « une simple baisse » peut vous faire ignorer un danger réel. Ni l'un ni l'autre ne devrait être abordé par pure émotion.",
      ],
      example:
        "Imaginez une randonnée en descente sur une colline. Une correction de marché est une petite marche raide vers le bas sur un chemin par ailleurs ascendant : une légère secousse, mais dans l'ensemble vous continuez à grimper. Un krach de marché ressemble davantage au sentier qui se dérobe soudain sous vos pieds. Les deux impliquent d'aller vers le bas, mais l'un est un accident de parcours normal et l'autre une chute à laquelle il faut se préparer.",
    },
    {
      id: "c23-l4",
      title: "Pourquoi tout le marché bouge-t-il parfois ensemble ?",
      paragraphs: [
        "Certains jours, on a l'impression que presque tous les coins sont verts, et d'autres jours presque tous les coins sont rouges, tous en même temps. C'est parce que les prix ne sont pas seulement mus par l'histoire propre de chaque coin, mais par une humeur partagée à travers tout le marché. Quand la peur ou l'avidité déferle, elle touche presque tout au même moment.",
        "Les plus gros coins agissent comme une ancre pour le reste. Comme tant d'argent et d'attention se concentrent dans les coins les plus importants, lorsqu'ils bougent brusquement ils tendent à entraîner les plus petits dans la même direction. Une vague de confiance soulève tout le champ, et une vague de peur le tire tout entier vers le bas.",
        "Savoir cela vous évite de mal interpréter une journée rouge. Si votre coin baisse alors que tout le reste baisse aussi, cela signifie généralement que tout le marché est nerveux, et non qu'il y a un problème spécifique avec votre coin. Séparer l'humeur générale du marché des nouvelles propres à un coin est une habitude apaisante et utile.",
      ],
      example:
        "Pensez aux bateaux dans un port quand la marée monte ou descend. Peu importe qu'un bateau soit grand ou petit, ancien ou neuf ; quand la marée monte, ils montent tous ensemble, et quand elle descend, ils s'abaissent tous ensemble. Le sentiment du marché, c'est cette marée. Lors d'une forte journée de peur, la marée se retire et presque chaque coin baisse avec elle, indépendamment de ses propres mérites.",
    },
    {
      id: "c23-l5",
      title: "Comment se comporter dans un marché baissier ?",
      paragraphs: [
        "La plus grande erreur dans une phase de baisse, c'est la vente panique : liquider une position uniquement parce que la chute du prix devient insupportable. Ce réflexe tend à cristalliser une perte au pire moment possible. La voie plus posée consiste à ralentir, à s'en tenir au plan que vous avez établi à froid, et à éviter de prendre de toutes nouvelles décisions dans le feu de la peur.",
        "Se réfugier dans une sécurité proche des liquidités est aussi un choix parfaitement valable, pas un échec. Détenir des stablecoins comme l'USDC pendant un marché baissier vous permet de prendre du recul par rapport aux fluctuations sans quitter l'écosystème, et vous pouvez y revenir plus tard quand vous vous sentez prêt. Choisir de ne rien faire pendant un temps est en soi une décision.",
        "Une phase de baisse est aussi un cadeau de temps. Avec moins de pression pour agir, vous pouvez vous concentrer sur l'apprentissage : étudier la manière dont les coins sont notés, lire le Journal IA, et vous familiariser avec les outils. Dans cette application, un stop loss peut définir votre sortie à l'avance, de sorte qu'un seul trade ne puisse pas dégénérer, ce qui s'accorde bien avec l'état d'esprit serein et centré sur le plan abordé dans les chapitres précédents. Il s'agit d'éducation, pas de conseil financier, et vous seul pouvez décider de ce qui convient à votre situation.",
      ],
      example:
        "Imaginez un petit bateau pris dans une tempête. Le marin qui panique jette la cargaison par-dessus bord et abandonne le navire de frayeur. Le marin serein abaisse les voiles, tient un cap régulier, et attend que le mauvais temps passe. Dans un marché baissier, déplacer une partie de ses fonds vers des stablecoins revient à abaisser les voiles, et refuser de vendre sous la panique revient à rester à bord jusqu'au retour d'une eau plus calme.",
    },
  ],
  quiz: [
    {
      id: "c23-q1",
      prompt: "Comment devriez-vous envisager un marché haussier et un marché baissier ?",
      options: [
        {
          text: "Un marché haussier est normal, mais un marché baissier est le signe que le marché est cassé et perdu pour de bon.",
          explanation:
            "Faux. Les deux sont des phases normales. Comme le printemps et l'hiver, un marché baissier est tout aussi naturel qu'un marché haussier, et il finit toujours par passer.",
        },
        {
          text: "Les deux sont des phases normales et récurrentes : les prix montent un temps, puis baissent un temps, et chacune finit par céder la place à l'autre.",
          explanation:
            "Correct. Les marchés évoluent par cycles. S'attendre aux saisons de hausse comme de baisse vous évite d'être pris au dépourvu quand l'humeur change.",
        },
        {
          text: "Vous pouvez tranquillement ignorer la différence, car les prix ne font que monter avec le temps.",
          explanation:
            "Non. Les prix ne font pas que monter. Ignorer les phases de baisse est justement ce qui laisse les traders démunis quand un marché baissier arrive.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q2",
      prompt: "Pendant une saison des altcoins, les coins plus petits montent très vite. Quelle est la façon sereine de voir cela ?",
      options: [
        {
          text: "Les altcoins qui montent vite sont de l'argent garanti, alors vous devriez en acheter autant que possible.",
          explanation:
            "Non. Un coin capable de doubler rapidement peut aussi être divisé par deux rapidement. Il n'y a aucune garantie, et courir après chaque coin qui bouge vite est la façon dont les gens se font piéger.",
        },
        {
          text: "L'excitation est réelle, mais les mêmes coins qui grimpent en flèche peuvent chuter tout aussi vite, si bien que les gains rapides s'accompagnent d'un risque rapide.",
          explanation:
            "Correct. Une saison des altcoins est grisante mais à double tranchant. La reconnaître pour ce qu'elle est vous aide à éviter de vous laisser emporter par l'engouement.",
        },
        {
          text: "Une saison des altcoins signifie que les plus gros coins ont définitivement cessé de compter.",
          explanation:
            "Faux. Les coins les plus importants continuent de mener le marché ; une saison des altcoins n'est qu'une phase où les coins plus petits les dépassent temporairement.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q3",
      prompt: "Quelle est la différence entre une correction de marché et un krach de marché ?",
      options: [
        {
          text: "Un krach de marché est un petit repli sain, tandis qu'une correction de marché est un effondrement total.",
          explanation:
            "C'est l'inverse. Une correction est le petit repli normal ; un krach est la chute soudaine et sévère.",
        },
        {
          text: "Ce sont exactement la même chose sous deux noms différents.",
          explanation:
            "Non. Ils diffèrent par l'ampleur et la vitesse, c'est pourquoi ils appellent des réactions différentes.",
        },
        {
          text: "Une correction est un repli modéré et normal (souvent d'environ dix pour cent) qui interrompt une hausse, tandis qu'un krach est une chute soudaine, bien plus brutale et profonde.",
          explanation:
            "Correct. Une correction est une pause qui laisse les prix se calmer ; un krach donne l'impression que le sol se dérobe et signale un danger réel.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c23-q4",
      prompt: "Votre coin baisse, mais presque tous les autres coins baissent en même temps. Qu'est-ce que cela signifie généralement ?",
      options: [
        {
          text: "Tout le marché est d'humeur craintive, et le sentiment général du marché tire la plupart des coins vers le bas ensemble.",
          explanation:
            "Correct. Comme une marée qui abaisse chaque bateau, une vague de peur tire tout le champ vers le bas d'un coup. Ce n'est généralement pas quelque chose de propre à votre coin.",
        },
        {
          text: "Il y a un problème spécifique et unique avec votre coin.",
          explanation:
            "Probablement pas. Quand tout baisse ensemble, cela indique une humeur de marché partagée plutôt qu'un problème avec votre seul coin.",
        },
        {
          text: "C'est une coïncidence, et le fait que des coins bougent ensemble au même moment ne signifie rien.",
          explanation:
            "Non. Le fait que les coins bougent ensemble est un vrai schéma, dû à un sentiment partagé et au fait que les plus gros coins entraînent le reste.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
