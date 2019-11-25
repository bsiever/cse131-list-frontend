import React, { useState, useEffect, useCallback, SetStateAction } from 'react';
import { PermissionLevel} from '../../utility/types';

export interface ListInfo {
    id: string,
    permissionLevel: PermissionLevel,
    listName: string
}
interface ListProps {
    id: string,
    userToken: string,
    list: ListInfo,
    leaveList(level: PermissionLevel): void
}
enum WebSocketMessages{
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
    observers: [{fullName: string,permissionLevel: PermissionLevel}]
}


var lastHelpedUserTime = 0;

const List: React.FC<ListProps>  = ({id, userToken, list, leaveList}) => {
    
    const [socket, setSocket] = useState(null)  as [null | WebSocket, React.Dispatch<SetStateAction<null | WebSocket>>]
    const [position, setPosition] = useState(-1);
    const [listTotal, setListTotal] = useState(-1);
    const [requestInProgress, setRequestInProgress] = useState(true);
    const [lastHelped, setLastHelped] = useState('')
    const [flagUserMessage, setFlagUserMessage] = useState('')
    const [flaggedUsers, setFlaggedUsers] = useState({} as {[s: string]: string})
    const [fullClassInfo, setFullClassInfo] = useState(null as null|FullInfo)
    const [leavingList, setLeavingList] = useState(false);

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
        const interval = setInterval(async ()=>{
        if(((socket as WebSocket)) && ((socket as WebSocket).readyState === WebSocket.CLOSED || (socket as WebSocket).readyState === WebSocket.CLOSING) && !leavingList) {
            console.log("Relaunching websocket");
            //TODO merge with above code
            const socket = new WebSocket('wss://dq3o0n1lqf.execute-api.us-east-1.amazonaws.com/dev')
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
                        break;
                    case WebSocketMessages.SetPosition:
                        setPosition(data.message.index)
                        break;
                    case WebSocketMessages.CloseListSession:
                        window.alert('This session has been closed.')
                        await setLeavingList(true);
                        leaveList(100000);
                        break;
                    case WebSocketMessages.HelpEvent:
                        window.alert(`You are being helped by ${data.message.helperName}`)
                        await setLeavingList(true);
                        leaveList(100000);
                        break;
                    case WebSocketMessages.HelperEvent:
                        window.alert(`You are helping ${data.message.studentName}`)
                        setLastHelped(data.message.studentName)
                        break;
                    case WebSocketMessages.UpdateListStatus:
                        setListTotal(data.message.totalNumber)
                        setFlaggedUsers(data.message.flaggedUsers)
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
            return () => {
                socket.close();
            }
        }
    },1000);
    return ()=> clearInterval(interval);
    },[socket,joinList, setSocket, id, list.id, leaveList, userToken,leavingList]);

    useEffect(() => {
        const socket = new WebSocket('wss://dq3o0n1lqf.execute-api.us-east-1.amazonaws.com/dev')
        socket.onmessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data) as Message;
            // if(data.message.version <= version) {
            //     return
            // } else {
            //     setVersion(data.message.version)
            // }
            switch(data.messageType) {
                case WebSocketMessages.InitalizeSession:
                    setRequestInProgress(false)
                    if(data.message.observer) {
                        setListTotal(data.message.totalNumber)      
                        setFlaggedUsers(data.message.flaggedUsers)                  
                    } else {
                        setPosition(data.message.index)
                    }
                    break;
                case WebSocketMessages.SetPosition:
                    setPosition(data.message.index)
                    break;
                case WebSocketMessages.CloseListSession:
                    await setLeavingList(true);
                    leaveList(100000);
                    break;
                case WebSocketMessages.HelpEvent:
                    window.alert(`You are being helped by ${data.message.helperName}`)
                    await setLeavingList(true);
                    leaveList(100000);
                    break;
                case WebSocketMessages.HelperEvent:
                    window.alert(`You are helping ${data.message.studentName}`)
                    setLastHelped(data.message.studentName)
                    break;
                case WebSocketMessages.UpdateListStatus:
                    setListTotal(data.message.totalNumber)
                    setFlaggedUsers(data.message.flaggedUsers)
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
        return () => {
            socket.close();
        }   
    }, [joinList, setSocket, id, list.id, leaveList, userToken]);
   
    

    const helpNextUser = async ()=> {
        if(Date.now() - 5000 > lastHelpedUserTime) {
            lastHelpedUserTime = Date.now();
            (socket as WebSocket).send(JSON.stringify({
                action: 'helpNextUser',
                data: {
                    id,
                    userToken,
                    list_id: list.id
                }
            }))
        }
    }

    const markFlaggedUser = async (e: { preventDefault: () => void; }) =>{
        e.preventDefault();
        (socket as WebSocket).send(JSON.stringify({
            action: 'flagUser',
            data: {
                id,
                userToken,
                list_id: list.id,
                studentName: lastHelped,
                message: flagUserMessage
            }
        }))
    }

    const helpFlaggedUser = async (studentName: string, message: string) =>{
        (socket as WebSocket).send(JSON.stringify({
            action: 'helpFlaggedUser',
            data: {
                id,
                userToken,
                list_id: list.id,
                studentName,
                message
            }
        }))
    }

    const requestFullInfo = async () => {
        (socket as WebSocket).send(JSON.stringify({
            action: 'getFullOverview',
            data: {
                id,
                userToken,
                list_id: list.id
            }
        }))
    }

    const chooseToLeaveList = async () => {
        await setLeavingList(true);
        if((socket as WebSocket).readyState === WebSocket.OPEN) {
            (socket as WebSocket).send(JSON.stringify({
                action: 'leaveList',
                data: {
                    list_id: list.id,
                    id,
                    userToken
                }
            }));
        }
        leaveList(1000)
    }
    let mainWindow;
    if(list.permissionLevel === PermissionLevel.Student) {
        mainWindow = <div>
            <h2>Your Current Position: {position !== -1 ? position : 'Loading'}</h2>
        </div>
    } else {
        mainWindow = <div>
            <h2>Total List Members: {listTotal !== -1 ? listTotal : 'Loading'}</h2>
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
            {list.permissionLevel === PermissionLevel.Professor && <button className='btn btn-primary' onClick = {requestFullInfo} disabled={requestInProgress}>Get Full List Info</button>} 
            {fullClassInfo !== null && 
                <table className='table table-dark'>
                <tbody>
                    <tr><th>Position</th><th>Name</th></tr>
                    {fullClassInfo.listUsers.map(({fullName},index)=><tr key={index}><td>{index}</td><td>{fullName}</td></tr>)}
                </tbody>
            </table>}
        </div>
    }

    return (
        <div className='align-items-center align-middle my-auto'>
            <div className='d-flex m-3 justify-content-center align-items-center'>
                <button className= 'btn btn-primary m-3' onClick = {()=>leaveList(list.permissionLevel)}>Back</button>
                <button className= 'btn btn-danger m-3' onClick = {()=>chooseToLeaveList()}>Leave</button>
                <h1>{list.listName}</h1>
            </div>
            {mainWindow}
        </div>
    );
}

export default List;