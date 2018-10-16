import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManualGuidingPage } from './manual-guiding';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    ManualGuidingPage,
  ],
  imports: [
    IonicPageModule.forChild(ManualGuidingPage),
    ComponentsModule
  ],
})
export class ManualGuidingPageModule {}
