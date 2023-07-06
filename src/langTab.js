import fs from 'fs-extra';
import $rdf from 'rdflib';
import axios from 'axios';
import validUrl from 'valid-url';
import WBK from 'wikibase-sdk';
import * as iconclass from './iconclass.js';
import { add, capitalize, getWikidataImage } from './utils.js';
import {
    RDF,
    SKOS,
    DC,
    WORDNET,
    ICONCLASS,
    OWL,
    SCHEMA
} from './prefixes.js';

let scheme;
let images = [];

const collections = {};

const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql',
});

function getCollection(coll, ns) {
    const name = coll.replace(/\s/, '_');
    if (collections[name]) return collections[name];

    const x = ns(name);
    add(x, RDF('type'), SKOS('Collection'));
    add(x, SKOS('prefLabel'), coll, 'en');
    return x;
}

const iconclassMatches = [];
const wdMatches = [];
async function toConcept(s, lang, ns) {
    const id = s.ID.trim();
    if (!id) return;
    const label = (lang === 'en') ? s['LABEL en'].trim() : s.LABEL.trim();
    if (!label) {
        if (lang === 'en') {
            iconclassMatches.push({ id: '', label: '' });
            wdMatches.push({ concepturi: '', label: '' });
        }
        return;
    }

    // if (lang === 'en') {
    //   const res = await iconclass.search(label);
    //   iconclassMatches.push(res);
    // }

    const concept = ns(id);
    add(concept, RDF('type'), SKOS('Concept'));

    // if (s[k.QUAL]) label += ` (${s[k.QUAL].trim()})`;
    if (!label.startsWith('<')) add(concept, SKOS('prefLabel'), capitalize(label.replace(/\.$/, '')), lang);
    if (s.SYNONYMS) {
        s.SYNONYMS.split(',')
            .forEach((syn) => add(concept, SKOS('altLabel'), capitalize(syn.replace(/\.$/, '')), lang));
    }
    add(concept, SKOS('definition'), capitalize(s.DEFINITION), lang);

    if (s.RELATED) {
        s.RELATED.split(',')
            .map((r) => r.split(' ')[0].trim())
            .filter((r) => !Number.isNaN(Number.parseInt(r, 10)))
            .forEach((r) => add(concept, SKOS('related'), ns(r)));
    }

    if (s['RELATED OBJECT']) {
        s['RELATED OBJECT'].split(',')
            .map((r) => r.split(' ')[0].trim())
            .filter((r) => !Number.isNaN(Number.parseInt(r, 10)))
            .forEach((r) => add(concept, SKOS('related'), $rdf.sym(`http://data.odeuropa.eu/olfactory_objects/${r}`)));
    }
    if (s['SAMEAS OBJECT']) {
        s['SAMEAS OBJECT'].split(',')
            .map((r) => r.split(' ')[0].trim())
            .filter((r) => !Number.isNaN(Number.parseInt(r, 10)))
            .forEach((r) => add(concept, OWL('sameAs'), $rdf.sym(`http://data.odeuropa.eu/olfactory_objects/${r}`)));
    }

    if (s.CATEGORY) {
        s.CATEGORY.split(/[,;]/)
            .forEach((r) => add(getCollection(r.trim(), ns), SKOS('member'), concept));
    }

    let wdlink = false;

    let imgLink = images.find(x => x.startsWith(id + '.'));
    imgLink = imgLink && 'https://data.odeuropa.eu/image/ss/' + imgLink;

    if (s.INTERLINKS) {
        const iks = s.INTERLINKS.split(' ');
        iks.forEach((r) => add(concept, OWL('sameAs'), r));
        wdlink = iks.find((r) => r.includes('wikidata'));

        if (!imgLink && wdlink) {
            // add image link
            imgLink = await getWikidataImage(wdlink);
        }
    }

    if (imgLink)
        add(concept, SCHEMA('image'), imgLink, null, { forceLink: true });

    if (lang === 'en' && !wdlink) {
        // search in wikidata
        // const { data } = await axios.get(wdk.searchEntities(label));
        // const res = data && data.search && data.search[0];
        // wdMatches.push(res || { concepturi: '', label: '' });
    }

    let hasInternalBroader;
    if (s.PARENT) {
        const b = s.PARENT.split(',')
            .map((x) => x.trim())
            .map((x) => {
                if (!x) return null
                if (validUrl.isUri(x)) return x;
                [x] = x.split(' ');
                if (!Number.isNaN(Number.parseInt(x, 10))) return ns(x);
                console.log('parent not found', id, x)
                return null;
            })
            .filter((x) => x);

        hasInternalBroader = b.some((x) => x instanceof $rdf.NamedNode);
        b.forEach((x) => add(concept, SKOS('broader'), x));
    }

    if (s['WordNet ID']) {
        add(concept, SKOS('exactMatch'), WORDNET(s['WordNet ID']));
    }
    if (s['ICONCLASS CODE'] && s['ICONCLASS CODE'].toLowerCase() !== 'x') {
        for (let icl of s['ICONCLASS CODE'.split(',')])
            add(concept, SKOS('closeMatch'), ICONCLASS(icl.trim()));
    }

    if (lang == 'en') {
        add(concept, SKOS('inScheme'), scheme);
        if (!hasInternalBroader) add(concept, SKOS('topConceptOf'), scheme);
    }

    if (s.BIBLIOGRAPHY) {
        s.BIBLIOGRAPHY.split(';')
            .forEach((b) => add(concept, DC('bibliographicCitation'), b, lang, { forceLiteral: true }));
    }
}

async function convert(source, lang, ns) {
    if (ns().value.includes('olfactory-objects')) {
        let data = fs.readFileSync('raw/olfactory-objects-images.txt', { encoding: 'utf8', flag: 'r' })
        images = data.split('\n');
    }
    for (const row of source.filter((s) => s.ID)) {
        await toConcept(row, lang, ns);
    }
    // if (lang === 'en') {
    // fs.writeFileSync('wikidata.tsv', wdMatches.map((x) => `${x.concepturi}\t${x.label}`).join('\n'));
    //   fs.writeFileSync('iconclass.tsv', iconclassMatches.map((x) => `${x.id}\t${x.label}`).join('\n'));
    // }
}

function setScheme(_scheme) {
    scheme = _scheme;
}

export default {
    convert,
    setScheme,
};