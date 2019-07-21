import React, { useState } from 'react';
import Login from './Login';
import { makeRequest, APIResponse} from '../../utility/api';
import { ErrorTypes, ClassObj } from '../../utility/types';

interface LoginWrapperProps {
    setUserInfo(id: string, username: string, name: string, token: string, classes: ClassObj[], admin: boolean ): void;
}

const LoginWrapper: React.FC<LoginWrapperProps>  = ({setUserInfo}) => {

    const [errorMessage, setErrorMessage] = useState('');

    const performLogin = async (username: string, password: string) => {
        let response: APIResponse = await makeRequest('login',{username, password});
        if(response.success) {
          const data: any = response.data;
          setUserInfo(data.id, data.username, data.fullName, data.userToken, data.classes, data.admin);
        } else {
            switch(response.errorCode) {
                case ErrorTypes.InvalidLogin:
                    setErrorMessage('Invalid Username or Password');
                    break;
                default:
                    setErrorMessage('An Error Occured');
                    break;
            }
        }
    }

    return (
        <div className='align-items-center align-middle my-auto'>
            <Login performLogin={performLogin} />
            <p className='p-3'>{errorMessage}</p>
        </div>
    );
}

export default LoginWrapper;