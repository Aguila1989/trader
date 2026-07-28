// Receive & Send page chrome: the QR hint and the (trade-log–derived) XLM
// Conversion History section. The Send / Receive / Swap field labels reuse the
// existing `wallet.*` namespace. Auto-merged under `receiveSend.*`.
//
// sendConfirm: fund-safety review step shown before store.pay() fires (Stellar
// payments are irreversible) — includes the memo-required warning/ack gate.
// swapImpact: worst-case (destMin) + slippage tolerance shown before a swap
// commits, alongside the existing mid-price quote line.
export default {
  en: {
    pageTitle: "Receive & Send",
    qrHint: "Scan to send to this wallet",
    qrCaption: "Your public address — safe to share",
    // Multi-chain receive: one tab per configured chain. Send stays
    // Stellar-only for now — other chains are receive-only.
    chainTabsAria: "Receive chain",
    sendLaterNote:
      "Sending from {chain} isn't available yet — this wallet is receive-only for now. Sending arrives in a later update.",
    conversion: {
      title: "XLM Conversion History",
      subtitle: "Swaps into XLM from this wallet",
      show: "Show",
      hide: "Hide",
      empty: "No conversions yet.",
      date: "Date",
      from: "From",
      to: "To",
      status: "Status",
    },
    sendConfirm: {
      title: "Confirm send",
      summary: "Send {amount} {code} to {destination}",
      memoLine: "Memo: {memo}",
      noMemoLine: "No memo attached.",
      irreversible: "Stellar transfers cannot be reversed or recalled once sent.",
      memoWarning:
        "This destination has no memo. Many exchange and custodial deposit addresses REQUIRE a memo to credit your account — sending without one can permanently lose these funds.",
      memoAck: "I confirm this address does not require a memo.",
      ackRequired: "Please confirm the address does not require a memo before sending.",
      confirm: "Send",
      cancel: "Cancel",
    },
    swapImpact: {
      minReceived: "Minimum received: {amount} {code}",
      label: "Slippage tolerance",
      tip: "Your swap executes as a strict-send path payment with a {pct}% slippage tolerance. If the price moves against you before the transaction settles, this is the worst-case amount you will still receive; otherwise you get the quoted amount above.",
    },
  },
  nl: {
    pageTitle: "Ontvangen & verzenden",
    qrHint: "Scan om naar deze wallet te verzenden",
    qrCaption: "Je openbaar adres — veilig om te delen",
    chainTabsAria: "Ontvangstchain",
    sendLaterNote:
      "Verzenden vanaf {chain} is nog niet beschikbaar — deze wallet is voorlopig alleen voor ontvangen. Verzenden volgt in een latere update.",
    conversion: {
      title: "XLM-omzettingsgeschiedenis",
      subtitle: "Swaps naar XLM vanuit deze wallet",
      show: "Tonen",
      hide: "Verbergen",
      empty: "Nog geen omzettingen.",
      date: "Datum",
      from: "Van",
      to: "Naar",
      status: "Status",
    },
    sendConfirm: {
      title: "Verzending bevestigen",
      summary: "Verstuur {amount} {code} naar {destination}",
      memoLine: "Memo: {memo}",
      noMemoLine: "Geen memo toegevoegd.",
      irreversible: "Stellar-overschrijvingen kunnen na verzending niet worden teruggedraaid of teruggeroepen.",
      memoWarning:
        "Deze bestemming heeft geen memo. Veel stortingsadressen van exchanges en custodial diensten VEREISEN een memo om je account te crediteren — versturen zonder memo kan deze fondsen permanent doen verliezen.",
      memoAck: "Ik bevestig dat dit adres geen memo vereist.",
      ackRequired: "Bevestig dat het adres geen memo vereist voordat je verstuurt.",
      confirm: "Verstuur",
      cancel: "Annuleren",
    },
    swapImpact: {
      minReceived: "Minimaal ontvangen: {amount} {code}",
      label: "Slippage-tolerantie",
      tip: "Je swap wordt uitgevoerd als een strict-send path payment met een slippage-tolerantie van {pct}%. Als de prijs tegen je beweegt voordat de transactie wordt afgerond, is dit het worst-case bedrag dat je nog steeds ontvangt; anders krijg je het hierboven geciteerde bedrag.",
    },
  },
  fr: {
    pageTitle: "Recevoir et envoyer",
    qrHint: "Scannez pour envoyer vers ce portefeuille",
    qrCaption: "Votre adresse publique — sans danger à partager",
    chainTabsAria: "Chaîne de réception",
    sendLaterNote:
      "L'envoi depuis {chain} n'est pas encore disponible — ce portefeuille est pour l'instant en réception uniquement. L'envoi arrivera dans une prochaine mise à jour.",
    conversion: {
      title: "Historique des conversions XLM",
      subtitle: "Conversions vers XLM depuis ce portefeuille",
      show: "Afficher",
      hide: "Masquer",
      empty: "Aucune conversion pour l'instant.",
      date: "Date",
      from: "De",
      to: "Vers",
      status: "Statut",
    },
    sendConfirm: {
      title: "Confirmer l'envoi",
      summary: "Envoyer {amount} {code} à {destination}",
      memoLine: "Mémo : {memo}",
      noMemoLine: "Aucun mémo joint.",
      irreversible: "Les transferts Stellar ne peuvent pas être annulés ni rappelés une fois envoyés.",
      memoWarning:
        "Cette destination n'a pas de mémo. De nombreuses adresses de dépôt d'exchanges ou de services custodial EXIGENT un mémo pour créditer votre compte — envoyer sans mémo peut faire perdre ces fonds définitivement.",
      memoAck: "Je confirme que cette adresse ne nécessite pas de mémo.",
      ackRequired: "Veuillez confirmer que l'adresse ne nécessite pas de mémo avant d'envoyer.",
      confirm: "Envoyer",
      cancel: "Annuler",
    },
    swapImpact: {
      minReceived: "Minimum reçu : {amount} {code}",
      label: "Tolérance de slippage",
      tip: "Votre swap s'exécute comme un paiement de chemin strict-send avec une tolérance de slippage de {pct} %. Si le prix évolue en votre défaveur avant le règlement de la transaction, voici le montant minimum que vous recevrez malgré tout ; sinon vous recevez le montant indiqué ci-dessus.",
    },
  },
  es: {
    pageTitle: "Recibir y enviar",
    qrHint: "Escanea para enviar a esta billetera",
    qrCaption: "Tu dirección pública: segura para compartir",
    chainTabsAria: "Cadena de recepción",
    sendLaterNote:
      "El envío desde {chain} aún no está disponible: esta billetera es solo de recepción por ahora. El envío llegará en una próxima actualización.",
    conversion: {
      title: "Historial de conversiones a XLM",
      subtitle: "Conversiones a XLM desde esta billetera",
      show: "Mostrar",
      hide: "Ocultar",
      empty: "Aún no hay conversiones.",
      date: "Fecha",
      from: "De",
      to: "A",
      status: "Estado",
    },
    sendConfirm: {
      title: "Confirmar envío",
      summary: "Enviar {amount} {code} a {destination}",
      memoLine: "Memo: {memo}",
      noMemoLine: "Sin memo adjunto.",
      irreversible: "Las transferencias de Stellar no se pueden revertir ni recuperar una vez enviadas.",
      memoWarning:
        "Este destino no tiene memo. Muchas direcciones de depósito de exchanges o servicios custodiales REQUIEREN un memo para acreditar tu cuenta — enviar sin memo puede hacer que pierdas estos fondos de forma permanente.",
      memoAck: "Confirmo que esta dirección no requiere memo.",
      ackRequired: "Confirma que la dirección no requiere memo antes de enviar.",
      confirm: "Enviar",
      cancel: "Cancelar",
    },
    swapImpact: {
      minReceived: "Mínimo a recibir: {amount} {code}",
      label: "Tolerancia de slippage",
      tip: "Tu swap se ejecuta como un pago de ruta strict-send con una tolerancia de slippage del {pct}%. Si el precio se mueve en tu contra antes de que se liquide la transacción, este es el importe mínimo que aún recibirás; en caso contrario recibirás el importe indicado arriba.",
    },
  },
};
