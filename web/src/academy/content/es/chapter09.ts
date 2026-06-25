import type { Chapter } from "../../types";

export const chapter09: Chapter = {
  id: "c9",
  number: 9,
  level: "ADVANCED",
  title: "Gestion del portafolio",
  description:
    "Lee el resumen de tu billetera, entiende los limites de trading y el drawdown, y juzga si tus operaciones realmente estan funcionando.",
  lessons: [
    {
      id: "c9-l1",
      title: "Que es el valor del portafolio y como se calcula?",
      paragraphs: [
        "El valor de tu portafolio es simplemente cuanto vale ahora mismo todo lo que tienes, sumado. La app lo calcula tomando cada posicion, multiplicando su saldo por el precio unitario actual de ese activo, y sumando los resultados de todas las posiciones. Como cada activo puede valorarse de dos formas, el encabezado muestra un total en XLM y un total en USDC, uno al lado del otro.",
        "Los precios vienen de los mercados en vivo de Stellar, asi que el valor se mueve cada vez que se mueven los mercados. La app vuelve a valorar con un temporizador, asi que los totales que ves son una foto reciente, no un numero congelado. Refrescar o esperar unos segundos puede cambiar la cifra aunque no hayas hecho nada.",
        "Una advertencia importante: algunos activos pueden no mostrar precio. Si no hay una ruta de trading en la red Stellar para convertir ese activo a XLM o USDC, la app no puede valorarlo, y esa posicion no aporta nada al total valorado. Trata esas posiciones como de valor desconocido, no como cero.",
      ],
      example:
        "Supongamos que tienes 1000 XLM y 50 USDC. Si 1 USDC vale 8.5 XLM, entonces tus USDC valen 425 XLM. Tu total en XLM es 1000 mas 425, o sea 1425 XLM. En el otro sentido, si 1 XLM vale cerca de 0.1176 USDC, tus 1000 XLM valen aproximadamente 117.6 USDC, asi que tu total en USDC es 117.6 mas 50, o sea unos 167.6 USDC. La misma riqueza, en dos monedas.",
    },
    {
      id: "c9-l2",
      title: "Como leer el resumen de la billetera en esta app",
      paragraphs: [
        "El resumen de la billetera esta en el encabezado del dashboard. Lista cada activo que tienes en una fila, mostrando el saldo que posees, el valor de ese saldo en XLM y el valor de ese saldo en USDC. Leyendo de izquierda a derecha en una fila ves cuanto tienes de un activo y cuanto vale en ambas monedas de referencia.",
        "Debajo o al lado de las filas encontraras los totales: valor total del portafolio en XLM y valor total del portafolio en USDC. Estas son las sumas descritas en la leccion anterior. Mira aqui primero para tener una idea de tu situacion general antes de entrar en detalle en cualquier posicion individual.",
        "Presta atencion a las filas donde falta un precio. Eso indica que ahora mismo no hay ruta de mercado para el activo, asi que su fila puede mostrar un saldo pero sin valor. No confundas un precio ausente con un activo sin valor; solo significa que la app no puede valorarlo en este momento, y los totales lo excluyen.",
      ],
      example:
        "Imagina tres filas: XLM con un saldo de 2000 que vale 235 USDC, USDC con un saldo de 100 que vale 100 USDC, y un token oscuro con un saldo de 500 pero un valor en blanco porque no existe ruta. El total en USDC muestra unos 335, que cuenta solo las filas de XLM y USDC. Los 500 tokens oscuros estan en tu poder pero sin contar, asi que tu valor real es de al menos 335 mas lo que sea que valgan.",
    },
    {
      id: "c9-l3",
      title: "Que es un limite de trading y por que la IA tiene uno?",
      paragraphs: [
        "Un limite de trading es un techo que la IA pone sobre cuanto capital comprometera. Hay dos capas: un monto maximo por operacion individual, y una exposicion abierta total maxima entre todas las posiciones a la vez. El limite por operacion es mas alto para los pares blue-chip de stablecoins, que tienen mas profundidad y son mas seguros, y mas bajo para pares mas delgados o riesgosos.",
        "El proposito es el control del riesgo. Los limites evitan que una sola senal que se ve convincente apueste toda la billetera, y el limite de exposicion evita que muchas operaciones pequenas sumen en silencio un total peligroso. Juntos acotan lo maximo que puedes perder si el mercado se vuelve en contra de cada posicion abierta al mismo tiempo.",
        "Las ordenes manuales funcionan distinto. Cuando colocas una operacion tu mismo, te saltas los limites de tamano, volumen y exposicion de la IA, porque asumes la responsabilidad directa del tamano. Las ordenes manuales siguen pasando por las barreras de seguridad, asi que las ordenes imprudentes o claramente rotas se siguen bloqueando, pero los limites prudentes de tamano dependen de ti.",
      ],
      example:
        "Digamos que el limite por operacion de la IA es de 200 USDC para un par de stablecoins y el limite de exposicion total es de 500 USDC. Con 350 USDC ya comprometidos en dos posiciones abiertas, a la IA le quedan 150 USDC de margen. Una senal nueva que quiere 200 USDC se recortara a 150 para respetar el limite de exposicion. Tu, colocando la misma operacion de forma manual, podrias entrar con los 200 completos si quisieras, aunque cargarias ese riesgo extra por tu cuenta.",
    },
    {
      id: "c9-l4",
      title: "Que es el drawdown y como gestionarlo?",
      paragraphs: [
        "El drawdown es la caida desde un valor maximo del portafolio hasta un valle posterior. Si tu portafolio llego a un punto alto y luego cayo, el drawdown es cuanto por debajo de ese maximo te encuentras ahora, normalmente expresado en porcentaje. Mide el dolor, no solo un numero, porque los drawdowns profundos son dificiles de recuperar.",
        "Esta app ayuda a gestionar el drawdown automaticamente mediante un presupuesto diario de perdidas. A medida que las perdidas se acumulan durante el dia, los tamanos de las posiciones se van reduciendo, escalando desde el tamano completo con cerca del 100 por ciento del presupuesto restante hacia un 25 por ciento aproximadamente a medida que se gasta el presupuesto. El bot apuesta menos precisamente cuando ya esta perdiendo.",
        "Si el presupuesto diario de perdidas se consume por completo, el bot detiene las entradas nuevas hasta el dia siguiente y solo permite salidas que reducen el riesgo, es decir que aun puede cerrar o recortar posiciones para bajar el riesgo pero no puede abrir nuevas. Este cortacircuitos evita que un mal dia se convierta en uno catastrofico.",
      ],
      example:
        "Tu portafolio llega a un maximo de 1000 USDC y luego baja a 850 USDC. El drawdown es de 150 USDC, o sea un 15 por ciento. Recuperarse necesita mas de una ganancia del 15 por ciento: desde 850 debes subir cerca del 17.6 por ciento para volver a 1000, porque las ganancias componen sobre una base mas pequena. Esa asimetria es justo la razon por la que el presupuesto de perdidas reduce el tamano y al final detiene las entradas antes de que el hueco se haga mas profundo.",
    },
    {
      id: "c9-l5",
      title: "Como evaluar si tus operaciones estan funcionando bien",
      paragraphs: [
        "Empieza por la ganancia y perdida realizada frente a la no realizada. La app registra el PnL realizado diario, que es el dinero efectivamente asegurado por operaciones cerradas, y el PnL no realizado, que es la ganancia o perdida a precio de mercado sobre las posiciones que aun tienes. Un numero no realizado bonito es solo una promesa hasta que cierras la posicion y se vuelve realizado.",
        "Usa los graficos de estadisticas y de evolucion para ver la tendencia en lugar de un solo momento. Una linea irregular que sigue marcando nuevos maximos es mas sana que una linea suave que se va hacia abajo. Combina esto con la vista de drawdown para juzgar cuanto dolor soportaste para ganar esos rendimientos.",
        "Por ultimo, juzga al bot y a ti mismo por separado. La tabla de historial esta dividida en operaciones de Trading manual y de Trading con bot precisamente por esto. Comparar las dos te permite ver si tus instintos manuales le ganan a la IA, o si la IA esta superando en silencio a tus ordenes colocadas a mano, para que puedas apoyarte en lo que de verdad este funcionando.",
      ],
      example:
        "A lo largo de un dia la pestana de Trading con bot muestra diez operaciones cerradas con 12 USDC de ganancia realizada y una posicion abierta con 5 USDC de ganancia no realizada. La pestana de Trading manual muestra tres operaciones con 4 USDC de perdida realizada. El total realizado son 8 USDC a favor, pero la division revela que el bot gano 12 mientras tus operaciones manuales perdieron 4. La lectura honesta es dejar que el bot siga trabajando y revisar por que tus entradas manuales rindieron menos.",
    },
  ],
  quiz: [
    {
      id: "c9-q1",
      prompt:
        "Tienes 1000 XLM y 50 USDC, y 1 USDC vale 8.5 XLM. Cual es el valor total de tu portafolio en XLM?",
      options: [
        {
          text: "1050 XLM",
          explanation:
            "Incorrecto. Esto solo suma los dos saldos como si 1 USDC equivaliera a 1 XLM, ignorando el precio.",
        },
        {
          text: "1425 XLM",
          explanation:
            "Correcto. Los 50 USDC valen 50 por 8.5, que son 425 XLM, sumados a 1000 XLM dan 1425 XLM.",
        },
        {
          text: "8500 XLM",
          explanation:
            "Incorrecto. Esto valora solo los USDC a la escala equivocada y descarta por completo los 1000 XLM.",
        },
        {
          text: "425 XLM",
          explanation:
            "Incorrecto. Esto es solo el valor de la parte en USDC y se olvida de sumar los 1000 XLM.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q2",
      prompt:
        "En el resumen de la billetera, un activo muestra un saldo pero su columna de valor esta en blanco. Que significa esto?",
      options: [
        {
          text: "El activo no vale nada y cuenta como cero en tus totales.",
          explanation:
            "Incorrecto. Un valor en blanco no es lo mismo que valor cero; la app simplemente no puede ponerle precio.",
        },
        {
          text: "Ahora mismo no hay ruta de mercado para ponerle precio, asi que se excluye de los totales valorados.",
          explanation:
            "Correcto. Sin una ruta de trading hacia XLM o USDC la app no puede valorarlo, y los totales lo dejan fuera aunque sigas teniendolo.",
        },
        {
          text: "Tu saldo de ese activo es cero.",
          explanation:
            "Incorrecto. La columna de saldo muestra una posicion real; solo falta el valor.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c9-q3",
      prompt: "Por que la IA impone un limite por operacion y un limite de exposicion abierta total?",
      options: [
        {
          text: "Para acotar el riesgo de modo que ninguna senal individual apueste toda la billetera y que muchas operaciones no puedan sumar en silencio un total peligroso.",
          explanation:
            "Correcto. El limite por operacion limita una sola apuesta y el limite de exposicion limita el riesgo combinado de todas las posiciones abiertas.",
        },
        {
          text: "Para garantizar que cada operacion sea rentable.",
          explanation:
            "Incorrecto. Los limites acotan cuanto se arriesga; no pueden hacer rentable ninguna operacion.",
        },
        {
          text: "Para obligarte a usar ordenes manuales en las operaciones grandes.",
          explanation:
            "Incorrecto. Las ordenes manuales si se saltan estos limites, pero eso es una consecuencia, no el proposito de los limites.",
        },
        {
          text: "Para acelerar la frecuencia con que el bot escanea el mercado.",
          explanation:
            "Incorrecto. Los limites gobiernan el capital en riesgo, no la frecuencia de escaneo.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c9-q4",
      prompt:
        "Tu portafolio llego a un maximo de 1000 USDC y ahora esta en 850 USDC. Cual es el drawdown, y que pasa a medida que se consume el presupuesto diario de perdidas?",
      options: [
        {
          text: "El drawdown es del 15 por ciento, y a medida que se gasta el presupuesto los tamanos de las posiciones se reducen y las entradas nuevas terminan deteniendose.",
          explanation:
            "Correcto. El drawdown es la caida de 150 USDC desde el maximo de 1000, o sea un 15 por ciento, y el presupuesto de perdidas escala el tamano desde cerca del 100 por ciento hacia el 25 por ciento antes de detener las entradas nuevas.",
        },
        {
          text: "El drawdown es del 15 por ciento, y el bot aumenta los tamanos de las posiciones para recuperarse mas rapido.",
          explanation:
            "Incorrecto. La cifra del drawdown es correcta, pero el bot reduce los tamanos a medida que se acumulan las perdidas, no apuesta mas grande.",
        },
        {
          text: "El drawdown son los 850 USDC que aun tienes, y nada cambia en el tamano.",
          explanation:
            "Incorrecto. El drawdown es la caida desde el maximo, no el saldo restante, y el presupuesto de perdidas si cambia el tamano.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
