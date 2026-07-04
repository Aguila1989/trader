// Capítulo 38: Primeros pasos con Atrium. Ver content/en/chapter38.ts para la
// nota estructural (traducción natural, no palabra por palabra).
import type { Chapter } from "../../types";

export const chapter38: Chapter & { whoFor: string } = {
  id: "c38",
  number: 38,
  level: "BASIC",
  whoFor: "Para cualquiera que abra Atrium por primera vez",
  title: "Primeros pasos con Atrium",
  description:
    "Un recorrido rápido por la aplicación: la barra lateral, tu cartera, los modos de trading, el trading Manual frente al del Bot, y dónde encontrar ayuda más adelante.",
  lessons: [
    {
      id: "c38-l1",
      title: "Cómo empezar con esta aplicación",
      paragraphs: [
        "La barra lateral izquierda es tu forma principal de moverte por la aplicación: Trading, Recibir y enviar, Pagos pendientes, Registros y la Academy están todos ahí. En una pantalla de escritorio o tableta permanece fija en el borde izquierdo, y puedes reducirla a solo iconos haciendo clic en la pequeña flecha de la parte superior, si quieres más espacio para la propia página. En un teléfono, la barra lateral está oculta de forma predeterminada y se convierte en un menú que se desliza: toca el botón ☰ para abrirla, y toca un enlace (o el fondo) para cerrarla de nuevo.",
        "En la parte superior de la aplicación, la sección de cartera en el encabezado siempre muestra el valor total de tu cartera, para que puedas comprobar cómo te va sin importar en qué página estés. Toca o haz clic en cualquier token que aparezca ahí y se abrirá la página de detalle de ese token, donde puedes ver su precio, tu posición y ajustes como los stop-loss.",
        "La página de Trading tiene dos pestañas, y conviene saber exactamente qué controla cada una. La pestaña Bot contiene el control de acceso al trading Solo lectura / Paper / Live. Este ajuste solo afecta a la IA, nunca a ti: en Solo lectura, la IA se limita a observar y solo tú puedes operar manualmente; en Paper, la IA simula operaciones sin que se mueva dinero real; en Live, la IA puede enviar órdenes reales on-chain. Live es el único modo con consecuencias reales para el bot, así que lee con atención la advertencia en pantalla antes de cambiar a él alguna vez: una orden en vivo no se puede deshacer.",
        "La pestaña Manual es donde tú colocas tus propias operaciones a mano. Las órdenes manuales nunca quedan a la espera de aprobación, sin importar qué modo de acceso al trading esté activo: en cuanto envías una operación manual, se ejecuta de inmediato (o, si el modo de acceso es Paper, se ejecuta como una operación simulada). En la pestaña Bot también está el trading por IA en sí: activar la IA y dejar que opere requiere una suscripción Premium, y además deberás aportar tu propia clave API para el proveedor de IA que quieras usar.",
        "La Academy —donde estás leyendo esto ahora mismo— es totalmente gratuita para todos, en todos los niveles, y ni siquiera necesitas haber iniciado sesión para usarla. Vuelve cuando quieras para repasar cualquier concepto.",
        "Por último, si alguna vez quieres volver a ver el recorrido interactivo de la aplicación, no hace falta que lo busques: abre Ajustes, ve a Cuenta y elige Reiniciar tutorial para verlo de nuevo desde el principio.",
      ],
      example:
        "Imagina tus primeros cinco minutos en la aplicación: echas un vistazo al encabezado y ves el valor total de tu cartera; en tu teléfono tocas ☰ para revisar la barra lateral y ves el enlace a la Academy; abres la pestaña Bot de la página de Trading y notas que el modo de acceso está en Solo lectura, así que vas a la pestaña Manual y colocas tú mismo una pequeña operación manual, que se ejecuta al instante; más tarde, si quieres refrescar la memoria, abres Ajustes → Cuenta → Reiniciar tutorial y vuelves a ver el recorrido desde el principio.",
    },
  ],
  quiz: [
    {
      id: "c38-q1",
      prompt: "¿Dónde está el control de acceso al trading Solo lectura / Paper / Live, y qué controla realmente?",
      options: [
        {
          text: "En la pestaña Bot de la página de Trading, y solo afecta a la IA: tus propias operaciones manuales siempre están permitidas.",
          explanation:
            "Correcto. El control de acceso al trading está en la pestaña Bot. Solo lectura impide que la IA opere, Paper deja que simule, y Live le permite enviar órdenes reales; pero el trading manual nunca queda bloqueado por este ajuste.",
        },
        {
          text: "En la barra lateral, y te bloquea el acceso a toda la aplicación hasta que elijas un modo.",
          explanation:
            "No. El control está en la pestaña Bot de la página de Trading, y nunca bloquea el trading manual ni ninguna otra parte de la aplicación.",
        },
        {
          text: "En la pestaña Manual, y decide si tus propias operaciones necesitan aprobación.",
          explanation:
            "No exactamente. El control está en la pestaña Bot y rige a la IA, no tus operaciones manuales. Las operaciones manuales se ejecutan siempre de inmediato, sin importar este ajuste.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q2",
      prompt: "Colocas una operación en la pestaña Manual. ¿Necesita aprobación antes de ejecutarse?",
      options: [
        {
          text: "Sí, cada operación manual espera un paso de aprobación aparte, igual que a veces ocurre con las operaciones de la IA.",
          explanation:
            "No. Las operaciones manuales nunca quedan en espera de aprobación; eso solo aplica a las propuestas generadas por la IA cuando el auto-trade está desactivado.",
        },
        {
          text: "No: tus propias operaciones manuales se ejecutan de inmediato (o como operación simulada en modo Paper), sin ningún paso de aprobación.",
          explanation:
            "Correcto. El trading manual es enteramente tuyo: lo que envías en la pestaña Manual pasa directo, de inmediato.",
        },
        {
          text: "Depende de si tienes una suscripción Premium.",
          explanation:
            "No. Una suscripción Premium es lo que se necesita para que la IA pueda operar; no afecta en nada a tus propias operaciones manuales, que siempre se ejecutan de inmediato.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q3",
      prompt: "Ya hiciste una vez el recorrido interactivo de la aplicación, pero quieres verlo de nuevo. ¿A dónde vas?",
      options: [
        {
          text: "Ajustes → Cuenta → Reiniciar tutorial.",
          explanation:
            "Correcto. El tutorial se puede reiniciar en cualquier momento desde la sección Cuenta dentro de Ajustes.",
        },
        {
          text: "La Academy, en un capítulo dedicado a 'Tutorial'.",
          explanation:
            "No exactamente. La Academy es un centro de aprendizaje gratuito independiente; el recorrido interactivo en sí se reinicia desde Ajustes → Cuenta, no desde un capítulo de la Academy.",
        },
        {
          text: "No hay forma de volver a verlo una vez que se ha cerrado.",
          explanation:
            "No. Siempre puedes volver a reproducirlo desde Ajustes → Cuenta → Reiniciar tutorial.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
