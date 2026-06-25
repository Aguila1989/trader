import type { Chapter } from "../../types";

export const chapter13: Chapter = {
  id: "c13",
  number: 13,
  level: "EXPERT",
  title: "Proteger tus activos",
  description: "Los riesgos de seguridad reales en cripto y cómo este bot se protege frente a ellos, desde el manejo de la clave en el servidor hasta la verificación previa de saldo autoritativa.",
  lessons: [
    {
      id: "c13-l1",
      title: "Los mayores riesgos de seguridad en cripto: claves, phishing, apps falsas",
      paragraphs: [
        "Todo riesgo de seguridad en cripto hereda una propiedad: la finalidad. Cuando una transacción de Stellar se incluye en un ledger, es irreversible. No hay contracargo, ni banco, ni línea de soporte que pueda recuperar los fondos. La mayoría de los demás riesgos son simplemente este mismo, amplificado por un error, así que el modelo correcto no es cómo deshago el daño sino cómo bloqueo las acciones malas antes de que lleguen a la cadena.",
        "Una cuenta de Stellar se define por un par de claves. La clave pública empieza con G y es seguro compartirla; es la dirección en la que otros te pagan. La clave secreta empieza con S y otorga el control total. Quien tenga la clave S puede firmar transacciones y mover todos los activos de la cuenta, sin una segunda contraseña por encima. Por tanto, una clave secreta filtrada no es una brecha parcial. Es la custodia completa, transferida al atacante.",
        "La lista de amenazas es corta y concreta. Una clave secreta filtrada le da al atacante todo. El phishing y los sitios o apps falsas te engañan para que entregues la clave tú mismo. Firmar una transacción maliciosa autoriza una transferencia que nunca pretendiste. Enviar a la dirección equivocada mueve los fondos a un desconocido de forma permanente. Y confiar en un token o emisor falso te deja sosteniendo algo sin valor que simplemente se parece al activo real.",
        "Fíjate en que la mayoría de estos son errores humanos, no exploits exóticos. Tienen éxito porque la irreversibilidad elimina la red de seguridad de la que dependen otros sistemas financieros. La defensa es por capas y aburrida: guarda la clave donde los atacantes no puedan alcanzarla, verifica cada destino, desconfía del contacto no solicitado, y deja que las protecciones automáticas rechacen las operaciones condenadas o sin fondos. Este bot está construido en torno a exactamente esa postura, y el resto de este capítulo muestra los mecanismos concretos.",
      ],
      example: "Copias una dirección de destino desde el portapapeles, pero un malware de secuestro de portapapeles la reemplazó en silencio por la dirección del atacante. Confirmas. El activo llega a su cuenta en segundos y no se puede recuperar. Comparar los primeros cuatro y los últimos cuatro caracteres de la dirección con la fuente en la que confías habría detectado el cambio antes de firmar.",
    },
    {
      id: "c13-l2",
      title: "Cómo reconocer una estafa: señales de alarma y ejemplos",
      paragraphs: [
        "El phishing es suplantación diseñada para que actúes antes de pensar. El atacante reconstruye de forma convincente una billetera, un exchange o un equipo de soporte, y luego fabrica una razón para apresurarte: una advertencia de seguridad, una ventana de airdrop que se cierra, una página de inicio de sesión idéntica al píxel. El objetivo es casi siempre el mismo: que reveles tu clave secreta o frase semilla, o que firmes una transacción que no entiendes.",
        "Una sola regla vence a la mayoría de esto: una aplicación legítima nunca necesita tu clave secreta ni tu frase de recuperación. Tu clave firma localmente; ningún servicio real te pide escribir, pegar, enviar por correo o por mensaje directo una cadena que empieza con S. Trata cualquier petición de ese tipo como prueba definitiva de una estafa, sin importar cuán oficial parezca la marca.",
        "Aprende las señales secundarias para detectar los intentos más astutos. Un soporte que te escribe primero es una señal de alarma, porque el soporte real espera a que abras un ticket. Los rendimientos garantizados o demasiado buenos son un cebo. Los dominios parecidos sustituyen o duplican letras y añaden palabras tranquilizadoras como secure o verify. La urgencia y las cuentas atrás existen para suprimir tu juicio. Y los airdrops no solicitados o el spam de trustlines están diseñados para tentarte a interactuar con un emisor malicioso, por eso este bot opera solo con una lista blanca de activos verificados en lugar de cualquier cosa que aparezca en tu cuenta.",
        "Tu hábito, no tu ingenio, es la defensa. Ve despacio, escribe tú mismo los dominios conocidos en lugar de seguir enlaces, y verifica la dirección exacta carácter por carácter. Cuando algo te presiona para saltarte esos pasos, esa presión es en sí misma la señal.",
      ],
      example: "Llega un mensaje directo sin que lo pidieras: Soporte de Stellar aquí, tu billetera fue marcada por actividad sospechosa, restaura el acceso en una hora en stellar-wallett-verify.com y confirma tu frase semilla. Se acumulan tres señales: el soporte contactándote primero, el dominio parecido con la t duplicada, y una petición de tu frase semilla bajo una cuenta atrás de una hora. Un proveedor real no haría ninguna de estas cosas, y nunca necesita tu clave secreta.",
    },
    {
      id: "c13-l3",
      title: "Las claves de firma, por qué nunca salen del dispositivo y cómo las maneja esta app",
      paragraphs: [
        "La razón por la que una clave secreta nunca debe salir de un dispositivo de confianza es estructural: en Stellar no hay un flujo de recuperación ni una contraseña de cuenta separada. La posesión de la clave S es la autoridad. Una clave que pasa por un formulario web, un mensaje de chat, una captura de pantalla o un archivo compartido ya ha sido, a efectos de seguridad, divulgada, porque ya no puedes probar que no fue capturada en tránsito.",
        "Esta app está diseñada para que la clave permanezca en el servidor y en ningún otro lugar. La clave secreta se proporciona únicamente como una variable de entorno del lado del servidor, STELLAR_SECRET, leída una vez al arranque. El frontend del navegador nunca la recibe, nunca la almacena y nunca la transmite. Cada operación de firma ocurre en el firmante del backend, así que el material de la clave nunca cruza la red hacia el cliente. El frontend solo envía una instrucción para operar; no puede firmar nada por sí mismo.",
        "Luego, la autoridad está condicionada por el modo. Sin una clave secreta configurada, la app queda en solo lectura, así que puede observar y planificar pero no puede enviar nada a la cadena. Incluso con una clave presente, arranca en solo lectura por defecto (el flag de auto-armado está desactivado) y el trading en vivo debe armarse de forma deliberada y además requiere que el monitor de posiciones esté en marcha antes de que pueda producirse un envío real. El paper trading no necesita clave alguna, ya que las ejecuciones se simulan. Un kill switch se sitúa por encima de todo esto y bloquea cada operación al instante.",
        "Si la clave secreta llega a quedar expuesta, trátalo como un incidente activo, no como una preocupación. Los repositorios públicos y los fragmentos pegados son escaneados por bots en cuestión de minutos, y la divulgación equivale al robo en cuanto un atacante firma primero. La respuesta correcta es la rotación: crea un par de claves nuevo, mueve todos los fondos a él, retira la cuenta vieja y reemplaza STELLAR_SECRET. La rotación cuesta una comisión de transacción; la recuperación tras un vaciado lo cuesta todo.",
      ],
      example: "Un compañero de equipo pega la configuración de producción, incluida la clave secreta, en un gestor de incidencias público durante ocho minutos antes de borrarla. Ocho minutos son de sobra: los escáneres automáticos vigilan las fuentes públicas continuamente. Borrar la publicación no deshace la exposición. La única jugada segura es rotar de inmediato STELLAR_SECRET a un par de claves nuevo y mover el saldo allí antes de que un atacante firme.",
    },
    {
      id: "c13-l4",
      title: "La verificación previa de saldo: cómo el frontend y el backend te protegen",
      paragraphs: [
        "Antes de firmar cualquier operación real, el bot ejecuta una verificación previa de saldo, llamada preflight. Responde a una sola pregunta: tendría éxito esta transacción realmente y dejaría la cuenta en buen estado? Solo un visto bueno total permite al bot proceder a firmar. Cualquier fallo produce un bloqueo limpio con un código de motivo legible por máquina en lugar de un envío condenado, y, lo más importante, el bloqueo ocurre antes de firmar, así que un fallo garantizado en la cadena como op_underfunded u op_no_trust nunca quema una comisión de red.",
        "La protección empieza en el frontend como un primer filtro rápido. El formulario de orden manual te deja vender solo los activos que de verdad posees, mediante un desplegable de solo-tenidos, muestra tu saldo disponible en línea, y desactiva o marca la orden cuando el importe supera lo que tienes. Eso atrapa el error obvio en el teclado, antes de que ninguna petición salga del navegador. Pero el frontend es comodidad, no autoridad: se puede saltar, así que nunca es la última palabra.",
        "La comprobación del backend en src/stellar/preflight.ts es autoritativa y se ejecuta sin importar lo que el frontend creyera. Confirma que la clave pública está configurada, que la cuenta existe y está fondeada en la red correcta, y que existe una trustline para el activo que la operación RECIBIRÍA, ya que Stellar no puede aceptar un activo en el que no has confiado explícitamente. Luego calcula el saldo disponible, no el saldo bruto. El disponible equivale al saldo menos los importes bloqueados en tus ofertas abiertas (selling_liabilities), menos la reserva base de XLM de (2 + subentry_count) x 0.5 XLM, menos un margen de comisión de aproximadamente 0.05 XLM.",
        "Si falla, devuelve un bloqueo estructurado que lleva un código de motivo (no_public, account, no_trustline o insufficient_balance) junto con los importes requerido frente a disponible, de modo que la causa es inequívoca. Para las operaciones iniciadas por la IA o el sistema, va un paso más allá y arma un periodo de enfriamiento de cinco minutos por saldo insuficiente para ese par y lado, de forma que la misma propuesta sin fondos no se vuelve a plantear mientras recargas. Es una puerta de tiempo gruesa, así que depositar el activo que falta a mitad del enfriamiento no lo levanta antes.",
      ],
      example: "Una compra de la IA gastaría casi todo tu saldo de XLM. Preflight resta el XLM bloqueado en una oferta abierta existente, la reserva de (2 + subentry_count) x 0.5, y el margen de comisión, descubre que el disponible se queda corto frente al costo, y devuelve insufficient_balance con las cifras de requerido frente a disponible. No se firma ninguna transacción, así que no se desperdicia comisión, y el par más el lado quedan aparcados bajo un enfriamiento de cinco minutos en lugar de ser propuestos de nuevo en cada escaneo.",
    },
    {
      id: "c13-l5",
      title: "Buenas prácticas para operar de forma segura con esta app: una lista de verificación",
      paragraphs: [
        "Empieza donde los errores salen gratis y luego gánate el ascenso. Ejecuta primero en la testnet de Stellar con una hot wallet desechable, y usa el modo Paper, que simula las ejecuciones y no necesita clave, para confirmar que la estrategia se comporta antes de poner en juego cualquier valor de la mainnet. Mantén pequeños los tamaños de posición iniciales y adjunta stops dinámicos, para que el precio de aprender se pague en lecciones en lugar de en capital.",
        "Protege la clave como el único punto de autoridad total. Mantén STELLAR_SECRET fuera de línea y en el servidor, nunca la pegues en un sitio web ni en un chat, y nunca dejes que llegue a una captura de pantalla, un registro o un repositorio. Quédate en modo solo lectura o Paper hasta que de verdad hayas decidido pasar a vivo, arma el trading en vivo de forma deliberada y no por costumbre, y confirma que el monitor de posiciones está en marcha para que los stops y las salidas se apliquen de verdad. Mantén el kill switch al alcance para una parada total instantánea.",
        "Deja que las protecciones estructurales hagan su trabajo, y respeta sus rechazos. Opera solo con tokens de la lista blanca para que nunca interactúes con un emisor falso u hostil. Confía en el bloqueo de preflight: cuando informa de no_trustline o insufficient_balance, la solución es establecer la trustline o fondear la cuenta, no anular la comprobación. Verifica dos veces cada dirección de destino y envía primero una cantidad mínima de prueba cuando envíes a un sitio nuevo, porque la irreversibilidad significa que no hay una segunda oportunidad.",
        "Por último, incorpora un bucle de verificación a la rutina. Observa el registro de la IA para entender por qué se proponen, se aceptan o se bloquean las operaciones, de modo que una mala configuración aflore como un patrón en lugar de como una pérdida sorpresa. Y si una clave llega a quedar expuesta de cualquier forma, deja de operar, rota a un par de claves nuevo y mueve los fondos allí de inmediato. La seguridad aquí es, sobre todo, hábito disciplinado aplicado con constancia, respaldado por protecciones que fallan cerrándose.",
      ],
      example: "Una primera semana sensata: practicar en modo Paper en la testnet con una billetera desechable, fijar un tamaño por operación conservador y una lista blanca de tokens estricta, y luego armar el trading en vivo con un saldo mínimo de mainnet, el monitor de posiciones en marcha y el kill switch a un clic. Observas el registro de la IA en cada sesión y mantienes STELLAR_SECRET estrictamente en el servidor, así aprendes los límites del sistema sin arriesgar nada que te importaría perder.",
    },
  ],
  quiz: [
    {
      id: "c13-q1",
      prompt: "Por qué la irreversibilidad hace tan graves los riesgos de cripto como una dirección equivocada o una clave filtrada?",
      options: [
        { text: "Porque revertir una transacción confirmada cuesta una comisión de red alta.", explanation: "Incorrecto. La reversión no es una opción cara, simplemente es imposible una vez que la transacción está en un ledger; la comisión es irrelevante." },
        { text: "Una vez que una transacción está en un ledger no se puede revertir, así que una dirección equivocada o una estafa firmada es permanente y el robo mediante una clave filtrada es definitivo.", explanation: "Correcto. Stellar no tiene contracargo ni deshacer, así que los errores corrientes y las filtraciones de clave se convierten en pérdidas permanentes, por eso la prevención importa más que la recuperación." },
        { text: "Porque los precios volátiles hacen imposible valorar la pérdida.", explanation: "Incorrecto. La volatilidad del precio es un asunto aparte; el peligro central es que la propia transferencia no se puede deshacer, sea cual sea el precio." },
        { text: "Porque los fondos tardan varios días en liquidarse, dejando una ventana de exposición larga.", explanation: "Incorrecto. Stellar liquida en segundos, y la liquidación rápida en realidad hace que la irreversibilidad llegue antes, no después." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q2",
      prompt: "Cuál es la señal más fuerte por sí sola de que un mensaje es un intento de phishing o estafa?",
      options: [
        { text: "Te pide introducir, pegar o confirmar tu clave secreta o frase semilla.", explanation: "Correcto. Una aplicación legítima nunca necesita tu clave secreta ni tu frase de recuperación, así que cualquier petición de ello es prueba definitiva de una estafa, sin importar la marca." },
        { text: "Menciona Stellar o tu billetera por su nombre.", explanation: "Incorrecto. Los servicios reales también nombran la plataforma, así que ese detalle por sí solo no prueba nada." },
        { text: "Contiene un enlace en el que se puede hacer clic.", explanation: "Incorrecto. Los enlaces son habituales y no son maliciosos de por sí; la petición de tu clave es la verdadera prueba, aunque igual deberías verificar los dominios tú mismo." },
        { text: "Llega de madrugada o en fin de semana.", explanation: "Incorrecto. El momento es irrelevante; tanto los mensajes automatizados como los legítimos pueden llegar a cualquier hora." },
      ],
      correctIndex: 0,
    },
    {
      id: "c13-q3",
      prompt: "Cómo maneja esta app la clave secreta de firma, y para qué sirve la clave pública?",
      options: [
        { text: "El frontend guarda la clave secreta en el navegador para poder firmar operaciones rápido, y la clave pública es una copia de respaldo de ella.", explanation: "Incorrecto. El frontend nunca ve la clave secreta, y la clave pública no es una copia de respaldo; es la dirección compartible criptográficamente distinta." },
        { text: "Ambas claves se pueden compartir siempre que la cuenta tenga además una contraseña que la proteja.", explanation: "Incorrecto. Las cuentas de Stellar no tienen una contraseña separada, y la clave secreta por sí sola controla todos los fondos, así que nunca debe compartirse." },
        { text: "La clave secreta es la clave pública al revés, así que proteger una protege ambas.", explanation: "Incorrecto. Son valores independientes de un par de claves, no transformaciones la una de la otra; la clave pública no se puede convertir de vuelta en la secreta." },
        { text: "La clave secreta (S...) controla todos los fondos y se configura solo en el servidor como STELLAR_SECRET para que el navegador nunca la vea, mientras que la clave pública (G...) es la dirección compartible; la app además arranca en solo lectura por defecto.", explanation: "Correcto. La firma ocurre solo en el backend, el frontend nunca recibe la clave, la app arranca en solo lectura hasta que el modo en vivo se arma de forma deliberada, y la clave G es segura para compartir y recibir." },
      ],
      correctIndex: 3,
    },
    {
      id: "c13-q4",
      prompt: "Qué verifica la verificación previa de saldo del backend (preflight) antes de que el bot firme, y por qué ayuda bloquear pronto?",
      options: [
        { text: "Solo que el precio de mercado actual sea lo bastante favorable para ser rentable.", explanation: "Incorrecto. Preflight comprueba la viabilidad de la liquidación y el estado de la cuenta, no si el precio es una buena oferta." },
        { text: "Que la cuenta existe, tiene una trustline para el activo que recibirá, y tiene suficiente saldo disponible tras las ofertas abiertas, la reserva de XLM y el margen de comisión; bloquear antes de firmar no desperdicia comisión de red en una operación condenada op_underfunded u op_no_trust.", explanation: "Correcto. El disponible es el saldo menos selling_liabilities, la reserva de (2 + subentry_count) x 0.5 XLM, y un margen de comisión de ~0.05 XLM, y detenerse antes de firmar significa que un fallo garantizado en la cadena no cuesta nada." },
        { text: "Que has escrito la clave secreta correcta para esta sesión de trading.", explanation: "Incorrecto. La clave es configuración del lado del servidor, no entrada de sesión; preflight valida las trustlines y el saldo disponible, no la introducción de la clave." },
        { text: "Que ningún otro trader esté activo en el mismo mercado en el mismo momento.", explanation: "Incorrecto. Preflight tiene que ver solo con la capacidad de tu propia cuenta para financiar y recibir la operación, no con otros participantes." },
      ],
      correctIndex: 1,
    },
    {
      id: "c13-q5",
      prompt: "Qué conjunto de hábitos refleja mejor un trading seguro con esta app?",
      options: [
        { text: "Armar el trading en vivo de inmediato, desactivar el monitor de posiciones y operar todo token que aparezca en la cuenta.", explanation: "Incorrecto. Esto elimina el valor por defecto de solo lectura, el monitor que aplica los stops y la lista blanca que te mantiene lejos de emisores hostiles." },
        { text: "Guardar STELLAR_SECRET en una carpeta de nube compartida para que el bot pueda ejecutarse desde cualquier máquina.", explanation: "Incorrecto. La clave secreta debe permanecer fuera de línea y en el servidor; cualquiera con acceso a esa carpeta obtiene el control total de los fondos." },
        { text: "Practicar en modo Paper en la testnet con una billetera desechable, operar solo tokens de la lista blanca, armar el modo en vivo con poco y el monitor en marcha y el kill switch listo, y rotar cualquier clave expuesta.", explanation: "Correcto. Esto usa los modos de práctica gratuitos y todas las protecciones integradas, respeta los bloqueos de preflight y trata la exposición de la clave como un incidente, así aprendes sin arriesgar capital relevante." },
        { text: "Anular los bloqueos de preflight cuando informan de insufficient_balance para no perderse nunca una operación.", explanation: "Incorrecto. Un bloqueo de preflight significa que la operación fallaría o gastaría de más la reserva; la solución es fondear la cuenta o añadir la trustline, no saltarse la comprobación." },
      ],
      correctIndex: 2,
    },
  ],
};
