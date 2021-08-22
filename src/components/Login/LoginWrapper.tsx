import React from 'react';


interface LoginWrapperProps {
    // setUserInfo(id: string, username: string, name: string, token: string, classes: ClassObj[], admin: boolean ): void;
}

const LoginWrapper: React.FC<LoginWrapperProps>  = () => {

    return (
        <div className='align-items-center align-middle my-auto'>
            <h1>Welcome to Virtual Lists</h1>
            <button onClick={()=>{window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + ((window.location.host === 'wustl-cse.help' || window.location.host === 'wustlcse.help') ? '819d2a8b31d47ee1b950' : '334b4b9e657f257e9b88')+'&scope=user:email%20read:user';}} className='btn btn-primary'>Login with Github</button>
            <div className='card card-body bg-secondary my-3 mx-md-auto mx-2' style={{maxWidth: '750px'}}>
                <p>Please make sure to have a school email added to your github account before signing in!</p>
                <p>By logging into this site you agree you are an authorized user and agree to use cookies on this site.</p>
            </div>
        </div>
    );
}

export default LoginWrapper;