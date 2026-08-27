const API_BASE_URL = 'https://notmizel-ai.onrender.com/api/v1';

export class NotMizelAPI {
    static getAuthHeader() {
        const token = localStorage.getItem('supabase_token');
        return token ? { 'Authorization': token } : {};
    }

    static async notarizeHash(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/notarize-hash`, {
            method: 'POST',
            headers: { ...this.getAuthHeader() },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Errore durante la notarizzazione hash');
        }
        return await response.json();
    }

    static async createAuthorProof(file, artistName, workTitle, region) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('artist_name', artistName);
        formData.append('work_title', workTitle);
        formData.append('region', region);

        const response = await fetch(`${API_BASE_URL}/author-proof`, {
            method: 'POST',
            headers: { ...this.getAuthHeader() },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Errore generazione Prova d\'Autore');
        }
        return await response.json();
    }
}
