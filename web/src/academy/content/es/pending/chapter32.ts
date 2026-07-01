// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// ADVANCED chapter on liquidity pools and yield: how AMM pools work and pay, the
// hidden risk of impermanent loss, yield farming, Stellar's 0.30% pool fee and
// who receives it, and when providing liquidity beats a plain one-off trade.
// This chapter owns no new glossary terms; it reuses terms taught earlier.
import type { Chapter } from "../../../types";

export const chapter32: Chapter & { whoFor: string } = {
  id: "c32",
  number: 32,
  level: "ADVANCED",
  whoFor: "Para operadores que sopesan el rendimiento de un pool frente a su riesgo oculto",
  title: "Pools de liquidez y rendimiento",
  description:
    "Cómo funcionan y pagan los pools, la pérdida impermanente, el yield farming, la comisión del 0,30 % del AMM de Stellar y cuándo un pool supera a una operación simple.",
  lessons: [
    {
      id: "c32-l1",
      title: "¿Qué es un pool de liquidez y cómo se gana con él?",
      paragraphs: [
        "Un pool de liquidez es una reserva compartida en la cadena, formada por dos activos, contra la que los operadores intercambian de forma automática, sin libro de órdenes y sin necesidad de encontrar una contraparte. En Stellar depositas ambos lados de un par —por ejemplo XLM y USDC— en igual valor y, a cambio, recibes participaciones del pool que representan tu porción de las reservas. Como un token no nativo como USDC necesita primero una trustline, ya debes estar configurado para tener ambos activos antes de depositar.",
        "Ganas porque cada intercambio que pasa por el pool paga una comisión del 0,30 %, y esa comisión se reincorpora directamente a las reservas. Por lo tanto, tus participaciones del pool reclaman con el tiempo una cantidad creciente de los activos subyacentes: cuanto más se use tu pool, más valdrán tus participaciones cuando finalmente retires. No hay una tasa de interés fija; tu rendimiento es simplemente tu porción proporcional de las comisiones de trading que recauda el pool.",
        "El capítulo sobre funciones avanzadas de Stellar compara en profundidad los pools AMM con el libro de órdenes del SDEX. En resumen, el libro de órdenes te permite fijar un precio límite exacto y esperar a que se produzca una coincidencia, mientras que un AMM fija el precio de cada intercambio a partir de una fórmula aplicada a las reservas actuales y siempre se ejecuta al instante. Aportar liquidez es la imagen invertida de operar: en lugar de tomar un precio, tú suministras el inventario contra el que otros operan y cobras comisiones por hacerlo.",
      ],
      example:
        "Depositas 100 USDC y un valor equivalente de XLM en un pool XLM/USDC que mantiene reservas por un total equivalente a 10.000 USDC. Tus participaciones representan el 1 % del pool. A lo largo de una semana, el pool procesa 50.000 USDC de volumen de intercambios y recauda 150 USDC en comisiones (0,30 %). Tu participación del 1 % gana aproximadamente el equivalente a 1,50 USDC de eso, que se va capitalizando en silencio dentro de tus reservas sin que coloques una sola orden.",
    },
    {
      id: "c32-l2",
      title: "¿Qué es la pérdida impermanente y por qué es un riesgo oculto?",
      paragraphs: [
        "La pérdida impermanente es la diferencia entre lo que valdrían tus activos depositados si simplemente los hubieras conservado y lo que valen después de haber permanecido en el pool mientras sus precios divergían. Un AMM reequilibra automáticamente tus dos activos para mantener sus valores iguales: a medida que uno de los activos sube, el pool vende parte de él y compra más del que baja. Eso es lo contrario de lo que quiere quien conserva sus activos, porque acabas teniendo menos del ganador y más del perdedor.",
        "La pérdida se llama impermanente porque solo se cristaliza cuando retiras. Si los dos precios vuelven a su proporción original, la diferencia se cierra y te quedas con tus comisiones limpias. Pero si la divergencia es permanente, la pérdida también lo es. Es fundamental entender que la pérdida impermanente es mayor en pares volátiles y no correlacionados, y menor en pares que se mueven a la par, razón por la cual los pools de stablecoin contra stablecoin son relativamente seguros.",
        "Este es el riesgo oculto porque el saldo del pool puede parecer saludable mientras, en silencio, estás peor que quien simplemente conservó sus activos. La pregunta real siempre es si las comisiones que cobraste superan la pérdida impermanente que sufriste. Si el par apenas se movió y el volumen fue alto, ganan las comisiones; si un activo se duplicó mientras el otro se mantuvo plano, la pérdida impermanente puede engullir con facilidad una semana de comisiones.",
      ],
      example:
        "Depositas 100 USDC y 1.000 XLM cuando XLM vale 0,10 USDC: una posición equilibrada de 200 USDC. Luego XLM se duplica hasta 0,20 USDC. El AMM ha estado vendiendo XLM durante toda la subida, así que retiras alrededor de 707 XLM y 141 USDC, con un valor aproximado de 283 USDC. Si simplemente hubieras conservado, tus 100 USDC más 1.000 XLM (ahora 200 USDC) sumarían 300 USDC. Esa diferencia de 17 USDC es pérdida impermanente; si tus ingresos por comisiones en ese periodo fueron inferiores a 17 USDC, saliste perdiendo.",
    },
    {
      id: "c32-l3",
      title: "¿Qué es el yield farming?",
      paragraphs: [
        "El yield farming es la práctica de mover activamente tu liquidez entre pools y protocolos para perseguir el mayor rendimiento. En lugar de aparcar los activos en un solo pool y olvidarse de ellos, el farmer busca los pools con la mejor combinación de ingresos por comisiones y cualquier recompensa de incentivo adicional, y luego reasigna a medida que esas oportunidades cambian. En la plataforma de contratos inteligentes Soroban de Stellar, protocolos DeFi como Blend, DeFindex y Soroswap añaden rendimientos de préstamos y tokens de recompensa por encima de las comisiones simples del AMM.",
        "El atractivo está en que los rendimientos anunciados pueden parecer mucho más altos que una simple porción de comisiones, porque a veces los protocolos reparten sus propios tokens para atraer liquidez. La trampa es que esas cifras anunciadas rara vez son el rendimiento real. Suelen ignorar la pérdida impermanente, el riesgo de precio de cualquier token de recompensa con el que te paguen, y el hecho de que los rendimientos altos tienden a decaer rápido una vez que la liquidez inunda el pool.",
        "El farming apila riesgos en lugar de eliminarlos: fallos en los contratos inteligentes, pools con poca liquidez, tokens de recompensa que se desploman y el coste puro de reequilibrar con frecuencia. Es una actividad avanzada y de gestión activa, no un ingreso pasivo, y los rendimientos nunca están garantizados. Nada de esto es asesoramiento financiero: trata cada rendimiento anunciado como una pregunta de partida, no como una promesa, y dimensiona las posiciones según lo que puedas permitirte perder.",
      ],
      example:
        "Un nuevo pool de Soroswap anuncia un rendimiento anualizado del 40 %, pagado en su mayoría con su propio token de recompensa. Un farmer traslada su liquidez, pero dos semanas después una ola de nuevos depositantes diluye la recompensa, el token de incentivo cae un 30 % y el movimiento de XLM frente a USDC ha añadido pérdida impermanente. El titular del 40 % se convierte en silencio en un rendimiento real de un solo dígito bajo, antes de contar las comisiones gastadas en entrar y salir.",
    },
    {
      id: "c32-l4",
      title: "¿Cómo funcionan las comisiones del AMM en Stellar (0,30 %) y quién las recibe?",
      paragraphs: [
        "Cada intercambio enrutado a través de un pool de liquidez de Stellar paga una comisión de pool fija del 0,30 %, que se toma del importe de entrada antes de que se ejecute la fórmula de precios. Esto es independiente de la diminuta comisión de red de alrededor de 0,00001 XLM que paga cada transacción de Stellar, y también independiente de la pequeña reserva mínima de XLM que conserva cada cuenta. El 0,30 % es el coste que asume quien intercambia por usar el pool, y nunca sale del pool.",
        "La comisión no la cobra Stellar, ni Atrium, ni ningún operador central. Se añade directamente a las reservas del pool, lo que eleva el valor de cada participación del pool en circulación. Eso significa que la reciben los proveedores de liquidez, de forma proporcional: si posees el 5 % de las participaciones, ganas efectivamente el 5 % de cada comisión que recauda el pool. Solo la materializas cuando retiras y descubres que tus participaciones ahora se canjean por más activos de los que aportaste.",
        "Como la comisión escala con el volumen, el rendimiento real de un pool para los proveedores depende mucho más de cuánto trading fluye a través de él que de su tamaño. Un pool pequeño y con mucha actividad puede ganar más que uno grande e inactivo. Cuando intercambias en la pestaña de Trading manual de Atrium, un pago por ruta puede enrutarse a través de uno de estos pools, y el 0,30 % está incorporado en el precio efectivo que ves junto a tu tolerancia de slippage.",
      ],
      example:
        "Un pool mantiene reservas equivalentes a 200.000 USDC y realiza 400.000 USDC de volumen de intercambios en un mes, recaudando 1.200 USDC en comisiones (0,30 %). Esas comisiones se suman a las reservas, así que el pool ahora respalda las mismas participaciones con activos equivalentes a 201.200 USDC. Un proveedor que posee el 5 % de las participaciones ve crecer su posición en unos 60 USDC —su porción proporcional—, pagaderos cuando retire.",
    },
    {
      id: "c32-l5",
      title: "¿Cuándo es un pool de liquidez más atractivo que una operación normal?",
      paragraphs: [
        "Una operación normal es una apuesta direccional puntual: compras o vendes en el SDEX o mediante un intercambio en un AMM, tomas un precio y ya está. Aportar liquidez es la postura opuesta: eres neutral respecto a la dirección y, en su lugar, alquilas tu inventario para ganar un flujo de comisiones. El capítulo sobre funciones avanzadas de Stellar explica en qué se diferencian la fijación de precios del AMM y la coincidencia del libro de órdenes; la decisión aquí no es qué mercado fija mejor el precio, sino si quieres operar o que operen contra ti.",
        "Un pool se vuelve atractivo cuando esperas tener ambos activos de todos modos, cuando el par es relativamente estable o está muy correlacionado, y cuando el volumen de trading es lo bastante alto como para que las comisiones superen cómodamente la pérdida impermanente. Los pares de stablecoins son el caso clásico: divergencia diminuta, así que casi ninguna pérdida impermanente, mientras que un volumen de intercambios constante mantiene el flujo de comisiones. En ese escenario, tus activos ganan mientras están quietos, algo que una operación simple nunca puede lograr.",
        "Una operación normal gana cuando tienes una visión direccional real, cuando el par es volátil y no está correlacionado, de modo que la pérdida impermanente mordería, o cuando necesitas salir de forma limpia a un precio elegido, que es exactamente lo que te da una orden límite en el SDEX. La disyuntiva central siempre es rendimiento frente a pérdida impermanente: un pool te paga por mantenerte neutral, y solo deberías aceptar ese pago cuando las comisiones esperadas superen el lastre de la divergencia.",
      ],
      example:
        "Tienes USDC y una segunda stablecoin al estilo de Circle y no tienes una visión clara sobre ninguna. Cambiar una por la otra una sola vez no te reporta nada más allá del diferencial. Depositar ambas en un pool estable, en cambio, les permite ganar la comisión del 0,30 % en cada intercambio que pasa por él, con una pérdida impermanente cercana a cero porque los dos precios apenas se mueven. Aquí el pool supera claramente a la operación puntual. Cambia ese par estable por un pool volátil de XLM/token-nuevo y las cuentas pueden inclinarse en sentido contrario.",
    },
  ],
  quiz: [
    {
      id: "c32-q1",
      prompt: "Depositas XLM y USDC en un pool de liquidez de Stellar. ¿De dónde proviene realmente tu rendimiento?",
      options: [
        {
          text: "De una tasa de interés fija que paga Atrium por bloquear tus activos.",
          explanation:
            "No. Atrium no paga intereses ni custodia las comisiones del pool. El rendimiento del pool es variable y proviene de la actividad de trading, no de una tasa prometida.",
        },
        {
          text: "De tu porción proporcional de la comisión del 0,30 % que cada intercambio a través del pool paga a las reservas.",
          explanation:
            "Correcto. Cada intercambio añade una comisión del 0,30 % a las reservas del pool, por lo que tus participaciones del pool se canjean por más activos con el tiempo. Tu rendimiento es simplemente tu porción de ese flujo de comisiones.",
        },
        {
          text: "De la diminuta comisión de red de ~0,00001 XLM que Stellar cobra en cada transacción.",
          explanation:
            "Incorrecto. La comisión de red es un coste de protocolo aparte y no fluye hacia los proveedores de liquidez. El rendimiento del proveedor proviene de la comisión de pool del 0,30 %, no de la comisión de red.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q2",
      prompt: "¿Qué situación produce la MAYOR pérdida impermanente para un proveedor de liquidez?",
      options: [
        {
          text: "Un pool de dos stablecoins cuyos precios se mantienen dentro de una fracción de punto porcentual entre sí.",
          explanation:
            "No. Con precios correlacionados y casi idénticos apenas hay divergencia, así que la pérdida impermanente es mínima. Por esa razón, este es el tipo de pool más seguro.",
        },
        {
          text: "Un par volátil y no correlacionado en el que un activo se duplica mientras el otro se mantiene plano.",
          explanation:
            "Correcto. La pérdida impermanente crece con la divergencia entre los dos activos. Un gran movimiento unilateral es el peor caso, porque el AMM vendió al ganador durante toda la subida.",
        },
        {
          text: "Un pool cuyos dos activos suben exactamente en el mismo porcentaje.",
          explanation:
            "Incorrecto. Si ambos activos se mueven a la par, su proporción no cambia, así que prácticamente no hay pérdida impermanente: lo que la causa es la divergencia, no la dirección.",
        },
        {
          text: "Un pool con un volumen de intercambios muy alto pero una proporción de precios estable.",
          explanation:
            "Incorrecto. Un volumen alto significa más comisiones, y una proporción estable significa poca divergencia: ese es un pool favorable, no una fuente de gran pérdida impermanente.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q3",
      prompt: "Un nuevo pool de Soroban anuncia un rendimiento anualizado del 40 %, pagado en su mayoría con su propio token de recompensa. ¿Qué debería suponer un operador avanzado?",
      options: [
        {
          text: "Que el 40 % es un rendimiento fiable y garantizado que conservarás.",
          explanation:
            "No. Los rendimientos anunciados del farming rara vez son el rendimiento real y nunca están garantizados. Suelen ignorar la pérdida impermanente y el riesgo de precio del token de recompensa.",
        },
        {
          text: "Que el titular ignora la pérdida impermanente, el riesgo de precio del token de recompensa y el decaimiento del rendimiento, así que el rendimiento real probablemente sea mucho menor.",
          explanation:
            "Correcto. El yield farming apila riesgos: dilución a medida que la liquidez inunda el pool, un token de recompensa que puede caer, pérdida impermanente y costes de reequilibrio. Trata la cifra como una pregunta, no como una promesa.",
        },
        {
          text: "Que los tokens de recompensa no conllevan riesgo de precio porque los emitió un protocolo.",
          explanation:
            "Incorrecto. El propio token de un protocolo puede caer con fuerza, y los tokens de incentivo a menudo lo hacen una vez que las emisiones diluyen. Que lo emita un protocolo no ofrece ninguna protección de precio.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c32-q4",
      prompt: "En Stellar, ¿quién recibe en última instancia la comisión de pool del 0,30 % pagada en un intercambio?",
      options: [
        {
          text: "Atrium, como la aplicación que enrutó el intercambio.",
          explanation:
            "No. Atrium no cobra las comisiones del pool. El 0,30 % nunca sale del pool y va a parar a las personas que aportaron la liquidez.",
        },
        {
          text: "Los validadores de la red Stellar, junto con la comisión de red base.",
          explanation:
            "Incorrecto. A los validadores se les compensa con la comisión de red aparte de ~0,00001 XLM, no con la comisión de pool del 0,30 %, que permanece en el pool.",
        },
        {
          text: "Los proveedores de liquidez, de forma proporcional, mediante reservas que se reincorporan directamente al pool.",
          explanation:
            "Correcto. La comisión se añade a las reservas del pool, elevando el valor de cada participación. Los proveedores materializan su porción proporcional cuando retiran más activos de los que depositaron.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c32-q5",
      prompt: "¿Cuándo es aportar liquidez claramente más atractivo que hacer una operación puntual en el SDEX?",
      options: [
        {
          text: "Cuando tienes una visión direccional fuerte y quieres salir a un precio exacto.",
          explanation:
            "No. Ese es precisamente el caso en el que gana una operación normal: una orden límite en el SDEX te permite fijar tu precio de salida. Un pool te mantiene neutral, lo que va en contra de una visión direccional.",
        },
        {
          text: "Cuando tendrías ambos activos de todos modos, el par es estable o está correlacionado, y el volumen es lo bastante alto como para que las comisiones superen la pérdida impermanente.",
          explanation:
            "Correcto. Postura neutral, más baja divergencia, más volumen constante es el punto ideal: tus activos ganan la comisión del 0,30 % mientras están quietos, algo que una operación puntual nunca puede lograr.",
        },
        {
          text: "Cuando el par es muy volátil y no está correlacionado, de modo que los precios oscilan mucho.",
          explanation:
            "Incorrecto. Una gran divergencia maximiza la pérdida impermanente, que puede engullir tus comisiones. Un par volátil y no correlacionado favorece una operación direccional, no aportar liquidez.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
