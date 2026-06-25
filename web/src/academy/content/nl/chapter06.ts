import type { Chapter } from "../../types";

export const chapter06: Chapter = {
  id: "c6",
  number: 6,
  level: "ADVANCED",
  title: "Trailing stop losses",
  description:
    "Een stop die de prijs omhoog volgt om winst vast te zetten maar nooit naar beneden beweegt, en hoe je er hier een instelt.",
  lessons: [
    {
      id: "c6-l1",
      title: "Wat is een trailing stop loss?",
      paragraphs: [
        "Een trailing stop loss is een beschermende exit waarvan de triggerprijs de markt in jouw voordeel volgt maar nooit in jouw nadeel. In plaats van een vaste prijs in te stellen, kies je een afstand om mee te trailen, en de bot houdt de trigger op die afstand onder de beste prijs die hij gezien heeft.",
        "Naarmate de prijs stijgt, stijgt de trigger mee, schuift omhoog en beschermt zo een groter deel van je winst. Op het moment dat de prijs stokt of ver genoeg terugvalt om de trigger te raken, vuurt de stop af en sluit de positie door direct over te steken om gevuld te worden, net als een gewone stop.",
        "De app zegt het zelf duidelijk in de tooltip: een trailing stop beweegt automatisch omhoog naarmate de prijs stijgt en zet zo winst vast, maar beweegt nooit naar beneden. Je stelt de afstand in om mee te trailen, in prijseenheden of in procent. Zo laat je winnaars doorlopen terwijl je toch beperkt hoeveel van een beweging je teruggeeft.",
      ],
      example:
        "Je bezit XLM gekocht rond 0.110 USDC. Je stelt een trailing stop in met een trail van 5 procent. Bij de huidige mid van 0.120 ligt de initiële trigger op 0.120 keer 0.95, oftewel 0.114. De prijs stijgt naar 0.130, dus de trigger stijgt naar 0.1235. Als de prijs daarna terugzakt naar 0.1235, vuurt de stop af en verkoopt, en boek je veel meer dan je instap.",
    },
    {
      id: "c6-l2",
      title: "Hoe verschilt een trailing stop loss van een gewone stop loss?",
      paragraphs: [
        "Een gewone stop loss heeft één vaste triggerprijs die je eenmalig kiest en die uit zichzelf nooit verandert. Hij beschermt je tegen neerwaartse beweging, maar als de prijs stijgt doet hij niets om die nieuwe winst vast te leggen. Je zou dan met de hand moeten annuleren en een hogere stop opnieuw moeten plaatsen.",
        "Een trailing stop lost dat op. De trigger wordt berekend vanuit een bewegende referentie, de beste prijs die tot dusver gezien is, min jouw trail-afstand. Daardoor schuift hij automatisch omhoog naarmate de trade goed loopt, en alleen omhoog. Hij zal uit zichzelf nooit naar je instap toe zakken.",
        "Beide stops gedragen zich identiek wanneer ze afvuren: ze steken het orderboek over om nu gevuld te worden en accepteren de huidige prijs om de exit te garanderen. Het enige verschil is of de trigger bevroren is, zoals bij een gewone stop, of zichzelf bijstelt, zoals bij een trailing stop. In het stop-loss-paneel wissel je ertussen met een schakelaar.",
      ],
      example:
        "Twee stops op XLM gekocht op 0.110. Een gewone stop staat voor altijd vast op 0.105. Een trailing stop die 0.005 onder de prijs is ingesteld start op 0.115 wanneer de mid 0.120 is. De prijs loopt naar 0.140: de gewone stop staat nog steeds op 0.105 en zet de hele winst op het spel, terwijl de trailing trigger is opgeklommen naar 0.135 en zo ongeveer 0.025 winst per eenheid vastlegt.",
    },
    {
      id: "c6-l3",
      title: "Wat is een high water mark en hoe werkt het?",
      paragraphs: [
        "De high water mark is het ene getal dat trailing laat werken. Voor een long-positie is het de hoogste prijs die de bot heeft waargenomen sinds de stop is aangemaakt. Elke nieuwe tick wordt ermee vergeleken, en de mark wordt alleen bijgewerkt wanneer er een hogere prijs binnenkomt.",
        "De effectieve trigger wordt altijd afgeleid van deze mark: high water mark keer (1 min procent gedeeld door 100) voor een procentuele trail, of high water mark min het bedrag voor een trail in een bedrag. Omdat de mark alleen kan stijgen, kan de trigger alleen stijgen. Een lagere prijs verlaagt de mark nooit, dus hij maakt je bescherming nooit losser.",
        "In de stoplijst toont elke trailing stop een trailing-badge, de huidige live trigger, en een kolom High water zodat je de mark en de trigger in realtime samen ziet bewegen. Die kolom omhoog zien schuiven is het duidelijkste beeld van winst die stap voor stap wordt vastgezet.",
      ],
      example:
        "Een trail in een bedrag van 0.004 op XLM. De mid is 0.120, dus de mark is 0.120 en de trigger is 0.116. De prijs tikt 0.123, 0.121, 0.128: de mark volgt alleen de nieuwe toppen naar 0.123 en dan 0.128, dus de trigger stijgt naar 0.119 en dan 0.124. Het dipje naar 0.121 liet beide onaangeroerd. De trigger eindigde op 0.124 en daalde nooit.",
    },
    {
      id: "c6-l4",
      title: "Trailen met een bedrag of met een percentage — wanneer kies je wat?",
      paragraphs: [
        "Wanneer je een Trailing Stop Loss kiest, bepaal je ook hoe je de afstand meet: Trailen met percentage of Trailen met bedrag. Een procentuele trail schaalt mee met de prijs, dus het verschil in absolute termen groeit naarmate de munt in waarde stijgt. Een trail in een bedrag houdt hetzelfde vaste verschil in prijseenheden, waar de prijs ook heen gaat.",
        "Procentuele trails passen bij munten die proportioneel bewegen en bij trades die je door grote stijgingen heen wilt aanhouden, omdat de ruimte om te ademen meegroeit met de positie. Trails in een bedrag passen bij strak, goed afgebakend risico, zoals een stablecoin-paar als XLM tegen USDC waarbij je in vaste prijseenheden denkt en een voorspelbare afstand wilt.",
        "Wat je ook kiest, de app toont een voorbeeld van een Initiële stopprijs vanuit de huidige mid zodat je de afstand kunt controleren voordat je je vastlegt. Als dat voorbeeld ongemakkelijk dicht bij of ver van de prijs ligt, pas dan het getal aan voordat je de stop aanmaakt.",
      ],
      example:
        "XLM op een mid van 0.120. Een trail van 5 procent geeft een initiële trigger van 0.114, een verschil van 0.006. Een trail in een bedrag van 0.006 geeft vandaag dezelfde 0.114. Maar als de prijs verdubbelt naar 0.240 ligt de procentuele trail nu op 0.012 afstand terwijl de trail in een bedrag nog steeds op slechts 0.006 afstand zit, veel strakker bij de hogere prijs.",
    },
    {
      id: "c6-l5",
      title: "Hoe stel je een trailing stop loss in in deze app (handmatig en AI)",
      paragraphs: [
        "Om er handmatig een in te stellen, open je het stop-loss-paneel en zet je de schakelaar op Trailing Stop Loss. Kies Trailen met percentage of Trailen met bedrag, voer de afstand in, en lees het voorbeeld van de Initiële stopprijs dat de app berekent vanuit de huidige mid. Als het voorbeeld er goed uitziet, maak je de stop aan en verschijnt hij in de lijst met zijn trailing-badge.",
        "Eenmaal live beheer je hem niet tick voor tick. De bot houdt de high water mark voor je bij en herberekent de trigger bij elke prijsupdate, dus de live trigger en de kolom High water werken zichzelf bij. Als de prijs terugvalt tot de trigger, vuurt hij af en sluit door over te steken om nu gevuld te worden.",
        "Trailing stops kunnen ook door de AI worden aangemaakt in plaats van met de hand. Een door de AI geplaatste trailing stop verschijnt in dezelfde lijst met dezelfde trailing-badge, live trigger en kolom High water, en volgt dezelfde opschuifregels. Of je hem nu zelf of de AI instelt, de werking is precies hetzelfde.",
      ],
      example:
        "Je zet de schakelaar op Trailing Stop Loss, kiest Trailen met percentage en voert 4 in. Met de mid op 0.120 toont het paneel een voorbeeld van een Initiële stopprijs van 0.1152. Je maakt hem aan; de lijst toont een trailing-badge, trigger 0.1152, high water 0.120. De prijs piekt later op 0.135, dus de kolom High water leest 0.135 en de live trigger leest 0.1296.",
    },
  ],
  quiz: [
    {
      id: "c6-q1",
      prompt: "Wat beschrijft een trailing stop loss het best?",
      options: [
        {
          text: "Een beschermende exit waarvan de trigger de prijs omhoog volgt met een vaste afstand maar nooit naar beneden beweegt.",
          explanation:
            "Juist. De trigger trailt de beste prijs met de afstand die jij kiest en schuift altijd alleen omhoog, waardoor winst wordt vastgezet.",
        },
        {
          text: "Een vaste triggerprijs die je eenmalig instelt en die nooit verandert.",
          explanation:
            "Dat beschrijft een gewone stop loss, geen trailing. De trigger van een trailing stop beweegt richting winst.",
        },
        {
          text: "Een order die automatisch aan je positie toevoegt naarmate de prijs stijgt.",
          explanation:
            "Een trailing stop koopt nooit bij. Het is een exit die de positie sluit wanneer de prijs terugvalt tot de bewegende trigger.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c6-q2",
      prompt:
        "Wat is het belangrijkste verschil tussen een gewone stop en een trailing stop in deze app?",
      options: [
        {
          text: "De gewone stop wordt gevuld tegen een limietprijs terwijl de trailing stop nooit gevuld wordt.",
          explanation:
            "Onjuist. Beide stops vuren af door direct over te steken om gevuld te worden; geen van beide blijft als een passieve limiet liggen wanneer hij getriggerd wordt.",
        },
        {
          text: "De trigger van de trailing stop stelt zichzelf omhoog bij terwijl de trigger van de gewone stop vast blijft staan.",
          explanation:
            "Juist. Een gewone stop houdt één vaste prijs aan; de trailing stop herberekent zijn trigger vanuit de stijgende high water mark.",
        },
        {
          text: "De trailing stop kan zijn trigger zowel omhoog als omlaag bewegen om de prijs te volgen.",
          explanation:
            "Onjuist. De trailing trigger beweegt alleen omhoog richting winst; hij beweegt nooit naar beneden.",
        },
        {
          text: "Alleen de gewone stop kan door de AI worden geplaatst.",
          explanation:
            "Onjuist. Trailing stops kunnen handmatig of door de AI worden ingesteld, en verschijnen hoe dan ook met een trailing-badge.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q3",
      prompt:
        "De prijs op een long gaat 0.120, dan 0.130, dan terug naar 0.126, met een trail in een bedrag van 0.005. Wat is de trigger na het dipje naar 0.126?",
      options: [
        {
          text: "0.121, omdat de trigger de laatste prijs van 0.126 naar beneden volgt.",
          explanation:
            "Onjuist. De high water mark daalt niet, dus de trigger daalt niet wanneer de prijs dipt.",
        },
        {
          text: "0.125, omdat de high water mark op 0.130 bleef staan en 0.130 min 0.005 gelijk is aan 0.125.",
          explanation:
            "Juist. De mark zette zich vast op de top van 0.130, dus de trigger blijft op 0.125 zelfs als de prijs terugzakt naar 0.126.",
        },
        {
          text: "0.115, omdat de trigger altijd 0.005 onder de startprijs van 0.120 ligt.",
          explanation:
            "Onjuist. De trigger wordt gemeten vanuit de high water mark, die naar 0.130 steeg, niet vanuit de startprijs.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c6-q4",
      prompt:
        "Waarom zou je op een stablecoin-paar als XLM tegen USDC een trail in een bedrag verkiezen boven een procentuele trail?",
      options: [
        {
          text: "Omdat een trail in een bedrag automatisch breder wordt naarmate de prijs stijgt.",
          explanation:
            "Onjuist. Dat is het gedrag van de procentuele trail. Een trail in een bedrag houdt een vast verschil in prijseenheden aan.",
        },
        {
          text: "Omdat een trail in een bedrag de high water mark uitschakelt.",
          explanation:
            "Onjuist. Beide trail-types gebruiken dezelfde high water mark; alleen de afstandsberekening verschilt.",
        },
        {
          text: "Omdat je in vaste prijseenheden denkt en een voorspelbare, constante afstand wilt.",
          explanation:
            "Juist. Een trail in een bedrag houdt hetzelfde verschil in prijseenheden aan ongeacht waar de prijs heen gaat, wat strak en voorspelbaar risico geeft.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c6-q5",
      prompt:
        "Wanneer je in het paneel handmatig een trailing stop instelt, wat toont de app dan voordat je hem aanmaakt?",
      options: [
        {
          text: "Een voorbeeld van een Initiële stopprijs berekend vanuit de huidige mid-prijs.",
          explanation:
            "Juist. Nadat je trailing aanzet en een afstand invoert, toont de app de initiële trigger vanuit de huidige mid zodat je hem kunt controleren.",
        },
        {
          text: "Een gegarandeerde vulprijs waartegen de stop later zal uitvoeren.",
          explanation:
            "Onjuist. Niets is gegarandeerd; wanneer de stop afvuurt steekt hij over om gevuld te worden tegen de dan geldende prijs.",
        },
        {
          text: "De uiteindelijke high water mark die de stop zal bereiken.",
          explanation:
            "Onjuist. De high water mark is vooraf onbekend; hij ontwikkelt zich pas naarmate de prijs beweegt nadat de stop is aangemaakt.",
        },
        {
          text: "Een lijst van eerdere trades die dezelfde trigger raakten.",
          explanation:
            "Onjuist. Het paneel toont een voorbeeld van een initiële stopprijs, geen historische vullingen.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
