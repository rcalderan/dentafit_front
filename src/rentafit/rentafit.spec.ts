import { TestBed } from '@angular/core/testing';
import { RentafitComponent } from './rentafit';

describe('RentafitComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentafitComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(RentafitComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
