import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Je assets beschermen",
  description: "De echte beveiligingsrisico's in crypto en hoe deze bot zich ertegen wapent, van server-side sleutelbeheer tot de gezaghebbende balanscontrole vooraf.",
  lessons: [
    {
      id: "c13-l1",
      title: "De grootste beveiligingsrisico's in crypto — sleutels, phishing, nep-apps",
      paragraphs: [
        "Elk beveiligingsrisico in crypto erft een eigenschap: definitiviteit. Zodra een Stellar-transactie in een ledger is opgenomen, is ze onomkeerbaar. Er is geen chargeback, geen bank, geen helpdesk die het geld kan terughalen. De meeste andere risico's zijn simpelweg dit ene, versterkt door een fout, dus het juiste denkmodel is niet hoe maak ik schade ongedaan maar hoe blokkeer ik slechte acties voordat ze de chain bereiken.",
        "Een Stellar-account wordt gedefinieerd door een keypair. De publieke sleutel begint met G en is veilig om te delen; het is het adres waarop anderen je betalen. De geheime sleutel begint met S en geeft volledige controle. Wie de S-sleutel bezit, kan transacties ondertekenen en elke asset in het account verplaatsen, zonder enig tweede wachtwoord eroverheen. Een gelekte geheime sleutel is daarom geen gedeeltelijke inbreuk. Het is volledige zeggenschap, overgedragen aan de aanvaller.",
        "De lijst met dreigingen is kort en concreet. Een gelekte geheime sleutel geeft een aanvaller alles. Phishing en nepsites of nep-apps verleiden je ertoe de sleutel zelf weg te geven. Het ondertekenen van een kwaadaardige transactie geeft een overdracht toestemming die je nooit bedoeld had. Naar het verkeerde adres sturen verplaatst je geld voorgoed naar een vreemde. En het vertrouwen op een nep-token of nep-issuer laat je achter met iets waardeloos dat slechts lijkt op de echte asset.",
        "Merk op dat de meeste hiervan menselijke fouten zijn, geen exotische exploits. Ze slagen omdat onomkeerbaarheid het vangnet weghaalt waar andere financiele systemen op steunen. De verdediging is gelaagd en saai: houd de sleutel waar aanvallers er niet bij kunnen, verifieer elke bestemming, wantrouw ongevraagd contact, en laat geautomatiseerde bewakers kansloze of niet-gefinancierde operaties weigeren. Deze bot is precies rond die houding gebouwd, en de rest van dit hoofdstuk toont de specifieke mechanismen.",
      ],
      example: "Je kopieert een bestemmingsadres vanaf je klembord, maar malware die het klembord kaapt heeft het stilletjes vervangen door het adres van de aanvaller. Je bevestigt. De asset belandt binnen enkele seconden op hun rekening en kan niet worden teruggehaald. De eerste vier en laatste vier tekens van het adres vergelijken met de bron die je vertrouwt, zou de verwisseling hebben opgemerkt voordat je tekende.",
    },
    {
      id: "c13-l2",
      title: "Hoe herken je een scam — alarmsignalen en voorbeelden",
      paragraphs: [
        "Phishing is imitatie, ontworpen om je te laten handelen voordat je nadenkt. De aanvaller bouwt overtuigend een wallet, exchange of supportteam na, en verzint dan een reden om te haasten: een beveiligingswaarschuwing, een aflopend airdrop-venster, een loginpagina die er pixelperfect uitziet. Het doel is bijna altijd hetzelfde — je je geheime sleutel of seed phrase laten prijsgeven, of een transactie laten ondertekenen die je niet begrijpt.",
        "Een regel verslaat het meeste ervan: een legitieme app heeft nooit je geheime sleutel of herstelzin nodig. Je sleutel ondertekent lokaal; geen enkele echte dienst vraagt je om een string die met S begint te typen, te plakken, te e-mailen of via DM te sturen. Behandel elk dergelijk verzoek als sluitend bewijs van een scam, hoe officieel de branding er ook uitziet.",
        "Leer de secundaire signalen zodat je de slimmere pogingen vangt. Support dat jou eerst aanschrijft is een alarmsignaal, want echte support wacht tot jij een ticket opent. Gegarandeerde of te-mooi-om-waar-te-zijn rendementen zijn aas. Lijkende domeinen vervangen of verdubbelen letters en voegen geruststellende woorden toe als secure of verify. Urgentie en aftelklokken bestaan om je oordeel te onderdrukken. En ongevraagde airdrops of trustline-spam zijn ontworpen om je te verleiden tot interactie met een kwaadaardige issuer, en daarom verhandelt deze bot alleen een whitelist van gescreende assets in plaats van wat dan ook dat in je account verschijnt.",
        "Je gewoonte, niet je slimheid, is de verdediging. Vertraag, typ bekende domeinen zelf in plaats van links te volgen, en verifieer het exacte adres teken voor teken. Wanneer iets je onder druk zet om die stappen over te slaan, is die druk zelf het signaal.",
      ],
      example: "Er komt ongevraagd een direct bericht binnen: Stellar Support hier, je wallet is gemarkeerd wegens verdachte activiteit, herstel de toegang binnen een uur op stellar-wallett-verify.com en bevestig je seed phrase. Drie signalen stapelen zich op — support dat jou eerst aanschrijft, het lijkende domein met de dubbele t, en een verzoek om je seed phrase onder een aftelklok van een uur. Een echte aanbieder zou geen van deze dingen doen, en heeft nooit je geheime sleutel nodig.",
    },
    {
      id: "c13-l3",
      title: "Ondertekensleutels, waarom ze het apparaat nooit verlaten, en hoe deze app ze behandelt",
      paragraphs: [
        "De reden waarom een geheime sleutel een vertrouwd apparaat nooit mag verlaten is structureel: op Stellar bestaat er geen herstelprocedure en geen apart accountwachtwoord. Bezit van de S-sleutel is zeggenschap. Een sleutel die door een webformulier, een chatbericht, een screenshot of een gedeeld bestand reist, is voor beveiligingsdoeleinden al openbaar gemaakt, want je kunt niet langer aantonen dat hij onderweg niet is onderschept.",
        "Deze app is zo opgebouwd dat de sleutel op de server blijft en nergens anders. De geheime sleutel wordt alleen aangeleverd als een server-side omgevingsvariabele, STELLAR_SECRET, die eenmaal bij het opstarten wordt gelezen. De browser-frontend ontvangt hem nooit, slaat hem nooit op, en verzendt hem nooit. Elke ondertekenoperatie gebeurt in de backend-signer, dus het sleutelmateriaal steekt het netwerk nooit over naar de client. De frontend stuurt alleen ooit een instructie om te handelen; hij kan zelf niets ondertekenen.",
        "Zeggenschap wordt vervolgens afgeschermd per modus. Zonder geconfigureerde geheime sleutel evalueert de app naar alleen-lezen, zodat hij kan kijken en plannen maar niets on-chain kan indienen. Zelfs met een sleutel aanwezig start hij standaard op in alleen-lezen — de auto-arm-vlag staat uit — en Live handelen moet bewust geactiveerd worden en vereist bovendien dat de positiemonitor draait voordat een echte indiening kan plaatsvinden. Paper trading heeft helemaal geen sleutel nodig, want fills worden gesimuleerd. Een kill switch zit hier overheen en blokkeert elke trade onmiddellijk.",
        "Als de geheime sleutel ooit wordt blootgesteld, behandel het dan als een actief incident, niet als een zorg. Publieke repositories en geplakte snippets worden binnen enkele minuten door bots gescand, en blootstelling staat gelijk aan diefstal zodra een aanvaller als eerste tekent. De juiste reactie is rotatie: maak een vers keypair aan, verplaats al het geld ernaartoe, stoot het oude account af, en vervang STELLAR_SECRET. Rotatie kost een transactiekost; herstel na een leeggetrokken account kost alles.",
      ],
      example: "Een teamlid plakt de productieconfiguratie, inclusief geheime sleutel, in een publieke issue tracker, acht minuten lang voordat het wordt verwijderd. Acht minuten is ruim voldoende — geautomatiseerde scanners bewaken publieke bronnen voortdurend. Het bericht verwijderen maakt de blootstelling niet ongedaan. De enige veilige zet is om STELLAR_SECRET onmiddellijk te roteren naar een nieuw keypair en het saldo over te hevelen voordat een aanvaller tekent.",
    },
    {
      id: "c13-l4",
      title: "De balanscontrole vooraf — hoe de frontend en backend je beschermen",
      paragraphs: [
        "Voordat een echte trade wordt ondertekend, voert de bot een balanscontrole vooraf uit, preflight genoemd. Hij beantwoordt een enkele vraag — zou deze transactie werkelijk afwikkelen, en het account gezond achterlaten? Alleen een volledig groen licht laat de bot doorgaan naar ondertekenen. Elke faling levert een nette blokkade met een machineleesbare reden op in plaats van een kansloze indiening, en cruciaal is dat de blokkade voor het ondertekenen gebeurt, zodat een gegarandeerde on-chain-faling zoals op_underfunded of op_no_trust nooit een netwerkkost verbrandt.",
        "Bescherming begint in de frontend als een snel eerste filter. Het handmatige orderformulier laat je alleen assets verkopen die je daadwerkelijk bezit, via een dropdown met enkel-aangehouden assets, toont je beschikbare saldo inline, en schakelt de order uit of markeert ze wanneer het bedrag groter is dan wat je hebt. Dat vangt de voor de hand liggende fout bij het toetsenbord, voordat er een verzoek de browser verlaat. Maar de frontend is gemak, geen gezag — hij kan omzeild worden, dus hij heeft nooit het laatste woord.",
        "De backend-controle in src/stellar/preflight.ts is gezaghebbend en draait ongeacht wat de frontend dacht. Hij bevestigt dat de publieke sleutel geconfigureerd is, dat het account bestaat en gefinancierd is op het juiste netwerk, en dat er een trustline bestaat voor de asset die de trade zou ONTVANGEN, want Stellar kan geen asset accepteren die je niet expliciet hebt vertrouwd. Vervolgens berekent hij het besteedbare saldo, niet het ruwe saldo. Besteedbaar is gelijk aan het saldo min de bedragen vastgezet in je open offers (selling_liabilities), min de XLM-basisreserve van (2 + subentry_count) x 0.5 XLM, min een bufferkost van ongeveer 0.05 XLM.",
        "Bij een faling retourneert hij een gestructureerde blokkade met een reden — no_public, account, no_trustline of insufficient_balance — samen met de vereiste-versus-beschikbare bedragen, zodat de oorzaak ondubbelzinnig is. Voor door AI of het systeem geinitieerde trades gaat hij een stap verder en activeert hij een cooldown van vijf minuten wegens onvoldoende saldo voor dat paar en die kant, zodat hetzelfde niet-financierbare voorstel niet opnieuw wordt opgeworpen terwijl je bijstort. Dit is een grove tijdpoort, dus het storten van de ontbrekende asset midden in de cooldown heft hem niet vroeger op.",
      ],
      example: "Een AI-aankoop zou bijna je hele XLM-bezit uitgeven. Preflight trekt de XLM af die vastzit in een bestaande open offer, de reserve van (2 + subentry_count) x 0.5, en de bufferkost, stelt vast dat het besteedbare bedrag tekortschiet ten opzichte van de kost, en retourneert insufficient_balance met de vereiste-versus-beschikbare cijfers. Er wordt geen transactie ondertekend, dus er wordt geen kost verspild, en het paar plus de kant wordt onder een cooldown van vijf minuten geparkeerd in plaats van bij elke scan opnieuw voorgesteld.",
    },
    {
      id: "c13-l5",
      title: "Best practices voor veilig handelen met deze app — een checklist",
      paragraphs: [
        "Begin waar fouten gratis zijn, en werk je dan omhoog. Draai eerst op het Stellar-testnet met een wegwerp-hot-wallet, en gebruik de Paper-modus, die fills simuleert en geen sleutel nodig heeft, om te bevestigen dat de strategie zich gedraagt voordat er enige mainnet-waarde op het spel staat. Houd je vroege positiegroottes klein en hang er trailing stops aan, zodat de prijs van het leren in lessen wordt betaald in plaats van in kapitaal.",
        "Bewaak de sleutel als het enige punt van volledige zeggenschap. Houd STELLAR_SECRET offline en server-side, plak hem nooit in een website of chat, en laat hem nooit in een screenshot, log of repository belanden. Blijf in alleen-lezen- of Paper-modus tot je oprecht hebt besloten om live te gaan, activeer Live handelen bewust in plaats van uit gewoonte, en bevestig dat de positiemonitor draait zodat stops en exits ook echt worden afgedwongen. Houd de kill switch binnen handbereik voor een onmiddellijke volledige stop.",
        "Laat de structurele bewakers hun werk doen, en respecteer hun weigeringen. Verhandel alleen whitelisted tokens zodat je nooit interactie hebt met een nep- of vijandige issuer. Vertrouw op de preflight-blokkade — wanneer hij no_trustline of insufficient_balance meldt, is de oplossing om de trustline op te zetten of het account te financieren, niet om de controle te overrulen. Dubbelcheck elk bestemmingsadres en stuur eerst een minuscuul testbedrag wanneer je naar iets nieuws stuurt, want onomkeerbaarheid betekent dat er geen tweede kans is.",
        "Bouw ten slotte een verificatielus in je routine. Bekijk de AI-log om te begrijpen waarom trades worden voorgesteld, geaccepteerd of geblokkeerd, zodat een misconfiguratie als een patroon opduikt in plaats van als een verrassend verlies. En als een sleutel ooit in welke vorm dan ook wordt blootgesteld, stop dan met handelen, roteer naar een vers keypair, en hevel het geld onmiddellijk over. Beveiliging is hier vooral gedisciplineerde gewoonte die consequent wordt toegepast, geruggesteund door bewakers die veilig falen.",
      ],
      example: "Een degelijke eerste week: oefen in Paper-modus op het testnet met een wegwerp-wallet, stel een conservatieve positiegrootte per trade en een strakke token-whitelist in, activeer dan Live handelen met een minuscuul mainnet-saldo, met de positiemonitor draaiend en de kill switch op een klik afstand. Je bekijkt elke sessie de AI-log en houdt STELLAR_SECRET strikt server-side, zodat je de randen van het systeem leert kennen zonder iets te riskeren dat je niet zou willen verliezen.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Waarom maakt onomkeerbaarheid crypto-risico's zoals een verkeerd adres of een gelekte sleutel zo ernstig?",
      options: [
        { text: "Omdat het terugdraaien van een bevestigde transactie een hoge netwerkkost met zich meebrengt.", explanation: "Onjuist. Terugdraaien is geen dure optie, het is simpelweg onmogelijk zodra de transactie in een ledger zit; de kost is irrelevant." },
        { text: "Zodra een transactie in een ledger zit, kan ze niet worden teruggedraaid, dus een verkeerd adres of een ondertekende scam is permanent en diefstal via een gelekte sleutel is definitief.", explanation: "Correct. Stellar heeft geen chargeback of undo, dus gewone fouten en sleutellekken worden permanente verliezen, en daarom telt preventie zwaarder dan herstel." },
        { text: "Omdat volatiele prijzen het onmogelijk maken om het verlies te waarderen.", explanation: "Onjuist. Prijsvolatiliteit is een apart probleem; het kerngevaar is dat de overdracht zelf niet ongedaan kan worden gemaakt, ongeacht de prijs." },
        { text: "Omdat het geld meerdere dagen nodig heeft om af te wikkelen, wat een lang blootstellingsvenster overlaat.", explanation: "Onjuist. Stellar wikkelt af in seconden, en snelle afwikkeling laat de onomkeerbaarheid juist eerder toeslaan in plaats van later." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q2",
      prompt: "Wat is het sterkste enkele teken dat een bericht een phishing- of scampoging is?",
      options: [
        { text: "Het vraagt je om je geheime sleutel of seed phrase in te voeren, te plakken of te bevestigen.", explanation: "Correct. Een legitieme app heeft nooit je geheime sleutel of herstelzin nodig, dus elk verzoek erom is sluitend bewijs van een scam, ongeacht de branding." },
        { text: "Het noemt Stellar of je wallet bij naam.", explanation: "Onjuist. Echte diensten noemen het platform ook, dus dat detail alleen bewijst niets." },
        { text: "Het bevat een klikbare link.", explanation: "Onjuist. Links zijn gewoon en niet inherent kwaadaardig; het verzoek om je sleutel is de echte verklikker, al moet je domeinen nog steeds zelf verifieren." },
        { text: "Het komt laat op de avond of in het weekend binnen.", explanation: "Onjuist. Timing is irrelevant; zowel geautomatiseerde als legitieme berichten kunnen op elk uur binnenkomen." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q3",
      prompt: "Hoe behandelt deze app de geheime ondertekensleutel, en waar dient de publieke sleutel voor?",
      options: [
        { text: "De frontend bewaart de geheime sleutel in de browser zodat hij trades snel kan ondertekenen, en de publieke sleutel is een back-up ervan.", explanation: "Onjuist. De frontend ziet de geheime sleutel nooit, en de publieke sleutel is geen back-up; het is het cryptografisch verschillende, deelbare adres." },
        { text: "Beide sleutels kunnen worden gedeeld zolang het account ook een wachtwoord heeft dat het beschermt.", explanation: "Onjuist. Stellar-accounts hebben geen apart wachtwoord, en de geheime sleutel alleen controleert al het geld, dus hij mag nooit worden gedeeld." },
        { text: "De geheime sleutel is de publieke sleutel omgekeerd, dus het beschermen van de ene beschermt beide.", explanation: "Onjuist. Het zijn onafhankelijke waarden uit een keypair, geen transformaties van elkaar; de publieke sleutel kan niet worden teruggerekend naar de geheime." },
        { text: "De geheime sleutel (S...) controleert al het geld en wordt alleen server-side geconfigureerd als STELLAR_SECRET zodat de browser hem nooit ziet, terwijl de publieke sleutel (G...) het deelbare adres is; de app start ook standaard op in alleen-lezen.", explanation: "Correct. Ondertekenen gebeurt alleen in de backend, de frontend ontvangt de sleutel nooit, de app start in alleen-lezen tot Live bewust wordt geactiveerd, en de G-sleutel is veilig om te delen voor het ontvangen." },
      ],
      correctIndex: 3,
    },
    {
      id: "c13-q4",
      prompt: "Wat verifieert de backend-balanscontrole vooraf (preflight) voordat de bot tekent, en waarom helpt vroeg blokkeren?",
      options: [
        { text: "Alleen dat de huidige marktprijs gunstig genoeg is om winstgevend te zijn.", explanation: "Onjuist. Preflight controleert de haalbaarheid van afwikkeling en de gezondheid van het account, niet of de prijs een goede deal is." },
        { text: "Dat het account bestaat, een trustline heeft voor de asset die het zal ontvangen, en genoeg besteedbaar saldo heeft na open offers, de XLM-reserve en de bufferkost; blokkeren voor het ondertekenen verspilt geen netwerkkost aan een kansloze op_underfunded of op_no_trust.", explanation: "Correct. Besteedbaar is het saldo min selling_liabilities, de reserve van (2 + subentry_count) x 0.5 XLM, en een bufferkost van ~0.05 XLM, en stoppen voor het ondertekenen betekent dat een gegarandeerde on-chain-faling niets kost." },
        { text: "Dat je de juiste geheime sleutel voor deze handelssessie hebt ingetypt.", explanation: "Onjuist. De sleutel is server-side configuratie, geen sessie-invoer; preflight valideert trustlines en besteedbaar saldo, niet het invoeren van de sleutel." },
        { text: "Dat er geen andere trader actief is in dezelfde markt op hetzelfde moment.", explanation: "Onjuist. Preflight gaat alleen over het vermogen van je eigen account om de trade te financieren en te ontvangen, niet over andere deelnemers." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Welke set gewoonten weerspiegelt het beste veilig handelen met deze app?",
      options: [
        { text: "Activeer Live handelen meteen, schakel de positiemonitor uit, en verhandel elk token dat in het account verschijnt.", explanation: "Onjuist. Dit stroopt de alleen-lezen-standaard af, de monitor die stops afdwingt, en de whitelist die je weghoudt van vijandige issuers." },
        { text: "Bewaar STELLAR_SECRET in een gedeelde cloudmap zodat de bot vanaf elke machine kan draaien.", explanation: "Onjuist. De geheime sleutel moet offline en server-side blijven; iedereen met toegang tot die map krijgt volledige controle over het geld." },
        { text: "Oefen in Paper-modus op het testnet met een wegwerp-wallet, verhandel alleen whitelisted tokens, activeer Live klein met de monitor draaiend en de kill switch paraat, en roteer elke blootgestelde sleutel.", explanation: "Correct. Dit gebruikt de gratis oefenmodi en elke ingebouwde bewaker, respecteert preflight-blokkades, en behandelt sleutelblootstelling als een incident, zodat je leert zonder noemenswaardig kapitaal te riskeren." },
        { text: "Overrule preflight-blokkades wanneer ze insufficient_balance melden zodat trades nooit worden gemist.", explanation: "Onjuist. Een preflight-blokkade betekent dat de trade zou falen of de reserve zou overschrijden; de oplossing is om het account te financieren of de trustline toe te voegen, niet om de controle te omzeilen." },
      ],
      correctIndex: 2,
    },
  ],
};
