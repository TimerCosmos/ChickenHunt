import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-instructions',
  standalone: false,
  templateUrl: './instructions.component.html',
  styleUrl: './instructions.component.scss'
})
export class InstructionsComponent {
  @Output() ChosenOption = new EventEmitter<string>() ;

  emitChosenOption(option : string){
    this.ChosenOption.emit(option)
  }
}
