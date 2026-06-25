import type { Chapter } from "../../types";

export const chapter01: Chapter = {
  id: "c1",
  number: 1,
  level: "BASIC",
  title: "Qu'est-ce que le trading de cryptomonnaies ?",
  description:
    "Partez de zéro : les coins, les blockchains, le réseau Stellar, les portefeuilles, et en quoi les tokens diffèrent des coins.",
  lessons: [
    {
      id: "c1-l1",
      title: "Qu'est-ce qu'une cryptomonnaie ?",
      paragraphs: [
        "Une cryptomonnaie est de l'argent numérique qui vit sur un réseau informatique partagé plutôt qu'à l'intérieur d'une seule banque. Aucune entreprise ne la possède à elle seule. Le réseau est animé par de nombreux ordinateurs partout dans le monde, qui s'accordent tous sur qui détient quoi, si bien que le registre ne peut pas être modifié discrètement par une seule partie.",
        "Comme elle est numérique, vous pouvez l'envoyer directement à une autre personne où qu'elle se trouve, souvent en quelques secondes, sans demander l'autorisation d'une banque. La contrepartie, c'est que vous êtes responsable de vos propres fonds. Aucun service d'assistance ne peut annuler une erreur, alors la prudence est de mise.",
        "Les prix bougent parce que les gens achètent et vendent, exactement comme pour les actions ou les devises. Ce tableau de bord vous permet de suivre ces prix et de passer vous-même des ordres d'achat et de vente dans l'onglet Trading manuel, ou de laisser une IA vous suggérer des trades dans l'onglet Trading par bot.",
      ],
      example:
        "Imaginez que vous déteniez 100 XLM, la cryptomonnaie du réseau Stellar. Si chaque XLM vaut environ 0,11 USDC, vos 100 XLM valent à peu près 11 USDC. Si le prix grimpe à 0,13 USDC, ces mêmes 100 XLM valent désormais 13 USDC, alors même que le nombre de XLM que vous détenez n'a pas changé.",
    },
    {
      id: "c1-l2",
      title: "Qu'est-ce qu'une blockchain et pourquoi est-ce important ?",
      paragraphs: [
        "Une blockchain est le registre partagé sur lequel fonctionne une cryptomonnaie. Les transactions sont regroupées en blocs, et chaque nouveau bloc est relié au précédent, formant ainsi une chaîne. De nombreux ordinateurs en conservent une copie complète, ce qui leur permet de se contrôler mutuellement et de s'accorder sur la vérité.",
        "C'est important car cela supprime la nécessité de faire confiance à une seule entreprise pour tenir le registre. Une fois qu'une transaction est confirmée et ajoutée à la chaîne, il devient extrêmement difficile de la modifier ou de l'effacer. L'historique est permanent et public, de sorte que n'importe qui peut vérifier que les comptes sont justes.",
        "Pour un trader, cela signifie qu'une transaction terminée est définitive. Lorsque le bot ou vous-même passez un ordre et qu'il est exécuté sur le Stellar Decentralized Exchange, ce résultat est inscrit sur la blockchain et ne peut pas être annulé. C'est justement à cause de ce caractère permanent qu'il est si important de tout revérifier avant de confirmer.",
      ],
      example:
        "Supposons que vous envoyiez 50 XLM à un ami. Le réseau regroupe votre transfert avec d'autres dans un bloc, les ordinateurs le confirment en quelques secondes, et le bloc est ajouté à la chaîne. À partir de là, le registre indique que 50 XLM ont quitté votre compte, et personne, pas même vous, ne peut réécrire cette entrée.",
    },
    {
      id: "c1-l3",
      title: "Qu'est-ce que le réseau Stellar et le XLM ?",
      paragraphs: [
        "Stellar est la blockchain précise sur laquelle ce bot trade. Elle a été conçue pour faire circuler l'argent rapidement et à faible coût, ce qui la rend bien adaptée à de nombreux petits trades. Stellar dispose même d'une bourse intégrée, le Stellar Decentralized Exchange, ou SDEX, où acheteurs et vendeurs se rencontrent directement.",
        "Le XLM, aussi appelé Lumens, est l'actif natif de Stellar. Il joue deux rôles. C'est un actif que vous pouvez trader, et c'est aussi le carburant qui paie les minuscules frais de réseau sur chaque transaction. Ces frais représentent une fraction de centime de dollar américain, alors trader souvent ne coûte pas cher.",
        "Chaque compte Stellar doit également conserver en réserve un petit montant minimum de XLM que vous ne pouvez pas dépenser. Cela maintient le réseau en bonne santé. L'aperçu du portefeuille de ce tableau de bord affiche vos avoirs valorisés à la fois en XLM et en USDC, pour que vous puissiez voir votre valeur d'un coup d'œil.",
      ],
      example:
        "Vous passez un ordre de vente sur le SDEX pour échanger 20 XLM contre des USDC. Le réseau prélève des frais d'environ 0,00001 XLM, soit bien moins qu'un centime. Si vous déteniez exactement 21 XLM, vous ne pourriez pas tout vendre, car une réserve minimale d'environ 1 XLM doit rester sur le compte pour le garder actif.",
    },
    {
      id: "c1-l4",
      title: "Qu'est-ce qu'un portefeuille et comment le protéger ?",
      paragraphs: [
        "Un portefeuille est votre compte sur le réseau. Il possède deux clés. La clé publique commence par la lettre G et fonctionne comme votre numéro de compte : on peut la partager sans risque pour que les gens vous envoient des fonds. La clé secrète commence par la lettre S et fonctionne comme le mot de passe et la signature qui autorisent chaque mouvement.",
        "La règle d'or est simple. Quiconque détient la clé secrète contrôle les fonds. Il n'y a aucune banque à appeler si elle fuite. Toute personne qui copie votre clé S peut vider votre portefeuille instantanément, et la blockchain considérera ses transactions comme parfaitement valides, car elles ont été correctement signées.",
        "Alors ne collez jamais votre clé secrète sur un site web auquel vous ne faites pas confiance, ne la partagez jamais par messagerie ou par e-mail, et conservez une sauvegarde privée hors ligne. Traitez la clé G comme publique et la clé S comme un secret bien gardé. Ce tableau de bord signe les transactions à votre place, mais la sécurité de cette clé reste toujours votre responsabilité.",
      ],
      example:
        "Votre clé publique pourrait ressembler à GA5ZSEJ suivi d'autres lettres, et vous pouvez la publier sans risque pour qu'un ami vous envoie 10 XLM. Votre clé secrète ressemble à SDX4K suivi d'autres caractères. Si quelqu'un fait une capture d'écran de cette clé S, il peut signer une transaction qui déplace ailleurs la totalité de vos XLM et de vos USDC, et personne ne peut l'annuler.",
    },
    {
      id: "c1-l5",
      title: "Qu'est-ce qu'un token et en quoi diffère-t-il d'un coin ?",
      paragraphs: [
        "Les gens disent souvent coin et token comme s'ils voulaient dire la même chose, mais il existe une distinction utile. Un coin est l'actif natif de sa propre blockchain. Le XLM est un coin parce qu'il est intégré à Stellar lui-même et qu'il paie les frais de réseau.",
        "Un token est un actif émis par quelqu'un par-dessus une blockchain existante. Il circule sur les rails de Stellar au lieu d'avoir les siens propres. L'USDC, émis par une entreprise appelée Circle, est un token qui vise à toujours valoir un dollar américain. Il utilise Stellar pour circuler, mais ce n'est pas le coin natif de Stellar.",
        "Sur Stellar, avant de pouvoir détenir ou trader un token non natif comme l'USDC, vous devez d'abord ajouter une ligne de confiance vers son émetteur. Une ligne de confiance, c'est votre compte qui déclare accepter de détenir ce token précis. Le coin natif XLM n'a jamais besoin de ligne de confiance, car il fait partie intégrante du réseau lui-même.",
      ],
      example:
        "Pour échanger des XLM contre des USDC sur ce tableau de bord, vous ouvrez d'abord une ligne de confiance vers Circle, l'émetteur de l'USDC. Sans elle, le carnet d'ordres ne vous laissera pas recevoir d'USDC. Une fois la ligne de confiance établie, vous pouvez convertir, par exemple, 100 XLM en environ 11 USDC, en détenant le token USDC tout en utilisant le coin XLM pour les frais.",
    },
  ],
  quiz: [
    {
      id: "c1-q1",
      prompt:
        "Sur le réseau Stellar, quelle est la différence entre le XLM et l'USDC ?",
      options: [
        {
          text: "Le XLM est le coin natif de Stellar, tandis que l'USDC est un token émis par-dessus Stellar par Circle.",
          explanation:
            "Correct. Un coin est natif de sa blockchain et le XLM est intégré à Stellar, alors que l'USDC est un token émis par Circle qui circule sur les rails de Stellar.",
        },
        {
          text: "Ce sont tous les deux des coins natifs de deux blockchains distinctes.",
          explanation:
            "Pas tout à fait. Seul le XLM est natif de Stellar. L'USDC est un token émis par-dessus Stellar, et non le coin d'une blockchain distincte.",
        },
        {
          text: "L'USDC est le coin natif et le XLM est un token émis par Circle.",
          explanation:
            "C'est l'inverse de la réalité. Le XLM est le coin natif qui paie les frais de réseau, et l'USDC est le token émis par Circle.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c1-q2",
      prompt:
        "Quelqu'un vous envoie un message demandant votre clé secrète, celle qui commence par S, pour vous aider à réparer votre compte. Que devez-vous faire ?",
      options: [
        {
          text: "La partager, puisque le personnel d'assistance en a besoin pour vous aider.",
          explanation:
            "Non. Aucun service d'assistance n'a besoin de votre clé secrète, et la partager permet à n'importe qui de vider votre portefeuille.",
        },
        {
          text: "Ne partager que les premiers caractères pour prouver que vous êtes bien le propriétaire du compte.",
          explanation:
            "Toujours dangereux. Même une fuite partielle est risquée, et un véritable service n'a jamais besoin de la moindre partie de votre clé secrète.",
        },
        {
          text: "Refuser et la garder privée, car quiconque détient la clé S contrôle les fonds.",
          explanation:
            "Correct. La clé secrète autorise chaque transaction. Toute personne qui l'obtient peut déplacer vos fonds, et la blockchain ne peut pas l'annuler.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c1-q3",
      prompt: "Qu'est-ce qui décrit le mieux une blockchain ?",
      options: [
        {
          text: "Une base de données privée qu'une seule entreprise peut modifier quand bon lui semble.",
          explanation:
            "Incorrect. Tout l'intérêt d'une blockchain est qu'aucune partie unique ne contrôle ni ne modifie discrètement le registre.",
        },
        {
          text: "Un registre partagé des transactions tenu par de nombreux ordinateurs, où les entrées confirmées sont permanentes.",
          explanation:
            "Correct. De nombreux ordinateurs en conservent des copies et s'accordent sur la vérité, et une fois qu'un bloc est ajouté, il est extrêmement difficile à modifier, ce qui explique pourquoi les trades exécutés sont définitifs.",
        },
        {
          text: "Un type de cryptomonnaie que vous pouvez acheter et vendre.",
          explanation:
            "Pas tout à fait. Une cryptomonnaie fonctionne sur une blockchain, mais la blockchain elle-même est le registre partagé, pas l'argent.",
        },
        {
          text: "Un compte bancaire qui annule automatiquement les paiements erronés.",
          explanation:
            "Non. Il n'existe aucune autorité centrale pour annuler les paiements. Les transactions confirmées sur la blockchain sont permanentes.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c1-q4",
      prompt:
        "Pourquoi chaque compte Stellar doit-il conserver une petite quantité de XLM, et à quoi sert le XLM ?",
      options: [
        {
          text: "Le XLM n'est utile que comme token de secours et n'est jamais dépensé.",
          explanation:
            "Incorrect. Le XLM est activement tradé et paie aussi les frais de réseau sur chaque transaction ; ce n'est pas qu'une simple réserve de secours.",
        },
        {
          text: "Le XLM paie les minuscules frais de réseau et une réserve minimale doit rester sur le compte pour le garder actif.",
          explanation:
            "Correct. Le XLM est le coin natif de Stellar utilisé pour des frais d'une fraction de centime, et une petite réserve doit rester en place pour que le compte demeure ouvert.",
        },
        {
          text: "La réserve est une commission versée à Circle pour l'émission de l'USDC.",
          explanation:
            "Non. Circle émet l'USDC, mais la réserve de XLM est une règle du réseau pour garder le compte actif, et non un paiement à Circle.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
