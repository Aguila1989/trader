import type { Chapter } from "../../types";

export const chapter19: Chapter = {
  id: "c19",
  number: 19,
  level: "BASIC",
  title: "¿Qué es una trustline y deberías añadir una?",
  description: "Las trustlines explicadas en lenguaje sencillo: qué son, por qué cuestan 0,5 XLM, los riesgos reales, cómo investigar un token antes y cómo eliminar una después.",
  lessons: [
    {
      id: "c19-l1",
      title: "¿Qué es una trustline?",
      paragraphs: [
        "En Stellar tu cuenta tiene XLM de forma predeterminada, pero no puede tener ningún otro token hasta que te suscribas a él de forma explícita. Esa suscripción se llama trustline. Imagínala como darle permiso a una tienda concreta para colocar artículos en tu billetera: tú eliges exactamente en qué tiendas confías, y nada más puede meter nada sin tu consentimiento.",
        "Una trustline nombra un token con precisión: su código de activo más la cuenta que lo emite (el issuer). Añadir la trustline significa \"estoy dispuesto a tener esta versión de este token de este emisor en concreto\". No compra el token, no te cuesta el precio del token y no le da al emisor acceso a tus XLM. Simplemente abre un hueco para que el token pueda llegar.",
        "Hasta que existe una trustline, cualquiera que intente enviarte ese token, o cualquier operación que lo entregue, simplemente falla. Por eso añadir una trustline es el primer paso necesario antes de poder recibir, comprar o intercambiar un activo que no sea XLM, y elegir qué trustlines abrir es elegir con qué emisores estás dispuesto a tratar.",
      ],
      example: "Quieres tener USDC. Antes de poder recibir una sola unidad, tu cuenta necesita una trustline a USDC emitido por la cuenta emisora concreta de Circle. Una vez que esa trustline existe, el USDC puede llegar a tu billetera. Sin ella, un amigo que intente enviarte 10 USDC recibe un error y el pago nunca llega.",
    },
    {
      id: "c19-l2",
      title: "¿Por qué añadir una trustline cuesta 0,5 XLM?",
      paragraphs: [
        "Añadir una trustline no gasta 0,5 XLM, los reserva. Stellar exige que cada cuenta mantenga un saldo mínimo, y cada trustline que abres eleva ese mínimo en 0,5 XLM. Esos 0,5 XLM siguen siendo tuyos; simplemente quedan bloqueados y no se pueden gastar ni enviar mientras la trustline esté abierta.",
        "Esta reserva existe para frenar el spam. Como cada trustline cuesta saldo bloqueado, nadie puede crear de forma barata millones de entradas vacías para saturar la red. Mantiene el ledger ligero y hace que cada trustline sea un compromiso pequeño y deliberado, en lugar de algo que repartes sin pensar.",
        "La consecuencia práctica: abrir muchas trustlines bloquea XLM reales. Diez trustlines reservan 5 XLM que ya no puedes mover. Cuando cierras una trustline que ya no necesitas, esos 0,5 XLM se liberan de vuelta a tu saldo disponible.",
      ],
      example: "Tu cuenta tiene 20 XLM sin trustlines. Añades una trustline a USDC y otra a AQUA. Tu mínimo reservado sube en 1 XLM (0,5 cada una), así que ahora solo unos 19 XLM menos la reserva base quedan disponibles. Elimina la trustline de AQUA más adelante y se liberan 0,5 XLM.",
    },
    {
      id: "c19-l3",
      title: "¿Cuáles son los riesgos de añadir una trustline?",
      paragraphs: [
        "Una trustline te vincula a un emisor, y no todos los emisores son de fiar. El peligro clásico es el rug pull: un proyecto atrae a poseedores (holders), luego el emisor acuña una avalancha de tokens nuevos o retira la liquidez, y el precio se desploma a la nada. Tu trustline no causó esto, pero es lo que te permitió tener el token que quedó sin valor.",
        "Los emisores anónimos son una señal de alarma especial. Si no puedes saber quién dirige el proyecto, quién controla la clave de emisión, o si la oferta puede inflarse a voluntad, estás confiando en un desconocido sin ninguna responsabilidad. Muchos tokens sin valor son clones fraudulentos que copian el código de un activo conocido pero usan un emisor distinto, controlado por el atacante.",
        "Una trustline en sí no puede vaciar tus XLM ni tus otros tokens; esa parte es segura. El riesgo tiene que ver por completo con el valor del token que eliges tener y con la conducta de su emisor. El único coste directo es la reserva de 0,5 XLM, que recuperas cuando cierras la trustline.",
      ],
      example: "Aparece un token llamado \"USDC\" con un rendimiento anunciado enorme, pero su cuenta emisora es totalmente nueva, no tiene sitio web y podría acuñar una oferta ilimitada. Añades la trustline y compras. Una semana después el emisor acuña diez millones de unidades más y las vende de golpe; el precio cae un 99%. Tus XLM nunca corrieron riesgo, pero los tokens que compraste ahora no valen casi nada.",
    },
    {
      id: "c19-l4",
      title: "Cómo investigar un token antes de añadir una trustline",
      paragraphs: [
        "Empieza por la identidad del emisor. Un token creíble publica un archivo stellar.toml en su dominio principal que nombra a la organización, enlaza su sitio web y lista la cuenta emisora exacta. Si no existe ese archivo, ni dominio, ni forma de identificar quién está detrás, considéralo un motivo de peso para mantenerte alejado.",
        "Después fíjate en la liquidez y la adopción. ¿Cuántas cuentas ya tienen una trustline a ese token? ¿Hay volumen real de operaciones frente a XLM, o el order book está vacío? Un token con miles de holders y volumen constante es algo muy distinto de uno con un puñado de holders y sin operaciones. El escaneo semanal de trustlines de la app te resume exactamente estas señales.",
        "Por último, sé escéptico ante la urgencia y las promesas desmesuradas. Los rendimientos altos garantizados, los temporizadores con cuenta atrás y la presión por añadir la trustline \"antes de que sea demasiado tarde\" son manipulación clásica. Un token sólido no necesita meterte prisa, así que tómate el tiempo para verificar el emisor y las cifras por ti mismo.",
      ],
      example: "Antes de confiar en un token nuevo, abres su dominio principal y encuentras un stellar.toml que lista el proyecto, su sitio web y la clave del emisor, y coincide con el emisor que te dieron. También ves que tiene 8.000 holders y un order book de XLM saludable. Eso encaja. Un segundo token no tiene dominio, tiene 12 holders y ninguna operación; lo rechazas.",
    },
    {
      id: "c19-l5",
      title: "Cómo eliminar una trustline que ya no quieres",
      paragraphs: [
        "Nunca te quedas atrapado con una trustline. Eliminar una cierra el hueco y libera la reserva de 0,5 XLM de vuelta a tu saldo disponible. En esta app eliminas una trustline desde el panel de Trustlines: cada token que tienes muestra un botón Eliminar a su lado.",
        "Hay una regla: solo puedes eliminar una trustline cuando tu saldo de ese token es exactamente cero. Stellar no te dejará cerrar una trustline mientras sigas teniendo el token, porque eso dejaría el saldo varado. Así que primero vende o transfiere el token hasta dejarlo en cero, y entonces el botón Eliminar queda disponible.",
        "Eliminar una trustline es un paso de mantenimiento normal y reversible. Si cambias de opinión más adelante, simplemente puedes volver a añadir la trustline (pagando otra vez la reserva de 0,5 XLM). Cerrar trustlines sin usar es buena práctica: libera XLM reservados y reduce la lista de emisores a los que estás expuesto.",
      ],
      example: "Tienes 0 de un token que ya no quieres pero aún mantienes su trustline abierta. En el panel de Trustlines su botón Eliminar está activo, así que haces clic; la trustline se cierra y 0,5 XLM vuelven a tu saldo disponible. Otro token todavía muestra un saldo de 30, así que su botón Eliminar está desactivado hasta que vendas esos 30 hasta cero.",
    },
  ],
  quiz: [
    {
      id: "c19-q1",
      prompt: "¿Qué hace realmente añadir una trustline?",
      options: [
        { text: "Compra el token por ti al precio de mercado actual.", explanation: "Incorrecto. Una trustline no compra nada; solo permite que tu cuenta tenga el token. Aún tienes que adquirirlo por separado." },
        { text: "Suscribe tu cuenta para poder tener un token específico de un emisor específico.", explanation: "Correcto. Una trustline nombra un token y su emisor y abre un hueco para que ese token pueda recibirse, comprarse o intercambiarse." },
        { text: "Le da al emisor del token permiso para gastar tus XLM.", explanation: "Incorrecto. Una trustline nunca concede a nadie acceso a tus XLM ni a otros tokens; solo te permite tener el activo nombrado." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q2",
      prompt: "¿Qué ocurre con los 0,5 XLM cuando añades una trustline?",
      options: [
        { text: "Se pagan al emisor del token como comisión.", explanation: "Incorrecto. El emisor no recibe nada. Los 0,5 XLM no son un pago." },
        { text: "Se gastan de forma permanente y no se pueden recuperar.", explanation: "Incorrecto. No se gastan: se reservan, y los recuperas cuando cierras la trustline." },
        { text: "Se reservan (se bloquean) en tu propia cuenta y se liberan de nuevo si eliminas la trustline.", explanation: "Correcto. Cada trustline eleva tu saldo mínimo en 0,5 XLM; el importe sigue siendo tuyo pero queda bloqueado hasta que se cierra la trustline." },
      ],
      correctIndex: 2,
    },
    {
      id: "c19-q3",
      prompt: "¿Cuál de estas es una verdadera señal de alarma antes de añadir una trustline?",
      options: [
        { text: "El emisor publica un stellar.toml con su nombre, sitio web y clave de emisión.", explanation: "Incorrecto. Eso es una buena señal: te permite identificar y verificar quién está detrás del token." },
        { text: "El emisor es anónimo, no tiene sitio web y la oferta podría inflarse a voluntad.", explanation: "Correcto. Un emisor imposible de identificar con una oferta sin tope es la receta clásica de un rug pull; no hay ninguna responsabilidad si algo sale mal." },
        { text: "El token tiene miles de holders y un order book de XLM constante.", explanation: "Incorrecto. La adopción real y la liquidez son señales tranquilizadoras, no de advertencia." },
      ],
      correctIndex: 1,
    },
    {
      id: "c19-q4",
      prompt: "¿Cuándo puedes eliminar una trustline que ya no quieres?",
      options: [
        { text: "Solo cuando tu saldo de ese token es exactamente cero.", explanation: "Correcto. Stellar se niega a cerrar una trustline mientras sigas teniendo el token, así que primero lo vendes o transfieres hasta cero; entonces se libera la reserva de 0,5 XLM." },
        { text: "En cualquier momento, incluso con un saldo grande todavía retenido.", explanation: "Incorrecto. Un saldo distinto de cero bloquea la eliminación, porque cerrarla dejaría los tokens varados." },
        { text: "Nunca: una vez añadida, una trustline es permanente.", explanation: "Incorrecto. Las trustlines son reversibles; puedes eliminar una (con saldo cero) e incluso volver a añadirla más adelante." },
      ],
      correctIndex: 0,
    },
  ],
};
