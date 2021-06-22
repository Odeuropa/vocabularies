import fs from 'fs-extra';
import path from 'path';
import $rdf from 'rdflib';
import validUrl from 'valid-url';
import { nsValues } from './prefixes.js';

export const store = $rdf.graph();

export function add(s, p, o, lang) {
  if (!s || !p || !o) return;
  /* eslint-disable no-param-reassign  */
  if (typeof o === 'string') o = o.trim().replace(/\n$/, '');
  if (!o || o.value === 'undefined') return;
  if (lang) store.add(s, p, $rdf.literal(o, lang));
  else if (typeof o === 'string' && validUrl.isUri(o)) store.add(s, p, $rdf.sym(o));
  else store.add(s, p, o);
}

export function save(name, outputFolder) {
  const output = path.join(outputFolder, `${name}.ttl`);
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
