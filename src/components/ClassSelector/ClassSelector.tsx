import React, {useState} from 'react';
import { ClassObj, ErrorTypes } from "../../utility/types";
import { makeRequest} from '../../utility/api';
interface ClassSelectorProps {
    classes: ClassObj[],
    selectClass: (c: ClassObj) => (void),
    id: string,
    userToken: string,
    refreshClasses: ()=>(void)
}

const ClassSelector: React.FC<ClassSelectorProps> = ({classes,selectClass,id,userToken,refreshClasses}) => {

    const [classCode, setClassCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    let classList = []
    for (const {id, className} of classes) {
        classList.push(
            <div key={id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {()=>selectClass({id,className})} >
                <h3>{className}</h3>
            </div>)
    }
    if(classList.length === 0) {
        classList = [<h2 key='singleton'>You are not enrolled in any classes currently</h2>]
    }

    const joinClass = async (e: React.FormEvent<HTMLFormElement>) => {
        if(e) e.preventDefault();
        const result = await makeRequest('selfAddClass', {id, userToken, classCode});
        if(result.success) {
            await setClassCode('');
            await setErrorMessage('Success!');
            refreshClasses();
        } else if(result.errorCode === ErrorTypes.UserAlreadyInClass) {
            await setErrorMessage('Already In Class');
        } else {
            setErrorMessage('Class Not Found');
        }
        
    }
    return (
        <div>
            <h1>Available Classes</h1>
            <form className='form-inline justify-content-center m-2' onSubmit={joinClass}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Class Code
                        <input type='text' className='form-control ml-3' minLength={10} maxLength={10} value={classCode} onChange={e=>setClassCode(e.target.value)} placeholder='Join Code' required />
                    </label>
                </div>
                <button type='submit' className='btn btn-success'>Join Class</button>
            </form>
            <p>{errorMessage}</p>
            <div className={'Classes container'+(classes.length === 0 ? '':'d-flex flex-wrap')} >
                {classList}
            </div>
        </div>
        
    );
}

export default ClassSelector;
