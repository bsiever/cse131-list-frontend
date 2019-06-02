import React, { useState } from 'react';

interface LoginProps {
    performLogin: (username:string,password:string) => void
}

const Login: React.FC<LoginProps>  = ({performLogin}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        performLogin(username,password)
    }

    return (
        <div className='align-items-center align-middle my-auto'>
            <h1>Welcome to the CSE 131 Help List!</h1>
            <form onSubmit={handleSubmit}>
                <div className='form-groug'>
                    <label className='text-left'>
                        Email
                        <input type='email' className='form-control' maxLength={50} value={username} onChange={e=>setUsername(e.target.value)} placeholder='Username' required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left'>
                        Password
                        <input type='password' className='form-control' value={password} onChange={e=>setPassword(e.target.value)} placeholder='Password' required />
                    </label>
                </div>
                <button type='submit' className='btn btn-primary'>Submit</button>
            </form>
        </div>
    );
}

export default Login;