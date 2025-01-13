export class Metadata {
	static active: HTMLScriptElement;

	constructor(private data: Object) {
		for (let key in data) {
			this[key] = data[key];
		}
	}

	apply() {
		if (Metadata.active) {
			Metadata.active.remove();
		}

		const script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify(this);

		document.head.appendChild(script);
	}
}
