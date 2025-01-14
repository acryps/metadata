# @acryps/metadata JSON+LD Library
All JSON+LD metadata declarations sourced directly from [schema.org](https://schema.org/).

Apply metadata to current page, replacing any metadata set before:
```ts
class BookComponent {
	book: Book;

	async onload() {
		this.book = bookService.find(this.parameters.id);

		new MetaProduct({
			name: book.title,
			offers: new MetaOffer({
				priceCurrency: 'CHF',
				price: book.price
			})
		}).apply();
	}
}
```
