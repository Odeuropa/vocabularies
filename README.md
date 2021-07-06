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


### Skosify

To make them ready to work with [Skosmos](https://github.com/NatLibFi/Skosmos), it is suggested to process the files with [Skosify](https://github.com/NatLibFi/Skosify).

    pip install --upgrade skosify
    skosify vocabularies/olfactory-objects.ttl -o vocabularies/olfactory-objects.ttl
    skosify vocabularies/olfactory-gestures.ttl -o vocabularies/olfactory-gestures.ttl
    skosify vocabularies/fragrant-spaces.ttl -o vocabularies/fragrant-spaces.ttl


docker run --name odeuropa_virtuoso \
-p 8890:8890 -p 1111:1111 \
-e DBA_PASSWORD=odeuropa123 \
-e SPARQL_UPDATE=true \
-e VIRT_SPARQL_ResultSetMaxRows=-1 \
-e VIRT_SPARQL_MaxQueryCostEstimationTime=-1 \
-e VIRT_SPARQL_MaxQueryExecutionTime=-1 \
-v /var/docker/odeuropa/virtuoso/data:/data \
-d d2klab/virtuoso
