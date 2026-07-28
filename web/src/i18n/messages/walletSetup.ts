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
    secretSavedAck:
      "I have saved my secret key somewhere safe and understand it cannot be recovered if lost.",
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

    // --- Non-custodial on-device flows (shared by the Stellar + Solana cards) ---
    ncCard: "Create on this device (non-custodial)",
    ncCardDesc:
      "Your key is generated and encrypted on your device — we never see it. You sign every transaction yourself.",
    ncTitle: "Create a non-custodial wallet",
    ncGenerating: "Generating a key on this device…",
    ncBackupTitle: "Back up your secret key now.",
    ncBackupWarning:
      "This key lives only on this device, encrypted by your passphrase. If you lose both, your funds are gone — we cannot recover them.",
    passphraseLabel: "Passphrase (encrypts the key on this device)",
    passphrasePlaceholder: "At least 8 characters",
    passphraseConfirmLabel: "Confirm passphrase",
    passphraseTooShort: "Passphrase must be at least 8 characters.",
    passphraseMismatch: "Passphrases do not match.",
    ncBackupAck: "I have saved my secret key somewhere safe. I understand it cannot be recovered.",
    ncSaving: "Saving…",
    ncCreateBtn: "Create wallet",

    // --- Multi-chain setup picker + manage ---
    chainRequired: "Required — the trading chain",
    chainOptional: "Optional",
    chainConfigured: "Set up",
    chainNotSetUp: "Not set up",
    chainContinue: "Continue",
    chainStellarDesc: "Atrium trades on Stellar. This wallet is required.",
    chainsTitle: "Chains",
    removeChainBtn: "Remove",
    removeChainAria: "Remove the {chain} wallet",
    removeChainTitle: "Remove the {chain} wallet?",
    removeChainBody: "This removes your {chain} wallet ({address}) from your Atrium account.",
    removeChainDeviceKey:
      "The encrypted key stored on this device is deleted too. Make sure you have a backup of the secret if you ever want to use this wallet again.",
    removeChainConfirm: "Remove wallet",

    // --- Solana (non-custodial only) ---
    solChainDesc:
      "Receive and hold SOL alongside your Stellar wallet. Non-custodial only — the key never leaves your device.",
    solCreateCard: "Create a Solana wallet on this device",
    solCreateCardDesc: "Generated and encrypted on your device — we only ever store the address.",
    solImportCard: "Import a Solana wallet",
    solImportCardDesc:
      "Paste the Base58 secret your wallet (e.g. Phantom) exports. It stays on this device.",
    solCreateTitle: "Create a Solana wallet",
    solImportTitle: "Import a Solana wallet",
    solAddressLabel: "Solana address",
    solSecretLabel: "Secret key (Base58)",
    solSecretInputLabel: "Solana secret key (Base58)",
    solSecretPlaceholder: "Base58 secret (64 bytes) or 32-byte seed",
    solImportInvalid:
      "That doesn't look like a valid Solana secret key — paste the Base58 secret your wallet exports (64 bytes) or a 32-byte seed.",
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
    secretSavedAck:
      "Ik heb mijn geheime sleutel op een veilige plek bewaard en begrijp dat hij niet kan worden hersteld als ik hem verlies.",
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

    // --- Non-custodial flows op het toestel (gedeeld door Stellar + Solana) ---
    ncCard: "Op dit toestel aanmaken (non-custodial)",
    ncCardDesc:
      "Je sleutel wordt op je toestel gegenereerd en versleuteld — wij zien hem nooit. Je ondertekent elke transactie zelf.",
    ncTitle: "Non-custodial wallet aanmaken",
    ncGenerating: "Sleutel genereren op dit toestel…",
    ncBackupTitle: "Maak nu een back-up van je geheime sleutel.",
    ncBackupWarning:
      "Deze sleutel bestaat alleen op dit toestel, versleuteld met je wachtwoordzin. Verlies je beide, dan ben je je fondsen kwijt — wij kunnen ze niet herstellen.",
    passphraseLabel: "Wachtwoordzin (versleutelt de sleutel op dit toestel)",
    passphrasePlaceholder: "Minstens 8 tekens",
    passphraseConfirmLabel: "Bevestig wachtwoordzin",
    passphraseTooShort: "De wachtwoordzin moet minstens 8 tekens lang zijn.",
    passphraseMismatch: "De wachtwoordzinnen komen niet overeen.",
    ncBackupAck:
      "Ik heb mijn geheime sleutel op een veilige plek bewaard. Ik begrijp dat hij niet kan worden hersteld.",
    ncSaving: "Opslaan…",
    ncCreateBtn: "Wallet aanmaken",

    // --- Multi-chain: keuzescherm + beheer ---
    chainRequired: "Vereist — de chain waarop je handelt",
    chainOptional: "Optioneel",
    chainConfigured: "Ingesteld",
    chainNotSetUp: "Niet ingesteld",
    chainContinue: "Doorgaan",
    chainStellarDesc: "Atrium handelt op Stellar. Deze wallet is vereist.",
    chainsTitle: "Chains",
    removeChainBtn: "Verwijderen",
    removeChainAria: "De {chain}-wallet verwijderen",
    removeChainTitle: "De {chain}-wallet verwijderen?",
    removeChainBody: "Dit verwijdert je {chain}-wallet ({address}) uit je Atrium-account.",
    removeChainDeviceKey:
      "De versleutelde sleutel op dit toestel wordt ook verwijderd. Zorg dat je een back-up van de geheime sleutel hebt als je deze wallet ooit nog wilt gebruiken.",
    removeChainConfirm: "Wallet verwijderen",

    // --- Solana (uitsluitend non-custodial) ---
    solChainDesc:
      "Ontvang en bewaar SOL naast je Stellar-wallet. Uitsluitend non-custodial — de sleutel verlaat je toestel nooit.",
    solCreateCard: "Solana-wallet op dit toestel aanmaken",
    solCreateCardDesc: "Gegenereerd en versleuteld op je toestel — wij bewaren alleen het adres.",
    solImportCard: "Solana-wallet importeren",
    solImportCardDesc:
      "Plak de Base58-geheime sleutel die je wallet (bv. Phantom) exporteert. Hij blijft op dit toestel.",
    solCreateTitle: "Solana-wallet aanmaken",
    solImportTitle: "Solana-wallet importeren",
    solAddressLabel: "Solana-adres",
    solSecretLabel: "Geheime sleutel (Base58)",
    solSecretInputLabel: "Solana geheime sleutel (Base58)",
    solSecretPlaceholder: "Base58-geheim (64 bytes) of 32-byte seed",
    solImportInvalid:
      "Dit lijkt geen geldige Solana geheime sleutel — plak het Base58-geheim dat je wallet exporteert (64 bytes) of een 32-byte seed.",
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
    secretSavedAck:
      "J'ai enregistré ma clé secrète en lieu sûr et je comprends qu'elle ne pourra pas être récupérée en cas de perte.",
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

    // --- Flux non custodial sur l'appareil (partagés par Stellar + Solana) ---
    ncCard: "Créer sur cet appareil (non custodial)",
    ncCardDesc:
      "Votre clé est générée et chiffrée sur votre appareil — nous ne la voyons jamais. Vous signez vous-même chaque transaction.",
    ncTitle: "Créer un wallet non custodial",
    ncGenerating: "Génération d'une clé sur cet appareil…",
    ncBackupTitle: "Sauvegardez votre clé secrète maintenant.",
    ncBackupWarning:
      "Cette clé n'existe que sur cet appareil, chiffrée par votre phrase secrète. Si vous perdez les deux, vos fonds sont perdus — nous ne pouvons pas les récupérer.",
    passphraseLabel: "Phrase secrète (chiffre la clé sur cet appareil)",
    passphrasePlaceholder: "Au moins 8 caractères",
    passphraseConfirmLabel: "Confirmez la phrase secrète",
    passphraseTooShort: "La phrase secrète doit comporter au moins 8 caractères.",
    passphraseMismatch: "Les phrases secrètes ne correspondent pas.",
    ncBackupAck:
      "J'ai enregistré ma clé secrète en lieu sûr. Je comprends qu'elle ne peut pas être récupérée.",
    ncSaving: "Enregistrement…",
    ncCreateBtn: "Créer le wallet",

    // --- Multi-chaîne : écran de choix + gestion ---
    chainRequired: "Requis — la chaîne de trading",
    chainOptional: "Optionnel",
    chainConfigured: "Configuré",
    chainNotSetUp: "Non configuré",
    chainContinue: "Continuer",
    chainStellarDesc: "Atrium trade sur Stellar. Ce wallet est requis.",
    chainsTitle: "Chaînes",
    removeChainBtn: "Supprimer",
    removeChainAria: "Supprimer le wallet {chain}",
    removeChainTitle: "Supprimer le wallet {chain} ?",
    removeChainBody: "Ceci supprime votre wallet {chain} ({address}) de votre compte Atrium.",
    removeChainDeviceKey:
      "La clé chiffrée stockée sur cet appareil est également supprimée. Assurez-vous d'avoir une sauvegarde de la clé secrète si vous comptez réutiliser ce wallet.",
    removeChainConfirm: "Supprimer le wallet",

    // --- Solana (non custodial uniquement) ---
    solChainDesc:
      "Recevez et conservez du SOL aux côtés de votre wallet Stellar. Non custodial uniquement — la clé ne quitte jamais votre appareil.",
    solCreateCard: "Créer un wallet Solana sur cet appareil",
    solCreateCardDesc: "Généré et chiffré sur votre appareil — nous ne stockons que l'adresse.",
    solImportCard: "Importer un wallet Solana",
    solImportCardDesc:
      "Collez la clé secrète Base58 exportée par votre wallet (p. ex. Phantom). Elle reste sur cet appareil.",
    solCreateTitle: "Créer un wallet Solana",
    solImportTitle: "Importer un wallet Solana",
    solAddressLabel: "Adresse Solana",
    solSecretLabel: "Clé secrète (Base58)",
    solSecretInputLabel: "Clé secrète Solana (Base58)",
    solSecretPlaceholder: "Secret Base58 (64 octets) ou seed de 32 octets",
    solImportInvalid:
      "Cela ne ressemble pas à une clé secrète Solana valide — collez le secret Base58 exporté par votre wallet (64 octets) ou une seed de 32 octets.",
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
    secretSavedAck:
      "He guardado mi clave secreta en un lugar seguro y entiendo que no se puede recuperar si la pierdo.",
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

    // --- Flujos no custodiales en el dispositivo (compartidos por Stellar + Solana) ---
    ncCard: "Crear en este dispositivo (no custodial)",
    ncCardDesc:
      "Tu clave se genera y se cifra en tu dispositivo — nunca la vemos. Tú firmas cada transacción.",
    ncTitle: "Crear un wallet no custodial",
    ncGenerating: "Generando una clave en este dispositivo…",
    ncBackupTitle: "Guarda ahora tu clave secreta.",
    ncBackupWarning:
      "Esta clave solo existe en este dispositivo, cifrada con tu frase de contraseña. Si pierdes ambas, tus fondos se pierden — no podemos recuperarlos.",
    passphraseLabel: "Frase de contraseña (cifra la clave en este dispositivo)",
    passphrasePlaceholder: "Al menos 8 caracteres",
    passphraseConfirmLabel: "Confirma la frase de contraseña",
    passphraseTooShort: "La frase de contraseña debe tener al menos 8 caracteres.",
    passphraseMismatch: "Las frases de contraseña no coinciden.",
    ncBackupAck:
      "He guardado mi clave secreta en un lugar seguro. Entiendo que no se puede recuperar.",
    ncSaving: "Guardando…",
    ncCreateBtn: "Crear wallet",

    // --- Multicadena: selector de configuración + gestión ---
    chainRequired: "Obligatoria — la cadena de trading",
    chainOptional: "Opcional",
    chainConfigured: "Configurado",
    chainNotSetUp: "Sin configurar",
    chainContinue: "Continuar",
    chainStellarDesc: "Atrium opera en Stellar. Este wallet es obligatorio.",
    chainsTitle: "Cadenas",
    removeChainBtn: "Eliminar",
    removeChainAria: "Eliminar el wallet de {chain}",
    removeChainTitle: "¿Eliminar el wallet de {chain}?",
    removeChainBody: "Esto elimina tu wallet de {chain} ({address}) de tu cuenta de Atrium.",
    removeChainDeviceKey:
      "La clave cifrada guardada en este dispositivo también se elimina. Asegúrate de tener una copia de la clave secreta si quieres volver a usar este wallet.",
    removeChainConfirm: "Eliminar wallet",

    // --- Solana (solo no custodial) ---
    solChainDesc:
      "Recibe y guarda SOL junto a tu wallet de Stellar. Solo no custodial — la clave nunca sale de tu dispositivo.",
    solCreateCard: "Crear un wallet de Solana en este dispositivo",
    solCreateCardDesc: "Generado y cifrado en tu dispositivo — solo guardamos la dirección.",
    solImportCard: "Importar un wallet de Solana",
    solImportCardDesc:
      "Pega la clave secreta Base58 que exporta tu wallet (p. ej. Phantom). Se queda en este dispositivo.",
    solCreateTitle: "Crear un wallet de Solana",
    solImportTitle: "Importar un wallet de Solana",
    solAddressLabel: "Dirección de Solana",
    solSecretLabel: "Clave secreta (Base58)",
    solSecretInputLabel: "Clave secreta de Solana (Base58)",
    solSecretPlaceholder: "Secreto Base58 (64 bytes) o seed de 32 bytes",
    solImportInvalid:
      "Esto no parece una clave secreta de Solana válida — pega el secreto Base58 que exporta tu wallet (64 bytes) o una seed de 32 bytes.",
  },
};
