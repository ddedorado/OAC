import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomHeaderComponent } from './custom-header/custom-header';
import { CustomBarComponent } from './custom-bar/custom-bar';
import { IonicModule } from "ionic-angular";
import { ManualGuidingActionsComponent } from './manual-guiding-actions/manual-guiding-actions';

@NgModule({
	declarations: [ 
    CustomHeaderComponent,
    CustomBarComponent,
    ManualGuidingActionsComponent 
  ],
	imports: [ CommonModule, IonicModule ],
	exports: [ 
    CustomHeaderComponent,
    CustomBarComponent,
    ManualGuidingActionsComponent
  ],
	schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ComponentsModule {}
