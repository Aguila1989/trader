import type { Chapter } from "../../types";

export const chapter11: Chapter = {
  id: "c11",
  number: 11,
  level: "EXPERT",
  title: "Risico-instellingen en de AI",
  description: "Hoe instelbare policy-limieten elke trade vormgeven, en hoe conservatieve of agressieve waarden een risicoprofiel uitdrukken.",
  lessons: [
    {
      id: "c11-l1",
      title: "Wat zijn risicofactoren en waarom doen ze ertoe?",
      paragraphs: [
        "Risicofactoren zijn de policy-limieten die tussen de bot en je wallet in staan. Voordat er een order uitgaat, wordt het voorstel getoetst aan elke limiet. Breekt het er een, dan wordt de trade geweigerd, verkleind of helemaal geblokkeerd. Deze controles bestaan omdat een enkele te grote of slecht getimede trade meer schade kan aanrichten dan tientallen kleine goede.",
        "Zie ze als vangrails, niet als een strategie. Ze bepalen niet wat je koopt; ze bepalen hoeveel, hoe vaak en onder welke marktomstandigheden de bot mag handelen. Een winstgevend signaal dat met een vreselijke spread binnenkomt, of nadat het dagelijkse verliesbudget op is, wordt alsnog afgewezen.",
        "Elke limiet heeft een verstandige standaardwaarde, maar die standaarden mag je zelf aanpassen. Strakker zetten verlaagt het ergste dat je op een dag kunt overkomen; losser zetten laat de bot meer kansen najagen, ten koste van grotere mogelijke drawdowns.",
      ],
      example: "Met maxAmountPerTrade ingesteld op 10 basiseenheden en maxDailyLoss op 25 XLM kan de bot nooit meer dan 10 in een enkele positie steken, en stopt hij met het openen van nieuwe trades zodra de dag 25 XLM heeft verloren, hoe overtuigend een signaal er ook uitziet.",
    },
    {
      id: "c11-l2",
      title: "Wat regelt elke risicofactor in deze app?",
      paragraphs: [
        "De omvang wordt afgetopt door maxAmountPerTrade, met een hoger plafond voor blue-chip stablecoin-paren, zodat een vertrouwde XLM/USDC-trade groter mag zijn dan een exotische. De activiteit wordt begrensd door maxTradesPerDay en maxDailyVolume, die voorkomen dat de bot blijft doorhandelen. Het totale risico dat tegelijk uitstaat blijft onder maxOpenExposure, en een per-paar-multiplier beperkt hoe geconcentreerd een enkel paar mag worden.",
        "De fill-kwaliteit wordt beschermd door maxSlippageBps en maxEntrySpreadBps. Als de verwachte prijsbeweging op de fill je slippage-tolerantie overschrijdt, of het order book breder is dan je spread-limiet, weigert de bot in plaats van te veel te betalen. Deze houden stilletjes de slechtste uitvoeringen tegen.",
        "De structuur van een trade wordt bepaald door stopLossPct, de backstop-afstand onder de entry, en minRiskReward, de minimale reward-to-risk-verhouding gemeten ten opzichte van het invalidatieniveau. Het dagelijkse verliesbudget, maxDailyLoss, schaalt bovendien automatisch de positiegrootte af naarmate de verliezen oplopen, voordat nieuwe entries worden stilgelegd.",
      ],
      example: "Standaarden van maxAmountPerTrade 10 (50 voor blue-chip-paren), maxDailyVolume 500 XLM, maxTradesPerDay 100, maxOpenExposure 150 XLM met een 3x per-paar-multiplier, maxSlippageBps 50 (0,5%), maxEntrySpreadBps 100 (1%), stopLossPct 5% en minRiskReward 1,2 vormen samen een uitgebalanceerde policy.",
    },
    {
      id: "c11-l3",
      title: "LOW versus MEDIUM versus HIGH — wat verandert er op elk niveau?",
      paragraphs: [
        "Er is geen enkele LOW-, MEDIUM- of HIGH-risicoknop of dropdown in deze app. Een risicoprofiel is niet een enkele schakelaar; het is de algehele vorm die je krijgt door conservatieve, gebalanceerde of agressieve waarden te kiezen voor alle bovenstaande limieten. LOW, MEDIUM en HIGH zijn slechts namen die we aan die combinaties geven.",
        "Een LOW-profiel betekent kleinere caps per trade, een kleiner dagelijks verliesbudget, strakkere exposure- en slippage-limieten, en een ruimere stop loss-buffer om niet uitgeschud te worden. Een HIGH-profiel is het tegenovergestelde: grotere trades, een groter verliesbudget, lossere exposure en slippage, en een strakkere stop. MEDIUM zit ertussenin, dicht bij de standaarden.",
        "Verwar dit niet met de per-voorstel-confidence van de AI, die ook laag, medium of hoog wordt genoemd. Die confidence beschrijft hoe sterk de AI in een specifieke trade gelooft. In auto-trade-modus worden alleen voorstellen met medium en hoge confidence automatisch uitgevoerd. Confidence is de AI die een trade beoordeelt; een risicoprofiel ben jij die je eigen risicobereidheid beoordeelt via de limietwaarden.",
      ],
      example: "Een LOW-gebruiker zet maxAmountPerTrade misschien op 4, maxDailyLoss op 10 XLM, maxSlippageBps op 25 en stopLossPct op 8%; een HIGH-gebruiker zet 20, 60 XLM, 80 en 3% op precies dezelfde velden.",
    },
    {
      id: "c11-l4",
      title: "Hoe risico-instellingen de AI-positiegrootte en stop loss-plaatsing beïnvloeden",
      paragraphs: [
        "De AI stelt een trade voor, maar jouw limieten bepalen de uiteindelijke vorm. De gevraagde omvang wordt teruggebracht tot maxAmountPerTrade en verder bijgesneden als die het totale risico voorbij maxOpenExposure of de per-paar-multiplier zou duwen. Dus zelfs een aankoop met hoge confidence landt kleiner als je caps strak staan.",
        "Het dagelijkse verliesbudget voegt een dynamische laag toe. Naarmate de gerealiseerde verliezen oplopen richting maxDailyLoss, schaalt de bot nieuwe positiegroottes automatisch af van ongeveer 100% naar grofweg 25%, en stopt daarna met nieuwe entries voor die dag, terwijl risico-verlagende exits nog wel zijn toegestaan. Een ruimere stopLossPct geeft de trade meer ademruimte, maar betekent bij dezelfde omvang een groter mogelijk verlies per trade, wat met dat budget op elkaar inwerkt.",
        "Stop-plaatsing en minRiskReward werken samen. De stop bepaalt waar je het mis hebt; het target moet minRiskReward halen ten opzichte van die afstand, anders wordt het voorstel afgewezen. Strakkere stops vereisen dichterbij gelegen targets om de verhouding te behouden, en dat bepaalt welke trades door de screening komen.",
      ],
      example: "Als de dag al 20 van een budget van 25 XLM in het rood staat, zit de bot diep in de afschaling: een voorstel dat hij normaal op 10 basiseenheden zou zetten, kan worden teruggebracht tot ongeveer 2,5, en zodra de verliezen 25 XLM bereiken, gaan er helemaal geen nieuwe entries meer open.",
    },
    {
      id: "c11-l5",
      title: "Hoe je het juiste risicoprofiel voor jouw situatie kiest",
      paragraphs: [
        "Begin bij wat je je op een enkele dag kunt veroorloven te verliezen, en stel maxDailyLoss daar eerst op in; veel andere keuzes volgen daaruit. Een verliesbudget waarbij je je oncomfortabel zou voelen als je het raakt, is te hoog. Bepaal van daaruit maxAmountPerTrade en maxOpenExposure zo dat een normale slechte dag ruim binnen dat budget blijft.",
        "Stem je slippage- en spread-limieten af op de paren die je daadwerkelijk verhandelt. Liquide blue-chip-paren verdragen strakkere maxSlippageBps en maxEntrySpreadBps; dunne paren hebben lossere waarden nodig, anders fillen ze simpelweg nooit. Stel stopLossPct en minRiskReward zo in dat ze weergeven hoeveel ruis je uitzit versus hoe gunstig een trade moet zijn om in aanmerking te komen.",
        "Behandel het profiel als een levende instelling. Als de bot bijna alles weigert, staan je limieten misschien te strak voor de markt; als drawdowns alarmerend voelen, zet dan omvang, exposure en het verliesbudget strakker. Verander één factor per keer, zodat je het effect ervan kunt zien.",
      ],
      example: "Een voorzichtige nieuwkomer die voornamelijk XLM/USDC verhandelt, kan LOW beginnen: maxDailyLoss 10 XLM, maxAmountPerTrade 4, maxOpenExposure 50 XLM, maxSlippageBps 25, stopLossPct 7%, minRiskReward 1,5, en pas richting de standaarden versoepelen zodra de resultaten dat rechtvaardigen.",
    },
  ],
  quiz: [
    {
      id: "c11-q1",
      prompt: "Wat beschrijft de rol van de risicofactoren in deze bot het beste?",
      options: [
        { text: "Het zijn vangrails die aftoppen hoeveel, hoe vaak en onder welke omstandigheden de bot mag handelen, en die trades weigeren of verkleinen die een limiet breken.", explanation: "Juist. De limieten toetsen elk voorstel voordat het wordt uitgevoerd; ze beperken het gedrag in plaats van signalen te genereren." },
        { text: "Het is de handelsstrategie die bepaalt welke assets gekocht en verkocht worden.", explanation: "Onjuist. De limieten kiezen geen assets; ze beperken omvang, frequentie, exposure en fill-kwaliteit van wat de strategie ook voorstelt." },
        { text: "Ze gelden alleen voor handmatige trades en worden genegeerd zodra de AI draait.", explanation: "Onjuist. De limieten worden voor voorstellen getoetst ongeacht de bron, inclusief de AI in auto-trade-modus." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q2",
      prompt: "Wat gebeurt er naarmate de gerealiseerde verliezen oplopen richting maxDailyLoss (bijv. 25 XLM)?",
      options: [
        { text: "Er verandert niets totdat het budget wordt overschreden, en dan wordt de wallet volledig vergrendeld.", explanation: "Onjuist. De afschaling begint voordat het budget is geraakt, en zelfs op de limiet zijn risico-verlagende exits nog toegestaan." },
        { text: "De bot schaalt nieuwe positiegroottes automatisch af van ongeveer 100% naar grofweg 25%, en stopt daarna met nieuwe entries terwijl risico-verlagende exits nog zijn toegestaan.", explanation: "Juist. De omvang krimpt dynamisch naarmate het budget wordt genaderd, en alleen nieuwe entries stoppen op de limiet." },
        { text: "De bot verdubbelt de positiegrootte om de verliezen sneller terug te winnen.", explanation: "Onjuist. Dat is martingale-gedrag; de bot doet het tegenovergestelde door de omvang af te schalen." },
        { text: "maxSlippageBps wordt automatisch versoepeld om meer trades te fillen.", explanation: "Onjuist. Het verliesbudget regelt de omvang en entries, niet de slippage-tolerantie." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q3",
      prompt: "Hoe zet je de bot op een LOW-risicoprofiel?",
      options: [
        { text: "Selecteer LOW in de ene risiconiveau-dropdown in de instellingen.", explanation: "Onjuist. Zo'n enkele knop of dropdown bestaat niet; een profiel is niet een enkele schakelaar." },
        { text: "Kies conservatieve waarden voor de afzonderlijke limieten — kleinere caps per trade en voor exposure, een kleiner dagelijks verliesbudget, strakkere slippage en een ruimere stop-buffer.", explanation: "Juist. LOW, MEDIUM en HIGH zijn namen voor combinaties van limietwaarden die je zelf instelt; er is geen enkele schakelaar." },
        { text: "Zet de AI-confidence op laag zodat hij alleen veilige trades neemt.", explanation: "Onjuist. AI-confidence beoordeelt individuele voorstellen en staat los van je risicoprofiel, dat in de limietwaarden zit." },
      ],
      correctIndex: 1,
    },
    {
      id: "c11-q4",
      prompt: "Een AI-voorstel vraagt om meer te kopen dan maxAmountPerTrade toestaat. Wat gebeurt er met de omvang?",
      options: [
        { text: "Hij wordt teruggebracht tot de cap, en verder bijgesneden als hij maxOpenExposure of de per-paar-multiplier zou overschrijden.", explanation: "Juist. De AI doet een voorstel, maar jouw omvang- en exposure-limieten vormen de uiteindelijke order, zelfs voor trades met hoge confidence." },
        { text: "Hij wordt uitgevoerd op de gevraagde omvang omdat hoge AI-confidence de caps overrulet.", explanation: "Onjuist. Confidence omzeilt de limieten niet; de omvang wordt nog steeds teruggebracht tot maxAmountPerTrade." },
        { text: "Het hele voorstel wordt verworpen en als fout gelogd.", explanation: "Onjuist. Een te grote aanvraag wordt verkleind om te passen, in plaats van regelrecht weggegooid." },
      ],
      correctIndex: 0,
    },
    {
      id: "c11-q5",
      prompt: "Bij het kiezen van een risicoprofiel, welke aanpak komt overeen met de richtlijn in dit hoofdstuk?",
      options: [
        { text: "Maximaliseer eerst maxAmountPerTrade en maxOpenExposure om elke kans te grijpen.", explanation: "Onjuist. Dat begint met de meest agressieve hefbomen en negeert wat je je kunt veroorloven te verliezen." },
        { text: "Kopieer de instellingen van een vriend exact, want één profiel past iedereen.", explanation: "Onjuist. Profielen moeten je eigen verliestolerantie en de paren die je verhandelt weergeven, niet blindelings worden gekopieerd." },
        { text: "Zet maxDailyLoss eerst op wat je je op een dag kunt veroorloven te verliezen, bepaal de andere caps zo dat ze daarbinnen passen, en pas één factor per keer aan.", explanation: "Juist. Verankeren op het dagelijkse verliesbudget en stapsgewijs bijstellen is de aanbevolen aanpak." },
        { text: "Gebruik de strakst mogelijke slippage- en spread-limieten op elk paar, ongeacht de liquiditeit.", explanation: "Onjuist. Dunne paren hebben lossere slippage- en spread-waarden nodig, anders fillen ze nooit; stem de limieten af op het paar." },
      ],
      correctIndex: 2,
    },
  ],
};
