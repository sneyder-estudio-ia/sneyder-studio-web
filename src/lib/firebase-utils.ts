/**
 * Firebase Optimization Utilities (Sneyder Studio Protocol)
 */

/**
 * Comprime una imagen antes de subirla a Firebase Storage
 * @param {File} file - El archivo original del usuario
 * @returns {Promise<Blob | File>} - El archivo comprimido listo para subir
 */
export async function compressImage(file: File): Promise<Blob | File> {
    // Si no es imagen, retornar original
    if (!file.type.startsWith('image/')) return file;
    // Si es SVG, retornar original (no se comprime con canvas)
    if (file.type.includes('svg')) return file;

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                resolve(file);
                return;
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // Resolución optimizada para web/móvil
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                }
                
                // Exportar como JPEG con calidad del 70%
                canvas.toBlob((blob) => {
                    resolve(blob || file);
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

/**
 * Solicita cuota de almacenamiento persistente al navegador
 */
export async function requestStorageQuota() {
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persist();
            console.log(`CMS: ¿Almacenamiento persistente concedido?: ${isPersisted}`);
            return isPersisted;
        } catch (error) {
            console.warn("CMS: Error al solicitar persistencia de storage:", error);
            return false;
        }
    }
    return false;
}

/**
 * Añade TTL (Time To Live) a un objeto de datos
 * @param data Objeto de datos original
 * @param days Días hasta la expiración (por defecto 60)
 */
export function withTTL(data: any, days: number = 60) {
    return {
        ...data,
        expiresAt: Date.now() + (days * 24 * 60 * 60 * 1000)
    };
}
