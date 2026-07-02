// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Advanced chapter on On-Chain Data: reading wallet activity, whale moves, and
// TVL to look under the market's hood and sanity-check the AI's suggestions.
// Authored to the exact same shape as content/en/chapter22.ts, with the
// per-chapter `whoFor` one-liner typed via a local intersection so the live
// Chapter interface stays untouched until integration. This chapter owns no new
// glossary terms; it reuses terms already taught in earlier chapters.
import type { Chapter } from "../../types";

export const chapter30: Chapter & { whoFor: string } = {
  id: "c30",
  number: 30,
  level: "ADVANCED",
  whoFor: "Voor traders die onder de motorkap van de markt willen kijken",
  title: "On-chain data",
  description:
    "Wat on-chain data is, wat actieve wallets, whale-bewegingen en TVL onthullen over een token, en hoe je die signalen gebruikt om de suggesties van de AI te toetsen.",
  lessons: [
    {
      id: "c30-l1",
      title: "Wat is on-chain data en waarin verschilt het van marktdata?",
      paragraphs: [
        "Marktdata beschrijft de prijs: de laatste trade, de bied- en laatprijs, het volume, de candlesticks die je op de tokendetailpagina ziet onder de tabbladen uur, dag, week en jaar. Het vertelt je waarvoor een token verhandeld wordt en hoeveel ervan van eigenaar is gewisseld. On-chain data beschrijft iets heel anders: wie het asset daadwerkelijk aanhoudt en verplaatst. Omdat Stellar een openbaar grootboek is, wordt elk account, elke trustline, elke betaling en elke trade permanent vastgelegd en kan iedereen dat teruglezen.",
        "De twee beantwoorden verschillende vragen. Marktdata beantwoordt wat de prijs op dit moment doet. On-chain data beantwoordt wie er achter die prijs zit. Een token kan een stijgende grafiek hebben terwijl slechts een handvol wallets het onder elkaar heen en weer schuift, of een vlakke grafiek terwijl duizenden nieuwe houders stilletjes trustlines openen. De prijs alleen verbergt dat; het grootboek niet.",
        "De praktische waarde is dat on-chain data op grote schaal moeilijk te vervalsen is en dat het voorloopt in plaats van volgt. Een grote houder die geld verplaatst, een golf nieuwe trustlines, of liquiditeit die uit een pool wegloopt, gebeurt allemaal on-chain voordat het volledig in de prijs zichtbaar wordt. Het grootboek lezen is hoe je controleert of een beweging gedragen wordt door echte deelname of gewoon een dunne prijsrimpeling is. Zie het als onder de motorkap van de markt kijken in plaats van alleen naar de snelheidsmeter.",
      ],
      example:
        "Twee tokens tonen allebei een grafiek die deze week is verdubbeld. Token A deed dat op trades tussen zes wallets die elkaar blijven verkopen; token B deed dat terwijl driehonderd nieuwe accounts trustlines openden en kleine bedragen kochten. De candlesticks zien er bijna identiek uit, maar het on-chain beeld is tegengesteld: A is een gesloten kringloop, B is echte adoptie. Alleen het grootboek, niet de prijsgrafiek, vertelt je welke van de twee het is.",
    },
    {
      id: "c30-l2",
      title: "Wat vertelt het aantal actieve wallets je over een token?",
      paragraphs: [
        "Het aantal wallets dat een token aanhoudt, en hoeveel daarvan actief transacties uitvoeren, is een van de duidelijkste adoptiesignalen on-chain. Een token dat door duizenden onafhankelijke accounts wordt aangehouden die het regelmatig verhandelen en overmaken, heeft een echte gebruikersbasis; een token dat in vijf wallets zit die nooit bewegen, heeft dat niet, wat de prijs ook zegt. Op Stellar is het aantal trustlines hiervoor een directe indicator: omdat je een trustline moet openen voordat je een niet-oorspronkelijk token kunt aanhouden, is het aantal trustlines ruwweg gelijk aan het aantal accounts dat ervoor koos het aan te houden.",
        "Dit is precies een van de gegevens die de app al gebruikt. De tokenscore combineert Horizon-trade-aggregaties, orderboekdiepte en het aantal trustlines als adoptiemaatstaf, en de liquiditeitsscanner onderzoekt tokens om in te schatten hoe verhandelbaar en hoe breed aangehouden ze zijn. Wanneer je een AI-trustline-suggestie leest, is de adoptiescore die erachter zit deels dit beeld van wallets en trustlines, over twaalf weken gevolgd, zodat je kunt zien of houders erbij komen of vertrekken.",
        "Het voorbehoud betreft sybil-wallets. Niets houdt één persoon tegen om honderden accounts en trustlines te openen om adoptie te veinzen, en het aanmaken van een Stellar-account is goedkoop. Ruwe aantallen kunnen dus opgeblazen zijn. De verdediging is om spreiding zwaarder te laten wegen dan het aantal (zijn de bezittingen verdeeld over veel onafhankelijke wallets of geconcentreerd in enkele), en om naar de trend te kijken in plaats van naar de momentopname: gestage organische groei is moeilijker te vervalsen dan een piek van één dag met bijna identieke nieuwe accounts. Behandel een stijgend aantal trustlines als ondersteunend bewijs, niet als bewijs.",
      ],
      example:
        "De liquiditeitsscanner brengt een token in beeld waarvan het aantal trustlines in één week van 400 naar 1.600 sprong. Op het eerste gezicht bemoedigend. Maar bij nader inzien werden de 1.200 nieuwe trustlines allemaal binnen hetzelfde uur aangemaakt, door accounts die vanuit één bron werden gefinancierd en die daarna nooit meer handelden. Dat is een sybil-patroon: één actor die de schijn van adoptie fabriceert. Een token dat in plaats daarvan 1.200 trustlines gestaag over het venster van twaalf weken toevoegde, verdeeld over onafhankelijk gefinancierde wallets die daadwerkelijk handelen, is het veel sterkere adoptiesignaal.",
    },
    {
      id: "c30-l3",
      title: "Wat zijn whale-bewegingen en waarom volgen traders ze?",
      paragraphs: [
        "Een whale is een wallet die groot genoeg is dat zijn bewegingen op zichzelf een markt kunnen verschuiven. Omdat het grootboek openbaar is, kun je deze wallets volgen: een whale die een groot saldo naar een bekend exchange- of uitgeversadres stuurt, een trustline opent of sluit, of liquiditeit toevoegt aan of onttrekt uit een AMM-pool. Traders volgen whales omdat een grote houder vaak over betere informatie beschikt of gewoon voldoende omvang heeft dat zijn actie alleen al de prijs beweegt. Een whale die een enorme hoeveelheid stort om te verkopen kan een daling voorafgaan; een whale die stilletjes accumuleert kan een stijging voorafgaan.",
        "De beweging lezen is belangrijker dan haar louter zien. Een overdracht naar een exchange of uitgever wijst op de intentie om te verkopen of in te wisselen. Een overdracht tussen twee wallets die dezelfde entiteit beheert, betekent dat er in werkelijkheid niets van eigenaar is gewisseld. Liquiditeit uit een pool onttrekken maakt de markt dunner en kan de volgende beweging versterken. De omvang ten opzichte van het normale volume van het token is wat een beweging betekenisvol maakt: een whale-grote overdracht in een dun verhandeld token is veel verstorender dan hetzelfde bedrag in een diepe, liquide markt.",
        "Het gevaar is blindelings volgen. Je kent zelden de werkelijke intentie van de whale, en sommige grote spelers seinen bewust valse bewegingen door om kleinere traders in de val te lokken. On-chain kan een beweging ook een interne herschikking, een custody-migratie of een collateral-operatie zijn die helemaal geen richtingsbetekenis heeft. Gebruik whale-activiteit als aanleiding om nauwkeuriger te kijken en om liquiditeit en je eigen risicotools te controleren, nooit als een automatisch koop- of verkoopsignaal. Als een whale-beweging je alleen doet willen handelen omdat het dringend voelt, dan is die drang FOMO, geen analyse.",
      ],
      example:
        "Je merkt op dat een wallet die 20% van de voorraad van een klein token aanhoudt, zijn volledige saldo naar een uitgeversadres in Circle-stijl stuurt, net wanneer het dagvolume voor dat token slechts een fractie van dat bedrag is. Dat is een betekenisvol signaal: een houder van die omvang die naar de uitgang koerst, kan het orderboek overspoelen en de prijs omlaag drijven. De gedisciplineerde reactie is niet om naast hem in paniek te verkopen, maar om de orderboekdiepte te controleren, je stop loss aan te scherpen of te bevestigen, en te beslissen of je oorspronkelijke these nog standhoudt — niet om de whale reflexmatig na te doen.",
    },
    {
      id: "c30-l4",
      title: "Wat is TVL (Total Value Locked)?",
      paragraphs: [
        "TVL, oftewel Total Value Locked, is de totale waarde van assets die in een pool of protocol zijn gestort, meestal uitgedrukt in USDC of in dollartermen. Voor één enkele AMM-pool is het de som van beide zijden van de pool; voor een heel protocol is het de som over al zijn pools en vaults. Op Stellar zie je TVL het meest direct in AMM-liquiditeitspools, die een poolvergoeding van 0,30% rekenen, en in Soroban-DeFi-protocollen zoals Blend, DeFindex en Soroswap. TVL is een omvang-en-vertrouwenssignaal: een pool met miljoenen vastgezet kan grotere trades opvangen met minder slippage, en een protocol waar mensen bereid zijn echt geld in vast te zetten heeft op zijn minst enig vertrouwen verdiend.",
        "Voor een trader is de nuttigste aflezing de diepte. Hogere TVL in de pool waartegen je handelt betekent meestal dat een market order de prijs minder beweegt, zodat je slippagetolerantie makkelijker te respecteren is. Dalende TVL is een waarschuwing: liquiditeit die een pool verlaat maakt hem dunner en elke volgende trade duurder en volatieler. De richting van de TVL over tijd volgen vertelt je vaak meer dan het absolute getal.",
        "TVL kent reële grenzen, dus behandel het niet als een veiligheidsbeoordeling. Het kan opgeblazen worden door één enkele whale of door mercenary capital dat achter een tijdelijke beloning aanjaagt, en het kan net zo snel weer vertrekken. Hoge TVL betekent niet dat de onderliggende contracten geaudit of veilig zijn; Soroban-protocollen dragen smart-contractrisico ongeacht hoeveel er is vastgezet. En een hoge dollar-TVL kan op zichzelf al schommelen simpelweg omdat de prijs van de gestorte assets bewoog, niet omdat iemand geld toevoegde of onttrok. Lees TVL als één gegeven over marktdiepte en interesse, getoetst aan het werkelijke orderboek en de poolsamenstelling — niet als bewijs van kwaliteit of veiligheid.",
      ],
      example:
        "Je wilt een middelgroot bedrag naar een token omwisselen en ziet twee routes: een AMM-pool met 2.000.000 USDC aan TVL en een andere met 40.000. De diepe pool kan je order vullen met beperkte slippage; de ondiepe zou de prijs enkele procenten tegen je in kunnen bewegen en je slippagetolerantie ver overschrijden. Maar een week later merk je dat de TVL van de diepe pool stilletjes tot 300.000 is gedaald doordat een grote aanbieder zich terugtrok. Hetzelfde token, maar de markt werd zojuist dunner — een signaal om kleiner in te stappen en de diepte opnieuw te controleren voordat je handelt, niet om aan te nemen dat de eerdere diepte nog bestaat.",
    },
    {
      id: "c30-l5",
      title: "Hoe je on-chain data gebruikt om AI-suggesties te beoordelen",
      paragraphs: [
        "De AI-analist stelt trades voor met een confidence-score van 0 tot 100, en de backend voert alleen voorstellen op of boven jouw drempel automatisch uit, onder voorbehoud van de handelslimiet en de drawdown-pauzepoort. On-chain data is hoe je die confidence met je eigen ogen toetst in plaats van het getal op goed vertrouwen aan te nemen. Vraag je voordat je een voorstel aanvaardt af of het on-chain beeld het ermee eens is: wordt het token door veel onafhankelijke wallets aangehouden, stijgt het aantal trustlines, is er genoeg TVL en orderboekdiepte om de trade binnen je slippagetolerantie te vullen, en wijzen eventuele whale-bewegingen de tegenovergestelde kant op dan de AI?",
        "De eigen scoring van de app verwerkt hier al veel van, en twee eerdere hoofdstukken behandelen precies hoe. Het hoofdstuk AI-trustline-suggesties lezen legt de wekelijkse, observe-only scan van de top-N plus aangehouden tokens uit, de vier scores per token, de twaalf weken geschiedenis en de verslechteringswaarschuwingen — en het benadrukt dat de app nooit automatisch een trustline toevoegt of verwijdert. Het hoofdstuk Tokenbeoordeling op de Stellar-chain legt uit hoe de score van een token wordt opgebouwd uit Horizon-trade-aggregaties, orderboekdiepte en op trustlines gebaseerde adoptie, plus de rode vlag van een ontbrekend stellar.toml-uitgeversbestand. In plaats van die te herhalen, gebruik je de on-chain lens van dit hoofdstuk om te bevestigen of uit te dagen wat die scores samenvatten.",
        "Wanneer on-chain data en de AI het oneens zijn, behandel dat dan als een reden om te vertragen, niet als een onmiddellijke overrule. Confidence gebouwd op dunne liquiditeit, een krimpende houdersbasis of een whale die naar de uitgang koerst, verdient meer scepsis dan de ruwe score suggereert; omgekeerd kan een bescheiden score, gedragen door brede adoptie en diepe TVL, steviger zijn dan hij lijkt. Wat je ook beslist, giet je conclusie in de tools van de app — positiegrootte, stop loss, doelprijs, en de invalidatieprijs waarvan de verhouding tussen beloning en risico de trade bepaalt — zodat de beslissing op regels berust in plaats van een onderbuikkeuze. On-chain data vervangt de AI of de scores niet; het is de onafhankelijke second opinion die je ervan weerhoudt een zelfverzekerd getal boven een dunne markt te vertrouwen. Niets hiervan is financieel advies.",
      ],
      example:
        "De AI stelt voor een token te kopen met confidence 82, boven je drempel, zodat het automatisch zou worden uitgevoerd. Je controleert eerst on-chain: het aantal trustlines is drie weken op rij gedaald, de TVL van de belangrijkste AMM-pool is gehalveerd, en een top-tien-houder heeft zojuist een groot saldo naar een uitgeversadres gestuurd. Drie onafhankelijke on-chain signalen wijzen allemaal de andere kant op dan het optimisme van de AI. Je zet de AI niet zomaar uit — je verlaagt je positiegrootte, stelt een strakkere stop loss in, en bevestigt de invalidatieprijs zodat de verhouding tussen beloning en risico de trade nog rechtvaardigt. De score gaf je een beginnend oordeel; het grootboek zei je de trade kleiner en met strakkere beveiligingen te doen.",
    },
  ],
  quiz: [
    {
      id: "c30-q1",
      prompt: "Wat is het belangrijkste verschil tussen marktdata en on-chain data?",
      options: [
        {
          text: "Marktdata toont de prijs en het volume, terwijl on-chain data toont wie het asset daadwerkelijk aanhoudt en verplaatst op het openbare grootboek.",
          explanation:
            "Juist. Marktdata beantwoordt wat de prijs doet; on-chain data beantwoordt wie er achter die prijs zit — houders, trustlines, overdrachten en poolactiviteit die de prijs alleen verbergt.",
        },
        {
          text: "Marktdata is openbaar en verifieerbaar, terwijl on-chain data privé is en alleen exchanges die kunnen zien.",
          explanation:
            "Andersom. On-chain data is het openbare deel: het grootboek van Stellar legt elk account, elke trustline, elke betaling en elke trade vast, voor iedereen om te lezen. Marktdata is wat daarbovenop wordt geaggregeerd.",
        },
        {
          text: "Het is hetzelfde, getoond in twee verschillende kleuren op de tokendetailpagina.",
          explanation:
            "Nee. De candlesticks en volumetabbladen zijn marktdata; on-chain data is een aparte kijk op deelname waarover twee identiek ogende grafieken het volledig oneens kunnen zijn.",
        },
        {
          text: "On-chain data loopt altijd achter op de prijs, dus is het pas nuttig nadat een beweging voorbij is.",
          explanation:
            "Het tegenovergestelde komt dichter bij de waarheid. Whale-overdrachten, trustline-golven en liquiditeitsveranderingen gebeuren vaak on-chain voordat ze volledig in de prijs zichtbaar worden, en juist daarom kan het grootboek voorlopen in plaats van volgen.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c30-q2",
      prompt: "Het aantal trustlines van een token springt in één uur van 400 naar 1.600, allemaal van accounts die door één bron gefinancierd zijn en daarna nooit handelen. Wat wijst dit hoogstwaarschijnlijk aan?",
      options: [
        {
          text: "Sterke, echte adoptie die je meteen moet vertrouwen.",
          explanation:
            "Niet op basis van dit patroon. Echte adoptie groeit doorgaans gestaag aan over onafhankelijk gefinancierde wallets die daadwerkelijk transacties uitvoeren, niet in een uitbarsting van één uur vanuit één financieringsbron.",
        },
        {
          text: "Een sybil-patroon — één actor die de schijn van adoptie fabriceert met veel goedkope accounts.",
          explanation:
            "Juist. Omdat het openen van een Stellar-account en trustline goedkoop is, kan één persoon het aantal veinzen. Dezelfde bron, hetzelfde uur en geen daaropvolgende handel zijn klassieke sybil-tekenen; laat spreiding en trend zwaarder wegen dan ruwe aantallen.",
        },
        {
          text: "Dat de liquiditeitsscanner kapot is, aangezien het aantal trustlines niet zo snel kan veranderen.",
          explanation:
            "Nee. Het aantal trustlines kan werkelijk zo snel pieken; de scanner rapporteert echte grootboekactiviteit. De vraag is of die activiteit organisch is, en hier is dat niet zo.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c30-q3",
      prompt: "Je ziet een whale 20% van de voorraad van een klein, dun verhandeld token naar een uitgeversadres in exchange-stijl sturen. Wat is de gedisciplineerde reactie?",
      options: [
        {
          text: "Meteen alles verkopen, want whales weten altijd het beste.",
          explanation:
            "Nee. Je kent zelden de werkelijke intentie van een whale, en sommige lokken bewust kleinere traders in de val. De beweging reflexmatig naspelen is blindelings volgen, wat het grootste gevaar is bij whale-watching.",
        },
        {
          text: "Het volledig negeren, aangezien één wallet nooit de prijs van een klein token kan beïnvloeden.",
          explanation:
            "Fout naar de andere kant. Een whale-grote overdracht in een dun verhandeld token is juist het geval dat het orderboek kan overspoelen en de prijs hard kan bewegen, dus het mag niet genegeerd worden.",
        },
        {
          text: "Het behandelen als aanleiding om nauwkeuriger te kijken: controleer de orderboekdiepte, bevestig je stop loss, en beslis of je these nog standhoudt.",
          explanation:
            "Juist. Whale-activiteit is een signaal om te onderzoeken en risico te beheren, geen automatische koop of verkoop. Verifieer de diepte en steun op je eigen risicotools in plaats van op urgentie te reageren.",
        },
        {
          text: "Aannemen dat het een interne herschikking zonder betekenis is en helemaal niets doen.",
          explanation:
            "Te achteloos. Het zou een interne beweging kunnen zijn, maar een overdracht naar een uitgevers- of exchange-adres wijst op de intentie om te verkopen of in te wisselen — reden om nauwkeuriger te kijken, niet om aan te nemen dat het niets is.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c30-q4",
      prompt: "Welke uitspraak over TVL (Total Value Locked) klopt?",
      options: [
        {
          text: "Hoge TVL bewijst dat de contracten van een protocol geaudit en veilig in gebruik zijn.",
          explanation:
            "Nee. TVL is een omvang-en-interessesignaal, geen veiligheidsbeoordeling. Soroban-protocollen dragen smart-contractrisico ongeacht hoeveel er is vastgezet, en TVL kan opgeblazen worden door één enkele whale of door mercenary capital.",
        },
        {
          text: "Hogere TVL in de pool waartegen je handelt betekent over het algemeen minder slippage, maar het kan snel vertrekken en garandeert geen kwaliteit.",
          explanation:
            "Juist. Diepere pools vangen grotere trades op met minder prijsimpact, maar TVL kan snel weglopen, opgeblazen zijn door één aanbieder, of schommelen enkel omdat de prijzen van de gestorte assets bewogen — lees het als één gegeven, getoetst aan de werkelijke diepte.",
        },
        {
          text: "TVL verandert alleen wanneer de prijs van de vastgezette assets verandert, nooit door stortingen of onttrekkingen.",
          explanation:
            "Onvolledig en misleidend. Prijsbewegingen verschuiven inderdaad een in dollars uitgedrukte TVL, maar stortingen en onttrekkingen veranderen die ook — een grote aanbieder die liquiditeit terugtrekt is een veelvoorkomende en belangrijke oorzaak van dalende TVL.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
