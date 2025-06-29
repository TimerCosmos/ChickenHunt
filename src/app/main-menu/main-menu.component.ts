import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-menu',
  standalone: false,
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss'
})
export class MainMenuComponent implements OnInit {
  Sound:boolean = true
  CurrentScreen : string = "MainMenu"
  ngOnInit(): void {
    this.cursorAnimation();
  }
  cursorAnimation() {
    document.addEventListener('click', (e) => {
      const explosion = document.getElementById('explosion')!;
      explosion.style.left = `${e.clientX - 23}px`; // center it
      explosion.style.top = `${e.clientY - 9}px`;
      explosion.style.display = 'block';
      setTimeout(() => {
        explosion.style.display = 'none';
      }, 20);
    });
  }
  soundChange(){
    this.Sound = !this.Sound;
  }
  receiveChosenOption(event:any){
    this.CurrentScreen = event;
  }
}
