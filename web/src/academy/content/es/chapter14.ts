import type { Chapter } from "../../types";

export const chapter14: Chapter = {
  id: "c14",
  number: 14,
  level: "BASIC",
  title: "Tu cuenta y tus datos",
  description:
    "Qué es una cuenta de usuario, cómo se mantienen tus datos de trading separados de los de los demás, y qué pasa con ellos si alguna vez eliminas tu cuenta.",
  lessons: [
    {
      id: "c14-l1",
      title: "¿Qué es una cuenta de usuario y por qué importa?",
      paragraphs: [
        "Una cuenta es tu propio espacio privado dentro de la aplicación. Es la forma en que el panel sabe qué operaciones, ajustes, stop loss e historial te pertenecen a ti y a nadie más. Una vez que inicias sesión en tu cuenta, todo lo que ves y todo lo que hace el bot está vinculado solo a ti.",
        "Piensa en tu cuenta como un casillero personal. Solo tú tienes la llave. Todo lo que guardas dentro (tu historial de trading, tus ajustes de riesgo, tus stop loss guardados) se queda en tu casillero, y ningún otro usuario puede abrirlo ni espiar lo que hay ahí.",
        "Esto importa porque el trading es algo personal. Tus decisiones, tus cifras y tus errores no son asunto de nadie más. Una cuenta mantiene privada tu información y se asegura de que el bot actúe según tus ajustes, no según los de otra persona.",
      ],
      example:
        "Imagina que dos personas usan esta aplicación. Una fija un límite de riesgo prudente y solo opera cantidades pequeñas. La otra deja que la IA opere de forma más agresiva. Como cada persona tiene su propia cuenta (su propio casillero) el límite del trader prudente nunca se mezcla con el del trader agresivo. Cada cuenta conserva sus propios ajustes, su propio historial y su propia billetera, completamente separados.",
    },
    {
      id: "c14-l2",
      title: "Cómo se mantienen tus datos de trading separados de los de otros usuarios",
      paragraphs: [
        "Entre bastidores, cada dato que guarda la aplicación (una operación, una línea de registro, un stop loss, un ajuste) lleva grabado el id de la cuenta a la que pertenece. Cuando abres el panel, la aplicación solo lee las filas marcadas con tu id.",
        "Esto es lo que impide que los casilleros se filtren unos en otros. Aunque los datos de todo el mundo viven en la misma base de datos, tus operaciones nunca pueden aparecer en la pantalla de otro usuario, porque la aplicación lo filtra todo por tu cuenta antes que nada.",
        "También significa que tus límites diarios, tus ganancias y pérdidas realizadas, y los resultados de tus escaneos se calculan únicamente a partir de tu propia actividad. Otra persona que opere en el mismo servidor no mueve tus cifras ni un solo centavo.",
      ],
      example:
        "Supón que la base de datos contiene 10.000 operaciones de muchos usuarios. Cuando abres tu historial, la aplicación pide solo las operaciones marcadas con el id de tu cuenta, así que quizá veas apenas 40 de ellas: las tuyas. Las otras 9.960 permanecen invisibles para ti, exactamente igual que tus operaciones permanecen invisibles para los demás.",
    },
    {
      id: "c14-l3",
      title: "¿Qué pasa con tus datos si eliminas tu cuenta?",
      paragraphs: [
        "Eliminar tu cuenta borra tu casillero y todo lo que la aplicación guarda dentro de él. Tus operaciones almacenadas, ajustes, stop loss, alertas y registros se eliminan de los datos de la aplicación, de modo que ya nadie puede leerlos.",
        "Algo que la eliminación no puede deshacer es la propia blockchain. Como viste en el primer capítulo, una operación que ya se ejecutó en Stellar es permanente y pública. Eliminar tu cuenta borra la copia que la aplicación tiene de tu historial, pero no puede reescribir el registro público de operaciones que ya ocurrieron en la cadena.",
        "Tu billetera también está separada de tu cuenta. Tus fondos viven en la red Stellar bajo tus propias claves, no dentro de esta aplicación, así que eliminar tu cuenta no toca tus monedas. (Iniciar sesión y eliminar una cuenta llegan en un paso posterior; esta lección explica qué le hará, y qué no, a tus datos.)",
      ],
      example:
        "Digamos que eliminas tu cuenta tras un mes operando. La aplicación olvida tus ajustes, tus stop loss y tu historial guardado: desaparecen del panel. Pero si buscas tus operaciones antiguas en un explorador público de Stellar, siguen ahí, porque la blockchain conserva su propio registro permanente que ninguna aplicación puede borrar.",
    },
  ],
  quiz: [
    {
      id: "c14-q1",
      prompt: "¿Por qué la aplicación le da a cada persona su propia cuenta?",
      options: [
        {
          text: "Para que todos puedan compartir un único conjunto común de ajustes e historial.",
          explanation:
            "No. El sentido de tener cuentas separadas es justo el contrario: los ajustes y el historial de cada persona son privados y no se comparten.",
        },
        {
          text: "Para que las operaciones, los ajustes y el historial de cada persona se mantengan privados y separados, como un casillero personal que solo ella puede abrir.",
          explanation:
            "Correcto. Una cuenta es tu casillero privado: tus datos te pertenecen y ningún otro usuario puede verlos ni cambiarlos.",
        },
        {
          text: "Para que la aplicación pueda mostrar tus operaciones a otros usuarios para que las comparen.",
          explanation:
            "No. Tus operaciones son privadas de tu cuenta y nunca se muestran a otros usuarios.",
        },
      ],
      correctIndex: 1,
    },
    {
      id: "c14-q2",
      prompt:
        "Los datos de muchos usuarios viven en la misma base de datos. ¿Cómo impide la aplicación que veas las operaciones de otro usuario?",
      options: [
        {
          text: "Marca cada fila con un id de cuenta y solo lee las filas marcadas con el tuyo.",
          explanation:
            "Correcto. Cada operación, registro y ajuste lleva el id de cuenta de su dueño, y la aplicación filtra por tu id, así que solo ves tus propios datos.",
        },
        {
          text: "Simplemente confía en que cada usuario no mire los datos de los demás.",
          explanation:
            "No. La separación no depende de la confianza. La aplicación filtra técnicamente cada lectura por el id de tu cuenta.",
        },
        {
          text: "Conserva los datos de un solo usuario a la vez y elimina los de todos los demás.",
          explanation:
            "No. Los datos de todos los usuarios pueden almacenarse a la vez; la aplicación los mantiene separados por id de cuenta en lugar de eliminar los de nadie.",
        },
      ],
      correctIndex: 0,
    },
    {
      id: "c14-q3",
      prompt: "Eliminas tu cuenta después de operar durante un tiempo. ¿Qué ocurre?",
      options: [
        {
          text: "La aplicación borra tus ajustes guardados, tus stop loss y tu historial, pero las operaciones ya ejecutadas en Stellar permanecen en la blockchain pública, y los fondos de tu billetera quedan intactos.",
          explanation:
            "Correcto. La eliminación borra tus datos de la aplicación, pero el registro en la blockchain de operaciones pasadas en la cadena es permanente, y tus monedas viven en tu billetera, no en la aplicación.",
        },
        {
          text: "Todas las operaciones que hayas hecho también se borran de la blockchain.",
          explanation:
            "No. La blockchain es permanente y pública; ninguna aplicación puede borrar una operación que ya se ejecutó en la cadena.",
        },
        {
          text: "Tus monedas se eliminan junto con tu cuenta.",
          explanation:
            "No. Tus fondos viven en la red Stellar bajo tus propias claves, así que eliminar tu cuenta no toca tus monedas.",
        },
      ],
      correctIndex: 0,
    },
  ],
};
