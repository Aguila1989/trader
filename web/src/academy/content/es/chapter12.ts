import type { Chapter } from "../../types";

export const chapter12: Chapter = {
  id: "c12",
  number: 12,
  level: "EXPERT",
  title: "Funciones avanzadas de Stellar",
  description:
    "Profundiza en el libro de ordenes del SDEX, las trustlines, los path payments, los pools AMM y la consolidacion de tus tenencias de vuelta en XLM.",
  lessons: [
    {
      id: "c12-l1",
      title: "Que es el SDEX (Stellar Decentralized Exchange)?",
      paragraphs: [
        "El SDEX es el Stellar Decentralized Exchange, un libro de ordenes integrado directamente en el protocolo de Stellar. No hay una empresa aparte que lo gestione: cualquiera que tenga una cuenta puede colocar ordenes de compra o de venta, y esas ordenes se emparejan entre si on-chain. Cada mercado, como XLM contra USDC, tiene su propio libro de ordenes con ofertas en reposo a la espera de ejecutarse.",
        "Este bot realiza todo su trading automatizado en el libro de ordenes del SDEX, colocando alli ordenes limit y market. No opera en un exchange centralizado, y no enruta el ciclo de trading a traves de pools de liquidez. Cuando la IA decide actuar, envia una orden al mercado del SDEX correspondiente y deja que el protocolo la empareje.",
        "Un detalle clave es como entra el bot: usa ejecucion maker-first. En lugar de cruzar el spread y pagar el precio que pide la otra parte, prefiere dejar su propia orden en reposo en el mejor bid o ask actual. Al situarse en el libro como maker, busca capturar el spread en lugar de pagarlo, algo que importa muchisimo cuando el margen es de apenas unos pocos basis points.",
      ],
      example:
        "Supongamos que el libro de XLM/USDC muestra un mejor bid de 0.1170 y un mejor ask de 0.1180. Para comprar XLM, un bot maker-first no paga el ask de 0.1180. En su lugar deja su propia orden de compra en 0.1170, sumandose al lado del bid. Si aparece un vendedor que ejecuta esa orden, el bot compra a 0.1170 y se queda con el spread, en vez de cruzar a 0.1180 y regalarlo.",
    },
    {
      id: "c12-l2",
      title: "Que es una trustline y cuando la necesitas?",
      paragraphs: [
        "Una trustline es un consentimiento explicito que permite a tu cuenta de Stellar mantener un activo no nativo concreto de un emisor concreto. Los activos en Stellar se definen por un codigo mas la cuenta que los emitio, asi que el USDC emitido por Circle es algo distinto de cualquier otro token que tambien se llame USDC. Antes de que tu cuenta pueda recibir o mantener un activo, debes abrir una trustline a ese par exacto de codigo y emisor.",
        "El unico activo que nunca necesita una trustline es XLM, el lumen nativo. Todo lo demas si la necesita. Las trustlines se anaden y se quitan desde el dashboard, y la verificacion previa de saldo de la app comprueba que ya existe una trustline para cualquier activo que una operacion vaya a recibir, de modo que una compra no puede traer un activo que no tienes linea para mantener.",
        "Las trustlines no son gratis en cierto sentido: cada trustline abierta eleva ligeramente la reserva minima de XLM de tu cuenta. Esa reserva queda bloqueada y no se puede gastar ni operar mientras la linea este abierta. Por eso conviene cerrar las trustlines de activos que ya no mantienes, tanto para recuperar un poco de reserva como para mantener la billetera ordenada.",
      ],
      example:
        "Quieres que el bot compre USDC de Circle. Primero abres una trustline al USDC emitido por la cuenta emisora de Circle desde el dashboard. Esa trustline sube un poco tu reserva minima de XLM, bloqueando una pequena cantidad de XLM. Ahora una compra que recibe USDC pasa la verificacion previa de saldo. Si mas adelante vendes todo tu USDC y cierras la trustline, esa reserva queda liberada de nuevo.",
    },
    {
      id: "c12-l3",
      title: "Que es un path payment y como lo usa esta app?",
      paragraphs: [
        "Un path payment es un pago de Stellar que convierte un activo en otro distinto dentro de una unica transaccion atomica, saltando automaticamente por uno o varios mercados intermedios para encontrar una ruta. Tu indicas que quieres enviar y que quieres recibir, y la red recorre un camino, por ejemplo del activo de envio a un activo intermedio y de ahi al activo de recepcion, todo liquidado en conjunto o nada en absoluto.",
        "Esta app usa path payments para su funcion de Swap y conversion de la billetera, no para el ciclo de trading automatizado sobre el libro de ordenes. Cuando solicitas un swap, la app genera una cotizacion que muestra la ruta o path que encontro y la cantidad estimada que recibirias. Revisas esa cotizacion antes de confirmar, asi que puedes ver la conversion antes de que ocurra.",
        "Como todo el salto es atomico, un path payment o completa la conversion entera o falla de forma limpia sin que nada cambie. No hay riesgo de convertir a medias y quedarte atascado con un activo intermedio que no querias. Eso convierte a los path payments en una herramienta limpia para moverse entre activos que de verdad quieres mantener.",
      ],
      example:
        "Tienes yXLM y quieres USDC, pero puede que no exista un mercado directo con profundidad entre ambos. Solicitas un swap. La app devuelve una cotizacion cuyo path enruta yXLM hacia XLM y luego XLM hacia USDC, estimando que recibirias unos 96 USDC. Aceptas, y el path payment ejecuta ambos saltos en una sola transaccion atomica: o acabas con el USDC, o todo se revierte y conservas tu yXLM.",
    },
    {
      id: "c12-l4",
      title: "Que es un pool de liquidez AMM en Stellar?",
      paragraphs: [
        "Mas alla del libro de ordenes, Stellar tambien admite pools de creador de mercado automatizado. Un pool de liquidez AMM mantiene dos activos juntos, financiados por proveedores de liquidez que depositan ambos lados. Los traders luego intercambian contra el pool en lugar de contra la oferta de otro trader, y el pool fija el precio de cada swap mediante una formula de producto constante, donde el producto de las dos reservas se mantiene mas o menos constante a medida que se compra un lado y se vende el otro.",
        "Es importante dejar claro que hace este bot. El bot no enruta sus operaciones automatizadas a traves de pools AMM. Su ciclo de trading trabaja sobre el libro de ordenes del SDEX, colocando ordenes maker-first como se describio antes. Los pools AMM se presentan aqui como un concepto general de Stellar con el que te puedes encontrar, no como un lugar al que apunte la estrategia del bot.",
        "Hay una excepcion sutil que conviene conocer. Los path payments, que impulsan la funcion de Swap, pueden enrutarse incidentalmente a traves de un pool AMM a nivel de protocolo si la red detecta que la mejor ruta pasa por uno. Eso es el protocolo eligiendo una ruta eficiente para una conversion puntual, y es algo distinto del trading sobre el libro de ordenes que el bot realiza en su ciclo de escaneo.",
      ],
      example:
        "Imagina un pool de XLM/USDC con 100000 XLM y 12000 USDC. Un trader intercambia algo de USDC, la reserva de USDC del pool sube, su reserva de XLM baja, y la regla de producto constante fija la tasa de modo que el precio se desplaza a medida que crece el tamano de la operacion. El bot ignora este pool para sus operaciones automatizadas, dejando ordenes en reposo en el libro de ordenes en su lugar, aunque una cotizacion de Swap puntual podria enrutar legitimamente una conversion a traves de un pool asi.",
    },
    {
      id: "c12-l5",
      title: "Que es el auto-swap a XLM y cuando deberias usarlo?",
      paragraphs: [
        "El auto-swap a XLM consiste en consolidar tus tenencias que no son XLM de vuelta en XLM usando la funcion de Swap y conversion. Como esa funcion esta construida sobre path payments, el auto-swap es en realidad una comodidad montada encima del swap: en lugar de convertir cada token a mano, te ayuda a reunir saldos no nativos dispersos de vuelta en el lumen nativo.",
        "Hay varias buenas razones para recurrir a el. Consolidar en XLM puede liberar el lado de compra, ya que mantener XLM permite al bot vender XLM en las caidas cuando aparece una oportunidad. Tambien simplifica una billetera abarrotada de pequenos tokens sobrantes, y puede recargar tu saldo de XLM para cubrir comodamente la reserva minima que exigen las trustlines y los requisitos basicos de la cuenta.",
        "Trata el auto-swap como una funcion de comodidad en evolucion y no como un proceso totalmente automatico en segundo plano que barre tu billetera en silencio. Tu mantienes el control: se apoya en las mismas cotizaciones de Swap que revisarias tu mismo, asi que puedes ver lo que rendiria cada conversion antes de que ocurra. Usalo de forma deliberada, al ordenar o reposicionar, no como un ajuste que dejas activado y olvidas.",
      ],
      example:
        "Tu billetera tiene 40 USDC, 15 AQUA y unos magros 300 XLM que apenas superan tu reserva. Quieres activo el lado de compra del bot que vende XLM y tu reserva holgada. Usas el auto-swap a XLM, que genera cotizaciones de swap convirtiendo el USDC y el AQUA en XLM. Tras aceptar, te quedas con un saldo de XLM mas grande, una billetera mas ordenada y suficiente margen por encima de la reserva minima para mantener trustlines abiertas y operar con libertad.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Que es el SDEX y como opera este bot en el?",
      options: [
        {
          text: "Un exchange centralizado al que el bot se conecta con una clave de API, cruzando el spread en cada orden.",
          explanation:
            "Incorrecto. El SDEX es descentralizado y esta integrado en el protocolo, y el bot deja ordenes maker en reposo en lugar de cruzar siempre el spread.",
        },
        {
          text: "Un libro de ordenes descentralizado a nivel de protocolo donde el bot coloca ordenes maker-first para capturar el spread.",
          explanation:
            "Correcto. El SDEX es el libro de ordenes on-chain integrado de Stellar, y el bot prefiere dejar ordenes en reposo en el mejor bid o ask en lugar de cruzarlo.",
        },
        {
          text: "Un pool de liquidez AMM contra el que el ciclo automatizado del bot intercambia en cada operacion.",
          explanation:
            "Incorrecto. El bot opera sobre el libro de ordenes, no sobre pools AMM; los pools son un concepto aparte de Stellar.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q2",
      prompt: "Cuando necesitas abrir una trustline?",
      options: [
        {
          text: "Antes de mantener o recibir cualquier activo, incluido XLM.",
          explanation:
            "Incorrecto. XLM es el activo nativo y nunca necesita una trustline; solo la necesitan los activos no nativos.",
        },
        {
          text: "Solo despues de que una operacion ya haya fallado por la falta de una.",
          explanation:
            "Incorrecto. La verificacion previa de saldo comprueba la trustline primero, asi que la trustline deberia existir antes de la operacion, no despues de un fallo.",
        },
        {
          text: "Antes de que tu cuenta pueda mantener un activo no nativo concreto de un emisor concreto, como USDC de Circle.",
          explanation:
            "Correcto. Una trustline es el consentimiento para un par concreto de codigo y emisor, y cada una abierta eleva ligeramente tu reserva minima de XLM.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q3",
      prompt: "Que hace un path payment y como lo usa esta app?",
      options: [
        {
          text: "Convierte un activo en otro en una unica transaccion atomica, y la app lo usa para la funcion de Swap y conversion de la billetera.",
          explanation:
            "Correcto. Un path payment salta por mercados intermedios de forma atomica, y la app lo usa para swaps que muestran una ruta y una cantidad estimada a recibir, no para el ciclo del libro de ordenes.",
        },
        {
          text: "Es el mecanismo que usa el bot para cada operacion automatizada sobre el libro de ordenes.",
          explanation:
            "Incorrecto. El ciclo de trading automatizado usa ordenes del libro de ordenes del SDEX; los path payments impulsan en cambio la funcion de Swap.",
        },
        {
          text: "Divide un pago en varias transacciones separadas que se liquidan cada una de forma independiente.",
          explanation:
            "Incorrecto. Un path payment es una unica transaccion atomica que o completa la conversion entera o se revierte por completo.",
        },
        {
          text: "Abre una trustline automaticamente para cualquier activo que recibas.",
          explanation:
            "Incorrecto. Las trustlines se abren por separado en el dashboard; un path payment convierte activos, no crea trustlines.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q4",
      prompt: "Que es un pool de liquidez AMM en Stellar y opera este bot a traves de uno?",
      options: [
        {
          text: "Es el libro de ordenes principal del protocolo, y el bot deja todas sus ordenes alli.",
          explanation:
            "Incorrecto. El libro de ordenes y los pools AMM son mecanismos distintos; el bot deja ordenes en el libro de ordenes, que no es un pool.",
        },
        {
          text: "Es un pool de producto constante de dos activos contra el que los traders intercambian, y el bot enruta sus operaciones automatizadas a traves de el.",
          explanation:
            "Incorrecto. La descripcion del pool es correcta, pero el bot no enruta operaciones automatizadas a traves de pools; opera sobre el libro de ordenes.",
        },
        {
          text: "Es un pool de producto constante de dos activos financiado por proveedores de liquidez, y el bot opera sobre el libro de ordenes en lugar de enrutar operaciones automatizadas a traves de pools.",
          explanation:
            "Correcto. Los pools AMM fijan el precio de los swaps con una formula de producto constante, pero el ciclo automatizado del bot usa el libro de ordenes del SDEX; solo un path payment puntual podria enrutarse incidentalmente a traves de un pool.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q5",
      prompt: "Para que sirve principalmente el auto-swap a XLM?",
      options: [
        {
          text: "Para consolidar tenencias que no son XLM de vuelta en XLM y asi liberar el lado de compra, ordenar la billetera o recargar la reserva.",
          explanation:
            "Correcto. Es una comodidad construida sobre la funcion de Swap que reune saldos no nativos en XLM, ayudando a reposicionarse para vender XLM, simplificar la billetera y cubrir la reserva minima.",
        },
        {
          text: "Un proceso totalmente automatico en segundo plano que barre cada token en silencio sin que revises nada.",
          explanation:
            "Incorrecto. Es una comodidad en evolucion construida sobre cotizaciones de Swap que puedes revisar; no es un barrido en segundo plano sin intervencion.",
        },
        {
          text: "Una forma de abrir trustlines en masa para nuevos activos que quieras empezar a operar.",
          explanation:
            "Incorrecto. El auto-swap convierte tenencias en XLM; abrir trustlines para activos nuevos es una accion aparte del dashboard.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
