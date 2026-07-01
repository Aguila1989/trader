// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../../types";

export const chapter22: Chapter & { whoFor: string } = {
  id: "c22",
  number: 22,
  level: "BASIC",
  whoFor: "Voor iedereen die ooit in paniek heeft verkocht of op de top heeft gekocht",
  title: "Handelspsychologie",
  description:
    "De denkfouten die traders geld kosten: FOMO, FUD, verliesaversie, en de simpele gewoontes die je beslissingen kalm en regelgestuurd houden.",
  lessons: [
    {
      id: "c22-l1",
      title: "Wat is FOMO en waarom leidt het tot slechte beslissingen?",
      paragraphs: [
        "FOMO staat voor de angst om iets te missen. Bij handelen is het dat nerveuze gevoel dat een munt zonder jou wegloopt, waardoor je snel koopt voordat je er goed over hebt nagedacht. Het gevoel is echt, maar het duwt je ertoe om te kopen wanneer een prijs al hoog staat en de makkelijke winsten al weg zijn.",
        "Het probleem is de timing. Tegen de tijd dat een munt overal in je feed opduikt en iedereen enthousiast is, heeft het grootste deel van de beweging zich meestal al voltrokken. Kopers die dat enthousiasme achternalopen, arriveren vaak net voordat de prijs afkoelt, en zien dan hun nieuwe positie dalen. De beslissing werd gestuurd door emotie, niet door een plan.",
        "Een kalmere aanpak is om vooraf te bepalen wat een munt jou waard is en op die prijs te wachten. Komt die nooit, dan sla je de trade gewoon over. Een winst mislopen is niet hetzelfde als geld verliezen, en er is altijd een volgende kans.",
      ],
      example:
        "Stel je voor dat je langs een restaurant loopt met een lange rij buiten. Je hebt er nog nooit gegeten en weet niets over het eten, maar de menigte doet je toch aansluiten. Dat is FOMO. Je ging in de rij staan omdat anderen dat deden, niet omdat je had gecontroleerd of de maaltijd wel goed was. Bij handelen is een munt kopen alleen omdat hij omhoogschiet dezelfde reflex.",
    },
    {
      id: "c22-l2",
      title: "Wat is FUD en hoe herken je het?",
      paragraphs: [
        "FUD staat voor angst, onzekerheid en twijfel. Het beschrijft negatief gepraat, soms waar en soms niet, dat wordt verspreid om je bang genoeg te maken om te verkopen. Het kan een eerlijke waarschuwing zijn, of het kan iemand zijn die een prijs omlaag probeert te duwen om zelf goedkoop te kunnen kopen.",
        "De truc om met FUD om te gaan is om de bewering los te koppelen van de emotie. Vraag je af wat er precies wordt beweerd, of er enig bewijs is, en wie er baat bij heeft als jij in paniek raakt. Een vaag We gaan allemaal alles verliezen is heel iets anders dan een concreet, verifieerbaar feit dat je zelf kunt controleren.",
        "Je hoeft slecht nieuws niet te negeren, en echte risico's verdienen echte aandacht. Maar je zou nooit puur moeten verkopen omdat een angstaanjagend bericht je hart sneller liet kloppen. Vertraag, verifieer, en beslis dan pas.",
      ],
      example:
        "Denk aan iemand die brand roept in een volle bioscoop. Soms is er echt rook en is snel weggaan de juiste keuze. Soms is er niets en wilde die persoon gewoon de stoelen leeg hebben. FUD werkt net zo: voordat je naar de uitgang rent en alles verkoopt, kijk even om je heen en controleer of er wel echte rook is.",
    },
    {
      id: "c22-l3",
      title: "Waarom verkopen mensen precies op de bodem?",
      paragraphs: [
        "Het gebeurt keer op keer: een prijs daalt, de houder verdraagt het een tijdje, en verkoopt dan uiteindelijk in wanhoop, vaak net voordat hij herstelt. Dit patroon wordt gedreven door verliesaversie, een goed onderzochte eigenaardigheid waarbij de pijn van verliezen ongeveer twee keer zo sterk aanvoelt als het plezier van een even grote winst.",
        "Omdat een papieren verlies zoveel pijn doet, wordt het ondraaglijk om het te zien groeien. Verkopen laat het nare gevoel nu meteen stoppen, dus je brein behandelt het als opluchting, zelfs wanneer je daarmee de slechtst mogelijke prijs vastlegt. De beslissing lost een emotioneel probleem op, geen financieel.",
        "Dit vooraf weten is de verdediging. Als je je uitstapprijs bepaalt voordat je de angst voelt, is de kans veel kleiner dat je op de bodem dumpt puur om het ongemak weg te nemen.",
      ],
      example:
        "Stel je twee enveloppen voor. In de ene vind je 50 USDC, een leuke verrassing. In de andere verlies je 50 USDC die je al had. De meeste mensen voelen het verlies veel scherper dan de winst, ook al is het bedrag identiek. Dat scheve gevoel is verliesaversie, en het is precies wat een trader verleidt om op het laagste punt te verkopen.",
    },
    {
      id: "c22-l4",
      title: "Wat is een handelsplan en waarom heb je er een nodig?",
      paragraphs: [
        "Een handelsplan is een korte set regels die je voor jezelf opschrijft voordat je handelt: wat je gaat kopen, hoeveel, tegen welke prijs je winst neemt, en tegen welke prijs je een verlies accepteert en eruit stapt. Het zet vage hoop om in duidelijke, vooraf besliste acties.",
        "De waarde van een plan is dat je het opschrijft terwijl je kalm bent, niet terwijl een prijs crasht of omhoogschiet. Wanneer de emoties later hoog oplopen, hoef je niet ter plekke een beslissing te verzinnen. Je volgt gewoon de regels die je al met jezelf hebt afgesproken.",
        "In deze app kun je delen van je plan rechtstreeks in de tools zetten. Een stop loss stelt de prijs in waarop je een verlieslatende trade verlaat, en een doelprijs stelt in waar je winst neemt, zodat het plan doorloopt zelfs wanneer je niet meekijkt.",
      ],
      example:
        "Vertrek je op een road trip zonder kaart of GPS, dan rij je op je gevoel, sla je verkeerd af en heb je op elk kruispunt ruzie. Met een vooraf uitgestippelde route ligt elke afslag al vast en verloopt de rit rustig. Een handelsplan is die route: je regelt de moeilijke keuzes voor je vertrekt, niet in paniek achter het stuur.",
    },
    {
      id: "c22-l5",
      title: "Hoe neem je een beslissing zonder emotie?",
      paragraphs: [
        "Je kunt gevoelens niet uitzetten, maar je kunt voorkomen dat ze het stuur overnemen. De kerntruc is om de regels te bepalen voordat er geld en emotie op het spel staan, en die regels vervolgens op het moment zelf de beslissing te laten nemen. Een handelsplan, een stop loss en een doelprijs doen dit allemaal voor je.",
        "Het helpt ook om te vertragen. De meeste slechte trades komen voort uit handelen binnen enkele seconden. Zelfs een paar minuten wachten, of er een nachtje over slapen bij een grote beslissing, laat de eerste golf van angst of hebzucht wegebben zodat je redenering kan bijbenen. Als een trade alleen zinvol lijkt zolang je opgewonden bent, is het meestal geen goede trade.",
        "Schrijf tot slot op waarom je elke trade hebt gedaan. Als je later je eigen notities terugleest, zie je eerlijk of emotie of logica aan het roer stond, en die feedback maakt je langzaam een stabielere trader.",
      ],
      example:
        "Een piloot vaart tijdens een storm niet op zijn stemming; hij doorloopt een geschreven checklist, één kalme stap tegelijk. Je kunt handelen op dezelfde manier aanpakken: een kleine checklist zoals Zit dit in mijn plan? Heb ik mijn uitstap ingesteld? Handel ik op basis van feiten of van angst? verandert een verhitte impuls in een koele, weloverwogen beslissing.",
    },
  ],
  quiz: [
    {
      id: "c22-q1",
      prompt: "Je ziet een munt omhoogschieten en iedereen online praat erover. Je voelt de drang om meteen te kopen. Wat is de gezondste reactie?",
      options: [
        {
          text: "Meteen kopen, want als iedereen enthousiast is, moet de prijs wel blijven stijgen.",
          explanation:
            "Dit is FOMO in actie. Tegen de tijd dat een munt overal opduikt, heeft het grootste deel van de beweging zich meestal al voltrokken, en hem achternalopen betekent vaak kopen net voordat hij afkoelt.",
        },
        {
          text: "Pauzeer, bepaal wat de munt jou werkelijk waard is, en koop alleen tegen die prijs — sla hem anders over.",
          explanation:
            "Juist. Je prijs vooraf bepalen vervangt de emotionele achtervolging door een regel. Een winst mislopen is geen verlies, en er komt altijd een volgende kans.",
        },
        {
          text: "Verkoop al het andere wat je bezit om er zoveel mogelijk van te kopen.",
          explanation:
            "Nee. Er harder induiken maakt de FOMO-fout groter, niet kleiner, en gooit elk plan dat je had overboord.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q2",
      prompt: "Een dramatisch bericht zegt dat een munt op het punt staat in te storten en dat je nu moet verkopen. Hoe moet je ermee omgaan?",
      options: [
        {
          text: "Meteen verkopen, want het bericht klinkt dringend en angstaanjagend.",
          explanation:
            "Handelen op basis van louter angst is precies waar FUD op is gericht. Urgentie en drama zijn niet hetzelfde als bewijs.",
        },
        {
          text: "Koppel de bewering los van de emotie: controleer op echt bewijs en vraag je af wie er baat bij heeft als jij in paniek raakt.",
          explanation:
            "Juist. FUD mengt angst met vage beweringen. De concrete feiten verifiëren, en opmerken wie er wint bij jouw paniek, houdt de beslissing rationeel.",
        },
        {
          text: "Alle negatieve nieuws voor altijd negeren, want het is altijd nep.",
          explanation:
            "Niet helemaal. Sommig slecht nieuws is echt en verdient aandacht. De vaardigheid is beweringen verifiëren, niet elke waarschuwing wegwuiven.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q3",
      prompt: "Waarom zorgt verliesaversie er vaak voor dat traders precies op de bodem verkopen?",
      options: [
        {
          text: "Omdat laag verkopen wiskundig gezien de beste manier is om winst te maken.",
          explanation:
            "Nee. Op de bodem verkopen legt de slechtste prijs vast. Het heeft niets met winst te maken en alles met het stoppen van emotionele pijn.",
        },
        {
          text: "Omdat de pijn van een groeiend verlies zo sterk aanvoelt dat verkopen om het gevoel te laten stoppen als opluchting lijkt.",
          explanation:
            "Juist. Verliesaversie betekent dat verliezen ongeveer twee keer zoveel pijn doen als even grote winsten goed voelen, dus mensen verkopen om het ongemak te beëindigen, zelfs op het slechtste moment.",
        },
        {
          text: "Omdat een handelsplan hen dwingt tegen de laagste prijs te verkopen.",
          explanation:
            "Het tegenovergestelde is waar. Een plan met een vooraf ingestelde uitstap is juist wat paniekverkopen op de bodem voorkomt.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c22-q4",
      prompt: "Wat is het belangrijkste voordeel van het opschrijven van een handelsplan voordat je handelt?",
      options: [
        {
          text: "Het garandeert dat elke trade winstgevend zal zijn.",
          explanation:
            "Geen enkel plan kan winst garanderen. Markten zijn onzeker; een plan beheert je gedrag, niet de uitkomst.",
        },
        {
          text: "Je bepaalt je koop-, winstneem- en uitstapregels terwijl je kalm bent, zodat verhitte emoties de beslissing later niet nemen.",
          explanation:
            "Juist. Een plan dat je in een kalm moment opstelt, betekent dat je bij een prijsschommeling de regels volgt die je al hebt gekozen in plaats van onder stress te improviseren.",
        },
        {
          text: "Het laat je handelen zonder ooit een stop loss of doelprijs nodig te hebben.",
          explanation:
            "Andersom. Een stop loss en een doelprijs zijn de tools die je plan in actie brengen, geen dingen waarvan een plan de noodzaak wegneemt.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
