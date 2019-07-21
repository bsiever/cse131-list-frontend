import React from 'react';
import { ClassObj } from "../../utility/types";

interface ClassSelectorProps {
    classes: ClassObj[],
    selectClass: (c: ClassObj) => (void)
}

const ClassSelector: React.FC<ClassSelectorProps> = ({classes,selectClass}) => {

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
    return (
        <div>
            <h1>Avaliable Classes</h1>
            <div className='Classes container d-flex flex-wrap'>
                {classList}
            </div>
        </div>
        
    );
}

export default ClassSelector;
