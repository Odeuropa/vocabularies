import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import $rdf from 'rdflib';
import validUrl from 'valid-url';
import WBK from 'wikibase-sdk';
import yaml from 'yaml';
import { nsValues } from './prefixes.js';

const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

export const store = $rdf.graph();

function minimalUrlencoding(url) {
    // replace only the problematic chars
    return `${url}`.replaceAll(' ', '%20')
        .replaceAll('"', '%22')
        .replaceAll('^', '%5E')
        .replaceAll('(', '%28')
        .replaceAll(')', '%29');
}

export function add(s, p, o, lang, opt = {}) {
    if (!s || !p || !o) return;

    /* eslint-disable no-param-reassign  */
    if (o instanceof $rdf.Node) {
        store.add(s, p, o);
        return;
    }
    if (Array.isArray(o)) {
        o.forEach((ox) => add(s, p, ox, lang));
        return;
    }
    if (typeof o === 'string') o = o.trim().replace(/\n$/, '');
    if (!o || o.value === 'undefined' || o === '?') return;

    if (opt.forceLink) store.add(s, p, $rdf.sym(minimalUrlencoding(o)));
    else if (!opt.forceLiteral && typeof o === 'string' && validUrl.isUri(o)) store.add(s, p, $rdf.sym(o));
    else if (lang) store.add(s, p, $rdf.literal(o, lang));
    else store.add(s, p, o);
}

export function save(name, outputFolder) {
    const output = path.join(outputFolder, `${name.replace('/', '-')}.ttl`);
    store.namespaces = nsValues;

    $rdf.serialize(undefined, store, 'http://example.org', 'text/turtle', (err, str) => {
        if (err) throw (err);
        const data = str
            .replace('@prefix : <#>.\n', '');

        fs.writeFile(output, data, 'utf8');
        console.log(`File written: ${output}`);
    });
}

export function capitalize(string) {
    if (!string) return null;
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const wdImageFile = './raw/wikidata_images.yaml';
const wdImageCache = yaml.parse(fs.readFileSync(wdImageFile, 'utf8'));

export async function getWikidataImage(uri) {
    const id = uri.split('/').pop();
    if (wdImageCache[id]) return wdImageCache[id];

    const apiUri = wdk.getEntities({
        ids: [id],
        languages: ['en'], // returns all languages if not specified
        props: ['claims'],
    });

    const res = await axios.get(apiUri);
    const data = res.data.entities[id];
    const images = data.claims.P18;
    if (!images || !images.length) return null;
    const imageFile = images[0].mainsnak.datavalue.value;

    const imageUri = wdk.getImageUrl(imageFile);
    wdImageCache[id] = imageUri;
    fs.writeFileSync(wdImageFile, yaml.stringify(wdImageCache));
    return imageUri;
}