import type { Chapter } from "../../types";

export const chapter21: Chapter = {
  id: "c21",
  number: 21,
  level: "EXPERT",
  title: "Tokenevaluatie op de Stellar-keten",
  description: "De mechaniek achter de scores: wat Horizon-handelsaggregaties meten, hoe de diepte van het orderboek wordt opgeteld, wat het aantal trustlines werkelijk zegt, hoe je 12 weken scorehistoriek leest en wanneer je de AI overrulet.",
  lessons: [
    {
      id: "c21-l1",
      title: "Hoe Horizon-handelsaggregaties werken",
      paragraphs: [
        "De volumecijfers in de scan komen van het trade-aggregaties-eindpunt van Horizon. Het groepeert afgeronde trades voor één assetpaar in vaste tijdvakken — de app gebruikt uurvakken voor het cijfer over 24 uur en dagvakken voor het cijfer over 7 dagen — en rapporteert per vak de open-/hoogste/laagste/slotkoers, het aantal trades en het verhandelde volume in de basisasset.",
        "Twee details zijn van belang. Ten eerste gaat het hier om afgewikkelde on-chain DEX-activiteit voor dat specifieke paar (de token tegen XLM), niet om het door een exchange gerapporteerde cijfer en niet om AMM-poolswaps die de orderboekscan niet kan zien — dus een token waarvan de liquiditeit tegen USDC of in een pool zit, kan hier dunner lijken dan ze werkelijk is. Ten tweede laat Horizon lege vakken volledig weg, dus \"24 uurkaarsen\" op een dunne markt kan in werkelijkheid meerdere dagen beslaan.",
        "De app telt het basisvolume over de vakken op om de cijfers voor 24u en 7d te krijgen, en vergelijkt de open van het eerste vak met de slotkoers van het laatste vak om de 7-dagentrend te labelen als stijgend, stabiel of dalend. De bron kennen verklaart de grenzen: laag volume betekent hier specifiek laag DEX-volume op het XLM-paar, wat het eerlijke signaal is voor de vraag of je de token op deze plek daadwerkelijk zou kunnen verhandelen.",
      ],
      example: "Een token rapporteert een 7-dagenvolume van 40.000 op basis van dagaggregaties tegen XLM. Je controleert het en ziet slechts 5 niet-lege dagvakken — er werd op 5 van de 7 dagen gehandeld. Het cijfer is reëel maar onregelmatig, en het zegt niets over de mogelijk diepere USDC-markt van die token. Je weegt het navenant in plaats van 40.000 te lezen als gelijkmatige dagelijkse liquiditeit.",
    },
    {
      id: "c21-l2",
      title: "Hoe de diepte van het orderboek wordt berekend",
      paragraphs: [
        "Diepte in de scan is een momentopname van de rustende liquiditeit, los van het verhandelde volume. De app haalt het live orderboek voor de token tegen XLM op en telt de bedragen op de tien hoogste biedniveaus en de tien hoogste laatniveaus op, genormaliseerd naar eenheden van de basisasset. Volume vertelt je wat er verhandeld is; diepte vertelt je wat er nu klaarligt om verhandeld te worden.",
        "Diepte bepaalt je slippage op een echte order. Een boek met grote omvang opgestapeld dicht bij de spread absorbeert een aanzienlijke trade met weinig koersbeweging; een dun boek betekent dat zelfs een bescheiden order verschillende niveaus afloopt en gevuld wordt tegen een veel slechtere gemiddelde prijs. Twee tokens met identiek 24u-volume kunnen volledig verschillende diepte hebben, en de dunne is de gevaarlijkste om in of uit te stappen.",
        "Omdat het een momentopname is van één tijdstip, kan diepte van minuut tot minuut veranderen, en één enkele grote rustende order kan ze geflatteerd doen lijken. Lees ze samen met volume en spread: gezonde liquiditeit is stabiel volume, een krappe spread en diepte aan beide zijden van het boek — niet zomaar één indrukwekkend cijfer op zichzelf.",
      ],
      example: "Token A en token B tonen allebei een 24u-volume rond 50.000. Maar de diepte van de top-tien van A telt op tot 30.000 basiseenheden met een spread van 20 bps, terwijl die van B optelt tot 1.200 met een spread van 400 bps. Een uitstap van 10.000 eenheden beweegt de koers van A nauwelijks; bij B walst die door elk niveau heen. Hetzelfde volume, sterk verschillende reële liquiditeit — de diepte vertelde je dat.",
    },
    {
      id: "c21-l3",
      title: "Wat het aantal trustlines onthult over adoptie",
      paragraphs: [
        "Het aantal trustlines komt van het assets-eindpunt van Horizon — het veld num_accounts — en is het aantal accounts dat een trustline naar die token heeft geopend. Het is de breedst beschikbare maatstaf voor adoptie: hoeveel afzonderlijke accounts ervoor gekozen hebben om deze asset überhaupt te kunnen aanhouden. Een token met 15.000 trustlines heeft een heel andere lat gehaald dan een token met 30.",
        "Maar weet precies wat het wel en niet betekent. Het telt houders (degenen die een trustline openen), niet actieve handelaren, en het omvat slapende accounts en accounts met saldo nul — elk account dat ooit de trustline opende en die niet gesloten heeft. Het is dus een maatstaf voor cumulatief bereik, niet voor huidige activiteit. Een hoog aantal met bijna nul volume is een token die ooit geadopteerd werd en nu stil ligt.",
        "De nuttigste manier om het te gebruiken is als noemer en als trend. Controleer het tegen volume en diepte: veel houders plus reële liquiditeit is echte adoptie; veel houders zonder liquiditeit is een verschaalde of verlaten token. En week na week is een dalend aantal trustlines — houders die actief uitstappen — een van de verslechteringstriggers, juist omdat mensen die vertrekken een betekenisvol signaal is.",
      ],
      example: "Een token toont 9.000 trustlines, wat sterk lijkt — tot je opmerkt dat het 24u-volume ongeveer nul is en de koers al weken vlak ligt. Kruisverwijzing onthult een asset die lang geleden houders aantrok en nu slapend is. De volgende week toont het aantal 8.000: een daling van 11% activeert de waarschuwing 'minder houders' en bevestigt dat houders actief vertrekken in plaats van slechts inactief te zijn.",
    },
    {
      id: "c21-l4",
      title: "12 weken scorehistoriek interpreteren",
      paragraphs: [
        "Elke wekelijkse scan slaat een momentopname per token op, en de app bewaart minstens 12 weken van die historiek. De scores van één week zijn een foto; twaalf weken zijn een film. Het verloop van de totaalscore en zijn vier componenten is veel informatiever dan welke afzonderlijke meting ook, want het toont of een token sterker wordt, vervalt of louter ruis is.",
        "Let op richting en consistentie. Een token waarvan de legitimiteits- en liquiditeitsscores over vele weken stabiel blijven of klimmen, verdient vertrouwen; een token waarvan de scores neerwaarts schuiven, vertelt je iets, zelfs als geen enkele week een waarschuwing activeert. Onderscheid een echte trend van losse uitschieters — één slechte week temidden van elf goede is meestal ruis, terwijl drie opeenvolgende dalingen een patroon vormen.",
        "De week-op-week-triggers vuren op veranderingen van één stap, maar de 12-wekenblik is waar je het trage bloeden opvangt dat die drempels kunnen missen — een token die over een maand afzakt van 8 naar 7 naar 6 naar 5 activeert in geen enkele week de regel van twee punten score-daling, maar is duidelijk verslechterd. Gebruik de historiek om te bevestigen dat een waarschuwing deel uitmaakt van een trend, of om verval op te merken dat de triggers nog niet hebben gemarkeerd.",
      ],
      example: "Een token activeert nooit een waarschuwing, maar zijn 12-weken-totaal leest 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3 — een gestage maandelijkse glijbaan die de tweepunts-regel voor één week nooit opvangt. De film, niet de foto, vertelt je om af te bouwen of uit te stappen. Een andere token stuitert 7, 8, 6, 8, 7 — rumoerig maar zonder trend, en geen reden tot alarm.",
    },
    {
      id: "c21-l5",
      title: "Wanneer je een AI-suggestie overrulet en hoe je het documenteert",
      paragraphs: [
        "Jij bent de uiteindelijke beslisser, en er zijn goede redenen om de scan in beide richtingen te overrulen. Je zou een hoogscorende token kunnen afwijzen omdat je off-chain kennis hebt die het model mist — een bekend teamconflict, een regelgevende dreiging, een depeg-risico. Of je zou een laagscorende kunnen toevoegen omdat je begrijpt waarom ze laag scoort en dat risico bewust aanvaardt, bijvoorbeeld een gloednieuw maar geloofwaardig project dat het model louter bestraft om zijn korte historiek.",
        "Overrule op bewijs, niet op een onderbuikgevoel. Voordat je tegen een score ingaat, schrijf de specifieke feiten op die het rechtvaardigen: wat de scan zag, wat jij weet dat zij niet weet, en welke concrete signalen (identiteit van de issuer, diepte, houderstrend, TOML-inhoud) je beslissing ondersteunen. Als je geen reden kunt verwoorden waarom het model fout zit, is dat meestal een teken om je naar het model te schikken.",
        "Je redenering documenteren is wat overrules later toetsbaar maakt. Noteer de datum, de token, de scores op dat moment, je beslissing en je motivering — het uitstellen van een waarschuwing, een notitie in je eigen logboek of een opmerking naast de positie. Wanneer je over enkele weken terugkijkt, kun je beoordelen of je overrule gerechtvaardigd was door de uitkomst, en bouw je een trackrecord op in plaats van ongetoetste ingevingen te herhalen.",
      ],
      example: "De scan markeert een aangehouden token met een verslechteringswaarschuwing, maar jij weet dat de volumedaling een storing van één week bij een exchange is, geen verval. Je stelt de waarschuwing zeven dagen uit en noteert: \"2026-07-01, token X, totaal 5 (was 7); volumedaling is het onderhoudsvenster van de Acme-exchange, geen fundamenten; houders en TOML ongewijzigd; herbekijken bij volgende scan.\" De week daarna herstellen de cijfers, je gedocumenteerde beslissing wordt bevestigd, en de notitie bewijst waarom je aanhield.",
    },
  ],
  quiz: [
    {
      id: "c21-q1",
      prompt: "Een token toont in de scan een gezond 7-dagenvolume, maar je vermoedt dat het grootste deel van de liquiditeit elders zit. Wat meet het volumecijfer eigenlijk?",
      options: [
        { text: "Afgewikkelde on-chain DEX-trades voor die token tegen XLM, opgeteld uit Horizon-aggregatievakken.", explanation: "Correct. Het is specifiek DEX-volume op het XLM-paar — het sluit AMM-pools en andere quotepaarsen uit, dus een USDC-zware token kan hier dunner lijken dan ze werkelijk is." },
        { text: "Het totale handelsvolume van de token over elke exchange en plaats wereldwijd.", explanation: "Incorrect. Horizon rapporteert alleen afgewikkelde SDEX-trades voor het opgevraagde paar, niet extern of geaggregeerd volume." },
        { text: "Het aantal accounts dat de token momenteel aanhoudt.", explanation: "Incorrect. Dat is het aantal trustlines uit het assets-eindpunt, een geheel andere maatstaf." },
      ],
      correctIndex: 0,
    },
    {
      id: "c21-q2",
      prompt: "Twee tokens hebben een nagenoeg identiek 24u-volume, maar je moet snel een grote positie afbouwen. Welke maatstaf vertelt je het best wat die uitstap zal kosten?",
      options: [
        { text: "Het aantal trustlines, want meer houders betekent een makkelijkere uitstap.", explanation: "Incorrect. Het houdersaantal zegt niets over de rustende liquiditeit op dit moment; je kunt veel slapende houders en een leeg boek hebben." },
        { text: "De diepte van het orderboek — de opgetelde omvang op de hoogste bied-/laatniveaus — want die bepaalt je slippage.", explanation: "Correct. Diepte is de nu beschikbare rustende liquiditeit; een dun boek doet een grote order niveaus aflopen en gevuld worden tegen een veel slechtere gemiddelde prijs, ongeacht het volume uit het verleden." },
        { text: "Het label van de 7-dagen-koerstrend.", explanation: "Incorrect. De trend vertelt je de richting, niet hoeveel omvang het boek kan absorberen op de weg naar buiten." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q3",
      prompt: "Een token toont 9.000 trustlines maar bijna geen handelsvolume en een vlakke koers. Wat is de meest accurate lezing?",
      options: [
        { text: "Ze is nu zeer actief, want het aantal trustlines bewijst live handel.", explanation: "Incorrect. Het aantal trustlines omvat slapende accounts en accounts met saldo nul; het meet cumulatief bereik, niet huidige activiteit." },
        { text: "Ze werd op enig moment geadopteerd maar is nu grotendeels slapend — hoog cumulatief bereik, weinig huidige activiteit.", explanation: "Correct. Veel houders met bijna nul volume wijst op een ooit geadopteerde, nu stille token; het aantal is een noemer, lees het tegen volume en diepte." },
        { text: "Het aantal trustlines moet een fout zijn, want houders handelen altijd.", explanation: "Incorrect. Houders zitten vaak inactief; een hoog aantal zonder volume is een gangbaar en betekenisvol patroon, geen datafout." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q4",
      prompt: "De totaalscore van een aangehouden token leest 8, 7, 6, 5 over vier opeenvolgende weken maar activeert nooit de tweepunts-waarschuwing voor score-daling. Wat moet je uit de 12-wekenhistoriek opmaken?",
      options: [
        { text: "Er is niets aan de hand, want geen enkele week daalde twee punten.", explanation: "Incorrect. De trigger voor één week mist een trage, gestage daling; het verloop is juist de reden om de historiek te bewaren." },
        { text: "Een duidelijke neerwaartse trend die de weekdrempels missen — een aanleiding om af te bouwen of uit te stappen.", explanation: "Correct. Vier opeenvolgende dalingen van één punt activeren nooit de tweepuntsregel, maar de film toont een duidelijke verslechtering die de foto niet kan." },
        { text: "De scores zijn gewoon ruis en kunnen worden genegeerd.", explanation: "Incorrect. Een monotone glijbaan over vier weken is een trend, geen ruis; consistentie in één richting is precies waarop je moet handelen." },
      ],
      correctIndex: 1,
    },
    {
      id: "c21-q5",
      prompt: "De scan markeert een aangehouden token, maar je hebt specifiek bewijs dat de dip een tijdelijke exchange-storing is. Wat is de gedisciplineerde manier om de waarschuwing te overrulen?",
      options: [
        { text: "De waarschuwing stilzwijgend negeren en doorgaan, want je hebt het gevoel dat het in orde is.", explanation: "Incorrect. Een ongedocumenteerd onderbuikgevoel kan later niet worden getoetst; overrule op verwoord bewijs, niet op een gevoel." },
        { text: "De waarschuwing uitstellen en de datum, de scores, je redenering en een herbekijkplan noteren zodat de beslissing toetsbaar is.", explanation: "Correct. De specifieke feiten documenteren (wat de scan zag, wat jij weet dat zij niet weet, wanneer te herbekijken) maakt de overrule verantwoordbaar en bouwt een trackrecord op." },
        { text: "Onmiddellijk de hele positie verkopen om zeker te zijn.", explanation: "Incorrect. Als je bewijs zegt dat de dip tijdelijk is, spreekt een gedwongen uitstap je eigen analyse tegen; het gaat om een beredeneerde, gedocumenteerde beslissing." },
      ],
      correctIndex: 1,
    },
  ],
};
