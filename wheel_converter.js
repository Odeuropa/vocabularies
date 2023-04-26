import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import csv from 'csvtojson';
import $rdf from 'rdflib';
import argparse from 'argparse';
import { interlink } from './src/vocabulary.api.js';

import {
    ODEUROPA_VOC,
    RDF,
    RDFS,
    SKOS,
    DC,
    XSD,
    DBP,
    SCHEMA,
    GOLD,
    OWL,
    WDT,
    nsValues,
} from './src/prefixes.js';
import { add, save, capitalize } from './src/utils.js';

function toPredicate(what) {
    if (!what || !what.includes(':')) return null;
    const [pfx, body] = what.split(':');
    return $rdf.sym(nsValues[pfx] + body);
}

const collections = {};

function getCollection(coll, ns, lang = 'en') {
    const name = coll.replace(/\s/g, '_');
    if (collections[name]) return collections[name];

    const x = ns(name);
    add(x, RDF('type'), SKOS('Collection'));
    add(x, SKOS('prefLabel'), coll, lang);
    return x;
}

async function toConcept(s, scheme, ns, meta, lang = 'en') {
    const results = [];
    let concept;
    let id = s['id'];

    const COLS = meta.columns || {};
    for (let i = 1; i <= 5; i++) {
        const lev = `level${i}`;
        const NAME = COLS.name || lev;
        let l = s[NAME] || s.name;

        if (!l) {
            if (i === 1) {
                results.push(null);
                continue;
            } else break;
        }
        l = l.trim();

        const idTemp = l.toLowerCase().replace(/\(.+\)/g, '').trim().replace(/[^\w]/g, '_');

        let prop;
        if (!id) {
            if (meta[lev] === 'concat') id = `${id}_${idTemp}`;
            else {
                id = idTemp;
                prop = meta[lev];
            }
        }
        concept = ns(id);
        add(concept, RDF('type'), SKOS('Concept'));
        add(concept, SKOS('prefLabel'), l.trim(), lang);

        add(concept, SKOS('inScheme'), scheme);

        if (!results[i - 2]) add(concept, SKOS('topConceptOf'), scheme);
        else add(concept, toPredicate(prop) || SKOS('broader'), results[i - 2]);
        results.push(concept);
    }
    if (s.picture) {
        s.picture.split('\n').forEach((pic) => add(concept, SCHEMA('subjectOf'), pic));
    }

    const POS = COLS.pos || 'pos';
    const SYNONYM = COLS.synonym || 'synonym';
    const CATEGORY = COLS.category || 'category';
    const BIB = COLS.bib || 'bib';
    const DEFINITION = COLS.definition || 'definition';
    const EXAMPLE = COLS.example || 'example';
    const SAMEAS = COLS.sameAs || 'sameAs';

    const separator2 = meta.separator2 || /,/g;

    if (s[CATEGORY]) {
        add(getCollection(s[CATEGORY].trim(), ns), SKOS('member'), concept);
    }
    if (s[BIB]) {
        add(concept, DC('bibliographicCitation'), s[BIB].trim());
    }
    if (s[DEFINITION]) {
        add(concept, SKOS('definition'), s[DEFINITION].trim(), lang);
    }

    if (s[EXAMPLE]) {
        add(concept, SKOS('example'), s[EXAMPLE].trim(), lang);
    }

    if (s[SYNONYM]) {
        s[SYNONYM].split(separator2).forEach((syn) => add(concept, SKOS('altLabel'), syn.trim(), lang));
    }
    if (s[POS]) {
        add(concept, RDF('type'), GOLD(capitalize(s[POS].trim()).replace(/e^/, 'al')));
    }
    if (s[SAMEAS]) {
        add(concept, OWL('sameAs'), s[SAMEAS]);
    }
    if (s.cas) {
        add(concept, WDT('P231'), s.cas);
    }
    if (s.chemical) {
        add(concept, WDT('P274'), s.chemical);
    }

    add(concept, SKOS('related'), await interlink(s.related, lang), lang);
    return results;
}

async function main(name, folder = './raw/', outputFolder = './vocabularies') {
    console.log(name);
    const vocFile = path.join(folder, `${name}.csv`);
    const metaFile = path.join(folder, `${name}_meta.yml`);

    const meta = YAML.parse(fs.readFileSync(metaFile, 'utf8'));
    console.log(meta);

    // setup scheme
    const scheme = ODEUROPA_VOC(`${name}/`);
    const ns = $rdf.Namespace(scheme.value);
    add(scheme, RDF('type'), SKOS('ConceptScheme'));
    add(scheme, RDFS('label'), meta.label, meta.lang);
    add(scheme, DC('created'), $rdf.literal(meta.created, XSD('gYear')));
    add(scheme, DC('creator'), meta.creator);
    add(scheme, DC('contributor'), meta.contributor);
    add(scheme, DC('comment'), meta.comment, meta.lang);

    for (const bib of(meta.bib || [])) add(scheme, DC('bibliographicCitation'), bib);

    const { type } = meta;
    if (type) add(scheme, DC('type'), ODEUROPA_VOC(type));

    const raw = await csv({ delimiter: meta.separator || ';' }).fromFile(vocFile);

    let first = null;
    let prev = null;
    Promise.all(raw.map(async(line, l) => {
        const concepts = await toConcept(line, scheme, ns, meta, meta.lang);
        if (type && type.includes('wheel')) {
            if (!first) first = concepts;
            else {
                concepts.forEach((concept, x) => {
                    if (!concept || !prev[x]) return;
                    if (prev[x].value === concept.value) return;

                    add(prev[x], DBP('next'), concept);
                    add(concept, DBP('prev'), prev[x]);

                    if (l === raw.length - 1) {
                        add(first[x], DBP('prev'), concept);
                        add(concept, DBP('next'), first[x]);
                    }
                });
            }

            prev = concepts;
        }
    })).then(() => save(name, outputFolder));
}

function parseArgs() {
    const parser = new argparse.ArgumentParser({
        description: 'Vocabulary converter',
    });

    parser.add_argument('name', {
        help: 'Source file name. ' +
            'The software will search for this name in the `raw` folder.',
    });
    parser.add_argument('-s', '--src', {
        help: 'Source file folder. ',
        default: './raw',
    });
    parser.add_argument('-d', '--dst', {
        help: 'Destination file folder. ',
        default: './vocabularies',
    });
    return parser.parse_args();
}

const { name, src, dst } = parseArgs();
main(name, src, dst);