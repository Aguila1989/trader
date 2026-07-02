// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
import type { Chapter } from "../../types";

export const chapter34: Chapter & { whoFor: string } = {
  id: "c34",
  number: 34,
  level: "EXPERT",
  whoFor: "Para operadores que exploran la frontera programable y on-chain de Stellar",
  title: "Contratos inteligentes y Soroban en Stellar",
  description:
    "Qué es un contrato inteligente, qué cambia Soroban para Stellar, en qué se diferencia de una transacción normal, cuáles son sus riesgos y cómo se combina en las finanzas descentralizadas a través de Blend, DeFindex y Soroswap.",
  lessons: [
    {
      id: "c34-l1",
      title: "¿Qué es un contrato inteligente?",
      paragraphs: [
        "El modelo mental más claro para un contrato inteligente es una máquina expendedora. Metes una moneda por la ranura, pulsas el botón de la bebida que quieres y la máquina te la entrega, de forma automática, sin cajero y solo si tu pago cubre el precio. No se la puede convencer de que te dé una bebida gratis, ni puede decidir quedarse con tu dinero sin entregar nada. Las reglas están grabadas en la máquina y se ejecutan de la misma manera cada vez que se cumplen las condiciones.",
        "Un contrato inteligente es esa máquina expendedora escrita como código y desplegada sobre una blockchain. Técnicamente es un programa, almacenado on-chain, cuya lógica se ejecuta de forma determinista en cada nodo validador. Determinista significa que las mismas entradas producen siempre las mismas salidas y los mismos cambios de estado, sin importar qué computadora lo ejecute, un requisito estricto, porque miles de validadores independientes deben llegar a resultados idénticos para ponerse de acuerdo sobre el libro de registro. Cuando invocas un contrato, no le estás pidiendo a una persona que actúe; estás activando un código previamente acordado que hace cumplir sus propias condiciones y liquida el resultado directamente en el libro de registro.",
        "Dos propiedades hacen que esto sea poderoso para quien opera. Primera, el código es público y su comportamiento es verificable: cualquiera puede leer lo que hará un contrato antes de interactuar con él. Segunda, una vez que se cumplen las condiciones, la ejecución está garantizada y una contraparte no puede revertirla de forma selectiva; no hay ningún empleado que pueda cambiar de opinión. Esa es la promesa que hay detrás de las finanzas descentralizadas: acuerdos financieros que se ejecutan solos, de forma transparente, sin un intermediario de confianza que custodie tus fondos.",
        "La otra cara de la moneda es que un contrato inteligente hace exactamente lo que dice su código, ni más ni menos. No tiene criterio ni buena voluntad. Si el código tiene un fallo, el fallo se ejecuta con la misma fidelidad que la lógica prevista. Por eso, leer, auditar y comprender un contrato importa mucho más que confiar en una marca o en una interfaz amigable.",
      ],
      example:
        "Un contrato de depósito en garantía sencillo codifica: \"Si la billetera A envía 100 USDC y la billetera B entrega el activo acordado antes del tiempo de bloque T, libera los USDC a B; en caso contrario, reembolsa a A después de T.\" Ningún agente de custodia guarda el dinero. El contrato bloquea los fondos, vigila la condición y liquida automáticamente: la lógica de la máquina expendedora, aplicada a una operación en lugar de a un refresco.",
    },
    {
      id: "c34-l2",
      title: "¿Qué es Soroban y qué cambia para Stellar?",
      paragraphs: [
        "Durante la mayor parte de su historia, Stellar no fue programable en sentido general, y lo fue de forma intencionada. Ofrecía un menú fijo de operaciones integradas (pagos, ofertas en el SDEX, trustlines, pagos por ruta) que son rápidas, económicas y predecibles, pero solo podías combinar las operaciones que Stellar ya proporcionaba. No podías escribir tu propia lógica on-chain. Soroban es lo que cambia eso. Es la plataforma de contratos inteligentes de Stellar: un entorno de ejecución que permite a los desarrolladores desplegar programas arbitrarios en la red, junto a las operaciones clásicas que ya usas en Atrium.",
        "Por debajo, los contratos de Soroban se escriben en Rust y se compilan a WebAssembly (WASM). WASM es un formato de bytecode compacto y portátil que se ejecuta dentro de una máquina virtual fuertemente aislada, de modo que un contrato no puede salir de los límites que tiene permitidos y tocar el resto del sistema. Se eligió Rust por sus sólidas garantías de seguridad y por sus herramientas maduras para WASM; la combinación le da a la red una manera de ejecutar código de terceros no confiable sin dejar que ese código desestabilice el libro de registro. Los contratos se miden de forma que cada paso de cómputo y cada byte de almacenamiento tiene un coste, que es lo que mantiene la ejecución acotada y hace que los ataques de denegación de servicio salgan caros.",
        "Lo que Soroban añade es programabilidad más allá del menú clásico: mercados de préstamos, bóvedas automatizadas, AMM personalizados, opciones y otra lógica que sencillamente no tenía representación en las operaciones integradas de Stellar. Y algo crucial: Soroban se diseñó para coexistir con el modelo de cuentas y los activos existentes. Un contrato de Soroban puede tener y mover los mismos USDC y XLM que ya operas, así que los rieles de pago clásicos, rápidos y baratos, y la nueva capa programable conviven en un solo libro de registro en lugar de en dos mundos desconectados.",
        "Para ti como operador, el cambio práctico es que Stellar se convierte en un lugar donde se pueden construir protocolos DeFi, y no solo en una red rápida de liquidación. Eso abre capacidades genuinamente nuevas: obtener rendimiento, pedir prestado contra una garantía, enrutar intercambios a través de pools programables. También amplía la superficie de riesgo, porque interactuar con un protocolo de Soroban significa confiar en código de terceros, no solo en las operaciones fundamentales de Stellar, probadas a fondo. Las próximas lecciones desglosan exactamente esa diferencia.",
      ],
      example:
        "Un intercambio clásico de Stellar usa la operación integrada de pago por ruta para saltar entre el SDEX y los pools AMM que la propia Stellar proporciona; no puedes alterar cómo funciona ese enrutamiento. Un intercambio de Soroswap, en cambio, llama a un contrato de Soroban: código WASM escrito por desarrolladores que implementa su propia matemática de pools y su propia lógica de comisiones. Los mismos USDC y XLM de base, pero el segundo se ejecuta sobre código programable desplegado en la red en lugar de sobre una operación integrada fija.",
    },
    {
      id: "c34-l3",
      title: "¿En qué se diferencia un contrato inteligente de una transacción normal?",
      paragraphs: [
        "Una transacción normal de Stellar es un conjunto de operaciones integradas elegidas de un catálogo fijo: un pago, una gestión de oferta en el SDEX, un cambio de confianza para añadir una trustline, un pago por ruta. Cada operación tiene una semántica predefinida que el núcleo de Stellar hace cumplir de forma idéntica para todos. Estás eligiendo de un menú que la red ya entiende, y los validadores saben de antemano exactamente qué puede y qué no puede hacer cada operación. Esta previsibilidad es la razón por la que las operaciones clásicas son baratas, rápidas y están extremadamente bien comprendidas.",
        "Invocar un contrato inteligente es algo fundamentalmente distinto: en lugar de escoger una operación conocida, estás llamando a una lógica arbitraria que un desarrollador escribió y desplegó. Esa lógica puede mantener su propio estado persistente on-chain (saldos, posiciones, configuración, datos de precios) y leer y modificar ese estado como parte de la llamada. Un pago clásico simplemente mueve valor entre dos cuentas; la invocación de un contrato puede ejecutar bucles, ramificarse según las condiciones, actualizar su propio almacenamiento e incluso llamar a otros contratos, todo dentro de una única transacción atómica que o bien tiene éxito por completo, o bien se revierte por completo.",
        "Ambos mundos comparten la misma propiedad innegociable: el determinismo. Ya sea que envíes un pago simple o invoques una bóveda compleja, cada validador debe llegar al resultado idéntico, porque el consenso de Stellar (SCP, el Stellar Consensus Protocol, un Acuerdo Bizantino Federado construido sobre conjuntos de quórum) exige que los nodos coincidan byte a byte en el nuevo libro de registro. Por eso los contratos no pueden hacer cosas no deterministas, como leer un número aleatorio del sistema operativo o realizar una petición de red en vivo; cualquier dato externo debe suministrarse como una entrada explícita.",
        "Aquí importan dos mecánicas específicas de Soroban. Primera, las comisiones: una operación clásica cuesta una comisión de red minúscula y casi fija (fracciones de centavo en XLM), mientras que la llamada a un contrato se mide según los recursos que consume (instrucciones de CPU, memoria y almacenamiento), de modo que una invocación pesada cuesta más que una ligera. Segunda, la huella: una transacción de Soroban debe declarar de antemano exactamente qué partes del estado del libro de registro (qué claves de almacenamiento) va a leer y escribir. Esta huella explícita permite a los validadores recuperar y bloquear solo el estado relevante y ejecutar contratos en paralelo de forma segura, pero también significa que una llamada que toque un estado inesperado fallará en lugar de extenderse en silencio.",
      ],
      example:
        "Vender XLM por USDC en la pestaña de Trading manual normalmente envía una operación clásica de gestión de oferta o de pago por ruta: una operación conocida, una comisión minúscula y fija, sin estado personalizado. Depositar esos mismos USDC en un pool de préstamos de Blend invoca un contrato de Soroban: actualiza los saldos almacenados del pool, acumula intereses contra su propio estado, debe declarar como huella las entradas de almacenamiento que va a tocar y se le cobra una comisión medida por recursos. El mismo activo, dos modelos de ejecución muy diferentes.",
    },
    {
      id: "c34-l4",
      title: "¿Cuáles son los riesgos de los contratos inteligentes?",
      paragraphs: [
        "El riesgo que define a los contratos inteligentes se desprende directamente de su mayor fortaleza. Como el código se ejecuta de forma determinista y la liquidación es definitiva, un fallo se ejecuta con la misma certeza que la lógica correcta. No hay una mesa de ayuda que revierta una transferencia equivocada ni una devolución de cargo. \"El código es ley\" corta por los dos lados: el contrato honrará un acuerdo justo sin intermediario, y honrará con la misma fidelidad una puerta trasera oculta o un error aritmético que lo vacíe.",
        "Las amenazas se agrupan en unas pocas categorías. Los errores son equivocaciones honestas (un caso límite mal gestionado, un error de redondeo, un cálculo de precio defectuoso) que un atacante puede aprovechar para retirar más de lo que debería. Los exploits son ataques deliberados que encadenan pequeñas debilidades hasta convertirlas en una gran pérdida; como los contratos son combinables y se llaman unos a otros, un fallo en un protocolo puede propagarse en cascada hacia otros que confían en él. Los rug pulls son maliciosos por diseño: el contrato contiene funciones privilegiadas (una clave de propietario que puede pausar los retiros, acuñar tokens ilimitados o vaciar el pool), así que la fachada \"sin necesidad de confianza\" esconde un interruptor que el creador puede accionar en cualquier momento. Aquí es donde resulta relevante el escaneo de trustlines con IA del que quizá hayas leído en otra parte de la Academia: la ausencia de un stellar.toml o unos metadatos de emisor pobres e imposibles de verificar son una señal de alarma en la capa de activos, y el mismo escepticismo se aplica a los contratos de los que depende el ecosistema de un activo.",
        "Las verdaderas defensas son los permisos y las auditorías. Lee quién controla el contrato: ¿se ha renunciado a la propiedad o la tiene una sola clave? ¿Puede alguna función privilegiada mover tus fondos, y ese poder está detrás de un timelock o de una configuración multifirma en lugar de en la billetera de una sola persona? Una auditoría de seguridad profesional (una revisión independiente del código por parte de especialistas) reduce el riesgo, pero nunca lo elimina; el código sin auditar merece una profunda sospecha, e incluso el código auditado ha fallado. Prefiere contratos cuyo código fuente esté verificado contra el WASM desplegado, para que el código que lees sea, de forma demostrable, el código que se ejecuta.",
        "En la práctica, trata cada interacción con un contrato inteligente como un riesgo de contraparte bajo una forma nueva. Dimensiona las posiciones de modo que la pérdida total de un protocolo dado no sea catastrófica, favorece los contratos consolidados con un largo historial sin exploits y con valor real bloqueado a lo largo del tiempo, y comprende que un rendimiento que parece muy por encima del mercado suele ser la compensación por un riesgo que no has identificado del todo. Nada de esto es asesoramiento financiero: es la misma disciplina que un operador prudente ya aplica, extendida al hecho de que aquí tu contraparte es código autónomo.",
      ],
      example:
        "Un contrato de bóveda anuncia un alto rendimiento y miles de usuarios depositan USDC. Enterrada en su código hay una función \"retiro de emergencia\" solo para el propietario, sin timelock. Un día, quien lo desplegó la llama y barre todos los depósitos hacia su propia billetera en una única transacción, irreversible y perfectamente válida. No se hackeó nada: el contrato hizo exactamente lo que su código siempre permitió. Leer los permisos antes de depositar habría dejado al descubierto ese único punto de fallo.",
    },
    {
      id: "c34-l5",
      title: "¿Cómo amplía la combinabilidad en Stellar las posibilidades de las finanzas descentralizadas?",
      paragraphs: [
        "La combinabilidad es la propiedad por la que los protocolos on-chain pueden llamarse unos a otros y apilarse como bloques de construcción, porque comparten el mismo libro de registro, los mismos activos e interfaces públicas. Un contrato puede tener una posición en un segundo contrato, que a su vez enruta a través de un tercero, todo dentro de una única transacción atómica que o se completa por entero o se revierte por entero. Por eso las finanzas descentralizadas se describen a menudo como \"legos de dinero\": cada protocolo es una pieza, y los desarrolladores ensamblan piezas para lograr un comportamiento que ninguna de ellas ofrece por sí sola. En Soroban, los mismos USDC y XLM fluyen libremente entre contratos, así que las piezas de verdad encajan entre sí en lugar de vivir en silos aislados.",
        "Soroswap es la capa de AMM y DEX, la primitiva base de intercambio. Implementa pools de liquidez y, algo importante, agregación y enrutamiento entre mercados, de modo que una operación puede dividirse y saltar de un sitio a otro para encontrar la mejor ejecución. Como expone una interfaz de intercambio limpia, otros contratos pueden llamar a Soroswap para convertir un activo en otro a mitad de la transacción, en lugar de obligar al usuario a intercambiar manualmente primero. Es la pieza que responde a \"convierte el activo X en el activo Y ahora mismo, on-chain\".",
        "Blend es la capa de préstamos. Opera pools de préstamos aislados donde quienes aportan depositan activos para ganar intereses y quienes toman prestado depositan una garantía para obtener préstamos, con tasas de interés determinadas algorítmicamente por la utilización del pool. Blend se combina con una capa de intercambio de una forma muy concreta: las liquidaciones. Cuando la garantía de un prestatario cae por debajo del ratio requerido, un liquidador debe pagar la deuda y quedarse con la garantía, y puede conseguir o deshacerse de los activos necesarios a través de un DEX como Soroswap dentro del mismo flujo. Prestar por sí solo es útil; prestar con la capacidad de llegar de forma atómica a un mercado de intercambio es robusto.",
        "DeFindex es la capa de estrategia y bóvedas que se asienta encima. Una bóveda es un contrato que acepta tu depósito y luego ejecuta una estrategia automatizada a través de los protocolos subyacentes (por ejemplo, aportando a un pool de Blend para obtener rendimiento y reequilibrando a través de Soroswap), de modo que el usuario obtiene una única interfaz sencilla de depositar y ganar mientras la complejidad corre por debajo. Esto es la combinabilidad hecha visible: DeFindex se construye sobre Blend, Blend se apoya en un DEX para las liquidaciones, y el DEX (Soroswap) es en sí mismo un bloque más. La ventaja es una enorme flexibilidad y eficiencia de capital; el contrapunto sensato es que las dependencias apiladas apilan riesgo, porque un fallo en cualquier bloque inferior puede propagarse hacia arriba por todo lo que se haya construido sobre él, que es exactamente la razón por la que la disciplina de auditoría y permisos de la lección anterior importa más donde los protocolos se combinan. Nada de esto es asesoramiento financiero, fiscal ni legal; los rendimientos de las finanzas descentralizadas y su tratamiento fiscal varían según la jurisdicción.",
      ],
      example:
        "Depositas USDC en una bóveda de DeFindex y recibes un token de participación de la bóveda. Por debajo, la bóveda aporta tus USDC a un pool de préstamos de Blend para ganar intereses; si parte de la estrategia necesita un activo distinto, enruta la conversión a través de Soroswap, todo de forma automática. Tres protocolos independientes cooperan en un solo depósito, y tú interactúas con un único botón sencillo. Esa pila es combinabilidad, y su comodidad depende de confiar en cada capa que hay debajo.",
    },
  ],
  quiz: [
    {
      id: "c34-q1",
      prompt: "La analogía de la máquina expendedora capta ¿cuál propiedad esencial de un contrato inteligente?",
      options: [
        {
          text: "Hace cumplir sus reglas de forma automática y liquida el resultado cuando se cumplen las condiciones, sin que ningún intermediario pueda anularlo.",
          explanation:
            "Correcto. Igual que una máquina expendedora que dispensa solo cuando se le paga, un contrato ejecuta su lógica acordada de forma determinista on-chain y liquida directamente en el libro de registro: ningún empleado puede decidir quedarse con tu dinero ni repartir una bebida gratis.",
        },
        {
          text: "Un operador de confianza revisa cada interacción y la aprueba o la revierte manualmente.",
          explanation:
            "Incorrecto, y justo lo contrario de la idea. La cuestión es que no hay ningún operador en el medio; el propio código hace cumplir las condiciones sin aprobación ni reversión humana.",
        },
        {
          text: "Su comportamiento cambia según qué nodo lo ejecute, de modo que los resultados varían entre validadores.",
          explanation:
            "Incorrecto. Los contratos deben ser deterministas (entradas idénticas producen resultados idénticos en cada nodo) precisamente para que todos los validadores puedan ponerse de acuerdo sobre el libro de registro. Una máquina expendedora da la misma salida para las mismas monedas cada vez.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c34-q2",
      prompt: "¿Qué añade Soroban a Stellar, técnicamente?",
      options: [
        {
          text: "Reemplaza XLM por un nuevo token nativo y cierra las operaciones de pago clásicas.",
          explanation:
            "Incorrecto. Soroban no reemplaza XLM ni elimina las operaciones clásicas; se diseñó para coexistir con ellas, y los contratos mueven exactamente los mismos XLM y USDC que ya operas.",
        },
        {
          text: "Un entorno de ejecución para contratos inteligentes arbitrarios escritos en Rust y compilados a WASM aislado, que añade programabilidad más allá de las operaciones integradas fijas de Stellar.",
          explanation:
            "Correcto. Soroban es la plataforma de contratos inteligentes de Stellar: código fuente en Rust compilado a WebAssembly medido y aislado, que permite a los desarrolladores desplegar lógica personalizada on-chain junto al menú de operaciones clásicas.",
        },
        {
          text: "Un algoritmo de consenso más rápido que reemplaza SCP por minería de prueba de trabajo.",
          explanation:
            "Incorrecto por dos motivos. Soroban es una plataforma de contratos, no un cambio de consenso, y el consenso de Stellar sigue siendo SCP (un Acuerdo Bizantino Federado), no prueba de trabajo.",
        },
        {
          text: "Un servidor centralizado gestionado por la fundación Stellar que ejecuta scripts off-chain para los usuarios.",
          explanation:
            "Incorrecto. Los contratos de Soroban se ejecutan on-chain en cada nodo validador de forma descentralizada y determinista, no en un único servidor central que corre scripts off-chain.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q3",
      prompt: "¿Qué afirmación distingue mejor invocar un contrato de Soroban de enviar una operación clásica como un pago?",
      options: [
        {
          text: "Las operaciones clásicas son no deterministas, mientras que las llamadas a contratos son deterministas.",
          explanation:
            "Incorrecto. Ambas son estrictamente deterministas: SCP exige que cada validador llegue a resultados idénticos en cualquiera de los casos. El determinismo es un requisito compartido, no una diferencia.",
        },
        {
          text: "Un pago clásico puede llamar a otros contratos y recorrer en bucle su propio almacenamiento, mientras que un contrato no puede.",
          explanation:
            "Al revés. Es la invocación de un contrato la que puede ramificarse, ejecutar bucles, modificar su propio almacenamiento y llamar a otros contratos; un pago clásico simplemente mueve valor entre dos cuentas.",
        },
        {
          text: "La llamada a un contrato ejecuta lógica escrita por desarrolladores con su propio estado persistente, se mide según los recursos que usa y debe declarar la huella del libro de registro que va a leer y escribir.",
          explanation:
            "Correcto. A diferencia de una operación integrada fija con una comisión casi plana, la invocación de un contrato ejecuta lógica arbitraria que cambia el estado, se cobra según el consumo de CPU, memoria y almacenamiento, y debe predeclarar su huella de almacenamiento para que los validadores puedan bloquearla y paralelizarla de forma segura.",
        },
        {
          text: "Las llamadas a contratos son siempre gratuitas, mientras que los pagos clásicos siempre cuestan más.",
          explanation:
            "Incorrecto. Las operaciones clásicas conllevan una comisión minúscula y casi plana; las llamadas a contratos se miden por recursos, y una invocación pesada normalmente cuesta más que un pago simple, no menos.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c34-q4",
      prompt: "Una bóveda DeFi guarda los USDC de miles de usuarios. Su código contiene una función solo para el propietario que puede retirar todos los depósitos sin timelock. Un día, quien la desplegó la llama y lo vacía todo. ¿Qué tipo de riesgo es este, y qué lo habría delatado?",
      options: [
        {
          text: "Fue un hackeo de la red; nada en el propio contrato podría haber advertido a los usuarios.",
          explanation:
            "Incorrecto. No se hackeó nada: el contrato ejecutó exactamente lo que su código siempre permitió. El peligro estaba en la propia lógica privilegiada del contrato, que era inspeccionable de antemano.",
        },
        {
          text: "Un rug pull mediante permisos privilegiados; leer quién controla el contrato y si una clave de propietario puede mover fondos lo habría dejado al descubierto.",
          explanation:
            "Correcto. Esto es un rug pull incorporado en los permisos. Comprobar el control del contrato (una única clave de propietario con una función de retiro sin restricciones y sin timelock) es justamente la disciplina de auditoría y permisos que delata el único punto de fallo antes de que deposites.",
        },
        {
          text: "La aversión a la pérdida hizo que quien lo desplegó vendiera; es un problema de psicología del operador, no un problema del contrato.",
          explanation:
            "Incorrecto. La aversión a la pérdida tiene que ver con las salidas emocionales del propio operador, no con que alguien vacíe un pool. Este es un riesgo de permisos de un contrato inteligente, no relacionado con ese concepto.",
        },
        {
          text: "Fue una consecuencia inevitable del determinismo que ninguna revisión de código podría haber revelado.",
          explanation:
            "Incorrecto. El determinismo explica por qué el robo fue irreversible una vez activado, pero la puerta trasera estaba claramente presente en el código y en los permisos; leerlos de antemano la habría revelado.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c34-q5",
      prompt: "En la pila DeFi de Stellar, ¿cómo se combinan Soroswap, Blend y DeFindex?",
      options: [
        {
          text: "Son tres aplicaciones aisladas que no pueden interactuar, ya que los contratos de Soroban no pueden llamarse unos a otros.",
          explanation:
            "Incorrecto. La combinabilidad es toda la cuestión: los contratos de Soroban comparten el mismo libro de registro y los mismos activos, y pueden llamarse unos a otros de forma atómica dentro de una sola transacción.",
        },
        {
          text: "DeFindex es el motor base de intercambio, Blend se asienta encima de él, y Soroswap es un gestor de bóvedas construido sobre Blend.",
          explanation:
            "Incorrecto: los papeles están mezclados. Soroswap es la primitiva de intercambio AMM/DEX, Blend es la capa de préstamos, y DeFindex es la capa de estrategia y bóvedas que se asienta encima de las demás.",
        },
        {
          text: "Solo se combinan porque cada uno ejecuta su propia blockchain separada y hace puentes de activos entre ellas.",
          explanation:
            "Incorrecto. Los tres son contratos de Soroban sobre el mismo libro de registro de Stellar, que comparten directamente los mismos USDC y XLM; no se necesitan cadenas separadas ni puentes de activos para que encajen entre sí.",
        },
        {
          text: "Soroswap ofrece los intercambios, Blend ofrece préstamos que pueden llegar a un DEX para las liquidaciones, y DeFindex construye estrategias de bóveda encima de ambos, apilándose como legos de dinero, lo que también apila su riesgo.",
          explanation:
            "Correcto. Soroswap es la primitiva base de AMM y enrutamiento, Blend es la capa de préstamos que puede conseguir o deshacerse de activos a través de un DEX durante las liquidaciones, y las bóvedas de DeFindex orquestan estrategias a través de ambos. La comodidad de la pila depende de confiar en cada capa que hay debajo.",
        },
      ],
      correctIndex: 3,
    },
  ],
};
