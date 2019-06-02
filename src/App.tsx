import React from 'react';
import './App.css';
import {ClassObj, ErrorTypes} from './types'
import Login from './Login'
import ClassSelector from './ClassSelector';
import {makeRequest, SuccessfulResponse, FailedResponse, Response} from './api';

class App extends React.Component {
  state = {
    id: '',
    name: '',
    token: null as string | null,
    tokenTime: 0,
    classes: [{name:'abc',id:'adfafsfasfasdf'},{name:'def',id:'adklfjdasjklf;kjnakjl;kl;asdfjkl;'}] as ClassObj[],
    currentClass: null as string | null,
    currentSession: null as string | null
  }

  performLogin = async (username: string, password: string) => {
    let response: Response = await makeRequest('login',{username, password});
    if(response.success) {
      const data = (response as SuccessfulResponse).data;
      console.log(data)
    } else {
      
      const failed = response as FailedResponse
      console.log(failed)
      console.log(ErrorTypes.InvalidLogin)
      if(failed.errorCode === ErrorTypes.InvalidLogin) {
        console.log("Need to indicated failed login")
      } else {
        console.error("Uh oh")
      }
    }
  }

  selectClass = (given_class: ClassObj) => {
    console.log(given_class)
  }

  render() {
    let mainItem;
    if(this.state.token === null) {
      mainItem = <Login performLogin={this.performLogin} />
    } else if(this.state.currentClass === null) {
      mainItem = <ClassSelector classes={this.state.classes} selectClass={this.selectClass} />
    }
    return (
      <div className="App p-3">
        {/* TODO breadcrumbs */}
        <div className='row App-Body flex-column flex-wrap'>
          {mainItem}
        </div>
      </div>
    );
  }
}

export default App;