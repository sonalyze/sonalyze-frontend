// Typdefinition für die Formulardaten
export type FormData = {
    roomName: string;
    dimensions: { width: string; height: string; depth: string; };
    materials: { east: string; west: string; north: string; south: string; floor: string; ceiling: string; };
    furniture: { height: string; points: { x: string; y: string }; }[];
    microphone: { x: string; y: string; z: string; }[];
    speaker: { x: string; y: string; z: string; }[];
};

// Kategorisierte Optionen für die Materialauswahl
export const allMaterialOptions = [
    { labelKey: 'materials.carpet', value: 'Teppich 6mm', categories: ['floor'] },
    { labelKey: 'materials.curtain', value: 'Vorhangstoff, einfach, freihängend', categories: ['wall'] },
    { labelKey: 'materials.woodFloor', value: 'Floors, wood', categories: ['floor'] },
    { labelKey: 'materials.parquetFloor', value: 'Floors, Parkettfußboden', categories: ['floor'] },
    { labelKey: 'materials.acousticFoam', value: 'Walls, Akustik-Schaumstoffplatte', categories: ['wall', 'ceiling'] },
    { labelKey: 'materials.hardSurface', value: 'Harte Flächen (Putz, Mauerwerk, harte Fußböden)', categories: ['wall', 'floor', 'ceiling'] },
    { labelKey: 'materials.windowGlass', value: 'Windows, window glass', categories: ['wall'] },
    { labelKey: 'materials.wood', value: 'wood', categories: ['wall', 'floor', 'ceiling'] },
    { labelKey: 'materials.ceramicTiles', value: 'Ceramic tiles with smooth surface', categories: ['floor'] },
];

// Schlüssel für die Material-Iteration
export const materialKeys: Array<keyof FormData['materials']> = ['east', 'west', 'north', 'south', 'floor', 'ceiling'];

// Validierungsregeln für Pflichtfelder
export const requiredNumericRules = { 
    required: true, 
    pattern: {
        value: /^[0-9]*\.?[0-9]+$/,
        message: "Bitte geben Sie eine gültige Zahl ein."
    }
};

// Validierungsregeln für optionale Felder
export const optionalNumericRules = {
    pattern: {
        value: /^$|^[0-9]*\.?[0-9]+$/, // Erlaubt leere Zeichenkette oder Zahl
        message: "Bitte geben Sie eine gültige Zahl ein."
    }
};

// Hilfsfunktion, um leere Zeichenketten sicher in Zahlen umzuwandeln
export const parseFloatWithDefault = (value: string, defaultValue = 0): number => {
    if (!value || value.trim() === '') return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

// Hilfsfunktion zum Filtern der Materialien basierend auf der Oberfläche
export const getOptionsForSurface = (surfaceKey: keyof FormData['materials']) => {
    const category = ['east', 'west', 'north', 'south'].includes(surfaceKey) ? 'wall' : surfaceKey as 'floor' | 'ceiling';
    return allMaterialOptions.filter(opt => opt.categories.includes(category));
};
