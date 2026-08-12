import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();
  });

  it('renders title and message text', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('title', 'Info');
    fixture.componentRef.setInput('message', 'Hello world');
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h3');
    const message = fixture.nativeElement.querySelector('.modal-body p');

    expect(title?.textContent).toContain('Info');
    expect(message?.textContent).toContain('Hello world');
  });

  it('renders a list of messages and applies error style', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    fixture.componentRef.setInput('message', ['First', 'Second']);
    fixture.componentRef.setInput('type', 'error');
    fixture.detectChanges();

    const listItems = fixture.nativeElement.querySelectorAll('.error-list li');
    const container = fixture.nativeElement.querySelector('.modal-container');

    expect(listItems.length).toBe(2);
    expect(container?.classList.contains('error')).toBe(true);
  });

  it('emits close when clicking overlay and buttons', () => {
    const fixture = TestBed.createComponent(ModalComponent);
    const closeSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.modal-overlay')?.dispatchEvent(new MouseEvent('click'));
    fixture.nativeElement.querySelector('.close-btn')?.dispatchEvent(new MouseEvent('click'));
    fixture.nativeElement.querySelector('.btn')?.dispatchEvent(new MouseEvent('click'));

    expect(closeSpy).toHaveBeenCalledTimes(3);
  });
});
