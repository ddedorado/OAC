import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ConnectRobotPage } from './connect-robot';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    ConnectRobotPage,
  ],
  imports: [
    IonicPageModule.forChild(ConnectRobotPage),
    ComponentsModule
  ],
})
export class ConnectRobotPageModule {}
