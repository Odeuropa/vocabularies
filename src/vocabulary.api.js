import path from 'path';
import axios from 'axios';

const API = 'data.odeuropa.eu/api/vocabulary/';

export async function query(q, lang, domain) {
    return axios.get(`http://${path.join(API, domain)}`, {
        params: {
            q,
            lang,
        },
    }).then((res) => res.data);
}

export async function interlink(q, lang, domain) {
    if (!q) return null;
    let res = await query(q, lang, domain || 'olfactory-objects');
    if (res && res[0].confidence > 0.7) return res[0].id;
    if (!domain) {
        res = await query(q, lang, domain || 'fragrant-spaces');
        if (res && res[0].confidence > 0.7) return res[0].id;
    }
    return null;
}