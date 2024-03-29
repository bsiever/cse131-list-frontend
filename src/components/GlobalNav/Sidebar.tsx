import React, { useState} from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import './Sidebar.css'

interface SidebarProps {
    id: string,
    userToken: string,
    fullName: string,
    refreshUserInfo(): void,
    close(): void,
    logout(): Promise<boolean>,
    disableAudioAlerts: boolean
}

const Sidebar: React.FC<SidebarProps>  = ({id, userToken, fullName, disableAudioAlerts, refreshUserInfo, close, logout}) => {
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [newName, setNewName] = useState(fullName)
    const [newAudioAlerts,setDisableAudioAlerts] = useState(disableAudioAlerts);

    const updateInformation = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        //Add user
        const response: APIResponse = await makeRequest('setUserInfo', {id, userToken, newName, newAudioAlerts});
        if(response.success) {
            refreshUserInfo();
            setErrorMessage('Updated Information Successfully')
            setRequestInProgress(false)
            close();
            return
        } else {
            setErrorMessage('An Error Occurred');
        }
        setRequestInProgress(false)
    }

    const logoutWrapper = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        const result = await logout()
        if(!result) {
            setRequestInProgress(false)
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
                        <form className='justify-content-center m-2' onSubmit={updateInformation}>
                            <div>
                                <label>
                                    Name
                                    <input type='text' className='form-control ml-3 input-medium' maxLength={50} value={newName} onChange={e=>setNewName(e.target.value)} placeholder='Name' required />
                                </label>
                            </div>
                            <div>
                                <label>
                                    Disable Audio Alerts
                                    <input type='checkbox' className='form-control'  checked={newAudioAlerts} onChange={(e)=>setDisableAudioAlerts(!newAudioAlerts)}/>
                                </label>
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