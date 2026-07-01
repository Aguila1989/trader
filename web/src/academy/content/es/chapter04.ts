import type { Chapter } from "../../types";

export const chapter04: Chapter = {
  id: "c4",
  number: 4,
  level: "BASIC",
  title: "Conceptos basicos de riesgo",
  description: "Que significan el riesgo, la volatilidad y las perdidas, y los habitos sencillos que los mantienen pequenos.",
  lessons: [
    {
      id: "c4-l1",
      title: "Que es el riesgo en el trading?",
      paragraphs: [
        "El riesgo es simplemente la probabilidad de que una operacion pierda dinero en lugar de ganarlo. Cada trade tiene dos futuros posibles: el precio se mueve a tu favor, o se mueve en tu contra. Nadie puede saber de antemano cual de los dos ocurre, asi que el riesgo siempre esta presente. El objetivo nunca es eliminar el riesgo por completo, solo mantenerlo lo bastante pequeno como para que una mala operacion no pueda hacerte mucho dano.",
        "Este bot esta construido en torno a esa idea. Impone un monto maximo por operacion, un numero maximo de trades por dia y una exposicion total abierta maxima. Estos limites ponen un techo a cuanto puede salir mal a la vez, incluso si varias operaciones acaban mal.",
        "Una forma util de pensar en el riesgo es: cuanto es lo maximo que podria perder aqui, y puedo vivir con ese numero? Si la respuesta honesta te incomoda, la posicion es demasiado grande. Reducir el tamano es la manera mas facil de reducir el riesgo.",
      ],
      example: "Tienes 1000 XLM que valen unos 100 USDC. Fijas el maximo por operacion en 10 USDC. Aunque una sola operacion saliera completamente mal, solo esa porcion de 10 USDC esta expuesta, asi que tu peor caso en una operacion es aproximadamente una decima parte de tu billetera, no toda. Los otros 90 USDC quedan intactos y listos para mejores momentos.",
    },
    {
      id: "c4-l2",
      title: "Que es la volatilidad y por que es riesgosa?",
      paragraphs: [
        "La volatilidad mide cuanto y que tan rapido salta un precio de un lado a otro. El saldo de una cuenta de ahorro bancaria apenas se mueve, asi que casi no tiene volatilidad. El cripto es lo contrario: XLM puede subir o bajar varios por ciento en un solo dia, a veces en cuestion de horas. Ese movimiento es justamente por lo que la gente lo opera, y tambien justamente por lo que es riesgoso.",
        "La alta volatilidad corta por ambos lados. El mismo movimiento que podria hacer crecer tu posicion puede encogerla con la misma rapidez. Si no estas atento, un movimiento brusco puede convertir una pequena ganancia sobre el papel en una perdida real antes de que reacciones.",
        "El panel te ayuda a sentir esto. Valora toda tu billetera tanto en XLM como en USDC, asi que puedes ver el valor total subir y bajar en tiempo real. Ver esos numeros moverse es la forma mas clara de entender que la volatilidad no es algo abstracto, es tu dinero cambiando de tamano.",
      ],
      example: "Digamos que XLM vale 0.100 USDC por la manana. Para la tarde cae un 5 por ciento hasta 0.095 USDC. Si tenias 2000 XLM, tu posicion bajo de 200 USDC a 190 USDC, un movimiento de 10 USDC en pocas horas sin que hicieras nada. Esa velocidad es la volatilidad, y por eso importan el tamano de la posicion y los stop loss.",
    },
    {
      id: "c4-l3",
      title: "Que es una perdida y como la limitas?",
      paragraphs: [
        "Una perdida ocurre cuando terminas con menos valor del que empezaste, normalmente porque compraste y el precio luego cayo, o vendiste y subio. Las perdidas son una parte normal e inevitable del trading. La habilidad no esta en evitarlas por completo, sino en mantener cada una pequena para que tu cuenta sobreviva y pueda operar otro dia.",
        "Este bot limita las perdidas de varias maneras superpuestas. Un presupuesto de perdida diaria reduce automaticamente el tamano de tus posiciones a medida que las perdidas se acumulan durante el dia, asi que una mala racha se vuelve mas silenciosa en lugar de mas ruidosa. Tambien hay un volumen diario maximo y un maximo de trades por dia, que te impiden operar de mas cuando las cosas salen mal.",
        "Para una sola posicion puedes anadir un stop loss, que veremos en detalle mas adelante, que cierra la operacion una vez que cae por debajo de un nivel que tu eliges. Juntas, estas herramientas convierten una perdida potencialmente grande y sin limite en una pequena y conocida.",
      ],
      example: "Compras 50 USDC de XLM y el precio empieza a deslizarse. Con un stop loss fijado un 4 por ciento por debajo de la entrada, el bot vende una vez que estas en aproximadamente 2 USDC abajo, limitando esa perdida. Mientras tanto, el presupuesto de perdida diaria nota el dia en rojo y recorta tu siguiente operacion de 10 USDC a 5 USDC, asi el dia no puede hacer bola de nieve.",
    },
    {
      id: "c4-l4",
      title: "Invertir solo lo que puedes permitirte perder",
      paragraphs: [
        "Invertir solo lo que puedes permitirte perder significa poner dinero que, si desapareciera por completo, no cambiaria tu vida. El alquiler, la comida, las facturas y los ahorros de emergencia nunca son dinero para tradear. Si perder esa cantidad te causaria estres real o te obligaria a pedir prestado, es demasiado.",
        "Esta regla importa porque la volatilidad es real y las perdidas si ocurren. Quienes operan con dinero del que no pueden prescindir tienden a entrar en panico, a aguantar trades perdedores demasiado tiempo esperando que se recuperen, o a perseguir perdidas con apuestas mas grandes. El dinero que de verdad puedes permitirte perder te deja tomar decisiones tranquilas y racionales en su lugar.",
        "El bot apoya esta mentalidad de forma directa. Arranca en modo de solo lectura y ofrece un modo de paper trading totalmente simulado, sin fondos reales, asi puedes practicar y aprender la sensacion del riesgo antes de que una sola moneda real este en juego.",
      ],
      example: "Imagina que tienes 1000 USDC de ahorros pero necesitas 900 para el alquiler y las emergencias. El dinero que puedes permitirte perder aqui podria ser 50 USDC, no los 1000 completos. Financias el bot con esos 50, fijas el limite por operacion bajo y empiezas primero en modo paper. Si todo desapareciera, tu alquiler y tu colchon de seguridad seguirian completamente intactos.",
    },
    {
      id: "c4-l5",
      title: "Que es la diversificacion?",
      paragraphs: [
        "Diversificar significa no poner todo tu dinero en una sola cosa. Si todo lo que tienes es un unico token y ese token se desploma, pierdes en todos los frentes al mismo tiempo. Repartir el valor entre varias posiciones hace que una caida en una quede amortiguada por las demas.",
        "Un primer paso sencillo es tener mas de un activo. Este bot valora tu billetera tanto en XLM como en USDC, y USDC es una stablecoin disenada para mantenerse cerca de un dolar, asi que apenas se mueve. Mantener parte de tu billetera en USDC te da un ancla tranquila mientras el resto cabalga el XLM, mas volatil.",
        "La diversificacion no es magia y no elimina el riesgo, pero suaviza los baches. Combinada con los limites de exposicion del bot, evita que una sola posicion decida todo tu resultado, lo que mantiene mas estables tanto tu dinero como tus nervios.",
      ],
      example: "Supon que pones los 100 USDC de valor enteros en XLM y baja un 8 por ciento de la noche a la manana; quedas 8 USDC abajo sin nada que lo suavice. Si en cambio tuvieras 50 USDC en XLM y 50 USDC en USDC estable, la misma caida del 8 por ciento en XLM cuesta solo 4 USDC, porque la mitad de tu billetera nunca se movio. Mismo mercado, la mitad del dolor.",
    },
    {
      id: "c4-l6",
      title: "Que significa el valor de mi portafolio?",
      paragraphs: [
        "El valor total de tu portafolio es la suma de cada token que tienes multiplicado por su precio de mercado actual, sumado en una sola moneda, normalmente USDC. No es un numero que tu escribes; la app mira cada posicion, comprueba cuanto vale una unidad ahora mismo, y suma todo en una sola cifra que responde a una pregunta sencilla: si vendiera todo en este momento, cuanto tendria aproximadamente?",
        "Como depende de precios en vivo, el valor de tu portafolio cambia incluso cuando no haces nada. No tienes que comprar ni vender para que el numero se mueva; el mercado lo mueve por ti. Una tarde tranquila en la que XLM sube unos pocos por ciento elevara tu total, y una caida repentina lo bajara, mientras tu solo miras.",
        "El grafico de dona es una imagen de ese mismo valor, dividido por posicion. Cada porcion es un token, y el tamano de la porcion es la parte que ese token representa de tu valor total, expresada como porcentaje. Una porcion grande de XLM junto a una porcion pequena de USDC te dice, de un vistazo, que la mayor parte de tu valor depende de XLM y se moveria con su precio.",
        "Una forma util de imaginarlo: el valor de tu portafolio es como el precio de mercado actual de todo lo que hay en tu casa. Tus muebles y electrodomesticos valen algo hoy, un poco mas o menos el mes que viene, aunque nunca compres ni vendas un solo objeto. Los precios se mueven solos, asi que el valor total de lo que ya posees sigue cambiando en silencio en segundo plano.",
      ],
      example: "Tienes 100 XLM y 20 USDC. Esta manana 1 XLM vale 0.10 USDC, asi que tu XLM vale 10 USDC y el valor total de tu portafolio es 10 mas 20, o sea 30 USDC. La dona muestra XLM como una porcion del 33 por ciento y USDC como el 67 por ciento. Para la tarde XLM sube a 0.12 USDC sin que toques nada: tu XLM ahora vale 12 USDC, tu total sube a 32 USDC, y la porcion de XLM crece en silencio. No operaste, y aun asi el valor de tu portafolio cambio.",
    },
  ],
  quiz: [
    {
      id: "c4-q1",
      prompt: "En el trading, que significa realmente el riesgo?",
      options: [
        {
          text: "Una garantia de que perderas dinero en cada operacion",
          explanation: "Incorrecto. El riesgo no es una garantia de perdida; es la probabilidad de que una operacion vaya en tu contra, y muchas operaciones salen bien.",
        },
        {
          text: "La probabilidad de que una operacion pierda dinero en lugar de ganarlo",
          explanation: "Correcto. El riesgo es la posibilidad de que el precio se mueva en tu contra, y por eso el bot limita el tamano por operacion y la exposicion total.",
        },
        {
          text: "Una comision que el exchange cobra por abrir una posicion",
          explanation: "Incorrecto. Eso describe los costos de trading o el spread, no el riesgo. El riesgo se trata de resultados inciertos, no de un cargo fijo.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c4-q2",
      prompt: "Por que se considera riesgosa la alta volatilidad?",
      options: [
        {
          text: "Porque el precio nunca cambia, asi que nunca puedes vender",
          explanation: "Incorrecto. Eso es lo opuesto a la volatilidad. La volatilidad significa que el precio cambia mucho, no que se queda quieto.",
        },
        {
          text: "Porque solo empuja los precios hacia arriba",
          explanation: "Incorrecto. La volatilidad corta por ambos lados; el mismo movimiento rapido que puede hacer crecer una posicion puede encogerla con la misma rapidez.",
        },
        {
          text: "Porque los precios pueden moverse varios por ciento rapido, asi que el valor puede caer rapidamente antes de que reacciones",
          explanation: "Correcto. XLM puede moverse varios por ciento en un dia, y esa velocidad puede convertir una ganancia sobre el papel en una perdida real antes de que actues.",
        },
      ],
      correctIndex: 2,
    },
    {
      id: "c4-q3",
      prompt: "Que herramienta ayuda a limitar la perdida en una sola posicion?",
      options: [
        {
          text: "Un stop loss que cierra la operacion una vez que cae por debajo de un nivel que tu eliges",
          explanation: "Correcto. Un stop loss convierte una perdida sin limite en una pequena y conocida, saliendo en un nivel que fijas de antemano.",
        },
        {
          text: "Comprar mas del token mientras sigue cayendo",
          explanation: "Incorrecto. Eso aumenta tu exposicion y tu perdida potencial; es el comportamiento de perseguir perdidas contra el que advierten las reglas.",
        },
        {
          text: "Apagar el panel para no ver el precio",
          explanation: "Incorrecto. Ignorar el precio no limita una perdida; solo la oculta mientras la posicion sigue moviendose en tu contra.",
        },
        {
          text: "Eliminar el presupuesto de perdida diaria para que las operaciones sigan siendo grandes",
          explanation: "Incorrecto. El presupuesto de perdida diaria te protege reduciendo los tamanos durante una mala racha; eliminarlo aumentaria el riesgo.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c4-q4",
      prompt: "Que significa en la practica invertir solo lo que puedes permitirte perder?",
      options: [
        {
          text: "Operar con el dinero del alquiler porque el bot limita las perdidas de todos modos",
          explanation: "Incorrecto. El alquiler y las facturas nunca son dinero para tradear; los limites reducen el riesgo pero nunca lo eliminan, y los fondos esenciales deben quedar a salvo.",
        },
        {
          text: "Financiar el bot solo con dinero cuya perdida total no afectaria tu vida",
          explanation: "Correcto. El dinero que puedes permitirte perder te mantiene tranquilo y racional, y por eso el bot tambien ofrece el modo paper para practicar primero.",
        },
        {
          text: "Invertir todo de golpe para que una sola gran ganancia cubra todo el riesgo",
          explanation: "Incorrecto. Apostar todo ignora la diversificacion y los limites de exposicion, y un solo mal movimiento podria liquidar toda la billetera.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c4-q5",
      prompt: "Si tienes 100 XLM y el precio sube, cambia el valor de tu portafolio aunque no hayas operado?",
      options: [
        {
          text: "Si, porque el valor del portafolio son tus posiciones por su precio actual, que se mueve con el mercado",
          explanation: "Correcto. No necesitas operar para que el total cambie; cuando el precio de un token que tienes se mueve, el valor de tu portafolio se mueve con el.",
        },
        {
          text: "No, el valor solo cambia cuando compras o vendes",
          explanation: "Incorrecto. Operar cambia lo que tienes, pero incluso las posiciones que nunca tocas se vuelven a valorar constantemente, asi que el total se mueve solo.",
        },
        {
          text: "No, el valor queda fijo hasta que refrescas la pagina manualmente",
          explanation: "Incorrecto. La app vuelve a valorar con un temporizador frente a los mercados en vivo, asi que el valor refleja los movimientos reales de precio, refresques o no.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
