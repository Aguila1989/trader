import type { Chapter } from "../../types";

export const chapter09: Chapter = {
  id: "c9",
  number: 9,
  level: "ADVANCED",
  title: "Portfoliobeheer",
  description:
    "Lees je wallet-overzicht, begrijp trading caps en drawdown, en beoordeel of je trades echt werken.",
  lessons: [
    {
      id: "c9-l1",
      title: "Wat is portfoliowaarde en hoe wordt die berekend?",
      paragraphs: [
        "Je portfoliowaarde is simpelweg wat alles wat je aanhoudt op dit moment waard is, bij elkaar opgeteld. De app berekent dit door van elke holding het saldo te vermenigvuldigen met de huidige stuksprijs van die asset, en de resultaten over al je holdings op te tellen. Omdat elke asset op twee manieren geprijsd kan worden, toont de header een totaal in XLM en een totaal in USDC naast elkaar.",
        "Prijzen komen van live Stellar-markten, dus de waarde beweegt mee zodra de markten bewegen. De app herberekent de prijzen op een timer, dus de totalen die je ziet zijn een recente momentopname, geen bevroren getal. Verversen of een paar seconden wachten kan het cijfer al veranderen, zelfs als je niets deed.",
        "Een belangrijke kanttekening: sommige assets tonen mogelijk geen prijs. Als er op het Stellar-netwerk geen trading-route bestaat om die asset om te zetten naar XLM of USDC, kan de app hem niet waarderen, en draagt die holding niets bij aan het geprijsde totaal. Behandel zulke holdings als onbekende waarde, niet als nul.",
      ],
      example:
        "Stel dat je 1000 XLM en 50 USDC aanhoudt. Als 1 USDC 8.5 XLM waard is, dan is je USDC 425 XLM waard. Je totaal in XLM is 1000 plus 425, oftewel 1425 XLM. Andersom: als 1 XLM ongeveer 0.1176 USDC waard is, is je 1000 XLM ruwweg 117.6 USDC waard, dus je totaal in USDC is 117.6 plus 50, oftewel ongeveer 167.6 USDC. Hetzelfde vermogen, twee munteenheden.",
    },
    {
      id: "c9-l2",
      title: "Hoe lees je het wallet-overzicht in deze app",
      paragraphs: [
        "Het wallet-overzicht staat in de header van het dashboard. Het toont elke asset die je aanhoudt op één rij, met het saldo dat je bezit, de waarde van dat saldo in XLM en de waarde van dat saldo in USDC. Door een rij van links naar rechts te lezen zie je hoeveel van een asset je hebt en wat die waard is in beide referentiemunten.",
        "Onder of naast de rijen vind je de totalen: totale portfoliowaarde in XLM en totale portfoliowaarde in USDC. Dit zijn de sommen die in de vorige les zijn beschreven. Werp hier eerst een blik op om je algemene situatie in te schatten voordat je in een afzonderlijke positie duikt.",
        "Let op rijen waar een prijs ontbreekt. Dat signaleert dat er op dit moment geen marktroute voor de asset is, dus die rij toont mogelijk wel een saldo maar geen waarde. Verwar een ontbrekende prijs niet met een waardeloze asset; het betekent enkel dat de app hem nu niet kan waarderen, en de totalen laten hem buiten beschouwing.",
      ],
      example:
        "Stel je drie rijen voor: XLM met een saldo van 2000 ter waarde van 235 USDC, USDC met een saldo van 100 ter waarde van 100 USDC, en een obscure token met een saldo van 500 maar een lege waarde omdat er geen route bestaat. Het totaal in USDC toont ongeveer 335, wat alleen de XLM- en USDC-rijen meetelt. De 500 obscure tokens worden aangehouden maar niet meegeteld, dus je werkelijke vermogen is minstens 335 plus wat die zouden opbrengen.",
    },
    {
      id: "c9-l3",
      title: "Wat is een trading cap en waarom heeft de AI er een?",
      paragraphs: [
        "Een trading cap is een plafond dat de AI zet op hoeveel kapitaal hij inzet. Er zijn twee lagen: een maximaal bedrag per afzonderlijke trade, en een maximale totale open exposure over alle posities tegelijk. De cap per trade is hoger voor blue-chip stablecoin-paren, die dieper en veiliger zijn, en lager voor dunnere of risicovollere paren.",
        "Het doel is risicobeheersing. Caps voorkomen dat één zelfverzekerd ogend signaal de hele wallet inzet, en de exposure-cap voorkomt dat veel kleine trades stilletjes optellen tot een gevaarlijk totaal. Samen begrenzen ze het maximum dat je kunt verliezen als de markt zich tegen elke open positie tegelijk keert.",
        "Handmatige orders werken anders. Wanneer je zelf een trade plaatst, omzeil je de size-, volume- en exposure-caps van de AI, omdat je dan zelf de directe verantwoordelijkheid voor de omvang neemt. Handmatige orders moeten nog steeds langs de veiligheidspoorten, dus roekeloze of duidelijk kapotte orders worden nog steeds geblokkeerd, maar de verstandige size-limieten bepaal je zelf.",
      ],
      example:
        "Stel dat de AI-cap per trade 200 USDC is voor een stablecoin-paar en de totale exposure-cap 500 USDC. Met 350 USDC al ingezet over twee open posities heeft de AI nog 150 USDC speelruimte over. Een nieuw signaal dat 200 USDC wil, wordt teruggebracht tot 150 om de exposure-cap te respecteren. Jij, die dezelfde trade handmatig plaatst, zou de volle 200 kunnen inleggen als je dat wilde, al draag je dat extra risico dan zelf.",
    },
    {
      id: "c9-l4",
      title: "Wat is drawdown en hoe beheer je die?",
      paragraphs: [
        "Drawdown is de daling van een piek in portfoliowaarde naar een later dieptepunt. Als je portfolio een hoogtepunt bereikte en daarna daalde, is de drawdown hoe ver onder dat hoogtepunt je nu zit, meestal uitgedrukt als een percentage. Het meet pijn, niet zomaar een getal, want diepe drawdowns zijn moeilijk om van te herstellen.",
        "Deze app helpt drawdown automatisch te beheren via een dagelijks verliesbudget. Naarmate de verliezen gedurende de dag oplopen, worden de posities kleiner gemaakt, schalend van volledige omvang bij ruwweg 100 procent resterend budget naar ongeveer 25 procent zodra het budget op raakt. De bot zet minder in juist wanneer hij al aan het verliezen is.",
        "Als het dagelijkse verliesbudget volledig verbruikt is, stopt de bot met nieuwe instappen tot de volgende dag en staat hij alleen nog risicoverlagende uitstappen toe, wat betekent dat hij posities nog kan sluiten of bijknippen om risico te verminderen, maar geen nieuwe kan openen. Deze stroomonderbreker voorkomt dat een slechte dag uitmondt in een catastrofale dag.",
      ],
      example:
        "Je portfolio piekt op 1000 USDC en glijdt dan af naar 850 USDC. De drawdown is 150 USDC, oftewel 15 procent. Herstellen vergt meer dan een winst van 15 procent: vanaf 850 moet je ongeveer 17.6 procent stijgen om terug op 1000 te komen, omdat winsten samengesteld worden op een kleinere basis. Precies die asymmetrie is waarom het verliesbudget de size kleiner maakt en uiteindelijk nieuwe instappen stillegt voordat het gat dieper wordt.",
    },
    {
      id: "c9-l5",
      title: "Hoe beoordeel je of je trades goed presteren",
      paragraphs: [
        "Begin met gerealiseerde versus ongerealiseerde winst en verlies. De app houdt de dagelijkse gerealiseerde PnL bij, het geld dat daadwerkelijk vastligt door gesloten trades, en de ongerealiseerde PnL, de mark-to-market winst of verlies op posities die je nog aanhoudt. Een mooi ongerealiseerd getal is slechts een belofte tot je de positie sluit en het gerealiseerd wordt.",
        "Gebruik de stats- en evolutiegrafieken om de trend te zien in plaats van één enkel moment. Een grillige lijn die almaar nieuwe hoogtepunten maakt is gezonder dan een gladde lijn die langzaam afzakt. Combineer dit met de drawdown-weergave om te beoordelen hoeveel pijn je hebt verdragen om dat rendement te verdienen.",
        "Beoordeel ten slotte de bot en jezelf apart. De history-tabel is precies daarom opgesplitst in Handmatig- en Bot-trades. Door de twee te vergelijken zie je of je handmatige instinct de AI verslaat, of dat de AI stilletjes beter presteert dan je zelf geplaatste orders, zodat je kunt leunen op wat echt werkt.",
      ],
      example:
        "Op één dag toont het Bot-tabblad tien gesloten trades met 12 USDC gerealiseerde winst en een open positie die 5 USDC ongerealiseerd in de plus staat. Het Handmatig-tabblad toont drie trades met 4 USDC gerealiseerd verlies. Het totale gerealiseerde resultaat is 8 USDC in de plus, maar de splitsing onthult dat de bot 12 verdiende terwijl je handmatige trades er 4 verloren. De eerlijke conclusie is de bot te laten doorwerken en na te gaan waarom je handmatige instappen onderpresteerden.",
    },
    {
      id: "c9-l6",
      title: "De portfolio-evolutiegrafiek lezen",
      paragraphs: [
        "De evolutiegrafiek zet je totale portfoliowaarde, in USDC, uit in de tijd. Elk punt is een momentopname van alles wat je op dat moment aanhield, geprijsd en opgeteld zoals eerdere lessen beschreven. Lees van links naar rechts en je kijkt naar het verhaal van je account: waar het begon, waar het nu staat, en hoe hobbelig de weg ertussen was.",
        "De belangrijkste vaardigheid is het onderscheiden van twee heel verschillende redenen waarom de lijn kan stijgen. Prijsstijging is je bestaande holdings die in waarde toenemen, en dat toont zich als een min of meer gladde helling die de markt volgt. Geld toevoegen is geld dat je stortte, en dat toont zich als een plotselinge verticale sprong die geen enkele marktbeweging kan verklaren. Een sprong van 100 naar 300 USDC in één stap is vrijwel zeker een storting, geen rally van 200 procent, dus geef de AI daar geen krediet voor.",
        "De vorm van de lijn vertelt je iets over risico. Een vlakke, rechte lijn betekent dat je waarde stabiel blijft, met weinig beweging in beide richtingen. Een grillige lijn met grote pieken en diepe dalen betekent hoge volatiliteit: grotere uitslagen, wat zowel meer kans als meer risico is. Geen van beide is automatisch goed; een vlakke lijn tijdens een marktrally kan betekenen dat je in stablecoins zit en bewegingen mist, terwijl een heftige lijn kan betekenen dat je meer risico neemt dan je bedoelde.",
        "De tijdspanne verandert het hele verhaal, dus controleer altijd welke je bekijkt. Een venster van 24 uur is vooral ruis: normale schommelingen binnen de dag lijken dramatisch als je zover inzoomt. Een jaaroverzicht strijkt die ruis glad tot een echte trend, en toont of het account op de lange termijn daadwerkelijk groeit, wegzakt of leegloopt. Beoordeel prestaties op de lange tijdspanne en gebruik de korte alleen om vandaag te begrijpen.",
        "Alles bij elkaar is de grafiek de manier waarop je beoordeelt of de AI het portfolio echt laat groeien. Trek in gedachten elke stortingssprong eraf, en vraag je dan af of de resterende helling over een betekenisvol venster omhoog trendt. Als de lijn alleen klimt omdat je steeds geld toevoegt, werkt de strategie niet, hoe groen het totaal er ook uitziet.",
      ],
      example:
        "Je evolutielijn over 90 dagen begint op 200 USDC, stijgt gladjes naar 240, springt dan op dag 45 in één stap recht omhoog naar 440, en eindigt op 455. Het is verleidelijk om dat een winst van 127 procent te noemen. Maar de verticale sprong van 200 op dag 45 is een storting, geen handelswinst. Haal die eruit en het echte beeld is 200 naar 240 vóór de storting en 440 naar 455 erna, ruwweg 20 plus 15, ongeveer 35 USDC aan echte waardestijging op 400 aan kapitaal, bijna 9 procent. Gezond, maar ver van 127, en alleen de voor-stortingen-gecorrigeerde lezing vertelt je dat de AI daadwerkelijk werkt.",
    },
  ],
  quiz: [
    {
      id: "c9-q1",
      prompt:
        "Je houdt 1000 XLM en 50 USDC aan, en 1 USDC is 8.5 XLM waard. Wat is je totale portfoliowaarde in XLM?",
      options: [
        {
          text: "1050 XLM",
          explanation:
            "Onjuist. Hier worden de twee saldi simpelweg opgeteld alsof 1 USDC gelijk was aan 1 XLM, waarbij de prijs genegeerd wordt.",
        },
        {
          text: "1425 XLM",
          explanation:
            "Correct. De 50 USDC is 50 keer 8.5 waard, oftewel 425 XLM, opgeteld bij 1000 XLM geeft dat 1425 XLM.",
        },
        {
          text: "8500 XLM",
          explanation:
            "Onjuist. Hier wordt alleen de USDC geprijsd op de verkeerde schaal en de 1000 XLM volledig weggelaten.",
        },
        {
          text: "425 XLM",
          explanation:
            "Onjuist. Dit is enkel de waarde van het USDC-deel en vergeet de 1000 XLM erbij op te tellen.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q2",
      prompt:
        "In het wallet-overzicht toont een asset wel een saldo maar is de waardekolom leeg. Wat betekent dit?",
      options: [
        {
          text: "De asset is waardeloos en telt als nul mee in je totalen.",
          explanation:
            "Onjuist. Een lege waarde is niet hetzelfde als waarde nul; de app kan hem simpelweg niet prijzen.",
        },
        {
          text: "Er is op dit moment geen marktroute om hem te prijzen, dus hij wordt uitgesloten van de geprijsde totalen.",
          explanation:
            "Correct. Zonder trading-route naar XLM of USDC kan de app hem niet waarderen, en de totalen laten hem buiten beschouwing ook al houd je hem nog aan.",
        },
        {
          text: "Je saldo voor die asset is nul.",
          explanation:
            "Onjuist. De saldokolom toont een echte holding; alleen de waarde ontbreekt.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q3",
      prompt: "Waarom hanteert de AI een cap per trade en een totale open exposure-cap?",
      options: [
        {
          text: "Om risico te begrenzen zodat geen enkel signaal de hele wallet inzet en veel trades niet stilletjes kunnen optellen tot een gevaarlijk totaal.",
          explanation:
            "Correct. De cap per trade beperkt één inzet en de exposure-cap beperkt het gecombineerde risico van alle open posities.",
        },
        {
          text: "Om te garanderen dat elke trade winstgevend is.",
          explanation:
            "Onjuist. Caps beperken hoeveel er op het spel staat; ze kunnen geen enkele trade winstgevend maken.",
        },
        {
          text: "Om je te dwingen handmatige orders te gebruiken voor grote trades.",
          explanation:
            "Onjuist. Handmatige orders omzeilen deze caps inderdaad, maar dat is een gevolg, niet het doel van de caps.",
        },
        {
          text: "Om te versnellen hoe vaak de bot de markt scant.",
          explanation:
            "Onjuist. Caps regelen het kapitaal dat op het spel staat, niet de scanfrequentie.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q4",
      prompt:
        "Je portfolio piekte op 1000 USDC en staat nu op 850 USDC. Wat is de drawdown, en wat gebeurt er naarmate het dagelijkse verliesbudget verbruikt wordt?",
      options: [
        {
          text: "Drawdown is 15 procent, en naarmate het budget opraakt worden posities kleiner gemaakt en stoppen nieuwe instappen uiteindelijk.",
          explanation:
            "Correct. Drawdown is de daling van 150 USDC vanaf de piek van 1000, oftewel 15 procent, en het verliesbudget schaalt de size van ongeveer 100 procent naar 25 procent voordat het nieuwe instappen stillegt.",
        },
        {
          text: "Drawdown is 15 procent, en de bot verhoogt de posities om sneller te herstellen.",
          explanation:
            "Onjuist. Het drawdowncijfer klopt, maar de bot maakt de posities juist kleiner naarmate de verliezen oplopen, hij zet niet groter in.",
        },
        {
          text: "Drawdown is de 850 USDC die je nog aanhoudt, en er verandert niets aan de size.",
          explanation:
            "Onjuist. Drawdown is de daling vanaf de piek, niet het resterende saldo, en het verliesbudget verandert wel degelijk de size.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q5",
      prompt:
        "Op de evolutiegrafiek springt de lijn in één stap recht omhoog van 100 naar 300 USDC. Wat is er hoogstwaarschijnlijk gebeurd?",
      options: [
        {
          text: "Je hebt geld toegevoegd; een plotselinge verticale sprong is een storting, geen prijsstijging.",
          explanation:
            "Juist. Stortingen verschijnen als directe verticale stappen, terwijl prijsstijging zich toont als een helling die de markt volgt, dus deze sprong mag niet aan de AI worden toegeschreven.",
        },
        {
          text: "De AI heeft je geld in een oogwenk verdrievoudigd door te traden.",
          explanation:
            "Onjuist. Handelswinst bouwt op als een helling over tijd, niet als een enkele verticale sprong; een sprong als deze is vrijwel altijd een storting.",
        },
        {
          text: "De grafiek is kapot en het getal moet genegeerd worden.",
          explanation:
            "Onjuist. De sprong is echt en betekenisvol, hij weerspiegelt alleen nieuw geld dat je toevoegde in plaats van een marktbeweging.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q6",
      prompt:
        "Je wilt beoordelen of de AI het portfolio echt laat groeien. Welke lezing is het betrouwbaarst?",
      options: [
        {
          text: "De 24-uurslijn, omdat die het vaakst wordt bijgewerkt.",
          explanation:
            "Onjuist. Een venster van 24 uur is vooral ruis binnen de dag; korte schommelingen lijken dramatisch en verbergen de echte langetermijntrend.",
        },
        {
          text: "De trend op lange tijdspanne, met de stortingssprongen er in gedachten afgetrokken.",
          explanation:
            "Juist. Een lang venster onthult de echte trend, en het weghalen van stortingssprongen toont of de groei van de AI kwam in plaats van van geld dat je toevoegde.",
        },
        {
          text: "Het enkele hoogste punt dat de lijn ooit bereikte.",
          explanation:
            "Onjuist. Eén piek zegt niets over de trend of over hoeveel van de waarde uit stortingen kwam versus echte winst.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
