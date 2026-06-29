import type { Chapter } from "../../types";

export const chapter18: Chapter = {
  id: "c18",
  number: 18,
  level: "ADVANCED",
  title: "Importar una billetera y entender los pares de claves",
  description:
    "Cómo se genera un par de claves de Stellar, qué ocurre realmente cuando importas una billetera, cómo esta aplicación cifra tu clave secreta en reposo, cómo funciona la financiación en testnet, y los riesgos de reemplazar tu billetera.",
  lessons: [
    {
      id: "c18-l1",
      title: "¿Qué es un par de claves de Stellar y cómo se genera?",
      paragraphs: [
        "Un par de claves de Stellar son la clave pública y la clave secreta que van juntas, generadas como una pareja emparejada. Stellar usa un esquema de firma llamado ed25519, una forma moderna de criptografía de clave pública que es rápida, compacta y ampliamente confiable. El par está vinculado matemáticamente: la clave pública siempre puede derivarse de la clave secreta, pero nunca al revés.",
        "Todo empieza con una semilla (seed): un valor aleatorio de 32 bytes. La calidad de esa aleatoriedad lo es todo: si la semilla es de verdad impredecible, la clave resultante no puede adivinarse ni siquiera por un atacante con enorme poder de cómputo. La semilla pasa por ed25519 para producir la clave secreta, y la clave secreta pasa por las mismas matemáticas para producir la clave pública correspondiente.",
        "Luego Stellar codifica las dos mitades para que sean fáciles de distinguir. La clave pública se codifica para empezar con la letra G (es la dirección de tu cuenta), y la clave secreta empieza con la letra S. Las mismas matemáticas de base, dos formas legibles para una persona: una segura para compartir, otra para custodiar.",
      ],
      example:
        "Generar un par de claves es como lanzar 32 veces un dado justo de 256 caras para obtener una semilla secreta que nadie podría predecir, y luego pasarla por una máquina de un solo sentido que imprime dos etiquetas: una dirección G... que puedes repartir, y un secreto S... que solo tú guardas. Como la máquina solo funciona en una dirección, nadie puede leer las etiquetas al revés para recuperar tu semilla.",
    },
    {
      id: "c18-l2",
      title: "¿Qué ocurre cuando importas una billetera existente?",
      paragraphs: [
        "Importar una billetera significa informar a la aplicación de una cuenta que ya tienes, en lugar de crear una nueva. Proporcionas tu clave secreta existente (el valor S...). A partir de ella, la aplicación deriva la clave pública correspondiente (la dirección G...) usando las mismas matemáticas de ed25519, de modo que aprende tu dirección sin que tú la escribas nunca.",
        "Con la dirección en mano, la aplicación busca la cuenta en Horizon, la pasarela de Stellar hacia la red, para confirmar que existe y leer sus saldos actuales. Por eso, justo después de importar, ves aparecer tus saldos reales de XLM y de tokens: la aplicación los lee directamente del registro público, no los inventa.",
        "Lo fundamental es que importar no mueve ni copia ninguna moneda. Es la misma cuenta de siempre, viviendo en la misma dirección y en la misma red; simplemente la has hecho usable desde dentro de esta aplicación. No se transfiere nada, y la cuenta se comporta igual tanto si la alcanzas desde aquí como desde cualquier otra billetera de Stellar.",
      ],
      example:
        "Pegas una clave secreta S... en la pantalla de importación. La aplicación deriva la dirección G..., consulta Horizon y muestra \"Saldo: 250 XLM, 40 USDC\". Esos fondos no llegaron por la importación: siempre estuvieron en esa dirección. Importar solo conectó esta aplicación con la cuenta que ya controlabas.",
    },
    {
      id: "c18-l3",
      title: "¿Qué es el cifrado AES-256-GCM y cómo protege esta aplicación tu clave secreta en reposo?",
      paragraphs: [
        "AES-256-GCM es una forma de cifrado simétrico autenticado. \"Simétrico\" significa que la misma clave bloquea y desbloquea los datos; \"256\" se refiere al tamaño de la clave, muy por encima de lo que cualquier ordenador puede romper por fuerza bruta; y \"GCM\" añade una etiqueta de autenticación que detecta cualquier manipulación, de modo que un texto cifrado alterado se rechaza en lugar de descifrarse en silencio como datos sin sentido.",
        "Esta aplicación lo usa para proteger tu clave secreta en reposo, es decir, mientras está en la base de datos. Tu secreto se cifra con una clave del lado del servidor derivada para cada usuario, y solo se almacena el texto cifrado resultante. La clave secreta en claro nunca se escribe en disco ni se devuelve a tu navegador, así que una copia robada de la base de datos solo entrega texto cifrado ilegible.",
        "El secreto en claro solo existe brevemente en la memoria del servidor, en el momento exacto en que una transacción necesita firmarse, y se descarta justo después. Por eso la firma ocurre en el servidor y la clave nunca llega al front-end: el navegador se trata como no confiable, y el secreto sin cifrar se mantiene tan efímero y tan contenido como sea posible.",
      ],
      example:
        "Supón que un atacante roba una copia de la base de datos. Para tu billetera encuentra un bloque como \"9f3a...c1\" (el texto cifrado AES-256-GCM) y nada más. Sin la clave del lado del servidor propia de cada usuario no puede descifrarse, y la etiqueta GCM hace que ni siquiera pueda manipularlo de forma útil. La clave secreta en sí nunca se almacenó en forma legible para que la encontrara.",
    },
    {
      id: "c18-l4",
      title: "¿Qué es Friendbot y cómo funciona la financiación en testnet?",
      paragraphs: [
        "Stellar ejecuta una red de práctica aparte llamada testnet, donde las monedas no tienen valor real y existen solo para que desarrolladores y estudiantes puedan experimentar con seguridad. Para facilitarlo, testnet tiene un grifo llamado Friendbot: pregúntale por una dirección nueva y crea la cuenta y la financia con XLM de prueba gratuitos.",
        "Ese paso de financiación importa porque, en Stellar, una dirección no es una cuenta real hasta que mantiene un saldo mínimo: la reserva base. Friendbot lo cubre por ti en testnet, convirtiendo un par de claves recién generado en una cuenta viva y usable con un clic, con XLM de prueba para jugar.",
        "Mainnet (la red real) no tiene Friendbot, y eso es justo lo importante. En mainnet debes financiar tú mismo una cuenta nueva con XLM reales para alcanzar la reserva base antes de que se active. Las monedas de prueba nunca pueden pasar a mainnet, así que practicar en testnet no cuesta nada ni arriesga nada, mientras que una cuenta real siempre empieza con dinero real que aportas tú.",
      ],
      example:
        "En testnet generas una dirección G... nueva y haces clic en \"Financiar con Friendbot\". Segundos después la cuenta existe con 10.000 XLM de prueba, perfecto para practicar. Intenta lo mismo en mainnet y no hay botón de Friendbot: la cuenta permanece inactiva hasta que le envías XLM reales desde otra billetera para cubrir la reserva base.",
    },
    {
      id: "c18-l5",
      title: "¿Cuáles son los riesgos de reemplazar tu billetera en la aplicación?",
      paragraphs: [
        "La aplicación mantiene solo una billetera activa a la vez, así que importar una nueva reemplaza la antigua en lugar de conservar ambas. Como esta es una acción delicada, requiere tu contraseña: una salvaguarda deliberada para que un descuido momentáneo o un atacante frente a tu pantalla desbloqueada no pueda cambiar en silencio la billetera con la que opera el bot.",
        "Reemplazar la billetera también afecta al trabajo que ya está en curso. Las órdenes abiertas y los stop loss activos están vinculados a la billetera que los creó; cuando cambias de billetera, esos se cancelan, porque ya no coinciden con la cuenta que ahora tiene el control. Planifica el cambio para un momento en que dejar posiciones sin gestionar sea aceptable.",
        "El riesgo más profundo está de tu lado, no del de la aplicación. Si reemplazas una billetera y no has guardado de forma segura la clave secreta antigua, pierdes el acceso a esa cuenta y a los fondos que contiene: la aplicación no puede recuperar un secreto que nunca almacena en forma legible. Antes de reemplazar, asegúrate de que la clave secreta antigua tenga copia de seguridad sin conexión, exactamente como describió el capítulo anterior.",
      ],
      example:
        "Importas la billetera B para reemplazar la billetera A. La aplicación pide tu contraseña, luego cancela los dos stop loss abiertos de A y hace el cambio. Más tarde quieres mover los fondos restantes de A, pero nunca anotaste la clave secreta de A, y la aplicación solo la almacenaba cifrada y ya la ha reemplazado. Esos fondos quedan varados, no por un fallo, sino porque la única clave que podía alcanzarlos ha desaparecido.",
    },
  ],
  quiz: [
    {
      id: "c18-q1",
      prompt: "¿Cómo se relaciona un par de claves de Stellar y qué clave empieza con qué letra?",
      options: [
        {
          text: "Es un par ed25519 derivado de una semilla aleatoria; la clave pública empieza con G y la secreta con S, y la pública puede derivarse de la secreta pero no al revés.",
          explanation:
            "Correcto. ed25519 vincula el par en un solo sentido: la clave pública (G...) proviene de la clave secreta (S...), que proviene de una semilla aleatoria, y las matemáticas no pueden ejecutarse al revés.",
        },
        {
          text: "Son dos valores aleatorios sin relación, uno que empieza con G y otro con S.",
          explanation:
            "No. Las claves están vinculadas matemáticamente, no son independientes: la clave pública se deriva de la clave secreta.",
        },
        {
          text: "La clave secreta empieza con G y la clave pública con S.",
          explanation:
            "No. Es al revés: G es la dirección pública, S es la clave secreta.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q2",
      prompt: "Cuando importas una billetera introduciendo tu clave secreta, ¿qué les ocurre a tus monedas?",
      options: [
        {
          text: "No se mueve nada: la aplicación deriva tu clave pública, lee la cuenta en Horizon y muestra saldos que siempre estuvieron ahí.",
          explanation:
            "Correcto. Importar solo conecta la aplicación con una cuenta que ya controlas. Deriva la dirección G... y lee los saldos existentes; no se transfiere ninguna moneda.",
        },
        {
          text: "Tus monedas se mueven a una cuenta nueva creada por la aplicación.",
          explanation:
            "No. Importar no mueve ni crea fondos. Es la misma cuenta en la misma dirección, ahora usable aquí.",
        },
        {
          text: "La aplicación copia tus monedas para que existan en dos lugares a la vez.",
          explanation:
            "No. Las monedas no se copian. Hay una sola cuenta en el registro; importar solo permite que esta aplicación la lea y la use.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q3",
      prompt: "¿Cómo protege esta aplicación tu clave secreta en reposo con AES-256-GCM?",
      options: [
        {
          text: "Almacena solo el texto cifrado, descifra el secreto únicamente en memoria al momento de firmar, y nunca lo devuelve al navegador.",
          explanation:
            "Correcto. El secreto se cifra con una clave del lado del servidor propia de cada usuario; solo se almacena el texto cifrado, la clave en claro vive brevemente en memoria para firmar, y el navegador nunca la ve.",
        },
        {
          text: "Almacena tu clave secreta en texto plano pero detrás de un inicio de sesión.",
          explanation:
            "No. El secreto nunca se almacena en texto plano. Un inicio de sesión por sí solo no protegería una copia robada de la base de datos; el cifrado sí.",
        },
        {
          text: "Envía la clave secreta a tu navegador, que la cifra localmente.",
          explanation:
            "No. El secreto nunca llega al navegador. La firma ocurre en el servidor precisamente para que la clave en claro quede fuera del front-end no confiable.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c18-q4",
      prompt: "¿Qué es cierto sobre Friendbot y la financiación de cuentas?",
      options: [
        {
          text: "Friendbot es un grifo que existe solo en testnet y que crea y financia una cuenta con XLM de prueba gratuitos; en mainnet debes financiar con XLM reales para alcanzar la reserva base.",
          explanation:
            "Correcto. Friendbot existe solo en testnet para practicar sin riesgo. Mainnet no tiene grifo, así que una cuenta real debe financiarse con XLM reales para cubrir la reserva base.",
        },
        {
          text: "Friendbot financia tu cuenta de mainnet con XLM reales gratis.",
          explanation:
            "No. Friendbot existe solo en testnet y sus monedas no tienen valor real. Nada financia una cuenta de mainnet gratis.",
        },
        {
          text: "Los XLM de prueba de Friendbot pueden moverse a mainnet y gastarse.",
          explanation:
            "No. Testnet y mainnet son redes distintas; los XLM de prueba no pueden pasar y no tienen valor real.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
