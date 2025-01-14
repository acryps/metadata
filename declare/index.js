import { join } from 'path';
import { createWriteStream } from 'fs';

const sourceLocation = 'https://schema.org/version/latest/schemaorg-all-https.jsonld';

// types provided by typescript
const systemTypes = new Map()
	.set('Text', 'string')

	.set('Number', 'number')
	.set('Integer', 'number')

	.set('Boolean', 'boolean')

	.set('URL', 'string')

	.set('Date', 'Date')
	.set('Time', 'Date')
	.set('DateTime', 'Date');

// classes that are used to represent internal types
const ignoredTypes = ['DataType'];

const outputLocation = join('..', 'source', 'types.ts');

fetch(sourceLocation).then(response => response.json()).then(source => {
	const graph = source['@graph'];
	let types = [];

	const unpackDescription = source => {
		const comment = source['rdfs:comment'];

		if (typeof comment == 'object') {
			return comment['@value'];
		}

		return comment;
	};

	for (let declaration of graph) {
		if (declaration['@type'] == 'rdfs:Class') {
			const type = {
				name: declaration['@id'].replace('schema:', ''),
				description: unpackDescription(declaration),
				properties: []
			};

			if ('rdfs:subClassOf' in declaration) {
				let parent = declaration['rdfs:subClassOf'];

				// only use first superclass
				if (Array.isArray(parent)) {
					parent = parent[0];
				}

				type.superclass = parent['@id'].replace('schema:', '');
			}

			if (!ignoredTypes.includes(type.name)) {
				types.push(type);
			}
		}
	}

	for (let declaration of graph) {
		if (declaration['@type'] == 'rdf:Property' && !('schema:supersededBy' in declaration)) {
			let valueTypes = declaration['schema:rangeIncludes'];

			if (!Array.isArray(valueTypes)) {
				valueTypes = [valueTypes];
			}

			const property = {
				name: declaration['@id'].replace('schema:', ''),
				description: unpackDescription(declaration),
				valueTypes: valueTypes.map(type => type['@id'].replace('schema:', ''))
			};

			const domain = declaration['schema:domainIncludes'];

			for (let source of Array.isArray(domain) ? domain : [domain]) {
				const name = source['@id'].replace('schema:', '');

				types.find(type => type.name == name).properties.push(property);
			}
		}
	}

	const writer = createWriteStream(outputLocation);

	writer.write(`import { Metadata } from './metadata';\n\n`);

	for (let type of [...types]) {
		if (systemTypes.has(type.superclass)) {
			writer.write(`type Meta${type.name} = ${systemTypes.get(type.superclass)};\n`);

			types.splice(types.indexOf(type), 1);
		}
	}

	writer.write('\n');

	// sort dependencies
	const sortedTypes = types.filter(type => !type.superclass);
	types = types.filter(type => !sortedTypes.includes(type));

	while (types.length) {
		const next = [];

		for (let type of types) {
			if (sortedTypes.find(existing => existing.name == type.superclass)) {
				next.push(type);
			}
		}

		sortedTypes.push(...next);
		types = types.filter(type => !sortedTypes.includes(type));
	}

	types = sortedTypes;

	// remove properties contained in parent classes
	for (let type of types) {
		type.properties.sort((a, b) => a.name.localeCompare(b.name));

		let tip = type.superclass;

		while (tip) {
			const superclass = types.find(type => type.name == tip);

			for (let property of [...type.properties]) {
				if (superclass.properties.find(parentProperty => property.name == parentProperty.name)) {
					type.properties.splice(type.properties.indexOf(property));
				}
			}

			tip = superclass.superclass;
		}
	}

	for (let type of types) {
		for (let line of type.description.trim().split('\\n')) {
			for (let part of line.trim().split('\n')) {
				writer.write(`// ${part.trim()}\n`);
			}
		}

		writer.write('//\n');
		writer.write(`// automatically generated declaration from ${sourceLocation}\n`);
		writer.write(`export class Meta${type.name}`);

		if (type.superclass) {
			writer.write(` extends Meta${type.superclass}`);
		} else {
			writer.write(` extends Metadata`);
		}

		writer.write(' {\n');

		writer.write(`\tstatic type = '${type.name}';\n\n`);

		for (let property of type.properties) {
			for (let line of property.description.trim().split('\\n')) {
				for (let part of line.trim().split('\n')) {
					writer.write(`\t// ${part.trim()}\n`);
				}
			}

			writer.write(`\tdeclare ${property.name}?: `);

			for (let index = 0; index < property.valueTypes.length; index++) {
				if (index) {
					writer.write(' | ');
				}

				const type = property.valueTypes[index];

				if (systemTypes.has(type)) {
					writer.write(`${systemTypes.get(type)}`);
				} else {
					writer.write(`Meta${type}`);
				}
			}

			writer.write(';\n\n');
		}

		writer.write(`\tconstructor(data: Partial<Meta${type.name}>) { super(data); }\n`);

		writer.write('}\n\n');
	}

	console.log(`Declared ${types.length} types`);
});
