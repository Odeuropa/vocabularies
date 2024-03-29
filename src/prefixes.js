import $rdf from 'rdflib';

export const ODEUROPA = $rdf.Namespace('http://data.odeuropa.eu/');
export const ODEUROPA_VOC = $rdf.Namespace('http://data.odeuropa.eu/vocabulary/');
export const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
export const RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
export const SKOS = $rdf.Namespace('http://www.w3.org/2004/02/skos/core#');
export const DC = $rdf.Namespace('http://purl.org/dc/terms/');
export const XSD = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
export const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
export const PAV = $rdf.Namespace('http://purl.org/pav/');
export const PROV = $rdf.Namespace('http://www.w3.org/ns/prov#/');
export const WD = $rdf.Namespace('http://www.wikidata.org/entity/');
export const WDT = $rdf.Namespace('http://www.wikidata.org/prop/direct/');
export const DBP = $rdf.Namespace('http://dbpedia.org/property/');
export const WORDNET = $rdf.Namespace('http://wordnet-rdf.princeton.edu/id/');
export const ICONCLASS = $rdf.Namespace('http://iconclass.org/');
export const SCHEMA = $rdf.Namespace('https://schema.org/');
export const OWL = $rdf.Namespace('http://www.w3.org/2002/07/owl#');
export const GOLD = $rdf.Namespace('http://purl.org/linguistics/gold/');
export const CHEMINF = $rdf.Namespace('http://semanticscience.org/resource/CHEMINF_')
export const SEMSCIENCE = $rdf.Namespace('http://semanticscience.org/resource/')

export const nsValues = {
    odeuropa: ODEUROPA().value,
    voc: ODEUROPA_VOC().value,
    skos: SKOS().value,
    dct: DC().value,
    xsd: XSD().value,
    getty: 'http://vocab.getty.edu/aat/',
    rdfs: RDFS().value,
    foaf: FOAF().value,
    pav: PAV().value,
    prov: PROV().value,
    wd: WD().value,
    wdt: WDT().value,
    dbp: DBP().value,
    wordnet: WORDNET().value,
    iconclass: ICONCLASS().value,
    schema: SCHEMA().value,
    owl: OWL().value,
    gold: GOLD().value,
    cheminf: CHEMINF().value,
    sscience: SEMSCIENCE().value,
};