import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})

export class AuthService {
  public deletionerror: boolean = false;
  
  public LoggedInUser = {
    email: '',
    name: '',
    id: 0,
    password: '',
  };
  emptydata = {
    email: '',
    name: '',
    id: 0,
    password: '',
  }; 
  isLoggedIn: boolean = false;

  constructor(private http: HttpClient, private router: Router) {
    this.retrieveUserData()
    // Check if token exists on application load
    const token = localStorage.getItem('token');
    if (token) {
      // Send token to server for verification
      this.verifyToken(token);
    }
  }
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'x-access-token': localStorage.getItem('token') || '', // Include token in the headers
    })};

  private verifyToken(token: string): void {
    // Send token to server for verification
    this.http.post<any>('http://localhost:3000/api/verifyToken', {}, this.httpOptions) // Pass httpOptions
      .subscribe({
        next: (data) => {
          // Token is valid, update authentication state
          this.isLoggedIn = true;
          this.retrieveUserData();
        },
        error: (error) => {
          console.error('Failed to verify token:', error);
          // Token verification failed, remove token and log out user
          this.logout();
        }
      });
  }  

  public retrieveUserData(): void {
    // Retrieve user data from localStorage
    const isLoggedInString = localStorage.getItem('userisLoggedIn');
    if (!isLoggedInString) {
      this.isLoggedIn = false;
      localStorage.setItem('userisLoggedIn', JSON.stringify(false));
  }
    // Retrieve other user data only if the user is logged in
    if (isLoggedInString) {
    // Retrieve user data from localStorage
    this.isLoggedIn = JSON.parse(isLoggedInString);
    this.LoggedInUser.name = localStorage.getItem('userdataname') || '';
    this.LoggedInUser.id = Number(localStorage.getItem('userdataid'))
    this.LoggedInUser.password = localStorage.getItem('userdatapassword') || '';
    this.LoggedInUser.email = localStorage.getItem('userdataemail') || '';
    }
  }
  
  login(email: string, password: string) {
    console.log(email, password)
    this.http.post<any>('http://localhost:3000/api/login', { email, password })
      .subscribe({
        next: (data) => {
          this.LoggedInUser= {
            email: email,
            name: data.user.username,
            id: data.user.id,
            password: data.user.password,
          };
          this.isLoggedIn = true;
          localStorage.setItem('token', data.token);
          localStorage.setItem('userdataname', data.user.username);
          localStorage.setItem('userdataid', data.user.id);
          localStorage.setItem('userdatapassword', password); // Store password securely if needed
          localStorage.setItem('userdataemail', email); // Store email if needed
          localStorage.setItem('userisLoggedIn', JSON.stringify(this.isLoggedIn));
          this.router.navigateByUrl("");
        },
        error: (error) => {
          console.error('Failed to login:', error);
        }
      });
  }


  logout() {
    if(this.isLoggedIn){
    }
    // Perform logout operations
    this.isLoggedIn = false;
    localStorage.clear();
    this.LoggedInUser = this.emptydata;
    // Redirect the user to the login page or wherever you want
    this.router.navigateByUrl('/login');
  }
  

  SendEmail(To: string, subject: string, content: string) {

    // Send confirmation email
    this.http.post<any>('http://localhost:3000/send-email', { email: To , subject: subject, html: content})
      .subscribe({ });
}

}