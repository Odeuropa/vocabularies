import path from 'path';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import csv from 'csvtojson';
import commandLineArgs from 'command-line-args';
import $rdf from 'rdflib';
import { add, store, capitalize } from './src/utils.js';
import langTab from './src/langTab.js';
// import groupTab from './groupTab.js';
// import matchTab from './matchTab.js';
import {
  ODEUROPA, ODEUROPA_VOC, RDF, RDFS, SKOS, DC, XSD, PAV, nsValues,
} from './src/prefixes.js';

function run(options) {
  if (!options.name) return console.error('A name must be specified as first argument');

  const src = options.src || path.join('./raw', options.name);
  const dst = options.dst || path.join('./vocabularies', `${options.name}.ttl`);

  const today = new Date().toISOString().slice(0, 10);

  // setup scheme
  const baseUri = `${ODEUROPA_VOC(options.name).value}/`;
  const scheme = $rdf.sym(ODEUROPA_VOC(options.name));
  const ns = $rdf.Namespace(baseUri);

  add(scheme, RDF('type'), SKOS('ConceptScheme'));
  add(scheme, DC('created'), $rdf.literal('2021-06-01', XSD('date')));
  add(scheme, DC('modified'), $rdf.literal(today, XSD('date')));
  add(scheme, PAV('createdOn'), $rdf.literal(today, XSD('date')));
  add(scheme, PAV('version'), options.version);
  add(scheme, RDFS('label'), capitalize(options.name.replace(/-/, ' ')));

  langTab.setScheme(scheme);

  async function convertFile(file) {
    const lang = path.parse(file).name;

    // const name = lang.split('-')[1];
    return csv().fromFile(file)
      .then((s) => langTab.convert(s, lang, ns));
  }

  const promises = klawSync(src, { nodir: true })
    .map((x) => x.path)
    .filter((x) => x.endsWith('.csv'))
    .map(convertFile);

  return Promise.all(promises)
    .then(() => {
      $rdf.serialize(undefined, store, 'http://example.org', 'text/turtle', (err, str) => {
        if (err) throw (err);
        const data = str.replace('@prefix : <#>.\n', '');

        fs.writeFile(dst, data, 'utf8');
        console.log(`File written: ${dst}`);
      }, { namespaces: nsValues });
    })
    .catch((err) => console.error(err));
}

const optionDefinitions = [
  {
    name: 'name', alias: 'n', type: String, defaultOption: true,
  },
  { name: 'verbose', type: Boolean },
  {
    name: 'src', alias: 's', type: String,
  },
  {
    name: 'dst', alias: 'd', type: String,
  },
  {
    name: 'version', alias: 'v', type: String, defaultValue: '0.1',
  },
];

const options = commandLineArgs(optionDefinitions);
run(options);
