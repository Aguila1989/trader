// PENDING — do not activate until green light.
// Arbitraje y eficiencia del mercado (EXPERTO): qué es el arbitraje, cómo los pagos
// por ruta de Stellar permiten capturar de forma atómica las diferencias de precio,
// por qué los arbitrajistas estrechan los diferenciales y aportan liquidez, si el MEV
// existe en Stellar y cómo todo ello moldea los precios del SDEX y de los AMM contra
// los que operas en la aplicación. No posee términos de glosario nuevos; reutiliza el
// vocabulario enseñado en capítulos anteriores. Escrito con la misma forma exacta que
// content/en/pending/chapter22.ts, con la frase `whoFor` por capítulo tipada mediante
// una intersección local para que la interfaz Chapter activa quede intacta.
import type { Chapter } from "../../../types";

export const chapter35: Chapter & { whoFor: string } = {
  id: "c35",
  number: 35,
  level: "EXPERT",
  whoFor: "Para operadores que quieren entender las fuerzas que mantienen honestos los precios",
  title: "Arbitraje y eficiencia del mercado",
  description:
    "Qué es el arbitraje, cómo los pagos por ruta de Stellar le permiten capturar diferencias de precio de forma atómica, por qué los arbitrajistas hacen que los mercados sean más eficientes, si el MEV existe en Stellar y cómo todo ello moldea los precios que ves en esta aplicación.",
  lessons: [
    {
      id: "c35-l1",
      title: "¿Qué es el arbitraje?",
      paragraphs: [
        "El arbitraje es el acto de comprar un activo donde está barato y vender el activo idéntico donde está caro, capturando la diferencia como ganancia. Piensa en un operador que se da cuenta de que cierta marca de café cuesta 2 USDC en un supermercado de descuento y 3 USDC en una tienda de comestibles premium al otro lado de la calle. Si puede comprar en la tienda barata y venderlo de inmediato a la cara, se embolsa 1 USDC por bolsa sin tener ninguna opinión sobre si el café es una buena inversión a largo plazo. No está apostando a que el precio suba o baje; está cosechando la diferencia entre dos precios de lo mismo en el mismo momento.",
        "En las criptomonedas se aplica la misma lógica entre distintos lugares de negociación. El mismísimo activo —digamos XLM cotizado en USDC— puede negociarse a tasas ligeramente distintas en el libro de órdenes del SDEX, dentro de un pool de liquidez de un AMM y en un exchange centralizado de otro lugar. Cada vez que esos precios cotizados se separan, se abre una diferencia de precio, y capturarla es arbitraje. El rasgo que lo define es que ambas patas hacen referencia al mismo valor subyacente, así que la ganancia no depende de que el mercado se mueva a tu favor; depende solo de que la discrepancia exista el tiempo suficiente para operar contra ella.",
        "Dos propiedades hacen que el arbitraje real sea difícil. Primero, las diferencias suelen ser diminutas, a menudo una fracción de un por ciento, porque todos las cazan; la ganancia por unidad es pequeña y solo vale la pena con volumen o con velocidad. Segundo, las dos patas deben ser lo más simultáneas posible: si compras barato pero el lugar caro se mueve antes de que vendas, la diferencia puede desvanecerse o invertirse, y tu operación sin riesgo se convierte en una simple apuesta direccional. Por eso la mecánica de la ejecución —el tiempo de liquidación, las comisiones y la atomicidad— importa tanto como detectar la diferencia. Este es material educativo, no asesoramiento financiero.",
      ],
      example:
        "Supongamos que un pool de un AMM cotiza XLM a 0,1200 USDC mientras que el libro de órdenes del SDEX tiene ofertas de compra en reposo a 0,1210 USDC. Un arbitrajista compra XLM del pool a 0,1200 y lo vende a la oferta del SDEX a 0,1210, obteniendo 0,0010 USDC por XLM antes de comisiones. En una operación de 10.000 XLM eso son 10 USDC de margen bruto: fino, pero repetible y neutral en dirección, porque la ganancia vino de la diferencia de 0,0010, no de ninguna opinión sobre hacia dónde va XLM.",
    },
    {
      id: "c35-l2",
      title: "¿Cómo funciona el arbitraje en Stellar mediante los pagos por ruta?",
      paragraphs: [
        "Stellar tiene una función nativa casi hecha a medida para el arbitraje: el pago por ruta. Como se presentó en el capítulo de Funciones avanzadas de Stellar, un pago por ruta convierte un activo en otro saltando por una cadena de mercados en una sola operación —por ejemplo, XLM a USDC a yXLM y de vuelta a XLM—, cubriendo cada salto contra los mejores libros de órdenes del SDEX y pools de liquidez de AMM disponibles a lo largo de la ruta. Toda la ruta o se completa como una unidad o falla y revierte; no hay ningún estado en el que quedes a medio convertir. Esa propiedad de todo-o-nada se llama atomicidad, y es exactamente lo que un arbitrajista necesita para eliminar el riesgo de pata descrito antes.",
        "Para el arbitraje, la variante poderosa es un pago por ruta que empieza y termina en el mismo activo. Envías, digamos, 1.000 XLM a través de una ruta que toca varios mercados y especificas que debes recibir al menos 1.001 XLM de vuelta; si los precios de mercado alrededor del bucle no suman una ganancia, la operación simplemente falla y solo has perdido la comisión de red trivial (~0,00001 XLM). El protocolo de Stellar incluso buscará una ruta favorable entre los libros de órdenes y pools que conoce. Como todo el bucle se liquida en un solo cierre de ledger, la diferencia de precio que detectaste no puede moverse en tu contra entre patas: la clásica pesadilla del arbitrajista de que la segunda pata se le escape es estructuralmente imposible.",
        "El mecanismo es una conversión circular: el dinero sale en un activo, rebota por libros de órdenes intermedios y pools de AMM del 0,30 %, y regresa en el mismo activo con un excedente neto. El operador especifica un mínimo recibido estricto (por debajo, una restricción de sendMax y de importe de destino), de modo que el ledger hace cumplir el umbral de rentabilidad. La competencia es feroz y los márgenes se cierran rápido, así que un arbitraje exitoso en Stellar consiste en gran medida en detectar discrepancias fugaces entre lugares de negociación más rápido que los rivales y expresarlas como una única ruta atómica antes de que se cierre el siguiente ledger.",
      ],
      example:
        "Un bot de arbitraje vigila Horizon y detecta que el pool XLM/USDC de un AMM está momentáneamente barato en relación con los libros de órdenes yXLM/USDC y yXLM/XLM. Envía un solo pago por ruta: enviar 1.000 XLM, encaminar XLM a USDC (pool), USDC a yXLM (libro de órdenes), yXLM a XLM (libro de órdenes), mínimo de destino 1.000,6 XLM. Si cada salto se cubre a las tasas esperadas, el bucle devuelve más XLM del que envió y el bot conserva el excedente; si algún salto ya se movió, la comprobación del mínimo de destino falla, toda la operación revierte y solo se gasta la diminuta comisión base.",
    },
    {
      id: "c35-l3",
      title: "¿Qué hacen los arbitrajistas por el mercado? ¿Por qué son útiles?",
      paragraphs: [
        "Aunque los arbitrajistas actúan puramente por su propio beneficio, el efecto secundario de su actividad es un mercado más honesto y más utilizable para todos los demás. Cada vez que un arbitrajista compra en el lugar barato y vende en el caro, empuja el precio barato hacia arriba y el caro hacia abajo. Repetido a lo largo de miles de operaciones diminutas, esto arrastra el precio del mismo activo hasta una alineación casi perfecta dondequiera que se negocie. Sin ellos, el SDEX, los pools de los AMM y los exchanges externos discreparían de forma habitual, y un operador ingenuo podría negociar sin saberlo a una tasa obsoleta y fuera de mercado.",
        "Este trabajo de alineación de precios también estrecha los diferenciales y añade liquidez efectiva. Un arbitrajista que está listo para comprar cualquier pool que caiga por debajo del valor justo y vender cualquier libro que se dispare por encima está, en la práctica, aportando profundidad: su disposición a operar la diferencia significa que las órdenes grandes mueven menos el precio, porque siempre hay alguien apoyándose contra el error de valoración. El diferencial entre compra y venta —la distancia entre la mejor compra y la mejor venta— se estrecha porque el arbitraje elimina la ganancia fácil de una diferencia amplia, y un diferencial más estrecho es un ahorro de costes directo para los operadores corrientes.",
        "El nombre económico del estado final hacia el que empujan es eficiencia del mercado: un mercado donde los precios reflejan con rapidez toda la información disponible y donde las oportunidades de ganancia obvias y sin riesgo se compiten hasta desaparecer casi tan rápido como aparecen. Ningún mercado es perfectamente eficiente, y siempre existen diferencias fugaces, pero el arbitraje es el mecanismo que mantiene pequeña la imperfección. Cuanto más sano y disputado sea el arbitraje, más pequeños y efímeros serán los errores de valoración, y por eso los pares profundos y líquidos permanecen anclados al valor justo mientras que los tokens finos y desatendidos pueden desviarse mucho más antes de que alguien se moleste en corregirlos. En este sentido, los arbitrajistas son los conserjes no remunerados del sistema de precios —interesados en sí mismos, pero manteniendo coherente y con precios justos el lugar del que dependes—, y su ausencia es en sí misma una señal de alerta de que un mercado es ilíquido o difícil de operar.",
      ],
      example:
        "Imagina que el pool XLM/USDC de un AMM se hunde hasta 0,1180 USDC mientras que todos los libros de órdenes y los exchanges externos aún negocian cerca de 0,1210. Los arbitrajistas vuelcan órdenes de compra en el pool barato, elevándolo, y venden el XLM adquirido en los libros más altos, presionándolos a la baja, hasta que el pool vuelve a converger a aproximadamente 0,1205: dentro de una fracción de un por ciento respecto de todos los demás lugares. Un operador que abriera la aplicación a mitad del episodio y simplemente tomara el precio del pool habría pagado de más al vender; la corrección de los arbitrajistas es lo que protege al siguiente operador de esa cotización obsoleta.",
    },
    {
      id: "c35-l4",
      title: "¿Qué es el MEV (valor máximo extraíble) y existe en Stellar?",
      paragraphs: [
        "El MEV, o valor máximo extraíble (Maximal Extractable Value), es la ganancia que quien controla el ordenamiento de las transacciones en un bloque puede extraer insertando, reordenando o censurando transacciones. En muchas blockchains, los productores de bloques (o los buscadores que pujan ante ellos) pueden ver una transacción pendiente en el mempool público y actuar sobre ella: front-running (adelantarse a una compra conocida para lucrarse con el impacto en el precio), back-running (situarse justo detrás para capturar la diferencia resultante) o el ataque sándwich (comprar justo antes y vender justo después de la orden grande de una víctima). Ese valor se extrae a costa de los usuarios corrientes, que reciben ejecuciones peores de las que el mercado les daría de otro modo.",
        "La arquitectura de Stellar hace que el MEV clásico sea materialmente más difícil que en una cadena típica de prueba de trabajo o prueba de participación con un único líder. El consenso se alcanza mediante el Protocolo de Consenso de Stellar (SCP), un Acuerdo Bizantino Federado en el que los nodos se ponen de acuerdo sobre un conjunto de transacciones a través de conjuntos de quórum solapados, en lugar de que un solo minero elija unilateralmente el orden del bloque. Los ledgers se cierran rápido (unos pocos segundos) y no hay una lucrativa subasta de precio del gas: las transacciones llevan una comisión diminuta y bastante plana, y cuando un ledger supera su capacidad, Stellar usa un precio de sobrecarga con selección aleatoria entre transacciones de la misma comisión, en lugar de un ordenamiento estricto en el que gana la puja más alta. No existe un mempool público de larga duración que un buscador pueda explotar como se explota el de Ethereum, lo que elimina buena parte de la superficie de front-running.",
        "Aun así, el MEV está limitado en Stellar, no eliminado. Cualquiera que observe Horizon todavía puede ver las transacciones difundidas y competir por enviar un pago por ruta rival dentro del mismo ledger; el desempate determinista dentro de un conjunto de transacciones puede estudiarse y explotarse al margen; y la llegada de los contratos inteligentes de Soroban (con protocolos DeFi como Blend, Soroswap y DeFindex) reintroduce un estado más rico y componible donde el ordenamiento puede importar más, así que la superficie extraíble crece a medida que crece el DeFi en cadena. El resumen honesto es que el modelo de comisiones de Stellar y su ordenamiento basado en SCP y guiado por quórum atenúan los patrones de MEV más depredadores vistos en otros lugares, pero cualquier ledger público con liquidez compartida deja algo de valor de ordenamiento sobre la mesa.",
      ],
      example:
        "En una cadena guiada por mempool, un buscador que ve tu compra grande de XLM pendiente puede hacerle un sándwich: comprar justo antes que tú para empujar el precio hacia arriba, dejar que tu orden se ejecute a la tasa inflada y luego vender justo después; tú obtienes una peor ejecución y él se embolsa la diferencia. En Stellar, ese mismo buscador no tiene un mempool público persistente del que hacer francotirador, los ledgers se cierran en segundos y las transacciones de la misma comisión se seleccionan sin una pura subasta a la puja más alta, así que ese sándwich limpio es mucho más difícil de lograr; pero un bot veloz que compite por meter un pago por ruta rival en el mismísimo siguiente cierre de ledger sigue siendo una forma real, aunque más estrecha, de extracción.",
    },
    {
      id: "c35-l5",
      title: "¿Cómo afecta el arbitraje a los precios que ves en esta aplicación?",
      paragraphs: [
        "Cada precio que esta aplicación te muestra proviene, aguas abajo, del arbitraje. Cuando la pestaña de Trading manual cotiza una tasa de TÚ VENDES / TÚ COMPRAS, o la página de detalle de un token dibuja velas con pestañas de hora, día, semana y año, esas cifras vienen de libros de órdenes del SDEX y pools de AMM en vivo que los arbitrajistas vigilan continuamente. Como mantienen el precio del pool, el precio del libro de órdenes y los precios de los exchanges externos estrechamente alineados, la tasa contra la que operas es en efecto una tasa de mercado, en lugar de una obsoleta o manipulada. Te beneficias de su trabajo sin verlo suceder jamás.",
        "Esto también significa que la aplicación rara vez te ofrece un precio sospechosamente bueno, y eso es una característica, no una decepción. Si el SDEX o el pool de un AMM mostraran brevemente XLM muy por debajo de su valor en todos los demás lugares, los arbitrajistas ya habrían operado esa diferencia hasta hacerla desaparecer —normalmente en uno o dos ledgers— antes de que tu orden pudiera alcanzarla. En la práctica, esto te dice que cuando fijas una orden limitada o una tolerancia de deslizamiento editable en una orden de mercado, deberías tomar como referencia el precio eficiente vigente, porque intentar ejecutar de forma significativamente mejor que el mercado alineado es intentar ganarle la carrera a los mismos bots que borraron la diferencia. Cuando el analista de IA propone una operación con una puntuación de confianza, sus ejecuciones esperadas asumen este mismo precio competitivo y estrechado por el arbitraje.",
        "Hay una otra cara que conviene interiorizar. El arbitraje estrecha los diferenciales y alinea los lugares de negociación, pero no elimina los costes incorporados en una operación: la comisión del 0,30 % del pool de un AMM, el diferencial del libro de órdenes en pares finos, las comisiones de red y tu propia tolerancia de deslizamiento siguen aplicándose todas, y en tokens de baja liquidez el precio alineado aún puede estar muy lejos de donde realmente podrías salir con volumen. Eficiente no significa gratis ni infinitamente profundo. Leer el precio de la aplicación como una instantánea justa, mantenida por el arbitraje —respetando al mismo tiempo las comisiones, la profundidad y el deslizamiento— es el modelo mental realista. Nada de esto es asesoramiento de inversión; es una descripción de cómo se comporta la fontanería detrás de tus cotizaciones.",
      ],
      example:
        "Abres la página de detalle de un token para un par líquido y ves XLM a 0,1207 USDC tanto en el gráfico como en el formulario de TÚ VENDES. Esa coincidencia no es suerte: los bots de arbitraje ya han reconciliado el pool del AMM, el libro del SDEX y los lugares externos hasta dentro de una fracción de un por ciento, así que la aplicación solo puede mostrarte la tasa de mercado real. Si entonces fijas una venta limitada a 0,1240 con la esperanza de superar al mercado, puede que simplemente nunca se ejecute: estarías pidiendo vender por encima del precio que los arbitrajistas han anclado como justo, y la misma competencia que estrechó el diferencial es lo que impide que esa ejecución optimista ocurra.",
    },
  ],
  quiz: [
    {
      id: "c35-q1",
      prompt: "¿Qué define con mayor precisión una operación de arbitraje?",
      options: [
        {
          text: "Comprar un activo que esperas que suba de valor en las próximas semanas.",
          explanation:
            "Eso es especulación direccional, no arbitraje. El arbitraje no depende de un movimiento futuro del precio; captura una diferencia que existe entre lugares de negociación ahora mismo para el mismo activo.",
        },
        {
          text: "Mantener un activo durante mucho tiempo para ganar recompensas de red.",
          explanation:
            "Eso describe un ingreso de rendimiento o estilo staking, no arbitraje. El arbitraje consiste en explotar una discrepancia momentánea de precio entre lugares de negociación, no en mantener para obtener recompensas.",
        },
        {
          text: "Comprar el mismo activo donde está barato y venderlo donde está caro esencialmente en el mismo momento, capturando la diferencia de precio.",
          explanation:
            "Correcto. El arbitraje cosecha una diferencia de precio del activo idéntico entre lugares de negociación, con patas casi simultáneas, de modo que la ganancia es neutral en dirección y no una apuesta sobre hacia dónde va el mercado.",
        },
        {
          text: "Comprar deliberadamente en la cima de un repunte de precio porque el impulso es fuerte.",
          explanation:
            "Eso es perseguir el impulso y conlleva todo el riesgo direccional. El arbitraje es lo contrario: busca una diferencia con el riesgo minimizado entre dos precios de lo mismo, no una entrada direccional.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q2",
      prompt: "¿Por qué un pago por ruta de Stellar que empieza y termina en el mismo activo es una herramienta tan natural para el arbitraje?",
      options: [
        {
          text: "Porque te permite convertir un activo sin pagar jamás ninguna comisión de red.",
          explanation:
            "Incorrecto. Un pago por ruta sigue pagando la diminuta comisión de red base (~0,00001 XLM). Su valor para el arbitraje es la conversión atómica de múltiples saltos, no evitar comisiones.",
        },
        {
          text: "Porque salta por varios libros de órdenes y pools en una sola operación atómica, así que si el bucle no es rentable revierte y solo pierdes la comisión trivial.",
          explanation:
            "Correcto. El bucle de todo-o-nada, con un mínimo recibido estricto, significa que la diferencia de precio no puede escaparse entre patas: la atomicidad elimina el riesgo de pata que aqueja al arbitraje manual.",
        },
        {
          text: "Porque garantiza que el precio se moverá a tu favor después de que lo envíes.",
          explanation:
            "Incorrecto. Nada garantiza un movimiento favorable. El punto es precisamente que un pago por ruta al mismo activo no necesita uno: o ejecuta el bucle rentable precalculado de forma atómica o revierte.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c35-q3",
      prompt: "¿Qué afirmación capta mejor lo que los arbitrajistas hacen por el mercado en general?",
      options: [
        {
          text: "Alinean el precio del mismo activo entre el SDEX, los pools de los AMM y los exchanges externos, estrechando los diferenciales y añadiendo liquidez efectiva, empujando hacia la eficiencia del mercado.",
          explanation:
            "Correcto. Comprar en los lugares baratos y vender en los caros arrastra los precios hacia la alineación, estrecha los diferenciales entre compra y venta y hace que las órdenes grandes muevan menos el precio, que es exactamente lo que describe la eficiencia del mercado.",
        },
        {
          text: "Amplían los diferenciales y separan los precios de los lugares de negociación, haciendo el mercado menos predecible.",
          explanation:
            "Esto es lo contrario de la realidad. El arbitraje estrecha los diferenciales y junta los precios; es la fuerza correctora contra la divergencia, no su causa.",
        },
        {
          text: "Existen solo para manipular los precios y siempre perjudican a los operadores corrientes.",
          explanation:
            "Incorrecto. Los arbitrajistas actúan por su propio beneficio, pero el efecto secundario son lugares de negociación más coherentes y con precios justos; protegen a los operadores corrientes de cotizaciones obsoletas y fuera de mercado, en lugar de perjudicarlos.",
        },
        {
          text: "Eliminan todos los costes de operación, así que los operadores corrientes no pagan nada por operar.",
          explanation:
            "Incorrecto. El arbitraje estrecha los diferenciales, pero nunca elimina la comisión del 0,30 % del pool de un AMM, el diferencial del libro de órdenes en pares finos, las comisiones de red ni tu propio deslizamiento; eficiente no es lo mismo que gratis.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c35-q4",
      prompt: "¿Cómo afecta el diseño de Stellar al MEV (valor máximo extraíble) en comparación con una cadena típica guiada por mempool?",
      options: [
        {
          text: "Stellar elimina por completo el MEV, así que no es posible ninguna extracción basada en el ordenamiento en absoluto.",
          explanation:
            "Exagerado. Stellar atenúa los peores patrones, pero los observadores aún pueden competir por meter pagos por ruta rivales en el mismo ledger y el DeFi de Soroban hace crecer la superficie extraíble: el MEV está limitado, no eliminado.",
        },
        {
          text: "Stellar tiene más MEV que otras cadenas porque ejecuta una subasta permanente de mempool público como Ethereum.",
          explanation:
            "Incorrecto. Stellar no ejecuta una subasta de mempool por precio del gas al estilo de Ethereum; la ausencia de un mempool público de larga duración es precisamente por lo que el front-running clásico es más difícil ahí.",
        },
        {
          text: "Stellar hace más difícil el MEV clásico —ordenamiento basado en quórum del SCP, ledgers rápidos, sin mempool público de larga duración y selección aleatoria entre transacciones de la misma comisión en lugar de una pura subasta de gas—, pero no lo elimina por completo.",
          explanation:
            "Correcto. El Acuerdo Bizantino Federado del Protocolo de Consenso de Stellar, las comisiones bastante planas con selección aleatoria por precio de sobrecarga y la ausencia de un mempool explotable atenúan el front-running y el sándwich, aunque siempre queda algo de valor de ordenamiento en un ledger público.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c35-q5",
      prompt: "Fijas una venta limitada de XLM bastante por encima del precio que la aplicación muestra actualmente en un par líquido. Dado cómo el arbitraje moldea los precios, ¿qué deberías esperar?",
      options: [
        {
          text: "Se ejecutará casi con certeza al instante, porque el arbitraje garantiza que los precios suban para satisfacer cualquier orden limitada.",
          explanation:
            "Incorrecto. El arbitraje alinea los precios con el valor justo; no los empuja hacia arriba para satisfacer tu orden optimista. Una venta muy por encima del mercado alineado simplemente se queda sin ejecutar.",
        },
        {
          text: "Puede que nunca se ejecute, porque los arbitrajistas ya han anclado el precio cerca del valor justo entre lugares de negociación, así que pedir vender bastante por encima de eso es intentar ganarle la carrera a los mismos bots que cerraron la diferencia.",
          explanation:
            "Correcto. En un par líquido el SDEX, los pools y los exchanges externos están estrechamente alineados por el arbitraje, así que una ejecución significativamente por encima de ese precio eficiente es exactamente lo que el mercado competitivo impide.",
        },
        {
          text: "La aplicación ajustará en secreto el precio de mercado al alza para que tu orden se ejecute a tu objetivo.",
          explanation:
            "Incorrecto. La aplicación muestra precios del SDEX y de los AMM en vivo mantenidos por el arbitraje externo; no mueve ni puede mover el mercado para satisfacer una orden limitada individual.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
