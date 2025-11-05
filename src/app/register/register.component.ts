import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../auth.service';




@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  emailError: boolean = false;
  PasswordError: boolean = false;
  EmailUsed: boolean = false;
  confirmPassword: string = ''; // Add confirmPassword property
  email: string = ''; // Property to bind to the email input field
  verificationCode: string = '';
  showVerificationCodeInput: boolean = false;
  verificationAttempted: boolean = false; // Flag to track if verification has been attempted
  verificationSuccess: boolean = false; // Flag to track if verification was successful
  verificationInput: string = ''; // Input field for verification code
  sub: string = '';
  reqhtml: string = '';
  canSendEmail: boolean = true;
  endTime: number = 0;
  type: string ='';
  returnUrl: any = [];
  qrCodeImage: string = ''; // Store QR code image URL
  otp: string = ''; // OTP entered by user
  twoFactorSecret: string = '';
  QRCODESUCCESS: boolean | null = null; // Flag to track if verification was successful



  constructor(public authService:AuthService, private route: ActivatedRoute,  private http: HttpClient, private router: Router) { }


  ngOnInit(): void {
    this.endTime = Date.now() + 59000; // 59000 milliseconds = 59 seconds
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
      // Navigate to the returnUrl after successful login or registration
      console.log(this.returnUrl)
  });
  }
 


  validateEmail(email: string): boolean {
    // Regular expression to check email format
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }
  verifyCode() {
   
    if (this.verificationInput === this.verificationCode && !this.emailError) {
      this.verificationSuccess = true;
      this.showVerificationCodeInput = false;
    } else {
      this.verificationSuccess = false;
    }
    this.verificationAttempted = true;
  }

  generateVerificationCode(): string {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min + '';
  }

  sendConfirmationEmail() {
    if (!this.validateEmail(this.email)) {
      this.emailError = true;
      this.EmailUsed = false;
      return;
    }
  
    this.http.get<any>(`http://localhost:3000/api/users/${this.email}`)
      .subscribe({
        next: () => {
          // User already exists
          this.EmailUsed = true;
          this.emailError = false;
        },
        error: (error) => {
          // Handle case where user does not exist or unexpected error
          if (error.status === 404) {
            // Email not in use, proceed with sending confirmation email
            this.createAndSendConfirmationEmail();
          } else {
            console.error('Unexpected error:', error);
            this.EmailUsed = true; // Set EmailUsed to true for unknown errors
            this.emailError = false;
          }
        }
      });
  }
  


passwordValidator(password: string): boolean {
  const minLength = 8; // Minimum length requirement
  const hasNumber = /\d/.test(password); // Check for at least one number
  const hasUppercase = /[A-Z]/.test(password); // Check for at least one uppercase letter
  const hasLowercase = /[a-z]/.test(password); // Check for at least one lowercase letter

  return (
      password.length >= minLength && hasNumber && hasUppercase && hasLowercase);
}

createAndSendConfirmationEmail() {
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

  this.verificationCode = this.generateVerificationCode();
  const sub = "Email Verification For IDP Website: ";
  console.log(this.verificationCode)
  const reqhtml= ` 
  <html><p>Thank you for using our website.</p>
  <p>Please copy this code:<br><br> <span style="font-size: 22px; background-color: #f0f0f0; padding: 5px;">${this.verificationCode}</span></p>
</html>`;
 this.authService.SendEmail(this.email, sub, reqhtml)
        this.showVerificationCodeInput = true;
        this.emailError = false;
        this.EmailUsed = false;
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
  register(reg: NgForm) {
    const newUser = {
      username: reg.value.username || '',
      email: this.email,
      password: reg.value.password,
      secretkey: this.twoFactorSecret,
    };
    console.log(newUser)
    if (!this.passwordValidator(reg.value.password)) {
      this.PasswordError = true;
      setTimeout(() => {
        this.PasswordError = false;
      }, 10000);
      return;
    }
    else{this.PasswordError = false;}
    
  if (!this.validateEmail(this.email)) {
    this.emailError = true;
    return;
  }
  else{this.emailError = false;}

   
   this.http.post<any>('http://localhost:3000/api/users', newUser)
   .subscribe({
     next: (data) => {
       console.log('User registered successfully !');
       this.authService.LoggedInUser.email = this.email;
       reg.resetForm(); // Reset the form
       this.router.navigateByUrl("/login");
        this.sub = "Account registered successfully";
        this.reqhtml= ` <html>  <p>Your account has been successfully created.</p>
                </html>`;
     

      this.authService.SendEmail(this.email, this.sub, this.reqhtml)
      this.showVerificationCodeInput = true;
      this.emailError = false;
      this.EmailUsed = false;
     },
     error: (error) => {
       console.error('Failed to register user:', error);
       if (error.error && error.error.error === 'This Email Address is already in use !') {
         // Set emailError to true to display the alert in the template
         this.emailError = true;
       } else {
       }
     }
   });
  }

}
