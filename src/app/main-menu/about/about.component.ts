import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: false,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  @Output() ChosenOption = new EventEmitter<string>() ;

  emitChosenOption(option : string){
    this.ChosenOption.emit(option)
  }
}
