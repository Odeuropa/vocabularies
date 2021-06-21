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

Run the conversion for scent wheels

    node wheel_converter <name>  [--folder FOLDER] [-o OUTPUT]

Arguments  
- `name` is the source file name. The software will search for this name in the `raw` folder (e.g. `drom_circle`)
- `-s`, `--src` (optional, default `./raw`) Source file folder.
- `-d`, `--dst` (optional, default `./vocabularies`) Destination file folder.

Example: `node wheel_converter drom_circle`


Run the conversion for spreadsheet exports (csv)

    node table_converter <name>  [--src FOLDER] [-dst DESTINATION]

Arguments  
- `name` is the source file name. The software will search for this name in the `raw` folder (e.g. `fragrant-spaces`)
- `-s`, `--src` (optional, default `./raw`) Source file folder.
- `-d`, `--dst` (optional, default `./vocabularies`) Destination file folder.

Example: `node table_converter fragrant-spaces`


### How to write the input for vocabularies

TBW
