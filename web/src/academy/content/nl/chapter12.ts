import type { Chapter } from "../../types";

export const chapter12: Chapter = {
  id: "c12",
  number: 12,
  level: "EXPERT",
  title: "Geavanceerde Stellar-functies",
  description:
    "Duik dieper in het SDEX-orderboek, trustlines, path payments, AMM-pools en het terugbrengen van je posities naar XLM.",
  lessons: [
    {
      id: "c12-l1",
      title: "Hoe de SDEX werkt — order matching, fees, settlement",
      paragraphs: [
        "De SDEX is de Stellar Decentralized Exchange, een orderboek dat in het protocol zelf leeft in plaats van op de servers van een bedrijf. Iedereen met een account kan orders indienen. Een manageSellOffer zegt ik geef zoveel van asset A op voor minstens deze prijs in asset B; een manageBuyOffer drukt dezelfde bedoeling uit vanuit de andere kant. Elke order blijft on-chain in het orderboek van zijn markt staan, bijvoorbeeld XLM tegen USDC, tot hij genomen, vervangen of geannuleerd wordt.",
        "Matching volgt prijs-dan-tijd-prioriteit. Het protocol vult eerst de openstaande order met de beste prijs, en wanneer twee orders dezelfde prijs delen, matcht de oudste voor de nieuwere. Een nieuwe order die het bestaande boek kruist, wordt onmiddellijk gematcht tegen die openstaande orders; wat er na het kruisen overblijft, wordt een nieuwe openstaande order op jouw limietprijs. Matching, de assetoverdrachten en settlement gebeuren allemaal atomisch binnen één ledger, die ongeveer elke vijf seconden sluit. Er is geen aparte clearingstap en geen wachten op confirmations buiten die ene ledger-sluiting.",
        "Het kostenmodel is ongewoon als je van gecentraliseerde platforms komt. Er is geen procentuele trading fee. Je betaalt de network base fee, momenteel 100 stroops, oftewel 0.00001 XLM per operatie, een fractie van een dollarcent. De echte kost van trading is de spread die je kruist wanneer je liquiditeit neemt, plus die piepkleine fee. Een spread van 10 basispunten kruisen om meteen gevuld te worden kost veel meer dan de network fee ooit zal doen.",
        "Deze bot is maker-first. In plaats van de spread te kruisen en de ask te betalen (of de bid te raken) om nu te traden, plaatst hij zijn eigen order op de beste bid of ask zodat hij als maker op het boek staat. Wanneer iemand anders ernaartoe kruist, vangt de bot de spread in plaats van hem te betalen. Hij kruist alleen als taker wanneer hij echt een onmiddellijke fill nodig heeft. Bij een edge die in eencijferige basispunten wordt gemeten, is het verschil tussen de spread betalen en hem vangen vaak het verschil tussen een winstgevende en een verlieslatende trade.",
      ],
      example:
        "Het XLM/USDC-boek toont een beste bid van 0.1170 en een beste ask van 0.1180, een spread van 10 bps. Een taker die nu koopt betaalt 0.1180. De maker-first bot plaatst in plaats daarvan een kooporder op 0.1170 en voegt zich bij de bid. Wanneer een verkoper later naar beneden kruist tot 0.1170, wordt de bot binnen die ledger-sluiting gevuld. Hij betaalde 100 stroops aan network fee en ving de spread in plaats van 0.0010 per XLM weg te geven.",
    },
    {
      id: "c12-l2",
      title: "Wat is een trustline en wanneer is er een nodig?",
      paragraphs: [
        "Een trustline is een expliciete opt-in, aangemaakt met de changeTrust-operatie, die je account autoriseert om een specifieke niet-native asset aan te houden. Stellar identificeert elke niet-native asset met een code plus het uitgevende account, geschreven als CODE:ISSUER. Dat paar doet ertoe: USDC uitgegeven door Circle is een compleet andere asset dan elke andere token die zichzelf ook USDC noemt. Een trustline is naar één exact paar van code en uitgever, dus de USDC van Circle vertrouwen laat je niet de USDC van een andere uitgever aanhouden.",
        "De ene asset die nooit een trustline nodig heeft is XLM, de native lumen. Elk account kan standaard XLM aanhouden en versturen. Al het andere, elke uitgegeven token, vereist een trustline voordat je account er enige hoeveelheid van kan ontvangen of aanhouden. Stuur iemand een asset waarvoor hij geen trustline heeft en de betaling mislukt gewoon.",
        "Trustlines kosten geblokkeerde reserve. Elke open trustline is een subentry op je account, en elke subentry verhoogt je minimale XLM-reserve met 0.5 XLM. Die 0.5 XLM staat vast zolang de line open is: hij kan niet worden uitgegeven, verhandeld of opgenomen tot je de trustline verwijdert. Vijf open trustlines zetten dus 2.5 XLM vast bovenop de base reserve, en dat geblokkeerde bedrag is puur een aanhoudkost, nooit uitgegeven of verdiend. Een trustline sluiten voor een asset die je niet meer aanhoudt wint die 0.5 XLM terug, en daarom sluiten nette wallets de lines die ze niet meer nodig hebben.",
        "Deze bot beschermt tegen de val van de mislukte betaling met een balanscontrole vooraf. Voordat hij een trade ondertekent, verifieert hij dat er al een trustline bestaat voor welke asset de trade ook zou ontvangen. Een aankoop die USDC zou binnenhalen wordt alleen ondertekend als het account die exacte USDC-uitgever al vertrouwt. De controle gebeurt voor het ondertekenen, niet na een afwijzing, dus de bot verspilt nooit een transactie door bij de settlement te ontdekken dat hij nergens de net gekochte asset kwijt kon.",
      ],
      example:
        "Je wilt dat de bot USDC van Circle koopt. Eerst open je op het dashboard een trustline naar USDC:Circle-issuer. Die subentry verhoogt je minimale XLM-reserve met 0.5 XLM, en zet dat bedrag vast zolang de line open blijft. Nu komt een aankoop die de USDC van Circle ontvangt door de controle vooraf en wordt ondertekend. Verkoop later al die USDC en sluit de trustline, en de 0.5 XLM komt weer vrij in je besteedbare balans.",
    },
    {
      id: "c12-l3",
      title: "Wat is een path payment en hoe gebruikt deze app die om naar XLM te swappen",
      paragraphs: [
        "Een path payment zet een te sturen asset om in een andere te ontvangen asset binnen één atomische transactie, waarbij hij via een of meer tussenliggende markten hopt om een route te vinden. Stellar biedt twee vormen. pathPaymentStrictSend zet het bedrag dat je stuurt vast en laat het ontvangen bedrag zakken tot een minimum dat je instelt; pathPaymentStrictReceive zet het bedrag dat je wilt ontvangen vast en laat het verstuurde bedrag oplopen tot een maximum dat je instelt. Hoe dan ook loopt het netwerk een pad af, bijvoorbeeld asset A naar een middenasset naar asset C, en de hele hop wordt samen afgewikkeld of helemaal niet.",
        "Atomiciteit is de sleuteleigenschap. De volledige conversie wordt ofwel over elke hop voltooid, ofwel draait alles terug zonder dat er iets verandert. Je kunt nooit halverwege stranden met een ongewenste tussenasset omdat één leg mislukte. Dat maakt path payments een net hulpmiddel om te schuiven tussen assets die je daadwerkelijk wilt aanhouden.",
        "Deze app gebruikt path payments voor de Swap- en Convert-functie van de wallet, en niet voor de geautomatiseerde orderboek-trading-loop. Wanneer je een swap aanvraagt, geeft de app een quote terug die sendAsset, sendAmount, destAsset, destAmount beschrijft en de path die hij vond, de geordende lijst van tussenliggende assets waar de route doorheen loopt. Je bekijkt die quote voordat je je vastlegt, zodat je de volledige conversie, de route en het geschatte bedrag dat je zou ontvangen ziet voordat er iets wordt ondertekend.",
        "Auto-swap naar XLM is deze functie gericht op de lumen: niet-XLM-posities terugbrengen naar XLM via diezelfde swap. De twee belangrijkste redenen zijn positionering en reserve. XLM aanhouden maakt de XLM-verkopende koopkant van de strategie vrij, want de bot kan alleen XLM in een dip verkopen als hij ook echt XLM aanhoudt. En een grotere XLM-balans vult de minimale reserve aan die het basisaccount en elke open trustline vragen. De swap is het mechanisme; auto-swap naar XLM is gewoon XLM kiezen als de bestemmingsasset.",
      ],
      example:
        "Je houdt yXLM aan en wilt gewone XLM, maar het directe yXLM-naar-XLM-boek is dun. Je vraagt een swap aan. De app geeft een quote terug: sendAsset yXLM, sendAmount 100, destAsset XLM, destAmount ongeveer 99.4, met een path die yXLM via USDC naar XLM routeert. Je bekijkt het en accepteert. De path payment voert beide hops atomisch uit in één ledger: ofwel eindig je met ongeveer 99.4 XLM, ofwel draait de hele transactie terug en houd je je 100 yXLM.",
    },
    {
      id: "c12-l4",
      title: "AMM liquidity pools versus het orderboek",
      paragraphs: [
        "Stellar ondersteunt twee manieren om een assetpaar te verhandelen: het orderboek en automated market maker-pools. Het orderboek, de SDEX, is een verzameling discrete openstaande orders op specifieke prijzen, gematcht prijs-dan-tijd zoals eerder behandeld. Een AMM liquidity pool is anders van vorm. Hij houdt een reserve van twee assets samen, gefinancierd door liquidity providers die beide kanten storten, en traders swappen tegen de pool in plaats van tegen de order van een andere trader.",
        "Een pool prijst elke swap met een constant-product-formule, x times y equals k. Het product van de twee reserves blijft constant naarmate de ene kant wordt gekocht en de andere verkocht, dus hoe meer van de ene asset je eruit trekt, hoe scherper de prijs zich tegen je beweegt. Dat is price impact, en die groeit met de tradeomvang: een kleine swap beweegt de koers nauwelijks, een grote swap kan hem flink bewegen. Tegen een orderboek loop je daarentegen discrete openstaande orders niveau voor niveau af. De twee plekken hebben echt verschillende slippage-profielen voor dezelfde nominale trade.",
        "Wees precies over wat deze bot doet. Zijn geautomatiseerde trading gebruikt het SDEX-orderboek, met maker-first openstaande orders zoals in de eerdere lessen beschreven. De strategie richt zich niet op AMM-pools en bemeet trades niet tegen een constant-product-curve. Pools worden hier gepresenteerd als een algemeen Stellar-mechanisme dat je zult tegenkomen, niet als een plek waar de trading-loop op mikt.",
        "Er is één subtiele overlap. Een path payment, die de Swap-functie aandrijft, kan op protocolniveau toevallig via een AMM-pool routeren als het netwerk vindt dat het beste pad daardoor loopt. Dat is het protocol dat een efficiënte route kiest voor één eenmalige conversie, en het staat volledig los van de orderboek-trading die de scan-loop uitvoert. Een pool kan dus je wallet raken via een swap, maar nooit via de geautomatiseerde strategie.",
      ],
      example:
        "Stel je een XLM/USDC-pool voor met 100000 XLM en 12000 USDC, dus k is 1.2 miljard en de marginale prijs is 0.12. Swap 1200 USDC in en de USDC-reserve stijgt tot 13200; om k constant te houden daalt de XLM-reserve tot ongeveer 90909, dus je ontvangt ongeveer 9091 XLM tegen een gemiddelde koers slechter dan 0.12, de price impact. De bot negeert deze pool voor geautomatiseerde trades en plaatst in plaats daarvan orders op het orderboek, al zou een eenmalige Swap-quote er legitiem doorheen kunnen routeren.",
    },
    {
      id: "c12-l5",
      title: "Is een auto-swap naar XLM het waard? De winstgevendheidsberekening",
      paragraphs: [
        "Er zit geen automatische winstchecker in de trading-loop die voor jou beslist of een auto-swap naar XLM rendeert. De loop verhandelt het orderboek; hij evalueert of triggert niet stilletjes swaps. Beoordelen of een swap het waard is, is jouw taak, en de Swap-quote geeft je alles wat je daarvoor nodig hebt. Behandel de quote als een klein rekenblad in plaats van een knop.",
        "De methode is om destAmount, de XLM die de quote zegt dat je zou ontvangen, te vergelijken met de waarde van wat je opgeeft. Wat je opgeeft is sendAmount van de te sturen asset, gewaardeerd tegen een eerlijke referentiekoers. Het gat tussen de twee wordt opgegeten door de spread die je onderweg over het pad kruist plus de network fee per operatie van 100 stroops. Een pad met meerdere hops is duurder dan één hop, omdat je een spread kruist bij elke markt waar de route doorheen gaat, niet maar één keer. Een route met twee hops kan dus stilletjes twee spreads kosten.",
        "Een swap is het waard wanneer de gequoteerde ontvangen XLM je beste alternatief verslaat. De alternatieven zijn meestal: de asset aanhouden zoals hij is, of hem verkopen op een diepere directe markt en daarna zelf XLM kopen. Als een directe markt voor je asset dieper is dan het swap-pad, kan daar verkopen en handmatig converteren minder aan spread verliezen dan een dunne route met meerdere hops. De quote kent je alternatieven niet; jij levert dat oordeel door zijn destAmount te vergelijken met wat die andere routes zouden opleveren.",
        "Werk een voorbeeld uit met echte cijfers. Stel dat je 50 USDC aanhoudt en de eerlijke XLM-prijs is 0.12, dus een wrijvingsloze conversie zou 50 gedeeld door 0.12 geven, ongeveer 416.7 XLM. De Swap-quote geeft een destAmount van 414.0 XLM terug via een route met één hop. Het tekort van ongeveer 2.7 XLM, grofweg 0.65 procent, is de gekruiste spread plus de verwaarloosbare fee van 100 stroops. Als de USDC aanhouden of hem verkopen op een dieper direct boek je meer dan 414.0 XLM aan waarde zou opleveren, sla de swap dan over. Als 414.0 XLM echt het beste is wat je kunt doen en je XLM nodig hebt om de koopkant vrij te maken of de reserve aan te vullen, dan is de swap het waard. De rekensom, niet een ingebouwde checker, maakt de keuze.",
      ],
      example:
        "Je houdt 50 USDC aan; de eerlijke koers is 0.12, dus wrijvingsloos is ongeveer 416.7 XLM. Een Swap-quote met één hop toont destAmount 414.0 XLM, een afslag van 0.65 procent voor de spread plus de fee van 100 stroops. Een quote met twee hops via AQUA toont 410.5 XLM, slechter omdat hij twee spreads kruist. Je neemt de route met één hop van 414.0 alleen omdat je XLM nodig hebt voor de reserve en geen diepere directe markt hem zou verslaan.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Hoe matcht de SDEX orders en rekent hij fees aan, en hoe handelt deze bot erop?",
      options: [
        {
          text: "Hij matcht prijs-dan-tijd en wikkelt atomisch af binnen een ledger; er is geen procentuele fee, alleen een piepkleine base fee per operatie plus elke gekruiste spread, en de bot is maker-first om de spread te vangen.",
          explanation:
            "Correct. De SDEX vult beste-prijs-eerst en dan oudste-eerst, wikkelt af binnen één ledger van ongeveer vijf seconden, rekent alleen de base fee van 100 stroops plus de spread die je kruist, en deze bot plaatst orders om die spread te vangen in plaats van te betalen.",
        },
        {
          text: "Hij rekent een procentuele trading fee op elke fill en wikkelt af na meerdere block confirmations, en de bot kruist altijd de spread als taker.",
          explanation:
            "Onjuist. Er is geen procentuele fee, settlement is atomisch binnen één ledger in plaats van vele confirmations, en de bot is maker-first in plaats van altijd te nemen.",
        },
        {
          text: "Hij matcht de nieuwste orders eerst en wikkelt off-chain af via een exchange-operator, waarbij de bot die operator een commissie betaalt.",
          explanation:
            "Onjuist. Matching is oudste-eerst bij een gegeven prijs, settlement is on-chain en atomisch, en er is geen operator of commissie.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q2",
      prompt: "Wanneer is een trustline vereist, en wat kost het om er een te openen?",
      options: [
        {
          text: "Voordat je welke asset dan ook aanhoudt, inclusief XLM, en het kost een procentuele fee bij elke ontvangst.",
          explanation:
            "Onjuist. XLM is native en heeft nooit een trustline nodig, en de kost is een geblokkeerde reserve, geen procentuele fee.",
        },
        {
          text: "Voordat je account een specifieke niet-native CODE:ISSUER-asset zoals de USDC van Circle kan aanhouden, en elke open trustline zet 0.5 XLM vast in je minimale reserve.",
          explanation:
            "Correct. Een trustline is de opt-in voor één exact paar van code en uitgever, XLM heeft er nooit een nodig, en elke open line verhoogt je minimale reserve met 0.5 XLM tot hij gesloten wordt.",
        },
        {
          text: "Pas zodra een trade al is mislukt bij gebrek aan een trustline, en het kost niets.",
          explanation:
            "Onjuist. De controle vooraf verifieert de trustline voor het ondertekenen in plaats van na een mislukking, en elke line zet 0.5 XLM aan reserve vast.",
        },
        {
          text: "Voordat je XLM naar een nieuw account stuurt, en het verbrandt permanent 0.5 XLM.",
          explanation:
            "Onjuist. XLM versturen heeft geen trustline nodig, en de 0.5 XLM is geblokkeerde reserve die je terugkrijgt wanneer je de line sluit, niet verbrand.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q3",
      prompt: "Wat doet een path payment, en hoe gebruikt deze app die?",
      options: [
        {
          text: "Het splitst een betaling op in meerdere onafhankelijke transacties die elk op zichzelf worden afgewikkeld.",
          explanation:
            "Onjuist. Een path payment is één atomische transactie; ofwel wordt de hele conversie voltooid, ofwel draait alles volledig terug.",
        },
        {
          text: "Het is het mechanisme achter elke geautomatiseerde orderboek-trade die de bot doet.",
          explanation:
            "Onjuist. De geautomatiseerde loop gebruikt SDEX-orderboekorders; path payments drijven daarentegen de Swap- en Convert-functie van de wallet aan.",
        },
        {
          text: "Het zet een te sturen asset om in een andere te ontvangen asset, atomisch via een of meer hops, en de app gebruikt het voor de Swap- en Convert-functie van de wallet, en geeft een quote terug met sendAsset, destAmount en de path.",
          explanation:
            "Correct. Een path payment hopt via tussenliggende markten in één atomische transactie, en de app gebruikt het voor swaps, inclusief auto-swap naar XLM, en toont de route en het geschatte ontvangen bedrag voordat je je vastlegt.",
        },
        {
          text: "Het opent automatisch een trustline voor welke asset je ook ontvangt.",
          explanation:
            "Onjuist. Trustlines worden apart geopend met changeTrust op het dashboard; een path payment zet assets om en maakt geen trustlines aan.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q4",
      prompt: "Hoe verschilt een AMM-pool van het orderboek, en welke verhandelt de geautomatiseerde loop van deze bot?",
      options: [
        {
          text: "Een pool prijst swaps langs een constant-product-curve met omvangafhankelijke impact, het orderboek matcht discrete openstaande orders, en de geautomatiseerde loop van de bot verhandelt het orderboek.",
          explanation:
            "Correct. AMM-pools gebruiken x times y equals k zodat grotere trades de prijs meer bewegen, het orderboek gebruikt discrete orders, en de geautomatiseerde loop plaatst maker-first orders op het orderboek, niet op pools.",
        },
        {
          text: "Een pool en het orderboek zijn hetzelfde mechanisme, en de bot routeert elke geautomatiseerde trade via de pool.",
          explanation:
            "Onjuist. Het zijn verschillende mechanismen, en de geautomatiseerde loop verhandelt het orderboek in plaats van via pools te routeren.",
        },
        {
          text: "Een pool is een verzameling discrete openstaande orders, het orderboek is een constant-product-curve, en de bot verhandelt de curve.",
          explanation:
            "Onjuist. De omschrijvingen zijn omgewisseld: het orderboek houdt discrete orders en de pool is de constant-product-curve, en de bot verhandelt het orderboek.",
        },
        {
          text: "Een pool heeft nul price impact bij elke omvang, dus de bot routeert zijn geautomatiseerde trades daar om slippage te vermijden.",
          explanation:
            "Onjuist. Een constant-product-pool heeft price impact die groeit met de omvang, en de bot verhandelt het orderboek in plaats van pools.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q5",
      prompt: "Hoe moet je beoordelen of een auto-swap naar XLM het waard is?",
      options: [
        {
          text: "Vertrouw op een ingebouwde winstchecker in de trading-loop die automatisch beslist of elke swap rendeert.",
          explanation:
            "Onjuist. Er is geen automatische winstchecker in de trading-loop; je evalueert de swap zelf vanuit de quote.",
        },
        {
          text: "Neem aan dat elke swap de moeite waard is omdat de network fee piepklein is, en negeer de spread.",
          explanation:
            "Onjuist. De dominante kost is de spread die je over het pad kruist, en een route met meerdere hops kruist er een bij elke hop; de piepkleine fee is niet de doorslaggevende factor.",
        },
        {
          text: "Vergelijk de destAmount van de quote in XLM met de waarde van wat je opgeeft, trek de spread die je bij elke hop kruist en de fee per operatie af, en neem het alleen als dat aanhouden of verkopen op een diepere directe markt verslaat.",
          explanation:
            "Correct. Je leest destAmount tegenover de eerlijke waarde van sendAmount, houdt rekening met de spread bij elke hop plus de fee van 100 stroops, en swapt alleen wanneer de ontvangen XLM je alternatieven verslaat.",
        },
        {
          text: "Kies welke quote ook de meeste hops heeft, want meer hops betekent altijd een betere prijs.",
          explanation:
            "Onjuist. Meer hops betekent meer gekruiste spreads, wat de route meestal slechter maakt, niet beter.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
