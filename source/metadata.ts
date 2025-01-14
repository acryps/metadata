export class Metadata {
	static type: string;
	static active: HTMLScriptElement;

	constructor(data: Object) {
		console.log(data);

		for (let key in data) {
			this[key] = data[key];
		}

		this['@type'] = (this.constructor as any).type;
	}

	apply() {
		if (Metadata.active) {
			Metadata.active.remove();
		}

		const script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify({
			...this,

			'@context': 'https://schema.org'
		});

		document.head.appendChild(script);
	}
}
