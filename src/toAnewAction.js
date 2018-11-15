import { DELIMITER, SEPERATOR } from './actionTypes'

export default function toAnewAction(actionType) {
    return (actionType + '')
        .replace(DELIMITER, '')
        .replace('/', SEPERATOR)
        .split(SEPERATOR)
}
