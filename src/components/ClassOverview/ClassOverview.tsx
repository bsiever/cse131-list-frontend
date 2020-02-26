import React, { useState, useEffect, useCallback } from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { PermissionLevel, ClassObj,  SessionObj } from '../../utility/types';
import ClassOverviewAdmin from './ClassOverviewAdmin';
import List, { ListInfo } from '../List/List';

interface ClassOverviewProps {
    id: string,
    userToken: string,
    classId: string,
    className: string,
    exitClass(): void,
    updateCurrentClass(classItem: ClassObj): void,
    selectList(obj: ListInfo): void,
    chosenSession: null | SessionObj,
    setSession(newSession: SessionObj | null): void
}

const ClassOverview: React.FC<ClassOverviewProps>  = ({id, userToken, classId, className, exitClass,updateCurrentClass, selectList,chosenSession,setSession}) => {
    const [sessions, setSessions] = useState([] as SessionObj[]);
    const [newName, setNewName] = useState('');
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [permissionLevel, setPermissionLevel] = useState(PermissionLevel.Student);
    
    const updateClassSessionsAndInfo = useCallback(async () => {
        let response: APIResponse = await makeRequest('getClassInfo', {id, userToken, classId});
        console.log(response)
        if(response.success) {
            let rawSessions = Object.entries((response.data as any).sessions as {[s: string]: SessionObj}).map(([id,obj])=>{return {id,sessionName: obj.sessionName, lists: obj.lists}})
            rawSessions.sort((a,b)=> (a.sessionName > b.sessionName) ? 1 : (a.sessionName < b.sessionName) ? -1: 0) //Sort by name
            await setSessions(rawSessions)
            await setPermissionLevel((response.data as any).classUsers[id]);
        } else {
            console.error(`Unable to update info for class ${className}`)
        }
    },[classId, className, id, setSessions, userToken])

    useEffect(() => {updateClassSessionsAndInfo()}, [updateClassSessionsAndInfo]); //Update on load

    const createSession = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        //Add user
        await makeRequest('createSession', {id, userToken, classId, newSessionName: newName, startingLists: ['Help List','Demo List']});
        setNewName('')
        await updateClassSessionsAndInfo();
        setRequestInProgress(false)
    }

    const selectSession = async (e: { preventDefault: () => void; }, session: SessionObj) => {
        if(e) e.preventDefault();
        await setSession(session)
    }

    const goBack = async () => {
        setSession(null);
    }

    const deleteSession = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>,sessionId: string) => {
        e.stopPropagation();
        if(!window.confirm("Do you want to close the session?")) return;  
        await setRequestInProgress(true)
        await makeRequest('closeSession', {id, userToken, classId, sessionId});
        await updateClassSessionsAndInfo();
        setRequestInProgress(false)
    }

    let mainResult
    if(chosenSession === null) {
        const createSessionForm = permissionLevel === PermissionLevel.Professor ?
        <form className='form-inline justify-content-center m-2' onSubmit={createSession}>
            <div className='form-group'>
                <label className='text-left mr-3'>
                    Name
                    <input type='text' className='form-control ml-3' maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)} placeholder='Session Name' required />
                </label>
            </div>
            <button type='submit' className='btn btn-success' disabled={requestInProgress}>Create Session</button>
        </form> : null
        let sessionList = []
        for (const {id, sessionName, lists} of sessions) {
            sessionList.push(
                <div key={id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {e=>selectSession(e,{id, sessionName, lists})} >
                    <h3>{sessionName}</h3>
                    {permissionLevel === PermissionLevel.Professor ? <button className='btn btn-danger position-absolute m-3 fixed-top' onClick={(e)=>deleteSession(e,id)}>&times;</button> : null}
                </div>)
        }
        if(sessionList.length === 0) {
            sessionList = [<h2 key='singletonSession'>There are not currently any sessions available, please click the refresh button to retry.</h2>]
        }
        mainResult = <React.Fragment>
            <div className ='d-flex m-3 justify-content-center align-content center'>
                <h4>Available Sessions</h4>
                <button className='btn btn-primary ml-3' onClick={updateClassSessionsAndInfo}>Refresh</button>
            </div>
            {createSessionForm}
            <div className='container d-flex flex-wrap'>
                {sessionList}
            </div>
        </React.Fragment>
    } else {
        let listList = []
        for (const [list_id, listName] of Object.entries(chosenSession.lists)) {
            if(permissionLevel >= PermissionLevel.TA) {
                listList.push(
                    <List sessionName={chosenSession.sessionName} selectList={selectList} miniView={true} id={id} userToken = {userToken} list = {{id:list_id,listName,permissionLevel}} leaveList  = {()=>{}}>
                    </List>)
            } else {
                listList.push(<div key={list_id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {()=>selectList({id:list_id,permissionLevel,listName})} >
                    <h3>{listName}</h3>
                </div>)
            }
        }
        mainResult = <React.Fragment>
            <h4>Available Lists</h4>
            <button className='btn btn-primary mb-3' onClick={goBack}>Back to Sessions</button>
            <div className='container d-flex flex-wrap'>
                {listList}
            </div>
        </React.Fragment>
    }
    
    return (
        <div className='align-items-center align-middle my-auto'>
            <h1>{className}</h1>
            {mainResult}
            {permissionLevel === PermissionLevel.Professor ? <ClassOverviewAdmin id={id} userToken = {userToken} classId = {classId} exitClass={exitClass} updateCurrentClass={updateCurrentClass}/>: null}
        </div>
    );
}

export default ClassOverview;