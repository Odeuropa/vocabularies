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

Examples:
      node table_converter fragrant-spaces
      node table_converter olfactory-objects
      node table_converter olfactory-gestures


### How to write the input for vocabularies

TBW


### Skosify

To make them ready to work with [Skosmos](https://github.com/NatLibFi/Skosmos), it is suggested to process the files with [Skosify](https://github.com/NatLibFi/Skosify).

    pip install --upgrade skosify
    skosify vocabularies/olfactory-objects.ttl -o vocabularies/olfactory-objects.ttl
    skosify vocabularies/olfactory-gestures.ttl -o vocabularies/olfactory-gestures.ttl
    skosify vocabularies/fragrant-spaces.ttl -o vocabularies/fragrant-spaces.ttl
    skosify vocabularies/noses.ttl -o vocabularies/noses.ttl

## Funding acknowledgement

<img src="https://github.com/Odeuropa/.github/raw/main/profile/eu-logo.png" width="80" height="54" align="left" alt="EU logo" />

This work has been realised in the context of [Odeuropa](https://odeuropa.eu/), a research project that has received funding from the European Union’s Horizon 2020 research and innovation programme under grant agreement No. 101004469.
