import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { MainMenuComponent } from './main-menu/main-menu.component';

import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';

import { MenuOptionsComponent } from './main-menu/menu-options/menu-options.component';
import { InstructionsComponent } from './main-menu/instructions/instructions.component';
import { AboutComponent } from './main-menu/about/about.component';
@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    MainMenuComponent,
    MenuOptionsComponent,
    InstructionsComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatButtonModule, MatTooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
