import type { Chapter } from "../../types";

export const chapter17: Chapter = {
  id: "c17",
  number: 17,
  level: "BASIC",
  title: "Crear y proteger tu billetera",
  description:
    "Qué es realmente una billetera cripto, la diferencia entre tu clave pública y tu clave secreta, por qué nunca debes compartir la secreta, y cómo guardarla de forma segura sin conexión.",
  lessons: [
    {
      id: "c17-l1",
      title: "¿Qué es una billetera cripto?",
      paragraphs: [
        "Una billetera cripto no es realmente un lugar donde se guardan tus monedas: tus monedas viven en la blockchain. Una billetera es el par de claves que te permite demostrar que las monedas son tuyas y moverlas. Piénsala como tu identidad y tu firma en la red unidas en una sola cosa.",
        "La forma más clara de imaginarla es un buzón. Tu billetera tiene una dirección pública, como la dirección impresa en el frente de un buzón: cualquiera puede leerla y cualquiera puede dejar algo dentro. Para abrir el buzón y sacar lo que hay dentro necesitas la llave, y solo tú deberías tener esa llave.",
        "Así que una billetera tiene dos partes que hacen dos trabajos distintos. Una parte es pública y está hecha para compartirse, de modo que la gente pueda enviarte fondos. La otra es privada y está hecha para ocultarse, porque es lo único que puede gastar esos fondos. Las siguientes lecciones examinan cada parte por turnos.",
      ],
      example:
        "Imagina un buzón en una calle. La dirección (\"Calle del Roble 12\") es tu clave pública: la pones con gusto en las cartas para que la gente pueda escribirte. La llavecita en tu bolsillo que abre el buzón es tu clave secreta. Un vecino puede enviarte una postal usando la dirección, pero sin la llave nunca podrá abrir el buzón y sacar lo que hay dentro.",
    },
    {
      id: "c17-l2",
      title: "¿Qué es una clave pública y qué es una clave secreta?",
      paragraphs: [
        "Tu clave pública es la dirección de tu billetera. Es seguro compartirla con cualquiera: la das para que la gente pueda enviarte monedas, igual que das la dirección de tu buzón para que te envíen cartas. Compartirla no puede perjudicarte; lo peor que alguien puede hacer con ella es enviarte dinero.",
        "Tu clave secreta (a veces llamada clave privada) es completamente distinta. Es la única cosa que puede autorizar un pago desde tu billetera. Quien tenga la clave secreta controla los fondos, y punto. No hay una contraseña adicional, ni un gestor al que llamar, ni forma de revertir una transferencia una vez firmada.",
        "Por eso las dos claves deben tratarse de formas opuestas. La clave pública está pensada para verse; la clave secreta está pensada para quedar oculta para siempre. Si alguna vez dudas cuál estás a punto de compartir, la regla segura es simple: nunca compartas la secreta.",
      ],
      example:
        "En Stellar las dos claves incluso se ven diferentes para que puedas distinguirlas. Una clave pública empieza con la letra G, como \"GABC...\": esa es la que pegas cuando alguien quiere pagarte. Una clave secreta empieza con la letra S, como \"SABC...\": esa te la guardas y no se la muestras a nadie, jamás.",
    },
    {
      id: "c17-l3",
      title: "Por qué nunca debes compartir tu clave secreta, jamás",
      paragraphs: [
        "Compartir tu clave secreta es lo mismo que entregarle a alguien tu billetera sin forma de recuperarla. Cualquiera que la tenga puede vaciar cada moneda en segundos, y como las transferencias en blockchain son definitivas e irreversibles, no hay banco al que llamar ni forma de recuperar el dinero. La pérdida es permanente.",
        "Los estafadores saben que esta es la llave maestra, así que la mayoría de los ataques son simplemente trucos para hacer que la reveles. Uno común es el falso \"soporte\": alguien que se hace pasar por un servicio de ayuda en un chat dice que necesita tu clave secreta o tu frase semilla para \"arreglar\" tu cuenta o \"desbloquear\" tus fondos. El soporte real nunca necesita tu clave secreta; quien la pida está intentando robarte.",
        "Otras trampas parecen igual de convincentes. Una web o una ventana emergente puede pedirte que \"importes\" o \"verifiques\" tu billetera escribiendo tu frase semilla: eso es phishing de frase semilla, e introducirla le entrega todo al atacante. La regla no tiene excepciones: tu clave secreta y tu frase semilla nunca se escriben en un chat, un formulario, un correo ni una web a la que te enviaron un enlace.",
      ],
      example:
        "Alguien te escribe en un chat de soporte: \"Veo el problema en tu cuenta; solo pega tu clave secreta para que restablezca el acceso.\" En el instante en que la pegas, firman una transferencia y cada moneda desaparece, sin forma de deshacerlo. La respuesta correcta es no compartir nada, salir del chat y denunciarlo: ningún servicio legítimo pedirá jamás esa clave.",
    },
    {
      id: "c17-l4",
      title: "¿Qué significa \"tus claves, tus cripto\"?",
      paragraphs: [
        "\"Tus claves, tus cripto\" es un dicho que resume toda la idea de la autocustodia: si guardas tú mismo las claves secretas, posees y controlas de verdad tus monedas. Nadie puede congelarlas, quitártelas ni impedirte moverlas, porque la red solo obedece a quien firma con la clave.",
        "La otra cara es la advertencia: \"si no son tus claves, no son tus cripto\". Cuando dejas monedas en un exchange o en un servicio que guarda las claves por ti (lo que se llama custodia por terceros) no las controlas de verdad. Estás confiando en que esa empresa honre tu retiro. Si congela cuentas, quiebra o sufre un hackeo, tu acceso puede esfumarse aunque las monedas fueran \"tuyas\".",
        "La autocustodia te entrega el control y la responsabilidad juntos. No hay línea de soporte para recuperar una clave perdida, así que la seguridad de tus fondos depende de lo bien que protejas esa clave. Ese equilibrio (control total a cambio de responsabilidad total) es el corazón de guardar tus propias cripto.",
      ],
      example:
        "Dos personas \"poseen\" 100 monedas cada una. Una las tiene en un exchange que guarda las claves; la otra las tiene en una billetera cuya clave secreta solo ella conoce. Una mañana el exchange suspende los retiros: la primera persona no puede tocar sus monedas y solo le queda esperar y confiar. La segunda firma una transferencia y mueve sus monedas con libertad, porque sus claves son suyas. Esa es la diferencia que señala el dicho.",
    },
    {
      id: "c17-l5",
      title: "Cómo guardar tu clave secreta de forma segura sin conexión",
      paragraphs: [
        "El lugar más seguro para una clave secreta es sin conexión, lejos de cualquier cosa conectada a internet. Todo lo que está en línea puede, en principio, ser alcanzado por un atacante, así que el objetivo es guardar la clave en algo que no se pueda hackear a través de una red: lo más simple, en papel.",
        "Trata la clave escrita como la llave física de tu casa. No pegarías la llave de tu casa en la puerta de entrada ni publicarías una foto de ella en línea, y aquí aplica la misma cautela. Escribe la clave (o la frase semilla) en papel, guárdala en un lugar privado y seguro, y considera una segunda copia en otro sitio seguro por si la primera se pierde o se daña.",
        "Igual de importante es saber adónde nunca debe ir la clave. Nunca la guardes en una captura de pantalla, en tu galería de fotos, en el correo, en notas que se sincronizan con la nube ni en un chat contigo mismo: todo eso puede ser hackeado, filtrado o sincronizado a un dispositivo que ya no controlas. Para cantidades mayores, una billetera de hardware mantiene la clave en un dispositivo dedicado sin conexión y firma sin exponerla nunca.",
      ],
      example:
        "Un enfoque cuidadoso: escribe tu clave secreta a mano en una hoja de papel, séllala y guárdala bajo llave en un cajón o una caja fuerte en casa, quizá con una segunda copia en casa de un familiar de confianza. Un enfoque arriesgado: hazle una foto a la clave \"para no perderla\". Esa foto se sube en silencio a tu copia de seguridad en la nube, y en cuanto esa cuenta es vulnerada, tu billetera se va con ella.",
    },
    {
      id: "c17-l6",
      title: "Orientarte en la app y recibir fondos",
      paragraphs: [
        "La app se organiza en torno a un menú lateral a la izquierda que te permite saltar entre sus páginas: Operar, Recibir y enviar, Pagos pendientes, Registros y la Academia. En el móvil ese menú está oculto: toca el icono ☰ (el menú de hamburguesa) en la esquina para desplegarlo, elige una página y se vuelve a cerrar. La Academia está debajo de un separador, apartada de las páginas de operaciones, porque es el lugar al que vienes a aprender, no a operar, y nunca te pide iniciar sesión.",
        "Para recibir fondos, abre \"Recibir y enviar\" desde el menú. Allí verás la dirección pública de tu billetera —la misma dirección G... de las lecciones anteriores— junto con un código QR. Puedes copiar la dirección y enviársela a quien te vaya a pagar, o dejar que apunte la cámara de su app de billetera al código QR que aparece en tu pantalla.",
        "Un código QR no es nada más misterioso que un código de barras cuadrado: en este caso simplemente codifica tu dirección pública como un patrón de puntos. Como solo es el lado público de tu billetera, es completamente seguro mostrarlo, compartirlo, capturarlo o imprimirlo. Lo peor que alguien puede hacer con él es enviarte dinero. Bajo el código verás la etiqueta \"Escanea para enviar a esta billetera\", que le indica al remitente que apunte la cámara de su app hacia él.",
        "La única regla que nunca cambia viene directa de las lecciones anteriores: un código QR solo contiene tu dirección pública. Tu clave secreta nunca debe ir en un código QR, en una captura de pantalla ni en ningún sitio donde una cámara pudiera leerla. Si alguna vez una app o una persona te muestra un código QR diciendo que contiene una clave secreta o una frase semilla, considéralo una estafa y aléjate.",
      ],
      example:
        "Un amigo quiere enviarte algo de XLM. Abres \"Recibir y enviar\" en el menú (en el móvil, primero tocas ☰ para que aparezca) y tu dirección G... se muestra con un código QR bajo las palabras \"Escanea para enviar a esta billetera\". Tu amigo abre su propia app de billetera, apunta la cámara a tu pantalla y la dirección se rellena automáticamente: sin teclear, sin errores. Los fondos llegan y en ningún momento revelaste nada secreto.",
    },
  ],
  quiz: [
    {
      id: "c17-q1",
      prompt:
        "Alguien en un chat de soporte te pide tu clave secreta para \"arreglar\" tu cuenta. ¿Qué haces?",
      options: [
        {
          text: "Nunca la compartas: sal del chat y denúncialos; el soporte real nunca necesita tu clave secreta.",
          explanation:
            "Correcto. Quien pide tu clave secreta está intentando robar tus fondos. El soporte legítimo nunca la necesita, así que el único movimiento seguro es no compartir nada.",
        },
        {
          text: "Compártela, pero solo la primera mitad, por seguridad.",
          explanation:
            "No. Tu clave secreta nunca debe compartirse, ni entera ni en parte. No hay ninguna forma de entregarla que sea segura.",
        },
        {
          text: "Compártela, ya que se puede confiar en que el personal de soporte te ayude.",
          explanation:
            "No. Un \"soporte\" que pide tu clave secreta es la estafa clásica. El soporte real nunca la necesita, y entregarla les permite vaciar tu billetera al instante.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q2",
      prompt: "¿Qué clave puedes dar sin riesgo para que la gente te envíe monedas?",
      options: [
        {
          text: "Tu clave pública: como una dirección de buzón, está hecha para compartirse.",
          explanation:
            "Correcto. La clave pública (en Stellar empieza con G) es tu dirección. Compartirla solo permite que te envíen fondos.",
        },
        {
          text: "Tu clave secreta: la necesitan para enviarte dinero.",
          explanation:
            "No. Nadie necesita tu clave secreta para pagarte. La clave secreta solo gasta fondos, así que compartirla permite que alguien se lo lleve todo.",
        },
        {
          text: "Ambas claves, para que el pago llegue con seguridad.",
          explanation:
            "No. Solo se necesita la clave pública para recibir fondos. Tu clave secreta debe permanecer siempre privada.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q3",
      prompt: "¿Qué significa \"tus claves, tus cripto\"?",
      options: [
        {
          text: "Si guardas tú mismo las claves secretas, controlas de verdad tus monedas; si las guarda otro, estás confiando en esa empresa.",
          explanation:
            "Correcto. La autocustodia significa que el control recae en quien tiene las claves. Déjalas en un servicio y tu acceso depende de ese servicio.",
        },
        {
          text: "Tus claves hacen que las monedas valgan más dinero.",
          explanation:
            "No. Guardar tus propias claves es cuestión de control, no de valor. El precio de las monedas no tiene relación con quién tiene las claves.",
        },
        {
          text: "Deberías crear una clave nueva por cada moneda que tengas.",
          explanation:
            "No. El dicho trata de quién controla los fondos, no de crear una clave por moneda.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q4",
      prompt: "¿Dónde es más seguro guardar tu clave secreta?",
      options: [
        {
          text: "Sin conexión: escrita en papel en un lugar seguro, o en una billetera de hardware.",
          explanation:
            "Correcto. Mantener la clave sin conexión la deja fuera del alcance de los ataques por red. Las copias en papel y las billeteras de hardware son las opciones seguras habituales.",
        },
        {
          text: "En una captura de pantalla en la galería de fotos de tu teléfono.",
          explanation:
            "No. Las fotos se sincronizan con la nube y pueden ser hackeadas o filtradas. Una captura de tu clave es uno de los lugares más arriesgados para guardarla.",
        },
        {
          text: "En un correo a ti mismo para poder encontrarla siempre.",
          explanation:
            "No. El correo está en línea y puede ser vulnerado. Una clave en una bandeja de entrada queda expuesta a cualquiera que entre en esa cuenta.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q5",
      prompt:
        "Una web te pide que escribas tu frase semilla para \"verificar\" tu billetera. ¿Qué está pasando?",
      options: [
        {
          text: "Es una estafa de phishing: introducir la frase semilla le entrega al atacante el control total de tu billetera.",
          explanation:
            "Correcto. Las aplicaciones legítimas nunca te piden escribir tu frase semilla en una web. Hacerlo revela el secreto maestro y permite al atacante llevárselo todo.",
        },
        {
          text: "Es un paso de seguridad normal que todas las billeteras exigen.",
          explanation:
            "No. Escribir tu frase semilla en una web nunca es un paso normal: es el ataque clásico de phishing de frase semilla.",
        },
        {
          text: "No pasa nada mientras la web tenga aspecto profesional.",
          explanation:
            "No. Un aspecto pulido es justo la forma en que las estafas ganan confianza. La frase semilla nunca debe introducirse en ninguna web, sin importar cómo se vea.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q6",
      prompt:
        "¿Es seguro compartir el código QR de tu dirección pública para que alguien te pague?",
      options: [
        {
          text: "Sí: un código QR de tu dirección pública es seguro de mostrar, compartir o capturar; lo peor que alguien puede hacer con él es enviarte dinero.",
          explanation:
            "Correcto. El código QR solo codifica tu dirección pública (G...), que está hecha para compartirse. No puede usarse para gastar tus fondos.",
        },
        {
          text: "No: un código QR siempre contiene tu clave secreta, así que mostrarlo permite que cualquiera vacíe tu billetera.",
          explanation:
            "No. Tu código QR de recepción solo contiene la dirección pública. Tu clave secreta no debe ir nunca, de entrada, en un código QR.",
        },
        {
          text: "Solo si primero difuminas una parte del código.",
          explanation:
            "No. No hay nada que ocultar: un código QR de dirección pública es seguro de compartir entero. Difuminarlo solo haría que el pago no funcionara.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c17-q7",
      prompt: "¿Adónde vas en la app para recibir fondos?",
      options: [
        {
          text: "A la página \"Recibir y enviar\" del menú, donde se muestran tu dirección pública y su código QR.",
          explanation:
            "Correcto. \"Recibir y enviar\" muestra tu dirección pública y tu código QR, para que un remitente pueda copiar la dirección o escanear el código.",
        },
        {
          text: "A la Academia, después de aprobar el cuestionario de seguridad.",
          explanation:
            "No. La Academia solo sirve para aprender y nunca maneja fondos. Recibes fondos desde la página \"Recibir y enviar\".",
        },
        {
          text: "A la página de Registros, leyendo tu historial de transacciones.",
          explanation:
            "No. Los Registros solo muestran la actividad pasada. Para recibir fondos abre \"Recibir y enviar\" y comparte tu dirección o código QR.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
