import type { Chapter } from "../../types";

export const chapter15: Chapter = {
  id: "c15",
  number: 15,
  level: "BASIC",
  title: "Iniciar sesión y mantenerte a salvo",
  description:
    "Por qué una app de trading necesita un inicio de sesión, qué hace que una contraseña sea fuerte, por qué comprobamos tu correo y qué hacer si alguna vez olvidas tu contraseña.",
  lessons: [
    {
      id: "c15-l1",
      title: "¿Por qué necesitas iniciar sesión en una app de trading?",
      paragraphs: [
        "El inicio de sesión es la forma en que la app se asegura de que tú, y solo tú, puedas acceder a tus datos de trading y a los controles de tu monedero. Sin él, cualquiera que abriera la página podría ver tu historial, cambiar tus ajustes o intentar mover fondos. El inicio de sesión es la puerta de entrada, y tu correo y tu contraseña son la llave.",
        "Piensa en tu inicio de sesión como la llave de tu propia taquilla. La taquilla guarda todo lo personal: tus operaciones, tus ajustes de riesgo, tus stop loss guardados. Mientras la llave esté contigo, nadie más podrá abrir la taquilla, aunque esté en la misma sala que las de todos los demás.",
        "Esto importa más en una app de trading que en la mayoría de los sitios web, porque la app puede llevar a cabo acciones reales con dinero real. Una puerta de entrada sólida es la primera y más importante capa de protección: mantiene a los desconocidos fuera incluso antes de que entren en juego las demás funciones de seguridad.",
      ],
      example:
        "Imagina que dejas tu ordenador en una cafetería durante dos minutos. Si la app no tuviera inicio de sesión, la persona de la mesa de al lado podría abrirla y empezar a hacer clic. Con un inicio de sesión, lo único que ven es una pantalla de acceso que pide un correo y una contraseña que no tienen: tu taquilla sigue cerrada.",
    },
    {
      id: "c15-l2",
      title: "¿Qué hace que una contraseña sea fuerte?",
      paragraphs: [
        "Una contraseña fuerte es larga y variada. Esta app pide al menos 12 caracteres, con al menos una letra mayúscula, una letra minúscula, un número y un carácter especial (como ! o @). La longitud es el factor más importante de todos: cada carácter adicional hace que un ataque por adivinación sea mucho más lento.",
        "El enemigo de una buena contraseña es lo predecible. Las palabras reales, los nombres, las fechas de nacimiento y los patrones sencillos como \"Password123!\" son lo primero que prueba un atacante. Una frase de contraseña (varias palabras sin relación entre sí unidas con un número y un símbolo) es a la vez fuerte y fácil de recordar.",
        "Nunca reutilices una contraseña que uses en otro sitio. Si otra web sufre una filtración y usaste aquí la misma contraseña, los atacantes la probarán también en tu cuenta de trading. Un gestor de contraseñas puede generar y recordar una contraseña fuerte y única para que no tengas que hacerlo tú.",
      ],
      example:
        "Débil: \"juan2024\": corta, un nombre y un año; adivinada en segundos. Más fuerte: \"Nutria-Valiente-Limon-7!\": cuatro palabras al azar, 20 caracteres, con un número y un símbolo. Es mucho más difícil de adivinar y, aun así, fácil de visualizar.",
    },
    {
      id: "c15-l3",
      title: "¿Qué es la verificación de correo y por qué es obligatoria?",
      paragraphs: [
        "La verificación de correo es una comprobación rápida de que la dirección de correo con la que te registraste es realmente tuya. Después de registrarte, la app envía un enlace de un solo uso a esa dirección; al hacer clic demuestras que puedes leer el correo enviado allí, y solo entonces se permite que tu cuenta inicie sesión.",
        "Esto te protege de dos maneras. Primera, impide que alguien cree una cuenta usando tu correo sin que tú lo sepas. Segunda, garantiza que la app tenga una dirección operativa para contactarte, que es justo la dirección a la que más adelante se enviaría un enlace para restablecer la contraseña.",
        "Si la app no se ha configurado para enviar correo, la verificación se omite para que puedas usarla igualmente, y se registra una nota de que este paso quedó desactivado. Cuando el correo sí está configurado, la verificación es obligatoria y tu cuenta queda en estado no verificado hasta que hagas clic en el enlace.",
      ],
      example:
        "Te registras con \"tu@ejemplo.com\". La app envía un enlace a esa bandeja de entrada. Hasta que abras la bandeja y hagas clic en él, al intentar iniciar sesión verás \"Verifica primero tu correo\". Una vez que haces clic, tu cuenta queda confirmada y puedes acceder con normalidad.",
    },
    {
      id: "c15-l4",
      title: "Qué hacer si olvidas tu contraseña",
      paragraphs: [
        "Olvidar una contraseña es algo normal y la app está preparada para ello. En la pantalla de inicio de sesión hay un enlace \"¿Olvidaste tu contraseña?\". Introduces tu correo y, si existe una cuenta asociada a él, la app envía un enlace de restablecimiento a esa dirección. Por privacidad, el mensaje que ves es el mismo tanto si el correo está registrado como si no, de modo que nunca revela quién tiene una cuenta.",
        "El enlace de restablecimiento es deliberadamente de corta duración: funciona durante una hora y una sola vez. En cuanto lo usas para establecer una nueva contraseña, el enlace deja de funcionar, así que un correo antiguo que quede en tu bandeja de entrada no puede reutilizarse. Tu nueva contraseña debe cumplir las mismas reglas de fortaleza que antes.",
        "Establecer una nueva contraseña también cierra cualquier otra sesión activa, así que si alguien se hubiera colado, el restablecimiento lo deja fuera. Si alguna vez recibes un correo de restablecimiento que no pediste, puedes ignorarlo con total tranquilidad: nada cambia a menos que el enlace se use de verdad.",
      ],
      example:
        "No recuerdas tu contraseña. Haces clic en \"¿Olvidaste tu contraseña?\", introduces tu correo y en menos de un minuto te llega un enlace. Lo abres, eliges \"Nutria-Valiente-Limon-7!\" como nueva contraseña y vuelves a entrar; y cualquier dispositivo que siguiera con la sesión iniciada queda cerrado por seguridad.",
    },
  ],
  quiz: [
    {
      id: "c15-q1",
      prompt: "¿Por qué necesita una app de trading un inicio de sesión?",
      options: [
        {
          text: "Para que solo tú puedas acceder a tus datos de trading y a los controles del monedero, como una llave de tu propia taquilla.",
          explanation:
            "Correcto. El inicio de sesión es la puerta de entrada: mantiene a todo el mundo, salvo a ti, fuera de tus datos y de los controles de tu dinero.",
        },
        {
          text: "Para que la app cargue más rápido.",
          explanation: "No. Un inicio de sesión tiene que ver con el acceso y la seguridad, no con la velocidad.",
        },
        {
          text: "Para que todos puedan compartir las mismas operaciones y ajustes.",
          explanation:
            "No. El objetivo es justo lo contrario: tus datos siguen siendo privados, no compartidos.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q2",
      prompt: "¿Cuál de estas es la contraseña más fuerte?",
      options: [
        {
          text: "\"Password123!\"",
          explanation:
            "No. Parece compleja, pero es uno de los primeros patrones que prueban los atacantes: una palabra común más un número y un símbolo obvios.",
        },
        {
          text: "\"Nutria-Valiente-Limon-7!\"",
          explanation:
            "Correcto. Es larga (20 caracteres), mezcla tipos de caracteres y está formada por palabras sin relación, por lo que es difícil de adivinar pero fácil de recordar.",
        },
        {
          text: "Tu nombre de pila y tu año de nacimiento",
          explanation:
            "No. Los nombres y las fechas son fáciles de encontrar o adivinar y dan lugar a una contraseña débil.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c15-q3",
      prompt: "¿Por qué te pide la app que verifiques tu correo después de registrarte?",
      options: [
        {
          text: "Para demostrar que la dirección es realmente tuya y que la app puede contactarte (por ejemplo, para restablecer la contraseña).",
          explanation:
            "Correcto. La verificación confirma que controlas la bandeja de entrada y le da a la app una dirección operativa para cosas como los enlaces de restablecimiento.",
        },
        {
          text: "Para enviarte publicidad.",
          explanation: "No. La verificación es una comprobación de seguridad y de contacto, no un paso de marketing.",
        },
        {
          text: "Para hacer tu contraseña más fuerte.",
          explanation:
            "No. Verificar tu correo no tiene nada que ver con lo fuerte que sea tu contraseña.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c15-q4",
      prompt: "Has olvidado tu contraseña. ¿Qué es cierto sobre el enlace de restablecimiento que envía la app?",
      options: [
        {
          text: "Funciona durante un tiempo limitado y una sola vez, y al usarlo se cierran las demás sesiones.",
          explanation:
            "Correcto. El enlace es de corta duración y de un solo uso, y establecer una nueva contraseña cierra cualquier otra sesión activa.",
        },
        {
          text: "Es permanente, así que puedes reutilizar el mismo enlace cada vez que vuelvas a olvidarla.",
          explanation:
            "No. El enlace caduca (aproximadamente en una hora) y deja de funcionar una vez usado; eso es lo que lo mantiene seguro.",
        },
        {
          text: "Te dice si el correo está registrado o no.",
          explanation:
            "No. Por privacidad, la respuesta es la misma en ambos casos, de modo que nunca revela quién tiene una cuenta.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
