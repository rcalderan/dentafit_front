import { TestBed } from '@angular/core/testing';
import { SystemComponent } from './system.component';

describe('SystemComponent', () => {
  const makeFixture = () => {
    const fixture = TestBed.createComponent(SystemComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemComponent],
    }).compileComponents();
  });

  it('cria o componente', () => {
    expect(makeFixture().componentInstance).toBeTruthy();
  });

  it('renderiza os cards de estatísticas e preços', () => {
    const element: HTMLElement = makeFixture().nativeElement;
    const titles = Array.from(element.querySelectorAll('.section-title')).map(t => t.textContent?.trim());
    expect(titles).toEqual(['Estatísticas de Uso', 'Configuração de Preços']);
  });
});
