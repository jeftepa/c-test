import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { HistoricalComponent } from './pages/historical/historical.component';
import { SimulationComponent } from './pages/simulation/simulation.component';
import { LiveComponent } from './pages/live/live.component';

import { StrategiesService } from './strategies/strategies.service';
import { PlotsService } from './plots/plots.service';
import { UtilsService } from './utils/utils.service';

const appRoutes: Routes = [
  { path: 'historical', component: HistoricalComponent },
  { path: 'simulation', component: SimulationComponent },
  { path: 'live', component: LiveComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    HistoricalComponent,
    SimulationComponent,
    LiveComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    FormsModule,
    MatSelectModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatButtonModule,
    MatAutocompleteModule
  ],
  providers: [
    StrategiesService,
    PlotsService,
    UtilsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
