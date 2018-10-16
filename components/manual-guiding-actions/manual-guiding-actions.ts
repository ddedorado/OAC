import { Component, Input } from '@angular/core';
import { Events, AlertController, ToastController, LoadingController } from 'ionic-angular';
import { AppState, Robots } from '../../providers/providers';

@Component({
  selector: 'manual-guiding-actions',
  templateUrl: 'manual-guiding-actions.html',
  providers: [AppState, Robots]
})
export class ManualGuidingActionsComponent {
  _appState: AppState;
  _type: string = 'both';
  _oppositeArm: string = '';
  _program: string = '';
  _limitActions: number = 12;
  _indexPositions: number = 0;
  _indexActions: number = 0;
  _actions: any = [];
  _bothArmsPositions: any = {
    left: {
      initPosition : undefined,
      endPosition: undefined,
      actions: []
    },
    right: {
      initPosition : undefined,
      endPosition: undefined,
      actions: []
    }
  };
  _initPosition : any;
  _endPosition: any;
  _startColor: string = 'grey-lighter';
  _endColor: string = 'grey-lighter';
  _selectedAction: any = -1;
  _counterCycles: number = 0;
  _executionActive: boolean = false;
  _endPositionEventTriggered: boolean = false;
  loading: any = undefined;
  _positions: any = {
    left: {
      title: 'Move Right Arm',
      taskName: 'T_ROB_L'
    },
    right: {
      title: 'Move Left Arm',
      taskName: 'T_ROB_R'
    },
    both: {
      title: 'Move Both Arm'
    }
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

  pointer: any = {
    InitializeHandler: 'init',
    GoToHome: 'home'
  };

  _executions: any = {
    'PlayOnce': 'play',
    'BothArms': 'both',
    'InitHand': 'IH',
    'GoToHome': 'GH',
    'ResetMainModules': 'RMM'
  };

  _currentExecution: any = undefined;
  formerExecution: any = undefined;

  _playCallbackStack: any = {
      index: 0,
      callbacks: [
        this.disableTask,
        this.enableTask,
        this.resetPP,
        this.playOnce,
        this.checkExecution
      ]
    };

  _bothArmsPositionCallbackStack: any = {
      index: 0,
      positionIndex: 0,
      isInitPosition: undefined,
      write: false,
      callbacks: [
        this.getLeftArmSyncMoveInstructions,
        this.getRightArmSyncMoveInstructions,
        this.writeProgramBothArms,
      ]
    };

  RMMCallbackStack: any = {
      task: undefined,
      index: 0,
      callbacks: [
        this.mastershipReq,
        this.unloadProgMods,
        this.loadCommonMod,
        this.setEndPositionFromProcess
      ]
    };

  constructor(
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public robots: Robots,
    private events: Events,
    public loadingCtrl: LoadingController,
    public appState: AppState
  ) {
    
    this.initPositions();

    this.events.subscribe('deleteAction', (actions) => 
    {
      console.log("deleteAction in " + this._type + ":", actions);
      let actionToDelete = actions.filter( el => {
          return el.type == this._type;
        }
      );
      console.log("deleteAction in " + this._type + ": actionToDelete: ", actionToDelete);
      if ( actionToDelete.length > 0 ) 
      {

        let isBoth = this._type == 'both' ? true : false;

        if ( actionToDelete[0].index == 'start' ) {

          this.resetInitPos( isBoth );

        } else if ( actionToDelete[0].index == 'end' ) {
          this.events.publish('enablePlayBoth', false, this._type);
          this.resetEndPos(isBoth);

        } else {

          this.moveActions(actionToDelete[0].index, this._indexActions - 1);
          this.resetAction(this._indexActions - 1);
          this.resetPositions();
        }
      }
    });

    this.events.subscribe('disablePlay', (isActive, type) => 
    {
      if (type == this._type) 
      {
         this._executionActive = isActive;
         this._oppositeArm = type;
      }
    });

    this.events.subscribe('setEndPos', (endPos) => 
    {
      console.log("manual-guiding-actions - Event - setEndPos:", endPos);
      this._endPositionEventTriggered = endPos;
    });
  }
  
  resetInitPos (isBoth) {
    if ( isBoth ) {

      this._bothArmsPositions.left.initPosition = undefined;
      this._bothArmsPositions.right.initPosition = undefined;
      this._initPosition = 'both';

    } else {

      this._initPosition = undefined;
    }

    this._selectedAction = -1;
    this._startColor = 'grey-lighter';
    this.events.publish('enableDelete', this._selectedAction, this._type);
  }

  resetEndPos (isBoth) {
    if ( isBoth ) {

      this._bothArmsPositions.left.endPosition = undefined;
      this._bothArmsPositions.right.endPosition = undefined;
      this._endPosition = 'both';
    } else {

      this._endPosition = undefined;
    }

    this._selectedAction = -1;
    this._endColor = 'grey-lighter';
    this.events.publish('enableDelete', this._selectedAction, this._type);
  }

  playOn() {
    console.log('playOn() - INIT');
    this._currentExecution = this._executions.PlayOnce;
    this.NextCallback(this);  
  }

  setPositionBothArmsOn(index, isFirstPosition, write = false) {
    console.log('setPositionBothArmsOn() - INIT');
    this.formerExecution = this._currentExecution;
    this._currentExecution = this._executions.BothArms;
    this._bothArmsPositionCallbackStack.positionIndex = index;
    this._bothArmsPositionCallbackStack.isInitPosition = isFirstPosition;
    this._bothArmsPositionCallbackStack.write = write;

    this.NextCallback(this);
  }

  resetMainModulesOn() {
    console.log('resetMainModulesOn() - INIT');
    this.formerExecution = undefined;
    this._currentExecution = this._executions.ResetMainModules;
    this.NextRMMCallback(this);
  }

  nextBothArmsCallback(context) {
    console.log('nextBothArmsCallback() - INIT');

    if (context._bothArmsPositionCallbackStack.callbacks.length == context._bothArmsPositionCallbackStack.index) 
    {
      let hasNext = false;
      if (context.formerExecution != undefined)
      {
        hasNext = true;
        context._currentExecution = context.formerExecution;
        context.formerExecution = undefined;
      }
      else
      {
        context._currentExecution = undefined;
      }

      context._bothArmsPositionCallbackStack.index = 0;
      context._bothArmsPositionCallbackStack.positionIndex = 0;
      context._bothArmsPositionCallbackStack.isInitPosition = undefined;
      context._bothArmsPositionCallbackStack.write = false;
      // To-do: close loading and popUp
      console.log('context._bothArmsPositions: ', context._bothArmsPositions);
      console.log('context._actions: ', context._actions);
      console.log('BothArmsPositions Saved!!!!!!!!!!');

      if (hasNext) context.NextCallback(context);
    }
    else 
    {
      context._bothArmsPositionCallbackStack.callbacks[context._bothArmsPositionCallbackStack.index++](context);
    }
  }

  nextPlayCallback(context) {
    console.log('nextPlayCallback() - INIT', context._currentExecution, context._playCallbackStack);

    if (context._playCallbackStack.callbacks.length == context._playCallbackStack.index) 
    {
      context._currentExecution = undefined;
      context._playCallbackStack.index = 0;
      // To-do: close loading and popUp
      console.log('Super Play!!!!!!!');
    } 
    else 
    {
      context._playCallbackStack.callbacks[context._playCallbackStack.index++](context);
    }
  }

  NextRMMCallback(context) {
    console.log('NextRMMCallback() - INIT');
    if (context.RMMCallbackStack.callbacks.length == context.RMMCallbackStack.index) 
    {
      console.log('NextRMMCallback() - End of Callbacks');
      context.RMMCallbackStack.index = 0;

      context._currentExecution = context.formerExecution;
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
    console.log('NextCallback() - INIT');
    if (context._currentExecution != undefined) 
    {
      if (context._currentExecution == context._executions.ResetMainModules) 
      {
        console.log('nextCallback() - context._executions.ResetMainModules');
        context.NextRMMCallback(context);
      }
      else if (context._currentExecution == context._executions.PlayOnce) 
      {
        console.log('nextCallback() - context._executions.PlayOnce');
        this.nextPlayCallback(context);
      }
      else if(context._currentExecution == context._executions.BothArms) 
      {
        console.log('nextCallback() - context._executions.BothArms');
        context.nextBothArmsCallback(context);
      }
    }
  }

  resetAction(index) {
    console.log("resetAction() - INIT ", index, this._actions[index]);
    this._actions[index].icon = '';
    this._actions[index].state = 'grey-lighter';
    this._actions[index].type = '';
    this._actions[index].instruction = '';
    this._actions[index].position = '';
    
    this._selectedAction = -1;
    this.events.publish('enableDelete', this._selectedAction, this._type);

    this._indexActions--;
  }

  resetPositions() {
    console.log("resetPositions() - INIT");
    this._indexPositions = 0;

    for (let i = 0; i < this._limitActions; i++) 
    {
      console.log("resetPositions() ACTIONS:", this._actions[i]);
      if ( this._actions[i].type == 'position' ) 
      {
        this._indexPositions++;
        console.log("resetPositions()", this._indexPositions);
        this._actions[i].position = this._indexPositions;
      }
    }
  }

  moveActions(old_index, new_index) {
    console.log(`moveActions(old_index[${old_index}], new_index[${new_index}]) - INIT`);
    this._actions.splice(new_index, 0, this._actions.splice(old_index, 1)[0]);
    console.log("moveActions(): ", this._actions);
    if (this._type == 'both')
    {
      this._bothArmsPositions.left.actions.splice(new_index, 0, this._bothArmsPositions.left.actions.splice(old_index, 1)[0]);
      this._bothArmsPositions.right.actions.splice(new_index, 0, this._bothArmsPositions.right.actions.splice(old_index, 1)[0]);
    }
  };

  initPositions() {
    console.log("MGA - initPositions");

    for ( var i = 0; i < this._limitActions; i++ ) 
    {
      this._actions.push({ 
        icon: '',
        type: '',
        state: 'grey-lighter' 
      });
      this._bothArmsPositions.left.actions.push({ 
        icon: '',
        type: '',
        state: 'grey-lighter' 
      });
      this._bothArmsPositions.right.actions.push({ 
        icon: '',
        type: '',
        state: 'grey-lighter' 
      });
    }
  }

  addAction(type, index) 
  {
    console.log(`MGA - addAction(type[${type}], index[${index}]) - INIT`);

    let icon = '';

    switch ( type ) 
    {
      case 'position':
        this._indexPositions++;
        icon = 'abb-position';
        this._actions[index].position = this._indexPositions;
        if (this._type == 'both') 
        {
          this.setPositionBothArmsOn(index, undefined);
        }
        else
        {
          this.getMoveInstruction(this._type, index);
        }
        break;

      case "open":
        icon = 'abb-opengripper';
        if (this._type == 'both') 
        {
          this._bothArmsPositions['left'].actions[index].instruction = this.robots.getOpenGripperInstruction();
          this._bothArmsPositions['right'].actions[index].instruction = this.robots.getOpenGripperInstruction();
          this.openGripper('left', true);
        }
        else 
        {
          this._actions[index].instruction = this.robots.getOpenGripperInstruction();
          this.openGripper(this._type);
        }
        break;

      case "close":
        icon = 'abb-closegripper';
        if (this._type == 'both') 
        {
          this._bothArmsPositions['left'].actions[index].instruction = this.robots.getCloseGripperInstruction();
          this._bothArmsPositions['right'].actions[index].instruction = this.robots.getCloseGripperInstruction();
          this.closeGripper('left', true);
        }
        else 
        {
          this._actions[index].instruction = this.robots.getCloseGripperInstruction();
          this.closeGripper(this._type);
        }
        break;
      
      default:
        break;
    }
    
    this._indexActions++;
    this._actions[index].icon = icon;
    this._actions[index].state = 'blue';
    this._actions[index].type = type;
  }

  openGripper(arm, both:boolean = false) {
    console.log(`openGripper(${arm}) - INIT`);
    this.robots.operateHand(
      arm,
      10,
      (data, t, xhr) => {
        if (xhr.status == 204) 
        {
          console.log(`openGripper(${arm}) - 204: `, data);
          setTimeout( () => { 
            this.robots.operateHand(
              arm,
              6,
              (data, t, xhr) => {
                if (xhr.status == 204) 
                {
                  console.log(`openGripper(${arm}) - 204: `, data);
                  setTimeout( () => { 
                    this.robots.operateHand(
                      arm,
                      8,
                      (data, t, xhr) => {
                        if (xhr.status == 204) 
                        {
                          console.log(`openGripper(${arm}) - 204: `, data);
                          if (both && arm == 'left')
                            this.openGripper('right');
                        } 
                        else 
                        {
                          console.log(`openGripper(${arm}) - Not 204 Status: ` + xhr.status);
                          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                        }
                      }, 
                      (err) => {
                        console.error('ERROR - openGripper - ', err);
                        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                      }
                    );
                  }, 100);
                } 
                else 
                {
                  console.log(`openGripper(${arm}) - Not 204 Status: ` + xhr.status);
                  this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                }
              }, 
              (err) => {
                console.error('ERROR - openGripper - ', err);
                this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
              }
            );          
          }, 100);
        } 
        else 
        {
          console.log(`openGripper(${arm}) - Not 204 Status: ` + xhr.status);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      }, 
      (err) => {
        console.error('ERROR - openGripper - ', err);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    );
  }

  closeGripper(arm, both:boolean = false) {
    console.log(`closeGripper(${arm}) - INIT`);
    this.robots.operateHand(
      arm,
      10,
      (data, t, xhr) => {
        if (xhr.status == 204) 
        {
          console.log(`closeGripper(${arm}) - 204: `, data);
          setTimeout( () => 
          { 
            this.robots.operateHand(
              arm,
              5,
              (data, t, xhr) => {
                if (xhr.status == 204) 
                {
                  console.log(`closeGripper(${arm}) - 204: `, data);
                  setTimeout( () => { 
                    this.robots.operateHand(
                      arm,
                      7,
                      (data, t, xhr) => {
                        if (xhr.status == 204) 
                        {
                          console.log(`closeGripper(${arm}) - 204: `, data);
                          if (both && arm == 'left')
                            this.closeGripper('right');
                        } 
                        else 
                        {
                          console.log(`closeGripper(${arm}) - Not 204 Status: ` + xhr.status);
                          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                        }
                      }, 
                      (err) => {
                        console.error('ERROR - closeGripper - ', err);
                        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                      }
                    );
                  }, 100);
                } 
                else 
                {
                  console.log(`closeGripper(${arm}) - Not 204 Status: ` + xhr.status);
                  this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
                }
              }, 
              (err) => {
                console.error('ERROR - closeGripper - ', err);
                this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
              }
            );          
          }, 100);
        } 
        else 
        {
          console.log(`closeGripper(${arm}) - Not 204 Status: ` + xhr.status);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      }, 
      (err) => {
        console.error('ERROR - closeGripper - ', err);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    );
  }

  getAllInstructions() {
    console.log('getAllInstructions - INIT');
    let actions: string = '';
    if (this._initPosition != undefined) actions += this._initPosition;
    this._actions.forEach(val => {
      console.log('getAllInstructions - var: ', val.instruction);
      if ( val.instruction != undefined) {
        actions += val.instruction;
      }
    });
    if (this._endPosition != undefined) actions += this._endPosition;
    
    console.log('getAllInstructions - Return: ', actions);

    return actions;
  }

  getAllArmInstructions(arm) {
    console.log(`getAllArmInstructions(${arm}) - INIT`);
    let actions: string = '';
    if (this._bothArmsPositions[arm].initPosition != undefined) actions += this._bothArmsPositions[arm].initPosition;
    this._bothArmsPositions[arm].actions.forEach(val => {
      if (val.instruction != undefined) {
        actions += val.instruction;
      }
    });
    if (this._bothArmsPositions[arm].endPosition != undefined) actions += this._bothArmsPositions[arm].endPosition;
    
    console.log(`getAllArmInstructions(${arm})  - Return: `, actions);

    return actions;
  }

  writeProgramBothArms(context, arm:string = 'left') {
    console.log(`writeProgramBothArms(${arm}) - INIT`);

    if ((context._currentExecution == context._executions.BothArms && !context._bothArmsPositionCallbackStack.write) 
      || context._bothArmsPositions.left.endPosition == undefined 
      || context._bothArmsPositions.right.endPosition == undefined)
    {
      console.log(`writeProgramBothArms(${arm}) - exit without writing`);
      context.NextCallback(context);
      return;
    }

    context.robots.insertInstruction(
      context._positions[arm].taskName,
      'MainModule',
      context.getAllArmInstructions(arm),
      (data, t, xhr) => 
      {
        if (xhr.status == 204) 
        {
          console.log(`writeProgramBothArms(${arm}) - 204: `, data);
          if (arm == 'left')
          {
            context.writeProgramBothArms(context, 'right');
          }
          else 
          {
            context.events.publish('enablePlayBoth', true, this._type);
            //(context.events.publish('enableDeleteBtn', false);
            context._endColor = 'blue';
            context.NextCallback(context);
          }
        } 
        else 
        {
          console.log(`writeProgramBothArms(${arm}) - Not 204 Status: ` + xhr.status);
          context.showMsg('An error has occured. Call a technician to help you.', 'error');
        }
      }, 
      (err) => 
      {
        console.error(`writeProgramBothArms(${arm}) - ERROR: `, err);
        context.showMsg('An error has occured. Call a technician to help you.', 'error');
      }
    ) 
  }

  writeProgram() {
    console.log('writeProgram() - INIT');
    this.robots.insertInstruction(
      this._positions[this._type].taskName,
      'MainModule',
      this.getAllInstructions(),
      (data, t, xhr) => 
      {
        if(xhr.status == 204) 
        {
          console.log("writeProgram() - 204: ", data);
          this.events.publish('enablePlayBoth', true, this._type);
          //this.events.publish('enableDeleteBtn', false);
          this._endColor = 'blue';
          if (this._currentExecution != undefined) this.NextCallback(this);
        } 
        else 
        {
          console.log("writeProgram() - Not 204 Status:" + xhr.status);
          this.showMsg('An error has occured. Call a technician to help you.', 'error');
          this._endPosition = undefined;
        }
      }, 
      (err) => 
      {
        console.error('ERROR - writeProgram - ', err);
        this.showMsg('An error has occured. Call a technician to help you.', 'error');
        this._endPosition = undefined;
      }
    );
  }

  getLeftArmSyncMoveInstructions(context) {
    console.log(`getLeftArmSyncMoveInstructions() - INIT`);
    context.getMoveInstruction('left', context._bothArmsPositionCallbackStack.positionIndex, context._bothArmsPositionCallbackStack.isInitPosition);
  }

  getRightArmSyncMoveInstructions(context) {
    console.log(`getRightArmSyncMoveInstructions() - INIT`);
    context.getMoveInstruction('right', context._bothArmsPositionCallbackStack.positionIndex, context._bothArmsPositionCallbackStack.isInitPosition);
  }

  getMoveInstruction(arm, index, isInitPosition?:boolean) {
    console.log(`getMoveInstruction(${arm}, ${index}, ${isInitPosition}) - INIT`);
    this.robots.getCurrentPosition(
      this._positions[arm].taskName,
      (data, t, xhr) => 
      {
        if(xhr.status == 200) 
        {
          console.log("getCurrentPosition data: ", data);
          let isBoth = this._type == 'both' ? true : false;

          if ( index == undefined || index > 11 || index < 0 ) 
          {
            if (isInitPosition == true) 
            {
              if (isBoth)
              {
                this._bothArmsPositions[arm].initPosition = this.robots.getMoveInstructionFromCurrentPosition(data, true);
                this._initPosition = 'both';
              }
              else
              {
                this._initPosition = this.robots.getMoveInstructionFromCurrentPosition(data);
              }

              this._startColor = 'blue';

              if (isBoth) this.NextCallback(this);
            } 
            else if (isInitPosition == false)
            {
              if (isBoth)
              {
                this._bothArmsPositions[arm].endPosition = this.robots.getMoveInstructionFromCurrentPosition(data, true);
                this._endPosition = 'both';
              }
              else
              {
                this._endPosition = this.robots.getMoveInstructionFromCurrentPosition(data);
              }

              // both parameter
              if (isBoth)
              {
                this.NextCallback(this);
              }
              else
              {
                this.writeProgram();
              }
            } 
            else 
            {
              console.error("NO INDEX, ISINITPOSITION NULL");
              this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
              this._endPosition = undefined;
            }
          } 
          else 
          {
            if (isBoth)
            {
              this._bothArmsPositions[arm].actions[index].instruction = this.robots.getMoveInstructionFromCurrentPosition(data, true);
              this.NextCallback(this);
            }
            else
            {
              this._actions[index].instruction = this.robots.getMoveInstructionFromCurrentPosition(data);
            }
          }
        } 
        else 
        {
          console.log("getCurrentPosition xhr:" + xhr.status);
          this.showMsg('An error has occured. Call a technician to help you.', 'error');
          this._endPosition = undefined;
        }
      }, 
      (err) => 
      {
        console.error('ERROR - getMoveInstruction - ', err);
        this.showMsg('An error has occured. Call a technician to help you.', 'error');
        this._endPosition = undefined;
      });
  }

  setStartPosition() {
    console.log("setStartPosition() - INIT - type: ", this._type);

    if (this._initPosition) {

      this.controlSelect( 'start' );

      this.events.publish('enableDelete', this._selectedAction, this._type);

    } else {

      if (this._type == 'both')
      {
        this.setPositionBothArmsOn(undefined, true);
      }
      else
      {
        this.getMoveInstruction(this._type, undefined, true);
      }
    }
  }

  setEndPosition() 
  {
    console.log("setEndPosition() - INIT", this._endPosition);

    if ( this._endPosition ) {

      this.controlSelect( 'end' );

      this.events.publish('enableDelete', this._selectedAction, this._type);

    } else {

      this.appState.getProgram().then( val => {
        this._program = val;
        console.log("setEndPosition() - Program value:", this._program);

        if (this._program == '' || this._program == undefined) 
        {
          this.openAlert('<h2>First, create a program please.</h2>');
        }
        else 
        {
          if (this._initPosition == '' || this._initPosition == undefined) 
          {
            this.openAlert('<h2>First, set an init position.</h2>');
          } 
          else if (this._endPositionEventTriggered)
          {
            console.log('setEndPosition() - ResetMainModules - type: ', this._type);
            this.resetMainModulesOn();
            this.openLoading();
          }
          else 
          {
            console.log('setEndPosition() - type: ', this._type);
            if (this._type == 'both')
            {
              this.setPositionBothArmsOn(undefined, false, true);
            }
            else
            {
              this.getMoveInstruction(this._type, undefined, false);
            }
          }
        }
      });
    }
  }

  setEndPositionFromProcess(context) {
    console.log("setEndPositionFromProcess()");
    if (context._type == 'both')
    {
      context.setPositionBothArmsOn(undefined, false, true);
    }
    else
    {
      context.getMoveInstruction(context._type, undefined, false);
    }
  }

  selectAction(ind) 
  {
    console.log(`selectAction(${ind}) - INIT`);
    if (this._actions[ind].type != '' ) 
    {
      this.controlSelect( ind );

      console.log(`selectAction(${ind}) - ${this._selectedAction} ${ind}`);
      this.events.publish('enableDelete', this._selectedAction, this._type);
    }
  }
  controlSelect (ind) {

    if ( ind == 'start' ) {
      this.selectStart( ind );
    } else if( ind == 'end') {
      this.selectEnd( ind );
    } else {
      this.selectTask( ind );
    }
  }

  selectStart (ind) {
    //Si clico en el mismo, desselecciona
    if ( this._selectedAction == ind ) {

      this._startColor = 'blue';
      this._selectedAction = -1;

    } else {

      this.resetColorsStates();

      this._selectedAction = ind;
      this._startColor = 'orange';
    }
  }

  selectEnd (ind) {
    //Si clico en el mismo, desselecciona
    if ( this._selectedAction == ind ) {

      this._endColor = 'blue';
      this._selectedAction = -1;

    } else {

      this.resetColorsStates();

      this._selectedAction = ind;
      this._endColor = 'orange';
    }
  }

  selectTask (ind) {
    //Si clico en el mismo, desselecciona
    if ( this._selectedAction == ind ) {

      this._actions[this._selectedAction].state = 'blue';
      this._selectedAction = -1;

    } else {

      this.resetColorsStates();

      this._selectedAction = ind;
      this._actions[this._selectedAction].state = 'orange';
    }
  }

  resetColorsStates () {
    //Si es clico a un boton diferente
    if (this._selectedAction != undefined && this._selectedAction != -1) {
      
      console.log(this._selectedAction);
      this._startColor = 'blue';
      
      if ( this._endPosition ) {
        this._endColor = 'blue';
      }
      
      if ( this._selectedAction != 'end' && this._selectedAction != 'start' ) {
        this._actions[this._selectedAction].state = 'blue';
      }

      this.events.publish('enableDelete', -1, this._type);
    }
  }

  pauseWithArm () {

    this._executionActive = false;
    this.events.publish('executionActive', this._executionActive, this._type);

    this.robots.pause(
      ( data, textStatus, xhr ) => {
        if (xhr.status == 204) {
          console.log('pauseWithArm () Status 204 SUCCESS');
        } else {
          console.log('pauseWithArm () Status', xhr.status);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => {
        console.log('pauseWithArm () Error', err.statusText);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    )
  }

  disableTask (context) {
    if ( context._type != 'both' ) {

      let task = context._type == 'left' ? 'T_ROB_R' : 'T_ROB_L' ;

      //todo desactivate task contraria
      context.robots.deactivateTask(
        task,
        ( data, textStatus, xhr ) => {
          if (xhr.status == 204) {
            console.log('disableTask () Status 204 SUCCESS');
            context.NextCallback( context );
          } else {
            console.log('disableTask () Status', xhr.status);
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          }
        },
        (err) => {
          console.log('disableTask () Error', err.statusText);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      )
    } else {
      console.log('disableTask () Both Arms: Next Callback');
      context.NextCallback( context );
    }
  }

  enableTask (context) {
    if ( context._type != 'both' ) {
      
      let task = context._type == 'left' ? 'T_ROB_L' : 'T_ROB_R' ;

      //todo desactivate task contraria
      context.robots.activateTask(
        task,
        ( data, textStatus, xhr ) => {
          if (xhr.status == 204) {
            console.log('enableTask () Status 204 SUCCESS');
            context.NextCallback( context );
          } else {
            console.log('enableTask () Status', xhr.status);
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          }
        },
        (err) => {
          console.log('enableTask () Error', err.statusText);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      )
    } else {
      console.log('enableTask () Both Arms: Next Callback');
      context.activateTasks(context);
    }
  }

  activateTasks (context, task:string = 'T_ROB_L') {
    context.robots.activateTask(
      task,
      (data, textStatus, xhr) => {
        if(xhr.status == 204) {
          console.log("activateTask - success - " + xhr.status + " STATUS: ", data);
          if(task == 'T_ROB_L') {
            console.log("activateTask - success - GO TO ActivateTask");
            context.activateTasks(context, 'T_ROB_R');
          } else {
            context.NextCallback(context);
          }
        } else {
          console.log("activateTask - " + xhr.status + " STATUS: ", data);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => {
        console.log("activateTask - error: ", err);
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    )
  }

  resetPP(context) {
    console.log('resetPP() - INIT');
    context.robots.resetProgramPP(
      (data, textStatus, xhr) => {

        if ( xhr.status == 204 ) {

          context.NextCallback(context);

        } else {

          console.log("resetPP() - success - " + xhr.status + " STATUS: ", data);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }  
      }, err => {
        console.log("resetPP() - error: ", err);
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
    } );

  }

  playOnce (context) {
    //play Once
    context.robots.playOnce(
      ( data, textStatus, xhr ) => {
        if (xhr.status == 204) {
          console.log('playOnce () Status 204 SUCCESS');
          context._executionActive = true;
          context.events.publish('executionActive', context._executionActive, context._type);
          context.NextCallback( context );
        } else {
          console.log('playOnce () Status', xhr.status);
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => {
        console.log('playOnce () Error', err.statusText);
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    )
  }

  checkExecution (context) {    
    console.log('checkExecution() - INIT');
    context.robots.checkExecution(
      (data, textStatus, xhr) => 
      {
        if (xhr.status == 200) 
        {
          console.log('checkExecution() - ', data)
          console.log('checkExecution() - ', data._embedded._state[0].ctrlexecstate)
          if (data._embedded._state[0].ctrlexecstate == 'stopped') 
          {
            context.counterCycles = 0;
            context._executionActive = false;
            context.events.publish('executionActive', context._executionActive, context._type);
            context.NextCallback(context);
          } 
          else if (context.counterCycles >= 60) 
          {
            console.log("checkExecution - Unknown Error in Execution. More time checks executions", data);
            //context.showMsg( 'Unknown Error in Execution', 'error' );
            context.counterCycles = 0;
            context._executionActive = false;
            context.events.publish('executionActive', context._executionActive, context._type);
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          } 
          else 
          {
            context.counterCycles++;
            setTimeout( () => { context.checkExecution(context); }, 1000 );
          }
        } 
        else 
        {
            context.counterCycles = 0;
            context._executionActive = false;
            context.events.publish('executionActive', context._executionActive, context._type);
            console.log("checkExecution - success - " + xhr.status + " STATUS: ", data);
            context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
    }, err => 
    {
      context.counterCycles = 0;
      context._executionActive = false;
      context.events.publish('executionActive', context._executionActive, context._type);
      console.log("checkExecution - error: ", err);
      //context.showMsg( err.statusText, 'error' );
      context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
    });
  }

  changeColor (color, compareColor, changeColor) {
    color = ( color == compareColor ) ? changeColor : compareColor;
    return color; 
  }

  openAlert(msg) {

    let alert = this.alertCtrl.create(
      {
        title: '',
        message: msg,
        cssClass: 'mn-popup',
        buttons: [
          {
            text: '',
            role: 'cancel',
            cssClass: 'hidden',
            handler: data => {}
          }
        ]
      }
    );

    alert.present();
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

  @Input()
  set type ( type: string ) {
    this._type = type;
  }

  get type () {
    return this._type;
  }

  @Input()
  set programName ( programName: string ) {
    this._program = programName;
  }

  get programName () {
    return this._program;
  }

  mastershipReq(context) {
    console.log("mastershipReq() - INIT");
    context.robots.mastershipRequest(
      (data, textStatus, xhr) => 
      {
        if (xhr.status == 204) 
        {
          console.log("MASTERSHIP REQUEST: 204 -> NEXT FUNC");
          context.NextCallback(context);
        }
         else 
         {
          console.log("MASTERSHIP REQUEST: " + xhr.status + " -> MASTERSHIP RELEASE");
          context.mastershipRel( context.mastershipReq );
        }
      },
      (err) => 
      {
        console.log("MASTERSHIP REQUEST: ERROR" + err.statusText + " -> MASTERSHIP RELEASE");
        context.mastershipRel( context.mastershipReq );
      }
    );
  }

  mastershipRel(func) {
    console.log("mastershipRel() - INIT");
    this.robots.mastershipRelease(
      (data, textStatus, xhr) => 
      {
        if (xhr.status == 204) 
        {
          console.log("MASTERSHIP RELEASE: 204 -> MASTERSHIP REQUEST");
          //this.showMsg( 'Mastership disabled', 'info' );
          func(this);
        } 
        else 
        {
          console.log("MASTERSHIP REQUEST ERROR: " + xhr.status + " -> " + textStatus);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => 
      {
        console.log("MASTERSHIP REQUEST: ERROR", err.statusText);
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    );
  }

  unloadProgMods(context, task:string = 'T_ROB_L') {
    console.log(`unloadProgMods(${task}) - INIT`);
    if (context._type == 'right') task = 'T_ROB_R';
    context.getProgModulesByTask(task);
  }

  getProgModulesByTask(task) {
    console.log(`getProgModulesByTask(${task}) - INIT`);

    let modules = [];

    this.robots.getModulesListFromTask(
      task, 
      (data, t, xhr) => {
        if (xhr.status == 200) 
        {
          console.log('- getProgModulesByTask - 200: ', data );
          data._embedded._state.forEach(module => 
          {
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
             if (task == 'T_ROB_L' && this._type == 'both') 
             {
              console.log('- getModulesByTask - 200 - Next Task: T_ROB_R');
              this.unloadProgMods(this, 'T_ROB_R');
             } 
             else 
             {
              console.log('- getProgModulesByTask - 200 - NEXT FUNC');
              this.NextCallback(this);
             }
          }
        } 
        else 
        {
          console.log('- getProgModulesByTask - Success - NOT 200 STATUS: ', data);
          //this.showMsg( 'Unexpected HTTP status code in response: ' + xhr.status, 'error' );
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      },
      (err) => {
        //this.showMsg( err.statusText, 'error' );
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      } 
    );
  }

  unloadModuleByTask(task, modules, isSys, index = 0) {
    console.log(`unloadModuleByTask(${task}, ${modules}, ${isSys}, ${index}) - INIT`);
    this.robots.unloadModule( 
      task, 
      modules[index], 
      (data, textStatus, xhr) => 
      {
        if (xhr.status == 204) 
        {
          console.log("unloadModuleByTask - 204: ", task, modules[index]);
          
          index++;
          
          if (index == modules.length) 
          {
             if (task == 'T_ROB_L' && this._type == 'both') 
             {
               if (isSys) {
                 //sthis.unloadSysModsIfNeeded(this, 'T_ROB_R');
               } 
               else 
               {
                  this.unloadProgMods(this, 'T_ROB_R');
               }
             } 
             else 
             {
                this.NextCallback(this);
             }
          } 
          else 
          {
            this.unloadModuleByTask(task, modules, isSys, index);
          }
        } 
        else 
        {
          console.log("unloadModuleByTask - " + xhr.status + ": ", data);
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      }, 
      (err)=>
      {
        console.error('ERROR', err);
        this.showMsg('An error has occured. Call a technician to help you.', 'error');
      } 
    );
  }

  loadCommonMod(context, task = 'T_ROB_L') 
  {
    console.log(`loadCommonMod(${task}) - INIT`);
    if (context._type == 'right') task = 'T_ROB_R';

    let modulePath = context.appState.R_MODULES_PATH.value + context.tasks[ task ].main_module;

    context.robots.loadModule(
      task, 
      modulePath, 
      (data, t, xhr) => 
      {
        if (xhr.status == 204) 
        {
          if (task == 'T_ROB_L' && context._type == 'both') 
          {
            console.log("- loadCommonMod - 204: NEXT TO T_ROB_R");
            context.loadCommonMod(context, 'T_ROB_R');
          } 
          else 
          {
            console.log("- loadCommonMod - 204: NEXT FUNC");
            context.NextCallback(context);
          }
        } 
        else 
        {
          console.log("- loadCommonMod - success - " + xhr.status + " STATUS: ", data);
          //context.showMsg( 'There are problems with load Yumi', 'error' );
          context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        }
      }, 
      ( err ) => 
      {
        console.log("- loadCommonMod - error: ", err);
        //context.showMsg( err.statusText, 'error' );
        context.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
      }
    );
  }

  openLoading() {
    console.log('openLoading() - INIT');
    this.loading = this.loadingCtrl.create({
      content: ''
    });

    this.loading.present();
  }

  playOnceWithOneArm () {

    this.playOn();
  }

}
