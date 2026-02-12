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

  it('should render title', () => {
    const fixture = TestBed.createComponent(RentafitComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading?.textContent ?? '').toContain('Hello, RentAFit');
  });
});
