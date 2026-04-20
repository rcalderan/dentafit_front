import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'rentafit-global-loader',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (loading.isLoading$ | async) {
      <div class="global-loader-bar"></div>
    }
  `,
  styles: [`
    .global-loader-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
      background-size: 200% 100%;
      animation: loader-slide 1.2s ease-in-out infinite;
      z-index: 9999;
    }
    @keyframes loader-slide {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class GlobalLoaderComponent {
  protected readonly loading = inject(LoadingService);
}
