import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SaveProgramPage } from './save-program';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    SaveProgramPage,
  ],
  imports: [
    IonicPageModule.forChild(SaveProgramPage),
    ComponentsModule
  ],
})
export class SaveProgramPageModule {}
