import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LoadProgramPage } from './load-program';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    LoadProgramPage,
  ],
  imports: [
    IonicPageModule.forChild(LoadProgramPage),
    ComponentsModule
  ],
})
export class LoadProgramPageModule {}
