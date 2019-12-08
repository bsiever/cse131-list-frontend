import {ErrorTypes} from './types'

const prefixUrl = 'https://rfnyp32d3i.execute-api.us-east-1.amazonaws.com/dev/'

export const websocketUrl = 'wss://dq3o0n1lqf.execute-api.us-east-1.amazonaws.com/dev';

export interface APIResponse {
    success: boolean,
    data?: object,
    errorCode?: ErrorTypes
}

const queryTimeout = 5000;

export const makeRequest = async (name: string, data: any, failureAllowed: boolean = false) : Promise<APIResponse> => {
    try {
        const raw= await Promise.race([
            fetch(prefixUrl+name,{method:'POST', body: JSON.stringify(data)}), //This causes all requests to fail after 5 seconds
            new Promise<Response>((_, reject)=>{setTimeout(()=>reject(new Error('Timeout')),queryTimeout)}) //https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
        ]);
        const json = await raw.json();
        if(raw.status === 200) {
            return {success: true, data: json.data}
        } else {
            if(json.errorCode === ErrorTypes.InvalidToken && !failureAllowed) {
                window.alert('You have been logged out due to inactivity or opening another session.')
                window.location.reload()
            }
            return {success: false, errorCode: json.errorCode}
        }
    } catch(e) {
        return {success: false, errorCode: ErrorTypes.General}
    }
}