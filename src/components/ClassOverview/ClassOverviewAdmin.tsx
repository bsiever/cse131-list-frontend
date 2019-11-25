import React, { useState, SetStateAction } from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { User, PermissionLevel, ClassObj } from '../../utility/types';
import ClassUserManagementRow from './ClassUserManagementRow';

interface ClassOverviewAdminProps {
    id: string,
    userToken: string,
    classId: string,
    exitClass():void,
    updateCurrentClass(newClass: ClassObj): void
}

const ClassOverviewAdmin: React.FC<ClassOverviewAdminProps>  = ({id, userToken, classId, exitClass, updateCurrentClass}) => {
    const [classUsers, setClassUsers] = useState(null) as [User[] | null, React.Dispatch<SetStateAction<User[]| null>>];
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [message, setMessage] = useState('');
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [newPermissionLevel, setNewPermissionLevel] = useState(PermissionLevel.Student)
    const [newClassName, setNewClassName] = useState('')
    const [studentCode, setStudentCode] = useState('');
    const [adminCode, setAdminCode] = useState('');
    const [taCode, setTaCode] = useState('');

    const loadClassInformation = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await updateClassInfo();
    }

    const updateClassInfo = async () => {
        //Make sure logged in
        if(userToken === null) {
            return console.error("Attempted to update class info while not logged in")
        }
        let response: APIResponse = await makeRequest('getClassAdminInfo', {id, userToken,classId});
        if(response.success) {
            let data = response.data as {classUsers: User[], userCode: string, taCode: string, adminCode: string};
            data.classUsers.sort((a,b)=> (a.fullName > b.fullName) ? 1 : (a.fullName < b.fullName) ? -1: 0) //Sort by name
            await setClassUsers(data.classUsers)
            await setStudentCode(data.userCode);
            await setTaCode(data.taCode);
            await setAdminCode(data.adminCode);
        } else {
            console.error("Unable to update admin information")
        }
    }

    const createUser = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        //Add user
        await makeRequest('createUpdateClassMembership', {id, userToken, removeUser: false, subjectUsername: newEmail, subjectName: newName, newPermissionLevel: newPermissionLevel, changingClass: classId});
        setMessage('User added successfully')
        setNewName('')
        setNewEmail('')
        await updateClassInfo();
        setRequestInProgress(false)
    }

    const deleteUser = async (user: User) => {
        await makeRequest('createUpdateClassMembership', {id, userToken, removeUser: true, subjectUsername: user.username, changingClass: classId});
        if(id === user.id) {
            return exitClass()
        }
        await updateClassInfo();
    }

    const updateUserPermissionLevel = async (user: User, newPermissionLevel: PermissionLevel) => {
        await makeRequest('createUpdateClassMembership', {id, userToken, removeUser: false, subjectUsername: user.username, changingClass: classId, newPermissionLevel});
        await updateClassInfo();
    }

    const changeClassName = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        const newClassInfo = await makeRequest('setClassName',{id, userToken, classId, newClassName})
        if(newClassInfo.success) {
            await updateCurrentClass(newClassInfo.data as ClassObj);
        } else {
            setMessage('Failed to Rename Class')
            await setNewClassName('')
        }
        setRequestInProgress(false)
    }
    if (!classUsers) {
        return (
            <div className='align-items-center align-middle my-auto'>
                <h1>Class Management</h1>
                <button className='btn btn-primary' onClick={loadClassInformation}>Manage Class</button>
            </div>
        )
    }

    const deleteClass = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        if(window.confirm('Are you sure you want to delete this class? (This action is irreversable)')) {
            await makeRequest('deleteClass',{id, userToken, changingClass: classId})
            exitClass()
        }
        setRequestInProgress(false)
    }
    
    return (
        <div className='align-items-center align-middle my-auto'>
            <h1>Class Management</h1>
            <p>{message}</p>
            <h4>Change Class Name</h4>
            <form className='form-inline justify-content-center m-2' onSubmit={changeClassName}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        New Name
                        <input type='text' className='form-control ml-3' maxLength={50} value={newClassName} onChange={e=>setNewClassName(e.target.value)} placeholder="New Class Name" required />
                    </label>
                </div>
                <button type='submit' className='btn btn-primary' disabled={requestInProgress}>Update Class Name</button>
            </form>
            <h4>Delete Class</h4>
            <button onClick={deleteClass} className='btn btn-danger'>Delete</button> 
            <h4>Add User</h4>
            <form className='form-inline justify-content-center m-2' onSubmit={createUser}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Email
                        <input type='email' className='form-control ml-3' maxLength={50} value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="New User's Email" required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Name
                        <input type='text' className='form-control ml-3' maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New User's Name" required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Status
                        <select className='form-control ml-3' value={newPermissionLevel} onChange={e=>setNewPermissionLevel(Number(e.target.value))} required >
                            <option value={PermissionLevel.Student}>Student</option>
                            <option value={PermissionLevel.TA}>TA</option>
                            <option value={PermissionLevel.Professor}>Professor/Head TA</option>
                        </select>
                    </label>
                </div>
                <button type='submit' className='btn btn-success' disabled={requestInProgress}>Add User</button>
            </form>
            {classUsers && <div>
                <h4>Join Codes</h4>
                <p>Student Code: {studentCode}</p>
                <p>TA Code: {taCode}</p>
                <p>Professor/Head TA Code: {adminCode}</p>
            </div>}
            <h4>Manage Class Users</h4>
            <table className='table table-dark'>
                <tbody>
                    <tr><th>Name</th><th>Email</th><th>Permission Level</th><th>Remove User</th></tr>
                    {classUsers.map(user=><ClassUserManagementRow key = {user.id} user={user} deleteUser={deleteUser} updateUserPermissionLevel={updateUserPermissionLevel}/>)}
                </tbody>
            </table>
        </div>
    );
}

export default ClassOverviewAdmin;