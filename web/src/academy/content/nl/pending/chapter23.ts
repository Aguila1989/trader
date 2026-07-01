// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// BASIC-hoofdstuk over Marktcycli: bull- en bearmarkten, altseasons,
// correcties versus crashes, waarom munten samen bewegen, en hoe je kalm blijft
// tijdens een neergang. Geschreven in exact dezelfde vorm als content/en/pending/chapter22.ts.
// De enige toevoeging is de per-hoofdstuk `whoFor` oneliner, getypeerd via een lokale
// intersectie zodat de live Chapter-interface onaangeroerd blijft tot de integratie.
// Nieuwe BASIC-glossariumtermen die hier worden geïntroduceerd (bull market, bear market,
// altseason, market correction, market crash) leven in glossary.pending.ts, NIET in het
// live glossarium, en worden letterlijk in de tekst gespeld zodat de eerste vermelding
// automatisch naar een tooltip linkt.
import type { Chapter } from "../../../types";

export const chapter23: Chapter & { whoFor: string } = {
  id: "c23",
  number: 23,
  level: "BASIC",
  whoFor: "Voor traders die kalm willen blijven tijdens de ups en downs",
  title: "Marktcycli",
  description:
    "Stierenmarkten en berenmarkten, altseasons, correcties versus crashes, waarom munten de neiging hebben samen te bewegen, en hoe je je gedraagt wanneer de markt naar beneden draait.",
  lessons: [
    {
      id: "c23-l1",
      title: "Wat is een stierenmarkt en een berenmarkt?",
      paragraphs: [
        "Markten bewegen in lange stukken, niet in rechte lijnen. Een stierenmarkt is een aanhoudende periode waarin de prijzen breed stijgen en de meeste mensen zich optimistisch voelen. Een berenmarkt is het tegenovergestelde: een aanhoudende periode waarin de prijzen breed dalen en voorzichtigheid de overhand krijgt. Geen van beide duurt eeuwig, en de een maakt uiteindelijk altijd plaats voor de ander.",
        "De namen komen van de manier waarop elk dier aanvalt. Een stier gooit zijn horens omhoog, en een beer slaat zijn poot naar beneden, wat een handige manier is om te onthouden wat wat is. In een stierenmarkt is de stemming zelfverzekerd en zijn kopers happig; in een berenmarkt is de stemming angstig en domineren verkopers.",
        "Het belangrijkste voor een beginner om te begrijpen, is dat beide volkomen normaal zijn. Prijzen gaan niet alleen omhoog, en ze gaan niet alleen omlaag. Als je beide soorten weer op voorhand verwacht, sta je niet met open mond te kijken wanneer het seizoen verandert.",
      ],
      example:
        "Zie het jaar als iets met seizoenen. De lente is een stierenmarkt: alles groeit, alles ziet er groen uit, en het voelt alsof het zal blijven duren. De winter is een berenmarkt: de groei stopt, de dagen zijn grijs, en het kan voelen alsof de kou nooit zal ophouden. Maar de lente keert altijd terug en de winter komt altijd weer. Beide zijn normaal, en beide gaan voorbij. Een trader die in de winter in paniek raakt, is simpelweg vergeten dat de seizoenen draaien.",
    },
    {
      id: "c23-l2",
      title: "Wat is een altseason?",
      paragraphs: [
        "In crypto lopen de grootste en bekendste munten meestal voorop. Wanneer die reuzen al flink zijn gestegen, sijpelt de aandacht vaak door naar kleinere munten, soms \"alt\"-munten genoemd, kort voor alternatieven. Een periode waarin deze kleinere munten bijzonder snel stijgen en de grootste voorbijstreven, heet een altseason.",
        "Tijdens een altseason kan de opwinding intens zijn, omdat kleine munten in korte tijd een heel groot percentage kunnen bewegen. Dat werkt echter in beide richtingen. Dezelfde munten die snel omhoogschieten, kunnen ook net zo snel dalen wanneer de stemming afkoelt, dus de snelle winsten gaan gepaard met snel risico.",
        "Voor een kalme trader is de les om niet elke snelbewegende munt achterna te jagen. Snelle bewegingen voelen spannend, maar een munt die in een week kan verdubbelen, kan in een week ook halveren. Begrijpen wat een altseason is, helpt je de opwinding te zien voor wat ze is, in plaats van erin meegesleept te worden.",
      ],
      example:
        "Stel je een grote optocht voor waarbij de enorme praalwagens vooraan gaan en de grootste menigten trekken. Zodra die voorbij zijn, krijgen de kleinere artiesten erachter hun moment, en een tijdje juicht de menigte het luidst voor hen. Een altseason is dat stuk van de optocht: de kleine acts overschaduwen plots de reuzen voor een korte, energieke uitbarsting voordat de optocht verder trekt.",
    },
    {
      id: "c23-l3",
      title: "Wat is een marktcorrectie versus een crash?",
      paragraphs: [
        "Niet elke daling is een ramp. Een marktcorrectie is een bescheiden, normale dip, vaak zo'n tien procent, die een stijgende trend onderbreekt zonder die te beëindigen. Correcties zijn gezond: ze laten een oververhitte prijs afkoelen en op adem komen, en ze gebeuren regelmatig, zelfs in een sterke stierenmarkt.",
        "Een marktcrash is een ander beestje. Het is een plotselinge, hevige daling, veel scherper en dieper dan een normale correctie, en die gaat meestal gepaard met echte angst. Waar een correctie een pauze is, kan een crash aanvoelen alsof de bodem wegvalt, waarbij de prijzen in uren of dagen snel kelderen.",
        "De twee uit elkaar houden is belangrijk, omdat ze om verschillende reacties vragen. In paniek raken door een routinecorrectie kan je een goede positie zomaar doen verkopen, terwijl een echte crash als \"gewoon een dipje\" behandelen ertoe kan leiden dat je een reëel gevaar negeert. Geen van beide zou met pure emotie tegemoet moeten worden getreden.",
      ],
      example:
        "Stel je voor dat je een heuvel afwandelt. Een marktcorrectie is een korte, steile stap omlaag op een verder opwaarts pad: een klein schokje, maar over het geheel blijf je klimmen. Een marktcrash lijkt meer op het pad dat plotseling onder je wegzakt. Beide houden in dat je naar beneden gaat, maar het ene is een normale hobbel in de wandeling en het andere is een val waarop je je moet schrap zetten.",
    },
    {
      id: "c23-l4",
      title: "Waarom beweegt soms de hele markt tegelijk?",
      paragraphs: [
        "Sommige dagen voelt het alsof bijna elke munt groen is, en andere dagen bijna elke munt rood, allemaal tegelijk. Dat komt doordat prijzen niet alleen worden gedreven door het eigen verhaal van elke munt, maar door een gedeelde stemming over de hele markt. Wanneer angst of hebzucht doorbreekt, raakt dat vrijwel alles op hetzelfde moment.",
        "De grootste munten fungeren als een anker voor de rest. Omdat er zoveel geld en aandacht in de grootste munten zit, hebben ze de neiging de kleinere in dezelfde richting mee te sleuren wanneer ze scherp bewegen. Een golf van vertrouwen tilt het hele veld op, en een golf van angst trekt het allemaal samen naar beneden.",
        "Dit weten voorkomt dat je een rode dag verkeerd leest. Als jouw munt daalt terwijl al het andere ook daalt, betekent dat meestal dat de hele markt nerveus is, niet dat er specifiek iets mis is met jouw munt. Marktbrede stemming scheiden van muntspecifiek nieuws is een kalmerende en nuttige gewoonte.",
      ],
      example:
        "Denk aan boten in een haven wanneer het tij opkomt of wegtrekt. Het maakt niet uit of een boot groot of klein is, oud of nieuw; wanneer het tij stijgt, stijgen ze allemaal samen, en wanneer het zakt, zakken ze allemaal samen. Marktsentiment is dat tij. Op een dag met veel angst trekt het tij weg en daalt bijna elke munt mee, ongeacht de eigen verdiensten.",
    },
    {
      id: "c23-l5",
      title: "Hoe gedraag je je in een berenmarkt?",
      paragraphs: [
        "De allergrootste fout tijdens een neergang is paniekverkoop, een positie dumpen puur omdat de dalende prijs ondraaglijk aanvoelt. Die reflex heeft de neiging een verlies vast te zetten op het slechtst denkbare moment. De rustigere weg is om vaart te minderen, je te houden aan het plan dat je maakte toen je kalm was, en te vermijden dat je in het heetst van de angst gloednieuwe beslissingen neemt.",
        "In een kasachtige veiligheid blijven zitten is ook een volkomen geldige keuze, geen mislukking. Stablecoins zoals USDC aanhouden tijdens een berenmarkt laat je een stap terugzetten uit de schommelingen zonder het ecosysteem te verlaten, en je kunt later opnieuw instappen wanneer je je er klaar voor voelt. Ervoor kiezen om een tijdje niets te doen is op zichzelf een beslissing.",
        "Een neergang is ook een geschenk aan tijd. Met minder druk om te handelen kun je je richten op leren: bestudeer hoe munten worden gescoord, lees de AI Log, en raak vertrouwd met de tools. In deze app kan een stop loss je uitstap op voorhand bepalen, zodat één enkele trade niet uit de hand kan lopen, wat goed past bij de kalme, plan-eerst-instelling die in eerdere hoofdstukken aan bod kwam. Dit is educatie, geen financieel advies, en alleen jij kunt beslissen wat bij jouw situatie past.",
      ],
      example:
        "Stel je een klein bootje voor dat in een storm terechtkomt. De paniekerige zeeman gooit de lading overboord en springt in doodsangst van boord. De kalme zeeman strijkt de zeilen, houdt een stabiele koers aan, en wacht tot het weer overtrekt. In een berenmarkt is wat geld naar stablecoins verplaatsen als het strijken van de zeilen, en weigeren in paniek te verkopen is als bij de boot blijven tot er rustiger water terugkeert.",
    },
  ],
  quiz: [
    {
      id: "c23-q1",
      prompt: "Hoe moet je denken over een stierenmarkt en een berenmarkt?",
      options: [
        {
          text: "Een stierenmarkt is normaal, maar een berenmarkt is een teken dat de markt kapot is en voorgoed weg.",
          explanation:
            "Niet zo. Beide zijn normale fasen. Net als de lente en de winter is een berenmarkt net zo natuurlijk als een stierenmarkt, en die gaat uiteindelijk altijd voorbij.",
        },
        {
          text: "Beide zijn normale, terugkerende fasen: prijzen stijgen een stuk, dalen dan een stuk, en elk maakt uiteindelijk plaats voor de ander.",
          explanation:
            "Juist. Markten bewegen in cycli. Als je zowel de stijgende als de dalende seizoenen verwacht, sta je niet met open mond te kijken wanneer de stemming verandert.",
        },
        {
          text: "Je kunt het verschil gerust negeren, want prijzen gaan op termijn toch alleen maar omhoog.",
          explanation:
            "Nee. Prijzen gaan niet alleen omhoog. Precies het negeren van de dalende fasen laat traders onvoorbereid wanneer er een berenmarkt aanbreekt.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q2",
      prompt: "Tijdens een altseason stijgen kleinere munten heel snel. Wat is de kalme manier om dit te bekijken?",
      options: [
        {
          text: "Snel stijgende alt-munten zijn gegarandeerd geld, dus je zou er zoveel mogelijk moeten kopen.",
          explanation:
            "Nee. Een munt die snel kan verdubbelen, kan ook snel halveren. Er is geen garantie, en elke snelle stijger achternajagen is hoe mensen erin trappen.",
        },
        {
          text: "De opwinding is echt, maar dezelfde munten die snel omhoogschieten kunnen net zo snel dalen, dus de snelle winsten gaan gepaard met snel risico.",
          explanation:
            "Juist. Een altseason is spannend maar tweezijdig. Het herkennen voor wat het is, helpt je te voorkomen dat je in de hype wordt meegesleept.",
        },
        {
          text: "Een altseason betekent dat de grootste munten voorgoed niet meer van belang zijn.",
          explanation:
            "Niet waar. De grootste munten leiden nog steeds de markt; een altseason is gewoon een stuk waarin kleinere munten hen tijdelijk voorbijstreven.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c23-q3",
      prompt: "Wat is het verschil tussen een marktcorrectie en een marktcrash?",
      options: [
        {
          text: "Een marktcrash is een kleine, gezonde dip, terwijl een marktcorrectie een totale ineenstorting is.",
          explanation:
            "Dit heeft ze omgedraaid. Een correctie is de kleine, normale dip; een crash is de plotselinge, hevige daling.",
        },
        {
          text: "Het is precies hetzelfde ding met twee verschillende namen.",
          explanation:
            "Nee. Ze verschillen in omvang en snelheid, en daarom vragen ze om verschillende reacties.",
        },
        {
          text: "Een correctie is een bescheiden, normale dip (vaak zo'n tien procent) die een stijging onderbreekt, terwijl een crash een plotselinge, veel scherpere en diepere daling is.",
          explanation:
            "Juist. Een correctie is een pauze die de prijzen laat afkoelen; een crash voelt aan alsof de bodem wegvalt en wijst op reëel gevaar.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c23-q4",
      prompt: "Jouw munt daalt, maar bijna elke andere munt daalt op hetzelfde moment ook. Wat betekent dit meestal?",
      options: [
        {
          text: "De hele markt is in een angstige stemming, en marktbreed sentiment sleurt de meeste munten samen naar beneden.",
          explanation:
            "Juist. Zoals een tij elke boot laat zakken, trekt een golf van angst het hele veld tegelijk omlaag. Het heeft meestal niets specifieks met jouw munt te maken.",
        },
        {
          text: "Er is specifiek en uniek iets mis met jouw munt.",
          explanation:
            "Waarschijnlijk niet. Wanneer alles samen daalt, wijst dat op een gedeelde marktstemming eerder dan op een probleem met jouw ene munt.",
        },
        {
          text: "Het is toeval, en munten die tegelijk samen bewegen betekent niets.",
          explanation:
            "Nee. Munten die samen bewegen is een reëel patroon, gedreven door gedeeld sentiment en doordat de grootste munten de rest meesleuren.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
