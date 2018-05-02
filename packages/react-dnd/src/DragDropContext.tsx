import React, { Component, ComponentClass } from 'react'
import PropTypes from 'prop-types'
import { DragDropManager, IBackend, BackendFactory } from 'dnd-core'
import invariant from 'invariant'
import hoistStatics from 'hoist-non-react-statics'
import checkDecoratorArguments from './utils/checkDecoratorArguments'

export const CHILD_CONTEXT_TYPES = {
	dragDropManager: PropTypes.object.isRequired,
}

export const createChildContext = (backend: BackendFactory, context: any) => ({
	dragDropManager: new DragDropManager(backend, context),
})

export const unpackBackendForEs5Users = (backendOrModule: any) => {
	// Auto-detect ES6 default export for people still using ES5
	let backend = backendOrModule
	if (typeof backend === 'object' && typeof backend.default === 'function') {
		backend = backend.default
	}
	invariant(
		typeof backend === 'function',
		'Expected the backend to be a function or an ES6 module exporting a default function. ' +
			'Read more: http://react-dnd.github.io/react-dnd/docs-drag-drop-context.html',
	)
	return backend
}

export default function DragDropContext(backendOrModule: any) {
	checkDecoratorArguments('DragDropContext', 'backend', backendOrModule) // eslint-disable-line prefer-rest-params

	const backend: BackendFactory = unpackBackendForEs5Users(backendOrModule)
	const childContext = createChildContext(backend, undefined)

	return function decorateContext(DecoratedComponent: ComponentClass) {
		const displayName =
			DecoratedComponent.displayName || DecoratedComponent.name || 'Component'

		class DragDropContextContainer extends React.Component<any> {
			public static DecoratedComponent = DecoratedComponent
			public static displayName = `DragDropContext(${displayName})`
			public static childContextTypes = CHILD_CONTEXT_TYPES

			private child: any

			public getDecoratedComponentInstance() {
				invariant(
					this.child,
					'In order to access an instance of the decorated component it can not be a stateless component.',
				)
				return this.child
			}

			public getManager() {
				return childContext.dragDropManager
			}

			public getChildContext() {
				return childContext
			}

			public render() {
				return (
					<DecoratedComponent
						{...this.props}
						ref={(child: any) => (this.child = child)}
					/>
				)
			}
		}

		return hoistStatics(DragDropContextContainer, DecoratedComponent)
	}
}
