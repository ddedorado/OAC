import { Component, Input } from '@angular/core';
import { Events, NavController, ToastController } from 'ionic-angular';
import { AppState } from '../../providers/providers';

@Component({
  selector: 'custom-header',
  templateUrl: 'custom-header.html',
  providers: [AppState]
})
export class CustomHeaderComponent {

  _title: string = 'Home';

  _robotConnected: any = -1;

  _home: any = {
    id: 'home',
    title: 'Home',
    icon: 'abb-home',
    value: 'HomePage',
    function: 'navPage'
  };

  _pages: any = [
    {
      id: 'reset',
      title: 'Error Reset',
      icon: 'abb-reset',
      value: 'HomePage',
      function: ''
    },
    {
      id: 'connect-to-robot',
      title: 'Connect to robot',
      icon: 'abb-connect',
      value: 'ConnectRobotPage',
      function: 'navPage'
    },
    {
      id: 'load-program',
      title: 'Load Program',
      icon: 'abb-load',
      value: 'LoadProgramPage',
      function: 'navPage'
    },
    {
      id: 'manual-guiding',
      title: 'Manual Guiding',
      icon: 'abb-manualguiding',
      value: 'ManualGuidingPage',
      function: 'navPage'
    }
    /*{
      title: 'Modify Skills',
      icon: 'abb-modifyskill',
      value: ''
    }*/
  ];

  constructor( 
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    private events: Events,
    public appState: AppState
  ){

    this.appState.getRobot().then(val => {
      this._robotConnected = val != null && (val.isConnected) ? val.isConnected : -1;
    });

    this.events.subscribe('enabledRobot', (robot) => {
      console.log("EVENTO enabledRobot:", robot);
      this._robotConnected = (robot.isConnected) ? robot.isConnected : -1;
    });
  }

  navPage(page, params?: any) {
    this.navCtrl.push( page, params );
  }

  login(value) {
     this.navPage( value, { robot: 0 } );
  }

  call(func, params) {
    if (func != '' && func != undefined) {
        this[func](params);
    }
  }

  showMsg(msg, type?: string) {
    let toast = this.toastCtrl.create(
      {
        message: msg,
        duration: 5000,
        position: 'bottom',
        cssClass: type
      }
    );

    toast.present();
  }

  ionViewCanLeave(): boolean {
    return true;
  }

  @Input()
  set title ( title: string ) {
    this._title = title;
  }
  get title () {
    return this._title;
  }

  @Input()
  set robot ( robot: any ) {
    this._robotConnected = robot;
  }
  get robot () {
    return this._robotConnected;
  }
}
