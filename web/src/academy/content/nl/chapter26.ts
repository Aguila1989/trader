// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../types";

export const chapter26: Chapter & { whoFor: string } = {
  id: "c26",
  number: 26,
  level: "BASIC",
  whoFor: "Voor iedereen die cryptokoppen leest en zich afvraagt wat er echt van klopt",
  title: "Hoe je cryptonieuws kritisch leest",
  description:
    "Waarom cryptonieuws anders is, de gangbare manipulatietrucs zoals pump-and-dumps en nepsamenwerkingen, hoe je zelf een bewering controleert, en welke bronnen je echt kunt vertrouwen.",
  lessons: [
    {
      id: "c26-l1",
      title: "Waarom is nieuws in crypto anders dan gewoon nieuws?",
      paragraphs: [
        "Bij traditioneel nieuws passeert een verhaal meestal redacteuren en verslaggevers die de feiten horen te controleren voordat er iets verschijnt. Cryptonieuws is anders, omdat iedereen met een account onmiddellijk van alles kan posten aan een enorm publiek. Vaak is er geen redacteur, geen feitencontrole, en niemand die verantwoordelijk wordt gehouden als de bewering onwaar blijkt.",
        "Daar komt nog bij dat er echt geld op de stemming rust. Als de prijs van een token stijgt, worden de mensen die het al bezitten rijker, dus hebben ze een sterke reden om iedereen enthousiast te maken. Veel van de luidste stemmen online bezitten juist datgene waarover ze praten, en dat vertellen ze je zelden. Hun doel kan zijn om een prijs te bewegen, niet om jou te informeren.",
        "Dit betekent niet dat elke post een leugen is. Het betekent dat je een cryptobewering moet behandelen als een ongeverifieerde tip van een vreemde, niet als een bevestigd feit. De rest van dit hoofdstuk laat je de gangbare trucs zien en hoe je zelf dingen controleert.",
      ],
      example:
        "Denk aan het verschil tussen een krantenartikel en een pamflet dat op een lantaarnpaal is geplakt. De krant heeft een naam die erachter staat en kan ter verantwoording worden geroepen; het pamflet kan door iedereen zijn gedrukt, ook door iemand die profiteert als jij het gelooft. Het meeste cryptonieuws hangt aan de lantaarnpaal, dus lees het ook zo.",
    },
    {
      id: "c26-l2",
      title: "Wat zijn de meest voorkomende misleidende trucs?",
      paragraphs: [
        "De schadelijkste truc is de pump-and-dump. Een groep hypet een klein, goedkoop token overal tegelijk zodat de prijs omhoogschiet. Nieuwe kopers stromen toe op het enthousiasme, en de oorspronkelijke promotors verkopen hun munten stilletjes in die vraag. De prijs stort dan in, en de laatkomers blijven achter met tokens die nog maar een fractie waard zijn van wat ze betaalden.",
        "Een naaste verwant is shilling. Dat is wanneer iemand een token luidruchtig promoot terwijl hij verbergt dat hij het zelf bezit en er winst op maakt als anderen kopen. De post lijkt op een vriendelijke, onbevooroordeelde tip, maar de poster heeft een financieel belang dat hij nooit noemt. Als een vreemde ongewoon graag wil dat je iets koopt, vraag je dan af wat hij eraan verdient.",
        "De derde truc is de nepsamenwerking. Dat is een verzonnen of overdreven bewering dat een token is verbonden aan een beroemd bedrijf, gebruikt om het vertrouwen van dat bedrijf te lenen. Een schermafbeelding of een vaag We werken samen met een grote bank kan een prijs laten stijgen voordat iemand het controleert. Heel vaak heeft het grote bedrijf nog nooit van het token gehoord.",
      ],
      example:
        "Stel je een pop-upkraam voor op een druk plein. Een paar acteurs in de menigte roepen luid dat een simpele armband een zeldzaam verzamelobject is en beginnen erop te bieden. Omstanders, die niets willen missen, betalen hoge prijzen. Dan pakken de acteurs en de verkoper hun spullen en verdwijnen, en is de armband gewoon een armband. Dat geënsceneerde enthousiasme is precies hoe een pump-and-dump, shilling en een nepsamenwerking online samenwerken.",
    },
    {
      id: "c26-l3",
      title: "Hoe verifieer je een bewering over een token?",
      paragraphs: [
        "Begin bij de primaire bron. Als een post zegt dat een token een nieuwe functie heeft gelanceerd of een deal heeft gesloten, zoek de aankondiging dan op de eigen officiële website of het geverifieerde account van het project, niet alleen op de schermafbeelding die iemand opnieuw deelde. Een bewering die alleen bestaat als doorgestuurde afbeelding, zonder origineel dat je kunt terugvinden, is een waarschuwingssignaal.",
        "Voor een Stellar-token kun je de eigen metadata van de uitgever nakijken. Elke serieuze uitgever publiceert een stellar.toml-bestand, een klein tekstbestand dat vermeldt wie ze zijn en hoe je ze kunt bereiken. Het ontbreken ervan is een rode vlag. De wekelijkse, alleen observerende trustline-suggesties van Atrium lezen dit bestand al en scoren tokens met behulp van on-chain data zoals handelsactiviteit, de diepte van het orderboek, en hoeveel accounts een trustline aanhouden, wat een maatstaf is voor echte adoptie. Je kunt die scores zelf bekijken in plaats van een hype-post te vertrouwen.",
        "Tot slot: als een bewering een partner noemt, ga dat dan bij de partner controleren. Een echte samenwerking wordt meestal aan beide kanten bevestigd. On-chain data is openbaar, dus je kunt ook verifiëren of een wallet of een transactie waarmee iemand pronkt daadwerkelijk bestaat. Als het verhaal maar op één plek standhoudt en niemand onafhankelijk het bevestigt, behandel het dan als onbewezen.",
      ],
      example:
        "Stel dat een bericht zegt Een beroemde exchange heeft zojuist CoinX toegevoegd. Voordat je handelt, open je de eigen officiële site van die exchange en zoek je naar CoinX. Staat het daar niet vermeld, dan zakt de bewering al voor een basiscontrole, hoeveel mensen het ook herhalen. Eén minuut naar de primaire bron kijken is meer waard dan een uur door enthousiaste reacties scrollen.",
    },
    {
      id: "c26-l4",
      title: "Welke bronnen zijn betrouwbaar?",
      paragraphs: [
        "De betrouwbaarste bron is de primaire: de officiële website van het project, de geverifieerde accounts, en het stellar.toml-bestand. Daarna komen block explorers, openbare hulpmiddelen waarmee iedereen echte transacties en saldi op het netwerk kan opzoeken. Omdat block explorers rechtstreeks uit de blockchain lezen, tonen ze wat er werkelijk is gebeurd, niet wat iemand beweert dat er is gebeurd.",
        "Gevestigde nieuwsmedia die echte journalisten in dienst hebben en hun fouten corrigeren, zijn betrouwbaarder dan een anoniem account, al kunnen zelfs goede media cryptoverhalen verkeerd hebben, dus dubbelcheck alles waardoor je geld zou verplaatsen. Wees vooral op je hoede voor accounts die anoniem zijn, gloednieuw, of die alleen maar redenen posten om te kopen. Luidruchtig zelfvertrouwen is geen bewijs.",
        "Niets hiervan is financieel advies, en de regels verschillen per land, dus beschouw dit als gewoontes om helder te denken in plaats van instructies over wat je moet kopen. Het hoofdstuk over handelspsychologie legt uit waarom angst en enthousiasme ons deze controles laten overslaan juist wanneer we ze het hardst nodig hebben.",
      ],
      example:
        "Behandel een cryptobewering zoals een zorgvuldige koper een online recensie behandelt. Eén lovende vijfsterrenrecensie van een gloednieuw account zegt je bijna niets. Een patroon van gedetailleerde recensies verspreid over meerdere onafhankelijke, gevestigde sites, ondersteund door een bonnetje dat je kunt controleren, zegt je veel. Verschuif je vertrouwen naar de bronnen die te controleren zijn en weg van de luidste anonieme stem.",
    },
  ],
  quiz: [
    {
      id: "c26-q1",
      prompt: "Waarom zou je een online geposte cryptobewering voorzichtiger moeten behandelen dan een verhaal in een gevestigde krant?",
      options: [
        {
          text: "Omdat iedereen onmiddellijk kan publiceren zonder redacteur of feitencontrole, en posters vaak profiteren als jij hen gelooft.",
          explanation:
            "Juist. Cryptoposts slaan meestal de redactie en verantwoording van traditioneel nieuws over, en veel luide stemmen bezitten het token dat ze promoten, dus hun doel kan zijn om een prijs te bewegen in plaats van jou te informeren.",
        },
        {
          text: "Omdat cryptonieuws altijd wordt geschreven door professionele journalisten die elk feit verifiëren.",
          explanation:
            "Het tegenovergestelde is waar. De meeste cryptoberichten komen van accounts zonder verantwoording en zonder feitencontrole, en juist daarom is extra voorzichtigheid nodig.",
        },
        {
          text: "Omdat kranten nooit fout zitten en cryptosites altijd.",
          explanation:
            "Nee. Beide kunnen fout zitten. Het echte verschil zit in verantwoording en drijfveren: een cryptoposter profiteert vaak rechtstreeks als jij naar zijn bewering handelt.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c26-q2",
      prompt: "Een piepklein, goedkoop token wordt plotseling overal gehypet, de prijs schiet omhoog, en stort dan in zodra nieuwe kopers zijn ingestapt. Hoe heet dit patroon?",
      options: [
        {
          text: "Een stellar.toml-bestand.",
          explanation:
            "Nee. Een stellar.toml is metadata van de uitgever die je helpt te verifiëren wie er achter een token zit; het is een controlemiddel, geen zwendelpatroon.",
        },
        {
          text: "Een block explorer.",
          explanation:
            "Nee. Een block explorer is een openbaar hulpmiddel om echte transacties op de blockchain op te zoeken, geen manipulatieschema.",
        },
        {
          text: "Een pump-and-dump.",
          explanation:
            "Juist. Promotors hypen het token om de prijs op te drijven, verkopen dan in de nieuwe kopers en laten het instorten, waardoor laatkomers achterblijven met vrijwel waardeloze tokens.",
        },
        {
          text: "Een trustline.",
          explanation:
            "Nee. Een trustline is de opt-in die je toevoegt voordat je een niet-oorspronkelijk token aanhoudt; die heeft niets te maken met het hype-en-instort-patroon.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c26-q3",
      prompt: "Een post beweert dat een Stellar-token zojuist is gaan samenwerken met een beroemde bank. Wat is de beste manier om dat te verifiëren?",
      options: [
        {
          text: "Snel kopen voordat de prijs verder stijgt, want een grote samenwerking is geweldig nieuws.",
          explanation:
            "Nee. Handelen voordat je controleert is precies de reflex waar een nepsamenwerking op rekent. Enthousiasme is geen bewijs.",
        },
        {
          text: "Controleer de primaire bronnen: de officiële aankondiging van het project, de stellar.toml van de uitgever, on-chain data, en of de genoemde partner het ook bevestigt.",
          explanation:
            "Juist. Echte samenwerkingen worden meestal aan beide kanten bevestigd, en on-chain data plus de stellar.toml van de uitgever laten je de bewering zelf verifiëren in plaats van een schermafbeelding te vertrouwen.",
        },
        {
          text: "Tel hoeveel mensen de bewering doorplaatsen en vertrouw haar als dat aantal hoog is.",
          explanation:
            "Nee. Dat veel mensen een ongeverifieerde bewering herhalen maakt haar niet waar; het kan simpelweg betekenen dat de hype werkte. Traceer haar in plaats daarvan terug naar een primaire bron.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
