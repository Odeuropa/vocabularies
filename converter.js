import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import csv from 'csvtojson';
import $rdf from 'rdflib';
import argparse from 'argparse';

import {
  ODEUROPA, RDF, RDFS, SKOS, DC, XSD, DBP,
} from './src/prefixes.js';
import { add, save } from './src/utils.js';

function toConcept(s, scheme, ns, lang = 'en') {
  let l1 = s.level1;
  if (!l1) return null;
  l1 = l1.trim();
  const id = l1.toLowerCase().replace(/[^\w]/g, '_');

  const concept = ns(id);
  add(concept, RDF('type'), SKOS('Concept'));
  add(concept, SKOS('prefLabel'), l1, lang);

  add(concept, SKOS('topConceptOf'), scheme);

  let l2 = s.level2;
  if (!l2) return [concept];
  l2 = l2.trim();
  const id2 = l2.toLowerCase().replace(/[^\w]/g, '_');
  const concept2 = ns(id2);
  add(concept2, RDF('type'), SKOS('Concept'));
  add(concept2, SKOS('prefLabel'), l2, lang);

  add(concept2, SKOS('inScheme'), scheme);
  add(concept2, SKOS('broader'), concept);

  return [concept, concept2];
}

async function main(name, folder = './raw/', outputFolder = './vocabularies') {
  console.log(name);
  const vocFile = path.join(folder, `${name}.csv`);
  const metaFile = path.join(folder, `${name}_meta.yml`);

  const meta = YAML.parse(fs.readFileSync(metaFile, 'utf8'));
  console.log(meta);

  // setup scheme
  const scheme = ODEUROPA(`${name}/`);
  const ns = $rdf.Namespace(scheme.value);
  add(scheme, RDF('type'), SKOS('ConceptScheme'));
  add(scheme, RDFS('label'), meta.label, 'en');
  add(scheme, DC('created'), $rdf.literal(meta.created, XSD('gYear')));
  add(scheme, DC('creator'), meta.creator);

  const { type } = meta;
  if (type) add(scheme, DC('type'), ODEUROPA(type));

  const raw = await csv({ delimiter: ';' }).fromFile(vocFile);

  let first = null;
  let prev = null;
  raw.forEach((line, l) => {
    const concepts = toConcept(line, scheme, ns, meta.lang);
    if (type === 'scent_wheel') {
      if (!first) first = concepts;
      else {
        concepts.forEach((concept, x) => {
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
  });

  save(name, outputFolder);
}

function parseArgs() {
  const parser = new argparse.ArgumentParser({
    description: 'Vocabulary converter',
  });

  parser.add_argument('name', {
    help: 'Source file name. '
      + 'The software will search for this name in the `raw` folder.',
  });
  parser.add_argument('--folder', {
    help: 'Source file folder. ',
    default: './raw',
  });
  parser.add_argument('-o', '--output', {
    help: 'Destination file folder. ',
    default: './vocabularies',
  });

  return parser.parse_args();
}

const { name, folder, output } = parseArgs();
main(name, folder, output);
