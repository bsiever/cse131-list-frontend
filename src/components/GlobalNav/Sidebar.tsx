import React, { useState} from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { ErrorTypes } from '../../utility/types'
import './Sidebar.css'

interface SidebarProps {
    id: string,
    userToken: string,
    username: string,
    fullName: string,
    refreshUserInfo(): void,
    close(): void,
    logout(): Promise<boolean>
}

const Sidebar: React.FC<SidebarProps>  = ({id, userToken, username, fullName, refreshUserInfo, close, logout}) => {
    const [newUsername, setNewUsername] = useState(username);
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [newName, setNewName] = useState(fullName)

    const updateInformation = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        //Add user
        const response: APIResponse = await makeRequest('setUserInfo', {id, userToken, newUsername, newName, newPassword: changingPassword ? newPassword : null});
        if(response.success) {
            await refreshUserInfo();
            setNewPassword('');
            setChangingPassword(false);
            setErrorMessage('Updated Information Successfully')
            setRequestInProgress(false)
            close();
            return
        } else {
            switch(response.errorCode) {
                case ErrorTypes.UsernameAlreadyExists:
                    setErrorMessage('Username Already Exists');
                    break;
                default:
                    setErrorMessage('An Error Occured');
                    break;
            }
            
        }
        setRequestInProgress(false)
    }

    const logoutWrapper = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        const result = await logout()
        if(!result) {
            await setRequestInProgress(false)
        }
    }
    return (
        <div id='userUpdateModal' className='modal fade show text-light bg-dark' tabIndex={-1} aria-hidden='true' role='dialog' aria-labelledby='userUpdateModalTitle'>
            <div className='modal-dialog modal-dialog-centered' role='document'>
                <div className='modal-content bg-dark'>
                    <div className='modal-header'>
                        <h4 className='modal-title' id='userUpdateModalTitle'>Update User Information</h4>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={()=>close()}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className='modalBody'>
                        <form className='form-inline justify-content-center m-2' onSubmit={updateInformation}>
                            <div className='form-group pb-3'>
                                <label className='text-left mr-3'>
                                    Username
                                    <input type='email' className='form-control ml-3 input-medium' maxLength={100} value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder='Username' required />
                                </label>
                            </div>
                            <div className='form-group pb-3'>
                                <label className='text-left mr-3'>
                                    Name
                                    <input type='text' className='form-control ml-3 input-medium' maxLength={50} value={newName} onChange={e=>setNewName(e.target.value)} placeholder='Name' required />
                                </label>
                            </div>
                            <div className='d-flex'>
                                <div className='form-check pb-3'>
                                    <label className='text-left mr-3 form-check-label'>
                                        Change Password?
                                        <input type='checkbox' className='form-check-input ml-3' checked={changingPassword} onChange={e=>setChangingPassword(e.target.checked)}/>
                                    </label>
                                </div>
                                <div className='form-group pb-3'>
                                    <label className='text-left mr-3'>
                                        Password
                                        <input type='password' className='form-control ml-3' value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder='Password' disabled={!changingPassword} required />
                                    </label>
                                </div>
                            </div>
                            
                            
                            <button type='submit' className='btn btn-primary' disabled={requestInProgress}>Update User Information</button>
                        </form>
                        {errorMessage && <p className='mb-2'>{errorMessage}</p>}
                        <button className='btn btn-danger mb-2' onClick={logoutWrapper} disabled={requestInProgress}>Logout</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;