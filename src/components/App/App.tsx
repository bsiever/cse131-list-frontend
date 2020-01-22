import React from 'react';
import {ClassObj, SessionObj} from '../../utility/types'
import ClassSelector from '../ClassSelector/ClassSelector';
import LoginWrapper from '../Login/LoginWrapper';
import AdminManagement from '../AdminManagement/AdminManagement';
import ClassOverview from '../ClassOverview/ClassOverview';
import CreateClass from '../CreateClass/CreateClass';
import { makeRequest, APIResponse } from '../../utility/api';
import GlobalNav from '../GlobalNav/GlobalNav';
import List, { ListInfo } from '../List/List';

function getUrlVars() {
  var vars = {} as any;
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m: any,key: string | number,value: any) {
      vars[key] = value;
  } as any );
  return vars;
}
//https://www.w3schools.com/js/js_cookies.asp
function getCookie(cname: string) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
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
    admin: false as boolean,
    chosenSession: null as null | SessionObj
  }

  /*State Hooks*/

  
  componentDidMount = async ()=> {
    if(window.location.href.indexOf('code') > -1){
      let client_code = getUrlVars()['code'];
      let response: APIResponse = await makeRequest('login',{client_code});
      if(response.success) {
        const data: any = response.data;
        this.setUserInfo(data.id, data.username, data.fullName, data.userToken, data.classes, data.admin);
        document.cookie = "id="+data.id;
        document.cookie = "token="+data.userToken;
        window.history.replaceState({}, document.title, "/");
      } else {
        window.alert('Login failed, please make sure you have the appropriate email on your Github Account');
      }
    } else if(getCookie("token") !== "" && getCookie("id") !== "" ) {
      let success = await this.refreshUserInfo(getCookie("id"),getCookie("token"),true);
      if(success) {
        await this.setState({id: getCookie("id"), userToken: getCookie("token")});
      } else {
        document.cookie = "";
      }
    }
  }

  

  setUserInfo = (id: string, username: string, name: string, userToken: string, classes: ClassObj[], admin: boolean) => {
    this.setState({id,username, name,userToken,tokenTime: Date.now(),classes, admin})
  }

  setChosenSession = (chosenSession: SessionObj) => {
    this.setState({chosenSession});
  }
  
  selectClass = (given_class: ClassObj) => {
    this.setState({currentClass: given_class})
  }

  selectList = (obj: ListInfo) => {
    this.setState({currentList: obj})
  }
  /*Update Function*/

  refreshUserInfo = async (id = this.state.id, userToken = this.state.userToken, failureAllowed = false): Promise<boolean> => {
    let response: APIResponse = await makeRequest('refreshUserInfo',{id, userToken},failureAllowed);
    if(response.success) {
      const data: any = response.data;
      this.setState({classes: data.classes, username: data.username, name: data.fullName, admin: data.admin})
    }
    return response.success;
  }
  
  exitClass = async () => {
    await this.refreshUserInfo();
    this.setState({currentClass: null, chosenSession: null, currentList: null})
  }

  leaveList = async () => {
    this.setState({currentList: null})
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
      mainItem = <LoginWrapper />
    } else if(this.state.currentClass === null) {
      mainItem = <div>
        <ClassSelector classes={this.state.classes} selectClass={this.selectClass} id={this.state.id} userToken ={this.state.userToken} refreshClasses={()=>this.refreshUserInfo()} />
        {this.state.admin && <div  className='align-items-center align-middle my-auto'>
          <h1>Administrative Settings</h1>
          <CreateClass id={this.state.id} userToken = {this.state.userToken as string} refreshClasses= {this.refreshUserInfo}/> 
          <AdminManagement id={this.state.id} userToken = {this.state.userToken as string} />
        </div>}
      </div>
    } else if(this.state.currentList === null) {
      mainItem = <ClassOverview setSession={this.setChosenSession} chosenSession={this.state.chosenSession} id={this.state.id} userToken = {this.state.userToken} className = {this.state.currentClass.className} classId = {this.state.currentClass.id} exitClass={this.exitClass} updateCurrentClass={this.selectClass} selectList={this.selectList}/>
    } else {
      mainItem = <List selectList={this.selectList} miniView={false} id={this.state.id} userToken = {this.state.userToken} list = {this.state.currentList} leaveList  = {this.leaveList} />
    }
    return (
      <div className="bg-dark text-white d-flex flex-column text-center min-vh-100">
        <GlobalNav id={this.state.id} userToken = {this.state.userToken as string} username={this.state.username} fullName={this.state.name} refreshUserInfo={this.refreshUserInfo} goHome={this.exitClass} logout={this.logout}/>
        {/* TODO breadcrumbs */}
        <div className='flex-column flex-wrap'>
          
          {mainItem}
        </div>
      </div>
    );
  }
}

export default App;