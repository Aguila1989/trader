import type { Chapter } from "../../types";

export const chapter02: Chapter = {
  id: "c2",
  number: 2,
  level: "BASIC",
  title: "Entender los precios",
  description: "Como se forman los precios en el libro de ordenes del SDEX, y por que los bids, asks, el spread, el slippage y la liquidez determinan lo que realmente pagas.",
  lessons: [
    {
      id: "c2-l1",
      title: "Que es un precio de mercado?",
      paragraphs: [
        "Un precio de mercado no es una etiqueta fija que pone alguna autoridad. Es simplemente el precio al que alguien esta dispuesto a comprar y otra persona esta dispuesta a vender ahora mismo. Cuando ves XLM cotizado en USDC, ese numero es el acuerdo mas reciente entre un comprador y un vendedor, o el mejor precio disponible en este momento.",
        "Como los precios provienen de personas, se mueven constantemente. Cada nueva oferta, cada oferta cancelada o cada trade completado puede empujar el numero hacia arriba o hacia abajo. No existe un unico precio verdadero, solo el precio al que realmente puedes operar en este instante.",
        "Este bot lee los precios en vivo directamente del Stellar Decentralized Exchange, el SDEX. La vista de detalle del token los representa en un grafico de precios con velas por hora, dia, semana y ano, para que puedas ver como el precio acordado ha ido cambiando con el tiempo, no solo el ultimo tick.",
      ],
      example: "Imagina que XLM cotizo por ultima vez a 0.118 USDC. Un minuto despues, los vendedores bajan sus ofertas y el mejor precio al que puedes comprar pasa a ser 0.117 USDC. Nadie anuncio ningun cambio; el precio de mercado simplemente se movio porque cambio el vendedor mas barato dispuesto a operar. El grafico de velas mostraria esa pequena bajada como la ultima barra horaria.",
    },
    {
      id: "c2-l2",
      title: "Que es un libro de ordenes y como se lee?",
      paragraphs: [
        "Un libro de ordenes es una lista en vivo de todas las ofertas vigentes de compra y de venta de un token. El bot opera directamente contra este libro en el SDEX, en lugar de operar contra un AMM de fondos agrupados. En la pestana de Trading manual, el panel del libro de ordenes muestra dos listas apiladas.",
        "El lado verde son los bids: gente que quiere comprar, con el precio mas alto arriba. El lado rojo son los asks: gente que quiere vender, con el precio mas bajo arriba. Los dos mejores precios enfrentados en el centro son la cima del libro, los precios inmediatos a los que operarias.",
        "Cada fila tambien muestra cuanto volumen hay a ese precio. En el bot puedes hacer clic en un nivel de bid y este coloca ese precio exacto en el formulario de orden, ahorrandote escribirlo. Leer el libro te dice no solo el precio, sino cuanto puedes operar antes de que el precio empeore.",
      ],
      example: "Abres el libro de ordenes de XLM y USDC. El mejor bid verde marca 0.117 por 4,000 XLM, y debajo 0.116 por 9,000 XLM. El mejor ask rojo marca 0.119 por 3,000 XLM. Asi que 4,000 XLM podrian venderse a 0.117; vender mas entraria en el nivel de 0.116. Al hacer clic en el bid de 0.117, ese precio aparece al instante en tu formulario de orden.",
    },
    {
      id: "c2-l3",
      title: "Que es un bid, un ask y un spread?",
      paragraphs: [
        "Un bid es el precio que un comprador ofrece pagar. Un ask es el precio que un vendedor quiere recibir. El mejor bid siempre es un poco mas bajo que el mejor ask, porque nadie ofrece pagar mas de lo que pide el vendedor mas barato. La diferencia entre esos dos mejores precios es el spread.",
        "El bot muestra este spread directamente, medido en puntos basicos, donde un punto basico es una centesima de uno por ciento. Un InfoTip en la app te lo define: la diferencia entre el mejor precio de compra y el mejor precio de venta, donde un spread mas amplio significa un mayor coste oculto por trade.",
        "El spread importa porque es un coste que pagas simplemente por operar. Si compras al ask y vendes de inmediato al bid, pierdes el spread. Por eso este bot lo vigila de cerca; la estrategia aqui consiste sobre todo en capturar spreads minimos, y uno amplio puede eliminar la ventaja por completo.",
      ],
      example: "Si el mejor bid para XLM es 0.117 USDC y el mejor ask es 0.119 USDC, el spread es 0.002 USDC. Como fraccion del precio eso es alrededor del 1.7 por ciento, o aproximadamente 170 puntos basicos, lo que el bot marcaria como amplio. Compra y vende al instante, y estarias perdiendo esos 0.002 por XLM antes de cualquier otra comision.",
    },
    {
      id: "c2-l4",
      title: "Que es el slippage y por que ocurre?",
      paragraphs: [
        "El slippage es la diferencia entre el precio que esperabas y el precio que realmente conseguiste. Ves un token a un precio, pero para cuando se ejecuta tu orden, llenas a uno ligeramente peor. El formulario de orden del bot tiene un campo de tolerancia de slippage donde defines el maximo que estas dispuesto a aceptar.",
        "Ocurre por dos motivos principales. Primero, los precios se mueven entre el momento en que decides y el momento en que tu orden llega; alguien mas puede operar antes. Segundo, tu orden puede ser mayor que el volumen al mejor precio, asi que va comiendo niveles peores mas profundos en el libro de ordenes hasta llenarse por completo.",
        "El InfoTip de la app lo expone con claridad: el slippage es la diferencia maxima en porcentaje entre el precio esperado y el precio real de ejecucion que estas dispuesto a aceptar. Ajustarlo demasiado estricto puede cancelar tu trade; ajustarlo demasiado holgado deja que llenes a un mal precio. Es una proteccion que ajustas para cada trade.",
      ],
      example: "Quieres comprar 10,000 XLM y el mejor ask es 0.119 USDC, pero solo hay 3,000 XLM ahi. Los siguientes 7,000 se llenan a 0.120. Tu precio promedio pasa a ser alrededor de 0.1197, un poco por encima del 0.119 que viste. Si tu tolerancia de slippage estaba puesta en 0.5 por ciento, este movimiento del 0.6 por ciento cancelaria la orden en lugar de llenarla.",
    },
    {
      id: "c2-l5",
      title: "Que es la liquidez y por que importa?",
      paragraphs: [
        "La liquidez es cuanto puedes operar cerca del precio actual sin moverlo. Un mercado liquido tiene mucho volumen acumulado y cercano en ambos lados del libro de ordenes, de modo que incluso una orden considerable se llena con poco slippage. Un mercado delgado solo tiene ofertas pequenas, asi que cualquier trade de tamano decente mueve el precio bruscamente.",
        "El bot sigue el volumen de operacion de cada mercado en las ultimas 24 horas y lo trata como un chequeo de salud. Si un mercado es demasiado delgado, simplemente se niega a operar ahi, porque el spread y el slippage harian que cualquier ventaja no fuese rentable y salir limpiamente podria ser dificil.",
        "Para ti como trader manual, la liquidez es la razon por la que dos mercados al mismo precio pueden sentirse completamente distintos. Un libro profundo te permite operar con confianza; uno superficial significa que tu propia orden es lo que mueve el precio en tu contra. Echa siempre un vistazo a la profundidad en el panel del libro de ordenes antes de dimensionar un trade.",
      ],
      example: "XLM y USDC podrian mostrar 800,000 USDC de volumen en 24 horas con miles de XLM en cada nivel de precio, asi que una orden de 5,000 XLM apenas lo mueve. Un token diminuto con solo 200 USDC de volumen diario y 50 unidades por nivel daria un bandazo con la misma orden, asi que el bot lo descartaria por completo por ser demasiado delgado.",
    },
  ],
  quiz: [
    {
      id: "c2-q1",
      prompt: "En el panel del libro de ordenes del bot, que muestra el lado verde y como esta ordenado?",
      options: [
        {
          text: "Los bids de los compradores, con el precio mas alto arriba.",
          explanation: "Correcto. El verde son los bids, ordenados de mayor a menor para que el mejor precio de compra quede en la cima del libro.",
        },
        {
          text: "Los asks de los vendedores, con el precio mas bajo arriba.",
          explanation: "Incorrecto. Los asks son el lado rojo; el ask mas bajo es el mejor precio de venta, pero esa no es la lista verde.",
        },
        {
          text: "Trades completados en la ultima hora, los mas nuevos primero.",
          explanation: "Incorrecto. El libro de ordenes muestra ofertas vigentes, no un historial de trades pasados.",
        },
        {
          text: "Los balances del pool AMM que respaldan el mercado.",
          explanation: "Incorrecto. Este bot opera el libro de ordenes del SDEX, no pools AMM, asi que aqui no se muestran balances de pool.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c2-q2",
      prompt: "El mejor bid para XLM es 0.117 USDC y el mejor ask es 0.119 USDC. Cual es el spread y por que importa?",
      options: [
        {
          text: "Es 0.236 USDC, la suma de ambos precios, y es el beneficio que obtienes por trade.",
          explanation: "Incorrecto. El spread es la diferencia, no la suma, y es un coste que pagas, no un beneficio.",
        },
        {
          text: "No hay spread porque ambos numeros estan cerca, asi que operar es gratis.",
          explanation: "Incorrecto. Cualquier diferencia entre el mejor bid y el mejor ask es un spread real y un coste real.",
        },
        {
          text: "Es 0.002 USDC, la diferencia entre el mejor bid y el mejor ask, y es un coste oculto por trade.",
          explanation: "Correcto. 0.119 menos 0.117 es 0.002; comprar al ask y vender al bid te hace perder ese spread.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c2-q3",
      prompt: "Por que ocurre slippage cuando colocas una orden mas grande?",
      options: [
        {
          text: "El exchange cobra una penalizacion por ordenes que superan un tamano fijo.",
          explanation: "Incorrecto. El slippage no es una penalizacion fija; proviene de como se llena el libro de ordenes.",
        },
        {
          text: "La orden consume el mejor nivel de precio y llena el resto a precios peores mas profundos en el libro.",
          explanation: "Correcto. Si tu tamano supera el volumen al mejor precio, el resto se llena en niveles peores, empeorando tu precio promedio.",
        },
        {
          text: "El bot empeora tu precio a proposito para capturar el spread para si mismo.",
          explanation: "Incorrecto. El slippage proviene de la profundidad limitada y de los precios en movimiento, no de que el bot trabaje en tu contra.",
        },
        {
          text: "El slippage solo ocurre en ordenes diminutas, nunca en las grandes.",
          explanation: "Incorrecto. Las ordenes mas grandes tienen mas probabilidad de sufrir slippage, porque agotan mas facilmente el volumen al mejor precio.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c2-q4",
      prompt: "Por que el bot se niega a operar en un mercado con un volumen de 24 horas muy bajo?",
      options: [
        {
          text: "Un volumen bajo significa que el token es totalmente nuevo y aun no esta listado en el SDEX.",
          explanation: "Incorrecto. Un mercado puede estar listado y aun asi ser delgado; el volumen bajo es cuestion de profundidad, no de estar listado.",
        },
        {
          text: "Una liquidez delgada implica spreads amplios y mucho slippage, asi que cualquier ventaja se consume y salir limpiamente es dificil.",
          explanation: "Correcto. Sin profundidad cerca del precio, los costes de spread y slippage hacen que los trades no sean rentables y sean arriesgados de deshacer.",
        },
        {
          text: "Un volumen bajo siempre significa que el precio esta a punto de desplomarse.",
          explanation: "Incorrecto. El volumen delgado no predice la direccion; predice un mayor coste de operar y dificultad para salir.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
