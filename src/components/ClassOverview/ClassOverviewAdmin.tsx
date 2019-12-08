import React, { useState, SetStateAction, RefObject, useRef } from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { User, PermissionLevel, ClassObj } from '../../utility/types';
import ClassUserManagementRow from './ClassUserManagementRow';

const parse = require('csv-parse');

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
    const [newMultiplePermissionLevel, setNewMultiplePermissionLevel] = useState(PermissionLevel.Student)
    const [multiAddResult, setMultiAddResult] = useState('');
    const fileRef = useRef() as RefObject<HTMLInputElement>;

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

    const createMultipleUsers = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        setMultiAddResult('');
        //Add users
        try {
            //https://blog.shovonhasan.com/using-promises-with-filereader/
            const temporaryFileReader = new FileReader();
            let fileText = await new Promise((resolve, reject) => {
                temporaryFileReader.onerror = () => {
                    temporaryFileReader.abort();
                    reject(new DOMException("Problem parsing input file."));
                };

                temporaryFileReader.onload = () => {
                    resolve(temporaryFileReader.result);
                };
                if(fileRef.current !== null && fileRef.current.files !== null) {
                    temporaryFileReader.readAsText(fileRef.current.files[0]);
                } else {
                    reject("Could not read file");
                }
            });
            let fileContents = await new Promise((resolve, reject)=>{
                parse(fileText, {
                    columns: false
                  }, function(err: any, output: [[string, string]]){
                    if(err) {
                        reject(err);
                    }
                    resolve(output);
                });
            }) as [[string, string]];
            let promises = [] as Promise<any>[];
            for(let student of fileContents) {
                promises.push(makeRequest('createUpdateClassMembership',{
                    id, userToken,
                    removeUser: false,
                    subjectUsername: student[1],
                    subjectName: student[0],
                    newPermissionLevel: newMultiplePermissionLevel,
                    changingClass: classId
                }));
            }
            await Promise.all(promises);
            setMultiAddResult('Success!');
        } catch(e) {
            setMultiAddResult('Unable to read file, please try again');
        } finally {
            await updateClassInfo();
            setRequestInProgress(false)
        }
        
        
        //await ;
        
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
        <div className='align-items-center align-middle my-auto col-10 text-dark m-auto bg-secondary pb-2 rounded-lg'>
            <div className='text-white'>
                <h1>Class Management</h1>
                <p>{message}</p>
            </div>
            <ul className="nav nav-pills mb-3" id="selection-tab" role="tablist">
                <li className="nav-item">
                    <a className="nav-link active text-white" id="selection-add-tab" data-toggle="pill" href="#selection-add" role="tab" aria-controls="selection-add" aria-selected="true">Add Users</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link text-white" id="selection-users-tab" data-toggle="pill" href="#selection-users" role="tab" aria-controls="selection-users" aria-selected="false">Manager Users</a>
                </li>
                <li className="nav-item">
                    <a className="nav-link text-white" id="selection-update-tab" data-toggle="pill" href="#selection-update" role="tab" aria-controls="selection-update" aria-selected="false">Update Class Information</a>
                </li>
            </ul>
            <div className="tab-content text-dark">
                <div className="tab-pane fade show active" id="selection-add" role="tabpanel" aria-labelledby="selection-add-tab">
                    <div className='card-deck'>
                        <div className='card border-dark'>
                            <div className='card-body'>
                                <h4 className='card-title'>Add User</h4>
                                <form onSubmit={createUser}>
                                    <div className='form-group'>
                                        <label className='text-left'>
                                            Email
                                            <input type='email' className='form-control' maxLength={50} value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="New User's Email" required />
                                        </label>
                                    </div>
                                    <div className='form-group'>
                                        <label className='text-left'>
                                            Name
                                            <input type='text' className='form-control' maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New User's Name" required />
                                        </label>
                                    </div>
                                    <div className='form-group'>
                                        <label className='text-left'>
                                            Status
                                            <select className='form-control' value={newPermissionLevel} onChange={e=>setNewPermissionLevel(Number(e.target.value))} required >
                                                <option value={PermissionLevel.Student}>Student</option>
                                                <option value={PermissionLevel.TA}>TA</option>
                                                <option value={PermissionLevel.Professor}>Professor/Head TA</option>
                                            </select>
                                        </label>
                                    </div>
                                    <button type='submit' className='btn btn-success' disabled={requestInProgress}>Add User</button>
                                </form>
                            </div>
                        </div>
                        <div className='card border-dark'>
                            <div className='card-body'>
                                <h4 className='card-title'>Add Multiple Users</h4>
                                <p className='card-text'>A CSV with two columns, name and email, with no headers</p>
                                <form className='m-auto' onSubmit={createMultipleUsers}>
                                    <div className='custom-file mb-2'>
                                        <label className='text-left ml-2 custom-file-label '>
                                            CSV File
                                            <input type='file' ref={fileRef} accept='.csv' className = 'custom-file-input' required />
                                        </label>
                                    </div>
                                    <button type='submit' className='btn btn-success' disabled={requestInProgress}>Add</button>
                                    <p>{multiAddResult}</p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tab-pane fade" id="selection-update" role="tabpanel" aria-labelledby="selection-update-tab">
                    <div className='card-deck'>
                        <div className='card border-dark'>
                            <div className='card-body'>
                                <h4 className='card-title'>Change Class Name</h4>
                                <form onSubmit={changeClassName}>
                                    <div className='form-group'>
                                        <label className='text-left'>
                                            New Name
                                            <input type='text' className='form-control' maxLength={50} value={newClassName} onChange={e=>setNewClassName(e.target.value)} placeholder="New Class Name" required />
                                        </label>
                                    </div>
                                    <div className='form-group'>
                                        <label className='text-left'>
                                            Status
                                            <select className='form-control' value={newMultiplePermissionLevel} onChange={e=>setNewMultiplePermissionLevel(Number(e.target.value))} required >
                                                <option value={PermissionLevel.Student}>Student</option>
                                                <option value={PermissionLevel.TA}>TA</option>
                                                <option value={PermissionLevel.Professor}>Professor/Head TA</option>
                                            </select>
                                        </label>
                                    </div>
                                    <button type='submit' className='btn btn-primary' disabled={requestInProgress}>Update Class Name</button>
                                </form>
                            </div>
                        </div>
                        <div className='card border-dark'>
                            <div className='card-body'>
                                <h4 className='card-title'>Delete Class</h4>
                                <button onClick={deleteClass} className='btn btn-danger'>Delete</button> 
                            </div>
                        </div>
                        {classUsers && <div className='card border-dark'><div className='card-body'>
                            <h4 className='card-body'>Join Codes</h4>
                            <p className='card-text'>Student Code: {studentCode}</p>
                            <p className='card-text'>TA Code: {taCode}</p>
                            <p className='card-text'>Professor/Head TA Code: {adminCode}</p>
                        </div></div>} 
                    </div>
                </div>
                <div className="tab-pane fade" id="selection-users" role="tabpanel" aria-labelledby="selection-users-tab">
                    <div className='card-deck'>
                        <div className='card border-dark'>
                            <div className='card-body'>
                                <h4 className='card-title'>Manage Class Users</h4>
                                <table className='table'>
                                    <tbody>
                                        <tr><th>Name</th><th>Email</th><th>Permission Level</th><th>Remove User</th></tr>
                                        {classUsers.map(user=><ClassUserManagementRow key = {user.id} user={user} deleteUser={deleteUser} updateUserPermissionLevel={updateUserPermissionLevel}/>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>   
        </div>
    );
}

export default ClassOverviewAdmin;