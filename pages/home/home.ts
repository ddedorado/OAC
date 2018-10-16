import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { AppState, Robots, Clock } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [AppState, Robots, Clock]
})
export class HomePage {

	title: string = 'Home';
  timer: any;
  robotConnected: boolean;
  status: any = {
    start: {
      icon: 'play',
      text: 'Play',
      color: 'green',
      func: 'start'
    },
    process: {
      active: -1,
      name: 'Not Started',
      program: 'Please, load program',
      color: 'blue',
      icon: 'abb-yumi',
      message: ''
    },
    pauses: 0,
    time: {
      seconds: '00',
      minutes: '00',
      hours: '00',
    }
  };

  pointer: any = {
    GoToHome: 'home'
  };

  counterCycles: number = 0;
  enableExecution: boolean = false;
  executions: any = {
    'GoToHome': 'GH',
  };
  currentExecution: any = undefined;
  GHCallbackStack: any = {
    'task': undefined,
    'index': 0,
    'callbacks': [
      this.mastershipReq,
      this.enabledMotors,
      this.disableLeftArm,
      this.disableRightArm,
      this.setPointerGoToHome,
      this.playOnce,
      this.checkExecution,
      this.resetPP,
      this.flushMastership
    ]
  };

	constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public toastCtrl: ToastController,
    private appState: AppState,
    public robots: Robots,
    public clock: Clock
  ) {

    this.appState.getRobot().then( val => {
      this.robotConnected = (val.isConnected) ? true : false;
    });

    this.appState.getProgram().then( val => {
      this.status.process.program = (val) ? val : 'Please, load program';
    });
  }

  goToHome() {
    console.log('goToHome()');
    this.enableExecution = true;
    this.currentExecution = this.executions.GoToHome;
    this.nextGHCallback( this );
  }

  nextGHCallback(context) {
    console.log('NextGHCallback()');
    if (context.GHCallbackStack.callbacks.length == context.GHCallbackStack.index) {
      context.currentExecution = undefined;
      context.GHCallbackStack.index = 0;
      context.enableExecution = false;
    } else {
      context.GHCallbackStack.callbacks[context.GHCallbackStack.index++](context);
    }
  }

  start() {
    if (this.status.process.active == 0) 
    {
      this.play(this);
    } 
    else 
    {
      this.resetPPRoutine( this.play );
    }
  }

  play (context) {
    context.robots.start(
      ( data, t, xhr ) => {

        if( xhr.status == 204 ) {
          context.setState(
            {
              active: 1,
              name: 'Running',
              color: 'green',
              message: 'Production running'
            },
            {
              icon: 'pause',
              color: 'yellow',
              text: 'Pause',
              func: 'pause'
            },
            true
          )
        }
      },
      (err) => { context.showError( err ) }
    );
  }

  pause () {
    this.robots.pause(
      ( data, t, xhr ) => {

        if( xhr.status == 204 ) {
          this.setState(
            {
              active: 0,
              name: 'Paused',
              color: 'yellow',
              message: 'Production is paused, press Play to continue or Stop to end.'
            },
            {
              icon: 'play',
              color: 'green',
              text: 'Play',
              func: 'start'
            },
            false,
            true
          )
        }
      },
      (err) => { this.showError( err ) }
    );
  }

  resetPPRoutine( func ) {
    this.robots.resetPPRoutine ( 
      ( data, t, xhr ) => {
        if( xhr.status == 204 ) {
          func(this);
        }
      }, 
      (err) => { this.showError( err ) } 
    );
  }

  stop () {
    this.robots.stop( 
      ( data, t, xhr ) => {
        if( xhr.status == 204 ) {
          this.resetPPRoutine(
            () => {
              this.setState(
                {
                  active: -1,
                  name: 'Stopped',
                  color: 'red',
                  message: ''
                },
                {
                  icon: 'play',
                  color: 'green',
                  text: 'Play',
                  func: 'start'
                },
                false,
                false
              )
            }
          );
        }
      }, 
      (err) => { this.showError( err ) } 
    );
  }

  mastershipReq ( context ) {
    console.log("MASTERSHIP REQUEST");
    context.robots.mastershipRequest(
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {

          console.log("MASTERSHIP REQUEST: 204 -> NEXT FUNC");
          context.nextGHCallback(context);
        } else {
          console.log("MASTERSHIP REQUEST: " + xhr.status + " -> MASTERSHIP RELEASE");
          context.mastershipRel( context.mastershipReq );
        }
      },
      (err) => {
        console.log("MASTERSHIP REQUEST: ERROR" + err.statusText + " -> MASTERSHIP RELEASE");
        context.mastershipRel( context.mastershipReq );
      }
    );
  }

  mastershipRel (func) {
    console.log("MASTERSHIP RELEASE");
    this.robots.mastershipRelease(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
          console.log("MASTERSHIP RELEASE: 204 -> MASTERSHIP REQUEST");
          //this.showMsg( 'Mastership disabled', 'info' );
          func( this );

        } else {
          console.log("MASTERSHIP REQUEST ERROR: " + xhr.status + " -> " + textStatus);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          this.flushMastership(this);
          this.enableExecution = false;
        }
      },
      (err) => {
        console.log("MASTERSHIP REQUEST: ERROR", err.statusText);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.flushMastership(this);
        this.enableExecution = false;
      }
    );
  }

  enabledMotors (context) {
    context.robots.enableMotors( 
      'motoron',
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log("enabledMotors - success - 204: ", data);
          context.nextGHCallback(context);
        } else {
          console.log("enabledMotors - success - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with enable motors', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushMastership(context);
          context.enableExecution = false;
        }
      },
      (err) => {
        console.log("enabledMotors - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushMastership(context);
        context.enableExecution = false;
      }
    );
  }

  disableLeftArm (context) {

    context.robots.disableLeadThroughArm(
      'ROB_L',
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {

          console.log("- DisableLeftArm: 204 -> NEXT FUNC");
          context.nextGHCallback(context);

        } else {
          console.log("- DisableLeftArm ERROR: " + xhr.status + " -> " + textStatus);
          //context.showMsg( xhr.status + ':' + textStatus, 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushMastership(context);
          context.enableExecution = false;
        }
      }, 
      (err) => {
        console.log("- DisableLeftArm : ERROR", err.statusText);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushMastership(context);
        context.enableExecution = false;
      }
    );
  }

  disableRightArm (context) {
    console.log("DISABLE RIGHT ARM");
    context.robots.disableLeadThroughArm(
      'ROB_R',
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {

          console.log("- DisableRightArm: 204 -> NEXT FUNC");
          context.nextGHCallback(context);

        } else {

          console.log("- DisableRightArm ERROR: " + xhr.status + " -> " + textStatus);
          //context.showMsg( xhr.status + ':' + textStatus, 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushMastership(context);
          context.enableExecution = false;
        }
      }, 
      (err) => {
        console.log("- DisableRightArm : ERROR", err.statusText);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushMastership(context);
        context.enableExecution = false;
      }
    );
  }

  setPointerGoToHome(context, task = 'T_ROB_L') {
    console.log(`setPointerGoToHome(task = ${task}) - INIT`);
    context.robots.initHandler( 
      task,
      context.pointer.GoToHome,
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log(`setPointerInitHand(task = ${task}) - 204`, data);
          task == 'T_ROB_L' ? context.setPointerGoToHome(context, 'T_ROB_R') : context.nextGHCallback(context);
        } else {
          console.log(`setPointerInitHand(task = ${task}) - Not 204 Status - ` + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with set pointer in robot', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushMastership(context);
          context.enableExecution = false;
        }
      },
      (err) => {
        console.log("setPointer - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushMastership(context);
        context.enableExecution = false;
      }
    );
  }

  playOnce (context) {
    console.log('playOnce() - INIT');
    context.robots.playOnce(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
          console.log("playOnce() - success - 204: ", data);
            context.nextGHCallback(context);
        } else {
          console.log("playOnce() - success - Not 204 Status - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with play once', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushMastership(context);
          context.enableExecution = false;
        }
    }, err => {
      console.log("playOnce - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushMastership(context);
      context.enableExecution = false;
    } );

  }

  checkExecution (context) {    
    console.log('checkExecution() - INIT');
    context.robots.checkExecution(
      (data, textStatus, xhr) => {

        if ( xhr.status == 200 ) {
          console.log('checkExecution() - ', data)
          console.log('checkExecution() - ', data._embedded._state[0].ctrlexecstate)
          if ( data._embedded._state[0].ctrlexecstate == 'stopped' ) {

            context.nextGHCallback(context);

          } else if ( context.counterCycles >= 60 ) {
            console.log("checkExecution - Unknown Error in Execution. More time checks executions", data);
            //context.showMsg( 'Unknown Error in Execution', 'error' );
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
            context.flushMastership(context);
            context.enableExecution = false;

          } else {

            context.counterCycles++;
            setTimeout( () => { context.checkExecution(context); }, 1000 );
          }

        } else {
            console.log("checkExecution - success - " + xhr.status + " STATUS: ", data);
            //context.showMsg( 'There are problems with check execution', 'error' );
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
            context.flushMastership(context);
            context.enableExecution = false;
        }

    }, err => {
      console.log("checkExecution - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushMastership(context);
      context.enableExecution = false;
    } );

  }
  
  resetPP(context) {
    console.log('resetPP() - INIT');
    context.robots.resetProgramPP(
      (data, textStatus, xhr) => {

      if ( xhr.status == 204 ) {

        context.nextGHCallback(context);

      } else {

        console.log("resetPP() - success - " + xhr.status + " STATUS: ", data);
        //context.showMsg( 'There are problems with reset pointer in robot', 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushMastership(context);
        context.enableExecution = false;
      }
    }, err => {
      console.log("resetPP() - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushMastership(context);
      context.enableExecution = false;
    } );

  }

  flushMastership (context) {
    context.robots.mastershipRelease(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
          console.log("Mastership Released");
          
          if ( context.currentExecution != undefined ) context.nextGHCallback(context);

        } else {
          console.log("Error: " + xhr.status );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => {

        console.log( err );
        if ( err.status != 403 ) {
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      }
    );
  }

  call ( func, params?:any ) {
    this[func](params);
  }

  showMsg (msg, type?: string) {
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

  showError (err) {
    this.showMsg( err.statusText, 'error' );
  }

  setState (process:any, start:any, activeTimer: boolean, paused?: boolean ) {
    this.setProcess( process, start );
    this.setTimer( activeTimer, paused );
  }

  setProcess ( process, start ) {
    this.status.process.active  = process.active;
    this.status.process.name    = process.name;
    this.status.process.color   = process.color;
    this.status.process.message = process.message;

    this.status.start.icon  = start.icon;
    this.status.start.color = start.color;
    this.status.start.text  = start.text;
    this.status.start.func  = start.func;
  }

  setTimer ( timer: boolean, paused?: boolean ) {
    if ( timer ) 
    {
      this.timer = this.clock.getClock().subscribe( 
        time => {
          this.status.time = time;
        } 
      );
    } 
    else 
    {
      if (paused) 
      {
        this.status.pauses++;
      } 
      else 
      {
        this.status.pauses = 0;
        this.status.time   = this.clock.resetClock();
      }

      this.timer.unsubscribe();
    }
  }
}
