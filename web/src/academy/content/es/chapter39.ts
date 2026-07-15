// Capítulo 39: Configurar el trading con IA. Ver content/en/chapter39.ts para
// la nota estructural (traducción natural, no palabra por palabra).
import type { Chapter } from "../../types";

export const chapter39: Chapter & { whoFor: string } = {
  id: "c39",
  number: 39,
  level: "BASIC",
  whoFor: "Para usuarios Premium que configuran el trading con IA por primera vez",
  title: "Configurar el trading con IA",
  description:
    "Qué es una clave API de IA y por qué la necesitas, cómo conseguir una en Anthropic, OpenAI, Google o DeepSeek, y cómo entender lo que la IA realmente te cuesta.",
  lessons: [
    {
      id: "c39-l1",
      title: "¿Qué es una clave API de IA y por qué la necesitas?",
      paragraphs: [
        "Cuando la IA opera por ti, no se ejecuta dentro de Atrium: cada vez que necesita \"pensar\", Atrium envía una consulta por internet a un proveedor de modelos de lenguaje grande (una empresa como Anthropic, OpenAI, Google o DeepSeek), y ese proveedor devuelve una respuesta. Ese viaje de ida y vuelta es lo que realmente produce cada propuesta de operación con IA que ves.",
        "Atrium no revende acceso a la IA ni añade un margen sobre lo que cobran esos proveedores. En su lugar, los usuarios Premium aportan su propia clave API: una cuenta que creas directamente con el proveedor que elijas, facturada directamente por ese proveedor. Esto significa que siempre tienes el control de qué proveedor y qué modelo usa tu trading con IA, y puedes ver y ajustar tus propios límites de gasto directamente en el panel de ese proveedor, en lugar de confiar en el margen de un intermediario.",
        "Lo mejor es pensar en una clave API como una contraseña personal de un servicio de pago: cualquiera que la tenga puede gastar dinero en tu cuenta con ese proveedor, así que hay que tratarla con el mismo cuidado que una contraseña bancaria. No es lo mismo que tu inicio de sesión en Atrium, ni lo mismo que la clave secreta de tu cartera; solo se comunica con el proveedor de IA, nunca con la red de Stellar.",
        "Atrium guarda tu clave API cifrada, usando el mismo cifrado AES-256-GCM que ya se usa para proteger la clave secreta de tu cartera. La clave solo se descifra en memoria, durante una fracción de segundo, justo en el momento en que la IA necesita hacer una solicitud; nunca se vuelve a escribir en el disco en texto plano, nunca se vuelve a mostrar en pantalla después de que la pegues por primera vez, y nunca se escribe en ningún archivo de registro.",
        "También eliges el modelo, no solo el proveedor: en Ajustes > Cuenta > Clave API de IA hay un campo Modelo opcional. Si lo dejas vacío, Atrium usa un modelo por defecto razonable para tu proveedor; si escribes un identificador de modelo concreto (por ejemplo una variante más barata o más capaz), cada petición de IA se ejecuta exactamente en ese modelo, con cargo a tu propia cuenta. El botón Probar conexión comprueba el identificador del modelo junto con tu clave, de modo que una errata falla antes de guardar y no en tu primera propuesta de operación.",
      ],
      example:
        "Piensa en Atrium como un despachador y en el proveedor de IA como el verdadero pensador: cuando la IA analiza el mercado, el servidor de Atrium toma tu clave cifrada, la descifra en memoria justo el tiempo necesario para hacer una solicitud a, por ejemplo, Anthropic, recibe una sugerencia de operación, y descarta de inmediato la copia descifrada. No vuelves a ver la clave después del día en que la escribiste por primera vez, y nada de ella aparece jamás en los registros de Atrium.",
    },
    {
      id: "c39-l2",
      title: "Cómo obtener una clave API de Claude (Anthropic)",
      paragraphs: [
        "Anthropic es la empresa detrás de la familia de modelos Claude, incluidos Claude Sonnet y Claude Opus, ambos utilizables por Atrium para el trading con IA. Para conseguir una clave, ve a console.anthropic.com en tu navegador e inicia sesión, o crea una cuenta nueva si aún no tienes una.",
        "Una vez conectado, busca la sección API Keys en la consola, haz clic en Create Key, dale un nombre si te lo piden (algo como \"Atrium trading\" facilita reconocerla después), y copia la clave generada. Esta es la única vez que se te muestra la clave completa: Anthropic no volverá a mostrarla, así que cópiala de inmediato antes de salir de la página.",
        "Los costes de la API de IA los cobra Anthropic directamente a tu cuenta. Son completamente independientes de tu suscripción a Atrium. El coste típico del trading con IA ronda entre €0,001 y €0,05 por propuesta de operación, según el modelo elegido y cuántos datos de mercado entran en cada análisis. Vale la pena revisar tu consumo de vez en cuando en la propia consola de Anthropic, donde ves exactamente lo que has gastado y puedes fijar límites de gasto.",
        "De vuelta en Atrium, pega la clave en Ajustes → Cuenta → Clave API de IA, elige Anthropic como proveedor, haz clic en Probar conexión para confirmar que funciona, y luego en Guardar.",
        "Trata esta clave como cualquier otra contraseña: no la compartas con nadie, y no la pegues en ningún otro sitio que no sea ese campo de ajustes en Atrium.",
      ],
      example:
        "Inicias sesión en console.anthropic.com, haces clic en API Keys → Create Key, la llamas \"Atrium trading\", y copias la cadena que te muestra (empieza por sk-ant-...). En Atrium, abres Ajustes → Cuenta → Clave API de IA, seleccionas Anthropic en el desplegable de proveedores, pegas la clave, haces clic en Probar conexión y ves un mensaje de éxito en verde, y luego haces clic en Guardar: el trading con IA ya puede usar Claude.",
    },
    {
      id: "c39-l3",
      title: "Cómo obtener una clave API de GPT (OpenAI)",
      paragraphs: [
        "OpenAI es la empresa detrás de la familia de modelos GPT, incluidos GPT-4 y GPT-4o, que Atrium también puede usar para el trading con IA. Para conseguir una clave, ve a platform.openai.com en tu navegador e inicia sesión, o crea una cuenta si aún no tienes una.",
        "Dentro de la plataforma, busca la sección API Keys, haz clic en Create new secret key, dale un nombre reconocible como \"Atrium trading\", y copia la clave de inmediato: igual que Anthropic, OpenAI muestra la clave completa solo una vez, en el momento de crearla.",
        "Los costes de la API de IA aquí los cobra OpenAI directamente a tu cuenta, completamente al margen de tu suscripción a Atrium. El coste típico del trading con IA ronda entre €0,001 y €0,05 por propuesta de operación, según el modelo y el tamaño de cada análisis. El panel de OpenAI muestra un total de consumo acumulado, así que revísalo periódicamente para controlar lo que gastas.",
        "De vuelta en Atrium, pega la clave en Ajustes → Cuenta → Clave API de IA, elige OpenAI como proveedor, haz clic en Probar conexión para confirmar que funciona, y luego en Guardar.",
        "Como siempre: no compartas esta clave con nadie, y no la pegues en ningún otro sitio que no sea ese campo de ajustes en Atrium.",
      ],
      example:
        "Inicias sesión en platform.openai.com, abres API Keys, haces clic en Create new secret key, la llamas \"Atrium trading\", y copias la cadena que te muestra (empieza por sk-...). En Atrium, abres Ajustes → Cuenta → Clave API de IA, seleccionas OpenAI en el desplegable de proveedores, pegas la clave, haces clic en Probar conexión y ves un mensaje de éxito en verde, y luego haces clic en Guardar: el trading con IA ya puede usar GPT.",
    },
    {
      id: "c39-l4",
      title: "Cómo obtener una clave API de Gemini (Google)",
      paragraphs: [
        "Google ofrece la familia de modelos Gemini, incluidos Gemini Pro y Gemini Ultra, como otra opción para el trading con IA en Atrium. Para conseguir una clave, ve a aistudio.google.com en tu navegador e inicia sesión con tu cuenta de Google.",
        "Dentro de Google AI Studio, busca el botón Get API Key, sigue los pasos para crear una clave nueva (puede que te pidan vincularla a un proyecto de Google Cloud), y copia la clave en cuanto se genere.",
        "Los costes de la API de IA aquí los cobra Google directamente a tu cuenta, completamente al margen de tu suscripción a Atrium. El coste típico del trading con IA ronda entre €0,001 y €0,05 por propuesta de operación, según el modelo y el tamaño del análisis. La consola de facturación de Google Cloud muestra tu consumo, así que vale la pena revisarla periódicamente y configurar una alerta de presupuesto si quieres un aviso temprano.",
        "De vuelta en Atrium, pega la clave en Ajustes → Cuenta → Clave API de IA, elige Google como proveedor, haz clic en Probar conexión para confirmar que funciona, y luego en Guardar.",
        "Como siempre: no compartas esta clave con nadie, y no la pegues en ningún otro sitio que no sea ese campo de ajustes en Atrium.",
      ],
      example:
        "Inicias sesión en aistudio.google.com, haces clic en Get API Key, sigues los pasos para crear una, y copias la cadena que te muestra. En Atrium, abres Ajustes → Cuenta → Clave API de IA, seleccionas Google en el desplegable de proveedores, pegas la clave, haces clic en Probar conexión y ves un mensaje de éxito en verde, y luego haces clic en Guardar: el trading con IA ya puede usar Gemini.",
    },
    {
      id: "c39-l5",
      title: "Cómo obtener una clave API de DeepSeek",
      paragraphs: [
        "DeepSeek es otro proveedor de IA compatible con Atrium, a menudo el más barato de los cuatro de usar. Para conseguir una clave, ve a platform.deepseek.com en tu navegador e inicia sesión, o crea una cuenta si aún no tienes una.",
        "Dentro de la plataforma, busca la sección API Keys, haz clic en Create Key, dale un nombre reconocible como \"Atrium trading\", y copia la clave de inmediato: como los demás proveedores, DeepSeek muestra la clave completa solo una vez.",
        "Los costes de la API de IA aquí los cobra DeepSeek directamente a tu cuenta, completamente al margen de tu suscripción a Atrium. El coste típico del trading con IA ronda entre €0,001 y €0,05 por propuesta de operación, y DeepSeek suele ser el más barato de los proveedores compatibles por solicitud. Su panel muestra tu consumo acumulado, así que revísalo periódicamente para llevar el control del gasto.",
        "De vuelta en Atrium, pega la clave en Ajustes → Cuenta → Clave API de IA, elige DeepSeek como proveedor, haz clic en Probar conexión para confirmar que funciona, y luego en Guardar.",
        "Como siempre: no compartas esta clave con nadie, y no la pegues en ningún otro sitio que no sea ese campo de ajustes en Atrium.",
      ],
      example:
        "Inicias sesión en platform.deepseek.com, abres API Keys, haces clic en Create Key, la llamas \"Atrium trading\", y copias la cadena que te muestra. En Atrium, abres Ajustes → Cuenta → Clave API de IA, seleccionas DeepSeek en el desplegable de proveedores, pegas la clave, haces clic en Probar conexión y ves un mensaje de éxito en verde, y luego haces clic en Guardar: el trading con IA ya puede usar DeepSeek, normalmente al coste por solicitud más bajo de los cuatro.",
    },
    {
      id: "c39-l6",
      title: "Entender tus costes de API de IA",
      paragraphs: [
        "Cada vez que la IA evalúa el mercado y produce una propuesta de operación, ese único \"pensamiento\" cuesta una pequeña cantidad, típicamente entre €0,001 y €0,05, según el proveedor y el modelo que hayas elegido y cuántos datos de mercado se incluyeran en ese análisis concreto. Es una cantidad minúscula por propuesta, pero se acumula con la frecuencia.",
        "Eso es lo esencial para entender cómo escala: los costes dependen sobre todo de con qué frecuencia la IA analiza el mercado, no de cuánto operas. Un intervalo de auto-escaneo más corto significa más análisis al día, lo que significa más cargos individuales de tu proveedor de IA, incluso en días en los que la IA acaba sin proponer nada que merezca la pena. Si quieres mantener los costes de IA predecibles, el intervalo de análisis es la palanca que más importa.",
        "Ayuda pensar en tus costes como tres partidas completamente separadas. Tu suscripción a Atrium (Premium, facturada mensual o anualmente) paga por la plataforma en sí. Las comisiones de operación se pagan en XLM a la plataforma en cada operación que haces, manual o por IA, a un porcentaje fijado por tu tramo de comisiones. El uso de la IA se paga directamente al proveedor de IA que elegiste, por cada análisis y propuesta que genera. Estas tres partidas nunca se solapan ni se agrupan: cada una la cobra una parte distinta, por algo distinto.",
        "El panel de cada proveedor te permite fijar límites de gasto o alertas de presupuesto, y vale la pena hacerlo una vez al configurar tu clave: la consola de Anthropic, la plataforma de OpenAI, la consola de facturación de Google Cloud y el panel de DeepSeek ofrecen todos alguna forma de tope mensual o notificación de uso, para que te enteres pronto si los costes suben más rápido de lo esperado.",
        "Si una clave alguna vez se queda sin crédito o alcanza un límite de gasto que hayas fijado, el proveedor de IA empezará a rechazar solicitudes. En Atrium, eso simplemente significa que dejan de aparecer propuestas de operación con IA, con un error claro mostrado donde habría estado la propuesta: no afecta a tu cuenta, a tu cartera ni a tu capacidad de operar. El trading manual sigue funcionando exactamente igual que antes, ya que nunca depende de un proveedor de IA; solo tendrías que recargar crédito o subir el límite con tu proveedor para que vuelvan a llegar propuestas de IA.",
      ],
      example:
        "Supongamos que usas Claude Sonnet con un intervalo de auto-escaneo de 15 minutos: eso son 96 análisis al día, cada uno costando unas pocas milésimas de euro, quedando muy por debajo de un euro al día en costes de IA incluso en un día activo. Por separado, tu suscripción Premium factura €10 ese mes sin importar cuánto hayas operado, y cada operación ejecutada paga su propia pequeña comisión en XLM según tu tramo de volumen. Un día, tu clave de Anthropic alcanza el tope mensual de €20 que fijaste en su consola: las propuestas de IA se detienen con un mensaje de error en Atrium, pero aún puedes abrir la pestaña Manual y operar a mano sin ninguna interrupción, y subir el tope (o esperar al mes siguiente) hace que las propuestas de IA vuelvan de inmediato.",
    },
  ],
  quiz: [
    {
      id: "c39-q1",
      prompt: "¿Quién te cobra realmente por el uso de la IA cuando analiza el mercado o produce una propuesta de operación?",
      options: [
        {
          text: "El proveedor de IA que elegiste (Anthropic, OpenAI, Google o DeepSeek), directa y separadamente de tu suscripción a Atrium.",
          explanation:
            "Correcto. Atrium no revende acceso a la IA ni añade margen: tú aportas tu propia clave API, y el proveedor detrás de ella cobra directamente a tu cuenta por lo que la IA usa.",
        },
        {
          text: "Atrium, incluido en tu suscripción Premium mensual.",
          explanation:
            "No. Tu suscripción Premium solo paga por la plataforma en sí. El uso de la IA es un coste aparte, cobrado directamente por el proveedor de IA cuya clave suministraste.",
        },
        {
          text: "Nadie: el uso de la IA es gratis en cuanto tienes una suscripción Premium.",
          explanation:
            "No. Cada solicitud a la IA cuesta una pequeña cantidad, cobrada por el proveedor a la cuenta detrás de tu clave API; es dinero real, aunque suele ser una cantidad muy pequeña por propuesta.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q2",
      prompt: "¿Dónde debes pegar la clave API de tu proveedor de IA en Atrium?",
      options: [
        {
          text: "Ajustes → Cuenta → Clave API de IA, y en ningún otro sitio.",
          explanation:
            "Correcto. Ese campo de ajustes es el único lugar donde tu clave debe pegarse en Atrium; trátala como una contraseña y no la pegues en ningún otro sitio.",
        },
        {
          text: "Directamente en un mensaje de chat a la IA, para que pueda identificarse ante su proveedor.",
          explanation:
            "No. La IA nunca te pide tu clave en una conversación. Solo tiene sitio en Ajustes → Cuenta → Clave API de IA.",
        },
        {
          text: "En la pestaña Bot de la página de Trading, junto al control Solo lectura / Paper / Live.",
          explanation:
            "No. El control de acceso al trading y la clave API están en sitios distintos: la clave va en Ajustes → Cuenta → Clave API de IA.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q3",
      prompt: "¿Qué ocurre realmente con tu clave API después de guardarla en Atrium?",
      options: [
        {
          text: "Se guarda cifrada (el mismo cifrado AES-256-GCM que las claves de cartera) y solo se descifra en memoria, un instante, cada vez que la IA hace una solicitud; nunca se vuelve a mostrar ni se registra.",
          explanation:
            "Correcto. La clave se protege igual que la clave secreta de tu cartera: cifrada en reposo, descifrada brevemente en memoria solo en el momento de uso, nunca vuelta a mostrar, y nunca escrita en ningún registro.",
        },
        {
          text: "Se guarda en texto plano para que el equipo de soporte pueda leértela de nuevo si la olvidas.",
          explanation:
            "No. La clave se guarda cifrada y nunca se vuelve a mostrar después de que la pegues por primera vez; no hay forma de recuperarla o mostrarla después, ni para ti ni para nadie más.",
        },
        {
          text: "Se reenvía de forma permanente a los propios servidores de Atrium y se reutiliza para las solicitudes de IA de todos los usuarios.",
          explanation:
            "No. Tu clave es solo tuya: únicamente se descifra de forma momentánea para hacer una solicitud en tu nombre, y nunca se comparte con otros usuarios ni se reutiliza para ellos.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c39-q4",
      prompt: "¿Cuál de estos NO influye en cuánto gastas en costes de API de IA?",
      options: [
        {
          text: "Cuánto tiempo hace que creaste tu cuenta de Atrium.",
          explanation:
            "Correcto: este es el que no importa. La antigüedad de la cuenta no tiene ninguna influencia en los costes de IA.",
        },
        {
          text: "Con qué frecuencia la IA analiza automáticamente el mercado.",
          explanation:
            "Esto sí importa: un intervalo de análisis más corto significa más análisis al día, y cada análisis es una solicitud facturada por separado a tu proveedor de IA.",
        },
        {
          text: "Qué proveedor y qué modelo elegiste.",
          explanation:
            "Esto sí importa: distintos proveedores y modelos cobran cantidades distintas por solicitud, lo cual es parte de por qué Atrium te deja aportar tu propia clave y elegir libremente.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
