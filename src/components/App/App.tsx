import React from 'react';
import {ClassObj} from '../../utility/types'
import ClassSelector from '../ClassSelector/ClassSelector';
import LoginWrapper from '../Login/LoginWrapper';
import AdminManagement from '../AdminManagement/AdminManagement';
import ClassOverview from '../ClassOverview/ClassOverview';
import CreateClass from '../CreateClass/CreateClass';
import { makeRequest, APIResponse } from '../../utility/api';
import GlobalNav from '../GlobalNav/GlobalNav';
import List, { ListInfo } from '../List/List';

class App extends React.Component {
  state = {
    id: '',
    username: '',
    name: '',
    userToken: null as string | null,
    tokenTime: 0,
    classes: [] as ClassObj[],
    currentClass: null as ClassObj | null,
    currentList: null as ListInfo | null,
    admin: false as boolean
  }

  /*State Hooks*/

  setUserInfo = (id: string, username: string, name: string, userToken: string, classes: ClassObj[], admin: boolean) => {
    this.setState({id,username, name,userToken,tokenTime: Date.now(),classes, admin})
  }

  selectClass = (given_class: ClassObj) => {
    this.setState({currentClass: given_class})
  }

  selectList = (obj: ListInfo) => {
    this.setState({currentList: obj})
  }
  /*Update Function*/

  refreshUserInfo = async () => {
    let response: APIResponse = await makeRequest('refreshUserInfo',{id: this.state.id, userToken: this.state.userToken});
    if(response.success) {
      const data: any = response.data;
      this.setState({classes: data.classes, username: data.username, name: data.fullName})
    }
  }
  
  exitClass = async () => {
    await this.refreshUserInfo();
    this.setState({currentClass: null})
  }

  leaveList = async () => {
    this.setState({currentList: null})
  }

  resetToHome = async () => {
    await this.setState({currentClass: null, currentSession: null})
  }

  logout = async (inactivity: boolean) => {
    let response: APIResponse = await makeRequest('logout',{id: this.state.id, userToken: this.state.userToken});
    if(response.success) {
      this.setState({
        id: '',
        username: '',
        name: '',
        userToken: null,
        tokenTime: 0,
        classes: [],
        currentClass: null,
        currentList: null,
        admin: false
      })
    }
    if(inactivity) {
      window.alert('You have been logged out due to inactivity')
    }
    return response.success;
  }
  render() {
    let mainItem;
    if(this.state.userToken === null) {
      mainItem = <LoginWrapper setUserInfo={this.setUserInfo.bind(this)} />
    } else if(this.state.currentClass === null) {
      mainItem = <div>
        <ClassSelector classes={this.state.classes} selectClass={this.selectClass} />
        {this.state.admin && <div  className='align-items-center align-middle my-auto'>
          <h1>Administrative Settings</h1>
          <CreateClass id={this.state.id} userToken = {this.state.userToken as string} refreshClasses= {this.refreshUserInfo}/> 
          <AdminManagement id={this.state.id} userToken = {this.state.userToken as string} />
        </div>}
      </div>
    } else if(this.state.currentList === null) {
      mainItem = <ClassOverview id={this.state.id} userToken = {this.state.userToken} className = {this.state.currentClass.className} classId = {this.state.currentClass.id} exitClass={this.exitClass} updateCurrentClass={this.selectClass} selectList={this.selectList}/>
    } else {
      mainItem = <List id={this.state.id} userToken = {this.state.userToken} list = {this.state.currentList} leaveList  = {this.leaveList} />
    }
    return (
      <div className="bg-dark text-white d-flex flex-column text-center min-vh-100">
        <GlobalNav id={this.state.id} userToken = {this.state.userToken as string} username={this.state.username} fullName={this.state.name} refreshUserInfo={this.refreshUserInfo} goHome={this.resetToHome} logout={this.logout}/>
        {/* TODO breadcrumbs */}
        <div className='flex-column flex-wrap'>
          
          {mainItem}
        </div>
      </div>
    );
  }
}

export default App;