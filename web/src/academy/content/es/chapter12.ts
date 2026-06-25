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
      title: "Como funciona el SDEX: emparejamiento de ordenes, comisiones y liquidacion",
      paragraphs: [
        "El SDEX es el Stellar Decentralized Exchange, un libro de ordenes que vive dentro del propio protocolo en lugar de en los servidores de una empresa. Cualquiera que tenga una cuenta puede enviar ofertas. Un manageSellOffer dice voy a entregar esta cantidad del activo A por al menos este precio en el activo B; un manageBuyOffer expresa la misma intencion desde el otro lado. Cada oferta reposa on-chain en el libro de ordenes de su mercado, por ejemplo XLM contra USDC, hasta que se ejecuta, se reemplaza o se cancela.",
        "El emparejamiento sigue una prioridad de precio y luego tiempo. El protocolo llena primero la oferta en reposo con mejor precio, y cuando dos ofertas comparten precio, la mas antigua se empareja antes que la mas reciente. Una oferta nueva que cruza el libro existente se empareja de inmediato contra esas ofertas en reposo; la cantidad que quede despues de cruzar se convierte en una nueva oferta en reposo a tu precio limite. El emparejamiento, las transferencias de activos y la liquidacion ocurren todos de forma atomica dentro de un unico ledger, que se cierra aproximadamente cada cinco segundos. No hay un paso de compensacion aparte ni espera de confirmaciones mas alla del cierre de ese ledger.",
        "El modelo de costes es inusual si vienes de plataformas centralizadas. No hay una comision de trading porcentual. Pagas la comision base de la red, actualmente 100 stroops, que son 0.00001 XLM por operacion, una fraccion de un centimo de dolar. El verdadero coste de operar es el spread que cruzas cuando tomas liquidez, mas esa comision minuscula. Cruzar un spread de 10 basis points para conseguir una ejecucion inmediata cuesta mucho mas de lo que jamas costara la comision de red.",
        "Este bot es maker-first. En lugar de cruzar el spread y pagar el ask (o golpear el bid) para operar ya, deja su propia oferta en reposo en el mejor bid o ask para situarse en el libro como maker. Cuando otra persona cruza hacia ella, el bot captura el spread en lugar de pagarlo. Solo cruza como taker cuando de verdad necesita una ejecucion inmediata. Sobre un edge medido en basis points de un solo digito, la diferencia entre pagar el spread y capturarlo suele ser la diferencia entre una operacion rentable y una que no lo es.",
      ],
      example:
        "El libro de XLM/USDC muestra un mejor bid de 0.1170 y un mejor ask de 0.1180, un spread de 10 bps. Un taker que compra ahora paga 0.1180. El bot maker-first, en cambio, deja una oferta de compra en 0.1170, sumandose al bid. Cuando mas tarde un vendedor cruza hacia abajo hasta 0.1170, el bot se ejecuta dentro de ese cierre de ledger. Pago 100 stroops de comision de red y capturo el spread en lugar de ceder 0.0010 por XLM.",
    },
    {
      id: "c12-l2",
      title: "Que es una trustline y cuando se necesita?",
      paragraphs: [
        "Una trustline es un consentimiento explicito, creado con la operacion changeTrust, que autoriza a tu cuenta a mantener un activo no nativo concreto. Stellar identifica cada activo no nativo por un codigo mas su cuenta emisora, escrito como CODE:ISSUER. Ese emparejamiento importa: el USDC emitido por Circle es un activo completamente distinto de cualquier otro token que tambien se llame USDC. Una trustline es para un par exacto de codigo y emisor, asi que confiar en el USDC de Circle no te permite mantener el USDC de otro emisor.",
        "El unico activo que nunca necesita una trustline es XLM, el lumen nativo. Toda cuenta puede mantener y enviar XLM por defecto. Todo lo demas, cada token emitido, requiere una trustline antes de que tu cuenta pueda recibir o mantener cualquier cantidad de el. Si le envias a alguien un activo para el que no tiene trustline, el pago simplemente falla.",
        "Las trustlines tienen un coste en reserva bloqueada. Cada trustline abierta es una subentrada de tu cuenta, y cada subentrada eleva tu reserva minima de XLM en 0.5 XLM. Esos 0.5 XLM quedan bloqueados mientras la linea este abierta: no se pueden gastar, operar ni retirar hasta que elimines la trustline. Cinco trustlines abiertas, por tanto, bloquean 2.5 XLM por encima de la reserva base, y esa cantidad bloqueada es puramente un coste de mantenimiento, nunca se gasta ni se gana. Cerrar una trustline de un activo que ya no mantienes recupera esos 0.5 XLM, por eso las billeteras ordenadas cierran las lineas que ya no necesitan.",
        "Este bot se protege de la trampa del pago fallido con una verificacion previa de saldo. Antes de firmar cualquier operacion, comprueba que ya existe una trustline para el activo que la operacion vaya a recibir. Una compra que aterrizaria USDC solo se firma si la cuenta ya confia en ese emisor exacto de USDC. La comprobacion ocurre antes de firmar, no despues de un rechazo, asi que el bot nunca desperdicia una transaccion descubriendo en el momento de la liquidacion que no tenia donde poner el activo que acababa de comprar.",
      ],
      example:
        "Quieres que el bot compre USDC de Circle. Primero abres una trustline a USDC:Circle-issuer en el dashboard. Esa subentrada eleva tu reserva minima de XLM en 0.5 XLM, bloqueando esa cantidad mientras la linea siga abierta. Ahora una compra que recibe el USDC de Circle pasa la verificacion previa y se firma. Si mas adelante vendes todo ese USDC y cierras la trustline, los 0.5 XLM se liberan de vuelta a tu saldo disponible.",
    },
    {
      id: "c12-l3",
      title: "Que es un path payment y como lo usa esta app para hacer swap a XLM",
      paragraphs: [
        "Un path payment convierte un activo de envio en un activo de recepcion distinto dentro de una unica transaccion atomica, saltando por uno o varios mercados intermedios para encontrar una ruta. Stellar expone dos formas. pathPaymentStrictSend fija la cantidad que envias y deja que la cantidad recibida flote hacia abajo hasta un minimo que tu fijas; pathPaymentStrictReceive fija la cantidad que quieres recibir y deja que la cantidad enviada flote hacia arriba hasta un maximo que tu fijas. En cualquier caso la red recorre un camino, por ejemplo del activo A a un activo intermedio y de ahi al activo C, y todo el salto se liquida en conjunto o nada en absoluto.",
        "La atomicidad es la propiedad clave. La conversion entera o se completa a lo largo de cada salto o se revierte sin que nada cambie. Nunca puedes quedarte atascado a medias, manteniendo algun activo intermedio no deseado porque una pata fallara. Eso convierte a los path payments en una herramienta limpia para moverse entre activos que de verdad quieres mantener.",
        "Esta app usa path payments para su funcion de Swap y conversion de la billetera, y no para el ciclo de trading automatizado sobre el libro de ordenes. Cuando solicitas un swap, la app devuelve una cotizacion que describe sendAsset, sendAmount, destAsset, destAmount y el path que encontro, la lista ordenada de activos intermedios por los que pasa la ruta. Revisas esa cotizacion antes de confirmar, asi que ves la conversion completa, la ruta y la cantidad estimada que recibirias antes de que se firme nada.",
        "El auto-swap a XLM es esta funcion apuntada al lumen: consolidar tenencias que no son XLM de vuelta en XLM mediante ese mismo swap. Las dos razones principales son el posicionamiento y la reserva. Mantener XLM libera el lado de compra de la estrategia que vende XLM, porque el bot solo puede vender XLM en una caida si de verdad mantiene XLM. Y un saldo de XLM mayor recarga la reserva minima que exigen la cuenta base y cada trustline abierta. El swap es el mecanismo; el auto-swap a XLM es simplemente elegir XLM como activo de destino.",
      ],
      example:
        "Tienes yXLM y quieres XLM puro, pero el libro directo de yXLM a XLM tiene poca profundidad. Solicitas un swap. La app devuelve una cotizacion: sendAsset yXLM, sendAmount 100, destAsset XLM, destAmount unos 99.4, con un path que enruta yXLM a traves de USDC hacia XLM. La revisas y la aceptas. El path payment ejecuta ambos saltos de forma atomica en un solo ledger: o acabas con unos 99.4 XLM, o toda la transaccion se revierte y conservas tus 100 yXLM.",
    },
    {
      id: "c12-l4",
      title: "Pools de liquidez AMM frente al libro de ordenes",
      paragraphs: [
        "Stellar admite dos formas de operar un par de activos: el libro de ordenes y los pools de creador de mercado automatizado. El libro de ordenes, el SDEX, es un conjunto de ofertas discretas en reposo a precios concretos, emparejadas por precio y luego tiempo como se vio antes. Un pool de liquidez AMM tiene una forma distinta. Mantiene una reserva de dos activos juntos, financiada por proveedores de liquidez que depositan ambos lados, y los traders intercambian contra el pool en lugar de contra la oferta de otro trader.",
        "Un pool fija el precio de cada swap con una formula de producto constante, x por y igual a k. El producto de las dos reservas se mantiene constante a medida que se compra un lado y se vende el otro, asi que cuanto mas de un activo retiras, mas se mueve el precio en tu contra. Eso es el impacto en el precio, y crece con el tamano de la operacion: un swap pequeno apenas mueve la tasa, uno grande puede moverla mucho. Contra un libro de ordenes, en cambio, recorres ofertas discretas en reposo nivel a nivel. Los dos lugares tienen perfiles de slippage genuinamente distintos para la misma operacion nominal.",
        "Se preciso sobre lo que hace este bot. Su trading automatizado usa el libro de ordenes del SDEX, dejando ofertas maker-first en reposo como se describio en las lecciones anteriores. La estrategia no apunta a pools AMM y no dimensiona operaciones contra una curva de producto constante. Los pools se presentan aqui como un mecanismo general de Stellar con el que te encontraras, no como un lugar al que apunte el ciclo de trading.",
        "Hay una superposicion sutil. Un path payment, que impulsa la funcion de Swap, puede enrutarse incidentalmente a traves de un pool AMM a nivel de protocolo si la red detecta que la mejor ruta pasa por uno. Eso es el protocolo eligiendo una ruta eficiente para una conversion puntual, y es algo completamente separado del trading sobre el libro de ordenes que realiza el ciclo de escaneo. Asi que un pool puede tocar tu billetera a traves de un swap, pero nunca a traves de la estrategia automatizada.",
      ],
      example:
        "Imagina un pool de XLM/USDC con 100000 XLM y 12000 USDC, asi que k es 1.2 mil millones y el precio marginal es 0.12. Intercambias 1200 USDC y la reserva de USDC sube a 13200; para mantener k constante la reserva de XLM cae a unos 90909, asi que recibes unos 9091 XLM a una tasa media peor que 0.12, el impacto en el precio. El bot ignora este pool para operaciones automatizadas, dejando ofertas en reposo en el libro de ordenes en su lugar, aunque una cotizacion de Swap puntual podria enrutarse legitimamente a traves de el.",
    },
    {
      id: "c12-l5",
      title: "Vale la pena un auto-swap a XLM? La matematica de la rentabilidad",
      paragraphs: [
        "No hay un verificador de rentabilidad automatico dentro del ciclo de trading que decida por ti si un auto-swap a XLM compensa. El ciclo opera sobre el libro de ordenes; no evalua ni dispara swaps en silencio. Juzgar si un swap vale la pena es tu tarea, y la cotizacion de Swap te da todo lo que necesitas para hacerlo. Trata la cotizacion como una pequena hoja de calculo en vez de como un boton.",
        "El metodo es comparar destAmount, los XLM que la cotizacion dice que recibirias, con el valor de lo que entregas. Lo que entregas es sendAmount del activo de envio, valorado a una tasa de referencia justa. La diferencia entre ambos se la come el spread que cruzas a lo largo del path mas la comision de red por operacion de 100 stroops. Un path de varios saltos es mas caro que uno de un solo salto, porque cruzas un spread en cada mercado por el que pasa la ruta, no una sola vez. Asi que una ruta de dos saltos puede costar sigilosamente dos spreads.",
        "Un swap vale la pena cuando los XLM recibidos que indica la cotizacion superan tu mejor alternativa. Las alternativas suelen ser: mantener el activo tal cual, o venderlo en un mercado directo con mas profundidad y luego comprar XLM tu mismo. Si un mercado directo para tu activo tiene mas profundidad que el path del swap, vender alli y convertir a mano puede perder menos por spread que una ruta delgada de varios saltos. La cotizacion no conoce tus alternativas; ese juicio lo aportas tu comparando su destAmount con lo que rendirian esas otras rutas.",
        "Trabaja un ejemplo con numeros reales. Digamos que tienes 50 USDC y el precio justo de XLM es 0.12, asi que una conversion sin friccion daria 50 dividido entre 0.12, unos 416.7 XLM. La cotizacion de Swap devuelve un destAmount de 414.0 XLM a traves de una ruta de un solo salto. El deficit de unos 2.7 XLM, aproximadamente 0.65 por ciento, es el spread cruzado mas la comision insignificante de 100 stroops. Si mantener el USDC o venderlo en un libro directo con mas profundidad te dejara mas de 414.0 XLM de valor, salta el swap. Si 414.0 XLM es de verdad lo mejor que puedes lograr y necesitas XLM para liberar el lado de compra o recargar la reserva, el swap vale la pena. La aritmetica, no un verificador integrado, toma la decision.",
      ],
      example:
        "Tienes 50 USDC; la tasa justa es 0.12, asi que sin friccion son unos 416.7 XLM. Una cotizacion de Swap de un solo salto muestra un destAmount de 414.0 XLM, un recorte del 0.65 por ciento por el spread mas la comision de 100 stroops. Una cotizacion de dos saltos a traves de AQUA muestra 410.5 XLM, peor porque cruza dos spreads. Tomas la ruta de un solo salto de 414.0 solo porque necesitas XLM para la reserva y ningun mercado directo con mas profundidad la superaria.",
    },
  ],
  quiz: [
    {
      id: "c12-q1",
      prompt: "Como empareja ordenes y cobra comisiones el SDEX, y como opera este bot en el?",
      options: [
        {
          text: "Empareja por precio y luego tiempo y liquida de forma atomica dentro de un ledger; no hay comision porcentual, solo una comision base minuscula por operacion mas cualquier spread cruzado, y el bot es maker-first para capturar el spread.",
          explanation:
            "Correcto. El SDEX llena primero el mejor precio y luego la mas antigua, liquida dentro de un ledger de unos cinco segundos, cobra solo la comision base de 100 stroops mas el spread que cruzas, y este bot deja ofertas en reposo para capturar ese spread en lugar de pagarlo.",
        },
        {
          text: "Cobra una comision de trading porcentual en cada ejecucion y liquida tras varias confirmaciones de bloque, y el bot siempre cruza el spread como taker.",
          explanation:
            "Incorrecto. No hay comision porcentual, la liquidacion es atomica dentro de un ledger en lugar de muchas confirmaciones, y el bot es maker-first en vez de tomar siempre.",
        },
        {
          text: "Empareja primero las ofertas mas recientes y liquida off-chain a traves de un operador de exchange, pagando el bot una comision a ese operador.",
          explanation:
            "Incorrecto. El emparejamiento es primero la mas antigua a un precio dado, la liquidacion es on-chain y atomica, y no hay operador ni comision.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q2",
      prompt: "Cuando se requiere una trustline y que cuesta abrir una?",
      options: [
        {
          text: "Antes de mantener cualquier activo, incluido XLM, y cuesta una comision porcentual en cada recepcion.",
          explanation:
            "Incorrecto. XLM es nativo y nunca necesita una trustline, y el coste es una reserva bloqueada, no una comision porcentual.",
        },
        {
          text: "Antes de que tu cuenta pueda mantener un activo no nativo concreto CODE:ISSUER, como el USDC de Circle, y cada trustline abierta bloquea 0.5 XLM en tu reserva minima.",
          explanation:
            "Correcto. Una trustline es el consentimiento para un par exacto de codigo y emisor, XLM nunca necesita una, y cada linea abierta eleva tu reserva minima en 0.5 XLM hasta que se cierra.",
        },
        {
          text: "Solo una vez que una operacion ya ha fallado por la falta de una, y no cuesta nada.",
          explanation:
            "Incorrecto. La verificacion previa comprueba la trustline antes de firmar, no despues de un fallo, y cada linea bloquea 0.5 XLM de reserva.",
        },
        {
          text: "Antes de enviar XLM a cualquier cuenta nueva, y quema 0.5 XLM de forma permanente.",
          explanation:
            "Incorrecto. Enviar XLM no necesita ninguna trustline, y los 0.5 XLM son reserva bloqueada que se recupera al cerrar la linea, no se queman.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c12-q3",
      prompt: "Que hace un path payment y como lo usa esta app?",
      options: [
        {
          text: "Divide un pago en varias transacciones independientes que se liquidan cada una por su cuenta.",
          explanation:
            "Incorrecto. Un path payment es una unica transaccion atomica; o la conversion entera se completa o se revierte por completo.",
        },
        {
          text: "Es el mecanismo detras de cada operacion automatizada sobre el libro de ordenes que hace el bot.",
          explanation:
            "Incorrecto. El ciclo automatizado usa ofertas del libro de ordenes del SDEX; los path payments impulsan en cambio la funcion de Swap y conversion de la billetera.",
        },
        {
          text: "Convierte un activo de envio en un activo de recepcion distinto de forma atomica a traves de uno o varios saltos, y la app lo usa para la funcion de Swap y conversion de la billetera, devolviendo una cotizacion con sendAsset, destAmount y el path.",
          explanation:
            "Correcto. Un path payment salta por mercados intermedios en una unica transaccion atomica, y la app lo usa para swaps, incluido el auto-swap a XLM, mostrando la ruta y la cantidad estimada a recibir antes de que confirmes.",
        },
        {
          text: "Abre una trustline automaticamente para cualquier activo que recibas.",
          explanation:
            "Incorrecto. Las trustlines se abren por separado con changeTrust en el dashboard; un path payment convierte activos y no crea trustlines.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c12-q4",
      prompt: "En que se diferencia un pool AMM del libro de ordenes y cual opera el ciclo automatizado de este bot?",
      options: [
        {
          text: "Un pool fija el precio de los swaps a lo largo de una curva de producto constante con impacto dependiente del tamano, el libro de ordenes empareja ofertas discretas en reposo, y el ciclo automatizado del bot opera sobre el libro de ordenes.",
          explanation:
            "Correcto. Los pools AMM usan x por y igual a k asi que las operaciones mas grandes mueven mas el precio, el libro de ordenes usa ofertas discretas, y el ciclo automatizado deja ofertas maker-first en reposo en el libro de ordenes, no en pools.",
        },
        {
          text: "Un pool y el libro de ordenes son el mismo mecanismo, y el bot enruta cada operacion automatizada a traves del pool.",
          explanation:
            "Incorrecto. Son mecanismos distintos, y el ciclo automatizado opera sobre el libro de ordenes en lugar de enrutar a traves de pools.",
        },
        {
          text: "Un pool es un conjunto de ofertas discretas en reposo, el libro de ordenes es una curva de producto constante, y el bot opera sobre la curva.",
          explanation:
            "Incorrecto. Las descripciones estan intercambiadas: el libro de ordenes mantiene ofertas discretas y el pool es la curva de producto constante, y el bot opera sobre el libro de ordenes.",
        },
        {
          text: "Un pool tiene cero impacto en el precio a cualquier tamano, asi que el bot enruta sus operaciones automatizadas alli para evitar slippage.",
          explanation:
            "Incorrecto. Un pool de producto constante tiene impacto en el precio que crece con el tamano, y el bot opera sobre el libro de ordenes en lugar de pools.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c12-q5",
      prompt: "Como deberias juzgar si un auto-swap a XLM vale la pena?",
      options: [
        {
          text: "Confiar en un verificador de rentabilidad integrado en el ciclo de trading que decide automaticamente si cada swap compensa.",
          explanation:
            "Incorrecto. No hay un verificador de rentabilidad automatico en el ciclo de trading; evaluas el swap tu mismo a partir de la cotizacion.",
        },
        {
          text: "Asumir que cualquier swap vale la pena porque la comision de red es minuscula, ignorando el spread.",
          explanation:
            "Incorrecto. El coste dominante es el spread cruzado a lo largo del path, y una ruta de varios saltos cruza uno en cada salto; la comision minuscula no es el factor decisivo.",
        },
        {
          text: "Comparar el destAmount de la cotizacion en XLM con el valor de lo que entregas, restando el spread cruzado en cada salto y la comision por operacion, y aceptarlo solo si eso supera a mantener o a vender en un mercado directo con mas profundidad.",
          explanation:
            "Correcto. Lees destAmount frente al valor justo de sendAmount, tienes en cuenta el spread en cada salto mas la comision de 100 stroops, y haces el swap solo cuando los XLM recibidos superan tus alternativas.",
        },
        {
          text: "Elegir la cotizacion que tenga mas saltos, ya que mas saltos siempre significa un mejor precio.",
          explanation:
            "Incorrecto. Mas saltos significan mas spreads cruzados, lo que suele empeorar la ruta, no mejorarla.",
        },
      ],
      correctIndex: 2,
    },
  ],
};
