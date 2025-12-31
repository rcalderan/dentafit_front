import { bootstrapApplication } from '@angular/platform-browser';
import { rentafitConfig } from './rentafit/rentafit.config';
import { RentafitComponent } from './rentafit/rentafit';

bootstrapApplication(RentafitComponent, rentafitConfig)
  .catch((err) => console.error(err));
