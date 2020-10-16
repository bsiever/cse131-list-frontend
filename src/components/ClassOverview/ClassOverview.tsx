import React, { useState, useEffect, useCallback, SetStateAction } from 'react';
import { makeRequest, APIResponse } from '../../utility/api';
import { PermissionLevel, ClassObj,  SessionObj } from '../../utility/types';
import ClassOverviewAdmin from './ClassOverviewAdmin';
import List, { ListInfo } from '../List/List';
import SessionNameSelector from './SessionNameSelector';
import './ClassOverview.css'

const IMAGE_BUCKET_URL_PREX = window.location.host === '131list.com' ?  'https://virtual-lists-images-prod.s3.amazonaws.com/' : 'https://virtual-lists-images-dev.s3.amazonaws.com/'

interface ClassOverviewProps {
    id: string,
    userToken: string,
    classId: string,
    className: string,
    exitClass(): void,
    updateCurrentClass(classItem: ClassObj): void,
    selectList(obj: ListInfo): void,
    chosenSession: null | SessionObj,
    setSession(newSession: SessionObj | null): void,
    remoteURL: null | string,
    setRemoteURL(r: string): void,
    disableAudioAlerts:boolean
}

const ClassOverview: React.FC<ClassOverviewProps>  = ({id, userToken, classId, className, exitClass,updateCurrentClass, selectList,chosenSession,setSession,remoteURL, setRemoteURL,disableAudioAlerts}) => {
    const [sessions, setSessions] = useState([] as SessionObj[]);
    const [newName, setNewName] = useState('');
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [permissionLevel, setPermissionLevel] = useState(PermissionLevel.Student);
    const [fullView, setFullView] = useState(false);
    const [remoteMode, setRemoteMode] = useState(false);
    const [creatingSessionNames, setCreatingSesionNames] = useState(false); 
    const [imageSuffix, setImageSuffix] = useState(null) as [string | null, React.Dispatch<SetStateAction<string| null>>]
    const [imageViewed,setImageViewed] = useState(chosenSession !== null)
    //const [remoteURL, setRemoteURL] = useState("")

    const updateClassSessionsAndInfo = useCallback(async () => {
        let response: APIResponse = await makeRequest('getClassInfo', {id, userToken, classId});
        console.log(response)
        if(response.success) {
            let rawSessions = Object.entries((response.data as any).sessions as {[s: string]: SessionObj}).map(([id,obj])=>{return {id,sessionName: obj.sessionName, lists: obj.lists}})
            rawSessions.sort((a,b)=> (a.sessionName > b.sessionName) ? 1 : (a.sessionName < b.sessionName) ? -1: 0) //Sort by name
            setSessions(rawSessions)
            setPermissionLevel((response.data as any).classUsers[id]);
            setRemoteMode((response.data as any).remoteMode);
            if(!imageViewed) {
                console.log(imageViewed)
                setImageSuffix((response.data as any).imageID);
                setImageViewed(true);
            }
        } else {
            console.error(`Unable to update info for class ${className}`)
        }
    },[classId, className, id, setSessions, userToken, imageViewed, setImageSuffix, setImageViewed])

    useEffect(() => {updateClassSessionsAndInfo()}, [updateClassSessionsAndInfo]); //Update on load

    useEffect(()=> {
        if(remoteURL !== null) {
            return;
        }
        if(permissionLevel !== PermissionLevel.Student && remoteMode) {
            const promptResponse = window.prompt("What is your URL(including HTTPS://)?");
            // if(promptResponse === null) {
            //     exitClass();
            //     return;
            // } else {
            setRemoteURL(promptResponse ?? "")
            // }
        }
    },[permissionLevel,remoteMode,setRemoteURL,remoteURL, exitClass])
    

    const createSession = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        setCreatingSesionNames(true);
    }

    const createSessionCall = async (sessionNames: string[]) => {
        setCreatingSesionNames(false);
        //Add Session
        await makeRequest('createSession', {id, userToken, classId, newSessionName: newName, startingLists: sessionNames});
        setNewName('')
        await updateClassSessionsAndInfo();
        setRequestInProgress(false)
    }

    const selectSession = async (e: { preventDefault: () => void; }, session: SessionObj) => {
        if(e) e.preventDefault();
        setSession(session)
    }

    const goBack = async () => {
        setSession(null);
    }

    const deleteSession = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>,sessionId: string) => {
        e.stopPropagation();
        if(!window.confirm("Do you want to close the session?")) return;  
        setRequestInProgress(true)
        await makeRequest('closeSession', {id, userToken, classId, sessionId});
        await updateClassSessionsAndInfo();
        setRequestInProgress(false)
    }

    let mainResult;
    if(imageSuffix && imageSuffix !== "") {
        mainResult = <div className="modal fade show"  role="dialog">
        <div id='daily_image' role="document" style={{overflowY: 'initial'}}>
        <div className="modal-content">
        <div className='modal-header'>
            <button type="button" className="btn btn-danger" onClick={()=>setImageSuffix(null)}>Close</button>
        </div>
        <div className="modal-body" style={{overflowY: 'auto', height: 'fit-content'}}>
        <div className='card border-dark'>
        <div className='card-body'>
            <h4 className='text-dark card-title'>Daily Image</h4>
            <img src={IMAGE_BUCKET_URL_PREX+imageSuffix} alt='Daily Announcement'/>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>
    } else if(chosenSession === null && !fullView) {
        const createSessionForm = permissionLevel === PermissionLevel.Professor ?
        <form className='form-inline justify-content-center m-2' onSubmit={createSession}>
            <div className='form-group'>
                <label className='text-left mr-3'>
                    Name
                    <input type='text' className='form-control ml-3' maxLength={100} value={newName} onChange={e=>setNewName(e.target.value)} placeholder='Session Name' required />
                </label>
            </div>
            <button type='submit' className='btn btn-success' disabled={requestInProgress}>Pick List Names and Create</button>
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
        let sessionsToProcess = fullView ? sessions : [chosenSession];
        let listList = []
        for(let givenSession of sessionsToProcess) {
            if(givenSession !== null){
                for (const [list_id, listName] of Object.entries(givenSession.lists)) {
                    if(permissionLevel >= PermissionLevel.TA) {
                        listList.push(
                            <List disableAudioAlerts={disableAudioAlerts} sessionName={givenSession.sessionName} selectList={selectList} miniView={true} id={id} userToken = {userToken} list = {{id:list_id,listName,permissionLevel,remoteMode,remoteURL:remoteURL}} leaveList  = {()=>{}}>
                            </List>)
                    } else {
                        listList.push(<div key={list_id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {()=>selectList({id:list_id,permissionLevel,listName,remoteMode,remoteURL:remoteURL})} >
                            <h3>{listName}</h3>
                        </div>)
                    }
                }
            }
        }
        mainResult = <React.Fragment>
            <h4>Available Lists</h4>
            {!fullView ? <button className='btn btn-primary mb-3' onClick={goBack}>Back to Sessions</button>:null}
            <div className='container d-flex flex-wrap'>
                {listList}
            </div>
        </React.Fragment>
    }
    
    return (
        <div className='align-items-center align-middle my-auto'>
            {creatingSessionNames?<SessionNameSelector closeSessionCreator={createSessionCall} lists={['Help List', 'Demo List']} />:null}
            <h1>{className}
                {permissionLevel === PermissionLevel.Professor && chosenSession === null ? <button className={'btn my-a ml-3 '+(fullView?'btn-success':'btn-danger')} onClick={()=>setFullView(!fullView)}>Toggle Full View</button>:null}
            </h1>
            {mainResult}
            {permissionLevel === PermissionLevel.Professor && chosenSession === null ? <ClassOverviewAdmin id={id} userToken = {userToken} classId = {classId} exitClass={exitClass} updateCurrentClass={updateCurrentClass} upateCurrentClassLocal={updateClassSessionsAndInfo} remoteMode={remoteMode}/>: null}
        </div>
    );
}

export default ClassOverview;