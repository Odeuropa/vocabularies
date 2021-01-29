Odeuropa Vocabularies
=====================

The repository contains code, source data and output for Controlled vocabularies about olfactory.

Structure:
- `raw` contains source data to be processed;
- `src` contains code that is imported by `converted.js`;
- `vocabularies` contains output SKOS vocabularies.


### Run the conversion

Install dependencies

    npm install

Run the conversio

    node converter <name>  [--folder FOLDER] [-o OUTPUT]

Arguments  
- `name` is the source file name. The software will search for this name in the `raw` folder (e.g. `drom_circle`)
- `--folder` (optional, default `./raw`) Source file folder.
- `-o`, `--output` (optional, default `./vocabularies`) Destination file folder.

Example: `node converter drom_circle`

### How to write the input for vocabularies

TBW
