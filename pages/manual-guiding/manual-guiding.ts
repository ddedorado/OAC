import { Component } from '@angular/core';
import { 
  IonicPage,
  Events,
  NavController, 
  NavParams, 
  AlertController, 
  ToastController, 
  LoadingController 
} from 'ionic-angular';

import { AppState, Robots } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-manual-guiding',
  templateUrl: 'manual-guiding.html',
  providers: [AppState, Robots]
})
export class ManualGuidingPage {

  title: string = 'Manual Guiding';
  arms: string = "separated";
  programName: string = 'Test Program';
  counterCycles: number = 0;
  counterPointer: number = 0;
  selectTask: string = '';
  pointerProcess: string = 'init';
  alert: any;
  enablePlay: any = {
    left: false,
    right: false
  };
  enableExecution: boolean = false;
  loading: any = undefined;
  pointer: any = {
    InitializeHandler: 'init',
    GoToHome: 'home'
  };

  tasks: any = {
    T_ROB_L: {
      sys_module: '/Assets/L/YuMi_App_Common.sys',
      yumi_module:'/Assets/L/YuMi_App_L.sys',
      main_module: '/Assets/L/MainModule.mod',
      robot: 'ROB_L'
    },
    T_ROB_R: {
      sys_module: '/Assets/R/YuMi_App_Common.sys',
      yumi_module:'/Assets/R/YuMi_App_R.sys',
      main_module: '/Assets/R/MainModule.mod',
      robot: 'ROB_R'
    }
  };

  executions: any = {
    'ManualGuiding': 'MG',
    'InitHand': 'IH',
    'GoToHome': 'GH',
    'PlayOn': 'PB',
    'Flush': 'FL',
    'ResetMainModules': 'RMM'
  };

  currentExecution: any = undefined;
  formerExecution: any = undefined;

  MGCallbackStack: any = {
      task: undefined,
      index: 0,
      callbacks: [
        this.destroyProgramName,
        this.mastershipReq,
        this.disableLeftArm,
        this.disableRightArm,
        this.unloadProgMods,
        this.unloadSysModsIfNeeded,
        this.loadCommonSys,
        this.loadYumiAppSys,
        this.loadCommonMod,
        this.InitializeHand,
        this.GoToHome,
        this.enableLeadThrough
      ]
    };

  RMMCallbackStack: any = {
      task: undefined,
      index: 0,
      callbacks: [
        this.mastershipReq,
        this.disableLeftArm,
        this.disableRightArm,
        this.unloadProgMods,
        this.loadCommonMod,
        this.InitializeHand,
        this.GoToHome,
        this.enableLeadThrough
      ]
    };

  IHCallbackStack: any = {
      'task': undefined,
      'index': 0,
      'callbacks': [
        this.mastershipReq,
        this.enabledMotors,
        this.disableLeftArm,
        this.disableRightArm,
        this.setPointerInitHand,
        this.playOnce,
        this.checkExecution,
        this.resetPP
      ]
    };

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
        this.resetPP
      ]
    };

  playCallbackStack: any = {
      index: 0,
      callbacks: [
        this.activateTask,
        this.resetPP,
        this.playOnce
      ]
    };

  flushCallbackStack: any = {
      index: 0,
      callbacks: [
        this.disableLeftArm,
        this.disableRightArm,
        this.flushMastership
      ]
    };

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    public appState: AppState,
    private events: Events,
    public robots: Robots
  ) {
    this.events.subscribe('enablePlayBoth', (endPos, type) => {
      console.log("EVENTO enablePlayBoth:", endPos, type);

      if ( type != 'both' ) {
        console.log("EVENTO enablePlayBoth:", this.enablePlay[type], this.enablePlay);
        this.enablePlay[type] = endPos;
      }
    });

    this.events.subscribe('executionActive', (isActive, type) => {
      console.log("executionActive:" );
      this.enableExecution = isActive;

      let oppositeType = (type == 'left') ? 'right': 'left';
      this.events.publish('disablePlay', isActive, oppositeType);
    });
  }

  ionViewDidEnter() {
    this.openAlert();
  }

  openAlert() {

    let alert = this.alertCtrl.create(
      {
        title: '',
        message: `<span>Is this screen you can manually move the robot arms around and create a simple robot movement program.</span>
        <h2>Tap Screen to continue</h2>
        <span>(ongoing robot program will stop)</span>
        <ion-spinner name="bubbles"></ion-spinner>`,
        cssClass: 'mn-popup',
        buttons: [
          {
            text: '',
            role: 'cancel',
            cssClass: 'hidden',
            handler: data => {
              if ( !this.loading ) {
                this.openLoading();
                console.log("EVENT CLICK BEFORE MODAL");
                this.ManualGuidingOn();
              }

              return false;
            }
          }
        ]
      }
    );

    alert.present();
    this.alert = alert;
  }

  openLoading () {
    this.loading = this.loadingCtrl.create( {
      content: ''
    } );
    this.loading.present();
  }

  ManualGuidingOn() {
    console.log('ManualGuidingOn');
    this.currentExecution = this.executions.ManualGuiding;
    this.NextMGCallback(this);  
  }

  InitializeHand(context) {
    console.log('InitializeHand()');
    context.formerExecution = context.currentExecution;
    context.currentExecution = context.executions.InitHand;
    context.NextIHCallback( context );
  }

  GoToHome(context) {
    console.log('GoToHome()');
    context.formerExecution = context.currentExecution;
    context.currentExecution = context.executions.GoToHome;
    context.NextGHCallback(context);
  }

  playOn() {
    console.log('playOn()');
    this.currentExecution = this.executions.PlayOn;
    this.nextPlayCallback( this );  
  }

  flushOn () {
    console.log('Flush ON()');
    this.currentExecution = this.executions.Flush;
    this.nextFlushCallback( this );  
  }

  resetMainModulesOn() {
    console.log('resetMainModulesOn() - INIT');
    this.formerExecution = this.currentExecution;
    this.currentExecution = this.executions.ResetMainModules;
    this.NextRMMCallback(this);
  }

  nextPlayCallback(context) {
    console.log('nextCallback() - INIT');
    if( context.currentExecution != undefined ) {
      if (context.playCallbackStack.callbacks.length == context.playCallbackStack.index) {
        context.playCallbackStack.index = 0;
        context.currentExecution = undefined;
        console.log('Play Both!!!!!!!');

      } else {
        context.playCallbackStack.callbacks[context.playCallbackStack.index++](context);
      } 
    }
  }

  nextFlushCallback(context) {
    console.log('nextFlushCallback() - INIT');
    if (context.currentExecution != undefined) 
    {
      if (context.flushCallbackStack.callbacks.length == context.flushCallbackStack.index) 
      {
        context.flushCallbackStack.index = 0;
        context.currentExecution = undefined;
        console.log('CLEAN');
        console.log(context.alert);
        if (context.alert != undefined) 
        {
          context.alert.dismiss();
        }

        if (context.loading != undefined) 
        {
          context.loading.dismiss();
        }

        context.loading = undefined;
        context.alert = undefined;
      } 
      else 
      {
        context.flushCallbackStack.callbacks[context.flushCallbackStack.index++](context);
      } 
    }
  }

  NextMGCallback(context) {
    console.log('NextMGCallback()');
    if (context.MGCallbackStack.callbacks.length == context.MGCallbackStack.index) 
    {
      context.currentExecution = context.executions.ManualGuiding;
      // To-do: close loading and popUp
      console.log('Super Success!!!!!!!');
      context.loading.dismiss();
      context.alert.dismiss();
      
      context.loading = undefined;
      context.alert = undefined;
    } 
    else 
    {
      context.MGCallbackStack.callbacks[context.MGCallbackStack.index++](context);
    }
  }

  NextIHCallback(context) {
    console.log('NextIHCallback() - INIT');
    if (context.IHCallbackStack.callbacks.length == context.IHCallbackStack.index) 
    {
      context.currentExecution = context.formerExecution;
      context.formerExecution = undefined;
      context.NextCallback(context);
    } 
    else 
    {
      context.IHCallbackStack.callbacks[context.IHCallbackStack.index++](context);
    }
  }

  NextGHCallback(context) {
    console.log('NextGHCallback() - INIT');
    if (context.GHCallbackStack.callbacks.length == context.GHCallbackStack.index) 
    {
      context.currentExecution = context.formerExecution;
      context.formerExecution = undefined;
      context.NextCallback(context);
    } 
    else 
    {
      context.GHCallbackStack.callbacks[context.GHCallbackStack.index++](context);
    }
  }

  NextRMMCallback(context) {
    console.log('NextRMMCallback() - INIT');
    if (context.RMMCallbackStack.callbacks.length == context.RMMCallbackStack.index) 
    {
      context.RMMCallbackStack.index = 0;

      context.currentExecution = context.formerExecution;
      context.formerExecution = undefined;
      
      context.loading.dismiss();
      context.loading = undefined;
    } 
    else 
    {
      context.RMMCallbackStack.callbacks[context.RMMCallbackStack.index++](context);
    }
  }

  NextCallback(context) {
    console.log('NextCallback()');
    if (context.currentExecution != undefined) 
    {
      if (context.currentExecution == context.executions.ManualGuiding) 
      {
        context.NextMGCallback(context);
      }
      else if(context.currentExecution == context.executions.InitHand) 
      {
        context.NextIHCallback(context);
      }
      else if (context.currentExecution == context.executions.GoToHome) 
      {
        context.NextGHCallback(context);
      }
      else if (context.currentExecution == context.executions.PlayOn) 
      {
        context.nextPlayCallback(context);
      }
      else if (context.currentExecution == context.executions.Flush) 
      {
        context.nextFlushCallback(context);
      }
      else if (context.currentExecution == context.executions.ResetMainModules) 
      {
        context.NextRMMCallback(context);
      }
    }
  }

  destroyProgramName (context) {
    console.log("destroyProgramName(): ", context.appState.destroyProgram);
    context.appState.destroyProgram().then( (val) => {
      console.log("destroyProgramName() is OK", val);
      context.NextCallback(context);
    } );
  }

  setPointerInitHand(context, task = 'T_ROB_L') {
    console.log(`setPointerInitHand(task = ${task}) - INIT`);
    context.robots.initHandler( 
      task,
      context.pointer.InitializeHandler,
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log(`setPointerInitHand(task = ${task}) - 204`, data);
          task == 'T_ROB_L' ? context.setPointerInitHand(context, 'T_ROB_R') : context.NextCallback(context);
        } else {
          console.log(`setPointerInitHand(task = ${task}) - Not 204 Status - ` + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with set pointer in robot', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      },
      (err) => {
        console.log("setPointer - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
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
          task == 'T_ROB_L' ? context.setPointerGoToHome(context, 'T_ROB_R') : context.NextCallback(context);
        } else {
          console.log(`setPointerInitHand(task = ${task}) - Not 204 Status - ` + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with set pointer in robot', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      },
      (err) => {
        console.log("setPointer - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  mastershipReq ( context ) {
    console.log("MASTERSHIP REQUEST");
    context.robots.mastershipRequest(
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {

          console.log("MASTERSHIP REQUEST: 204 -> NEXT FUNC");
          context.NextCallback(context);
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
          this.flushOn();
        }
      },
      (err) => {
        console.log("MASTERSHIP REQUEST: ERROR", err.statusText);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.flushOn();
      }
    );
  }

  disableLeftArm (context) {

    context.robots.disableLeadThroughArm(
      'ROB_L',
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) 
        {
          console.log("- DisableLeftArm: 204 -> NEXT FUNC");
          context.NextCallback(context);
        } 
        else 
        {
          console.log("- DisableLeftArm ERROR: " + xhr.status + " -> " + textStatus);
          //context.showMsg( xhr.status + ':' + textStatus, 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }, 
      (err) => {
        console.log("- DisableLeftArm : ERROR", err.statusText);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
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
          context.NextCallback(context);

        } else {

          console.log("- DisableRightArm ERROR: " + xhr.status + " -> " + textStatus);
          //context.showMsg( xhr.status + ':' + textStatus, 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }, 
      (err) => {
        console.log("- DisableRightArm : ERROR", err.statusText);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  unloadProgMods (context, task:string = 'T_ROB_L') {
    console.log("UNLOAD PROGMODS");
    context.getProgModulesByTask(task);
  }

  unloadSysModsIfNeeded (context, task:string = 'T_ROB_L') {
    console.log("UNLOAD SYSMODS IF NEEDED");
    context.getSysModulesByTask(task);
  }

  getProgModulesByTask(task) {
    console.log("GET PROG MODULES BY TASK: ", task);

    let modules = [];

    this.robots.getModulesListFromTask(
      task, 
      (data, t, xhr) => {
        if (xhr.status == 200) 
        {
          console.log('- getProgModulesByTask - 200: ', data );
          data._embedded._state.forEach( module => {

            if (module.type == 'ProgMod') 
            {
              modules.push(module.name);
              console.log('- getProgModulesByTask - 200 - ProgMod found: ' + module.name);
            }
          });

          if (modules.length > 0) 
          {
            console.log( '- getProgModulesByTask - 200 - Unload Modules' );
            this.unloadModuleByTask(task, modules, false);
          } 
          else 
          {
             if (task == 'T_ROB_L') 
             {
              console.log('- getModulesByTask - 200 - Next Task: T_ROB_R');
              this.unloadProgMods( this, 'T_ROB_R' );
             } 
             else 
             {
              console.log('- getProgModulesByTask - 200 - NEXT FUNC');
              this.NextCallback( this );
             }
          }
        } 
        else 
        {
          console.log('- getProgModulesByTask - Success - NOT 200 STATUS: ', data);
          //this.showMsg( 'Unexpected HTTP status code in response: ' + xhr.status, 'error' );
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          this.flushOn();
        }
      },
      (err) => {
        //this.showMsg( err.statusText, 'error' );
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.flushOn();
      } 
    );
  }

  getSysModulesByTask (task) {
    console.log("GET SYS MODULES BY TASK: ", task);

    let modules = [];

    this.robots.getModulesListFromTask(
      task, 
      (data, t, xhr) => {

        if ( xhr.status == 200 ) {
          console.log('getSysModulesByTask - 200: ', data );
            
          data._embedded._state.forEach( module => {

            if ( module.type == 'SysMod' && module.name.startsWith('YuMi_App') ) {
              modules.push(module.name);
              console.log('getSysModulesByTask - 200 - SysMod found: ' + module.name);
            }
          } );

          if ( modules.length > 0 ) {

            this.unloadModuleByTask(task, modules, true);

          } else {

             if ( task == 'T_ROB_L' ) {

              this.unloadSysModsIfNeeded( this, 'T_ROB_R' );

             } else {

              this.NextCallback( this );
             }
          }

        } else {
          console.log('getModulesByTask - Success - NOT 200 STATUS: ', data);
          //this.showMsg( 'Unexpected HTTP status code in response: ' + xhr.status, 'error' );
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          this.flushOn();
        }
          
        },
      (err) => {
        //this.showMsg( err.statusText, 'error' );
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.flushOn();
      } 
    );
  }

  unloadModuleByTask (task, modules, isSys, index = 0) {
    console.log("UNLOAD MODULE BY TASK: ", task, modules);

    this.robots.unloadModule( 
      task, 
      modules[index], 
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log("unloadModuleByTask - 204: ", task, modules[index]);
          
          index++;
          
          if ( index == modules.length ) {
             
             if ( task == 'T_ROB_L' ) {

               if(isSys) {
                 this.unloadSysModsIfNeeded(this, 'T_ROB_R');
               } else {
                  this.unloadProgMods( this, 'T_ROB_R' );
               }

             } else {

              this.NextCallback(this);
             }

          } else {

            this.unloadModuleByTask(task, modules, isSys, index);
          }

        } else {
          console.log("unloadModuleByTask - " + xhr.status + ": ", data);
          //this.showMsg( 'There are problems unloading the module', 'error' );
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          this.flushOn();
        }
      }, 
      (err)=>{
        console.error( 'ERROR', err );
        //this.showMsg( err.statusText, 'error' );
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.flushOn();
      } 
    );
  }

  loadCommonSys ( context, task = 'T_ROB_L' ) {

    console.log("LOAD COMMON SYS: ", task);
    let modulePath = context.appState.R_MODULES_PATH.value + context.tasks[ task ].sys_module;

    context.robots.loadModule(
      task, 
      modulePath, 
      ( data, t, xhr ) => {

        if ( xhr.status == 204 ) {

          if(task == 'T_ROB_L') {
            console.log("- loadCommonSys - 204: NEXT TO T_ROB_R");
            context.loadCommonSys(context, 'T_ROB_R' );

          } else {

            console.log("- loadCommonSys - 204: NEXT FUNC");
            context.NextCallback( context );
          }
        } else {
          console.log("- loadCommonSys - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with load Common programs', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }, 
      ( err ) => {
        console.log("- loadCommonSys - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  loadYumiAppSys ( context, task = 'T_ROB_L' ) {

    console.log("LOAD YUMI APP SYS: ", task);
    let modulePath = context.appState.R_MODULES_PATH.value + context.tasks[ task ].yumi_module;

    context.robots.loadModule(
      task, 
      modulePath, 
      ( data, t, xhr ) => {

        if ( xhr.status == 204 ) {

          if(task == 'T_ROB_L') {
            console.log("- loadYumiAppSys - 204: NEXT TO T_ROB_R");
            context.loadYumiAppSys( context, 'T_ROB_R' );

          } else {

            console.log("- loadYumiAppSys - 204: NEXT FUNC");
            context.NextCallback( context );
          }

        } else {
          console.log("- loadYumiAppSys - success - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with load Yumi', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }, 
      ( err ) => {
        console.log("loadYumiByTask - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  loadCommonMod ( context, task = 'T_ROB_L' ) {
    console.log("LOAD COMMON MOD: ", task);

    let modulePath = context.appState.R_MODULES_PATH.value + context.tasks[ task ].main_module;

    context.robots.loadModule(
      task, 
      modulePath, 
      ( data, t, xhr ) => {

        if ( xhr.status == 204 ) 
        {
          if (task == 'T_ROB_L') 
          {
            console.log("- loadCommonMod - 204: NEXT TO T_ROB_R");
            context.loadCommonMod( context, 'T_ROB_R' );
          } 
          else 
          {
            console.log("- loadCommonMod - 204: NEXT FUNC");
            context.NextCallback( context );
          }
        } 
        else 
        {
          console.log("- loadCommonMod - success - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with load Yumi', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }, 
      ( err ) => {
        console.log("- loadCommonMod - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  enabledMotors (context) {
    context.robots.enableMotors( 
      'motoron',
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log("enabledMotors - success - 204: ", data);
          context.NextCallback(context);
        } else {
          console.log("enabledMotors - success - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with enable motors', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      },
      (err) => {
        console.log("enabledMotors - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    );
  }

  playOnce (context) {
    console.log('playOnce() - INIT');
    context.robots.playOnce(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
          console.log("playOnce() - success - 204: ", data);
            context.NextCallback(context);
        } else {
          console.log("playOnce() - success - Not 204 Status - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with play once', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
    }, err => {
      console.log("playOnce - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushOn();
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

            context.NextCallback(context);

          } else if ( context.counterCycles >= 60 ) {
            console.log("checkExecution - Unknown Error in Execution. More time checks executions", data);
            //context.showMsg( 'Unknown Error in Execution', 'error' );
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
            context.flushOn();

          } else {

            context.counterCycles++;
            setTimeout( () => { context.checkExecution(context); }, 1000 );
          }

        } else {
            console.log("checkExecution - success - " + xhr.status + " STATUS: ", data);
            //context.showMsg( 'There are problems with check execution', 'error' );
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
            context.flushOn();
        }

    }, err => {
      console.log("checkExecution - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushOn();
    } );

  }
  
  resetPP(context) {
    console.log('resetPP() - INIT');
    context.robots.resetProgramPP(
      (data, textStatus, xhr) => {

      if ( xhr.status == 204 ) {

        context.NextCallback(context);

      } else {

        console.log("resetPP() - success - " + xhr.status + " STATUS: ", data);
        //context.showMsg( 'There are problems with reset pointer in robot', 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    }, err => {
      console.log("resetPP() - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushOn();
    } );

  }

  enableLeadThrough (context, mechunit = 'ROB_L') {
    console.log(`enableLeadThrough (context, ${mechunit})`);
    context.robots.enableLeadThrough(
      mechunit,
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
            console.log("enableLeadThrough - success - " + xhr.status + " STATUS: ", data);
            if (mechunit == 'ROB_L') {
              context.enableLeadThrough(context, 'ROB_R');
            } else {
              context.NextCallback(context)
            }
        } else {
            console.log("enableLeadThrough - success - " + xhr.status + " STATUS: ", data);
            //context.showMsg( 'There are problems with lead through', 'error' );
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
            context.flushOn();
        }

    }, err => {
      console.log("enableLeadThrough - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      context.flushOn();
    } );
  }

  activateTask (context, task:string = 'T_ROB_L') {
    context.robots.activateTask(
      task,
      (data, textStatus, xhr) => {
        if(xhr.status == 204) {
          console.log("activateTask - success - " + xhr.status + " STATUS: ", data);
          if(task == 'T_ROB_L') {
            console.log("activateTask - success - GO TO ActivateTask");
            context.activateTask(context, 'T_ROB_R');
          } else {
            context.nextPlayCallback(context);
          }
        } else {
          console.log("activateTask - " + xhr.status + " STATUS: ", data);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      },
      (err) => {
        console.log("activateTask - error: ", err);
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        context.flushOn();
      }
    )
  }

  playBoth () {
    this.playOn();
  }

  call ( func, params?:any ) {

    this[func](params);
  }

  showMsg (msg, type?: string) {

    let toast = this.toastCtrl.create(
      {
        message: msg,
        duration: 3000,
        position: 'bottom',
        cssClass: type
      }
    );

    toast.present();
  }

  flushMastership (context) {
    context.robots.mastershipRelease(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {
          console.log("Mastership Released");
          context.NextCallback(context);  
        } else {
          console.log("Error: " + xhr.status );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      },
      (err) => {

        console.log( err );
        if ( err.status == 403 ) {
          context.NextCallback(context);  
        } else {
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          context.flushOn();
        }
      }
    );
  }

  segmentChanged(event) {
    console.log("segmentChanged() - INIT");
    this.enablePlay.left = false;
    this.enablePlay.right = false;
    this.events.publish('resetDelete');
    this.openLoading();
    this.resetMainModulesOn();
  }

  ionViewDidLeave() {
    console.log('ionViewDidLeave() - INIT');
    this.flushOn();
  }

  ionViewCanLeave(): boolean {
    if (this.loading) {
      let alert = this.alertCtrl.create({
          title: 'You can\'t leave',
          subTitle: 'You stay and work.',
          buttons: ['Oh sorry']
      });
      alert.present();

      return false;

    } else {

      return true;
    }

  }
}
