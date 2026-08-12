import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { APP_CONFIG } from './shared/data/app-config.token';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';

@Component({
  selector: 'rentafit-root',
  imports: [RouterOutlet, GlobalLoaderComponent],
  templateUrl: './rentafit.html',
  styleUrl: './rentafit.css'
})
export class RentafitComponent implements OnInit {
  private readonly config = inject(APP_CONFIG);
  private readonly titleService = inject(Title);
  title = signal(this.config.appName);

  ngOnInit(): void {
    this.titleService.setTitle(this.config.appName);
  }
}
