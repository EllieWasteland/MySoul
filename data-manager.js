// data-manager.js

// Clave principal para el almacenamiento unificado en localStorage
const UNIFIED_STORAGE_KEY = 'mySoul-data-v1';

// Claves antiguas para la migración
const OLD_MYTIME_KEY = 'foco-app-data-v1';
const OLD_MYMEMORY_KEY = 'myMemory-data-v1';

/**
 * Obtiene la estructura de datos por defecto para toda la aplicación.
 * @returns {object} El objeto de estado inicial.
 */
function getDefaultUnifiedState() {
    return {
        myTime: {
            userName: null,
            tasks: [],
            schedule: [],
            currentView: 'dashboard',
            selectedTaskId: null,
            selectedSubjectId: null,
            tempSubtasks: [],
            calendarDate: new Date().toISOString(),
            wallpaper: null,
            filters: { priority: 'all', tag: 'all' },
            zenSettings: { pomodoro: 25, shortBreak: 5, longBreak: 15, color: '#00F0FF' },
            gamification: { streak: 0, lastCompletionDate: null, achievements: [], pomodoroCount: 0 },
            currentZenTaskId: null
        },
        myMemory: {
            memories: [],
            settings: { theme: 'dark' }
        },
        globalSettings: {
            // Aquí se pueden añadir ajustes globales para el Hub en el futuro
        }
    };
}

/**
 * Lee los datos unificados desde localStorage. Si no existen, los inicializa.
 * @returns {object} El objeto de datos unificado.
 */
function getUnifiedData() {
    const data = localStorage.getItem(UNIFIED_STORAGE_KEY);
    if (data) {
        // Asegurarse de que el objeto leído tenga todas las claves por defecto
        const parsedData = JSON.parse(data);
        const defaultState = getDefaultUnifiedState();
        // Fusionar para evitar errores si se añaden nuevas propiedades en el futuro
        return {
            ...defaultState,
            ...parsedData,
            myTime: { ...defaultState.myTime, ...(parsedData.myTime || {}) },
            myMemory: { ...defaultState.myMemory, ...(parsedData.myMemory || {}) },
        };
    }
    return getDefaultUnifiedState();
}

/**
 * Guarda el objeto de datos unificado en localStorage.
 * @param {object} data - El objeto de datos completo para guardar.
 */
function saveUnifiedData(data) {
    try {
        localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error al guardar los datos unificados:", error);
    }
}

/**
 * Migra los datos de las versiones antiguas (foco-app-data-v1, myMemory-data-v1)
 * al nuevo formato unificado. Se ejecuta solo una vez.
 */
function migrateOldData() {
    const oldMyTimeData = localStorage.getItem(OLD_MYTIME_KEY);
    const oldMyMemoryData = localStorage.getItem(OLD_MYMEMORY_KEY);

    // Solo migrar si no existen datos unificados y sí existen datos antiguos
    if (!localStorage.getItem(UNIFIED_STORAGE_KEY) && (oldMyTimeData || oldMyMemoryData)) {
        console.log("Iniciando migración de datos antiguos...");
        const unifiedData = getDefaultUnifiedState();

        if (oldMyTimeData) {
            try {
                const parsedTimeData = JSON.parse(oldMyTimeData);
                // Combina los datos antiguos con la estructura por defecto de myTime
                unifiedData.myTime = { ...unifiedData.myTime, ...parsedTimeData };
                console.log("Datos de MyTime migrados.");
            } catch (e) {
                console.error("Error al parsear datos antiguos de MyTime:", e);
            }
        }

        if (oldMyMemoryData) {
            try {
                const parsedMemoryData = JSON.parse(oldMyMemoryData);
                 // Combina los datos antiguos con la estructura por defecto de myMemory
                unifiedData.myMemory = { ...unifiedData.myMemory, ...parsedMemoryData };
                console.log("Datos de MyMemory migrados.");
            } catch (e) {
                console.error("Error al parsear datos antiguos de MyMemory:", e);
            }
        }

        // Guarda el nuevo formato unificado
        saveUnifiedData(unifiedData);

        // Opcional pero recomendado: Limpia los datos antiguos después de la migración
        localStorage.removeItem(OLD_MYTIME_KEY);
        localStorage.removeItem(OLD_MYMEMORY_KEY);
        
        console.log("Migración completada. Los datos antiguos han sido eliminados.");
        // Recargar la página para asegurar que todas las apps usan los nuevos datos
        alert("Tus datos han sido actualizados al nuevo formato. La aplicación se recargará.");
        window.location.reload();
    }
}

// Ejecutar la migración tan pronto como se cargue el script
migrateOldData();
