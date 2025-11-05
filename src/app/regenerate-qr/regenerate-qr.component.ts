import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-regenerate-qr',
  templateUrl: './regenerate-qr.component.html',
  styleUrls: ['./regenerate-qr.component.css']
})
export class RegenerateQrComponent implements OnInit {
constructor( public authService: AuthService, private http: HttpClient, private router: Router) { }

  email: string = ''; // Property to bind to the email input field
UserExists: boolean = true;
verificationCode: string = '';
showVerificationCodeInput: boolean = false;
verificationAttempted: boolean = false; // Flag to track if verification has been attempted
verificationSuccess: boolean = false; // Flag to track if verification was successful
verificationInput: string = ''; // Input field for verification code
verifiedemail: string = '';
EmailNotVerified: boolean = false;
passcode: string = '';
confirmPasscode: string = '';
canSendEmail: boolean = true;
endTime: number = 0;
qrCodeImage: string = ''; // Store QR code image URL
otp: string = ''; // OTP entered by user
twoFactorSecret: string = '';
QRCODESUCCESS: boolean | null = null; // Flag to track if verification was successful

ngOnInit(): void {
  this.endTime = Date.now() + 59000; // 59000 milliseconds = 59 seconds
  
}

generateVerificationCode(): string {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min + '';
}

SendConfirmationEmail() {
  if (!this.canSendEmail) {
    return;
  }
  // Set a timeout of 59 seconds
  this.endTime = Date.now() + 59000;
  this.canSendEmail = false;
  setTimeout(() => {
    this.canSendEmail = true;
    this.endTime = Date.now() + 59000;
  }, 59000);

  this.http.get<any>(`http://localhost:3000/api/users/${this.email}`)
  .subscribe({
    next: () => {
      this.verificationCode = this.generateVerificationCode();
  // Send confirmation email
  const reqhtml = `<p>Your Code is:</p>
  <p> <span style="font-size: 22px; background-color: #f0f0f0; padding: 5px;">${this.verificationCode}</span></p>
  <p>Copy and paste it in the code area ! then click confirm</p>
  <p>Thank you for using our services</p>`
  this.authService.SendEmail(this.email, "QR Code Regeneration", reqhtml);   
  this.showVerificationCodeInput = true;
  this.UserExists = true;
    },
    error: (error) => {
      // User does not exist, proceed with sending confirmation email
      if (error.status === 404) {
        this.UserExists = false;
      } else {
        console.error('Error checking user existence:', error);
        this.UserExists = false;

      }
    }
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
verifyOTP(otp: string, email: string) {
  this.http.post('http://localhost:3000/api/register/verify-2fa', { email, otp }).subscribe({
    next: () => {
      this.QRCODESUCCESS = true;
      this.hideModal();
      this.http.put('http://localhost:3000/api/users/email/' + this.email, {secretkey: this.twoFactorSecret})
      .subscribe({
        next: (data) => {
          console.log('secretkey updated successfully');    
        },
        error: (error) => {
          console.error('Failed to update secretkey:', error);
        }
      });
    },
    error: (err) => {
      this.QRCODESUCCESS = false;
      console.error('Error verifying OTP:', err);
    },
  });
}

  // Check for 2FA setup
  QRCODE(email: string){
  this.http.get<any>(`http://localhost:3000/api/generate-2fa/${email}`).subscribe({
    next: (response) => {
      this.qrCodeImage = response.imageUrl;
      this.twoFactorSecret = response.secret; // Save the secret for later use
      this.showModal(); // Show the modal for 2FA
    },
    error: (err) => {
      console.error('Failed to generate 2FA QR code', err);
    },
  });
  }
verifyCode() {
  if (this.verificationInput === this.verificationCode && this.UserExists) {
    this.verificationSuccess = true;
    this.showVerificationCodeInput = false;
    this.verifiedemail = this.email;

  } else {
    this.verificationSuccess = false;
  }
  this.verificationAttempted = true;
}
get countdownMessage(): string {
  if (!this.canSendEmail) {
    const secondsRemaining = Math.ceil((this.endTime - Date.now()) / 1000);
    return `Please wait ${secondsRemaining} secondes before you get another code.`;
  }
  return '';
}
fp(reg: NgForm){
  this.http.put('http://localhost:3000/api/users/email/' + this.email, {secretkey: this.twoFactorSecret})
      .subscribe({
        next: (data) => {
          console.log('secretkey updated successfully');   
          this.router.navigateByUrl("");


        },
        error: (error) => {
          console.error('Failed to update secretkey:', error);
        }
      });

}
}
