import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit  {
  title = 'ChickenHunt';
  ngOnInit(): void {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      alert('Yo hunter, this app is not available on mobile, go on take out your pc, call you friend to play!');
      window.location.href = 'https://google.com'; // or a landing page, or just show a blank screen
    }
  }


}
