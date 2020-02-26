import React, { useState, useEffect, useCallback, SetStateAction } from 'react';
import { PermissionLevel} from '../../utility/types';
import { websocketUrl } from '../../utility/api';

export interface ListInfo {
    id: string,
    permissionLevel: PermissionLevel,
    listName: string
}
interface ListProps {
    id: string,
    userToken: string,
    list: ListInfo,
    leaveList(): void,
    miniView: boolean,
    selectList(obj: ListInfo): void,
    sessionName: string
}
export enum WebSocketMessages{
    InitalizeSession = 'initSession',
    SetPosition = 'setPos',
    CloseListSession = 'closeListSession',
    UpdateListStatus = 'updateListStatus',
    HelpEvent = 'helpEvent',
    HelperEvent = 'helperEvent',
    FlagRecorded = 'flagRecorded',
    FullInfo = 'fullInfo'
}

interface Message {
    messageType: WebSocketMessages,
    message: any
}

interface FullInfo {
    listUsers: [{fullName: string}],
    observers: [{fullName: string,permissionLevel: PermissionLevel, startTime: number, timedEventTime?: number,helpedStudents?: number, flaggedStudents?: number,helpedFlaggedStudents?: number}]
}


var lastHelpedUserTime = 0;

const List: React.FC<ListProps>  = ({id, userToken, list, leaveList, miniView,selectList,sessionName}) => {
    
    const [socket, setSocket] = useState(null)  as [null | WebSocket, React.Dispatch<SetStateAction<null | WebSocket>>]
    const [position, setPosition] = useState(-1);
    const [listTotal, setListTotal] = useState(-1);
    const [requestInProgress, setRequestInProgress] = useState(true);
    const [lastHelped, setLastHelped] = useState('')
    const [flagUserMessage, setFlagUserMessage] = useState('')
    const [flaggedUsers, setFlaggedUsers] = useState({} as {[s: string]: string})
    const [fullClassInfo, setFullClassInfo] = useState(null as null|FullInfo)
    const [leavingList, setLeavingList] = useState(false);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
    const [helpUserTimer, setHelpUserTime] = useState(null) as [null |number, React.Dispatch<SetStateAction<null | number>>];

    const joinList = useCallback((e: Event): any => {
        (e.target as WebSocket).send(JSON.stringify({
            action: 'joinList',
            data: {
                list_id: list.id,
                id,
                userToken
            }
        }))
    }, [id, list, userToken]);

    useEffect(()=>{
        async function launchSocket() {
        if(!socket || (((socket as WebSocket).readyState === WebSocket.CLOSED || (socket as WebSocket).readyState === WebSocket.CLOSING) && !leavingList)) {
            console.log('Attempting Reconnection');
            const socket = new WebSocket(websocketUrl)
            socket.onmessage = async (event: MessageEvent) => {
                const data = JSON.parse(event.data) as Message;
                switch(data.messageType) {
                    case WebSocketMessages.InitalizeSession:
                        setRequestInProgress(false)
                        if(data.message.observer) {
                            setListTotal(data.message.totalNumber)      
                            setFlaggedUsers(data.message.flaggedUsers)                  
                        } else {
                            setPosition(data.message.index)
                        }
                        setEstimatedWaitTime(data.message.estimatedWaitTime)
                        break;
                    case WebSocketMessages.SetPosition:
                        setPosition(data.message.index)
                        setEstimatedWaitTime(data.message.estimatedWaitTime)
                        break;
                    case WebSocketMessages.CloseListSession:
                        setLeavingList(true);
                        if(!miniView) {
                            window.alert('This session has been closed.')
                            leaveList();
                        }
                        break;
                    case WebSocketMessages.HelpEvent:
                        window.alert(`You are being helped by ${data.message.helperName}`)
                        setLeavingList(true);
                        leaveList();
                        break;
                    case WebSocketMessages.HelperEvent:
                        clearTimeout(helpUserTimer === null?undefined:helpUserTimer);
                        setHelpUserTime(window.setTimeout(notifyTimeOut,10*60*1000));
                        window.alert(`You are helping ${data.message.studentName}`)
                        setLastHelped(data.message.studentName)
                        break;
                    case WebSocketMessages.UpdateListStatus:
                        setListTotal(data.message.totalNumber)
                        setFlaggedUsers(data.message.flaggedUsers)
                        setEstimatedWaitTime(data.message.estimatedWaitTime)
                        break;
                    case WebSocketMessages.FlagRecorded:
                        setLastHelped('')
                        setFlagUserMessage('')
                        break;
                    case WebSocketMessages.FullInfo:
                        setFullClassInfo({listUsers: data.message.users, observers: data.message.tas})
                        break;
                }
            };
            socket.onopen = joinList as any;
            setSocket(socket)
        }
    }
    launchSocket();
    const interval = setInterval(launchSocket,1000);
    return ()=> {clearInterval(interval);if(socket){socket.close()}}
    },[socket,joinList, setSocket, id, list.id, leaveList, userToken,leavingList]);
   
    
    const sendWebsocketMessage = (action: string, data:object) => {
        if((socket as WebSocket).readyState === WebSocket.OPEN) {
            (socket as WebSocket).send(JSON.stringify({action,data}));
        }
    }

    const notifyTimeOut = () => {
        setHelpUserTime(null);
        if(listTotal >0) {
            //Notify TA that they should probably move on
            window.alert("You've been helping a student for over 10 minutes!");
        }
    }

    const helpNextUser = ()=> {
        if(Date.now() - 1000 > lastHelpedUserTime) {
            clearTimeout(helpUserTimer === null?undefined:helpUserTimer);
            setHelpUserTime(null);
            lastHelpedUserTime = Date.now();
            sendWebsocketMessage('helpNextUser',{
                    id,
                    userToken,
                    list_id: list.id
                })
        }
    }

    const markFlaggedUser = async (e: { preventDefault: () => void; }) =>{
        e.preventDefault();
        sendWebsocketMessage('flagUser',{
                id,
                userToken,
                list_id: list.id,
                studentName: lastHelped,
                message: flagUserMessage
            })
    }

    const helpFlaggedUser = async (studentName: string, message: string) =>{
        clearTimeout(helpUserTimer === null?undefined:helpUserTimer);
        setHelpUserTime(null);
        sendWebsocketMessage('helpFlaggedUser',{
                id,
                userToken,
                list_id: list.id,
                studentName,
                message
        })
    }

    const requestFullInfo = async () => {
        sendWebsocketMessage('getFullOverview',{
                id,
                userToken,
                list_id: list.id
        })
    }

    const chooseToLeaveList = async () => {
        await setLeavingList(true);
        sendWebsocketMessage('leaveList',{
                    list_id: list.id,
                    id,
                    userToken
            });
        leaveList()
    }
    let mainWindow;
    let estimatedWaitP = (estimatedWaitTime!==0 && position !==0 && listTotal!==0 && estimatedWaitTime >= 60000)?<p>Estimated Wait: {Math.floor(estimatedWaitTime/60000)} minute(s)</p>:<p>Expected Wait: None</p>;
    if(list.permissionLevel === PermissionLevel.Student) {
        mainWindow = <div>
            <h2>Your Current Position: {position !== -1 ? position : 'Loading'}</h2>
            {estimatedWaitP}
        </div>
    } else if(miniView) {
        return <div key={id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {()=>selectList(list)} >
                <h3>{sessionName+": "+list.listName}</h3>
                <p className='m-0'>List Count: {listTotal !== -1 ? listTotal : 'Loading'}</p>
                {estimatedWaitP}
        </div>
    } else {
        mainWindow = <div>
            <h2>Total List Members: {listTotal !== -1 ? listTotal : 'Loading'}</h2>
            {estimatedWaitP}
            <button className='btn btn-primary' onClick = {helpNextUser} disabled={requestInProgress}>Help Next Person</button>
            <form className='form-inline justify-content-center m-2' onSubmit={markFlaggedUser}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Student Name
                        <input type='text' className='form-control ml-3' maxLength={50} value={lastHelped} onChange={e=>setLastHelped(e.target.value)} placeholder='Student Name' required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Note
                        <input type='text' className='form-control ml-3' maxLength={1000} value={flagUserMessage} onChange={e=>setFlagUserMessage(e.target.value)} placeholder='Notes' required />
                    </label>
                </div>
                <button type='submit' className='btn btn-warning' disabled={requestInProgress}>Flag User for Help</button>
            </form>
            <h2>Flagged Users</h2>
            <table className='table table-dark'>
                <tbody>
                    <tr><th>Name</th><th>Message</th><th>Help User</th></tr>
                    {Object.entries(flaggedUsers).sort((a,b)=>a[1] > b[1] ? 1: a[1] < b[1] ?-1 : 0).map(([studentName, message])=><tr key={studentName}><td>{studentName}</td><td>{message}</td><td><button className='btn btn-primary' onClick={(e)=>helpFlaggedUser(studentName, message)} disabled={requestInProgress}>&times;</button></td></tr>)}
                </tbody>
            </table>
            {list.permissionLevel === PermissionLevel.Professor && <button className='btn btn-primary m-2' onClick = {requestFullInfo} disabled={requestInProgress}>Get Full List Info</button>} 
            {fullClassInfo !== null && 
                <div className='d-flex flex-column flex-md-row'>
                    <table className='table table-dark flex-grow-1 table-bordered'>
                        <tbody>
                            <tr><th>Position</th><th>Name</th></tr>
                            {fullClassInfo.listUsers.map(({fullName},index)=><tr key={index}><td>{index}</td><td>{fullName}</td></tr>)}
                        </tbody>
                    </table>
                    <table className='table table-dark flex-grow-1 table-bordered'>
                        <tbody>
                            <tr><th className='px-1'>Name</th><th className='px-1'>Helped</th><th className='px-1'>Flagged</th><th className='px-1'>Helped Flagged</th><th className='px-1'>Start</th><th className='px-1'>Last Seen</th></tr>
                            {fullClassInfo.observers.map(({fullName,startTime, helpedStudents,helpedFlaggedStudents,flaggedStudents,timedEventTime},index)=><tr key={index}><td className='px-1'>{fullName}</td><td className='px-1'>{helpedStudents ? helpedStudents: 0}</td><td className='px-1'>{flaggedStudents?flaggedStudents:0}</td><td className='px-1'>{helpedFlaggedStudents?helpedFlaggedStudents:0}</td><td className='px-1'>{new Date(startTime).toLocaleTimeString('en-us',{ hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })}</td><td className='px-1'>{timedEventTime?new Date(timedEventTime).toLocaleTimeString('en-us',{ hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' }):'N/A'}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    }

    return (
        <div className='align-items-center align-middle my-auto'>
            <div className='d-flex m-3 justify-content-center align-items-center'>
                <button className= 'btn btn-primary m-3' onClick = {()=>leaveList()}>Back</button>
                <button className= 'btn btn-danger m-3' onClick = {()=>chooseToLeaveList()}>Leave</button>
                <h1>{sessionName+": "+list.listName}</h1>
            </div>
            {mainWindow}
        </div>
    );
}

export default List;