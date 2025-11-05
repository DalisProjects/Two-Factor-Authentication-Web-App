import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  credentialsvalid: boolean = true;
  qrCodeImage: string = ''; // Store QR code image URL
  otp: string = ''; // OTP entered by user
  email: string = ''; // Store email for OTP verification
  private password: string = '';

  constructor(public authservice: AuthService, private http: HttpClient, private router: Router) {}

  doLogin(form: NgForm) {
    const email = form.value.email;
    this.password = form.value.password;

    this.http.get<any>(`http://localhost:3000/api/users/${email}`).subscribe({
      next: (user) => {
        if (user && user.password === this.password) {
          this.email = email;

          // Check for 2FA setup
          this.http.get<any>(`http://localhost:3000/api/generate-2fa/${email}`).subscribe({
            next: (response) => {
              this.qrCodeImage = response.imageUrl;
              this.showModal(); // Show the modal for 2FA
            },
            error: (err) => {
              console.error('Failed to generate 2FA QR code', err);
            },
          });
        } else {
          this.credentialsvalid = false;
        }
      },
      error: (err) => {
        console.error('Login failed', err);
        this.credentialsvalid = false;
      },
    });
  }

  verifyOTP(otp: string, email: string) {
    this.http.post('http://localhost:3000/api/verify-2fa', { email, otp }).subscribe({
      next: () => {
        alert('Login successful with 2FA!');
        this.router.navigate(['']);
        this.authservice.login(email, this.password);
        this.hideModal(); // Hide the modal after successful verification
      },
      error: (err) => {
        alert('Invalid OTP. Please try again.');
        console.error('Error verifying OTP:', err);
      },
    });
  }

  private showModal() {
    const modalElement = document.getElementById('authModal');
    const bootstrapModal = new (window as any).bootstrap.Modal(modalElement);
    bootstrapModal.show();
  }

  private hideModal() {
    const modalElement = document.getElementById('authModal');
    const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modalElement);
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
  }
}
