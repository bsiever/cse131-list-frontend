import React, { useState } from 'react';
import { DatabaseScheduledEvent } from './ClassScheduleTab';
import SessionNameSelector from './SessionNameSelector';

interface ClassScheduleTabRowProps {
    scheduledEvent: DatabaseScheduledEvent,
    updateScheduledEvent(id: string,minute:number,hour:number,day:number,endMinute:number,endHour:number,endDay:number,sessionName: string, startingLists: string[]): void,
    deleteScheduledEvent(id:string):void
}

const ClassScheduleTabRow: React.FC<ClassScheduleTabRowProps>  = ({scheduledEvent,updateScheduledEvent,deleteScheduledEvent}) => {
    const [newStartMinute, setNewStartMinute] = useState(scheduledEvent.startMinute)
    const [newStartHour, setNewStartHour] = useState(scheduledEvent.startHour)
    const [newStartDay, setNewStartDay] = useState(scheduledEvent.startDay)
    const [newEndMinute, setNewEndMinute] = useState(scheduledEvent.endMinute)
    const [newEndHour, setNewEndHour] = useState(scheduledEvent.endHour)
    const [newEndDay, setNewEndDay] = useState(scheduledEvent.endDay)
    const [newSessionName, setNewSessionName] = useState(scheduledEvent.sessionName)
    const [newListNames, setNewListNames] = useState(scheduledEvent.startingLists)

    const [gettingNewListNames, setGettingNewListNames] = useState(false)
    
    const [requestInProgress, setRequestInProgress] = useState(false)

    const deleteScheduledEventWrapper = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        deleteScheduledEvent(scheduledEvent.id);
        setRequestInProgress(false)
    }

    const updateScheduledEventWrapper = async (e: React.FormEvent<HTMLButtonElement>) => {
        if(e) e.preventDefault();
        setRequestInProgress(true)
        updateScheduledEvent(scheduledEvent.id,newStartMinute,newStartHour,newStartDay,newEndMinute,newEndHour,newEndDay,newSessionName,newListNames);
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

    return (
        <tr>
            <td>
                <input className='form-control' type='text' value={newSessionName} onChange={e=>setNewSessionName(e.target.value)}/>
            </td>
            <td>
                <select className='form-control' value={newStartDay} onChange={e=>setNewStartDay(Number(e.target.value))}>
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                </select>
            </td>
            <td>
                <input className='form-control' type='number' min='0' max='23' value={newStartHour} onChange={e=>setNewStartHour(Number(e.target.value))}/>
            </td>
            <td>
                <input className='form-control' type='number' min='0' max='59' value={newStartMinute} onChange={e=>setNewStartMinute(Number(e.target.value))}/>
            </td>
            <td>
                <select className='form-control' value={newEndDay} onChange={e=>setNewEndDay(Number(e.target.value))}>
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                </select>
            </td>
            <td>
                <input className='form-control' type='number' min='0' max='23' value={newEndHour} onChange={e=>setNewEndHour(Number(e.target.value))}/>
            </td>
            <td>
                <input className='form-control' type='number' min='0' max='59' value={newEndMinute} onChange={e=>setNewEndMinute(Number(e.target.value))}/>
            </td>
            <td>
                <button className='btn btn-primary' disabled={requestInProgress} onClick={e=>selectStartingList(e)}>List Names</button>
            </td>
            <td>
                <button className='btn btn-success' onClick={(e)=>updateScheduledEventWrapper(e)} disabled={requestInProgress}>Update</button>
            </td>
            <td>
                <button className='btn btn-danger' onClick={(e)=>deleteScheduledEventWrapper(e)} disabled={requestInProgress}>&times;</button>
            </td>
            {gettingNewListNames?<SessionNameSelector closeSessionCreator={setStartingLists} lists={newListNames} />:null}
        </tr>
    );
}

export default ClassScheduleTabRow;