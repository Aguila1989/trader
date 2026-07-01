// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// EXPERT chapter on regulation, compliance and crypto's future: MiCA for
// European traders, FSMA and platform licensing, GDPR for platforms holding
// personal data, CBDCs, and where crypto (and Stellar) is heading. This chapter
// owns no new glossary terms; it reuses concepts taught in earlier chapters.
// Same shape as content/en/chapter22.ts, with the per-chapter `whoFor` one-liner
// typed via a local intersection so the live Chapter interface stays untouched.
import type { Chapter } from "../../../types";

export const chapter37: Chapter & { whoFor: string } = {
  id: "c37",
  number: 37,
  level: "EXPERT",
  whoFor: "Para traders y desarrolladores que miran hacia el futuro regulado de las criptomonedas",
  title: "Regulación, cumplimiento normativo y el futuro de las criptomonedas",
  description:
    "Cómo MiCA, la licencia de la FSMA y el GDPR moldean el mundo cripto europeo, en qué se diferencian las CBDC del dinero descentralizado y de las stablecoins, y hacia dónde se dirige el mercado, incluido el papel de Stellar.",
  lessons: [
    {
      id: "c37-l1",
      title: "¿Qué es MiCA y qué significa en concreto para los traders europeos?",
      paragraphs: [
        "MiCA, el Reglamento sobre los Mercados de Criptoactivos, es el reglamento único de la Unión Europea para los criptoactivos que no están ya cubiertos por la legislación financiera existente. Sustituye el mosaico de regímenes nacionales por un marco armonizado único en todos los Estados miembros, de modo que un emisor o un proveedor de servicios autorizado en un país puede pasaportar esa autorización a todo el bloque. Se trata de una decisión de diseño deliberada: en lugar de veintisiete reglamentos divergentes, hay uno solo.",
        "MiCA clasifica los tokens en tres categorías, y la categoría determina las reglas. Los tokens referenciados a activos (ART) siguen una cesta de activos o de divisas. Los tokens de dinero electrónico (EMT) siguen una única moneda oficial en proporción uno a uno, que es la categoría en la que encajan la mayoría de las stablecoins respaldadas por moneda fiduciaria, incluida una stablecoin en euros o en dólares. La categoría residual abarca otros criptoactivos, como los tokens de utilidad. Los emisores de stablecoins se enfrentan al tratamiento más estricto: deben mantener reservas líquidas, segregadas y plenamente respaldadas, publicar un libro blanco y honrar el reembolso a la par cuando se solicite. A las stablecoins de gran tamaño incluso se les puede imponer un tope al volumen diario de transacciones cuando se utilizan puramente como medio de pago.",
        "El lado de los servicios se rige mediante la autorización como CASP. Un Proveedor de Servicios de Criptoactivos es toda empresa que ofrece custodia, opera una plataforma de negociación, cambia criptoactivos por dinero fiduciario u otros criptoactivos, ejecuta o coloca órdenes, o presta asesoramiento. Para operar legalmente, un CASP debe estar autorizado por una autoridad nacional competente y, a partir de ahí, cumple obligaciones continuas: requisitos de capital, salvaguarda de los activos de los clientes, una gestión clara de las reclamaciones, la divulgación de conflictos de interés y normas sobre abuso de mercado que prohíben el uso de información privilegiada y la manipulación. La protección del consumidor es un tema recurrente, con advertencias de riesgo obligatorias y un derecho de desistimiento poco después de ciertas compras.",
        "La implantación fue por fases. Las reglas sobre stablecoins (ART y EMT) se aplicaron desde mediados de 2024, y el régimen más amplio de los CASP desde finales de 2024, con periodos transitorios de derechos adquiridos que los reguladores nacionales podían acortar. Para un trader, el efecto concreto es que los exchanges y custodios que utilizas deberían estar cada vez más autorizados bajo MiCA, que las stablecoins en euros que no cumplan la normativa pueden retirarse de la cotización para los usuarios de la UE, y que las divulgaciones que recibes se vuelven más estandarizadas. Nada de esto es asesoramiento de inversión ni asesoramiento legal; es contexto para que puedas leer correctamente las etiquetas y elegir plataformas reguladas.",
      ],
      example:
        "Una stablecoin vinculada al euro vendida a usuarios de la UE es, bajo MiCA, un token de dinero electrónico. Su emisor debe mantener las reservas de respaldo plenamente segregadas y reembolsables a la par, publicar un libro blanco y disponer de una autorización de EDE (entidad de dinero electrónico) o de entidad de crédito. Si no puede hacerlo, las plataformas de la UE tienen que retirarla de la cotización para los clientes europeos. Por eso algunas stablecoins desaparecieron discretamente de ciertos pares de exchanges de la UE en 2024, mientras que una alternativa plenamente respaldada y autorizada siguió cotizando.",
    },
    {
      id: "c37-l2",
      title: "¿Qué es la FSMA y cuándo necesitas una licencia para operar una plataforma cripto?",
      paragraphs: [
        "La FSMA, la Autoridad de Servicios y Mercados Financieros, es el regulador de la conducta financiera de Bélgica. Junto con el Banco Nacional de Bélgica, supervisa los mercados, protege a los consumidores y vigila las promociones financieras. Bajo MiCA es una de las autoridades nacionales competentes que autoriza y supervisa a los Proveedores de Servicios de Criptoactivos con sede en Bélgica, y ya gestionaba un régimen nacional de registro para proveedores de intercambio y de billeteras de custodia bajo la legislación contra el blanqueo de capitales antes de que MiCA tomara el relevo.",
        "Que necesites o no una licencia depende de lo que tu plataforma hace realmente, no de cómo la llames. Operar un mercado con libro de órdenes, mantener las claves o los saldos de los clientes en custodia, convertir entre criptoactivos y dinero fiduciario, o ejecutar y enrutar órdenes por cuenta de los usuarios son todas actividades reguladas de un CASP. En el momento en que una plataforma toca el dinero o los activos de otras personas, o casa sus operaciones, es muy probable que esté dentro del perímetro y necesite autorización, además de controles contra el blanqueo de capitales: verificaciones de identidad de conocimiento del cliente, monitorización de transacciones y notificación de actividades sospechosas. Comercializar productos cripto al público también activa normas de conducta sobre una comunicación justa, clara y no engañosa.",
        "En cambio, las herramientas puramente no custodiales o informativas se sitúan más cerca del borde del perímetro, aunque la línea es genuinamente difusa y depende de los hechos concretos. Una aplicación que nunca mantiene las claves de un usuario, nunca casa órdenes y solo ayuda a una persona a firmar sus propias transacciones contra una red pública hace algo distinto de un exchange que agrupa y custodia los fondos de los clientes. Las páginas de la Academia de una herramienta como esta, por ejemplo, son pura educación y no requieren ningún inicio de sesión, lo que queda claramente fuera de cualquier factor que active la obligación de licencia.",
        "Para Atrium en concreto, la arquitectura importa. Las billeteras son por usuario y están cifradas en reposo con AES-256-GCM, y la capa de firma descifra una clave solo en el momento de firmar, de modo que el diseño se inclina hacia lo no custodial en su espíritu. Pero si una plataforma así saliera alguna vez al público, aceptara fondos reales de clientes o casara operaciones entre usuarios, el análisis cambiaría y sería imprescindible obtener asesoramiento legal profesional. Esta lección es educación general, no asesoramiento legal; la clasificación regulatoria es una cuestión para un abogado cualificado que pueda examinar los hechos concretos.",
      ],
      example:
        "Considera dos aplicaciones. La aplicación A guarda las claves privadas de cada cliente en sus propios servidores, agrupa los depósitos y casa las órdenes de compra y de venta en su propio libro de órdenes. Eso es custodia más un mercado de negociación, indiscutiblemente un CASP que necesita autorización de la FSMA y controles completos contra el blanqueo de capitales. La aplicación B solo ayuda a un usuario a firmar su propia transacción de Stellar con una clave que permanece bajo el control del usuario y que se descifra justo el tiempo necesario para firmar, sin casar nada entre usuarios. La aplicación B está mucho más cerca de una herramienta no custodial, aunque la clasificación exacta sigue dependiendo de los hechos concretos y debería ser revisada con un abogado.",
    },
    {
      id: "c37-l3",
      title: "¿Qué es el GDPR y cómo se aplica a las plataformas cripto que almacenan datos personales?",
      paragraphs: [
        "El GDPR, el Reglamento General de Protección de Datos de la UE, rige cómo las organizaciones recopilan, usan y almacenan datos personales sobre personas identificables. Una plataforma cripto está de lleno dentro de su ámbito en el momento en que almacena una dirección de correo electrónico, un inicio de sesión, un registro de IP o un nombre, porque todos ellos identifican a una persona. Estar sobre una blockchain no te exime: la capa de cuentas fuera de la cadena, donde una plataforma vincula una identidad real a la actividad, son datos personales corrientes bajo reglas corrientes.",
        "El reglamento se apoya en unos pocos principios fundamentales. Todo uso de datos personales necesita una base legal, como la ejecución de un contrato con el usuario, un interés legítimo, una obligación legal como la conservación de registros contra el blanqueo de capitales, o un consentimiento otorgado libremente. La minimización de datos dice que solo recopilas lo que realmente necesitas. La limitación de la finalidad dice que solo los usas para la razón por la que los recopilaste. La limitación del plazo de conservación dice que no los guardas para siempre. Además de esto, las personas tienen derechos: acceso a sus datos, rectificación de errores, supresión en circunstancias definidas, portabilidad y oposición. Las plataformas también asumen deberes, el más agudo la obligación de notificar al regulador una violación de datos personales que cumpla el umbral sin dilación indebida, por lo general en un plazo de setenta y dos horas.",
        "Las criptomonedas introducen una tensión genuina, porque un libro de registro público está diseñado para ser inmutable y de solo adición, mientras que el GDPR concede un derecho a la supresión y un derecho a la rectificación. No puedes borrar ni editar una transacción confirmada en la cadena. La respuesta de ingeniería aceptada es mantener los datos personales fuera de la cadena y poner en la cadena únicamente referencias seudónimas y no identificativas. Una clave pública de Stellar es un seudónimo, no un nombre, así que no es por sí sola directamente identificativa, pero en el momento en que tu base de datos vincula esa clave a un correo electrónico se convierte en datos personales del lado de la cuenta que puedes y debes gestionar bajo el GDPR.",
        "En concreto, esto moldea cómo se construye una plataforma. Almacena los correos electrónicos, los hashes de contraseñas y los registros de cuenta en una base de datos fuera de la cadena que controlas por completo, para poder honrar allí las solicitudes de acceso, rectificación y supresión. Nunca escribas una identidad en bruto en el libro de registro. Cifra el material sensible en reposo, minimiza lo que registras y establece plazos de conservación. El modelo de cuentas de Atrium encaja en esta forma, con una billetera cifrada por usuario y datos de cuenta guardados en el propio almacén de la plataforma en lugar de en la cadena. Como siempre, esto es educación general, no asesoramiento legal, y un programa de cumplimiento real debería ser revisado por un profesional de la protección de datos.",
      ],
      example:
        "Un usuario pide a una plataforma que elimine su cuenta. La plataforma puede borrar su correo electrónico, el hash de su contraseña y su perfil de su propia base de datos fuera de la cadena y dejar de tratarlos, satisfaciendo la solicitud de supresión de los datos de identidad que controla. Lo que no puede hacer es reescribir las transacciones pasadas de Stellar del usuario, que están de forma permanente en el libro de registro público. Esto es exactamente por lo que una plataforma bien diseñada mantiene los datos identificativos fuera de la cadena y solo expone en la cadena una clave pública seudónima, de modo que una solicitud de eliminación sea técnicamente posible en primer lugar.",
    },
    {
      id: "c37-l4",
      title: "¿Qué son las CBDC y cómo se relacionan con las criptomonedas?",
      paragraphs: [
        "Una CBDC, una Moneda Digital de Banco Central, es dinero digital emitido directamente por un banco central. Es una forma digital de moneda soberana, un pasivo directo del Estado, del mismo modo que lo es el efectivo físico, solo que en forma electrónica. Muchos bancos centrales las están investigando o probando en pilotos, siendo el euro digital el ejemplo más relevante para los usuarios europeos, junto con proyectos en marcha o avanzados en otros lugares. Las motivaciones declaradas van desde modernizar los pagos y preservar el dinero público en una economía sin efectivo hasta mantener la soberanía monetaria a medida que crece el dinero digital privado.",
        "Es importante ver en qué se diferencia una CBDC de las criptomonedas que la mayoría de los traders conocen. Los criptoactivos descentralizados como Bitcoin o el XLM nativo de Stellar funcionan sobre redes sin permisos, sin un emisor central, y su oferta y sus reglas las fijan el protocolo y el consenso en lugar de un Estado. Una CBDC es lo contrario: centralizada, con permisos, emitida y controlada por el banco central, y por lo general no es algo cuya oferta descubra el mercado. La tecnología puede parecer superficialmente similar, y una CBDC incluso podría usar internamente un libro de registro distribuido, pero el modelo de confianza está invertido. Una elimina una autoridad central; la otra la digitaliza.",
        "Las CBDC también se diferencian de las stablecoins, aunque ambas aspiren a ser estables en valor. Una stablecoin respaldada por moneda fiduciaria, como un token regulado de estilo USDC, la emite una empresa privada y está respaldada por reservas que mantiene el emisor; su estabilidad depende de que ese emisor honre el reembolso y de la calidad de las reservas. Una CBDC es el dinero mismo, un derecho frente al banco central en lugar de frente a una empresa privada, así que no conlleva el riesgo de crédito del emisor del mismo modo que sí lo hace una stablecoin privada. Bajo MiCA, una stablecoin privada en euros es un token de dinero electrónico regulado; un euro digital sería en cambio dinero público regido por su propio marco jurídico específico.",
        "Para un trader basado en Stellar la imagen práctica es especulativa, pero merece la pena entenderla. Stellar se creó como una red de pagos y de emisión de activos y, en principio, una CBDC o un depósito tokenizado podría emitirse como un activo sobre una red así, coexistiendo con stablecoins privadas y activos descentralizados. Si eso ocurre, podrías algún día mantener un token de moneda digital pública y una stablecoin privada en la misma billetera, sujetos a una trustline y a la reserva habitual. Esto es contexto orientado al futuro, no una predicción, y desde luego no es asesoramiento financiero.",
      ],
      example:
        "Piensa en tres euros en tres formas. Un billete en tu bolsillo es dinero público, un derecho directo frente al banco central. Una stablecoin denominada en euros es dinero privado, un derecho frente a la empresa que la emitió y frente a las reservas que la respaldan. Un euro digital CBDC sería el gemelo electrónico del billete, aún un derecho directo frente al banco central pero utilizable de forma digital. Los tres pueden decir un euro, pero quién te debe ese euro, y por tanto qué riesgo asumes, es completamente distinto en cada caso.",
    },
    {
      id: "c37-l5",
      title: "¿Hacia dónde se dirigen las criptomonedas?",
      paragraphs: [
        "Dos fuerzas dominan la visión de futuro creíble: la tokenización de activos del mundo real y la adopción institucional. La tokenización de RWA (activos del mundo real) significa representar activos fuera de la cadena, como bonos del Estado, fondos del mercado monetario, bienes inmuebles o facturas, como tokens transferibles sobre una blockchain. El atractivo está en la liquidación programable, la propiedad fraccionada y la transferencia casi instantánea con un rastro de auditoría claro, reemplazando procesos administrativos lentos y aislados. La adopción institucional es la otra mitad: fondos regulados, bancos y empresas de pagos que pasan de los experimentos a la producción, animados precisamente por marcos como MiCA que les dan certeza jurídica. Aquí la regulación y la adopción se refuerzan mutuamente en lugar de tirar en direcciones opuestas.",
        "Stellar está inusualmente bien posicionada para esta dirección concreta, porque se construyó a propósito para los pagos y la emisión de activos y no como un ordenador mundial de propósito general. Emitir un activo en Stellar es una operación de primera clase y de bajo coste; las trustlines dan a emisores y tenedores un control explícito de adhesión voluntaria; y los pagos por ruta liquidan una conversión a través de los mercados de forma atómica, saltando por el libro de órdenes del SDEX y los pools de AMM para entregar el activo de destino en una sola transacción. Las comisiones son minúsculas, del orden de una fracción de centavo, y la liquidación se mide en segundos bajo el Protocolo de Consenso de Stellar, una implementación del Acuerdo Bizantino Federado en la que los nodos confían en conjuntos de cuórum en lugar de minar. Para mover un dólar o un bono tokenizado, esas son exactamente las propiedades que importan.",
        "La pieza más nueva es Soroban, la plataforma de contratos inteligentes de Stellar, que añade lógica programable a esa base de pagos y activos. Soroban hace posibles protocolos en la cadena para préstamos, rendimiento estructurado y swaps, y ya se construyen proyectos reales sobre ella: Blend para mercados de préstamos, DeFindex para bóvedas de estrategia tokenizadas, y Soroswap como exchange y agregador en la cadena. Combinado con stablecoins nativas como USDC y la capacidad de representar RWA como activos, esto apunta a que Stellar actúe como la fontanería de liquidación donde se encuentran el valor tokenizado regulado y la componibilidad de DeFi, en lugar de como un patio de recreo puramente especulativo.",
        "Nada de esto está garantizado, y un análisis honesto se mantiene con los pies en la tierra. La tokenización se ha prometido en exceso antes, los calendarios regulatorios se retrasan y la adopción puede estancarse. La lectura realista es direccional más que segura: más rampas de entrada reguladas, más activos tradicionales tokenizados, más flujo institucional, y redes optimizadas para pagos y emisión, con Stellar de forma destacada entre ellas, compitiendo por ser los raíles. Para un trader, la conclusión es seguir aprendiendo la mecánica, usar plataformas reguladas y bien comprendidas, y tratar cualquier pronóstico individual, incluido este, como contexto en lugar de una promesa. Esto es educación, no asesoramiento financiero.",
      ],
      example:
        "Imagina un fondo tokenizado de deuda pública a corto plazo emitido como un activo de Stellar. Una institución lo mantiene junto a un saldo de USDC en la misma billetera, cada uno detrás de su propia trustline. Cuando necesita efectivo, un pago por ruta convierte de forma atómica una porción del fondo tokenizado en USDC enrutándolo a través de los pools del SDEX y del AMM, liquidando en segundos por una fracción de centavo, mientras que un contrato de Soroban podría barrer automáticamente cualquier USDC ocioso hacia un mercado de préstamos de Blend para obtener rendimiento. Ese único flujo, activo tokenizado regulado más stablecoin más liquidación programable, es la forma concreta de hacia dónde se dirige buena parte de todo esto.",
    },
  ],
  quiz: [
    {
      id: "c37-q1",
      prompt: "Bajo MiCA, ¿cómo se clasifica por lo general una stablecoin en euros respaldada por moneda fiduciaria y vendida a usuarios de la UE, y qué activa esa clasificación?",
      options: [
        {
          text: "Como un token de dinero electrónico (EMT), de modo que el emisor debe mantener reservas segregadas y plenamente respaldadas y honrar el reembolso a la par.",
          explanation:
            "Correcto. Un token que referencia una única moneda oficial en proporción uno a uno cae en la categoría EMT de MiCA, que es el tratamiento más estricto: respaldo total, reservas líquidas segregadas, un libro blanco y reembolso a la par cuando se solicite. Las stablecoins en euros que no cumplan pueden retirarse de la cotización para los usuarios de la UE.",
        },
        {
          text: "Como un token de utilidad, de modo que está exenta de cualquier requisito de reserva o de autorización.",
          explanation:
            "Incorrecto. Los tokens de utilidad son la categoría residual de \"otros criptoactivos\". Una stablecoin vinculada a una divisa no es específicamente un token de utilidad, y se enfrenta a las obligaciones más exigentes de MiCA para las stablecoins, no a una exención.",
        },
        {
          text: "Como un valor bajo las reglas existentes de MiFID, de modo que MiCA no se le aplica en absoluto.",
          explanation:
            "Incorrecto. MiCA rige los criptoactivos que no están ya cubiertos por la legislación financiera existente; una stablecoin referenciada a moneda fiduciaria se trata dentro de MiCA como un EMT, no se excluye como un valor de MiFID.",
        },
        {
          text: "Como un token referenciado a activos (ART), porque toda stablecoin sigue una cesta de activos.",
          explanation:
            "Incorrecto. Los ART referencian una cesta de activos o de divisas. Una stablecoin vinculada uno a uno a una única moneda oficial es un EMT, no un ART.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c37-q2",
      prompt: "Una plataforma belga guarda las claves privadas de cada cliente, agrupa los depósitos y casa las órdenes de compra y de venta en su propio libro de órdenes. ¿Cuál es la lectura regulatoria más precisa?",
      options: [
        {
          text: "No se necesita ninguna licencia porque las criptomonedas no están reguladas en Bélgica.",
          explanation:
            "Incorrecto. Los servicios cripto sí están regulados: la FSMA autoriza y supervisa a los CASP bajo MiCA, y las normas contra el blanqueo de capitales ya se aplicaban a los proveedores de custodia y de intercambio antes de eso.",
        },
        {
          text: "Está prestando custodia y operando un mercado de negociación, así que es muy probable que sea un CASP que necesita autorización de la FSMA más controles contra el blanqueo de capitales.",
          explanation:
            "Correcto. Mantener las claves de los clientes es custodia y casar las órdenes de los clientes es operar una plataforma de negociación. Ambas son actividades reguladas de un CASP, así que la plataforma muy probablemente necesita autorización de la FSMA más controles de conocimiento del cliente y de monitorización de transacciones.",
        },
        {
          text: "Solo necesita una licencia si además presta asesoramiento de inversión; la custodia y el casamiento de órdenes no están regulados.",
          explanation:
            "Incorrecto. La custodia y la operación de una plataforma de negociación son cada una, de forma independiente, actividades reguladas de un CASP. El asesoramiento es una actividad regulada más, no el único factor que la activa.",
        },
        {
          text: "Está automáticamente fuera del perímetro porque todo se liquida sobre una blockchain pública.",
          explanation:
            "Incorrecto. Lo que importa es lo que hace la plataforma, no dónde ocurre la liquidación. Agrupar depósitos, mantener claves y casar órdenes la sitúan de lleno dentro del perímetro de licencia, con independencia del libro de registro subyacente.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q3",
      prompt: "¿Cómo debería una plataforma cripto que cumpla con el GDPR conciliar el derecho a la supresión con un libro de registro público inmutable?",
      options: [
        {
          text: "Reescribiendo o borrando las transacciones pasadas del usuario en la cadena cuando se solicita la supresión.",
          explanation:
            "Incorrecto. Las transacciones confirmadas en la cadena son inmutables y no se pueden borrar ni reescribir; ese es todo el diseño de un libro de registro público. La solución tiene que vivir fuera de la cadena.",
        },
        {
          text: "Ignorando el GDPR por completo, ya que las blockchains están exentas de la legislación de protección de datos.",
          explanation:
            "Incorrecto. No existe ninguna exención para las blockchains. La capa de cuentas fuera de la cadena que vincula una identidad a la actividad, como un correo electrónico ligado a una clave pública, son datos personales corrientes bajo reglas corrientes.",
        },
        {
          text: "Manteniendo los datos identificativos fuera de la cadena en una base de datos controlada y poniendo en la cadena únicamente referencias seudónimas, de modo que la supresión pueda honrarse fuera de la cadena.",
          explanation:
            "Correcto. Una clave pública es un seudónimo, no un nombre. Mantener los correos electrónicos, los hashes y los perfiles fuera de la cadena permite a la plataforma borrar o rectificar los datos de identidad que controla, mientras que el libro de registro solo contiene referencias no identificativas que nunca fueron, en primer lugar, una identidad en bruto.",
        },
        {
          text: "Cifrando toda la blockchain para que los datos puedan considerarse eliminados una vez que se descarta la clave.",
          explanation:
            "Incorrecto. No puedes cifrar un libro de registro público y compartido que no controlas, y el \"cripto-triturado\" de una cadena a escala de toda la red no funciona así. La respuesta aceptada es mantener los datos personales fuera de la cadena desde el principio.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c37-q4",
      prompt: "¿Cuál es la diferencia fundamental entre una CBDC y una stablecoin privada respaldada por moneda fiduciaria?",
      options: [
        {
          text: "No hay diferencia; ambas son simplemente euros o dólares digitales.",
          explanation:
            "Incorrecto. Puede que ambas persigan un valor estable, pero quién te debe el dinero difiere por completo, y esa diferencia es lo esencial.",
        },
        {
          text: "Una CBDC es un derecho directo frente al banco central (dinero público), mientras que una stablecoin es un derecho frente a un emisor privado y sus reservas.",
          explanation:
            "Correcto. Una CBDC es dinero soberano emitido por el banco central, sin ningún riesgo de crédito de emisor privado. Una stablecoin la emite una empresa y depende de que ese emisor honre el reembolso y mantenga buenas reservas; bajo MiCA es un token de dinero electrónico regulado, mientras que un euro digital sería dinero público bajo su propio marco.",
        },
        {
          text: "Una CBDC es descentralizada y sin permisos, mientras que una stablecoin se emite de forma centralizada.",
          explanation:
            "Incorrecto, y a la inversa. Una CBDC es centralizada y con permisos, emitida y controlada por el banco central. Son los activos descentralizados como Bitcoin o XLM los que están sin permisos, no la CBDC.",
        },
        {
          text: "Una stablecoin nunca puede estar regulada, mientras que una CBDC siempre está regulada.",
          explanation:
            "Incorrecto. Las stablecoins respaldadas por moneda fiduciaria están reguladas bajo MiCA como tokens de dinero electrónico. La verdadera distinción es el emisor y la naturaleza del derecho, no si existe regulación.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c37-q5",
      prompt: "¿Por qué se cita a menudo a Stellar como bien posicionada para la tokenización de activos del mundo real y los pagos?",
      options: [
        {
          text: "Porque se construyó a propósito para los pagos y la emisión de activos, con emisión de activos de primera clase y barata, trustlines, pagos por ruta atómicos y liquidación rápida bajo el SCP.",
          explanation:
            "Correcto. Stellar emite activos como una operación de primera clase y de bajo coste, usa trustlines para un control explícito de adhesión voluntaria, liquida las conversiones de forma atómica mediante pagos por ruta a través del SDEX y los pools de AMM, y finaliza en segundos bajo el Protocolo de Consenso de Stellar. Soroban añade después lógica programable. Esas son exactamente las propiedades que necesita el valor tokenizado.",
        },
        {
          text: "Porque Stellar mina nuevos bloques más rápido que cualquier otra cadena de prueba de trabajo, lo que le da la máxima seguridad.",
          explanation:
            "Incorrecto. Stellar no mina en absoluto. Usa el Protocolo de Consenso de Stellar, un Acuerdo Bizantino Federado en el que los nodos confían en conjuntos de cuórum, no la prueba de trabajo.",
        },
        {
          text: "Porque Stellar no tiene comisiones ni reservas, así que los activos tokenizados son completamente gratuitos de mantener y de mover.",
          explanation:
            "Incorrecto. Las comisiones son minúsculas, del orden de una fracción de centavo, pero no cero, y cada cuenta conserva una pequeña reserva mínima de XLM, con aproximadamente medio XLM más por cada trustline. \"Barato\" es preciso; \"gratis\" no lo es.",
        },
        {
          text: "Porque Soroban permite a Stellar ejecutar cualquier aplicación de propósito general, lo que vuelve irrelevantes los pagos y la emisión.",
          explanation:
            "Incorrecto. Soroban añade contratos inteligentes sobre la base de pagos y emisión de Stellar, y proyectos reales como Blend, DeFindex y Soroswap se construyen sobre ella, pero complementa los raíles de activos en lugar de volverlos irrelevantes. El enfoque en los pagos es precisamente la fortaleza.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
