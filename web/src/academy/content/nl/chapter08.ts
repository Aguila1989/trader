import type { Chapter } from "../../types";

export const chapter08: Chapter = {
  id: "c8",
  number: 8,
  level: "ADVANCED",
  title: "De markt lezen",
  description:
    "Leer prijsgrafieken, candlesticks, tijdsbestekken, volume en liquiditeitstrends lezen zoals deze app ze weergeeft.",
  lessons: [
    {
      id: "c8-l1",
      title: "Wat is een prijsgrafiek en hoe lees je die?",
      paragraphs: [
        "Een prijsgrafiek is een beeld van hoe de prijs van een token in de loop van de tijd bewoog. De tijd loopt van links naar rechts, dus het oudste punt staat links en het nieuwste rechts. De prijs loopt van onder naar boven, dus een lijn of vorm die hoger zit, betekent een hogere prijs. Een grafiek lezen draait vooral om een vraag: stijgt de prijs over het algemeen, daalt hij, of beweegt hij zijwaarts over het stuk dat je bekijkt?",
        "In deze app tekent de token-detailweergave de grafiek op basis van echte trade-data van Stellar Horizon, gegroepeerd in vaste tijdsperiodes. Elke periode wordt een candle in plaats van een enkel punt, waardoor er vier prijzen in een vorm worden gepropt in plaats van maar een. Zo zie je niet alleen waar de prijs eindigde, maar ook hoe sterk hij onderweg schommelde.",
        "Lees kleine schommelingen niet te zwaar. Neem eerst afstand en kijk naar de algemene helling, en zoom daarna pas in op de details. Een grafiek vertelt je wat er al gebeurd is, niet wat er hierna zal gebeuren, dus behandel hem als bewijsmateriaal en niet als een voorspelling.",
      ],
      example:
        "In de dagweergave zie je 30 dagelijkse candles. De meest linkse sluit rond 0.118, de candles drijven via het midden omhoog tot ongeveer 0.131, en dan zakken de laatste paar terug naar 0.126. De conclusie is een maand die eerst steeg en daarna een deel teruggaf, en uiteindelijk bescheiden hoger eindigde dan hij begon.",
    },
    {
      id: "c8-l2",
      title: "Wat is een candlestick?",
      paragraphs: [
        "Een candlestick vat een tijdsperiode samen met vier prijzen: de open, de high, de low en de close. Het dikke deel, het lichaam genoemd, wordt getekend tussen de open en de close. De dunne lijnen erboven en eronder, de wicks genoemd, reiken omhoog tot de high en omlaag tot de low die in die periode verhandeld werden.",
        "De kleur geeft je in een oogopslag de richting. Een groene of stijgende candle sloot hoger dan hij opende, dus de bovenkant van het lichaam is de close. Een rode of dalende candle sloot lager dan hij opende, dus de bovenkant van het lichaam is de open. Lange wicks betekenen dat de prijs ver van de open of close wegliep voordat hij tot rust kwam, wat wijst op besluiteloosheid of een afgewezen beweging.",
        "In deze app draagt elke candle ook het verhandelde base volume en het aantal trades in die periode, dus een candle is niet alleen vorm maar ook activiteit. Lees het lichaam voor de netto beweging en de wicks voor de strijd die hem voortbracht.",
      ],
      example:
        "Een enkele dagelijkse candle opent op 0.120, zakt naar een low van 0.117, schiet omhoog naar een high van 0.129 en sluit op 0.127. Hij wordt groen omdat de close de open verslaat, met een korte onderste wick tot 0.117 en een bovenste wick die tot 0.129 reikt boven de bovenkant van het lichaam op 0.127.",
    },
    {
      id: "c8-l3",
      title: "Hoe gebruik je de uur- / dag- / week- / jaargrafiek in deze app",
      paragraphs: [
        "De token-detailgrafiek heeft een tijdsbestek-schakelaar met vier instellingen, en elke instelling toont hetzelfde token binnen een ander venster. Uur toont 24 candles van een uur, dus het beslaat ruwweg de laatste dag in fijn detail. Dag toont 30 dagelijkse candles, ongeveer een maand. Week toont 52 wekelijkse candles, ongeveer een jaar aan weken. Jaar toont 365 dagelijkse candles, ruwweg een vol jaar dag per dag.",
        "Kies het tijdsbestek dat bij je vraag past. Voor wat er nu gebeurt, gebruik je uur. Voor de vorm van de laatste maand, gebruik je dag. Voor de langere lijn, gebruik je week of jaar. Een beweging die enorm lijkt op de uurgrafiek, kan een klein stipje zijn zodra je naar week schakelt, dus toets een kortetermijnsignaal altijd tegen een langer signaal.",
        "Omdat elke candle gebouwd is uit dezelfde Horizon trade-aggregaties, zijn de vier weergaven onderling consistent; ze verdelen de trades alleen in langere of kortere periodes. Van tijdsbestek wisselen verandert nooit de onderliggende data, alleen het zoomniveau waarop je die leest.",
      ],
      example:
        "Je merkt een scherpe daling op de uurgrafiek die er over de 24 candles alarmerend uitziet. Je schakelt naar week, ziet 52 wekelijkse candles en merkt dat diezelfde daling een kleine rode candle is binnen een jaar dat gestaag omhoog liep. De schrik was gewoon normale ruis binnen de dag.",
    },
    {
      id: "c8-l4",
      title: "Wat is een volume-indicator?",
      paragraphs: [
        "Volume is hoeveel van een token er werkelijk verhandeld werd in een periode. In deze app rapporteert elke candle zijn base volume en aantal trades, zodat je kunt zien of een prijsbeweging gebeurde bij veel activiteit of bij nauwelijks enige. Volume beantwoordt een andere vraag dan de prijs: niet waar hij heen ging, maar hoeveel overtuiging erachter zat.",
        "De vuistregel is dat volume bewegingen bevestigt. Een prijssprong bij stijgend volume is betrouwbaarder omdat veel deelnemers het ermee eens waren. Diezelfde sprong bij dun volume is verdacht, omdat een enkel klein order een rustige markt rond kan duwen zonder dat het veel betekent.",
        "Dit is rechtstreeks van belang voor de bot. Hij hanteert een minimumdrempel voor het 24u-volume en weigert erg dunne markten, want een grafiek die er aantrekkelijk uitziet maar nauwelijks verhandeld wordt, is een valstrik: je kunt mogelijk niet in- of uitstappen tegen de prijs die je ziet. Werp altijd een blik op het volume voordat je een candle vertrouwt.",
      ],
      example:
        "Twee tokens stegen vandaag allebei 4 procent. Token A deed dat op 90.000 aan base volume verspreid over 600 trades; Token B deed dat op 800 aan volume verspreid over 5 trades. De beweging van Token A is geloofwaardig en de bot zou hem overwegen; die van Token B is ruis op een markt die de bot als te dun zou afwijzen.",
    },
    {
      id: "c8-l5",
      title: "Wat is een liquiditeitstrend en waarom volg je die?",
      paragraphs: [
        "Liquiditeit is hoe gemakkelijk je een token kunt verhandelen zonder de prijs ervan te bewegen. Het volume van een enkele dag is een momentopname; een liquiditeitstrend is de richting waarin die momentopname zich in de loop van de tijd beweegt. De bot draait een liquiditeitsscanner die tokens rangschikt op hun 24u-volume en aantal trades, en daarna volgt hoe elk token door die ranglijst beweegt.",
        "De scanner rapporteert twee trends per token. De rangtrend kan verbeterend, dalend of stabiel zijn, wat betekent dat het token in de ranglijst klimt, wegzakt of zijn plaats vasthoudt. De volumetrend kan groeiend, krimpend of stabiel zijn, en beschrijft de ruwe activiteit zelf. Samen vormen ze de liquiditeitstrend.",
        "Volg die, want liquiditeit bepaalt of een strategie überhaupt uitvoerbaar is. Een token met groeiend volume en een verbeterende rang wordt makkelijker te verhandelen en veiliger om groter in te gaan. Een token dat krimpt en daalt, droogt op, dus zelfs een goed prijssignaal daar is riskant omdat je er mogelijk mee blijft zitten.",
      ],
      example:
        "Een token zit middenin de ranglijst, maar zijn scannerkaart toont een groeiende volumetrend en een verbeterende rangtrend over de recente scans, klimmend van rang 40 richting rang 25. Die verbeterende liquiditeitstrend betekent dat instappen vandaag later makkelijker te verlaten is dan dezelfde trade een week geleden zou zijn geweest.",
    },
  ],
  quiz: [
    {
      id: "c8-q1",
      prompt: "Wat stelt op een prijsgrafiek in deze app de beweging van links naar rechts voor?",
      options: [
        {
          text: "Het verstrijken van de tijd, van de oudste links naar de nieuwste rechts.",
          explanation:
            "Correct. De horizontale as is de tijd, dus de meest rechtse candle is de meest recente periode.",
        },
        {
          text: "Een stijgende prijs, van de goedkoopste links naar de duurste rechts.",
          explanation:
            "Onjuist. De prijs is de verticale as; horizontaal is de tijd.",
        },
        {
          text: "Toenemend volume, van het rustigst links naar het drukst rechts.",
          explanation:
            "Onjuist. Volume wordt per candle gerapporteerd, niet via de horizontale positie.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c8-q2",
      prompt:
        "Een candle opent op 0.120, sluit op 0.127, met een high van 0.129 en een low van 0.117. Wat klopt?",
      options: [
        {
          text: "Het is een rode candle en 0.129 is de close.",
          explanation:
            "Onjuist. De close (0.127) ligt boven de open, dus de candle is groen, en 0.129 is de high, niet de close.",
        },
        {
          text: "Het is een groene candle; het lichaam loopt van 0.120 tot 0.127 en de wicks reiken tot 0.129 en 0.117.",
          explanation:
            "Correct. Een close boven de open maakt hem groen; het lichaam loopt van open tot close en de wicks markeren de high en de low.",
        },
        {
          text: "Het lichaam loopt van 0.117 tot 0.129 en er zijn geen wicks.",
          explanation:
            "Onjuist. Het lichaam loopt van open tot close (0.120 tot 0.127); 0.117 en 0.129 zijn de uitersten van de wicks.",
        },
        {
          text: "Hij is groen omdat de high de open versloeg.",
          explanation:
            "Onjuist. De kleur komt voort uit de close versus de open, niet uit de high versus de open.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q3",
      prompt:
        "Je wilt de volledige laatste maand aan prijsbeweging van een token beoordelen. Welk tijdsbestek past het best?",
      options: [
        {
          text: "Uur, dat 24 candles van een uur toont.",
          explanation:
            "Onjuist. Uur beslaat slechts ongeveer de laatste dag, niet een maand.",
        },
        {
          text: "Dag, dat 30 dagelijkse candles toont.",
          explanation:
            "Correct. Dertig dagelijkse candles beslaan ruwweg een maand, wat bij de vraag past.",
        },
        {
          text: "Jaar, dat 365 dagelijkse candles toont.",
          explanation:
            "Onjuist. Jaar beslaat een volledig jaar, veel meer dan de ene maand waar het over gaat.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c8-q4",
      prompt: "Waarom let de bot op volume, en niet alleen op de prijs?",
      options: [
        {
          text: "Hoog volume betekent altijd dat de prijs zal blijven stijgen.",
          explanation:
            "Onjuist. Volume bevestigt de overtuiging achter een beweging, maar voorspelt de toekomstige richting niet.",
        },
        {
          text: "Volume bepaalt de kleur van elke candle.",
          explanation:
            "Onjuist. De kleur van een candle komt voort uit de close versus de open; volume staat daar los van.",
        },
        {
          text: "Volume bevestigt of een beweging betrouwbaar is, en erg dunne markten worden geweigerd door een minimumdrempel voor het 24u-volume.",
          explanation:
            "Correct. Een beweging bij veel volume is geloofwaardiger, en de bot weigert markten die te dun zijn om betrouwbaar in of uit te stappen.",
        },
        {
          text: "Volume vervangt de prijs als het belangrijkste om op de grafiek te lezen.",
          explanation:
            "Onjuist. Volume vult de prijs aan; je leest beide, niet het een in plaats van het ander.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c8-q5",
      prompt:
        "De scanner toont een token met een groeiende volumetrend en een verbeterende rangtrend. Wat vertelt deze liquiditeitstrend je?",
      options: [
        {
          text: "Het token wordt na verloop van tijd makkelijker te verhandelen en veiliger om groter in te gaan.",
          explanation:
            "Correct. Groeiend volume plus een klimmende rang betekent verbeterende liquiditeit, dus in- en later uitstappen wordt makkelijker.",
        },
        {
          text: "De prijs van het token zal gegarandeerd stijgen.",
          explanation:
            "Onjuist. De liquiditeitstrend beschrijft de verhandelbaarheid, niet de toekomstige prijsrichting.",
        },
        {
          text: "Het token droogt op en moet vermeden worden.",
          explanation:
            "Onjuist. Dat zou een krimpende volumetrend en een dalende rangtrend zijn, het tegenovergestelde van dit geval.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
