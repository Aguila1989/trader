// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../types";

export const chapter33: Chapter & { whoFor: string } = {
  id: "c33",
  number: 33,
  level: "EXPERT",
  whoFor: "Para las mentes con curiosidad técnica que quieren saber cómo Stellar se pone realmente de acuerdo sobre la verdad",
  title: "Arquitectura blockchain: cómo funciona de verdad",
  description:
    "Cómo una red de desconocidos se pone de acuerdo sobre una única verdad sin un árbitro central: el consenso y el problema del doble gasto, el Stellar Consensus Protocol, los nodos y los conjuntos de quórum, la vida de una transacción y el trilema de la escalabilidad.",
  lessons: [
    {
      id: "c33-l1",
      title: "¿Qué es el consenso y cómo resuelve una blockchain el problema del doble gasto?",
      paragraphs: [
        "El consenso es el proceso mediante el cual muchas computadoras independientes, ninguna de las cuales confía en una autoridad central, se ponen de acuerdo sobre un único historial compartido: qué transacciones ocurrieron, en qué orden y cuáles son los saldos resultantes. Sin acuerdo sobre el orden, una blockchain no es más que un montón de afirmaciones contradictorias. Lo difícil no es almacenar los datos; es lograr que miles de desconocidos con intereses propios converjan en la misma respuesta incluso cuando algunos de ellos fallan o actúan de mala fe.",
        "La amenaza clásica es el doble gasto. El dinero digital no es más que números, y los números se pueden copiar. Si tengo 100 USDC y los envío enteros a Alicia y enteros a Bob en dos transacciones difundidas en el mismo instante, ambas parecen válidas por separado. Un libro de registro fiable debe aceptar exactamente una y rechazar la otra, de modo que un mismo saldo nunca pueda gastarse dos veces. El consenso es precisamente el mecanismo que elige un orden canónico, y una vez que un gasto queda confirmado, el otro se vuelve inválido.",
        "Distintas redes resuelven esto con reglas distintas. La prueba de trabajo (Bitcoin) hace que escribir el historial resulte caro: los mineros queman electricidad compitiendo por encontrar un hash por debajo de un objetivo, y gana la cadena más larga de trabajo acumulado, de modo que reescribir un gasto significa superar en cómputo a toda la red. La prueba de participación (el Ethereum moderno) sustituye la electricidad por dinero en riesgo: los validadores bloquean capital, son elegidos para proponer y atestiguar bloques, y pierden su participación si firman historiales contradictorios. Ambas alcanzan el acuerdo con el tiempo, de forma probabilística, y ambas permiten que cualquiera se una gastando el recurso exigido.",
        "El Stellar Consensus Protocol (SCP) toma un tercer camino. No hay minería ni participación. En lugar de una única regla global que decida quién puede escribir, cada participante declara en qué otros participantes confía, y la red converge a través de esos círculos de confianza que se solapan. Eso lo hace rápido y económico, pero significa que la seguridad descansa en las decisiones de confianza que toman los participantes, en lugar de en energía quemada o capital bloqueado, una contrapartida que las lecciones posteriores desgranan.",
      ],
      example:
        "Imagina el doble gasto de forma concreta: una billetera con 100 USDC firma dos pagos por ruta en el mismo segundo, uno que convierte a XLM para Alicia y otro que convierte a yXLM para Bob, gastando cada uno los 100 completos. Ambos están bien formados por separado. El consenso obliga a la red a serializarlos: la transacción que aterrice primero en un libro cerrado consume el saldo, y la segunda se rechaza en el momento de aplicarse porque los fondos ya no existen. El libro de registro, y no quien envía, decide el orden.",
    },
    {
      id: "c33-l2",
      title: "¿Qué es el Stellar Consensus Protocol y por qué es diferente?",
      paragraphs: [
        "El Stellar Consensus Protocol es una implementación del Acuerdo Bizantino Federado (Federated Byzantine Agreement, FBA). \"Bizantino\" significa que tolera nodos que no solo se caen, sino que además mienten activamente o se comportan mal. \"Federado\" es el matiz que lo distingue: no existe una lista fija y pactada de antemano sobre quiénes son los validadores. Cada nodo elige libremente su propio conjunto de nodos en los que confía, y la pertenencia global a la red emerge de la unión de las decisiones individuales de todos, en lugar de venir impuesta por un registro central.",
        "El bloque de construcción básico es el segmento de quórum. Un segmento de quórum es un grupo de nodos que un nodo concreto considera suficiente para convencerlo de una afirmación. Un nodo aceptará algo como cierto una vez que todos los nodos de uno de sus segmentos estén de acuerdo. Un quórum es un conjunto de nodos que contiene un segmento para cada uno de sus miembros: un grupo que se refuerza a sí mismo y puede alcanzar el acuerdo internamente. Es fundamental que nadie te entregue un quórum; surge de la manera en que se solapan los segmentos. Mientras los segmentos de los nodos honestos se intersecten lo suficiente, toda la red es arrastrada hacia una única decisión, porque no hay forma de que dos grupos disjuntos satisfagan cada uno sus segmentos y confirmen valores contradictorios.",
        "Como no hay ningún acertijo que resolver ni participación que bloquear, el SCP no necesita un token de recompensa para motivar la producción de bloques, y no quema energía. Un libro se cierra cuando un quórum ha confirmado el mismo conjunto de transacciones, lo que en Stellar tarda aproximadamente cinco segundos. Esa confirmación es definitiva: a diferencia de la prueba de trabajo, donde un bloque puede quedar huérfano si aparece una cadena más larga, un libro confirmado por el SCP no se revierte. No hay que \"esperar seis confirmaciones\"; una vez que se cierra, está hecho.",
        "La contrapartida es la honestidad sobre qué es lo que protege la red. La prueba de trabajo y la prueba de participación compran seguridad con un recurso externo y medible. El FBA la compra con la configuración de la confianza: la red es segura solo si los participantes eligen conjuntos de quórum sensatos y solapados, y si suficientes de los nodos importantes son honestos y están accesibles. Malas decisiones de confianza —por ejemplo, que todos se apoyen en el mismo puñado de validadores— pueden crear fragilidad o, en el peor de los casos, una división de la red. El SCP traslada la pregunta de seguridad de \"¿cuánto gastaste?\" a \"¿en quién elegiste confiar, y esas decisiones se solaparon?\".",
      ],
      example:
        "Piensa en un pueblo pequeño decidiendo si un rumor es cierto. Tú personalmente lo creerás una vez que tu médico y tus dos amistades más prudentes lo confirmen; ese trío es tu segmento de quórum. Tu vecino tiene un trío distinto. Pero tu médico también está en el segmento de tu vecino, y la amistad prudente de este último está en el tuyo. Como los círculos de confianza se solapan, el pueblo no puede acabar creyendo la mitad una cosa y la otra mitad lo contrario; el solapamiento fuerza una única conclusión compartida. El SCP es esa dinámica, ejecutada por servidores en lugar de por vecinos.",
    },
    {
      id: "c33-l3",
      title: "¿Qué son los nodos, los validadores y los conjuntos de quórum en Stellar?",
      paragraphs: [
        "Un nodo es cualquier computadora que ejecuta el software Stellar Core y participa en la red. Los nodos se pasan las transacciones unos a otros mediante gossip, guardan una copia del libro de registro y aplican los cambios de estado. No todos los nodos votan: un nodo observador sigue el libro y sirve datos, pero se mantiene al margen del consenso, mientras que un validador es un nodo configurado con una clave de firma que emite votos activamente en el SCP. Detrás de la aplicación, Horizon —el servidor de API HTTP de Stellar— suele situarse delante de un nodo Core, traduciendo un REST y un JSON amables al protocolo de bajo nivel que habla la red.",
        "Cada validador publica un conjunto de quórum: su declaración explícita de en qué otros validadores confía y cuántos de ellos deben estar de acuerdo antes de aceptar un valor. Un conjunto de quórum no es una lista plana; suele ser una estructura de umbral, por ejemplo \"estar de acuerdo si coinciden 3 cualesquiera de estos 4 grupos\", y esos grupos pueden ser a su vez umbrales anidados. Esto permite que un operador exprese algo matizado como \"confío en la red si concuerdan una mayoría de los principales proveedores de infraestructura más al menos un validador independiente\", codificando relaciones de confianza del mundo real en lugar de un único voto global.",
        "Los segmentos de quórum se derivan entonces de ese conjunto de quórum: cualquier combinación de validadores que satisfaga los umbrales es un segmento, un grupo suficiente para convencer a ese validador. La red alcanza el acuerdo porque los validadores eligen sus conjuntos de modo que los segmentos se solapen; ese solapamiento, conocido como intersección de quórum, es lo que garantiza que dos validadores honestos no puedan confirmar libros contradictorios. Si los conjuntos de quórum se configurasen de forma que dos grupos no compartieran ningún miembro, la red podría bifurcarse; una configuración sana de Stellar enruta deliberadamente la confianza a través de un núcleo común para que la intersección siempre se cumpla.",
        "En la práctica, la Stellar Development Foundation y un conjunto de organizaciones independientes operan validadores, y cada uno publica un archivo stellar.toml que declara su identidad y sus claves de validador. Los operadores se referencian entre sí a través de estas identidades publicadas al construir sus conjuntos de quórum, razón por la cual importa una identidad de nodo transparente y verificable. Un validador que oculta su identidad o en el que no confía nadie no aporta nada; la resiliencia de la red proviene de muchos operadores conocidos y honestos cuyas decisiones de confianza solapadas no dejan margen para una división.",
      ],
      example:
        "Supón que el backend de la aplicación envía una transacción y necesita saber que se liquidó. Horizon la reenvía a un nodo Core, que es un validador cuyo conjunto de quórum dice \"aceptar cuando al menos 4 de estas 6 organizaciones nombradas estén de acuerdo, y una de esas organizaciones debe ser el nivel de la SDF\". Cualquier combinación de 4 de 6 que cumpla la regla es un segmento válido. Cuando uno de esos segmentos confirma el libro, este validador lo confirma, y como el conjunto de todos los demás validadores honestos también se enruta a través de esas mismas organizaciones conocidas, todos confirman el libro idéntico.",
    },
    {
      id: "c33-l4",
      title: "¿Cómo se procesan las transacciones y se añaden a un libro de registro?",
      paragraphs: [
        "Una transacción comienza en el cliente. La aplicación construye un objeto de transacción: una cuenta origen, un número de secuencia, una comisión y una o varias operaciones, como un pago, un pago por ruta, una gestión de oferta en el SDEX o un cambio de confianza que añade una trustline. Luego se firma con la clave secreta de la cuenta, produciendo una firma que demuestra la autorización sin revelar la clave. Todavía nada ha tocado la red; todo esto es construcción y criptografía locales, y una transacción sin firmar o con la secuencia equivocada simplemente será rechazada.",
        "La transacción firmada se envía, en esta aplicación a través del endpoint de transacciones de Horizon. Horizon hace una validación básica y luego la entrega a su nodo Stellar Core, que la difunde por la red entre pares mediante gossip. Cada validador recopila las transacciones de las que ha tenido noticia en un conjunto de transacciones candidato para el siguiente libro. Las comisiones y los números de secuencia ayudan a ordenar y a eliminar duplicados; si la red está congestionada, las transacciones pujan mediante comisiones en una subasta de precios por saturación, y las pujas más bajas esperan a un libro posterior.",
        "Ahora se ejecuta el SCP, en dos fases. En la nominación, los validadores proponen conjuntos de transacciones candidatos y convergen en un conjunto de transacciones acordado para este libro. En el protocolo de votación (ballot), votan para confirmar ese conjunto, intercambiando mensajes de preparación (prepare) y confirmación (commit) hasta que un quórum confirma el mismo valor. Aquí es donde reside la tolerancia bizantina: aunque algunos validadores mientan o guarden silencio, el solapamiento de los conjuntos de quórum impide que dos conjuntos distintos se confirmen a la vez. La fase termina cuando un quórum ha externalizado un conjunto de transacciones.",
        "El libro se cierra entonces, aproximadamente cada cinco segundos. Core aplica las transacciones acordadas en su orden canónico, actualiza cada cuenta, oferta y trustline afectadas, calcula un nuevo hash del libro que se encadena con el libro anterior, y el resultado es definitivo e irreversible. Horizon ingiere el libro cerrado y solo entonces la llamada de envío de la aplicación devuelve éxito con el resultado. Por eso una operación enviada no está \"hecha\" en el instante en que haces clic: está hecha cuando se cierra el libro que la contiene, y en Stellar la definitividad es inmediata en ese momento, en lugar de probabilística a lo largo de muchos bloques posteriores.",
      ],
      example:
        "Colocas una orden de mercado para vender XLM por USDC en la pestaña de Trading manual. La aplicación construye y firma una operación de gestión de oferta y la envía por POST a Horizon. Horizon la retransmite a Core, que la difunde mediante gossip; los validadores la incorporan al siguiente conjunto candidato, ejecutan la nominación y el protocolo de votación, y un quórum externaliza ese conjunto. Unos cinco segundos después el libro se cierra: tu oferta casa contra el libro de órdenes, los saldos se actualizan de forma atómica, se escribe un nuevo hash del libro y Horizon devuelve la ejecución a la aplicación. La espera de cinco segundos que percibes es una ronda completa de consenso.",
    },
    {
      id: "c33-l5",
      title: "¿Cuáles son los límites de una blockchain?",
      paragraphs: [
        "Toda blockchain vive dentro del trilema de la escalabilidad: la observación de que es muy difícil maximizar la descentralización, la seguridad y la escalabilidad a la vez, y de que presionar con fuerza sobre una suele costarte otra. La descentralización significa muchos participantes independientes sin un único punto de control. La seguridad significa resistencia al ataque y a la reescritura del historial. La escalabilidad significa alto rendimiento y bajo coste por transacción. Las redes reales eligen un equilibrio en lugar de ganar las tres.",
        "Las tensiones son concretas. Si aumentas el rendimiento exigiendo validadores más potentes y caros, menos gente puede permitirse operar uno y la descentralización se erosiona. Si mantienes la validación barata para que cualquiera pueda participar, la capacidad por nodo limita tu rendimiento. La prueba de trabajo gasta energía real para comprar seguridad y lo paga en velocidad y coste; los grandes sistemas de prueba de participación concentran la influencia en los mayores partícipes. No hay comidas gratis: cada diseño es una contrapartida elegida, no un problema resuelto.",
        "Las decisiones de Stellar la sitúan deliberadamente hacia lo rápido, lo barato y lo razonablemente descentralizado, aceptando un coste concreto. El SCP con FBA ofrece definitividad en cinco segundos y comisiones de una fracción de centavo, lo que es una escalabilidad excelente para pagos y transferencias de activos. La seguridad no proviene de la energía ni de la participación, sino de la honestidad y el solapamiento de los conjuntos de quórum, de modo que la seguridad de Stellar es tan fuerte como su topología de confianza: un conjunto de validadores más pequeño y basado en la identidad es más eficiente, pero se apoya en que esos operadores se comporten bien y configuren quórums que se intersecten. Es una optimización orientada primero a los pagos, no una postura de máxima descentralización.",
        "Las blockchains tienen además límites que ningún ajuste del consenso elimina. El código en cadena es público y permanente, así que los errores salen caros y la privacidad es limitada. El rendimiento es finito, así que la congestión eleva las comisiones. Y el libro de registro solo hace cumplir sus propias reglas: no puede dar fe de la calidad real de un activo, razón por la cual la aplicación puntúa los tokens fuera de la cadena usando agregaciones de operaciones, profundidad del libro de órdenes y adopción, en lugar de confiar en la mera presencia en cadena. Capas más nuevas como Soroban, la plataforma de contratos inteligentes de Stellar, amplían lo que la red puede hacer, pero heredan las mismas contrapartidas del trilema. Nada de esto es asesoramiento de inversión, fiscal ni legal; es arquitectura, y saber dónde se sitúa una cadena en el trilema te dice para qué es buena y dónde conviene mantenerse cauteloso.",
      ],
      example:
        "Compara dos extremos. La base de datos de un solo banco es rapidísima y barata, pero totalmente centralizada: el banco puede congelar o revertir cualquier cosa, así que suspende la prueba de la descentralización y de la resistencia a la censura. Bitcoin está muy descentralizado y es seguro, pero procesa apenas un puñado de transacciones por segundo en momentos de comisiones altas. Stellar se sitúa entre ambos: no tan libre de confianza como la prueba de trabajo, pero liquidando un pago por ruta a través de varios mercados en unos cinco segundos por una fracción de centavo. Cada diseño compró dos vértices del triángulo y pagó en el tercero.",
    },
  ],
  quiz: [
    {
      id: "c33-q1",
      prompt: "¿Qué problema existe fundamentalmente para resolver el consenso de una blockchain?",
      options: [
        {
          text: "Cifrar las transacciones para que nadie pueda leer quién le pagó a quién.",
          explanation:
            "Incorrecto. El cifrado y la privacidad son asuntos aparte; la mayoría de los libros públicos, incluido Stellar, son en realidad transparentes. El consenso trata de ponerse de acuerdo sobre el orden, no de ocultar datos.",
        },
        {
          text: "Lograr que muchos nodos independientes que no confían entre sí acuerden un único historial ordenado, de modo que un mismo saldo no pueda gastarse dos veces.",
          explanation:
            "Correcto. El consenso produce un único orden canónico de transacciones entre nodos que desconfían mutuamente, que es exactamente lo que derrota al doble gasto: de dos gastos contradictorios solo uno puede confirmarse.",
        },
        {
          text: "Hacer que las transacciones sean permanentemente gratuitas eliminando todas las comisiones de red.",
          explanation:
            "Incorrecto. Las comisiones existen precisamente porque el espacio en los bloques es escaso y para disuadir el spam; el consenso no busca eliminarlas y Stellar sigue cobrando una comisión mínima por operación.",
        },
        {
          text: "Garantizar que el precio de un activo solo suba.",
          explanation:
            "Incorrecto. El consenso concierne a la integridad y el orden del libro de registro, no a los precios de mercado, que ningún protocolo controla.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c33-q2",
      prompt: "¿Cómo alcanza el acuerdo el Stellar Consensus Protocol, en comparación con la prueba de trabajo y la prueba de participación?",
      options: [
        {
          text: "Hace que los validadores resuelvan acertijos de hash intensivos en energía, y gana la cadena de trabajo más larga.",
          explanation:
            "Incorrecto. Eso describe la prueba de trabajo. El SCP no realiza minería y no quema energía.",
        },
        {
          text: "Exige que los validadores bloqueen capital que se les recorta si firman historiales contradictorios.",
          explanation:
            "Incorrecto. Eso describe la prueba de participación. El SCP no tiene participación ni depósito susceptible de recorte.",
        },
        {
          text: "Cada nodo elige en cuáles otros confía, y el acuerdo emerge de segmentos de quórum solapados: sin minería, sin participación, y con definitividad rápida.",
          explanation:
            "Correcto. El SCP implementa el Acuerdo Bizantino Federado: la seguridad descansa en el solapamiento de las decisiones de confianza, en lugar de en energía gastada o participación bloqueada, lo que da una definitividad irreversible de aproximadamente cinco segundos.",
        },
        {
          text: "Un servidor central de Stellar firma cada libro y lo difunde a la red.",
          explanation:
            "Incorrecto. No hay ningún firmante central. Muchos validadores independientes alcanzan el acuerdo a través de sus conjuntos de quórum; una única autoridad frustraría el propósito del consenso.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q3",
      prompt: "¿Qué es el conjunto de quórum de un validador, y por qué importa el solapamiento entre conjuntos de quórum?",
      options: [
        {
          text: "Es el conjunto explícito de nodos de confianza y umbrales del validador; los conjuntos solapados (la intersección de quórum) impiden que dos validadores honestos confirmen libros contradictorios.",
          explanation:
            "Correcto. Un conjunto de quórum codifica en quién confía un validador y cuántos deben estar de acuerdo. Como los validadores honestos enrutan la confianza a través de operadores comunes y conocidos, sus segmentos se intersectan, así que la red no puede bifurcarse en dos historiales contradictorios.",
        },
        {
          text: "Es la cantidad de XLM que un validador debe poner en participación antes de poder votar.",
          explanation:
            "Incorrecto. Los validadores de Stellar no ponen participación para votar; un conjunto de quórum trata de relaciones de confianza, no de fondos bloqueados.",
        },
        {
          text: "Es un grupo aleatorio de nodos que la red asigna en cada libro, de modo que el solapamiento es imposible.",
          explanation:
            "Incorrecto. Los conjuntos de quórum los elige y publica cada operador, no se asignan al azar, y el solapamiento deliberado es exactamente lo que mantiene segura la red.",
        },
        {
          text: "Es la lista de tokens que un validador tiene permitido operar; el solapamiento les permite compartir liquidez.",
          explanation:
            "Incorrecto. Los conjuntos de quórum conciernen a la confianza en el consenso, no al trading ni a la liquidez. Esto confunde el acuerdo sobre el libro de registro con la mecánica de mercado.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c33-q4",
      prompt: "En la vida de una transacción en Stellar, ¿qué significa que la llamada de envío de la aplicación devuelva éxito por fin?",
      options: [
        {
          text: "Horizon recibió la transacción y todavía está decidiendo si difundirla.",
          explanation:
            "Incorrecto. La mera recepción por parte de Horizon no es liquidación; la transacción todavía tiene que difundirse por gossip, acordarse por consenso y aplicarse.",
        },
        {
          text: "Un solo validador aceptó la transacción, aunque todavía podría revertirse por una cadena más larga.",
          explanation:
            "Incorrecto. Un solo validador no basta, y Stellar no tiene reversión por cadena más larga como la prueba de trabajo. La definitividad proviene de que un quórum externalice el libro.",
        },
        {
          text: "Un quórum externalizó el conjunto de transacciones, el libro se cerró (aproximadamente cada cinco segundos), las operaciones se aplicaron y el resultado es definitivo e irreversible.",
          explanation:
            "Correcto. El éxito significa que el libro que la contiene se ha cerrado: las fases de nominación y de votación del SCP convergieron, Core aplicó las operaciones en orden canónico, se encadenó un nuevo hash del libro y Horizon ingirió el resultado. En Stellar la definitividad es inmediata al cerrarse el libro.",
        },
        {
          text: "La transacción se escribió en la base de datos local del cliente y se sincronizará con la red durante la noche.",
          explanation:
            "Incorrecto. No hay ninguna sincronización por lotes nocturna; la transacción se difunde y se liquida dentro de una única ronda de consenso de aproximadamente cinco segundos.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c33-q5",
      prompt: "El trilema de la escalabilidad dice que a una blockchain le cuesta maximizar a la vez la descentralización, la seguridad y la escalabilidad. ¿Dónde se sitúa Stellar?",
      options: [
        {
          text: "Las maximiza las tres a la vez, habiendo resuelto por completo el trilema.",
          explanation:
            "Incorrecto. Ninguna cadena en producción escapa del trilema; afirmar haberlo resuelto por entero es una señal de alarma. Todo diseño paga en algún sitio.",
        },
        {
          text: "Se optimiza para un rendimiento rápido y barato y una descentralización razonable, aceptando que su seguridad depende de conjuntos de quórum honestos y bien solapados, en lugar de energía gastada o participación.",
          explanation:
            "Correcto. Stellar intercambia deliberadamente un conjunto de validadores más pequeño y basado en la identidad por definitividad en cinco segundos y comisiones inferiores al centavo; su seguridad es tan fuerte como su topología de confianza, lo cual es una optimización orientada primero a los pagos, no una postura de máxima descentralización.",
        },
        {
          text: "Maximiza la descentralización por encima de todo, funcionando como Bitcoin con una prueba de trabajo lenta y cara.",
          explanation:
            "Incorrecto. Stellar usa el SCP, no la prueba de trabajo, y prioriza la velocidad y el bajo coste por encima de la minimización de confianza al estilo de Bitcoin.",
        },
        {
          text: "Abandona la seguridad por completo para ser lo más rápida posible.",
          explanation:
            "Incorrecto. Stellar conserva una seguridad tolerante a fallos bizantinos mediante la intersección de quórum; cambia la base de esa seguridad, no la descarta.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
