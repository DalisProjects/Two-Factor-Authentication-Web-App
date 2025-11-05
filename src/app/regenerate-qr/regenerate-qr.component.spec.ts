import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegenerateQrComponent } from './regenerate-qr.component';

describe('RegenerateQrComponent', () => {
  let component: RegenerateQrComponent;
  let fixture: ComponentFixture<RegenerateQrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegenerateQrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegenerateQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
