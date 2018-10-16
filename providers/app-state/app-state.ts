import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable()
export class AppState {

  private ROBOT_KEY: string = 'APP';

  public IP: any = { key: 'R_IP', value: '' };
  public USERNAME: any = { key: 'R_USERNAME', value: '' };
  public PASSWORD: any = { key: 'R_PASSWORD', value: '' };
  public R_MODULES_PATH: any = { key: 'R_M_PATH', value: '' };
  public CURRENT_PROGRAM: any = { key: 'PROGRAM', value: '' };
  public ROBOT_CONNECTED: any = { key: 'ROBOT_CONNECTED', value: ''};

  constructor( public storage: Storage ) {
    this.loadParams();
  }

  setDefault () {
    this.storage.set( this.IP.key, '192.168.125.1' );
    this.storage.set( this.USERNAME.key, 'Default User' );
    this.storage.set( this.PASSWORD.key, 'robotics' );
    this.storage.set( this.R_MODULES_PATH.key, '$HOME:/Concatel' );
  }

  loadParams () {

    this.getRobotIpDb().then( val => {
      this.IP.value = ( val ) ? val : '192.168.125.1';
    } );

    this.getUsernameDb().then( val => {
      this.USERNAME.value = ( val ) ? val : 'Default User';
    } );

    this.getPasswordDb().then( val => {
      this.PASSWORD.value = ( val ) ? val : 'robotics';
    } );

    this.getRobotModulesPathDb().then( val => {
      this.R_MODULES_PATH.value = ( val ) ? val : '$HOME:/Concatel';
    } );
  }

  set (key, value) {
    this[key].value = value;
    this.storage.set( this[key].key, value );
  }
  get (key) {
    return this[key].value;
  }

  setRobotIp (ip) {
    this.IP.value = ip;
    this.storage.set( this.IP.key, ip );
  }
  getRobotIp () {
    return this.IP.value;
  }
  getRobotIpDb () {
    return this.storage.get( this.IP.key );
  }

  setUsername (username) {
    this.USERNAME.value = username;
    this.storage.set( this.USERNAME.key, username );
  }
  getUsername () {
    return this.USERNAME.value;
  }
  getUsernameDb () {
    return this.storage.get( this.USERNAME.key );
  }

  setPassword (password) {
    this.PASSWORD.value = password;
    this.storage.set( this.PASSWORD.key, password );
  }
  getPassword () {
    return this.PASSWORD.value;
  }
  getPasswordDb () {
    return this.storage.get( this.PASSWORD.key );
  }

  setRobotModulesPath (path) {
    this.R_MODULES_PATH.value = path;
    this.storage.set( this.R_MODULES_PATH.key, path );
  }
  getRobotModulesPath () {
    return this.R_MODULES_PATH.value;
  }
  getRobotModulesPathDb () {
    return this.storage.get( this.R_MODULES_PATH.key );
  }

  setProgram (program) {
    this.CURRENT_PROGRAM.value = program;
    this.storage.set( this.CURRENT_PROGRAM.key, program );
  }

  destroyProgram() {
    return this.storage.remove( this.CURRENT_PROGRAM.key );
  }

  getProgram() {
    return this.storage.get( this.CURRENT_PROGRAM.key );
  }

  setRobot( robot ) {
    this.ROBOT_CONNECTED.value = robot;
    this.storage.set( this.ROBOT_KEY, robot );
  }

  destroyRobot() {
    this.storage.remove( this.ROBOT_KEY );
  }

  getRobot() {
    return this.storage.get( this.ROBOT_KEY );
  }
}
