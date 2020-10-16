import React, { useState, useEffect, useCallback, SetStateAction } from 'react';
import { PermissionLevel } from '../../utility/types';
import { websocketUrl } from '../../utility/api';

export interface ListInfo {
    id: string,
    permissionLevel: PermissionLevel,
    listName: string,
    remoteMode: boolean,
    remoteURL: null | string
}
interface ListProps {
    id: string,
    userToken: string,
    list: ListInfo,
    leaveList(): void,
    miniView: boolean,
    selectList(obj: ListInfo): void,
    sessionName: string,
    disableAudioAlerts: boolean
}
export enum WebSocketMessages{
    InitalizeSession = 'initSession',
    SetPosition = 'setPos',
    CloseListSession = 'closeListSession',
    UpdateListStatus = 'updateListStatus',
    HelpEvent = 'helpEvent',
    HelperEvent = 'helperEvent',
    FlagRecorded = 'flagRecorded',
    FullInfo = 'fullInfo',
    Ping = 'ping'
}

interface Message {
    messageType: WebSocketMessages,
    message: any
}

interface FullInfo {
    listUsers: [{ fullName: string, id: string }],
    observers: [{ fullName: string, permissionLevel: PermissionLevel, startTime: number, timedEventTime?: number, helpedStudents?: number, flaggedStudents?: number, helpedFlaggedStudents?: number }]
}


var lastHelpedUserTime = 0;
var helpUserTimerID: null | number = null;
var listTotalMirror = -1;
const INTERVAL_0_TO_1 = 5;
const INTERVAL_1_TO_2 = 10;

const List: React.FC<ListProps> = ({ id, userToken, list, leaveList, miniView, selectList, sessionName, disableAudioAlerts }) => {

    const [socket, setSocket] = useState(null) as [null | WebSocket, React.Dispatch<SetStateAction<null | WebSocket>>]
    const [position, setPosition] = useState(-1);
    const [listTotal, setListTotal] = useState(-1);
    const [requestInProgress, setRequestInProgress] = useState(true);
    const [lastHelped, setLastHelped] = useState('')
    const [flagUserMessage, setFlagUserMessage] = useState('')
    const [flagUserLevel, setFlagUserLevel] = useState(0)
    const [flaggedUsers, setFlaggedUsers] = useState({} as { [s: string]: string })
    const [originalFlaggedUsers, setOriginalFlaggedUsers] = useState({} as { [s: string]: string })
    const [fullClassInfo, setFullClassInfo] = useState(null as null | FullInfo)
    const [leavingList, setLeavingList] = useState(false);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
    const [presentObservers, setPresentObservers] = useState(-1)
    //const [helpUserTimer, setHelpUserTime] = useState(null) as [null |number, React.Dispatch<SetStateAction<null | number>>];


    const joinList = useCallback((e: Event): any => {
        (e.target as WebSocket).send(JSON.stringify({
            action: 'joinList',
            data: {
                list_id: list.id,
                id,
                userToken,
                remoteURL: list.remoteURL === null ? "": list.remoteURL
            }
        }))
    }, [id, list, userToken, miniView, leaveList]);

    //TODO fix this whole thing
    useEffect(() => {
        const notifyTimeOut = () => {
            helpUserTimerID = null;
            if (listTotalMirror > 0) {
                window.alert("You've been helping a student for over 10 minutes!");
            }
        }
        async function launchSocket() {
            if (!socket || ((socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) && !leavingList)) {
                console.log('Attempting Reconnection');
                const socket = new WebSocket(websocketUrl)
                socket.onmessage = async (event: MessageEvent) => {
                    const data = JSON.parse(event.data) as Message;
                    switch (data.messageType) {
                        case WebSocketMessages.InitalizeSession:
                            setRequestInProgress(false)
                            if (data.message.observer) {
                                setListTotal(data.message.totalNumber)
                                listTotalMirror = data.message.totalNumber
                                setOriginalFlaggedUsers(data.message.flaggedUsers)
                            } else {
                                setPosition(data.message.index)
                            }
                            setPresentObservers(data.message.numObserversPresent)
                            setEstimatedWaitTime(data.message.estimatedWaitTime)
                            break;
                        case WebSocketMessages.SetPosition:
                            setPosition(data.message.index)
                            setEstimatedWaitTime(data.message.estimatedWaitTime)
                            setPresentObservers(data.message.numObserversPresent)
                            break;
                        case WebSocketMessages.CloseListSession:
                            setLeavingList(true);
                            if (!miniView) {
                                window.alert('This session has been closed.')
                                leaveList();
                            }
                            break;
                        case WebSocketMessages.HelpEvent:
                            try {
                                if(!disableAudioAlerts) {
                                    const audio = new Audio('/notification.mp3');
                                    await audio.play();
                                }
                            } catch(e) {
                                console.log(e)
                            }
                            
                            if(list.remoteMode && data.message.remoteURL) {
                                await new Promise(resolve => setTimeout(resolve,1000));
                                window.location.href = data.message.remoteURL
                                setTimeout(()=>window.alert(`You are being helped by ${data.message.helperName}`+"\nIf you are not redirected after clicking OK, please go to "+data.message.remoteURL),100)
                                return false
                            } else {
                                window.alert(`You are being helped by ${data.message.helperName}\nThe TA will call your name`)
                            }
                            setLeavingList(true);
                            leaveList();
                            break;
                        case WebSocketMessages.HelperEvent:
                            if (helpUserTimerID) { clearTimeout(helpUserTimerID) }
                            helpUserTimerID = window.setTimeout(notifyTimeOut, 10  * 60 * 1000);
                            window.alert(`You are helping ${data.message.studentName}`)
                            setLastHelped(data.message.studentName)
                            break;
                        case WebSocketMessages.UpdateListStatus:
                            if(listTotalMirror===0 && data.message.totalNumber>0) {
                                try {
                                    if(!disableAudioAlerts) {
                                        const audio = new Audio('/notification.mp3');
                                        await audio.play();
                                    }
                                }catch(e) {
                                    console.log(e)
                                }
                            } 
                            setListTotal(data.message.totalNumber)
                            listTotalMirror = data.message.totalNumber
                            setPresentObservers(data.message.numObserversPresent)
                            setOriginalFlaggedUsers(data.message.flaggedUsers)
                            setEstimatedWaitTime(data.message.estimatedWaitTime)
                            break;
                        case WebSocketMessages.FlagRecorded:
                            setLastHelped('')
                            setFlagUserMessage('')
                            setFlagUserLevel(0)
                            break;
                        case WebSocketMessages.FullInfo:
                            setFullClassInfo({ listUsers: data.message.users, observers: data.message.tas })
                            break;
                    }
                };
                socket.onopen = joinList as any;
                setSocket(socket)
            }
        }
        launchSocket();
        const interval = setInterval(launchSocket, 1000);
        return () => { clearInterval(interval); if (socket) { socket.close() } }
    }, [socket, joinList, setSocket, id, list, leaveList, userToken, leavingList, miniView]);

    useEffect(()=>{
        let timerId = setInterval(()=> {
            let result = {} as { [s: string]: string }
            for(let [name,message] of Object.entries(originalFlaggedUsers)) {
                const bits  = message.split(' ')
                const timeString = bits[1].length > 0 ? bits[1] : bits[2]
                const indexColon = timeString.indexOf(':')
                let hour = Number(timeString.substring(0,indexColon))
                const modifier = bits[1].length > 0 ? bits[2]: bits[3]
                if(modifier.substring(0,2) === 'PM' && hour !== 12) {
                    hour += 12;
                }
                if(modifier.substring(0,2) === 'AM' && hour === 12) {
                    hour = 0;
                }
                let minute = Number(timeString.substring(indexColon+1))
                const d = new Date()
                const currentHour = Number(d.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Chicago' }))
                const currentMinute = Number(d.toLocaleString('en-US', { minute: 'numeric', timeZone: 'America/Chicago' }))
                if(hour !== currentHour) {
                    minute -= 60;
                }
                let level = Number(message.slice(-1))
                let diff =  currentMinute - minute;
                if(level === 0 && diff >= INTERVAL_0_TO_1) {
                    level+=1;
                    diff -= INTERVAL_0_TO_1;
                }
                if(level === 1 && diff >= INTERVAL_1_TO_2) {
                    level+=1;
                }
                result[name] = message.slice(0,-1)+level
            }
            setFlaggedUsers(result)
        },1000)
        return () => clearInterval(timerId)
    },[originalFlaggedUsers])


    const sendWebsocketMessage = (action: string, data: object) => {
        if ((socket as WebSocket).readyState === WebSocket.OPEN) {
            (socket as WebSocket).send(JSON.stringify({ action, data }));
        }
    }

    const helpNextUser = () => {
        if (Date.now() - 1000 > lastHelpedUserTime) {
            if (helpUserTimerID) { clearTimeout(helpUserTimerID) }
            helpUserTimerID = null;
            lastHelpedUserTime = Date.now();
            sendWebsocketMessage('helpNextUser', {
                id,
                userToken,
                list_id: list.id
            })
        }
    }

    const helpUser = (helpeeId: string) => {
        if (Date.now() - 1000 > lastHelpedUserTime) {
            if (helpUserTimerID) { clearTimeout(helpUserTimerID) }
            helpUserTimerID = null;
            lastHelpedUserTime = Date.now();
            sendWebsocketMessage('helpUser', {
                id,
                userToken,
                list_id: list.id,
                helpeeId
            })
        }
    }

    const markFlaggedUser = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        sendWebsocketMessage('flagUser', {
            id,
            userToken,
            list_id: list.id,
            studentName: lastHelped,
            message: flagUserMessage,
            startingLevel: flagUserLevel
        })
    }

    const helpFlaggedUser = async (studentName: string) => {
        if (helpUserTimerID) { clearTimeout(helpUserTimerID) }
        helpUserTimerID = null;
        sendWebsocketMessage('helpFlaggedUser', {
            id,
            userToken,
            list_id: list.id,
            studentName,
            message: originalFlaggedUsers[studentName]
        })
    }

    const requestFullInfo = async () => {
        sendWebsocketMessage('getFullOverview', {
            id,
            userToken,
            list_id: list.id
        })
    }

    const chooseToLeaveList = async () => {
        setLeavingList(true);
        sendWebsocketMessage('leaveList', {
            list_id: list.id,
            id,
            userToken
        });
        leaveList()
    }
    let mainWindow;
    let estimatedWaitP = (estimatedWaitTime !== 0  && (listTotal !== 0 || list.permissionLevel == PermissionLevel.Student )&& estimatedWaitTime >= 60000) ? <p style={{marginBottom: '0'}}>Estimated Wait: {Math.floor(estimatedWaitTime / 60000)} minute(s)</p> : <p style={{marginBottom: '0'}}>Expected Wait: None</p>;
    let numberOfTAs = <p>Approximate Number of TAs: {presentObservers !== -1 ? presentObservers: 'Loading'}</p>
    const flaggedUsersLevels = Object.entries(flaggedUsers).map(([user, message])=>Number(message.slice(-1)))
    if (list.permissionLevel === PermissionLevel.Student) {
        mainWindow = <div>
            <h2>Your Current Position: {position !== -1 ? (position !== 0 ? position : '0 (You Are Next)') : 'Loading'}</h2>
            {estimatedWaitP}
            {numberOfTAs}
        </div>
    } else if (miniView) {
        return <div key={id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick={() => selectList(list)} >
            <h3>{sessionName + ": " + list.listName}</h3>
            <p className='m-0'>List Count: {listTotal !== -1 ? listTotal : 'Loading'}</p>
            <p className='m-0'>Flagged Users: G: {flaggedUsersLevels.filter(d=>d===0).length}, A: {flaggedUsersLevels.filter(d=>d===1).length}, P: {flaggedUsersLevels.filter(d=>d===2).length}</p>
            {estimatedWaitP}
            {numberOfTAs}
        </div>
    } else {
        mainWindow = <div>
            <h2>Total List Members: {listTotal !== -1 ? listTotal : 'Loading'}</h2>
            {estimatedWaitP}
            {numberOfTAs}
            <button className='btn btn-primary' onClick={helpNextUser} disabled={requestInProgress}>Help Next Person</button>
            <form className='form-inline justify-content-center m-2' onSubmit={markFlaggedUser}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Student Name
                        <input type='text' className='form-control ml-3' maxLength={50} value={lastHelped} onChange={e => setLastHelped(e.target.value)} placeholder='Student Name' required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Note
                        <input type='text' className='form-control ml-3' maxLength={1000} value={flagUserMessage} onChange={e => setFlagUserMessage(e.target.value)} placeholder='Notes' required />
                    </label>
                </div>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Level
                        <select className='form-control ml-3' value={flagUserLevel} onChange={e=>setFlagUserLevel(Number(e.target.value))}>
                            <option value={0}>General</option>
                            <option value={1}>Advanced</option>
                            <option value={2}>Professor/Head TA</option>
                        </select>
                    </label>
                </div>
                <button type='submit' className='btn btn-warning' disabled={requestInProgress}>Flag User for Help</button>
            </form>
            <h2>Flagged Users</h2>
            <table className='table table-dark'>
                <tbody>
                    <tr><th>Name</th><th>Message</th><th>Level</th><th>Help User</th></tr>
                    {Object.entries(flaggedUsers).sort((a, b) => a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0).map(([studentName, message]) => <tr key={studentName}><td>{studentName}</td><td>{message.slice(0, -1)}</td><td>{Number(message.slice(-1)) === 2 ? 'Professor/Head TA':(Number(message.slice(-1)) === 1? 'Advanced': 'General')}</td><td><button className='btn btn-primary' onClick={() => helpFlaggedUser(studentName)} disabled={requestInProgress}>&times;</button></td></tr>)}
                </tbody>
            </table>
            {list.permissionLevel === PermissionLevel.Professor && <button className='btn btn-primary m-2' onClick={requestFullInfo} disabled={requestInProgress}>Get Full List Info</button>}
            {fullClassInfo !== null &&
                <div className='d-flex flex-column'>
                    <table className='table table-dark flex-grow-1 table-bordered'>
                        <tbody>
                            <tr><th>Position</th><th>Name</th><th>Help User</th></tr>
                            {fullClassInfo.listUsers.map(({ fullName, id }, index) => <tr key={index}><td>{index}</td><td>{fullName}</td><td><button className='btn btn-success' onClick={()=>helpUser(id)} disabled={requestInProgress}>Help</button></td></tr>)}
                        </tbody>
                    </table>
                    <table className='table table-dark flex-grow-1 table-bordered'>
                        <tbody>
                            <tr><th className='px-1'>Name</th><th className='px-1'>Helped</th><th className='px-1'>Flagged</th><th className='px-1'>Helped Flagged</th><th className='px-1'>Start</th><th className='px-1'>Last Seen</th></tr>
                            {fullClassInfo.observers.map(({ fullName, startTime, helpedStudents, helpedFlaggedStudents, flaggedStudents, timedEventTime }, index) => <tr key={index}><td className='px-1'>{fullName}</td><td className='px-1'>{helpedStudents ? helpedStudents : 0}</td><td className='px-1'>{flaggedStudents ? flaggedStudents : 0}</td><td className='px-1'>{helpedFlaggedStudents ? helpedFlaggedStudents : 0}</td><td className='px-1'>{new Date(startTime).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' })}</td><td className='px-1'>{timedEventTime ? new Date(timedEventTime).toLocaleTimeString('en-us', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'America/Chicago' }) : 'N/A'}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    }

    return (
        <div className='align-items-center align-middle my-auto'>
            <div className='d-flex m-3 justify-content-center align-items-center'>
                <button className='btn btn-primary m-3' onClick={() => leaveList()}>Back</button>
                <button className='btn btn-danger m-3' onClick={() => chooseToLeaveList()}>Leave</button>
                <h1>{sessionName + ": " + list.listName}</h1>
            </div>
            {mainWindow}
        </div>
    );
}

export default List;