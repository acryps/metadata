import { MetaAnswer, MetaArticle, MetaFAQPage, MetaQuestion } from './types';

export * from './metadata';
export * from './types';

new MetaArticle({
	name: 'Test'
})

new MetaFAQPage({
	mainEntity: new MetaQuestion({
		name: "Test",

		acceptedAnswer: new MetaAnswer({
			text: "test"
		})
	})
})
