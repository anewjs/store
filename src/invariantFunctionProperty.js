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
    const isValid = functionProperties.indexOf(name) === -1

    invariant(
        isValid,
        `"${name} is a reserved function property. Please choose a different name " ` +
            `for "${name}" in "${objectName}"`
    )

    return isValid
}
