import invariant from 'invariant'

const functionProperties = [
    '__proto__',
    'arguments',
    'caller',
    'length',
    'name',
    'prototype',
    '[[FunctionLocation]]',
    '[[Scopes]]',
]

export default function invariantFunctionProperty(name, objectName) {
    invariant(
        functionProperties.indexOf(name) === -1,
        `"${name} is a reserved function property. Please choose a different name " ` +
            `for "${name}" in "${objectName}"`
    )
}
