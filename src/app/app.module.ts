import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';

import { AppComponent } from './app.component';

import { StrategiesService } from './strategies/strategies.service';
import { PlotsService } from './plots/plots.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatSelectModule,
    BrowserAnimationsModule,
    MatSidenavModule
  ],
  providers: [
    StrategiesService,
    PlotsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
