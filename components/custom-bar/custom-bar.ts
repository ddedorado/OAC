import { Component, Input } from '@angular/core';
import { Events, NavController, AlertController } from 'ionic-angular';
import { AppState, Robots } from '../../providers/providers';
import { File } from '@ionic-native/file';

@Component({
  selector: 'custom-bar',
  templateUrl: 'custom-bar.html',
  providers: [Robots]
})
export class CustomBarComponent {

  _title: string = '';
  _robots: boolean = false;
  _options: boolean = false;
  _page: string ='';
  _enableSave: boolean = false;
  _enableDelete: boolean = false;
  _colorDelete: string = 'black';
  _actionsToDelete: any = [];
  _mgoptions: boolean = false;
  _comments: boolean = false;
  _isHome: boolean = false;
  _program: string = '';

  constructor( 
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private events: Events,
    public appState: AppState,
    public robotsSvc: Robots,
    public file: File
  ) {

    this.appState.getProgram().then( val => {
      this._program = val;
    } );

    this.events.subscribe('setEndPos', (endPos) => {
      console.log("EVENTO:", endPos);
      this._enableSave = endPos;
    } );

    this.events.subscribe( 'resetDelete', () => {
      this._actionsToDelete = [];
      this._enableDelete = false;
      this._colorDelete = 'black';
    } );

    this.events.subscribe('enableDelete', (indexAction, type) => {
      console.log("enableDelete:", indexAction, type);

      if ( indexAction < 0 ) {

        let tempActions = this._actionsToDelete.filter(function(el) {
            return el.type !== type;
        });

        this._actionsToDelete = tempActions;
      
      } else {

        this._actionsToDelete.push(
          { 'index': indexAction, 'type': type }
        )
      }

      if ( this._actionsToDelete.length == 0 ) {

        this._enableDelete = false;
        this._colorDelete = 'black';

      } else {
        
        this._enableDelete = true;
        this._colorDelete = 'orange';
      }

      console.log("enableDelete:", this._actionsToDelete);

    });

    this.events.subscribe('enableDeleteBtn', active => 
    {
      if (!active) 
      {
        this._enableDelete = false;
        this._colorDelete = 'black';
      }
      else 
      {
        this._enableDelete = true;
        this._colorDelete = 'orange';
      }
    });
  }

  navPage ( page ) {

    this.navCtrl.push( page );
  }

  createProgram () {
    this.openAlert( '<h2>Please, set a name for a program:</h2>', this.validateForm );
  }

  openAlert( msg, success ) {

    let settings = {
      title: 'Program Name',
      message: msg,
      inputs: [
        {
          id: 'programName',
          name: 'program',
          placeholder: 'Program Name',
          value: this._program
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel button Click handler');
          }
        },
        {
          text: 'Create',
          handler: (data) => {
            console.log('Create New Program button Click handler - Data: ' + data); 
            success( data, this );
          }    
        }
      ]
    }

    let alert = this.alertCtrl.create( settings );

    alert.present();
  }

  openDeleteAlert () {

    let settings = {
      title: '',
      message: 'Are you sure you want to delete these actions?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            console.log('Cancel button Click handler');
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.deleteAction();
          }    
        }
      ]
    }

    let alert = this.alertCtrl.create( settings );

    alert.present();

  }

  deleteAction () {
    this.events.publish( 'deleteAction', this._actionsToDelete );
  }

  validateForm (data, context?:any) {

    console.log(data);
    if ( data.program != '' && data.program.length > 0 )  {
      context.appState.setProgram( data.program );
      context._program = data.program;
    } else {

      console.error('Text input had incorrect value (is empty).');
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

  saveProgramInDevice(task = 'T_ROB_L') {
    console.log(`saveProgramInDevice(${task}) - INIT`);
    console.log('this.file.dataDirectory = ', this.file.dataDirectory);
    this.file.createFile(this.file.dataDirectory, `${this._program}-${task}.mod`, true)
      .then(_ => 
        {
          console.log('CreateFile Success!!!');
          this.robotsSvc.getModuleAsText(
            task,
            (data, textStatus, xhr) => 
            {
              if (xhr.status == 200) 
              {
                console.log("saveProgramInDevice() - GetModuleAsText - status: 200");
                let fileAsString: string = data._embedded._state[0]["module-text"];
                console.log("saveProgramInDevice() - GetModuleAsText - data: ", fileAsString);
                fileAsString = decodeURIComponent(fileAsString);
                console.log("saveProgramInDevice() - GetModuleAsText - data: ", fileAsString);
                fileAsString = fileAsString.substring(fileAsString.indexOf(";") + 1);
                console.log("saveProgramInDevice() - GetModuleAsText - data: ", fileAsString);

                this.file.writeFile(this.file.dataDirectory, `${this._program}-${task}.mod`, fileAsString, {replace:true})
                  .then(_ => 
                  {
                    console.log('Write in file success!!!');
                    if (task == 'T_ROB_L') 
                    {
                      this.saveProgramInDevice('T_ROB_R');
                    } 
                    else 
                    {
                      console.log("saveProgramInDevice() - SUPER SAVED");
                      this.showMsg('Program Saved', 'info');
                    }
                  })
                  .catch(err => 
                  {
                    console.error('Write in file ERROR!!!: ', err);
                  });
              } 
              else 
              {
                console.log("saveProgramInDevice() - getModuleAsText - No 200 status: " + xhr.status );
              }
            },
            (err) => {
              console.log("saveProgramInDevice() - getModuleAsText - Error: " + err.statusText );
            }
          );
        })
      .catch(err => 
        {
          console.error('CreateFile ERRORR!!!');
          console.error(err);
        });

  }

  saveProgram (task = 'T_ROB_L') {
    console.log(`saveProgram(${task}) - INIT`);
    let value = true;
    if (value)
    {
      this.saveProgramInDevice();
      return;
    }

    if ( this._program != undefined && this._program != '' ) 
    {
      console.log("saveProgram() - TASK:" + task );
      this.robotsSvc.setProgramName(
        task,
        this._program,
        (data, textStatus, xhr) => 
        {
          if (xhr.status == 204) 
          {
            console.log("saveProgram() - SetProgramName - status: 204" );
            this.robotsSvc.saveProgram(
              task,
              this._program,
              (data, textStatus, xhr) => 
              {
                if (xhr.status == 204) 
                {
                  console.log("saveProgram() - Save Program - status: 204" );
                  if ( task == 'T_ROB_L' ) 
                  {
                    this.saveProgram( 'T_ROB_R' );
                  } 
                  else 
                  {
                    console.log("saveProgram() - SUPER SAVED" );
                    this.showMsg( 'Program Saved', 'info' );
                  }
                } 
                else 
                {
                  console.log("saveProgram() - Save Program - No 204 status: " + xhr.status );
                }
              },
              (err) => {
                console.log("saveProgram() - SaveProgram - Error: " + err.statusText );
              }
            );            
          } 
          else 
          {
            console.log("saveProgram() - SetProgramName - No 204 Status: " + xhr.status );
          }
        },
        (err) => {
          console.log("saveProgram() - SetProgramName - Error: " + err.statusText );
        }
      );
    } 
    else 
    {
      console.log("saveProgram() - Error - No Program name: " + this._program );
      this.showMsg('<h2>First, create a program please.</h2>');
    }
  }

  @Input()
  set title ( title: string ) {
    this._title = title;
  }

  get title () {
    return this._title;
  }

  @Input()
  set robots ( robots: boolean ) {
    this._robots = robots;
  }

  get robots () {
    return this._robots;
  }

  @Input()
  set options ( options: boolean ) {
    this._options = options;
  }

  get options () {
    return this._options;
  }

  @Input()
  set mgoptions ( mgoptions: boolean ) {
    this._mgoptions = mgoptions;
  }

  get mgoptions () {
    return this._mgoptions;
  }

  @Input()
  set comments ( comments: boolean ) {
    this._comments = comments;
  }

  get comments () {
    return this._comments;
  }

  @Input()
  set home ( isHome: boolean ) {
    this._isHome = isHome;
  }

  get home () {
    return this._isHome;
  }

  @Input()
  set page ( page: string ) {
    this._page = page;
  }

  get page () {
    return this._page;
  }
}
