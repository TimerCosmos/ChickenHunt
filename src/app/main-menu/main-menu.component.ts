import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-main-menu',
  standalone: false,
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss'
})
export class MainMenuComponent implements OnInit, OnDestroy {
  removeClickListener: () => void;
  Sound: boolean = true
  CurrentScreen: string = "MainMenu"

  constructor(private renderer: Renderer2, private el: ElementRef) {
    this.removeClickListener = this.renderer.listen('document', 'click', (e) => {
      const explosion = document.getElementById('explosion')!;
      explosion.style.left = `${e.clientX - 23}px`; // center it
      explosion.style.top = `${e.clientY - 9}px`;
      explosion.style.display = 'block';
      setTimeout(() => {
        explosion.style.display = 'none';
      }, 20);
    });
  }
  ngOnDestroy(): void {
    this.removeClickListener();
  }

  ngOnInit(): void {
  }
  soundChange() {
    this.Sound = !this.Sound;
  }
  receiveChosenOption(event: any) {
    this.CurrentScreen = event;
  }
}
