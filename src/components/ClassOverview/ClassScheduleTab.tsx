import React, { useEffect, useState, useCallback } from "react"
import { makeRequest, APIResponse } from "../../utility/api";
import ClassScheduleTabRow from "./ClassScheduleTabRow";
import SessionNameSelector from "./SessionNameSelector";

interface ClassScheduleTabProps {
    id: string,
    userToken: string,
    classId: string
}

export interface DatabaseScheduledEvent {
    id: string,
    startDay: number,
    startHour: number,
    startMinute: number,
    endDay: number,
    endHour: number,
    endMinute: number,
    sessionName: string,
    classId: string,
    sessionId?: string,
    startingLists: string[],
    creatorId: string
}


const ClassScheduleTab: React.FC<ClassScheduleTabProps>  = ({id, userToken, classId}) => {

    const [scheduledEvents, setScheduledEvents] = useState([] as DatabaseScheduledEvent[])

    const [newStartMinute, setNewStartMinute] = useState(0)
    const [newStartHour, setNewStartHour] = useState(0)
    const [newStartDay, setNewStartDay] = useState(0)
    const [newEndMinute, setNewEndMinute] = useState(0)
    const [newEndHour, setNewEndHour] = useState(0)
    const [newEndDay, setNewEndDay] = useState(0)
    const [newSessionName, setNewSessionName] = useState('')
    const [newListNames, setNewListNames] = useState(['Help List','Demo List'])

    const [gettingNewListNames, setGettingNewListNames] = useState(false)
    const [requestInProgress, setRequestInProgress] = useState(false);

    const updateScheduledEvents = useCallback(async() => {
        let response: APIResponse = await makeRequest('getScheduleForClass', {id, userToken, classId});
        setScheduledEvents(response.data as any);
    },[id,userToken,classId]);

    const updateScheduledEvent = async (scheduleId: string,minute:number,hour:number,day:number,endMinute:number,endHour:number,endDay:number,sessionName: string, startingLists: string[]) => {
        await makeRequest('updateScheduledSession', {id, userToken, scheduleId,hour,minute,day,endMinute,endHour,endDay,sessionName ,classId, startingLists});
        await updateScheduledEvents();
    }

    const deleteScheduledEvent = async (scheduleId: string)=> {
        await makeRequest('removeScheduledSession', {id, userToken, scheduleId,classId});
        await updateScheduledEvents();
    }
    useEffect(()=>{updateScheduledEvents()},[updateScheduledEvents]);

    const createScheduledEvent = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        await makeRequest('addScheduledSession',{id, userToken, startingLists: newListNames, classId, hour:newStartHour, minute: newStartMinute,day: newStartDay,endHour:newEndHour,endMinute: newEndMinute,endDay:newEndDay,sessionName:newSessionName})
        await updateScheduledEvents();
        setRequestInProgress(false)
    }

    const selectStartingList = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        setGettingNewListNames(true);
    }

    const setStartingLists = async (list: string[]) => {
        setNewListNames(list);
        setGettingNewListNames(false);
    }

    
    return (<div>
        
        <h4 className='card-title'>Add Scheduled Event</h4>
        <form onSubmit={createScheduledEvent} className='form-inline'> 
            <div className='form-group mx-auto my-1'>
                <input type='text' className='form-control' maxLength={50} value={newSessionName} onChange={e=>setNewSessionName(e.target.value)} placeholder="Session Name" required />
            </div>
            <div className='form-group mx-auto my-1'>
                <select className='form-control' value={newStartDay} onChange={e=>setNewStartDay(Number(e.target.value))}>
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                </select>
            </div>
            <input className='form-control mx-auto my-1'  type='number' min='0' max='23' value={newStartHour} onChange={e=>setNewStartHour(Number(e.target.value))}/>
            <input className='form-control mx-auto my-1' type='number' min='0' max='59' value={newStartMinute} onChange={e=>setNewStartMinute(Number(e.target.value))}/>
            <select className='form-control mx-auto my-1' value={newEndDay} onChange={e=>setNewEndDay(Number(e.target.value))}>
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
            </select>
            <input className='form-control mx-auto my-1' type='number' min='0' max='23' value={newEndHour} onChange={e=>setNewEndHour(Number(e.target.value))}/>
            <input className='form-control mx-auto my-1' type='number' min='0' max='59' value={newEndMinute} onChange={e=>setNewEndMinute(Number(e.target.value))}/>
            <button className='btn btn-primary mx-auto my-1' disabled={requestInProgress} onClick={e=>selectStartingList(e)}>List Names</button>
            <button type='submit' className='btn btn-success mx-auto my-1' disabled={requestInProgress}>Add Event</button>
        </form>
        <p>Scheduled times are run every five minutes</p>
        <table className='table'>
            <tbody>
                <tr><th>Session Name</th><th>Start Day</th><th>Start Hour</th><th>Start Minute</th><th>End Day</th><th>End Hour</th><th>End Minute</th><th>Update List Names</th><th>Update</th><th>Delete</th></tr>
                {scheduledEvents.map(event=><ClassScheduleTabRow updateScheduledEvent={updateScheduledEvent} deleteScheduledEvent={deleteScheduledEvent} key = {event.id} scheduledEvent={event}/>)}
            </tbody>
        </table>
        {gettingNewListNames?<SessionNameSelector closeSessionCreator={setStartingLists} lists={newListNames} />:null}
    </div>
    )
}

export default ClassScheduleTab
