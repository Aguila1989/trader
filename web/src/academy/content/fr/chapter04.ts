import type { Chapter } from "../../types";

export const chapter04: Chapter = {
  id: "c4",
  number: 4,
  level: "BASIC",
  title: "Les bases du risque",
  description: "Ce que signifient le risque, la volatilite et la perte, et les habitudes simples qui les maintiennent faibles.",
  lessons: [
    {
      id: "c4-l1",
      title: "Qu'est-ce que le risque en trading ?",
      paragraphs: [
        "Le risque, c'est tout simplement la probabilite qu'un trade perde de l'argent au lieu d'en gagner. Chaque trade a deux issues possibles : le prix evolue dans votre sens, ou il evolue contre vous. Personne ne peut savoir a l'avance laquelle se produit, donc le risque est toujours present. Le but n'est jamais de supprimer completement le risque, seulement de le garder assez faible pour qu'un mauvais trade ne puisse pas vous faire de degats serieux.",
        "Ce bot est concu autour de cette idee. Il impose un montant maximum par trade, un nombre maximum de trades par jour et une exposition ouverte totale maximale. Ces limites posent un plafond sur ce qui peut mal tourner d'un seul coup, meme si plusieurs trades se passent mal.",
        "Une bonne facon de penser au risque, c'est : quel est le maximum que je pourrais perdre ici, et est-ce que je peux vivre avec ce montant ? Si la reponse honnete vous met mal a l'aise, la position est trop grosse. Reduire la taille est le moyen le plus simple de reduire le risque.",
      ],
      example: "Vous detenez 1000 XLM qui valent environ 100 USDC. Vous fixez le maximum par trade a 10 USDC. Meme si un seul trade tournait completement mal, seule cette tranche de 10 USDC est exposee, donc votre pire scenario sur un trade represente a peu pres un dixieme de votre portefeuille, pas la totalite. Les 90 USDC restants ne sont pas touches et restent prets pour de meilleurs moments.",
    },
    {
      id: "c4-l2",
      title: "Qu'est-ce que la volatilite et pourquoi est-elle risquee ?",
      paragraphs: [
        "La volatilite, c'est l'ampleur et la vitesse auxquelles un prix bouge dans tous les sens. Le solde d'un livret d'epargne bouge a peine, donc il a presque aucune volatilite. La crypto, c'est l'inverse : le XLM peut monter ou descendre de plusieurs pour cent en une seule journee, parfois en quelques heures. C'est exactement ce mouvement qui pousse les gens a trader, et c'est aussi exactement ce qui le rend risque.",
        "Une forte volatilite joue dans les deux sens. La meme variation qui pourrait faire grossir votre position peut la faire fondre tout aussi vite. Si vous ne surveillez pas, un mouvement brutal peut transformer un petit gain sur papier en perte reelle avant meme que vous reagissiez.",
        "Le tableau de bord vous aide a le ressentir. Il valorise tout votre portefeuille a la fois en XLM et en USDC, pour que vous puissiez voir la valeur totale monter et descendre en temps reel. Voir ces chiffres bouger est la facon la plus claire de comprendre que la volatilite n'a rien d'abstrait : c'est votre argent qui change de taille.",
      ],
      example: "Disons que le XLM vaut 0.100 USDC le matin. Dans l'apres-midi, il chute de 5 pour cent a 0.095 USDC. Si vous deteniez 2000 XLM, votre pile est passee de 200 USDC a 190 USDC, une variation de 10 USDC en quelques heures sans aucune action de votre part. Cette vitesse, c'est la volatilite, et c'est pourquoi la taille de position et les stop loss comptent.",
    },
    {
      id: "c4-l3",
      title: "Qu'est-ce qu'une perte et comment la limiter ?",
      paragraphs: [
        "Une perte se produit quand vous vous retrouvez avec moins de valeur qu'au depart, en general parce que vous avez achete et que le prix a ensuite baisse, ou que vous avez vendu et qu'il est remonte. Les pertes font partie normale et inevitable du trading. Le savoir-faire ne consiste pas a les eviter completement, mais a garder chacune d'elles petite pour que votre compte survive et puisse trader un autre jour.",
        "Ce bot limite les pertes de plusieurs facons superposees. Un budget de perte journalier reduit automatiquement la taille de vos positions a mesure que les pertes s'accumulent dans la journee, pour qu'une mauvaise serie se calme au lieu de s'amplifier. Il y a aussi un volume journalier maximum et un nombre maximum de trades par jour, qui vous empechent de sur-trader quand les choses tournent mal.",
        "Pour une seule position, vous pouvez ajouter un stop loss, detaille plus loin, qui ferme le trade des qu'il passe sous un niveau que vous choisissez. Ensemble, ces outils transforment une perte potentiellement grande et sans limite en une perte petite et connue.",
      ],
      example: "Vous achetez pour 50 USDC de XLM et le prix commence a glisser. Avec un stop loss fixe a 4 pour cent sous votre entree, le bot vend une fois que vous etes en baisse d'environ 2 USDC, ce qui plafonne cette perte. Pendant ce temps, le budget de perte journalier remarque la journee dans le rouge et reduit votre prochain trade de 10 USDC a 5 USDC, pour que la journee ne fasse pas boule de neige.",
    },
    {
      id: "c4-l4",
      title: "N'investir que ce que vous pouvez vous permettre de perdre",
      paragraphs: [
        "N'investir que ce que vous pouvez vous permettre de perdre signifie y mettre de l'argent qui, s'il disparaissait entierement, ne changerait pas votre vie. Le loyer, la nourriture, les factures et l'epargne d'urgence ne sont jamais de l'argent de trading. Si perdre ce montant vous causait un vrai stress ou vous obligeait a emprunter, c'est trop.",
        "Cette regle est importante parce que la volatilite est bien reelle et que les pertes arrivent. Les gens qui tradent avec de l'argent dont ils ne peuvent pas se passer ont tendance a paniquer, a garder trop longtemps des trades perdants en esperant qu'ils remontent, ou a courir apres les pertes avec des mises plus grosses. De l'argent que vous pouvez reellement vous permettre de perdre vous permet plutot de prendre des decisions calmes et rationnelles.",
        "Le bot soutient directement cet etat d'esprit. Il demarre en mode lecture seule et propose un mode paper trading entierement simule, sans fonds reels, pour que vous puissiez vous entrainer et apprendre la sensation du risque avant qu'une seule vraie piece ne soit en jeu.",
      ],
      example: "Imaginez que vous avez 1000 USDC d'epargne mais qu'il vous en faut 900 pour le loyer et les imprevus. L'argent que vous pouvez vous permettre de perdre ici serait peut-etre 50 USDC, pas les 1000 entiers. Vous financez le bot avec ces 50, vous fixez le plafond par trade tres bas, et vous commencez d'abord en mode paper. Si tout disparaissait, votre loyer et votre filet de securite resteraient entierement intacts.",
    },
    {
      id: "c4-l5",
      title: "Qu'est-ce que la diversification ?",
      paragraphs: [
        "La diversification, c'est ne pas mettre tout votre argent dans une seule chose. Si tout ce que vous possedez est un unique token et que ce token s'effondre, vous perdez sur toute la ligne au meme moment. Repartir la valeur sur plusieurs avoirs fait qu'une chute sur l'un est amortie par les autres.",
        "Un premier pas simple est de detenir plus d'un actif. Ce bot valorise votre portefeuille a la fois en XLM et en USDC, et l'USDC est un stablecoin concu pour rester proche d'un dollar, donc il bouge a peine. Garder une partie de votre portefeuille en USDC vous donne une ancre calme pendant que le reste suit le XLM, plus volatil.",
        "La diversification n'est pas magique et ne supprime pas le risque, mais elle lisse les a-coups. Combinee aux limites d'exposition du bot, elle empeche qu'une seule position decide de tout votre resultat, ce qui garde a la fois votre argent et vos nerfs plus stables.",
      ],
      example: "Supposons que vous mettiez la totalite de vos 100 USDC de valeur dans le XLM et qu'il chute de 8 pour cent dans la nuit ; vous etes en baisse de 8 USDC sans rien pour amortir. Si au lieu de ca vous deteniez 50 USDC en XLM et 50 USDC en USDC stable, la meme chute de 8 pour cent du XLM ne coute que 4 USDC, parce que la moitie de votre portefeuille n'a jamais bouge. Meme marche, moitie moins de douleur.",
    },
  ],
  quiz: [
    {
      id: "c4-q1",
      prompt: "En trading, que signifie reellement le risque ?",
      options: [
        {
          text: "Une garantie que vous perdrez de l'argent sur chaque trade",
          explanation: "Faux. Le risque n'est pas une garantie de perte ; c'est la probabilite qu'un trade tourne contre vous, et beaucoup de trades se passent tres bien.",
        },
        {
          text: "La probabilite qu'un trade perde de l'argent au lieu d'en gagner",
          explanation: "Correct. Le risque est la possibilite que le prix evolue contre vous, c'est pourquoi le bot plafonne la taille par trade et l'exposition totale.",
        },
        {
          text: "Des frais que la plateforme preleve pour ouvrir une position",
          explanation: "Faux. Ca decrit les couts de trading ou le spread, pas le risque. Le risque concerne des issues incertaines, pas des frais fixes.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c4-q2",
      prompt: "Pourquoi une forte volatilite est-elle consideree comme risquee ?",
      options: [
        {
          text: "Parce que le prix ne change jamais, donc vous ne pouvez jamais vendre",
          explanation: "Faux. C'est l'oppose de la volatilite. La volatilite signifie que le prix change beaucoup, pas qu'il reste immobile.",
        },
        {
          text: "Parce qu'elle ne fait jamais que pousser les prix vers le haut",
          explanation: "Faux. La volatilite joue dans les deux sens ; le meme mouvement rapide qui peut faire grossir une position peut la faire fondre tout aussi vite.",
        },
        {
          text: "Parce que les prix peuvent varier de plusieurs pour cent vite, donc la valeur peut chuter rapidement avant que vous reagissiez",
          explanation: "Correct. Le XLM peut bouger de plusieurs pour cent en une journee, et cette vitesse peut transformer un gain sur papier en perte reelle avant que vous n'agissiez.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c4-q3",
      prompt: "Quel outil aide a plafonner la perte sur une seule position ?",
      options: [
        {
          text: "Un stop loss qui ferme le trade des qu'il passe sous un niveau que vous choisissez",
          explanation: "Correct. Un stop loss transforme une perte sans limite en une perte petite et connue, en sortant a un niveau que vous fixez a l'avance.",
        },
        {
          text: "Acheter davantage du token a mesure qu'il continue de baisser",
          explanation: "Faux. Ca augmente votre exposition et votre perte potentielle ; c'est le comportement de course aux pertes contre lequel les regles mettent en garde.",
        },
        {
          text: "Eteindre le tableau de bord pour ne plus voir le prix",
          explanation: "Faux. Ignorer le prix ne limite pas une perte ; ca ne fait que la cacher pendant que la position continue d'evoluer contre vous.",
        },
        {
          text: "Supprimer le budget de perte journalier pour que les trades restent grands",
          explanation: "Faux. Le budget de perte journalier vous protege en reduisant les tailles pendant une mauvaise serie ; le supprimer augmenterait le risque.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c4-q4",
      prompt: "Que signifie en pratique n'investir que ce que vous pouvez vous permettre de perdre ?",
      options: [
        {
          text: "Trader avec l'argent de votre loyer parce que le bot limite les pertes de toute facon",
          explanation: "Faux. Le loyer et les factures ne sont jamais de l'argent de trading ; les limites reduisent le risque mais ne le suppriment jamais, et les fonds essentiels doivent rester a l'abri.",
        },
        {
          text: "Ne financer le bot qu'avec de l'argent dont la perte totale ne nuirait pas a votre vie",
          explanation: "Correct. De l'argent que vous pouvez vous permettre de perdre vous garde calme et rationnel, c'est pourquoi le bot propose aussi un mode paper pour s'entrainer d'abord.",
        },
        {
          text: "Tout investir d'un coup pour qu'un seul gros gain couvre tout le risque",
          explanation: "Faux. Tout miser ignore la diversification et les limites d'exposition, et un seul mauvais mouvement pourrait vider tout le portefeuille.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
