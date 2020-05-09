import React, { useState, SetStateAction } from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { User } from '../../utility/types';

interface AdminManagementProps {
    id: string,
    userToken: string
}

const AdminManagement: React.FC<AdminManagementProps>  = ({id, userToken}) => {
    const [adminUsers, setAdminUsers] = useState(null) as [User[] | null, React.Dispatch<SetStateAction<User[]| null>>];
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [message, setMessage] = useState('');
    const [requestInProgress, setRequestInProgress] = useState(false);

    const loadAdminInformation = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await updateAdminInfo();
    }
    const updateAdminInfo = async () => {
        //Make sure logged in
        if(userToken === null) {
            return console.error("Attempted to update admin info while not logged in")
        }
        let response: APIResponse = await makeRequest('getAdminInfo', {id, userToken});
        if(response.success) {
            let data: User[] = response.data as User[];
            data.sort((a,b)=> (a.fullName > b.fullName) ? 1 : (a.fullName < b.fullName) ? -1: 0) //Sort by name
            setAdminUsers(data)
        } else {
            console.error("Unable to update admin information")
        }
    }

    const createAdmin = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        //Add user
        await makeRequest('createUpdateAdminStatus', {id, userToken, newUser: true, newAdminStatus: true, subjectUsername: newAdminEmail, subjectName: newAdminName});
        setMessage('User added successfully')
        setNewAdminName('')
        setNewAdminEmail('')
        await updateAdminInfo();
        setRequestInProgress(false)
    }

    const deleteUser = async (e: { preventDefault: () => void; }, user: User) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        await makeRequest('createUpdateAdminStatus', {id, userToken, newUser: false, newAdminStatus: false, subjectUsername: user.username});
        await updateAdminInfo();
        setRequestInProgress(false)
    }

    return (
        <div>
            <p>{message}</p>
            <h4>Add a new Administrator</h4>
            <form className='form-inline justify-content-center m-2' onSubmit={createAdmin}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Email
                        <input type='email' className='form-control ml-3' maxLength={50} value={newAdminEmail} onChange={e=>setNewAdminEmail(e.target.value)} placeholder='New Admin Email' required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Name
                        <input type='text' className='form-control ml-3' maxLength={100} value={newAdminName} onChange={e=>setNewAdminName(e.target.value)} placeholder='New Admin Name' required />
                    </label>
                </div>
                <button type='submit' className='btn btn-success' disabled={requestInProgress}>Add Admin</button>
            </form>
            <h4>Manage Administrative Users</h4>
            {adminUsers ?
            <table className='table table-dark'>
                <tbody>
                    <tr><th>Name</th><th>Email</th><th>Remove User</th></tr>
                    {adminUsers.map(user=><tr key={user.id}><td>{user.fullName}</td><td className="text-break">{user.username}</td><td><button className='btn btn-danger' onClick={(e)=>deleteUser(e,user)} disabled={requestInProgress}>&times;</button></td></tr>)}
                </tbody>
            </table> :
            <button className='btn btn-primary' onClick={loadAdminInformation}>Load Existing Users</button> }
        </div>
    );
}

export default AdminManagement;