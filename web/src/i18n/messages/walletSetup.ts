// Wallet creation / import / management UI (Feature 3). Namespace: `walletSetup.*`
// (the existing `wallet.*` namespace covers the in-dashboard receive/send/swap
// panel; this is the setup + management flow). The secret-key warning is
// intentionally strong and is translated in full.
export default {
  en: {
    setupTitle: "Set up your wallet",
    setupSubtitle:
      "Before you can use any trading features, set up the Stellar wallet this account will use.",
    createCard: "Create a new wallet",
    createCardDesc: "Generate a brand-new Stellar keypair. You'll save the secret key yourself.",
    importCard: "Import existing wallet",
    importCardDesc: "Already have a Stellar secret key? Bring your own wallet.",

    createTitle: "Create a new wallet",
    generating: "Generating…",
    secretWarningTitle: "Save your secret key now",
    secretWarning:
      "⚠ This is your secret key. Write it down and store it somewhere safe. It will NEVER be shown again. Anyone who has this key has full control of your wallet. Do not share it with anyone.",
    publicKeyLabel: "Public key (your address)",
    secretKeyLabel: "Secret key",
    copy: "Copy",
    copied: "Copied",
    confirmPrompt: "To confirm you've saved it, type the LAST 4 characters of your secret key.",
    last4Placeholder: "last 4 characters",
    confirmBtn: "Confirm & activate wallet",

    importTitle: "Import an existing wallet",
    secretInputLabel: "Stellar secret key (starts with S)",
    secretInputPlaceholder: "S…",
    importBtn: "Import wallet",
    importInvalid:
      "That doesn't look like a valid Stellar secret key — it must start with S and be 56 characters.",
    noAccountWarning:
      "This keypair is valid but has no account on the Stellar network yet. Fund it with at least 1 XLM to activate it.",

    testnetFundTitle: "Fund on testnet",
    fundBtn: "Fund with Friendbot",
    funding: "Funding…",
    funded: "Funded",
    mainnetFundTitle: "Fund your wallet",
    mainnetFundInstructions:
      "Send at least 1 XLM to the public key above to activate the account before you can trade.",
    awaitingFunding: "Awaiting funding",

    manageTitle: "Your wallet",
    balanceLabel: "XLM balance",
    networkLabel: "Network",
    replaceTitle: "Replace wallet",
    replaceWarning:
      "Replacing your wallet cancels any open orders and active stop losses tied to your current wallet. This cannot be undone.",
    passwordLabel: "Confirm your password",
    passwordPlaceholder: "Your account password",
    replaceBtn: "Replace wallet",
    replaceConfirmLabel: "Confirm: last 4 characters of the NEW secret key",
    replaceConfirmPlaceholder: "e.g. 7QXK",
    replaceConfirmMismatch: "Those 4 characters don't match the new secret key. Replacement not submitted.",
    replaced: "Wallet replaced. {offers} open order(s) and {stops} stop loss(es) were cancelled.",

    chipNoWallet: "No wallet",
    chipCopyTitle: "Click to copy your public key",
    chipCopied: "Public key copied",

    continueBtn: "Continue to dashboard",
    back: "Back",
    cancel: "Cancel",
    genericError: "Something went wrong. Please try again.",
  },
  nl: {
    setupTitle: "Stel je wallet in",
    setupSubtitle:
      "Voordat je handelsfuncties kunt gebruiken, stel je de Stellar-wallet in die dit account gebruikt.",
    createCard: "Nieuwe wallet aanmaken",
    createCardDesc: "Genereer een gloednieuw Stellar-sleutelpaar. Je bewaart de geheime sleutel zelf.",
    importCard: "Bestaande wallet importeren",
    importCardDesc: "Heb je al een Stellar geheime sleutel? Gebruik je eigen wallet.",

    createTitle: "Nieuwe wallet aanmaken",
    generating: "Genereren…",
    secretWarningTitle: "Bewaar nu je geheime sleutel",
    secretWarning:
      "⚠ Dit is je geheime sleutel. Schrijf hem op en bewaar hem op een veilige plek. Hij wordt NOOIT meer getoond. Wie deze sleutel heeft, heeft volledige controle over je wallet. Deel hem met niemand.",
    publicKeyLabel: "Publieke sleutel (jouw adres)",
    secretKeyLabel: "Geheime sleutel",
    copy: "Kopiëren",
    copied: "Gekopieerd",
    confirmPrompt: "Typ ter bevestiging de LAATSTE 4 tekens van je geheime sleutel.",
    last4Placeholder: "laatste 4 tekens",
    confirmBtn: "Bevestigen & wallet activeren",

    importTitle: "Bestaande wallet importeren",
    secretInputLabel: "Stellar geheime sleutel (begint met S)",
    secretInputPlaceholder: "S…",
    importBtn: "Wallet importeren",
    importInvalid:
      "Dit lijkt geen geldige Stellar geheime sleutel — hij moet met S beginnen en 56 tekens lang zijn.",
    noAccountWarning:
      "Dit sleutelpaar is geldig maar heeft nog geen account op het Stellar-netwerk. Stort er minstens 1 XLM op om het te activeren.",

    testnetFundTitle: "Opwaarderen op testnet",
    fundBtn: "Opwaarderen met Friendbot",
    funding: "Opwaarderen…",
    funded: "Opgewaardeerd",
    mainnetFundTitle: "Waardeer je wallet op",
    mainnetFundInstructions:
      "Stuur minstens 1 XLM naar de publieke sleutel hierboven om het account te activeren voordat je kunt handelen.",
    awaitingFunding: "Wacht op storting",

    manageTitle: "Jouw wallet",
    balanceLabel: "XLM-saldo",
    networkLabel: "Netwerk",
    replaceTitle: "Wallet vervangen",
    replaceWarning:
      "Het vervangen van je wallet annuleert alle openstaande orders en actieve stop losses die aan je huidige wallet hangen. Dit kan niet ongedaan worden gemaakt.",
    passwordLabel: "Bevestig je wachtwoord",
    passwordPlaceholder: "Je accountwachtwoord",
    replaceBtn: "Wallet vervangen",
    replaceConfirmLabel: "Bevestig: laatste 4 tekens van de NIEUWE geheime sleutel",
    replaceConfirmPlaceholder: "bv. 7QXK",
    replaceConfirmMismatch: "Die 4 tekens komen niet overeen met de nieuwe geheime sleutel. Vervanging niet uitgevoerd.",
    replaced: "Wallet vervangen. {offers} openstaande order(s) en {stops} stop loss(es) geannuleerd.",

    chipNoWallet: "Geen wallet",
    chipCopyTitle: "Klik om je publieke sleutel te kopiëren",
    chipCopied: "Publieke sleutel gekopieerd",

    continueBtn: "Naar dashboard",
    back: "Terug",
    cancel: "Annuleren",
    genericError: "Er ging iets mis. Probeer het opnieuw.",
  },
  fr: {
    setupTitle: "Configurez votre wallet",
    setupSubtitle:
      "Avant d'utiliser les fonctions de trading, configurez le wallet Stellar qu'utilisera ce compte.",
    createCard: "Créer un nouveau wallet",
    createCardDesc: "Générez une toute nouvelle paire de clés Stellar. Vous conserverez vous-même la clé secrète.",
    importCard: "Importer un wallet existant",
    importCardDesc: "Vous avez déjà une clé secrète Stellar ? Utilisez votre propre wallet.",

    createTitle: "Créer un nouveau wallet",
    generating: "Génération…",
    secretWarningTitle: "Enregistrez votre clé secrète maintenant",
    secretWarning:
      "⚠ Ceci est votre clé secrète. Notez-la et conservez-la en lieu sûr. Elle ne sera PLUS JAMAIS affichée. Quiconque possède cette clé a le contrôle total de votre wallet. Ne la partagez avec personne.",
    publicKeyLabel: "Clé publique (votre adresse)",
    secretKeyLabel: "Clé secrète",
    copy: "Copier",
    copied: "Copié",
    confirmPrompt:
      "Pour confirmer que vous l'avez enregistrée, saisissez les 4 DERNIERS caractères de votre clé secrète.",
    last4Placeholder: "4 derniers caractères",
    confirmBtn: "Confirmer et activer le wallet",

    importTitle: "Importer un wallet existant",
    secretInputLabel: "Clé secrète Stellar (commence par S)",
    secretInputPlaceholder: "S…",
    importBtn: "Importer le wallet",
    importInvalid:
      "Cela ne ressemble pas à une clé secrète Stellar valide — elle doit commencer par S et comporter 56 caractères.",
    noAccountWarning:
      "Cette paire de clés est valide mais n'a pas encore de compte sur le réseau Stellar. Approvisionnez-la avec au moins 1 XLM pour l'activer.",

    testnetFundTitle: "Approvisionner sur le testnet",
    fundBtn: "Approvisionner via Friendbot",
    funding: "Approvisionnement…",
    funded: "Approvisionné",
    mainnetFundTitle: "Approvisionnez votre wallet",
    mainnetFundInstructions:
      "Envoyez au moins 1 XLM à la clé publique ci-dessus pour activer le compte avant de pouvoir trader.",
    awaitingFunding: "En attente d'approvisionnement",

    manageTitle: "Votre wallet",
    balanceLabel: "Solde XLM",
    networkLabel: "Réseau",
    replaceTitle: "Remplacer le wallet",
    replaceWarning:
      "Remplacer votre wallet annule tous les ordres ouverts et les stop loss actifs liés à votre wallet actuel. Cette action est irréversible.",
    passwordLabel: "Confirmez votre mot de passe",
    passwordPlaceholder: "Mot de passe de votre compte",
    replaceBtn: "Remplacer le wallet",
    replaceConfirmLabel: "Confirmez : les 4 derniers caractères de la NOUVELLE clé secrète",
    replaceConfirmPlaceholder: "ex. 7QXK",
    replaceConfirmMismatch: "Ces 4 caractères ne correspondent pas à la nouvelle clé secrète. Remplacement non envoyé.",
    replaced: "Wallet remplacé. {offers} ordre(s) ouvert(s) et {stops} stop loss annulé(s).",

    chipNoWallet: "Aucun wallet",
    chipCopyTitle: "Cliquez pour copier votre clé publique",
    chipCopied: "Clé publique copiée",

    continueBtn: "Aller au tableau de bord",
    back: "Retour",
    cancel: "Annuler",
    genericError: "Une erreur s'est produite. Veuillez réessayer.",
  },
  es: {
    setupTitle: "Configura tu wallet",
    setupSubtitle:
      "Antes de usar las funciones de trading, configura el wallet de Stellar que usará esta cuenta.",
    createCard: "Crear un wallet nuevo",
    createCardDesc: "Genera un par de claves Stellar nuevo. Tú mismo guardarás la clave secreta.",
    importCard: "Importar wallet existente",
    importCardDesc: "¿Ya tienes una clave secreta de Stellar? Usa tu propio wallet.",

    createTitle: "Crear un wallet nuevo",
    generating: "Generando…",
    secretWarningTitle: "Guarda ahora tu clave secreta",
    secretWarning:
      "⚠ Esta es tu clave secreta. Anótala y guárdala en un lugar seguro. NUNCA se volverá a mostrar. Cualquiera que tenga esta clave tiene control total de tu wallet. No la compartas con nadie.",
    publicKeyLabel: "Clave pública (tu dirección)",
    secretKeyLabel: "Clave secreta",
    copy: "Copiar",
    copied: "Copiado",
    confirmPrompt:
      "Para confirmar que la has guardado, escribe los ÚLTIMOS 4 caracteres de tu clave secreta.",
    last4Placeholder: "últimos 4 caracteres",
    confirmBtn: "Confirmar y activar el wallet",

    importTitle: "Importar un wallet existente",
    secretInputLabel: "Clave secreta de Stellar (empieza por S)",
    secretInputPlaceholder: "S…",
    importBtn: "Importar wallet",
    importInvalid:
      "Esto no parece una clave secreta de Stellar válida — debe empezar por S y tener 56 caracteres.",
    noAccountWarning:
      "Este par de claves es válido pero aún no tiene cuenta en la red Stellar. Deposita al menos 1 XLM para activarlo.",

    testnetFundTitle: "Financiar en testnet",
    fundBtn: "Financiar con Friendbot",
    funding: "Financiando…",
    funded: "Financiado",
    mainnetFundTitle: "Financia tu wallet",
    mainnetFundInstructions:
      "Envía al menos 1 XLM a la clave pública de arriba para activar la cuenta antes de poder operar.",
    awaitingFunding: "Esperando financiación",

    manageTitle: "Tu wallet",
    balanceLabel: "Saldo XLM",
    networkLabel: "Red",
    replaceTitle: "Reemplazar wallet",
    replaceWarning:
      "Reemplazar tu wallet cancela todas las órdenes abiertas y los stop loss activos vinculados a tu wallet actual. Esto no se puede deshacer.",
    passwordLabel: "Confirma tu contraseña",
    passwordPlaceholder: "La contraseña de tu cuenta",
    replaceBtn: "Reemplazar wallet",
    replaceConfirmLabel: "Confirma: últimos 4 caracteres de la NUEVA clave secreta",
    replaceConfirmPlaceholder: "p. ej. 7QXK",
    replaceConfirmMismatch: "Esos 4 caracteres no coinciden con la nueva clave secreta. Reemplazo no enviado.",
    replaced: "Wallet reemplazado. Se cancelaron {offers} orden(es) abierta(s) y {stops} stop loss.",

    chipNoWallet: "Sin wallet",
    chipCopyTitle: "Haz clic para copiar tu clave pública",
    chipCopied: "Clave pública copiada",

    continueBtn: "Ir al panel",
    back: "Atrás",
    cancel: "Cancelar",
    genericError: "Algo salió mal. Inténtalo de nuevo.",
  },
};
