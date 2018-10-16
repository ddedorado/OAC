import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-save-program',
  templateUrl: 'save-program.html',
})
export class SaveProgramPage {

  title: string = 'Save Program';
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SaveProgramPage');
  }
}
