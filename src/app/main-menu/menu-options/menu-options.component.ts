import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { SignalRService } from '../../services/signal-r.service';

@Component({
  selector: 'app-menu-options',
  standalone: false,
  templateUrl: './menu-options.component.html',
  styleUrl: './menu-options.component.scss'
})
export class MenuOptionsComponent implements OnInit {
  @Output() ChosenOption = new EventEmitter<string>();
  startingGame: boolean = false;
  choosingRole: boolean = false;
  hasRoom: boolean = false;
  role: string = "Hunter"
  teamRole: string = "Create"
  teamingUp: boolean = false;
  roomCode: string = "";
  inputValue: string = "";
  waiting: boolean = false;
  status = "";
  constructor(private router: Router, private signalRService: SignalRService) { }
  async ngOnInit() {
    await this.signalRService.startConnection();
    this.signalRService.onStartGame((roomCode, players) => {
      sessionStorage.setItem('RoomCode',this.hasRoom ? this.inputValue : this.roomCode)
      this.router.navigate(['/Game']);
    });
  }
  emitChosenOption(option: string) {
    this.ChosenOption.emit(option)
  }
  teamUp(event: string) {
    if (event == "Start") {
      this.teamingUp = true;
    } else if (event == "End") {
      this.teamingUp = false;
    } else {
      this.teamRole = event;
    }
  }
  chooseRole(role: string) {
    if (role == "Start") {
      this.choosingRole = true;
    } else if (role == "End") {
      this.choosingRole = false;
    } else {
      this.role = role;
    }
  }
  async startGame() {
    this.startingGame = true;
    const response = await this.signalRService.getRoomCode()
    if (response.status) {
      if (response.response.success) {
        this.roomCode = response.response.data
      }
    }
  }
  async goToGame() {
    if (this.hasRoom) {
      const joined = await this.onJoinRoom(this.inputValue);
      if (joined) {
        this.roomCode = this.inputValue
        sessionStorage.setItem('Role',this.role)
        this.signalRService.startGame(this.roomCode)
      } else {
        this.status = "Room Not Found"
      }
    } else {
      const created = await this.onCreateRoom();
      if (created) {
        this.waiting = true;
      } else {
        this.status = "Could not create Room"
      }
    }
  }
  createNewRoom(){
    this.hasRoom = false;
    this.status = "";
    this.inputValue = "";
  }
  joinExistingRoom(){
    this.hasRoom = true;
    this.status = "";
  }
  async onCreateRoom(): Promise<boolean> {
    try {
      const response = await this.signalRService.createRoom(this.role, this.roomCode);
      sessionStorage.setItem('Role',this.role)
      return response?.status && response?.response?.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  }


  async onJoinRoom(inputCode: string): Promise<boolean> {
    try {
      const response = await this.signalRService.joinRoom(inputCode);
      const resp = response.status && response.response.success
      if(resp){
        this.role = response.response.data.role;
        sessionStorage.setItem('Role',response.response.data.role)
        sessionStorage.setItem('RoomState', response.response.data.roomState)
      }
      return resp;
    } catch (err) {
      return false;
    }

  }


}
