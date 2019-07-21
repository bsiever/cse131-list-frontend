import React, { useState } from 'react';
import { User, PermissionLevel } from '../../utility/types';

interface ClassUserManagementRowProps {
    deleteUser(user: User): void,
    updateUserPermissionLevel(user: User, newPermissionLevel: PermissionLevel): void,
    user: User
}

const ClassUserManagementRow: React.FC<ClassUserManagementRowProps>  = ({deleteUser, updateUserPermissionLevel, user}) => {
    const [newPermissionLevel, setNewPermissionLevel] = useState(user.permissionLevel)
    const [requestInProgress, setRequestInProgress] = useState(false)

    const deleteUserWrapper = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, user: User) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        await deleteUser(user)
        setRequestInProgress(false)
    }

    const updateUserPermissionLevelWrapper = async (e: React.FormEvent<HTMLFormElement>, user: User) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        await updateUserPermissionLevel(user, newPermissionLevel)
        setRequestInProgress(false)
    }

    return (
        <tr>
            <td>{user.fullName}</td>
            <td>{user.username}</td>
            <td>
                <form className='d-flex' onSubmit={e=>updateUserPermissionLevelWrapper(e,user)}>
                    <select className='form-control mr-2' value={newPermissionLevel} onChange={e=>setNewPermissionLevel(Number(e.target.value) as PermissionLevel)}>
                        <option value={PermissionLevel.Professor}>Professor/Head TA</option>
                        <option value={PermissionLevel.TA}>TA</option>
                        <option value={PermissionLevel.Student}>Student</option>
                    </select>
                    <button type='submit' className='btn btn-success mb-2'>Update</button>
                </form>
            </td>
            <td>
                <button className='btn btn-danger' onClick={(e)=>deleteUserWrapper(e,user)} disabled={requestInProgress}>&times;</button>
            </td>
        </tr>
    );
}

export default ClassUserManagementRow;