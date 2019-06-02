import React from 'react';
import { ClassObj } from "./types";

interface ClassSelectorProps {
    classes: ClassObj[],
    selectClass: (c: ClassObj) => (void)
}

const ClassSelector: React.FC<ClassSelectorProps> = ({classes,selectClass}) => {

    let classList = classes.map(given_class => 
        <div key={given_class.id} className='class_option align-items-center flex-fill col-md-5 rounded-lg bg-primary text-center p-3 pt-5 pb-5 mx-auto mb-3' onClick = {()=>selectClass(given_class)} >
            <h3>{given_class.name}</h3>
        </div>
    )
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
