import React from 'react';

const ClassSelector = ({classes,selectClass}) => {

    let classList = classes.map(given_class => 
        <div key={given_class.id} className='class_option flex-fill col-md-6' onClick = {()=>selectClass(given_class)} >
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
