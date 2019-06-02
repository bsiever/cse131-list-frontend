import React, { useState } from 'react';
import './Login.css';

const Login = ({performLogin}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = e => {
        if(e) e.preventDefault();
        performLogin(username,password)
    }

    return (
        <div className='Login container'>
            <form onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input type='text' maxLength='50' values={username} onChange={e=>setUsername(e.target.value)} placeholder='Username' required />
                </label>
                <label>
                    Password:
                    <input type='password' values={password} onChange={e=>setPassword(e.target.value)} placeholder='Password' required />
                </label>
                <input type='submit' />
            </form>
        </div>
    );
}

export default Login;
