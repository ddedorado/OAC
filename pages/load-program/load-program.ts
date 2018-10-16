import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, LoadingController } from 'ionic-angular';
import { AppState, Robots } from '../../providers/providers';

@IonicPage()
@Component({
  selector: 'page-load-program',
  templateUrl: 'load-program.html',
  providers: [AppState, Robots]
})
export class LoadProgramPage {
	
	title: string = 'Load Program';
	
	selectedProgram: number = undefined;
  preSelect: number = 0;

  // Flag pointing whether an error occurred in the process
  errorOnLoadingProgram: boolean = false;

  loading: any = undefined;
  uploadingFile: any = undefined;
  uploadingFileTimeout: number = 0;
  fileL: File = undefined;
  fileR: File = undefined;
  fileLString: string = '';
  fileRString: string = '';
  alert: any;

  tasks: any = {
    T_ROB_L: {
      uploadedModule: 'TempLeft.mod',
      robot: 'ROB_L'
    },
    T_ROB_R: {
      uploadedModule: 'TempRight.mod',
      robot: 'ROB_R'
    }
  };

	programs = [
		{
			name: 'Program 1',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 2',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 3',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 4',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 5',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 6',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 7',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 8',
      fileL: undefined,
      fileR: undefined
		},
		{
			name: 'Program 9',
      fileL: undefined,
      fileR: undefined
		}
	];

  executions: any = {
    'LoadProgram': 'LP'
  };

  currentExecution: any = undefined;

  LPCallbackStack: any = {
      task: undefined,
      index: 0,
      callbacks: [
        this.getFiles,
        this.uploadLeftFile,
        this.checkUploadFinished,
        this.uploadRightFile,
        this.checkUploadFinished,
        this.uploadModules,
        this.unloadProgMods,
        this.loadUploadedMods,
        this.resetPP      
      ]
    };

	constructor(
		public navCtrl: NavController, 
		public navParams: NavParams, 
		public toastCtrl: ToastController, 
		public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public appState: AppState,
		public robots: Robots
	) 
  {
    let name = new String(this.appState.CURRENT_PROGRAM);
    if (name != undefined && name != '') {
      console.log(name.charAt(-1));
      console.log(+name.charAt(-1));
    }

  }

	selectProgram(key) {
    console.log(`selectProgram(${key}) - INIT`);
		if ( key != this.selectedProgram  ) {
      console.log(`selectProgram(${key}) - if`);
			this.preSelect = key;
			this.openAlert();
		} 
    else {
      console.log(`selectProgram(${key}) - else`);
			this.preSelect = 0;
			this.selectedProgram = -1;
		}
	}

  showMsg(msg, type?: string) {
    console.log(`showMsg(${msg}) - INIT`);
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

  LoadProgramOn() {
    console.log('LoadProgramOn()');
    this.currentExecution = this.executions.LoadProgram;
    this.NextLPCallback(this);  
  }

  NextLPCallback(context) {
    console.log('NextLPCallback()');
    if (context.LPCallbackStack.callbacks.length == context.LPCallbackStack.index) {
      console.log('LoadProgramCallbackStack completed!!!');
      context.dismissAlertsAndResetExecution(context);
      context.selectedProgram = context.preSelect;
      context.preSelect = 0;
      context.appState.setProgram(context.programs[context.selectedProgram].name);
      context.programs[context.selectedProgram].fileL = context.fileL;
      context.programs[context.selectedProgram].fileR = context.fileR;
      context.fileL = undefined;
      context.fileR = undefined;
      
      context.showMsg(`${context.programs[context.preSelect].name} loaded`, 'info');
    } 
    else 
    {
      context.LPCallbackStack.callbacks[context.LPCallbackStack.index++](context);
    }
  }

  dismissAlertsAndResetExecution(context) {
    context.currentExecution = undefined;
    context.LPCallbackStack.index = 0;

    if (context.loading != undefined) {
      context.loading.dismiss();
    }
    if (context.alert != undefined) {
      context.alert.dismiss();
    }

    context.loading = undefined;
    context.alert = undefined;    
  }

  openAlert() {
    console.log(`openAlert() - INIT`);
    let settings = {
      title: 'Modules Location',
      message: '',
      inputs: [
	      {
	      	id: 'module-l',
          name: 'T_ROB_L',
          placeholder: 'Left Arm Module',
          type: 'file',
          value: this.programs[this.preSelect].fileL != undefined ? this.programs[this.preSelect].fileL : ''
        },
	      {
	      	id: 'module-r',
          name: 'T_ROB_R',
          placeholder: 'Right Arm Module',
          type: 'file',
      		value: this.programs[this.preSelect].fileR != undefined ? this.programs[this.preSelect].fileR : ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log(`openAlert() - Cancel button Click handler`);
          }
        },
        {
          text: 'Load Program',
          handler: (data) => {
            console.log(`openAlert() - Load Program button Click handler`);

            if (this.loading != true) {
              this.loading = true;
              this.openLoading();
              this.LoadProgramOn();
            }

            return false;
          }    
        }
      ]
    }

    let alert = this.alertCtrl.create(settings);

    alert.present();

    this.alert = alert;
  }

  openLoading() {
    console.log('openLoading() - INIT');
    this.loading = this.loadingCtrl.create({
      content: ''
    });
    this.loading.present();
  }

  uploadFile(file, destinyFile, context) {
    console.log(`uploadFile(${file}, ${destinyFile}, ${context}) - INIT`);
    var reader = new FileReader();
    reader.onload = context.processUploadedFile(file, destinyFile, context);
    reader.readAsText(file);
  }

  processUploadedFile(file, destinyFile, context) {
    console.log(`processUploadedFile(${file}, ${destinyFile}, ${context}) - INIT`);
    return function(e) { 
      if (destinyFile == 'left') {
        context.fileLString = e.target.result;
      } 
      else {
        context.fileRString = e.target.result;
      }
      context.uploadingFile = false;
    }
  }

  getFiles(context) {
    console.log('getFiles() - INIT');
    context.fileL = (<HTMLInputElement>document.getElementById('module-l')).files[0];
    context.fileR = (<HTMLInputElement>document.getElementById('module-r')).files[0];
    
    if (context.fileL == undefined || context.fileR == undefined) 
    {
      context.errorUploadingFile(context, 'Both files are needed');
    }
    else if (!context.checkExtension(context.fileL.name) || !context.checkExtension(context.fileR.name))
    {
      context.errorUploadingFile(context, 'Only .mod files accepted');
    }
    else 
    {
      context.NextLPCallback(context);
    }
  }

  uploadLeftFile(context) {
    console.log('uploadLeftFile() - INIT');
    if (context.fileL != undefined) {
      console.log('uploadLeftFile() - uploadLeftFile');
      context.uploadingFile = true;
      context.uploadFile(context.fileL, 'left', context);
    }
    context.NextLPCallback(context);
  }

  uploadRightFile(context) {
    console.log('uploadRightFile() - INIT');
    if (context.fileR != undefined) {
      console.log('uploadRightFile() - uploadRightFile');
      context.uploadingFile = true;
      context.uploadFile(context.fileR, 'right', context);
    }
    context.NextLPCallback(context);
  }

  checkUploadFinished(context) {
    console.log('checkUploadFinished() - INIT');
    if (context.uploadingFile == false || context.uploadingFile == undefined) {
      context.NextLPCallback(context);
    }
    else if (context.uploadingFileTimeout < 60) {
      context.uploadingFileTimeout++;
      setTimeout(() => { context.checkUploadFinished(context); }, 1000);
    }
    else {
      context.errorUploadingFile(context);
    }
  }

  errorUploadingFile(context, message = 'Error uploading files') {
    console.log('errorUploadingFile() - INIT');
    context.dismissAlertsAndResetExecution(context);
    context.showMsg(message, 'error');
  }

  uploadModules(context, task = 'T_ROB_L') {
    console.log(`uploadModules(${task}) - INIT`);
    context.robots.uploadModule(
      context.tasks[task].uploadedModule,
      task == 'T_ROB_L' ? context.fileLString : context.fileRString,
      (data, t, xhr) => {
        if ( xhr.status == 200 || xhr.status == 201 ) {
          if (task == 'T_ROB_L') {
            console.log("uploadModules - 200|201: NEXT TO T_ROB_R");
            context.uploadModules(context, 'T_ROB_R' );
          } 
          else {
            console.log("uploadModules - 200|201: NEXT FUNC");
            context.NextLPCallback(context);
          }
        } 
        else {
          console.log("uploadModules - " + xhr.status + " STATUS: ", data);
          context.errorUploadingFile(context);
        }
      }, 
      ( err ) => {
        console.log("uploadModules - error: ", err);
        context.errorUploadingFile(context);
      }
    );
  }

  unloadProgMods(context, task:string = 'T_ROB_L') {
    console.log(`unloadProgMods(${task}) - INIT`);
    context.getProgModulesByTask(task);
  }
  
  getProgModulesByTask(task) {
    console.log(`getProgModulesByTask(${task}) - INIT`);

    let modules = [];

    this.robots.getModulesListFromTask(
      task, 
      (data, t, xhr) => {
        if ( xhr.status == 200 ) {
          console.log('getProgModulesByTask - 200: ', data );
            
          data._embedded._state.forEach( module => {
            if ( module.type == 'ProgMod' ) {
              modules.push(module.name);
              console.log('getProgModulesByTask - 200 - ProgMod found: ' + module.name);
            }
          });

          if (modules.length > 0) {
            console.log('getProgModulesByTask - 200 - Unload Modules');
            this.unloadModuleByTask(task, modules);
          } 
          else {

             if ( task == 'T_ROB_L' ) {
              console.log('- getModulesByTask - 200 - Next Task: T_ROB_R');
              this.unloadProgMods( this, 'T_ROB_R' );

             } else {
              console.log('- getProgModulesByTask - 200 - NEXT FUNC');
              this.NextLPCallback( this );
             }
          }

        } else {
          console.log('- getProgModulesByTask - Success - NOT 200 STATUS: ', data);
          //this.showMsg( 'Unexpected HTTP status code in response: ' + xhr.status, 'error' );
          this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
          this.errorUploadingFile(this);
        }
          
        },
      (err) => {
        //this.showMsg( err.statusText, 'error' );
        this.showMsg( 'An error has occured. Call a technician to help you.', 'error' );
        this.errorUploadingFile(this);
      } 
    );
  }

  unloadModuleByTask(task, modules, index = 0) {
    console.log(`unloadModuleByTask(${task}) - INIT`);

    this.robots.unloadModule( 
      task, 
      modules[index], 
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          console.log("unloadModuleByTask - 204: ", task, modules[index]);
          index++;
          if (index == modules.length) {
            if ( task == 'T_ROB_L' ) {
              this.unloadProgMods(this, 'T_ROB_R');
            } 
            else {
              this.NextLPCallback(this);
            }
          } 
          else {
            this.unloadModuleByTask(task, modules, index);
          }

        } else {
          console.log("unloadModuleByTask - " + xhr.status + ": ", data);
          this.errorUploadingFile(this);
        }
      }, 
      (err)=>{
        console.error('unloadModuleByTask - ERROR: ', err);
        this.errorUploadingFile(this);
      } 
    );
  }

  loadUploadedMods(context, task = 'T_ROB_L') {
    console.log(`loadUploadedMods(${task}) - INIT`);
    let modulePath = '$home/' + context.tasks[task].uploadedModule;

    context.robots.loadModule(
      task, 
      modulePath, 
      (data, t, xhr) => {
        if (xhr.status == 204) {
          if (task == 'T_ROB_L') {
            console.log("loadUploadedMods - 204: NEXT TO T_ROB_R");
            context.loadUploadedMods(context, 'T_ROB_R');
          } 
          else {
            console.log("loadUploadedMods - 204: NEXT FUNC");
            context.NextLPCallback(context);
          }
        } 
        else {
          console.log("loadUploadedMods - success - " + xhr.status + " STATUS: ", data);
          context.errorUploadingFile(context);
        }
      }, 
      ( err ) => {
        console.log("loadUploadedMods - error: ", err);
        context.errorUploadingFile(context);
      }
    );
  }

  resetPP(context) {
    console.log('resetPP() - INIT');
    context.robots.resetProgramPP(
      (data, textStatus, xhr) => {
        if ( xhr.status == 204 ) {
          context.NextLPCallback(context);
        } 
        else {
          console.log("resetPP() - success - " + xhr.status + " STATUS: ", data);
          context.errorUploadingFile(context);
        }
      }, err => {
        console.log("resetPP() - error: ", err);
        context.errorUploadingFile(context);
      } 
    );
  }

  checkExtension(path) {
    let isMod: boolean = false;
    if (/\.(mod)$/.test(path)) {
      isMod = true;
    }  

    return isMod;
  }


  /*validateForm(data, context?:any) {
    console.log('validateForm() -INIT');
    let invalid = 0;
    
    console.log('LeftFile: ', context.fileLString);
    console.log('RightFile: ', context.fileRString);

    debugger;

    for ( let key in data ) {

      if ( context.isEmpty( data[key] ) || !context.checkExtension( data[key] ) ) {
				invalid++;
      }
    }

    if ( invalid > 0 ) {

    	context.showMsg( 'There are module paths with errors' , 'error' );
      context.preSelect = 0;

    } else {

      if (  context.preSelect != context.programSelected ) {
				//unload
				context.programs[ context.preSelect ].directoryL = data.T_ROB_L;
	      context.programs[ context.preSelect ].directoryR = data.T_ROB_R;

        // Triggers the Unload/Load process in sync mode.
        // First for the Left Arm task, then for the Right Arm task
				context.getModulesByTask( 'T_ROB_L', data.T_ROB_L, () => { 
          console.log('anonymous function');
          context.getModulesByTask( 'T_ROB_R', data.T_ROB_R, ); 
        });


        // If process does not failed, updateState
        if (context.errorOnLoadingProgram == false) {
          context.updateState();
        }
        else {
          console.log("validateForm - errorOnLoadingProgram")
          // TO-DO
          // 1. Disable Home Buttons
          // 2. Show message to the user if needed
          // 3. reset errorOnLoadingProgram flag
          context.errorOnLoadingProgram = false;
        }
      }
    }
  }

	loadModule ( task, module ) {
  	this.robots.loadModule(
  		task, 
  		module, 
  		( data, t, xhr ) => {

  			if ( xhr.status == 204 ) {
          console.log("loadModule - success - 204: ", data);
					
  			} else {
          console.log("loadModule - success - NOT 204 STATUS: ", data);
          this.errorOnLoadingProgram = true;
					this.showMsg( 'There are problems with load programs', 'error' );
  			}
  		}, 
  		( err ) => {
        console.log("loadModule - error: ", err);
        this.errorOnLoadingProgram = true;
  			this.showMsg( err.statusText, 'error' );
  		}
		);
	}

  updateState () {
		this.showMsg( 'Load program correctly', 'info' );
		this.selectedProgram = this.preSelect;
		this.preSelect = 0;
  }



  isEmpty (value) {

  	return ( value == '' || value <= 0 ) ? true : false;
  }*/

}
