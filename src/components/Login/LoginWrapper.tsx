import React from 'react';


interface LoginWrapperProps {
    // setUserInfo(id: string, username: string, name: string, token: string, classes: ClassObj[], admin: boolean ): void;
}

const LoginWrapper: React.FC<LoginWrapperProps>  = () => {

    return (
        <div className='align-items-center align-middle my-auto'>
            <h1>Welcome to Virtual Lists</h1>
            <button onClick={()=>{window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + (window.location.host === '131list.com' ? '880227a28d68408e12cc' : 'bf5c6ed65583e250f70e')+'&scope=user:email%20read:user';}} className='btn btn-primary'>Login with Github</button>
            <div className='card card-body bg-secondary my-3 mx-md-auto mx-2' style={{maxWidth: '750px'}}>
                <p>Please make sure to have a school email added to your github account before signing in!</p>
                <p>By logging into this site you agree you are an authorized user and agree to use cookies on this site.</p>
            </div>
        </div>
    );
}

export default LoginWrapper;