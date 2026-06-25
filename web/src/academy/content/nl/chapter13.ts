import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Je assets beschermen",
  description: "De echte beveiligingsrisico's in crypto en hoe deze bot zich ertegen wapent, van sleutelbeveiliging tot de balanscontrole vooraf.",
  lessons: [
    {
      id: "c13-l1",
      title: "Wat zijn de grootste beveiligingsrisico's in crypto?",
      paragraphs: [
        "Crypto is op een specifiek punt genadeloos: acties zijn definitief. Zodra een Stellar-transactie bevestigd is, is ze onomkeerbaar. Er is geen bank om te bellen, geen chargeback, geen helpdesk die je geld kan terughalen. Dat ene feit hertekent elk risico daaronder, want een fout is meestal permanent.",
        "De grootste risico's vallen uiteen in een handvol categorieen. Het verliezen of lekken van je geheime ondertekensleutel geeft een aanvaller volledige controle over je geld. Phishing en nepsites verleiden je ertoe die sleutel zelf weg te geven. Het ondertekenen van een kwaadaardige transactie kan een overdracht goedkeuren die je nooit bedoeld had. Naar het verkeerde adres sturen verplaatst je geld voorgoed naar een vreemde. En het vertrouwen op een nep-token of nep-issuer kan je achterlaten met iets waardeloos dat er alleen maar echt uitziet.",
        "Merk op dat de meeste hiervan geen exotische hacks zijn. Het zijn gewone menselijke fouten, versterkt door onomkeerbaarheid. De verdediging zit niet in slimheid; ze zit in trage, bewuste gewoonten en tools die slechte acties blokkeren voordat ze de chain bereiken. Dat is precies waarvoor deze bot is gebouwd.",
      ],
      example: "Je plakt een bestemmingsadres vanaf je klembord, maar malware heeft het verwisseld voor het adres van de aanvaller. Je bevestigt. Het geld belandt binnen enkele seconden op hun rekening, en geen enkele kracht op aarde kan dat ongedaan maken. Een controle van twee seconden van de eerste en laatste tekens zou het hebben tegengehouden.",
    },
    {
      id: "c13-l2",
      title: "Hoe herken je een scam of phishingpoging",
      paragraphs: [
        "Phishing is de kunst van het zich voordoen als iemand anders. Een aanvaller bouwt een site of bericht dat eruitziet als een wallet, een exchange of een supportteam, en duwt je er dan toe je geheime sleutel of herstelzin in te voeren. De valstrik bestaat uit urgentie en vertrouwdheid: een waarschuwing dat je account gevaar loopt, een gulle airdrop, een loginpagina die er exact goed uitziet.",
        "Houd vast aan een regel en de meeste phishing faalt: een legitieme app zal nooit naar je geheime sleutel vragen via e-mail, chat of een webformulier. Je sleutel ondertekent transacties op je eigen machine; geen enkele echte dienst hoeft hem te zien. Als iets je vraagt om een sleutel te plakken die met een S begint, beschouw dat dan als bewijs dat het een scam is.",
        "Daarnaast: vertraag en verifieer. Controleer het exacte domein, teken voor teken, want gelijkende letters en extra woorden komen vaak voor. Wees argwanend bij ongevraagde links en bij druk om snel te handelen. Bij twijfel ga je zelf naar de site in plaats van een link te volgen die iemand je heeft gestuurd.",
      ],
      example: "Er komt een bericht binnen: Je wallet is gemarkeerd, verifieer binnen een uur op stellar-wallett-secure.com of verlies de toegang. De dubbele t in het domein en de eis om je seed phrase zijn de signalen. Een echte aanbieder zou nooit je geheime sleutel nodig hebben, en zou nooit een aftelklok inzetten om je in paniek te brengen.",
    },
    {
      id: "c13-l3",
      title: "Wat is een ondertekensleutel en waarom moet je hem beschermen?",
      paragraphs: [
        "Een Stellar-account heeft twee sleutels. De publieke sleutel begint met G en is veilig om te delen; het is als een rekeningnummer dat anderen gebruiken om jou te betalen. De geheime ondertekensleutel begint met S en moet privé blijven. Wie de geheime sleutel bezit, kan transacties ondertekenen, wat betekent dat hij elke asset in het account kan verplaatsen. Er is geen apart wachtwoord dat er bovenop ligt.",
        "Deze bot heeft de geheime sleutel geconfigureerd nodig zodat hij live trades namens jou kan ondertekenen. Om die macht in te dammen, start hij standaard op in alleen-lezenmodus en zal hij pas echte transacties indienen zodra je bewust Live handelen activeert. Tot dan kan hij kijken en plannen, maar niets uitgeven. De machine en omgeving waarop de sleutel staat, zijn daarom net zo gevoelig als een kluis; iedereen met toegang daartoe heeft in feite toegang tot je geld.",
        "Behandel blootstelling als een noodgeval. Als de geheime sleutel ooit opduikt in een screenshot, een log, een gedeeld bestand of een code-repository, ga er dan van uit dat hij gecompromitteerd is en roteer hem: maak een nieuw account aan, verplaats het geld en stoot de oude sleutel af. Roteren is goedkoop; herstel na diefstal is onmogelijk.",
      ],
      example: "Een ontwikkelaar commit een configuratiebestand met de live S-sleutel naar een publieke git-repository, tien minuten lang voordat hij het verwijdert. Dat is genoeg. Bots scannen publieke repos voortdurend. De juiste reactie is niet hopen dat niemand het zag, maar onmiddellijk de sleutel roteren en het saldo naar een vers account verplaatsen.",
    },
    {
      id: "c13-l4",
      title: "Wat is de balanscontrole vooraf en hoe beschermt ze je?",
      paragraphs: [
        "Voordat de bot een trade ondertekent, voert hij een balanscontrole vooraf uit, ook wel preflight genoemd. Het is een bewaker die zich afvraagt: zou deze transactie werkelijk slagen en het account gezond achterlaten? Alleen als elk antwoord ja is, gaat de bot over tot ondertekenen. Als een controle faalt, blokkeert hij de trade netjes in plaats van iets in te dienen dat on-chain zou mislukken of stilletjes te veel zou uitgeven.",
        "De controle vooraf verifieert in het bijzonder drie dingen. Ten eerste dat het account bestaat en gefinancierd is. Ten tweede dat het een trustline heeft voor de asset die het zou ontvangen, want Stellar kan geen asset accepteren die je niet expliciet hebt vertrouwd. Ten derde dat er genoeg besteedbaar saldo is zodra je de bedragen aftrekt die vastzitten in open offers, de XLM-minimumreserve die het netwerk vereist, en een kleine buffer voor de transactiekosten.",
        "Het draait om bescherming tegen jezelf. Zonder preflight zou een marginale trade na indiening kunnen mislukken, kosten verspillen, of in de reserve duiken en het account in gevaar brengen. Met preflight worden kansloze trades tegengehouden voordat ze je iets kosten, en krijg je een duidelijke reden in plaats van een cryptische on-chain-fout.",
      ],
      example: "Je zet een aankoop in de wachtrij die bijna je hele XLM-saldo zou uitgeven. Preflight trekt de fondsen af die vastzitten in een bestaande open offer, de minimumreserve en de buffer voor de kosten, en stelt vast dat het besteedbare bedrag tekortschiet. Het blokkeert de trade en meldt onvoldoende besteedbaar saldo, waardoor je een mislukte indiening en een uitgeputte reserve bespaard blijft.",
    },
    {
      id: "c13-l5",
      title: "Best practices voor veilig handelen met deze app",
      paragraphs: [
        "Begin waar fouten gratis zijn. Oefen in Paper-modus, die trades simuleert zonder echt geld, en draai op het Stellar-testnet met een wegwerp-hot-wallet voordat je geld op mainnet aanraakt. Wanneer je dan live gaat, begin klein. De kosten van het leren zouden gemeten moeten worden in lessen, niet in verloren kapitaal.",
        "Steun op de ingebouwde veiligheidslagen. De alleen-lezenmodus laat de bot kijken zonder uit te geven. De kill switch blokkeert al het handelen onmiddellijk wanneer je wilt stoppen. Limieten per trade en op het dagverlies begrenzen hoeveel een enkele trade of een slechte dag je kan kosten. Een whitelist van toegestane tokens houdt de bot weg van nep- of niet-vertrouwde issuers. Samen veranderen ze een snel geautomatiseerd systeem in een dat je kunt intomen.",
        "Bewaak ten slotte de sleutel en blijf bewust over het livegaan. Houd de geheime sleutel weg van gedeelde machines en uit logs en repositories. Laat de bot in zijn standaard alleen-lezentoestand totdat je echt hebt besloten om Live handelen te activeren, en heroverweeg die beslissing in plaats van hem uit gewoonte geactiveerd te laten. Beveiliging is hier vooral discipline die routine geworden is.",
      ],
      example: "Een verstandige eerste week: draai Paper-modus op het testnet met een wegwerp-wallet om te bevestigen dat de strategie zich gedraagt, stel een voorzichtige limiet op het dagverlies en een strakke token-whitelist in, activeer dan Live handelen met een minuscuul saldo en de kill switch op een klik afstand. Je leert de randen van het systeem kennen zonder iets in te zetten dat je niet zou willen verliezen.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Waarom maakt onomkeerbaarheid crypto-risico's zo ernstig?",
      options: [
        { text: "Bevestigde transacties kunnen niet worden teruggedraaid, dus een verkeerd adres of een ondertekende scam is meestal permanent.", explanation: "Correct. Er is geen chargeback of bank om een bevestigde Stellar-transactie ongedaan te maken, en daarom worden gewone fouten permanente verliezen." },
        { text: "Omdat exchanges hoge kosten rekenen om een betaling terug te draaien.", explanation: "Onjuist. Terugdraaien is geen dure optie, het is gewoon onmogelijk zodra een transactie bevestigd is." },
        { text: "Omdat crypto-prijzen te snel veranderen om een trade ongedaan te maken.", explanation: "Onjuist. Prijsvolatiliteit is een apart probleem; het kerngevaar is dat de overdracht zelf niet ongedaan kan worden gemaakt, ongeacht de prijs." },
        { text: "Omdat je meerdere dagen moet wachten voordat het geld is afgewikkeld.", explanation: "Onjuist. Stellar wikkelt in seconden af, en snelle afwikkeling laat de onomkeerbaarheid juist eerder toeslaan, niet later." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q2",
      prompt: "Wat is het sterkste enkele teken dat een bericht een phishingpoging is?",
      options: [
        { text: "Het noemt Stellar of je wallet bij naam.", explanation: "Onjuist. Legitieme diensten noemen het platform ook; dat alleen bewijst niets." },
        { text: "Het vraagt je om je geheime sleutel of seed phrase in te voeren of te plakken.", explanation: "Correct. Een legitieme app vraagt nooit naar je geheime sleutel via e-mail, chat of webformulier, dus elk dergelijk verzoek is een duidelijk scam-signaal." },
        { text: "Het komt buiten de normale kantooruren binnen.", explanation: "Onjuist. Timing is irrelevant; zowel geautomatiseerde als echte berichten komen op elk uur binnen." },
        { text: "Het bevat een klikbare link.", explanation: "Onjuist. Links zijn gewoon en niet inherent kwaadaardig; het verzoek om je sleutel is de echte verklikker, al moet je domeinen nog steeds verifieren." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q3",
      prompt: "Wat is het verschil tussen een Stellar publieke sleutel en een geheime sleutel?",
      options: [
        { text: "De publieke sleutel ondertekent trades en de geheime sleutel ontvangt alleen geld.", explanation: "Onjuist. Het is omgekeerd: de geheime sleutel ondertekent en controleert het geld, de publieke sleutel is om te ontvangen." },
        { text: "Beide sleutels kunnen vrij worden gedeeld zolang het account een wachtwoord heeft.", explanation: "Onjuist. Stellar-accounts hebben geen apart wachtwoord; de geheime sleutel alleen controleert het geld en moet privé blijven." },
        { text: "De publieke sleutel begint met G en is veilig om te delen, terwijl de geheime sleutel met S begint en al het geld controleert.", explanation: "Correct. Wie de S-sleutel bezit, kan transacties ondertekenen en elke asset verplaatsen, dus hij moet privé worden gehouden terwijl de G-sleutel deelbaar is." },
        { text: "De geheime sleutel is gewoon een weergaveversie van de publieke sleutel.", explanation: "Onjuist. Ze zijn cryptografisch verschillend; de geheime sleutel is de privé-ondertekensleutel, niet een weergave van de publieke." },
      ],
      correctIndex: 2,
    },
    {
      id: "c13-q4",
      prompt: "Wat verifieert de balanscontrole vooraf (preflight) voordat de bot een trade ondertekent?",
      options: [
        { text: "Alleen dat de huidige marktprijs gunstig is.", explanation: "Onjuist. Preflight controleert de gezondheid en haalbaarheid van het account, niet of de prijs een goede deal is." },
        { text: "Dat het account bestaat, een trustline heeft voor de asset die het zal ontvangen, en genoeg besteedbaar saldo heeft na offers, reserve en kosten.", explanation: "Correct. Deze drie controles zorgen ervoor dat de trade on-chain kan slagen en de reserve niet zal overschrijden, zodat kansloze trades netjes worden geblokkeerd." },
        { text: "Dat je de juiste geheime sleutel voor de sessie hebt ingevoerd.", explanation: "Onjuist. Sleutelconfiguratie staat los; preflight valideert saldi en trustlines, niet het invoeren van de sleutel." },
        { text: "Dat geen andere bot tegelijkertijd hetzelfde token verhandelt.", explanation: "Onjuist. Preflight gaat over het vermogen van je eigen account om de trade te financieren, niet over de activiteit van andere traders." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Welke set gewoonten weerspiegelt het beste veilig handelen met deze app?",
      options: [
        { text: "Activeer Live handelen meteen, schakel de verlieslimieten uit, en verhandel het hele token-universum om de kansen te maximaliseren.", explanation: "Onjuist. Dit verwijdert elke veiligheidslaag in een keer; limieten, een whitelist en een voorzichtige start bestaan juist om dit te voorkomen." },
        { text: "Bewaar de geheime sleutel in een gedeelde cloudmap zodat je vanaf elk apparaat kunt handelen.", explanation: "Onjuist. De geheime sleutel moet weg blijven van gedeelde machines en opslag; iedereen met toegang ertoe controleert je geld." },
        { text: "Oefen in Paper-modus op het testnet met een wegwerp-wallet, behoud verlieslimieten en een token-whitelist, ga dan klein live met de kill switch paraat.", explanation: "Correct. Dit gebruikt de gratis oefenmodi en ingebouwde bewakers zodat je de randen van het systeem leert kennen zonder noemenswaardig kapitaal te riskeren." },
        { text: "Laat Live handelen permanent geactiveerd zodat je nooit een kans mist.", explanation: "Onjuist. De bot staat niet voor niets standaard op alleen-lezen; je zou Live bewust moeten activeren en die beslissing heroverwegen in plaats van hem uit gewoonte aan te laten." },
      ],
      correctIndex: 2,
    },
  ],
};
