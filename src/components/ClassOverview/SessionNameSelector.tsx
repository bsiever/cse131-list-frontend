import React, { useState } from 'react';

interface SessionNameSelectorProps {
    closeSessionCreator(sessions: string[]): void
    lists: string[]
}

const SessionNameSelector: React.FC<SessionNameSelectorProps>  = ({closeSessionCreator, lists}) => {
    
    const [sessionNames, setSessionNames] = useState(lists)

    const createSession = (e: { preventDefault: () => void; })=> {
        e.preventDefault();
        if(sessionNames.length>0){
            closeSessionCreator(sessionNames)
        } else {
            window.alert("You need at least one list name")

        }
    }

    const updateArraySlot = (e: { preventDefault: () => void, target: {value:string} }, index: number) => {
        e.preventDefault();
        const newSessionNames = [...sessionNames]
        newSessionNames[index] = e.target.value
        setSessionNames(newSessionNames);
    }

    const addArraySlot = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setSessionNames([...sessionNames,""]);
    }

    const removeArraySlot = (e: { preventDefault: () => void; },index: number)=> {
        e.preventDefault();
        setSessionNames(sessionNames.filter((_,i) => i!==index));
    }
    return (
        <div className="modal fade show"  role="dialog">
        <div className="modal-dialog" role="document">
        <div className="modal-content">
        <div className="modal-body">
    <div className='card border-dark'>
        <div className='card-body'>
            <h4 className='card-title'>Set List Names</h4>
            <form onSubmit={e=>createSession(e)}>
                <table className='table'>
                    <tbody>
                        <tr><th>List Name</th><th>Remove</th></tr>
                        {sessionNames.map((sessionName,index)=>
                            <tr>
                                <td><input  type='text' className='form-control' minLength = {1} maxLength={50} value={sessionName} onChange={e=>updateArraySlot(e,index)} placeholder="List Name" required ></input></td>
                                <td><button className='btn btn-danger' onClick={(e)=>removeArraySlot(e,index)}>&times;</button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <button className='btn btn-primary mb-3 mr-3' onClick={e=>addArraySlot(e)}>Add Blank Row</button>
                <button className='btn btn-primary mb-3'>Submit Names</button>
          </form>
      </div>
    </div>
    </div>
    </div>
    </div>
    </div>
    );
}

export default SessionNameSelector;