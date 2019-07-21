import React, { useState} from 'react';
import { makeRequest, APIResponse } from '../../utility/api';

interface CreateClassProps {
    id: string,
    userToken: string,
    refreshClasses(): void
}

const CreateClass: React.FC<CreateClassProps>  = ({id, userToken, refreshClasses}) => {
    const [className, setClassName] = useState('');
    const [requestInProgress, setRequestInProgress] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const createClass = async (e: { preventDefault: () => void; }) => {
        if(e) e.preventDefault();
        await setRequestInProgress(true)
        //Add user
        const res: APIResponse = await makeRequest('createClass', {id, userToken, className});
        setErrorMessage(res.success ? 'Class sucessfully created': 'An error occurred creating the class')
        refreshClasses();
        setClassName('');
        setRequestInProgress(false)
    }

    return (
        <div>
            <h4>Create a Class</h4>
            <form className='form-inline justify-content-center m-2' onSubmit={createClass}>
                <div className='form-group'>
                    <label className='text-left mr-3'>
                        Name
                        <input type='text' className='form-control ml-3' maxLength={50} value={className} onChange={e=>setClassName(e.target.value)} placeholder='New Class Name' required />
                    </label>
                </div>
                <button type='submit' className='btn btn-success' disabled={requestInProgress}>Create Class</button>
            </form>
            {errorMessage && <p>{errorMessage}</p>}
        </div>
    );
}

export default CreateClass;