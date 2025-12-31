import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'rentafit-root',
  imports: [RouterOutlet],
  templateUrl: './rentafit.html',
  styleUrl: './rentafit.css'
})
export class RentafitComponent {
  protected readonly title = signal('RentAFit');
}
