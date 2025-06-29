import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu-options',
  standalone: false,
  templateUrl: './menu-options.component.html',
  styleUrl: './menu-options.component.scss'
})
export class MenuOptionsComponent {
  @Output() ChosenOption = new EventEmitter<string>() ;
  code: string = "asd@fawoi"
  startingGame : boolean = false;
  choosingRole : boolean = false;
  hasRoom : boolean = false;
  role : string = "Hunter"
  teamRole : string = "Create"
  teamingUp : boolean = false;

  constructor(private router :  Router){}
  emitChosenOption(option : string){
    this.ChosenOption.emit(option)
  }
  teamUp(event : string){
    if(event == "Start"){
      this.teamingUp = true;
    }else if(event == "End"){
      this.teamingUp = false;
    }else{
      this.teamRole = event;
    }
  }
  chooseRole(role:string){
    if(role == "Start"){
      this.choosingRole = true;
    }else if(role == "End"){
      this.choosingRole = false;
    }else{
      this.role = role;
    }
  }
  startGame(){
    this.startingGame = true;
  }
  goToGame(){
    this.router.navigate(['/Game'])
  }
}
