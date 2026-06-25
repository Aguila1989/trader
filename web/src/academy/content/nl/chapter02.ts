import type { Chapter } from "../../types";

export const chapter02: Chapter = {
  id: "c2",
  number: 2,
  level: "BASIC",
  title: "Prijzen begrijpen",
  description: "Hoe prijzen tot stand komen op het SDEX-orderboek, en waarom bids, asks, spread, slippage en liquiditeit samen bepalen wat je werkelijk betaalt.",
  lessons: [
    {
      id: "c2-l1",
      title: "Wat is een marktprijs?",
      paragraphs: [
        "Een marktprijs is geen vaste sticker die door een of andere autoriteit wordt bepaald. Het is simpelweg de prijs waartegen iemand op dit moment bereid is te kopen en iemand anders bereid is te verkopen. Wanneer je XLM ziet genoteerd in USDC, is dat getal de meest recente overeenkomst tussen een koper en een verkoper, of de beste prijs die op dit moment wordt aangeboden.",
        "Omdat prijzen van mensen komen, bewegen ze voortdurend. Elke nieuwe order, geannuleerde order of voltooide trade kan het getal omhoog of omlaag duwen. Er bestaat geen enkele echte prijs, alleen de prijs waartegen je op dit moment daadwerkelijk kunt handelen.",
        "Deze bot leest live prijzen rechtstreeks van de Stellar Decentralized Exchange, de SDEX. De tokendetailweergave zet ze uit als een prijsgrafiek met candles per uur, per dag, per week en per jaar, zodat je kunt zien hoe de overeengekomen prijs in de loop van de tijd is verschoven in plaats van alleen de laatste tick.",
      ],
      example: "Stel dat XLM voor het laatst werd verhandeld op 0.118 USDC. Een minuut later verlagen verkopers hun orders en wordt de beste prijs waartegen je kunt kopen 0.117 USDC. Niemand kondigde een wijziging aan; de marktprijs bewoog simpelweg omdat de goedkoopste bereidwillige verkoper veranderde. De candle-grafiek zou dat kleine dipje tonen als de meest recente uurbar.",
    },
    {
      id: "c2-l2",
      title: "Wat is een orderboek en hoe lees je het?",
      paragraphs: [
        "Een orderboek is een live lijst van ieders openstaande orders om een token te kopen en te verkopen. De bot handelt rechtstreeks tegen dit boek op de SDEX, en niet tegen een AMM met gepoolde fondsen. In het tabblad Handmatig handelen toont het Orderboek-paneel twee gestapelde lijsten.",
        "De groene kant zijn de bids: mensen die willen kopen, met de hoogste prijs bovenaan. De rode kant zijn de asks: mensen die willen verkopen, met de laagste prijs bovenaan. De twee beste prijzen die elkaar in het midden raken vormen de top of book, de directe prijzen waartegen je zou handelen.",
        "Elke rij toont ook hoeveel volume er op die prijs ligt. In de bot kun je op een bid-niveau klikken en dan wordt precies die prijs in het orderformulier ingevuld, zodat je hem niet hoeft te typen. Het lezen van het boek vertelt je niet alleen de prijs, maar ook hoeveel je kunt verhandelen voordat de prijs slechter wordt.",
      ],
      example: "Je opent het Orderboek voor XLM en USDC. De hoogste groene bid staat op 0.117 voor 4.000 XLM, en eronder 0.116 voor 9.000 XLM. De hoogste rode ask staat op 0.119 voor 3.000 XLM. Dus 4.000 XLM zou kunnen verkopen op 0.117; meer verkopen zou in het 0.116-niveau bijten. Door op de bid van 0.117 te klikken valt die prijs meteen in je orderformulier.",
    },
    {
      id: "c2-l3",
      title: "Wat is een bid, een ask en een spread?",
      paragraphs: [
        "Een bid is de prijs die een koper aanbiedt te betalen. Een ask is de prijs die een verkoper wil ontvangen. De beste bid ligt altijd net iets lager dan de beste ask, omdat niemand aanbiedt meer te betalen dan de goedkoopste verkoper vraagt. Het verschil tussen die twee beste prijzen is de spread.",
        "De bot toont deze spread rechtstreeks, gemeten in basispunten, waarbij een basispunt een honderdste van een procent is. Een InfoTip in de app legt het voor je uit: het verschil tussen de beste koop- en de beste verkoopprijs, waarbij een bredere spread een hogere verborgen kost per trade betekent.",
        "Spread is belangrijk omdat het een kost is die je betaalt enkel door te handelen. Als je koopt op de ask en meteen verkoopt op de bid, verlies je de spread. Daarom houdt deze bot hem nauwlettend in de gaten; de strategie hier draait vooral om het binnenhalen van piepkleine spreads, en een brede kan de edge volledig wegvagen.",
      ],
      example: "Als de beste bid voor XLM 0.117 USDC is en de beste ask 0.119 USDC, dan is de spread 0.002 USDC. Als fractie van de prijs is dat ongeveer 1.7 procent, oftewel ruwweg 170 basispunten, wat de bot als breed zou aanmerken. Koop en verkoop meteen, en je staat al 0.002 per XLM in de min voordat er andere kosten bijkomen.",
    },
    {
      id: "c2-l4",
      title: "Wat is slippage en waarom gebeurt het?",
      paragraphs: [
        "Slippage is het verschil tussen de prijs die je verwachtte en de prijs die je daadwerkelijk kreeg. Je ziet een token op een bepaalde prijs, maar tegen de tijd dat je order wordt uitgevoerd, vul je tegen een iets slechtere prijs. Het orderformulier van de bot heeft een veld Slippage-tolerantie waarin je instelt wat het meeste is dat je bereid bent te accepteren.",
        "Het gebeurt om twee hoofdredenen. Ten eerste bewegen prijzen tussen het moment dat je beslist en het moment dat je order binnenkomt; iemand anders kan eerder handelen. Ten tweede kan je order groter zijn dan het volume op de beste prijs, waardoor hij in slechtere niveaus dieper in het orderboek bijt om volledig gevuld te raken.",
        "De InfoTip van de app zegt het onomwonden: slippage is het maximale procentuele verschil tussen de verwachte prijs en de werkelijke uitvoeringsprijs dat je bereid bent te accepteren. Te krap instellen kan je trade annuleren; te ruim instellen laat je vullen tegen een slechte prijs. Het is een vangrail die je per trade afstelt.",
      ],
      example: "Je wil 10.000 XLM kopen en de beste ask is 0.119 USDC, maar daar ligt maar 3.000 XLM. De volgende 7.000 vullen tegen 0.120. Je gemiddelde prijs wordt ongeveer 0.1197, net boven de 0.119 die je zag. Als je Slippage-tolerantie op 0.5 procent stond, zou deze beweging van 0.6 procent de order annuleren in plaats van te vullen.",
    },
    {
      id: "c2-l5",
      title: "Wat is liquiditeit en waarom is het belangrijk?",
      paragraphs: [
        "Liquiditeit is hoeveel je nabij de huidige prijs kunt verhandelen zonder hem te verschuiven. Een liquide markt heeft veel volume dicht op elkaar gestapeld aan beide kanten van het orderboek, zodat zelfs een flinke order met weinig slippage vult. Een dunne markt heeft alleen kleine orders, dus elke trade van behoorlijke omvang verschuift de prijs scherp.",
        "De bot volgt het handelsvolume van elke markt over de laatste 24 uur en behandelt dat als een gezondheidscheck. Als een markt te dun is, weigert hij daar simpelweg te handelen, omdat de spread en slippage elke edge onrendabel zouden maken en er weer netjes uit raken lastig kan zijn.",
        "Voor jou als handmatige trader is liquiditeit de reden waarom twee markten op dezelfde prijs compleet anders kunnen aanvoelen. Een diep boek laat je met vertrouwen handelen; een ondiep boek betekent dat je eigen order datgene is wat de prijs tegen je in beweegt. Werp altijd een blik op de diepte in het Orderboek-paneel voordat je een trade groot maakt.",
      ],
      example: "XLM en USDC zouden 800.000 USDC aan volume over 24 uur kunnen tonen met duizenden XLM op elk prijsniveau, waardoor een order van 5.000 XLM hem nauwelijks verschuift. Een minuscuul token met maar 200 USDC aan dagelijks volume en 50 eenheden per niveau zou bij dezelfde order alle kanten op schieten, dus de bot zou het volledig overslaan als te dun.",
    },
  ],
  quiz: [
    {
      id: "c2-q1",
      prompt: "Wat toont de groene kant in het Orderboek-paneel van de bot en hoe is die geordend?",
      options: [
        {
          text: "Bids van kopers, met de hoogste prijs bovenaan.",
          explanation: "Correct. Groen zijn de bids, gesorteerd op hoogste eerst, zodat de beste koopprijs bovenaan het boek staat.",
        },
        {
          text: "Asks van verkopers, met de laagste prijs bovenaan.",
          explanation: "Onjuist. Asks staan aan de rode kant; de laagste ask is de beste verkoopprijs, maar dat is niet de groene lijst.",
        },
        {
          text: "Voltooide trades van het laatste uur, nieuwste eerst.",
          explanation: "Onjuist. Het orderboek toont openstaande orders, niet een geschiedenis van vroegere trades.",
        },
        {
          text: "De AMM-poolsaldi die de markt ondersteunen.",
          explanation: "Onjuist. Deze bot handelt het SDEX-orderboek, niet AMM-pools, dus er worden hier geen poolsaldi getoond.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c2-q2",
      prompt: "De beste bid voor XLM is 0.117 USDC en de beste ask is 0.119 USDC. Wat is de spread, en waarom is hij belangrijk?",
      options: [
        {
          text: "Het is 0.236 USDC, de som van beide prijzen, en het is de winst die je per trade maakt.",
          explanation: "Onjuist. Spread is het verschil, niet de som, en het is een kost die je betaalt, geen winst.",
        },
        {
          text: "Er is geen spread omdat beide getallen dicht bij elkaar liggen, dus handelen is gratis.",
          explanation: "Onjuist. Elk verschil tussen de beste bid en de beste ask is een echte spread en een echte kost.",
        },
        {
          text: "Het is 0.002 USDC, het verschil tussen beste bid en ask, en het is een verborgen kost per trade.",
          explanation: "Correct. 0.119 min 0.117 is 0.002; kopen op de ask en verkopen op de bid kost je die spread.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c2-q3",
      prompt: "Waarom treedt slippage op wanneer je een grotere order plaatst?",
      options: [
        {
          text: "De exchange rekent een boete aan voor orders boven een vaste omvang.",
          explanation: "Onjuist. Slippage is geen vaste boete; het komt voort uit hoe het orderboek vult.",
        },
        {
          text: "De order eet door het beste prijsniveau heen en vult de rest tegen slechtere prijzen dieper in het boek.",
          explanation: "Correct. Als je omvang het volume op de beste prijs overstijgt, vult de rest tegen slechtere niveaus, waardoor je gemiddelde prijs verslechtert.",
        },
        {
          text: "De bot verslechtert je prijs opzettelijk om de spread voor zichzelf binnen te halen.",
          explanation: "Onjuist. Slippage komt voort uit beperkte diepte en bewegende prijzen, niet doordat de bot tegen je werkt.",
        },
        {
          text: "Slippage treedt alleen op bij piepkleine orders, nooit bij grote.",
          explanation: "Onjuist. Grotere orders hebben meer kans op slippage, omdat ze het volume op de beste prijs makkelijker uitputten.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c2-q4",
      prompt: "Waarom weigert de bot te handelen in een markt met heel laag 24-uursvolume?",
      options: [
        {
          text: "Laag volume betekent dat het token gloednieuw is en nog niet genoteerd op de SDEX.",
          explanation: "Onjuist. Een markt kan genoteerd zijn en toch dun zijn; laag volume gaat over diepte, niet over noteringsstatus.",
        },
        {
          text: "Dunne liquiditeit betekent brede spreads en zware slippage, waardoor elke edge wordt opgegeten en netjes uitstappen moeilijk is.",
          explanation: "Correct. Zonder diepte nabij de prijs maken de spread- en slippagekosten trades onrendabel en risicovol om af te wikkelen.",
        },
        {
          text: "Laag volume betekent altijd dat de prijs op het punt staat te crashen.",
          explanation: "Onjuist. Dun volume voorspelt geen richting; het voorspelt hogere handelskosten en moeite met uitstappen.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
