import { TestBed } from '@angular/core/testing';
import { RentafitComponent } from './rentafit';
import { APP_CONFIG } from './shared/data/app-config.token';

describe('RentafitComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentafitComponent],
      providers: [
        { provide: APP_CONFIG, useValue: { appName: 'RentAFit' } }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(RentafitComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
