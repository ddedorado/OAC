import { Injectable } from '@angular/core';

import { Api } from '../api/api';
import { AjaxService } from '../ajax/ajaxservice';
import { AppState } from '../app-state/app-state';

@Injectable()
export class Robots {
  
  host: string = '';
  pointer: any = {
    init: {
      T_ROB_R: {
        module: 'YuMi_App_R',
        routine: 'YuMi_App_InitHandR'
      },
      T_ROB_L: {
        module: 'YuMi_App_L',
        routine: 'YuMi_App_InitHandL'
      }
    },
    home: {
      T_ROB_R: {
        module: 'YuMi_App_R',
        routine: 'YuMi_App_GotoHomeR'
      },
      T_ROB_L: {
        module: 'YuMi_App_L',
        routine: 'YuMi_App_GotoHomeL'
      }
    }
  };

  constructor( public api: Api, public ajax: AjaxService, public appState: AppState ) {
    this.ajax.appState = this.appState;
  }

  login (success, error) {
    this.ajax.get( `http://${this.appState.IP.value}/users?json=1`, success, error );
  }

  play (regain, execmode, cycle, condition, stopatbp, alltaskbytsp, success, error) {

    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/execution?action=start`,
      `regain=${regain}&execmode=${execmode}&cycle=${cycle}&condition=${condition}&stopatbp=${stopatbp}&alltaskbytsp=${alltaskbytsp}`,
      success,
      error
    );
  }

  start (success, error) {
    this.play( 'continue','continue', 'forever', 'none', 'disabled', 'false', success, error );
  }

  playOnce (success, error) {
 
    this.play( 'clear','continue', 'once', 'none', 'disabled', 'false', success, error );
  }

  pause (success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/execution?action=stop`,
      `stopmode=stop&usetsp=normal`,
      //`regain=continue&execmode=continue&cycle=forever&condition=none&stopatbp=disabled&alltaskbytsp=false`,
      success,
      error
    )
  }

  stop (success, error) {
    this.pause( 
      success,
      error
    );
  }

  setPPRoutine (task, module, routine, success, error) {

    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}/pcp?action=set-pp-routine`,
      `module=${module}&routine=${routine}&userLevel=false`,
      success,
      error
    )
  }

  resetPPRoutine (success, error) {

    this.ajax.post(
      `http://${this.appState.IP.value}/rw/rapid/execution?action=resetpp`,
      success,
      error
    )
  }

  resetLeftArm (success, error) {

    this.setPPRoutine( 'T_ROB_L', 'ModuleL', 'main', success, error );
  }

  resetRightArm (success, error) {

    this.setPPRoutine( 'T_ROB_R', 'ModuleR', 'main', success, error );
  }

  initHandler (task, pointer, success, error) {
    console.log("INIT HANDLER: Pointer: ", pointer);
    this.setPPRoutine( task, this.pointer[pointer][task].module, this.pointer[pointer][task].routine, success, error );
  }

  /* MASTERSHIP */
  mastershipRequest (success, error) {

    this.ajax.post( `http://${this.appState.IP.value}/rw/mastership/rapid?action=request`, success, error );
  }

  mastershipRelease (success, error) {
    this.ajax.post( `http://${this.appState.IP.value}/rw/mastership/rapid?action=release`, success, error );
  }

  /* DISABLE LEADTHROUGH */
  disableLeadThroughArm (robot, success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/motionsystem/mechunits/${robot}?action=set-lead-through`, 
      'status=inactive',
      success,
      error
    );
  }

  enableLeadThrough (robot, success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/motionsystem/mechunits/${robot}?action=set-lead-through`, 
      'status=active',
      success,
      error
    );
  }

  /* TASKS LIST */
  getTasksList (success, error) {
    this.ajax.get( `http://${this.appState.IP.value}/rw/rapid/tasks?json=1`, success, error );
  }

  /* MODULES LIST FROM TASK */
  getModulesListFromTask ( task, success, error  )  {
    
    this.ajax.get( `http://${this.appState.IP.value}/rw/rapid/modules?task=${task}&json=1`, success, error );
  }

  /* UNLOAD MODULE BY TASK */
  unloadModule (task, mod, success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}?action=unloadmod`, 
      `module=${mod}`,
      success, 
      error
    );
  }

  /* LOAD MODULE BY TASK */
  loadModule (task, module, success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}?action=loadmod`, 
      `modulepath=${module}`,
      success, 
      error 
    );
  }

  /* ENABLE MOTORS 
     state: motoron|motoroff
  */
  enableMotors(state, success, error) {
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/panel/ctrlstate?action=setctrlstate`, 
      `ctrl-state=${state}`,
      success,
      error
    );
  }

  /* Check Execution */
  checkExecution (success, error) {
    this.ajax.get( `http://${this.appState.IP.value}/rw/rapid/execution?json=1`, success, error );
  }

  /* Reset Program Pointer */
  resetProgramPP (success, error) {
    this.ajax.post(
      `http://${this.appState.IP.value}/rw/rapid/execution?action=resetpp`, 
      success,
      error
    );
  }

  /* Get Robot Current Position */
  getCurrentPosition( task, success, error  )  {
    this.ajax.get( `http://${this.appState.IP.value}/rw/rapid/tasks/${task}/motion?resource=robtarget&json=1`, success, error );
  }

  /* Get Move RAPID Instruction from the response of getCurrentPosition() call */
  getMoveInstructionFromCurrentPosition(data, both:boolean = false ) {
    let position = data._embedded._state[0];
    let instruction = both ? 'MoveSync' : 'Move';
    // KEEP BREAK LINE AT THE THE END OF THE INSTRUCTION
    instruction += `[[${position.x},${position.y},${position.z}],[${position.q1},${position.q2},${position.q3},${position.q4}],[${position.cf1},${position.cf4},${position.cf6},${position.cfx}],[${position.ej1},` + '9E%2B09,9E%2B09,9E%2B09,9E%2B09,9E%2B09]];' + `
    `;

    return instruction;
  }

  /* Get Open Gripper RAPID Instruction */
  getOpenGripperInstruction() {
    console.log('getOpenGripperInstruction() - INIT');
    // KEEP BREAK LINE AT THE THE END OF THE INSTRUCTION
    return `OpenHand;
    `;
  }

  /* Get Close Gripper RAPID Instruction */
  getCloseGripperInstruction() {
    console.log('getCloseGripperInstruction() - INIT');
    // KEEP BREAK LINE AT THE THE END OF THE INSTRUCTION
    return `CloseHand;
    `;
  }

  /* Inserts RAPID Instructions source code */
  insertInstruction( task, module, instruction, success, error ) {
    console.log(`insertInstruction( ${task}, ${module}, ${instruction}) - INIT`);
    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/modules/${module}?action=set-text-range`, 
      `task=${task}&replace-mode=Replace&query-mode=Force&startrow=7&startcol=0&endrow=7&endcol=0&text=${instruction}`,
      success, 
      error 
    );
  }

  setProgramName(task, programName, success, error) {
    console.log(`setProgramName(${task}, ${programName}) - INIT`);

    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}/program?action=setname`,
      `name=${programName}`,
      success,
      error
    );
  }

  saveProgram(task, programName, success, error) {
    console.log(`saveProgram(${task}, ${programName}) - INIT`);
    let path = `${this.appState.R_MODULES_PATH.value}/Programs/${programName}/${task}`;

    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}/program?action=save`, 
      `path=${path}`,
      success, 
      error 
    );
  }

  activateTask(task, success, error) {
    console.log(`activateTask(${task}) - INIT`);

    this.ajax.post(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}?action=activate`, 
      success, 
      error 
    );
  }

  deactivateTask(task, success, error) {
    console.log(`desactivateTask(${task}) - INIT`);

    this.ajax.post(
      `http://${this.appState.IP.value}/rw/rapid/tasks/${task}?action=deactivate`, 
      success, 
      error 
    );
  }

  uploadModule(moduleName, content, success, error) {
    console.log(`uplaodModule(${moduleName}) - INIT`);

    this.ajax.putWithData(
      `http://${this.appState.IP.value}/fileservice/$home/${moduleName}`,
      content, 
      success, 
      error 
    );
  }

  operateHand(arm, value, success, error) {
    console.log(`openHand(${arm}, ${value}) - INIT`);

    let hand = (arm == 'left' ? 'L' : 'R');

    this.ajax.postWithData(
      `http://${this.appState.IP.value}/rw/iosystem/signals/EtherNetIP/Hand_${hand}/hand_CmdGripper_${hand}?action=set`, 
      `lvalue=${value}&mode=value&Delay=0&ActivePulse=0&Pulses=0&PassivePulse=0`,
      success, 
      error 
    );
  }

  getModuleAsText(task, success, error) {
    console.log(`getModuleAsText(${task}) - INIT`);
    this.ajax.get(`http://${this.appState.IP.value}/rw/rapid/modules/MainModule?resource=module-text&task=${task}&json=1`, success, error);
  }

}
