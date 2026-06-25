import type { Chapter } from "../../types";

export const chapter01: Chapter = {
  id: "c1",
  number: 1,
  level: "BASIC",
  title: "¿Qué es el trading de criptomonedas?",
  description:
    "Empieza desde cero: monedas, blockchains, la red Stellar, las billeteras y en qué se diferencian los tokens de las monedas.",
  lessons: [
    {
      id: "c1-l1",
      title: "¿Qué es una criptomoneda?",
      paragraphs: [
        "Una criptomoneda es dinero digital que vive en una red de computadoras compartida en lugar de guardarse dentro de un solo banco. Ninguna empresa por sí sola es su dueña. La red la sostienen muchas computadoras repartidas por todo el mundo, que se ponen de acuerdo sobre quién tiene qué, de manera que ninguna de las partes puede cambiar el registro a escondidas.",
        "Como es digital, puedes enviarla directamente a otra persona en cualquier lugar, a menudo en segundos, sin pedirle permiso a un banco. La contrapartida es que tú eres responsable de tus propios fondos. No hay una mesa de ayuda que revierta un error, así que conviene actuar con cuidado.",
        "Los precios se mueven porque la gente compra y vende, igual que ocurre con las acciones o las divisas extranjeras. Este panel te permite observar esos precios y colocar tú mismo tus órdenes de compra y de venta en la pestaña de Trading manual, o dejar que una IA te sugiera operaciones en la pestaña de Trading con bot.",
      ],
      example:
        "Imagina que tienes 100 XLM, la criptomoneda de la red Stellar. Si cada XLM vale alrededor de 0,11 USDC, tus 100 XLM valen aproximadamente 11 USDC. Si el precio sube a 0,13 USDC, esos mismos 100 XLM ahora valen 13 USDC, aunque la cantidad de XLM que posees no haya cambiado.",
    },
    {
      id: "c1-l2",
      title: "¿Qué es una blockchain y por qué importa?",
      paragraphs: [
        "Una blockchain es el libro de registro compartido sobre el que funciona una criptomoneda. Las transacciones se agrupan en bloques, y cada bloque nuevo se enlaza con el anterior, formando una cadena. Muchas computadoras guardan una copia completa, así que pueden verificarse entre sí y ponerse de acuerdo sobre lo que es cierto.",
        "Esto importa porque elimina la necesidad de confiarle el registro a una sola empresa. Una vez que una transacción se confirma y se añade a la cadena, resulta extremadamente difícil alterarla o borrarla. El historial es permanente y público, así que cualquiera puede comprobar que las cifras cuadran.",
        "Para quien opera, esto significa que una operación terminada es definitiva. Cuando el bot o tú colocan una orden y se ejecuta en el Stellar Decentralized Exchange, ese resultado queda escrito en la blockchain y no se puede deshacer. Esa permanencia es justamente la razón por la que es tan importante revisarlo todo dos veces antes de confirmar.",
      ],
      example:
        "Supongamos que envías 50 XLM a una amistad. La red agrupa tu transferencia con otras dentro de un bloque, las computadoras la confirman en unos pocos segundos y el bloque se añade a la cadena. A partir de ese momento, el registro muestra que 50 XLM salieron de tu cuenta, y nadie, ni siquiera tú, puede reescribir esa entrada.",
    },
    {
      id: "c1-l3",
      title: "¿Qué es la red Stellar y qué es XLM?",
      paragraphs: [
        "Stellar es la blockchain concreta sobre la que opera este bot. Fue creada para mover dinero de forma rápida y económica, lo que la hace muy adecuada para muchas operaciones pequeñas. Stellar incluso cuenta con un exchange integrado, el Stellar Decentralized Exchange, o SDEX, donde compradores y vendedores se encuentran directamente.",
        "XLM, también llamado Lumens, es el activo nativo de la propia Stellar. Cumple dos funciones. Es algo que puedes operar y, además, es el combustible que paga la pequeña comisión de red en cada transacción. Esas comisiones son una fracción de un centavo de dólar, así que operar a menudo no resulta caro.",
        "Cada cuenta de Stellar también debe conservar una pequeña cantidad mínima de XLM en reserva que no puedes gastar. Esto mantiene sana la red. El resumen de la billetera en este panel muestra tus tenencias valoradas tanto en XLM como en USDC, para que veas tu valor de un vistazo.",
      ],
      example:
        "Colocas una orden de venta en el SDEX para cambiar 20 XLM por USDC. La red cobra una comisión de unos 0,00001 XLM, mucho menos que un centavo. Si tuvieras exactamente 21 XLM, no podrías vender todos, porque una reserva mínima de aproximadamente 1 XLM debe permanecer en la cuenta para mantenerla activa.",
    },
    {
      id: "c1-l4",
      title: "¿Qué es una billetera y cómo la mantienes segura?",
      paragraphs: [
        "Una billetera es tu cuenta en la red. Tiene dos claves. La clave pública empieza con la letra G y funciona como tu número de cuenta, segura de compartir para que la gente pueda enviarte fondos. La clave secreta empieza con la letra S y equivale a la contraseña más la firma que autoriza cada movimiento.",
        "La regla de oro es sencilla. Quien tenga la clave secreta controla los fondos. No hay ningún banco al que llamar si se filtra. Cualquiera que copie tu clave S puede vaciar tu billetera al instante, y la blockchain tratará sus transacciones como completamente válidas porque fueron firmadas de forma correcta.",
        "Por eso, nunca pegues tu clave secreta en un sitio web en el que no confíes, nunca la compartas por chat ni por correo electrónico y guarda una copia de seguridad privada sin conexión. Trata la clave G como pública y la clave S como un secreto bien resguardado. Este panel firma las operaciones por ti, pero la seguridad de esa clave siempre es tu responsabilidad.",
      ],
      example:
        "Tu clave pública podría verse como GA5ZSEJ seguida de más letras, y puedes publicarla sin riesgo para que alguien te envíe 10 XLM. Tu clave secreta se ve como SDX4K seguida de más caracteres. Si alguien le hace una captura de pantalla a esa clave S, puede firmar una transacción que se lleve todos tus XLM y USDC, y nadie podrá revertirlo.",
    },
    {
      id: "c1-l5",
      title: "¿Qué es un token y en qué se diferencia de una moneda?",
      paragraphs: [
        "La gente suele decir moneda y token como si significaran lo mismo, pero hay una diferencia útil. Una moneda es el activo nativo de su propia blockchain. XLM es una moneda porque está integrada en la propia Stellar y paga las comisiones de red.",
        "Un token es un activo que alguien emite sobre una blockchain ya existente. Circula sobre la infraestructura de Stellar en lugar de tener la suya propia. USDC, emitido por una empresa llamada Circle, es un token que busca mantener su valor en un dólar estadounidense. Usa Stellar para moverse, pero no es la moneda nativa de Stellar.",
        "En Stellar, antes de poder tener u operar cualquier token no nativo como USDC, primero debes añadir una trustline con su emisor. Una trustline es tu cuenta declarando que acepta tener ese token concreto. La moneda nativa XLM nunca necesita una trustline, porque forma parte de la propia red.",
      ],
      example:
        "Para cambiar XLM por USDC en este panel, primero abres una trustline con Circle, el emisor de USDC. Sin ella, el libro de órdenes no te permitirá recibir USDC. Una vez establecida la trustline, puedes cambiar, por ejemplo, 100 XLM por unos 11 USDC, conservando el token USDC mientras sigues usando la moneda XLM para la comisión.",
    },
  ],
  quiz: [
    {
      id: "c1-q1",
      prompt:
        "En la red Stellar, ¿cuál es la diferencia entre XLM y USDC?",
      options: [
        {
          text: "XLM es la moneda nativa de Stellar, mientras que USDC es un token emitido sobre Stellar por Circle.",
          explanation:
            "Correcto. Una moneda es nativa de su blockchain y XLM está integrada en Stellar, mientras que USDC es un token emitido por Circle que circula sobre la infraestructura de Stellar.",
        },
        {
          text: "Ambas son monedas nativas de dos blockchains distintas.",
          explanation:
            "No del todo. Solo XLM es nativa de Stellar. USDC es un token emitido sobre Stellar, no la moneda de otra blockchain.",
        },
        {
          text: "USDC es la moneda nativa y XLM es un token emitido por Circle.",
          explanation:
            "Esto invierte la realidad. XLM es la moneda nativa que paga las comisiones de red, y USDC es el token emitido por Circle.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c1-q2",
      prompt:
        "Alguien te envía un mensaje pidiéndote tu clave secreta, la que empieza con S, para ayudarte a arreglar tu cuenta. ¿Qué deberías hacer?",
      options: [
        {
          text: "Compartirla, ya que el personal de soporte la necesita para ayudarte.",
          explanation:
            "No. No existe ninguna mesa de soporte que necesite tu clave secreta, y compartirla permite que cualquiera vacíe tu billetera.",
        },
        {
          text: "Compartir solo los primeros caracteres para demostrar que eres el dueño de la cuenta.",
          explanation:
            "Sigue siendo inseguro. Incluso las filtraciones parciales son arriesgadas, y un servicio real nunca necesita ninguna parte de tu clave secreta.",
        },
        {
          text: "Negarte y mantenerla en privado, porque quien tenga la clave S controla los fondos.",
          explanation:
            "Correcto. La clave secreta autoriza cada transacción. Cualquiera que la obtenga puede mover tus fondos, y la blockchain no puede revertirlo.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c1-q3",
      prompt: "¿Qué describe mejor una blockchain?",
      options: [
        {
          text: "Una base de datos privada que una empresa puede editar cuando le apetece.",
          explanation:
            "Incorrecto. El sentido mismo de una blockchain es que ninguna parte por sí sola controla ni edita a escondidas el registro.",
        },
        {
          text: "Un registro compartido de transacciones que mantienen muchas computadoras, donde las entradas confirmadas son permanentes.",
          explanation:
            "Correcto. Muchas computadoras guardan copias y se ponen de acuerdo sobre lo que es cierto, y una vez que se añade un bloque resulta extremadamente difícil de cambiar, por lo que las operaciones ejecutadas son definitivas.",
        },
        {
          text: "Un tipo de criptomoneda que puedes comprar y vender.",
          explanation:
            "No del todo. Una criptomoneda funciona sobre una blockchain, pero la blockchain en sí es el libro de registro compartido, no el dinero.",
        },
        {
          text: "Una cuenta bancaria que revierte automáticamente los pagos erróneos.",
          explanation:
            "No. No hay ninguna autoridad central que revierta los pagos. Las transacciones confirmadas en la blockchain son permanentes.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c1-q4",
      prompt:
        "¿Por qué cada cuenta de Stellar necesita conservar una pequeña cantidad de XLM, y para qué se usa XLM?",
      options: [
        {
          text: "XLM solo sirve como token de respaldo y nunca se gasta.",
          explanation:
            "Incorrecto. XLM se opera activamente y además paga la comisión de red en cada transacción, no es solo un respaldo.",
        },
        {
          text: "XLM paga las pequeñas comisiones de red y una reserva mínima debe permanecer en la cuenta para mantenerla activa.",
          explanation:
            "Correcto. XLM es la moneda nativa de Stellar que se usa para comisiones de una fracción de centavo, y una pequeña reserva debe permanecer para que la cuenta siga abierta.",
        },
        {
          text: "La reserva es una comisión que se paga a Circle por emitir USDC.",
          explanation:
            "No. Circle emite USDC, pero la reserva de XLM es una regla de la red para mantener la cuenta activa, no un pago a Circle.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
