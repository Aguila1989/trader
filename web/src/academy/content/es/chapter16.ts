import type { Chapter } from "../../types";

export const chapter16: Chapter = {
  id: "c16",
  number: 16,
  level: "ADVANCED",
  title: "Cómo funciona la autenticación por dentro",
  description:
    "Un vistazo a lo que ocurre detrás de la pantalla de inicio de sesión: qué es un JWT, por qué el token vive en una cookie httpOnly, cómo funciona el bloqueo de la cuenta y por qué tu sesión acaba caducando.",
  lessons: [
    {
      id: "c16-l1",
      title: "¿Qué es un JWT y cómo demuestra que has iniciado sesión?",
      paragraphs: [
        "HTTP tiene mala memoria: cada petición al servidor es independiente, así que algo tiene que recordarle al servidor, en cada petición, quién eres. Un JWT (JSON Web Token, o token web en formato JSON) es ese recordatorio. Cuando inicias sesión correctamente, el servidor crea un pequeño token que dice quién eres y cuándo caduca, y lo firma con un secreto que solo el servidor conoce.",
        "Piensa en un JWT como en la pulsera sellada de un festival. En la entrada enseñas tu identificación una sola vez; a cambio te dan una pulsera. A partir de ahí, el personal de cada escenario solo le echa un vistazo a la pulsera: no vuelve a comprobar tu identificación cada vez. El sello es difícil de falsificar, así que la propia pulsera es la prueba de que te dejaron entrar.",
        "La firma es el sello. El servidor puede mirar un token que le devuelven y verificar la firma para saber que él mismo emitió ese token y que nadie lo ha alterado, sin necesidad de guardar el contenido del token en ningún sitio. Si se cambia aunque sea un solo carácter del token, la firma ya no coincide y el token se rechaza.",
      ],
      example:
        "Después de iniciar sesión, tu token contiene, a grandes rasgos: \"usuario = tú, emitido = 3pm, caduca = 3pm de mañana\", más una firma. En tu siguiente clic el navegador lo reenvía; el servidor comprueba la firma, ve que es válida y no ha caducado, y te muestra tus datos, sin pedir la contraseña de nuevo.",
    },
    {
      id: "c16-l2",
      title: "¿Qué es una cookie httpOnly y por qué es más segura que guardar un token en el navegador?",
      paragraphs: [
        "Una cookie es un pequeño fragmento de datos que el navegador guarda para un sitio y reenvía automáticamente en cada petición a ese sitio. Una cookie httpOnly tiene un indicador especial que le dice al navegador: entrégasela al servidor, pero nunca dejes que el JavaScript de la página la lea.",
        "Ese indicador lo es todo. Si un token se guarda en un lugar que JavaScript puede leer, como localStorage, entonces un único script malicioso o defectuoso en la página podría leer el token y enviárselo a un atacante (un ataque llamado XSS). Un token dentro de una cookie httpOnly no puede ser leído por ningún script, así que ni siquiera un script que se cuele en la página puede robar tu sesión.",
        "Las cookies que viajan automáticamente plantean otro riesgo distinto: otro sitio podría intentar que tu navegador lance una petición usando tu cookie (lo que se llama CSRF). La aplicación lo bloquea comprobando de dónde procede cada petición que cambia el estado y marcando la cookie como \"same-site\", de modo que el navegador no la adjunte a peticiones iniciadas por otros sitios.",
      ],
      example:
        "Dos formas de guardar el mismo token. En localStorage: un script de anuncios malicioso ejecuta `localStorage.getItem('token')` y lo envía por correo: fin de la partida. En una cookie httpOnly: ese mismo script se ejecuta y no obtiene nada, porque el navegador se niega rotundamente a revelarle la cookie a JavaScript.",
    },
    {
      id: "c16-l3",
      title: "¿Qué es el bloqueo de la cuenta y por qué te protege?",
      paragraphs: [
        "El bloqueo de la cuenta limita cuántas veces seguidas alguien puede intentar adivinar tu contraseña. Tras un número determinado de intentos fallidos (cinco en esta aplicación) la cuenta se bloquea temporalmente durante un periodo de espera (quince minutos), durante el cual se rechaza incluso la contraseña correcta.",
        "Esto frustra los ataques de \"fuerza bruta\": un programa que prueba miles de contraseñas por segundo hasta que una funciona. Con el bloqueo, un atacante solo dispone de un puñado de intentos antes de verse obligado a esperar, lo que convierte un ataque de unos minutos en uno que tardaría años. Cada intento fallido también queda registrado con su hora y su dirección de origen, así que las ráfagas sospechosas se ven a simple vista.",
        "Aquí hay un equilibrio delicado. El bloqueo debe detener a quien adivina sin que pueda bloquearte a TI a propósito, y sin revelar siquiera si un correo está registrado. Por eso se muestra el mensaje genérico \"correo o contraseña no válidos\" ante los intentos erróneos, y el aviso de bloqueo solo aparece para alguien que en realidad tiene la contraseña correcta: el verdadero propietario.",
      ],
      example:
        "Un atacante programa 1.000 intentos de contraseña contra tu cuenta. Tras el quinto intento erróneo la puerta se cierra durante quince minutos, así que en una hora logra solo unos veinte intentos en lugar de millones. El ataque se vuelve desesperadamente lento, y el registro muestra un muro de fallos procedentes de una misma dirección.",
    },
    {
      id: "c16-l4",
      title: "¿Qué es la caducidad de la sesión y por qué se cierra tu inicio de sesión?",
      paragraphs: [
        "Toda sesión lleva una caducidad incorporada en el token desde el momento del inicio de sesión. Por defecto, esta aplicación emite un token que dura 24 horas; si marcas \"Recordarme\", dura 30 días en su lugar. Una vez pasado ese momento, el token deja de aceptarse y se te pide que inicies sesión de nuevo.",
        "La caducidad limita el daño si un token llega a quedar expuesto. Un token eterno sería una llave permanente; un token que caduca es una llave que deja de funcionar por sí sola, de modo que una copia tomada de una sesión abandonada queda inservible una vez que se cierra la ventana de tiempo. Es la versión digital de la tarjeta-llave de un hotel que se desactiva al hacer el check-out.",
        "Cerrar sesión no se limita a esperar a la caducidad: revoca la sesión en el servidor de inmediato, así que el token se rechaza desde ese mismo instante aunque aún no haya llegado su hora de caducidad. Restablecer tu contraseña hace lo mismo con todas las sesiones, y por eso un restablecimiento es la forma más rápida de echar a cualquiera que no debería estar ahí.",
      ],
      example:
        "Inicias sesión en un portátil compartido sin marcar \"Recordarme\" y olvidas cerrar sesión. El token de 24 horas caduca discretamente durante la noche, así que por la mañana ese navegador ya no puede acceder a tu cuenta. Si hubieras pulsado Cerrar sesión, el acceso se habría cortado en el momento en que te fuiste, y un restablecimiento de contraseña habría terminado todas las sesiones en todas partes de golpe.",
    },
  ],
  quiz: [
    {
      id: "c16-q1",
      prompt: "¿Qué es un JWT, según la analogía de la pulsera del festival?",
      options: [
        {
          text: "Un token firmado que recibes después de iniciar sesión una vez, y que el servidor vuelve a comprobar en cada petición en lugar de pedirte la contraseña de nuevo.",
          explanation:
            "Correcto. Como una pulsera sellada, el token firmado demuestra que te dejaron entrar, así que el servidor no necesita verificar tu contraseña cada vez.",
        },
        {
          text: "Tu contraseña, enviada de nuevo en cada petición.",
          explanation:
            "No. La clave es precisamente que tu contraseña se comprueba una sola vez; el token la sustituye después.",
        },
        {
          text: "Una lista de todas las páginas que has visitado.",
          explanation: "No. Un JWT lleva quién eres y cuándo caduca, no un historial de navegación.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q2",
      prompt: "¿Por qué es más seguro guardar el token de sesión en una cookie httpOnly que en localStorage?",
      options: [
        {
          text: "El JavaScript de la página no puede leer una cookie httpOnly, así que un script malicioso (XSS) no puede robar el token.",
          explanation:
            "Correcto. El indicador httpOnly oculta la cookie a todos los scripts de la página, eliminando la forma más común de robar un token.",
        },
        {
          text: "Las cookies httpOnly hacen que la aplicación cargue más rápido.",
          explanation: "No. Es una propiedad de seguridad, no de rendimiento.",
        },
        {
          text: "localStorage está cifrado y las cookies no.",
          explanation:
            "No. La diferencia está en el acceso de lectura por parte de los scripts, no en el cifrado: localStorage es perfectamente legible por cualquier script de la página.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q3",
      prompt: "¿Cómo te protege el bloqueo de la cuenta?",
      options: [
        {
          text: "Bloquea más intentos tras varias contraseñas erróneas, haciendo poco práctico adivinar a la fuerza y a toda velocidad.",
          explanation:
            "Correcto. Un breve bloqueo tras unos pocos fallos convierte millones de intentos posibles por hora en un puñado minúsculo.",
        },
        {
          text: "Elimina tu cuenta tras una sola contraseña errónea.",
          explanation:
            "No. El bloqueo es una pausa temporal tras varios fallos, no la eliminación tras uno solo.",
        },
        {
          text: "Te envía tu contraseña por correo cuando fallas.",
          explanation:
            "No. Las contraseñas nunca se envían por correo (ni siquiera se guardan en formato legible); el bloqueo simplemente ralentiza los intentos de adivinarla.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c16-q4",
      prompt: "¿Por qué tu sesión de inicio de sesión acaba caducando?",
      options: [
        {
          text: "Para que un token expuesto u olvidado deje de funcionar por sí solo tras un periodo determinado, limitando el daño.",
          explanation:
            "Correcto. La caducidad es como la tarjeta-llave de un hotel que se desactiva al hacer el check-out: un token filtrado queda inservible una vez que se cierra la ventana de tiempo.",
        },
        {
          text: "Porque el servidor se queda sin espacio para guardar sesiones.",
          explanation:
            "No. La caducidad es un límite de seguridad deliberado, no un problema de almacenamiento: la duración se fija en el propio token.",
        },
        {
          text: "Para obligarte a cambiar la contraseña todos los días.",
          explanation:
            "No. Caducar te pide volver a iniciar sesión; no exige una contraseña nueva.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
