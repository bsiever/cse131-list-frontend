import {ErrorTypes} from './types'

const prefixUrl = 'https://9oqr6c5gs9.execute-api.us-east-1.amazonaws.com/dev/'

export interface Response {
    success: boolean
}

export interface SuccessfulResponse {
    success: true,
    data: object
}

export interface FailedResponse {
    success: false,
    errorCode: ErrorTypes
}

export const makeRequest = async (name: string, data: any) : Promise<Response> => {
    try {
        const raw = await fetch(prefixUrl+name,{method:'POST', body: JSON.stringify(data)})
        const json = await raw.json();
        if(raw.status === 200) {
            return {success: true, data: json} as SuccessfulResponse
        } else {
            return {success: false, errorCode: json.errorCode} as FailedResponse
        }
    } catch(e) {
        return {success: false, errorCode: ErrorTypes.General} as FailedResponse
    }
    

}