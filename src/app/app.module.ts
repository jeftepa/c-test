import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { StrategiesService } from './strategies/strategies.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    StrategiesService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
