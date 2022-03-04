import fs from 'fs-extra';
import $rdf from 'rdflib';
import validUrl from 'valid-url';
import * as iconclass from './iconclass.js';
import { add, capitalize } from './utils.js';
import {
  ODEUROPA, RDF, SKOS, DC, WORDNET, ICONCLASS,
} from './prefixes.js';

let scheme;

const collections = {};

function getCollection(coll, ns) {
  const name = coll.replace(/\s/, '_');
  if (collections[name]) return collections[name];

  const x = ns(name);
  add(x, RDF('type'), SKOS('Collection'));
  add(x, SKOS('prefLabel'), coll, 'en');
  return x;
}

const iconclassMatches = [];
async function toConcept(s, lang, ns) {
  const id = s.ID.trim();
  if (!id) return;
  const label = (lang === 'en') ? s['LABEL en'].trim() : s.LABEL.trim();
  if (!label) {
    if (lang === 'en') iconclassMatches.push({ id: '', label: '' });
    return;
  }

  if (lang === 'en') {
    const res = await iconclass.search(label);
    iconclassMatches.push(res);
  }

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

  if (s.CATEGORY) {
    s.CATEGORY.split(/[,;]/)
      .forEach((r) => add(getCollection(r.trim(), ns), SKOS('member'), concept));
  }

  let hasInternalBroader;
  if (s.PARENT) {
    const b = s.PARENT.split(',')
      .map((x) => x.trim())
      .map((x) => {
        if (validUrl.isUri(x)) return x;
        [x] = x.split(' ');
        if (!Number.isNaN(Number.parseInt(x, 10))) return ns(x);
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
    add(concept, SKOS('closeMatch'), ICONCLASS(s['ICONCLASS CODE']));
  }

  add(concept, SKOS('inScheme'), scheme);
  if (!hasInternalBroader) add(concept, SKOS('topConceptOf'), scheme);

  if (s.BIBLIOGRAPHY) {
    s.BIBLIOGRAPHY.split(';')
      .forEach((b) => add(concept, DC('bibliographicCitation'), b, lang, true));
  }
}

async function convert(source, lang, ns) {
  for (const row of source.filter((s) => s.ID)) await toConcept(row, lang, ns);
  if (lang === 'en') {
    fs.writeFileSync('iconclass.tsv', iconclassMatches.map((x) => `${x.id}\t${x.label}`).join('\n'));
  }
}

function setScheme(_scheme) {
  scheme = _scheme;
}

export default {
  convert,
  setScheme,
};
