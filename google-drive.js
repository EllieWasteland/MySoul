// google-drive.js

// --- VARIABLES GLOBALES Y DE ESTADO ---
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = 'mysoul_backup.json';
let tokenClient;
let isUserLoggedIn = false;

// --- FUNCIONES DE INICIALIZACIÓN DE GOOGLE API ---

/**
 * Se llama cuando la librería GAPI (Google API) ha terminado de cargarse.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Inicializa el cliente de la API de GAPI, cargando el documento de descubrimiento de la API de Drive.
 */
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        console.log('Cliente GAPI inicializado.');
    } catch (error) {
        console.error('Error inicializando el cliente GAPI:', error);
    }
}

/**
 * Se llama cuando la librería GIS (Google Identity Services) ha terminado de cargarse.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: '', // El callback se define dinámicamente al hacer clic
    });
    console.log('Cliente de identidad de Google inicializado.');
}


// --- FUNCIONES DE AUTENTICACIÓN ---

/**
 * Maneja el flujo de inicio de sesión cuando el usuario hace clic en el botón.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error de autenticación:', resp);
            showModalAlert('Hubo un error durante el inicio de sesión.', 'Error');
            throw (resp);
        }
        isUserLoggedIn = true;
        console.log('¡Inicio de sesión exitoso!');
        updateUiForLoggedInState();
        await loadDataFromDrive(); // Intenta cargar datos justo después de iniciar sesión.
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 * Cierra la sesión del usuario.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            isUserLoggedIn = false;
            console.log('Sesión cerrada.');
            updateUiForLoggedOutState();
        });
    }
}


// --- LÓGICA DE INTERACCIÓN CON GOOGLE DRIVE ---

/**
 * Busca el archivo de backup en la App Data Folder.
 * @returns {Promise<string|null>} El ID del archivo si se encuentra, si no, null.
 */
async function findBackupFile() {
    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 10
        });
        const files = response.result.files;
        const backupFile = files.find(file => file.name === BACKUP_FILENAME);
        return backupFile ? backupFile.id : null;
    } catch (error) {
        console.error("Error buscando el archivo de backup:", error);
        return null;
    }
}

/**
 * Guarda el estado actual de la app (el objeto JSON completo) en Google Drive.
 * Crea un nuevo archivo si no existe, o actualiza el existente.
 */
async function saveDataToDrive() {
    if (!isUserLoggedIn) {
        console.log("El usuario no ha iniciado sesión. No se puede guardar en Drive.");
        return;
    }

    const fileContent = JSON.stringify(getUnifiedData());
    const fileId = await findBackupFile();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
        'name': BACKUP_FILENAME,
        'mimeType': 'application/json',
    };

    const requestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;

    const path = `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`;
    const method = fileId ? 'PATCH' : 'POST';

    try {
        await gapi.client.request({
            'path': path,
            'method': method,
            'params': { 'uploadType': 'multipart' },
            'headers': { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            'body': requestBody
        });
        console.log("Datos guardados con éxito en Drive.");
        showModalAlert("Copia de seguridad guardada en Google Drive.");
    } catch (error) {
        console.error("Error al guardar en Drive:", error);
        showModalAlert("Error al guardar la copia de seguridad.", "Error");
    }
}

/**
 * Carga los datos desde el archivo de backup en Google Drive.
 * Si lo encuentra, pregunta al usuario si desea restaurar.
 */
async function loadDataFromDrive() {
    if (!isUserLoggedIn) return;

    const fileId = await findBackupFile();
    if (!fileId) {
        console.log("No se encontró archivo de backup en Drive. Se usará la data local.");
        // Opcional: podrías guardar automáticamente la data local en la nube la primera vez.
        // await saveDataToDrive();
        return;
    }

    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        const cloudData = response.result;
        
        showModalConfirm(
            "Se encontró una copia de seguridad en la nube. ¿Deseas restaurarla? Se sobreescribirán tus datos locales.", 
            () => {
                saveUnifiedData(cloudData);
                showModalAlert("Datos restaurados. La aplicación se recargará.", "Éxito");
                setTimeout(() => window.location.reload(), 2000);
            }, 
            "Restaurar Copia"
        );

    } catch (error) {
        console.error("Error cargando datos desde Drive:", error);
        showModalAlert("No se pudo cargar la copia de seguridad desde la nube.", "Error");
    }
}
