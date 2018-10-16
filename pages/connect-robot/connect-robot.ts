import { Component } from '@angular/core';
import { 
  IonicPage,
  Events,
  NavController, 
  NavParams, 
  ToastController,
  AlertController 
} from 'ionic-angular';
import { AppState, Robots } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-connect-robot',
  templateUrl: 'connect-robot.html',
  providers: [AppState, Robots]
})
export class ConnectRobotPage {

	title: string = 'Connect to robot'
	robotSelected: any;
  preSelect: number = 0;
	robots = [
		{
      name: 'duAro',
      icon: 'abb-duarov2',
      type: 'two-arm',
      available: false
    },
    {
			name: 'YuMi 1',
			icon: 'abb-yumi',
			type: 'one-arm',
      available: true
		}
	]    

	constructor(
		public navCtrl: NavController, 
		public navParams: NavParams,
		public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    private events: Events,
    private appState: AppState,
	  public robotsSvc: Robots
  ) {
    this.appState.getRobot().then( val => {
      
      this.robotSelected = val != null && (val.isConnected) ? val.isConnected : -1;
    } );
  }

	selectRobot( key, available?:boolean ) {

    if ( available || available == undefined ) {

		  if ( key != this.robotSelected ) {

        this.preSelect = key;

        //Set Config
        this.openAlert(
          {
            title: 'Connect to Robot',
            msg: '',
            inputs: [
              {
                name: 'IP',
                placeholder: 'Robot Ip',
                value: this.appState.IP.value
              },
              {
                name: 'USERNAME',
                placeholder: 'Username',
                value: this.appState.USERNAME.value
              },
              {
                name: 'PASSWORD',
                placeholder: 'Password',
                type: 'password',
                value: this.appState.PASSWORD.value
              },
              {
                name: 'R_MODULES_PATH',
                placeholder: 'Robot Modules Path',
                value: this.appState.R_MODULES_PATH.value
              }
            ]
          },
          this.updateSettings
        );
      } else {

        //Disconnect Robot
        this.openAlert(
          {
            title: 'Warning',
            msg: 'Are you sure to disconnect this robot?',
          },
          this.disconnectRobot
        );
      }

    } else {

      this.showMsg( 'This function is locked for the demo', 'error' );
    }
	}

  showMsg (msg, type?: string) {

    let alert = this.alertCtrl.create(
      {
        title: '',
        message: msg,
        cssClass: 'general-popup',
        buttons: [
          {
            text: '',
            cssClass: 'close-btn',
            role: 'cancel',
            handler : (data) => {
              console.log("close");
            }
          }
        ]
      }
    );

    alert.present();
  }

  openAlert(params, success ) {

    let settings = {
      title: params.title,
      message: params.msg,
      inputs: params.inputs,
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Yes',
          handler: (data) => {
            success(data, this);
          }    
        }
      ]
    }

    let alert = this.alertCtrl.create( settings );

    alert.present();
  }

  updateSettings (data, context) {

    let invalid = 0;

    for ( let key in data ) {

      if ( key == 'IP' ) {

        ( context.validateIP( data[key] ) && !context.isEmpty( data[key] ) ) ? context.appState.set( key.toUpperCase(), data[key] ) : invalid++;

      } else {

        ( !context.isEmpty( data[key] ) ) ? context.appState.set( key.toUpperCase(), data[key] ) : invalid++;
      }
    }

    if ( invalid > 0 ) {

      context.disconnectRobot( data, context, { msg: 'There are fields with errors', type: 'error'} );

    } else {

      //context.showMsg( 'The data has been updated successfully', 'info' );
      context.connectRobot();
    }
  }

  connectRobot () {

    this.robotsSvc.login(
      ( data, t, xhr ) => {

        if ( xhr.status == 200 ) {

          this.robotSelected = this.preSelect;
          this.appState.setRobot( { isConnected: this.robotSelected } );
          this.events.publish('enabledRobot', this.appState.ROBOT_CONNECTED.value);
          this.showMsg( 'Robot Connected', 'info' );
          this.preSelect = 0;

        } else {

          this.disconnectRobot( data, this, { msg: 'Error Unknown when trying to connect with YuMi', type: 'error'} );
        }

      },
      ( err ) => {
        this.disconnectRobot( {}, this, { msg: 'Error Unknown when trying to connect with YuMi', type: 'error'} );
      } 
    );
  }

  disconnectRobot (data, context, msg?:any) {

    if ( !msg ) {
      msg = { msg:'Robot Disconnected', type: 'info' };
    }

    context.robotSelected = -1;
    context.appState.setRobot( { isConnected: false } );
    context.events.publish('enabledRobot', context.appState.ROBOT_CONNECTED.value);
    context.showMsg( msg.msg, msg.type );
    context.preSelect = 0;
  }

  validateIP (ipaddress) {

    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  

      return true;
    }  

    return false;
  }

  isEmpty (value) {

    return ( value == '' || value <= 0 ) ? true : false;
  }

}
