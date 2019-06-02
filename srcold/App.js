import React from 'react';
import './App.css';
import Login from './Login'
import ClassSelector from './ClassSelector';

class App extends React.Component {
  state = {
    id: null,
    name: null,
    token: null,
    tokenTime: 0,
    classes: [{name:'abc',id:'adfafsfasfasdf'},{name:'def',id:'adklfjdasjklf;kjnakjl;kl;asdfjkl;'}],
    currentClass: null,
    currentSession: null
  }

  performLogin = (username, password) => {
    console.log(username)
  }

  selectClass = given_class => {
    console.log(given_class)
  }

  render() {
    let mainItem;
    if(this.state.token !== null) {
      mainItem = <Login performLogin={this.performLogin} />
    } else if(this.state.currentClass === null) {
      mainItem = <ClassSelector classes={this.state.classes} selectClass={this.selectClass} />
    }
    return (
      <div className="App">
        {/* TODO breadcrumbs */}
        <div className='container App-Body'>
          {mainItem}
        </div>
      </div>
    );
  }
}

export default App;
