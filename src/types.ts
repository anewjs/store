export enum CallType {
    ACTION = 'ACTION',
    REDUCER = 'REDUCER',
}

export interface FunctionWithProps extends Function {
    [x: string]: any
}

export interface ObjectWithProps extends Object {
    [x: string]: any
}
