import type { Chapter } from "../../types";

export const chapter10: Chapter = {
  id: "c10",
  number: 10,
  level: "EXPERT",
  title: "AI-trading",
  description: "Hoe de analist voorstellen genereert, welke data daarachter zit, en hoe je ze leest, accepteert, afwijst en combineert met handmatige trades.",
  lessons: [
    {
      id: "c10-l1",
      title: "Hoe genereert de AI trade-voorstellen?",
      paragraphs: [
        "De bot roept een AI-model aan dat de analist heet. Je kiest een provider uit een dropdown, zoals Anthropic Claude, OpenAI of DeepSeek, en alleen providers met een ingestelde sleutel zijn selecteerbaar. De analist draait niet continu. Hij draait wanneer je op Scan de chain drukt, wanneer je een enkel paar analyseert, of op de auto-scan-timer als je die hebt ingeschakeld.",
        "Bij elke run krijgt de analist een momentopname van de markt en je account aangereikt, en levert hij nul of meer voorstellen terug. Elk voorstel is een gestructureerd object, geen vrije tekst, zodat de app er iets mee kan doen. Het bevat een richting van buy of sell, het base- en quote-asset, een hoeveelheid, een limietprijs, een max slippage, een geschreven reden, en een confidence van laag, gemiddeld of hoog. Het kan ook een doelprijs, een invalidatieprijs en een hint over de aanhoudhorizon toevoegen.",
        "Een cooldown voorkomt dat de analist hetzelfde paar en dezelfde richting te snel opnieuw voorstelt, zodat je niet wordt overspoeld met hetzelfde idee. Als de analist niets ziet om op te handelen, levert hij voor dat paar gewoon geen voorstel terug.",
      ],
      example: "Je drukt op Scan de chain. De analist bekijkt XLM/USDC en levert een voorstel: richting buy, hoeveelheid 40 XLM, limietprijs 0.1180 USDC, max slippage 0.5 procent, confidence gemiddeld, reden de ask is dunner geworden en de laatste drie dips werden binnen minuten teruggekocht.",
    },
    {
      id: "c10-l2",
      title: "Welke data gebruikt de AI om beslissingen te nemen?",
      paragraphs: [
        "De analist weet alleen wat de app hem voert. Hij ziet het live order book, oftewel de beste bid en ask plus de zichtbare depth, samen met het 24u-volume en recente OHLC-candles voor het paar. Dat vertelt hem waar de prijs staat, hoe krap de spread is, en hoeveel size het orderboek kan opnemen.",
        "Hij ziet ook jouw situatie: je huidige holdings, je openstaande offers, de gerealiseerde winst en verlies van vandaag, en de ongerealiseerde winst en verlies op een eventuele open positie. Een voorstel wordt dus gevormd door wat je al bezit, niet alleen door de grafiek.",
        "Tot slot ziet hij recente trades en, belangrijk, hoe de prijs na elk daarvan bewoog, plus de effectieve size-limiet per trade. De uitkomsten na de trade laten hem inschatten of recente entries echt werkten, en de size-limiet houdt zijn voorgestelde hoeveelheid binnen wat het beleid toestaat.",
      ],
      example: "Inputs voor een XLM/USDC-run: beste bid 0.1176, beste ask 0.1182, 24u-volume 92,000 XLM, holdings 600 XLM en 0 USDC, geen openstaande offers, gerealiseerde PnL vandaag plus 1.20 USDC, de laatste twee buys wonnen er daarna elk ongeveer 0.3 procent bij, limiet per trade 50 XLM. De analist stelt een hoeveelheid van 40 XLM voor, ruim onder de limiet.",
    },
    {
      id: "c10-l3",
      title: "Hoe interpreteer je een AI-voorstel",
      paragraphs: [
        "Lees eerst de richting. Buy betekent dat de analist het base-asset wil verwerven door het quote-asset uit te geven; sell betekent het omgekeerde. De limietprijs is de slechtste prijs die hij accepteert, en max slippage begrenst hoe ver de fill mag afwijken, dus samen begrenzen ze hoe slecht de uitvoering kan worden.",
        "Lees daarna de reden. Een goede reden sluit aan op de data die je in de vorige les zag, bijvoorbeeld een dunner wordende ask, een teruggekochte dip, of stijgend volume. Een vage reden is op zichzelf al een waarschuwingssignaal. De optionele doel- en invalidatieprijzen vertellen je waar de analist winst verwacht te nemen en waar het idee fout zit, wat jouw exit-kaart is.",
        "Confidence is de eigen overtuiging van de analist, geen kans. Behandel lage confidence als een voorzichtig idee, gemiddeld als een normaal signaal, en hoog als een sterk signaal. Confidence overschrijft nooit het beleid: de backend handhaaft nog steeds limieten, slippage en saldo voordat er iets wordt ingediend.",
      ],
      example: "Een sell-voorstel luidt: sell 30 XLM, limiet 0.1205 USDC, max slippage 0.4 procent, doel 0.1205, invalidatie 0.1240, confidence hoog, reden de weerstand hield twee keer stand op 0.1208 bij dalend volume. Je ziet het plan: winst nemen rond 0.1205, het idee laten varen als de prijs 0.1240 herovert.",
    },
    {
      id: "c10-l4",
      title: "Wanneer accepteer je en wanneer wijs je een voorstel af",
      paragraphs: [
        "Je twee goedkeuringsmodi voor trading gedragen zich verschillend. In de modus elke trade goedkeuren wacht elk voorstel tot je op Goedkeuren of Afwijzen drukt, ongeacht de confidence. In auto-trade-modus voeren alleen voorstellen met gemiddelde en hoge confidence zichzelf automatisch uit; een lage of ontbrekende confidence wacht nog steeds op je handmatige goedkeuring.",
        "Er is in beide modi een consistente uitzondering. Risicoverlagende exits, zoals een stop-close die een open positie verkleint, worden meteen uitgevoerd. De app laat je niet zitten wachten om het uitstappen uit een verliesgevende trade goed te keuren.",
        "Wanneer je de beslissing wel zelf neemt, toets je de reden aan de data, controleer je of de limietprijs en slippage redelijk zijn, en bevestig je dat je het saldo dat de trade nodig heeft daadwerkelijk bezit. Wijs af wanneer de reden mager is, wanneer de limietprijs al is weggelopen, of wanneer het voorstel je te zeer in een asset zou concentreren. De backend blokkeert een onmogelijke trade sowieso, maar vroeg afwijzen houdt je historie schoon.",
      ],
      example: "In auto-trade-modus stelt de analist voor om 40 XLM te kopen op 0.1180, confidence hoog. Omdat het hoge confidence is, voert het zichzelf uit via de veiligheidspoorten. Even later stelt hij voor om 20 XLM te verkopen op 0.1240, confidence laag; die pauzeert en wacht in de wachtrij tot jij Goedkeurt of Afwijst.",
    },
    {
      id: "c10-l5",
      title: "Hoe AI en handmatig handelen samenwerken",
      paragraphs: [
        "De analist doet altijd alleen voorstellen. Het is de backend die het beleid handhaaft en handelt: hij controleert de limiet per trade, de max slippage, je saldo en de kill switch, en tekent en dient dan de order in. Elke handmatige trade die je met de hand plaatst gaat door precies dezelfde veiligheidspoorten, dus een handmatige order kan nooit een controle omzeilen die een AI-order wel respecteert.",
        "De trading-modus geldt voor beide bronnen gelijk. In Alleen-lezen observeert en stelt de app voor maar handelt hij nooit, in Paper simuleert hij fills, en in Live dient hij echte on-chain orders in. De kill switch staat boven alles en blokkeert alle handel, AI en handmatig gelijk.",
        "Omdat beide stromen door een engine lopen, labelt de historietabel elke fill als Handmatig of Bot, zodat je ze achteraf uit elkaar kunt houden. Je kunt een handmatige trade doen terwijl de analist actief is; ze delen je saldi en limieten, dus een handmatige buy verkleint de ruimte die overblijft onder je size-limiet voor het volgende idee van de analist.",
      ],
      example: "De modus is Live, de goedkeuring is auto-trade. Je verkoopt handmatig 100 XLM voor USDC. De analist stelt vervolgens een buy met gemiddelde confidence voor; die voert zichzelf uit, maar pas nadat de saldocontrole vooraf bevestigt dat de USDC die je net ontving het dekt. De historietabel toont je sell gelabeld als Handmatig en de buy gelabeld als Bot.",
    },
  ],
  quiz: [
    {
      id: "c10-q1",
      prompt: "Wanneer draait de analist daadwerkelijk en produceert hij voorstellen?",
      options: [
        { text: "Continu op de achtergrond bij elke prijstick.", explanation: "Onjuist. De analist is geen streaming-proces; hij draait alleen op specifieke triggers, niet bij elke tick." },
        { text: "Wanneer je de chain scant, een paar analyseert, of op de auto-scan-timer.", explanation: "Juist. Dat zijn de drie triggers die de analist aanroepen." },
        { text: "Maar een keer bij het opstarten, daarna cachet hij een vast plan voor de dag.", explanation: "Onjuist. Er is geen eenmalig dagplan; elke run produceert verse voorstellen op basis van een actuele momentopname." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q2",
      prompt: "Welke van deze ontvangt de analist NIET als input?",
      options: [
        { text: "Het live order book, het 24u-volume en de OHLC-candles.", explanation: "Onjuist. Deze marktinputs maken deel uit van de momentopname die hij ziet." },
        { text: "Je holdings, openstaande offers en de gerealiseerde en ongerealiseerde PnL van vandaag.", explanation: "Onjuist. De staat van je account wordt aangereikt zodat voorstellen passen bij wat je bezit." },
        { text: "De waarde van je provider-API-sleutel zodat hij zichzelf opnieuw kan factureren.", explanation: "Juist. De ruwe sleutel maakt nooit deel uit van de beslissingsinputs van de analist; hij wordt alleen gebruikt om de provider-aanroep te authenticeren." },
        { text: "Recente trades, hoe de prijs daarna bewoog, en de size-limiet per trade.", explanation: "Onjuist. Dit zijn inputs; de uitkomsten na de trade en de limiet vormen zijn oordeel en sizing." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q3",
      prompt: "Wat stelt het confidence-veld van laag, gemiddeld of hoog op een voorstel voor?",
      options: [
        { text: "Een gegarandeerde winstkans die de backend gebruikt om de order te sizen.", explanation: "Onjuist. Het is geen kans en het bepaalt niet de size; de limiet per trade doet dat." },
        { text: "De eigen overtuiging van de analist in het idee, die nooit de beleidspoorten overschrijft.", explanation: "Juist. Het geeft aan hoe sterk de analist in het idee gelooft, maar limieten, slippage en saldo worden nog steeds gehandhaafd." },
        { text: "Hoe snel de order on-chain zal fillen.", explanation: "Onjuist. Fill-snelheid gaat over liquiditeit en prijs, niet over het confidence-label." },
      ],
      correctIndex: 1,
    },
    {
      id: "c10-q4",
      prompt: "In auto-trade-modus, welke voorstellen voeren zichzelf uit?",
      options: [
        { text: "Elk voorstel, ongeacht de confidence.", explanation: "Onjuist. Dat beschrijft de modus elke trade goedkeuren, niet auto-trade." },
        { text: "Alleen voorstellen met lage confidence, omdat die het minst riskant zijn.", explanation: "Onjuist. Het is omgekeerd; lage of ontbrekende confidence wacht op je goedkeuring." },
        { text: "Voorstellen met gemiddelde en hoge confidence, terwijl lage of ontbrekende confidence op goedkeuring wacht.", explanation: "Juist. Auto-trade voert gemiddeld en hoog automatisch uit; lage of ontbrekende confidence pauzeert voor jou. Risicoverlagende exits worden altijd meteen uitgevoerd." },
        { text: "Geen enkele; auto-trade ontwerpt alleen orders en dient ze nooit in.", explanation: "Onjuist. Auto-trade dient kwalificerende voorstellen wel in; dat is het doel ervan." },
      ],
      correctIndex: 2,
    },
    {
      id: "c10-q5",
      prompt: "Hoe bestaan AI-voorstellen en handmatige trades samen in de app?",
      options: [
        { text: "Beide lopen door dezelfde backend-veiligheidspoorten en worden in de historie gelabeld als Handmatig of Bot.", explanation: "Juist. Een engine handhaaft limieten, slippage, saldo en de kill switch voor beide, en de historie tagt elke fill op bron." },
        { text: "Handmatige trades slaan de veiligheidspoorten over zodat je sneller kunt handelen.", explanation: "Onjuist. Handmatige orders gaan door precies dezelfde controles als AI-orders; niets omzeilt ze." },
        { text: "De kill switch blokkeert AI-trades maar laat handmatige trades door.", explanation: "Onjuist. De kill switch blokkeert alle handel, AI en handmatig gelijk." },
        { text: "AI- en handmatige trades gebruiken aparte saldi die elkaar nooit beinvloeden.", explanation: "Onjuist. Ze delen je saldi en limieten, dus een handmatige trade verkleint de ruimte die overblijft voor de volgende order van de analist." },
      ],
      correctIndex: 0,
    },
  ],
};
