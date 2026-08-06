// Capítulo 40: educación general sobre estructura de mercado. Un capítulo
// ADVANCED que enseña conceptos válidos para los mercados cripto en general
// (no atados a ninguna plataforma o producto concreto): libros de órdenes vs
// AMM, makers vs takers, spread y slippage, futuros perpetuos y funding
// rates, y por qué el coste de ejecución decide si un edge estadístico fino
// sobrevive de verdad al trading. Contenido estrictamente de alcance público
// — sin mención alguna de un modo de operación, proveedor o función interna
// específicos; enseña los conceptos que un trader necesita para razonar
// sobre cualquier exchange.
import type { Chapter } from "../../types";

export const chapter40: Chapter & { whoFor: string } = {
  id: "c40",
  number: 40,
  level: "ADVANCED",
  whoFor: "Para cualquiera que quiera entender cómo funcionan realmente los exchanges de cripto por dentro",
  title: "Estructura de mercado: libros de órdenes, AMM y coste de ejecución",
  description:
    "Libros de órdenes frente a AMM, makers frente a takers, spread y slippage, futuros perpetuos y funding rates, y por qué el coste de ejecución decide si un edge sobrevive.",
  lessons: [
    {
      id: "c40-l1",
      title: "Dos formas en que un mercado organiza las operaciones: el libro de órdenes y el AMM",
      paragraphs: [
        "Toda plataforma de trading tiene que resolver el mismo problema: emparejar a alguien que quiere comprar con alguien que quiere vender, a un precio que ambas partes acepten. Hay dos diseños dominantes para lograrlo, y prácticamente cualquier exchange que uses alguna vez, en cualquier cadena, está construido sobre uno de los dos.",
        "El primero es el libro de órdenes, a veces llamado central limit order book o CLOB. Es una lista viva y ordenada de ofertas pendientes: todo el que quiere comprar indica un precio y una cantidad, todo el que quiere vender hace lo mismo, y la plataforma los empareja en cuanto un precio de compra y uno de venta se cruzan. Casi seguro que ya has visto uno — es esa clásica pila de precios de compra en verde y precios de venta en rojo que aparece en la pantalla de trading de cualquier exchange. Un libro de órdenes solo funciona si hay alguien al otro lado dispuesto a operar a (o cerca de) tu precio; si nadie ofrece cerca de donde quieres operar, tu orden simplemente se queda sin ejecutar.",
        "El segundo es el automated market maker, o AMM. En lugar de emparejar a personas individuales, un AMM mantiene una reserva compartida de dos activos y fija el precio de cada operación mediante una fórmula basada en cuánto hay de cada activo en la reserva en ese momento. No hay contraparte que buscar — siempre operas contra la propia reserva, y la reserva siempre cotiza un precio, incluso para un par que nadie ha operado en horas. La contrapartida es que una operación grande desplaza de forma medible el precio propio de la reserva (esto se llama impacto en el precio), porque estás cambiando la proporción de activos sobre la que se basa la fórmula para fijar el precio.",
        "Ninguno de los dos diseños es simplemente mejor que el otro — cada uno encaja en situaciones distintas. Un libro de órdenes ofrece control preciso (puedes fijar un precio exacto y esperar) y suele ofrecer precios más ajustados en pares muy operados donde mucha gente cotiza. Un AMM garantiza que siempre puedas operar algo, al instante, incluso en un par poco conocido, a costa de que esa operación mueva más el precio cuanto mayor sea. Entender contra cuál de los dos estás operando cambia cómo debes interpretar el precio que se te muestra.",
      ],
      example:
        "Supón que quieres operar un par conocido como ETH/USDC. En un exchange de libro de órdenes verías una escalera de órdenes de compra y venta pendientes, y tu operación se ejecutaría contra la mejor de ellas. En un exchange basado en AMM no hay ninguna escalera que mirar — simplemente ves un precio cotizado calculado a partir de las reservas actuales de la reserva, y una operación pequeña apenas lo mueve mientras que una muy grande lo mueve de forma visible, porque la propia operación cambia la proporción sobre la que la fórmula fija el precio.",
    },
    {
      id: "c40-l2",
      title: "Makers y takers: quién aporta liquidez, y quién la paga",
      paragraphs: [
        "En un exchange de libro de órdenes, cada trader cae en uno de dos roles para cualquier operación dada, y esa distinción importa porque suele determinar lo que pagas en comisiones. Un maker coloca una orden que no se ejecuta de inmediato — queda pendiente en el libro, añadiendo un precio visible contra el que otro puede operar, y efectivamente aporta liquidez para que otros la usen. Un taker coloca una orden que se ejecuta al instante contra una orden ya pendiente en el libro — consume la liquidez que aportó el maker, tomando el precio que había disponible en lugar de esperar el suyo propio.",
        "Como los makers son quienes surten el libro de precios contra los que operar, la mayoría de exchanges premian ese comportamiento: las comisiones de maker suelen ser más bajas que las de taker, y en algunas plataformas a los makers incluso se les paga un pequeño rebate por colocar órdenes pendientes, financiado con la comisión más alta que se cobra a los takers. La lógica es sencilla — una plataforma con un libro de órdenes delgado y vacío resulta poco atractiva para operar, así que a los exchanges les interesa directamente pagar a la gente para mantenerlo poblado con cotizaciones pendientes.",
        "La misma división maker/taker aparece también en un contexto AMM, solo que con otros nombres: un liquidity provider deposita activos en la reserva (la versión AMM de un maker, aportando las reservas contra las que todos operan) y gana una parte de cada comisión de operación que cobra la reserva, mientras que quien intercambia contra la reserva (el taker) paga esa comisión como coste de una ejecución instantánea.",
        "Vale la pena interiorizar esta distinción cada vez que colocas una orden, en cualquier plataforma: una orden límite que se queda esperando se comporta como una orden maker, normalmente más barata, pero sin garantía de llegar a ejecutarse; una orden de mercado que toma lo que haya disponible en ese momento se comporta como una orden taker, normalmente algo más cara, pero se ejecuta de inmediato.",
      ],
      example:
        "Dos traders quieren comprar el mismo activo en el mismo momento. El primero coloca una orden límite ligeramente por debajo del precio de mercado actual y espera — queda pendiente en el libro como orden maker, pagando la comisión maker más baja, pero solo se ejecuta si el precio realmente baja hasta encontrarla. El segundo coloca una orden de mercado ahora mismo, tomando las órdenes de venta que en ese momento están pendientes en el libro — se ejecuta al instante, paga la comisión taker más alta, y obtiene el precio que ofrecían esas órdenes pendientes, que puede ser algo peor que el precio límite paciente del primer trader.",
    },
    {
      id: "c40-l3",
      title: "Spread y slippage: los dos costes que se esconden en cada operación",
      paragraphs: [
        "El spread es la diferencia entre el mejor precio al que alguien está dispuesto a comprar y el mejor precio al que alguien está dispuesto a vender, ahora mismo, en un libro de órdenes. Un spread estrecho (precios de compra y venta próximos entre sí) significa que el mercado es líquido y se opera mucho; un spread amplio significa que menos gente cotiza activamente, así que hay un coste incorporado mayor solo por cruzar de un lado al otro. Incluso una operación que se ejecuta al instante, al mejor precio disponible, sigue pagando este coste — es la diferencia entre dónde podrías vender y dónde podrías comprar en ese mismo instante.",
        "El slippage es distinto: es la diferencia entre el precio que esperabas al colocar una operación y el precio que realmente obtuviste una vez ejecutada. Ocurre cuando tu orden es lo bastante grande, o el mercado se mueve lo bastante rápido, para que ejecutarla consuma más que el único mejor precio disponible — una orden de mercado grande puede ejecutar parte de sí misma al mejor precio, luego más a uno algo peor, y así sucesivamente, hasta completar toda la cantidad. En un AMM, el slippage es en realidad la misma idea expresada a través de la fórmula de precios: cuanto mayor sea tu operación respecto a la reserva, más se mueve el precio de la reserva en tu contra para cuando tu operación termina.",
        "Ambos costes crecen con dos factores: lo grande que sea tu operación respecto a la liquidez disponible, y lo poco líquido que sea el activo en general. Una operación pequeña en un par muy operado apenas roza ninguno de los dos costes; el mismo tamaño de operación en un par ilíquido y poco operado puede costar notablemente más, solo por spread y slippage, antes incluso de aplicar cualquier comisión del exchange.",
        "La mayoría de exchanges te permiten fijar una tolerancia máxima de slippage en una operación — la mayor diferencia entre el precio esperado y el real que estás dispuesto a aceptar antes de que la operación se rechace en lugar de ejecutarse. Esto existe para protegerte: sin ella, un repunte repentino de volatilidad entre colocar una orden y que se ejecute podría hacer que se ejecutara a un precio dramáticamente peor del que pretendías.",
      ],
      example:
        "Imagina un token poco operado donde la mejor oferta de compra está en 0,098 y la mejor de venta en 0,102 — un spread amplio del 4% solo por cruzar el libro. Colocas una orden de mercado para comprar una cantidad grande: ejecuta parte de la cantidad a 0,102, pero no hay suficiente disponible ahí, así que el resto se ejecuta a 0,104, luego a 0,107, dando un precio medio de ejecución bastante por encima del 0,102 que viste cotizado al principio. Esa diferencia entre el 0,102 esperado y el promedio de unos 0,105 realmente pagado es el slippage, sumado al spread que ya pagaste solo por ser taker.",
    },
    {
      id: "c40-l4",
      title: "Futuros perpetuos y funding rates",
      paragraphs: [
        "Un futuro perpetuo (a menudo abreviado como \"perp\") es un contrato derivado que permite tomar una apuesta direccional apalancada sobre el precio de un activo sin llegar a poseer nunca el activo subyacente. A diferencia de un contrato de futuros tradicional, un perp no tiene fecha de vencimiento — en principio puede mantenerse indefinidamente — y precisamente eso es lo que lo hace \"perpetuo\", y por qué se ha convertido en uno de los tipos de instrumentos más operados en cripto.",
        "Como un perp nunca vence ni se liquida, los exchanges necesitan algún mecanismo para mantener su precio pegado al precio spot real del activo subyacente — de lo contrario, ambos podrían irse alejando indefinidamente sin nada que los volviera a acercar. Ese mecanismo es el funding rate: un pago periódico intercambiado directamente entre los traders con posiciones largas (que apuestan a que el precio sube) y los traders con posiciones cortas (que apuestan a que baja), calculado según cuánto se ha desviado el precio del perp respecto al precio spot.",
        "La dirección del pago de funding indica hacia qué lado se inclina la mayoría. Cuando el perp cotiza por encima del spot (más demanda de ir largo que corto), los largos pagan a los cortos — un coste por mantenerse largo que empuja a algunos largos a cerrar y a algunos cortos a abrir, arrastrando el precio del perp de vuelta hacia el spot. Cuando el perp cotiza por debajo del spot, el pago se invierte: los cortos pagan a los largos, empujando el precio hacia arriba. El funding no es una comisión que se paga al exchange; es una transferencia directa entre los dos lados del mercado, y por eso ocasionalmente puede ser una fuente genuina de rendimiento (estar del lado que cobra el funding) y no solo un coste.",
        "Los funding rates suelen cotizarse por período (habitualmente cada una u ocho horas) y pueden oscilar entre ligeramente positivos y marcadamente negativos, según cuán unilateral se haya vuelto el sentimiento del mercado. Un funding rate persistentemente alto es en sí mismo información: señala que un lado de la operación se ha llenado de posiciones, y un posicionamiento abarrotado a menudo precede a un movimiento brusco cuando esas posiciones sobreextendidas se ven forzadas a cerrar.",
      ],
      example:
        "Imagina que un futuro perpetuo sobre un activo cotiza notablemente por encima de su precio spot porque muchos más traders quieren estar largos que cortos. En cada intervalo de funding, los largos pagan colectivamente un pequeño porcentaje del valor de su posición a los cortos. Si estás largo y mantienes la posición a través de muchos intervalos de funding mientras el mercado sigue así de desequilibrado, ese goteo constante de pagos de funding puede erosionar silenciosamente el rendimiento de tu posición incluso mientras el precio en sí se mantiene plano — un coste que no tiene nada que ver con el spread o el slippage, y todo que ver con en qué lado de una operación abarrotada te encuentras.",
    },
    {
      id: "c40-l5",
      title: "Por qué el coste de ejecución decide si un edge fino sobrevive",
      paragraphs: [
        "Un \"edge\" de trading es una tendencia estadística — un patrón que, en promedio, hace que un lado de una operación sea ligeramente más probable de ser rentable que el otro. Casi cualquier edge que valga la pena operar es fino: unos pocos puntos básicos (centésimas de porcentaje) de ventaja esperada por operación, no una distorsión de precio espectacular. Esa delgadez es precisamente la razón por la que el coste de ejecución importa mucho más de lo que parece a primera vista.",
        "Cada operación que realizas paga una combinación de spread, slippage y comisiones del exchange (maker o taker), más — en un perp — un posible desgaste por funding si mantienes la posición durante períodos desfavorables. A ninguno de estos costes le importa si tu edge subyacente es real; se cobran en cada operación, ganes o pierdas. Si tu edge vale en promedio 10 puntos básicos por operación, pero el spread más el slippage más las comisiones te cuestan 8 puntos básicos cada vez que actúas sobre él, no has capturado un edge de 10 puntos básicos — has capturado 2, y una sola operación desafortunada con más slippage de lo habitual puede borrarlo por completo.",
        "Por eso el mismo edge estadístico subyacente puede ser genuinamente rentable en una plataforma profunda, líquida y de bajo coste, y un auténtico perdedor en una plataforma delgada, de spread amplio y cara, aunque el patrón en los datos de precios sea idéntico en ambos sitios. El edge no vive en el vacío — vive dentro de una estructura de costes específica, y esa estructura de costes la determinan la liquidez del mercado, la anchura del spread, el slippage que provoca un tamaño de operación dado, y en qué lado de maker/taker acabas.",
        "La conclusión práctica es evaluar siempre el edge de una estrategia neto de costes de ejecución realistas, no frente al limpio precio medio que muestra un gráfico. Un backtest que ignora el spread, el slippage y las comisiones sobrestimará sistemáticamente lo buena que parece una estrategia, porque mide un precio al que nadie habría podido operar realmente. El tamaño del edge verdadero, medido frente a los costes de trading reales en la plataforma y el tamaño de operación que se pretende usar, es lo que finalmente decide si una idea merece la pena ponerla en práctica.",
      ],
      example:
        "Supón que una investigación muestra un patrón rentable en promedio 12 puntos básicos por operación, medido al precio medio. En un mercado profundo y de spread estrecho donde los costes de ida y vuelta rondan los 3 puntos básicos, ese edge sobrevive con holgura, dejando unos 9 puntos básicos de beneficio esperado real por operación. Ejecuta exactamente el mismo patrón en un mercado delgado donde solo el spread consume 15 puntos básicos de ida y vuelta, y ese mismo edge estadístico ya es perdedor antes incluso de contar el slippage — el patrón en los datos de precios nunca cambió, solo cambió el coste de actuar sobre él.",
    },
  ],
  quiz: [
    {
      id: "c40-q1",
      prompt: "¿Cuál es la diferencia estructural clave entre un exchange de libro de órdenes (CLOB) y un AMM?",
      options: [
        {
          text: "Un libro de órdenes empareja órdenes de compra y venta individuales a precios que fija la gente; un AMM fija el precio de cada operación mediante una fórmula contra una reserva compartida, sin contraparte individual con la que emparejar.",
          explanation:
            "Correcto. Un libro de órdenes necesita una contraparte que coincida con tu precio; un AMM siempre cotiza un precio de su reserva mediante una fórmula, a costa de que las operaciones más grandes muevan más ese precio.",
        },
        {
          text: "Un libro de órdenes solo existe en exchanges centralizados, mientras que los AMM solo existen en los descentralizados.",
          explanation:
            "Falso. Tanto los libros de órdenes como los AMM aparecen en plataformas centralizadas y descentralizadas — la distinción está en cómo se emparejan y cotizan las operaciones, no en la custodia ni el tipo de plataforma.",
        },
        {
          text: "Un AMM siempre garantiza un mejor precio que un libro de órdenes.",
          explanation:
            "Falso. Ningún diseño ofrece intrínsecamente mejor precio — un libro de órdenes puede ofrecer precios más ajustados en pares activamente cotizados, mientras que un AMM garantiza que siempre puedas operar, a costa del impacto en el precio en operaciones grandes.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q2",
      prompt: "¿Por qué la mayoría de los exchanges de libro de órdenes cobran comisiones más bajas a los makers (o incluso les pagan un rebate) comparado con los takers?",
      options: [
        {
          text: "Los makers colocan órdenes pendientes que aportan liquidez al libro para que otros operen contra ella, y un libro delgado y vacío resulta poco atractivo para operar — así que a los exchanges les conviene premiar el comportamiento que lo mantiene poblado.",
          explanation:
            "Correcto. Los makers añaden profundidad al libro esperando; los takers consumen esa profundidad de inmediato. Premiar a los makers mantiene el libro líquido, lo que beneficia al exchange y a todos los traders que lo usan.",
        },
        {
          text: "Los makers son grandes traders institucionales y los takers siempre son pequeños traders minoristas.",
          explanation:
            "Falso. Maker y taker son roles que dependen de si una orden queda pendiente en el libro o se ejecuta de inmediato — cualquiera, minorista o institucional, puede ser uno u otro según el tipo de orden que use.",
        },
        {
          text: "Las comisiones de taker en realidad siempre son más bajas, porque los takers ayudan a emparejar las órdenes abiertas más rápido.",
          explanation:
            "Falso. Normalmente es al revés — los makers suelen pagar comisiones más bajas (a veces incluso un rebate) porque son quienes aportan la liquidez, mientras que los takers pagan más por la comodidad de una ejecución inmediata.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q3",
      prompt: "¿Cuál es la diferencia entre spread y slippage?",
      options: [
        {
          text: "El spread es la diferencia entre el mejor precio de compra y venta actual en el libro en este momento; el slippage es la diferencia entre el precio que esperabas al colocar una operación y el precio que realmente obtuviste al ejecutarse.",
          explanation:
            "Correcto. El spread existe incluso en una operación instantánea y pequeña al mejor precio. El slippage aparece cuando tu operación es lo bastante grande o el mercado se mueve lo bastante rápido para que la ejecución consuma más que ese único mejor precio.",
        },
        {
          text: "Son dos nombres para exactamente el mismo coste, y los exchanges simplemente usan el que mejor encaje con su marketing.",
          explanation:
            "Falso. Son costes distintos que ambos reducen una operación — el spread es una diferencia incorporada en el libro, el slippage es el coste extra de una ejecución que atraviesa varios niveles de precio o de una fórmula de AMM que se mueve durante la operación.",
        },
        {
          text: "El spread solo aplica a los AMM y el slippage solo a los libros de órdenes.",
          explanation:
            "Falso. El spread es más visible en los libros de órdenes, pero ambos conceptos aplican a los dos diseños — el deterioro de ejecución de un AMM causado por el impacto en el precio es funcionalmente la misma idea que el slippage en un libro de órdenes.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q4",
      prompt: "¿Qué determina realmente la dirección del pago de funding de un futuro perpetuo?",
      options: [
        {
          text: "Cuánto se ha desviado el precio del perp respecto al precio spot subyacente — los largos pagan a los cortos cuando el perp cotiza por encima del spot, y los cortos pagan a los largos cuando cotiza por debajo.",
          explanation:
            "Correcto. El funding es el mecanismo que devuelve el precio de un perp que nunca vence hacia el spot, pagado directamente entre el lado abarrotado y el otro lado del mercado.",
        },
        {
          text: "El exchange decide la dirección del funding según cuántos ingresos por comisiones quiera cobrar ese período.",
          explanation:
            "Falso. El funding es una transferencia entre traders, no una comisión que cobre el exchange — su dirección la determina cómo se compara el precio del perp con el spot, no objetivos de ingresos del exchange.",
        },
        {
          text: "El funding siempre fluye de los cortos a los largos, sin importar el precio, como compensación por el riesgo de estar corto.",
          explanation:
            "Falso. La dirección del funding no es fija — se invierte según si el perp cotiza por encima o por debajo del precio spot subyacente en ese momento.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c40-q5",
      prompt: "Un patrón en los datos de precios muestra un edge promedio de 12 puntos básicos por operación al precio medio. ¿Por qué ese mismo patrón podría de todos modos perder dinero en la práctica?",
      options: [
        {
          text: "Porque el spread, el slippage y las comisiones se cobran en cada operación independientemente de si el patrón subyacente es real, y si esos costes superan el edge, la estrategia resulta perdedora neta aunque el patrón al precio medio sea genuino.",
          explanation:
            "Correcto. Un edge estadístico fino solo es beneficio real una vez restados los costes de ejecución realistas — el mismo patrón puede ser rentable en una plataforma barata y perdedor en una cara.",
        },
        {
          text: "Porque un edge genuino al precio medio siempre se realiza por completo sin importar los costes de trading — los costes solo importan para edges que nunca fueron reales.",
          explanation:
            "Falso. Incluso un patrón genuino al precio medio puede quedar totalmente borrado por los costes de ejecución; el tamaño del edge real y operable siempre es el edge al precio medio menos el spread, el slippage y las comisiones realistas.",
        },
        {
          text: "Porque los edges al precio medio son un mito y ningún patrón medido así es nunca operable.",
          explanation:
            "Falso. Los patrones al precio medio pueden ser genuinamente predictivos — el punto es que su rentabilidad real al operarlos depende por completo de los costes de ejecución de la plataforma y el tamaño de operación utilizados.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
