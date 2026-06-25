import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Proteger tus activos",
  description: "Los riesgos de seguridad reales en cripto y cómo este bot se protege frente a ellos, desde la seguridad de la clave hasta la verificación previa de saldo.",
  lessons: [
    {
      id: "c13-l1",
      title: "Cuáles son los mayores riesgos de seguridad en cripto?",
      paragraphs: [
        "Cripto es implacable en un aspecto muy concreto: las acciones son definitivas. Cuando una transacción de Stellar se confirma, es irreversible. No hay un banco al que llamar, ni contracargo, ni una línea de soporte que pueda recuperar los fondos. Ese solo hecho redefine todos los riesgos que vienen a continuación, porque un error suele ser permanente.",
        "Los mayores riesgos se agrupan en unas pocas categorías. Perder o filtrar tu clave secreta de firma le da a un atacante el control total de tus fondos. El phishing y los sitios falsos te engañan para que entregues esa clave tú mismo. Firmar una transacción maliciosa puede autorizar una transferencia que nunca pretendiste. Enviar a la dirección equivocada mueve el dinero a un desconocido para siempre. Y confiar en un token o emisor falso puede dejarte sosteniendo algo sin valor que solo parece real.",
        "Fíjate en que la mayoría de esto no son hackeos exóticos. Son errores humanos corrientes, amplificados por la irreversibilidad. La defensa no es ser ingenioso; son hábitos lentos y deliberados, y herramientas que bloquean las acciones malas antes de que lleguen a la blockchain. Eso es exactamente lo que este bot está diseñado para hacer.",
      ],
      example: "Pegas una dirección de destino desde el portapapeles, pero un malware la cambió por la dirección del atacante. Confirmas. Los fondos llegan a su cuenta en segundos, y ninguna fuerza en la tierra puede revertirlo. Una comprobación de dos segundos de los primeros y últimos caracteres lo habría detenido.",
    },
    {
      id: "c13-l2",
      title: "Cómo reconocer una estafa o un intento de phishing",
      paragraphs: [
        "El phishing es el arte de la suplantación. Un atacante crea un sitio o un mensaje que parece una billetera, un exchange o un equipo de soporte, y luego te empuja a introducir tu clave secreta o frase de recuperación. La trampa es la urgencia y la familiaridad: una advertencia de que tu cuenta está en riesgo, un airdrop generoso, una página de inicio de sesión que se ve exactamente igual.",
        "Aférrate a una sola regla y la mayoría del phishing fracasa: una aplicación legítima nunca te pedirá tu clave secreta por correo, chat o un formulario web. Tu clave firma transacciones en tu propia máquina; ningún servicio real necesita verla. Si algo te pide que pegues una clave que empieza con S, tómalo como prueba de que es una estafa.",
        "Más allá de eso, ve despacio y verifica. Comprueba el dominio exacto, carácter por carácter, porque las letras parecidas y las palabras de más son habituales. Desconfía de los enlaces no solicitados y de la presión por actuar rápido. Cuando tengas dudas, ve tú mismo al sitio en lugar de seguir un enlace que alguien te envió.",
      ],
      example: "Llega un mensaje: Tu billetera fue marcada, verifica en una hora en stellar-wallett-secure.com o perderás el acceso. La doble t en el dominio y la exigencia de tu frase semilla son las señales. Un proveedor real nunca necesitaría tu clave secreta, ni pondría una cuenta atrás para hacerte entrar en pánico.",
    },
    {
      id: "c13-l3",
      title: "Qué es una clave de firma y por qué deberías protegerla?",
      paragraphs: [
        "Una cuenta de Stellar tiene dos claves. La clave pública empieza con G y es seguro compartirla; es como un número de cuenta que otros usan para pagarte. La clave secreta de firma empieza con S y debe permanecer privada. Quien tenga la clave secreta puede firmar transacciones, lo que significa que puede mover todos los activos de la cuenta. No hay una contraseña separada por encima.",
        "Este bot necesita la clave secreta configurada para poder firmar operaciones en vivo en tu nombre. Para mantener ese poder contenido, arranca en modo de solo lectura por defecto y solo enviará transacciones reales una vez que actives deliberadamente el trading en vivo. Hasta entonces, puede observar y planificar, pero no puede gastar. Por tanto, la máquina y el entorno que guardan la clave son tan sensibles como una caja fuerte; cualquiera con acceso a ellos tiene, en la práctica, acceso a tus fondos.",
        "Trata la exposición como una emergencia. Si la clave secreta llega a aparecer en una captura de pantalla, un registro, un archivo compartido o un repositorio de código, da por hecho que está comprometida y rótala: crea una cuenta nueva, mueve los fondos y retira la clave vieja. La rotación es barata; la recuperación tras un robo es imposible.",
      ],
      example: "Un desarrollador sube un archivo de configuración con la clave S en vivo a un repositorio git público durante diez minutos antes de borrarlo. Es suficiente. Los bots escanean los repos públicos constantemente. La respuesta correcta no es confiar en que nadie lo vio, sino rotar de inmediato la clave y mover el saldo a una cuenta nueva.",
    },
    {
      id: "c13-l4",
      title: "Qué es la verificación previa de saldo y cómo te protege?",
      paragraphs: [
        "Antes de firmar cualquier operación, el bot ejecuta una verificación previa de saldo, también llamada preflight. Es una protección que pregunta: tendría éxito realmente esta transacción y dejaría la cuenta en buen estado? Solo si todas las respuestas son afirmativas el bot procede a firmar. Si alguna comprobación falla, bloquea la operación de forma limpia en lugar de enviar algo que fallaría en la blockchain o gastaría de más en silencio.",
        "La verificación previa comprueba tres cosas en particular. Primera, que la cuenta existe y está fondeada. Segunda, que tiene una trustline para el activo que recibiría, ya que Stellar no puede aceptar un activo en el que no has confiado explícitamente. Tercera, que hay suficiente saldo disponible una vez que restas los importes bloqueados en ofertas abiertas, la reserva mínima de XLM que exige la red y un pequeño margen para la comisión de la transacción.",
        "El objetivo es protegerte de ti mismo. Sin preflight, una operación al límite podría fallar después de enviarse, desperdiciar una comisión o meter mano en la reserva y poner en riesgo la cuenta. Con ella, las operaciones condenadas se detienen antes de que te cuesten nada, y obtienes un motivo claro en lugar de un error críptico en la blockchain.",
      ],
      example: "Pones en cola una compra que gastaría casi todo tu saldo de XLM. Preflight resta los fondos atados en una oferta abierta existente, la reserva mínima y el margen de la comisión, y descubre que el importe disponible se queda corto. Bloquea la operación e informa de saldo disponible insuficiente, ahorrándote un envío fallido y una reserva agotada.",
    },
    {
      id: "c13-l5",
      title: "Buenas prácticas para operar de forma segura con esta app",
      paragraphs: [
        "Empieza donde los errores salen gratis. Practica en modo Paper, que simula operaciones sin fondos reales, y opera en la testnet de Stellar con una hot wallet desechable antes de tocar dinero de la mainnet. Cuando pases a vivo, empieza con poco. El costo de aprender debería medirse en lecciones, no en capital perdido.",
        "Apóyate en las capas de seguridad integradas. El modo de solo lectura deja que el bot observe sin gastar. El kill switch bloquea todo el trading al instante cuando quieres parar. Los límites por operación y de pérdida diaria limitan cuánto puede costarte una sola operación o un mal día. Una lista blanca de tokens permitidos mantiene al bot alejado de emisores falsos o poco fiables. Juntas, convierten un sistema automatizado rápido en uno que puedes mantener a raya.",
        "Por último, protege la clave y mantente deliberado al pasar a vivo. Mantén la clave secreta fuera de máquinas compartidas y fuera de registros y repositorios. Deja el bot en su estado de solo lectura por defecto hasta que hayas decidido de verdad activar el trading en vivo, y vuelve a revisar esa decisión en lugar de dejarlo activado por costumbre. Aquí la seguridad es, sobre todo, disciplina convertida en rutina.",
      ],
      example: "Una primera semana sensata: ejecutar el modo Paper en testnet con una billetera desechable para confirmar que la estrategia se comporta, fijar un límite de pérdida diaria conservador y una lista blanca de tokens estricta, y luego activar el trading en vivo con un saldo mínimo y el kill switch a un clic de distancia. Aprendes los límites del sistema sin apostar nada que te importaría perder.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Por qué la irreversibilidad hace que los riesgos en cripto sean tan graves?",
      options: [
        { text: "Las transacciones confirmadas no se pueden revertir, así que una dirección equivocada o una estafa firmada suele ser permanente.", explanation: "Correcto. No hay contracargo ni banco que deshaga una transacción de Stellar confirmada, por eso los errores corrientes se convierten en pérdidas permanentes." },
        { text: "Porque los exchanges cobran comisiones altas por revertir un pago.", explanation: "Incorrecto. Revertir no es una opción cara, simplemente no es posible una vez que la transacción está confirmada." },
        { text: "Porque los precios de cripto cambian demasiado rápido para deshacer una operación.", explanation: "Incorrecto. La volatilidad del precio es un asunto aparte; el peligro central es que la propia transferencia no se puede deshacer, sea cual sea el precio." },
        { text: "Porque debes esperar varios días antes de que los fondos se liquiden.", explanation: "Incorrecto. Stellar liquida en segundos, y la liquidación rápida en realidad hace que la irreversibilidad llegue antes, no después." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q2",
      prompt: "Cuál es la señal más fuerte por sí sola de que un mensaje es un intento de phishing?",
      options: [
        { text: "Menciona Stellar o tu billetera por su nombre.", explanation: "Incorrecto. Los servicios legítimos también nombran la plataforma; eso por sí solo no prueba nada." },
        { text: "Te pide que introduzcas o pegues tu clave secreta o frase semilla.", explanation: "Correcto. Una aplicación legítima nunca pide tu clave secreta por correo, chat o formulario web, así que cualquier petición de ese tipo es una señal clara de estafa." },
        { text: "Llega fuera del horario laboral normal.", explanation: "Incorrecto. El momento es irrelevante; tanto los mensajes automatizados como los reales llegan a cualquier hora." },
        { text: "Incluye un enlace en el que se puede hacer clic.", explanation: "Incorrecto. Los enlaces son habituales y no son maliciosos de por sí; la petición de tu clave es la verdadera prueba, aunque igual deberías verificar los dominios." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q3",
      prompt: "Cuál es la diferencia entre una clave pública y una clave secreta de Stellar?",
      options: [
        { text: "La clave pública firma las operaciones y la clave secreta solo recibe fondos.", explanation: "Incorrecto. Es al revés: la clave secreta firma y controla los fondos, la clave pública es para recibir." },
        { text: "Ambas claves se pueden compartir libremente siempre que la cuenta tenga una contraseña.", explanation: "Incorrecto. Las cuentas de Stellar no tienen una contraseña separada; la clave secreta por sí sola controla los fondos y debe permanecer privada." },
        { text: "La clave pública empieza con G y es seguro compartirla, mientras que la clave secreta empieza con S y controla todos los fondos.", explanation: "Correcto. Quien tenga la clave S puede firmar transacciones y mover todos los activos, así que debe mantenerse privada mientras que la clave G se puede compartir." },
        { text: "La clave secreta es solo una versión visible de la clave pública.", explanation: "Incorrecto. Son criptográficamente distintas; la clave secreta es la clave privada de firma, no una vista de la pública." },
      ],
      correctIndex: 2,
    },
    {
      id: "c13-q4",
      prompt: "Qué verifica la verificación previa de saldo (preflight) antes de que el bot firme una operación?",
      options: [
        { text: "Solo que el precio de mercado actual sea favorable.", explanation: "Incorrecto. Preflight comprueba el estado y la viabilidad de la cuenta, no si el precio es una buena oferta." },
        { text: "Que la cuenta existe, tiene una trustline para el activo que recibirá y tiene suficiente saldo disponible tras las ofertas, la reserva y la comisión.", explanation: "Correcto. Estas tres comprobaciones aseguran que la operación pueda tener éxito en la blockchain y no gaste de más la reserva, así que las operaciones condenadas se bloquean de forma limpia." },
        { text: "Que has introducido la clave secreta correcta para la sesión.", explanation: "Incorrecto. La configuración de la clave es algo aparte; preflight valida saldos y trustlines, no la introducción de la clave." },
        { text: "Que ningún otro bot esté operando el mismo token al mismo tiempo.", explanation: "Incorrecto. Preflight tiene que ver con la capacidad de tu propia cuenta para financiar la operación, no con la actividad de otros traders." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Qué conjunto de hábitos refleja mejor un trading seguro con esta app?",
      options: [
        { text: "Activar el trading en vivo de inmediato, desactivar los límites de pérdida y operar todo el universo de tokens para maximizar las posibilidades.", explanation: "Incorrecto. Esto elimina todas las capas de seguridad de golpe; los límites, una lista blanca y un comienzo prudente existen precisamente para evitar esto." },
        { text: "Guardar la clave secreta en una carpeta de la nube compartida para poder operar desde cualquier dispositivo.", explanation: "Incorrecto. La clave secreta debe mantenerse fuera de máquinas y almacenamiento compartidos; cualquiera con acceso a ella controla tus fondos." },
        { text: "Practicar en modo Paper en testnet con una billetera desechable, mantener los límites de pérdida y una lista blanca de tokens, y luego pasar a vivo con poco y el kill switch listo.", explanation: "Correcto. Esto aprovecha los modos de práctica gratuitos y las protecciones integradas para que aprendas los límites del sistema sin arriesgar capital relevante." },
        { text: "Dejar el trading en vivo activado de forma permanente para no perderte nunca una oportunidad.", explanation: "Incorrecto. El bot arranca en solo lectura por una razón; deberías activar el modo en vivo de forma deliberada y volver a revisar esa decisión en lugar de dejarlo encendido por costumbre." },
      ],
      correctIndex: 2,
    },
  ],
};
