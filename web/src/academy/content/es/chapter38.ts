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
    {
      id: "c38-l2",
      title: "¿Cuál es la diferencia entre Gratis y Premium?",
      paragraphs: [
        "Con Gratis ya tienes acceso a casi todo lo que la aplicación puede hacer. El trading manual es de acceso completo, sin nada recortado: puedes colocar, cancelar y modificar órdenes, y fijar un stop-loss o un trailing stop para proteger una posición mientras estás fuera. El escáner de liquidez también es gratuito, para que puedas comprobar con qué facilidad se negocia un token antes de comprometerte con él, y el auto-swap a XLM está disponible para convertir automáticamente tokens sueltos de vuelta a tu activo base. Toda la Academy, cada capítulo y cada cuestionario, es gratis en todos los niveles. Lo único que Gratis no incluye es el trading con IA.",
        "Premium desbloquea dos cosas. Primero, el propio trading con IA: al suscribirte puedes activar la IA y controlarla con ajustes por factor de riesgo, de modo que opera dentro de los límites que tú elijas en lugar de funcionar como un interruptor de todo o nada. Segundo, Premium reduce tus comisiones de trading en cada tramo de volumen, además de lo que el propio trading con IA pueda aportar a tus resultados. Premium se cobra a 10 € al mes, o 96 € al año, un ahorro de aproximadamente el 20% frente a pagar mes a mes. Para que la IA realmente opere también necesitarás tu propia clave API de un proveedor de IA como Anthropic u OpenAI, algo que se explica en un capítulo posterior; ese proveedor de IA te cobra por separado lo que la propia IA consuma, además de tu suscripción a Atrium.",
        "Cada operación en la plataforma, manual o por IA, paga una pequeña comisión porcentual, y ese porcentaje depende de tu tramo de volumen. Tu tramo se recalcula a diario según tu volumen de trading en la plataforma durante el mes natural anterior, así que puede subir o bajar conforme cambia tu actividad: Bronce es menos de 5.000 XLM de volumen mensual, Plata es 5.000-20.000, Oro es 20.000-50.000, y Platino es más de 50.000. Dentro de cada tramo, Gratis paga el porcentaje más alto, el trading manual Premium paga menos, y el trading con IA Premium paga el más bajo de todos. Toda cuenta nueva empieza en Bronce. No hay una comisión mínima en términos absolutos, pero las operaciones menores de 1 XLM no cuentan para construir tu tramo, aunque sí pagan la comisión de ese tramo igualmente.",
        "Es como una suscripción a un gimnasio: cuanto más lo usas, más barata sale cada visita. A un trader con mucho volumen se le trata como a alguien que va mucho al gimnasio y paga un porcentaje menor por operación solo por presentarse más a menudo, y una suscripción Premium es la tarifa de socio por encima de eso: un descuento adicional en cada tramo.",
        "Como regla general, si operas más de unos 500 € al mes, el simple ahorro en comisiones de Premium suele cubrir de sobra el coste mensual de 10 €, incluso antes de contar lo que el trading con IA pueda añadir.",
      ],
      example:
        "Supongamos que en un mes operas un volumen de 8.000 XLM: eso te sitúa en el tramo Plata. Como usuario Gratis, tus operaciones ese mes cuestan un 0,23% cada una. Si pasas a Premium y operas manualmente con el mismo volumen, la comisión baja a 0,16% por operación; si dejas que la IA opere por ti en Plata, baja aún más, a 0,12%. El tramo se reevalúa a diario según el volumen del mes anterior, así que si al mes siguiente operas 25.000 XLM, subes a Oro y los porcentajes vuelven a bajar, seas Gratis o Premium.",
    },
    {
      id: "c38-l3",
      title: "¿Qué hace el interruptor de emergencia?",
      paragraphs: [
        "El interruptor de emergencia rojo en el encabezado pausa al instante toda la actividad del bot. Al pulsarlo se abre un diálogo de confirmación que enumera todas las consecuencias, y el botón de confirmar permanece desactivado durante dos segundos para que un clic accidental no pueda activarlo por error.",
        "Varias cosas se detienen en el momento en que se activa. El bucle de trading por IA deja de generar nuevas propuestas por completo. Cualquier propuesta de operación de la IA que aún estuviera esperando tu aprobación se cancela de inmediato. El monitor de stop-loss deja de dispararse, lo que significa que los stop-loss activos NO se activarán hasta que reactives. Y los escáneres en segundo plano, tanto el escáner de liquidez como el escáner de trustlines por IA, se pausan junto con todo lo demás.",
        "⚠ ADVERTENCIA — el matiz más peligroso de todos: mientras el interruptor de emergencia esté activado, tus stop-loss NO se ejecutan. Si el mercado se mueve en contra de una posición abierta, nada la cerrará automáticamente. No trates el interruptor de emergencia como una red de seguridad para tus posiciones abiertas; para todo lo que depende de un stop-loss, es justo lo contrario.",
        "Igual de importante es lo que sigue funcionando. Cualquier orden que ya tuvieras abierta en la red Stellar permanece activa y en el libro de órdenes hasta que la canceles tú mismo en Órdenes activas; el interruptor de emergencia no toca la red directamente. Tus ajustes de stop-loss no se eliminan, solo se pausan; se mantienen exactamente como los configuraste y se reanudan en cuanto reactives. Tu cartera y tus fondos quedan completamente intactos. Y el trading manual sigue estando totalmente disponible: el modo de solo lectura te sigue permitiendo operar a mano, ya que el interruptor de emergencia solo rige al bot.",
        "El interruptor de emergencia también es duradero: una vez activado, permanece encendido incluso si el servidor se reinicia, y seguirá así hasta que tú lo reactives deliberadamente. No se restablece a escondidas por sí solo.",
        "Recurre a él cuando algo no te parezca correcto —operaciones inesperadas, condiciones de mercado inusuales, o simplemente para tomarte un momento para pensar—, cuando te vayas a ausentar y no quieras que el bot actúe sin ti, o durante cualquier tipo de incidente. Trátalo como un botón de pausa, no como un borrado de emergencia: congela al bot donde está en lugar de deshacer nada de lo que ya haya ocurrido.",
        "Reactivarlo es tan deliberado como activarlo. Un aviso de 'Bot en pausa' permanece visible en pantalla todo el tiempo que esté activo; toca el aviso y confirma, y el bucle de la IA, el monitor de stop-loss y los escáneres en segundo plano se reanudan todos a la vez.",
      ],
      example:
        "Notas que la IA propone operaciones que parecen fuera de lugar durante una hora de mucha volatilidad, así que pulsas el interruptor de emergencia, confirmas tras los dos segundos de espera, y todo se pausa: no hay nuevas propuestas de la IA, las pendientes se cancelan, el monitor de stop-loss queda en silencio, los escáneres se pausan. Tus órdenes ya abiertas en Stellar siguen en el libro de órdenes, así que cancelas tú mismo, manualmente, la que te genera dudas desde Órdenes activas. Dejas el interruptor de emergencia activado durante la noche y, aunque el servidor se reinicia para una actualización de rutina, vuelve a arrancar todavía en pausa. A la mañana siguiente tocas el aviso 'Bot en pausa', confirmas, y el bucle de la IA, el monitor de stop-loss y los escáneres vuelven a arrancar todos juntos.",
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
    {
      id: "c38-q4",
      prompt: "¿Cuál de estas funciones está disponible solo para suscriptores Premium?",
      options: [
        {
          text: "El trading con IA, con ajustes por factor de riesgo.",
          explanation:
            "Correcto. El trading con IA es la única función reservada a Premium. El trading manual, los stop-loss y trailing stops, el escáner de liquidez, el auto-swap a XLM y la Academy completa son todos gratuitos.",
        },
        {
          text: "El trading manual y los stop-loss.",
          explanation:
            "No. El trading manual, incluidos los stop-loss y trailing stops, está totalmente disponible con Gratis; nada de eso es exclusivo de Premium.",
        },
        {
          text: "La Academy.",
          explanation:
            "No. La Academy es gratuita para todos, en todos los niveles, tengas o no una suscripción Premium.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q5",
      prompt: "¿Qué determina en qué tramo de comisiones (Bronce, Plata, Oro, Platino) estás?",
      options: [
        {
          text: "Cuánto tiempo hace que creaste tu cuenta.",
          explanation:
            "No. La antigüedad de la cuenta no influye en tu tramo: una cuenta recién creada y una de varios años se evalúan igual, solo según el volumen.",
        },
        {
          text: "Tu volumen de trading en la plataforma durante el mes natural anterior, recalculado a diario.",
          explanation:
            "Correcto. Tu tramo se basa únicamente en cuánto operaste en la plataforma el mes natural anterior, y se recalcula cada día, por lo que puede subir o bajar según cambie tu volumen.",
        },
        {
          text: "Haber hecho un pago puntual para desbloquear un tramo superior.",
          explanation:
            "No. No existe forma de comprar un tramo directamente: los tramos surgen solo del volumen de trading real, y una suscripción Premium cambia el porcentaje que pagas dentro de un tramo, no en qué tramo estás.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c38-q6",
      prompt: "Activas el interruptor de emergencia. ¿Cuál de estas cosas sigue funcionando exactamente igual que antes?",
      options: [
        {
          text: "Las órdenes que ya tenías abiertas en la red Stellar: siguen activas en el libro de órdenes.",
          explanation:
            "Correcto. El interruptor de emergencia pausa el bot, no la red. Las órdenes que ya habías colocado se quedan en el libro de órdenes hasta que las canceles tú mismo en Órdenes activas.",
        },
        {
          text: "Tus stop-loss activos: siguen disparándose con normalidad.",
          explanation:
            "No. Esta es justo la parte peligrosa: el monitor de stop-loss deja de dispararse mientras el interruptor de emergencia está activado, así que los stop-loss activos NO se activarán hasta que reactives.",
        },
        {
          text: "El bucle de trading por IA: sigue proponiendo nuevas operaciones para que las apruebes.",
          explanation:
            "No. El bucle de trading por IA deja de generar nuevas propuestas por completo, y las que aún estuvieran esperando aprobación se cancelan de inmediato.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c38-q7",
      prompt: "Activas el interruptor de emergencia y unas horas después el servidor se reinicia. ¿Sigue activado después?",
      options: [
        {
          text: "No: un reinicio del servidor lo desactiva automáticamente, y el bot se reanuda por sí solo.",
          explanation:
            "No. El interruptor de emergencia no se restablece a escondidas por sí solo con un reinicio; eso anularía todo su propósito.",
        },
        {
          text: "Sí: sobrevive al reinicio y permanece activado hasta que tú lo reactives deliberadamente.",
          explanation:
            "Correcto. Una vez activado, el interruptor de emergencia sigue encendido incluso tras un reinicio del servidor, y solo se apaga cuando tocas el aviso 'Bot en pausa' y confirmas.",
        },
        {
          text: "Depende de cuántas órdenes estuvieran abiertas en el momento del reinicio.",
          explanation:
            "No. Las órdenes abiertas no afectan en nada al propio estado del interruptor de emergencia: permanece activado tras un reinicio sin importar qué más ocurra en tu cuenta.",
        },
      ],
      correctIndex: 1,
    },
  ],
};
