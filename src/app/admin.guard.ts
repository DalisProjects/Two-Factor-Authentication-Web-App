import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

import { HttpClient, HttpHeaders} from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})

export class AdminGuard implements CanActivate {
    constructor(private http: HttpClient,  public authService: AuthService, private router: Router) {}
    private retrieveUserData(): void {
      // Retrieve user data from localStorage
      this.authService.isLoggedIn = JSON.parse(localStorage.getItem('userisLoggedIn')|| '') || '';
      this.authService.LoggedInUser.name = localStorage.getItem('userdataname') || '';
     
      this.authService.LoggedInUser.id = Number(localStorage.getItem('userdataid'))
      this.authService.LoggedInUser.password = localStorage.getItem('userdatapassword') || '';
      this.authService.LoggedInUser.email = localStorage.getItem('userdataemail') || '';
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
            this.authService.isLoggedIn = true;
            this.retrieveUserData();
          },
          error: (error) => {
            console.error('Failed to verify token:', error);
            // Token verification failed, remove token and log out user
            this.authService.logout();
          }
        });
    }  
  
    canActivate(): boolean {
        
        this.authService.isLoggedIn = JSON.parse(localStorage.getItem('userisLoggedIn') || '' );  

        this.router.navigate([""]); // Redirect to home page if not an admin
        return true;
      
    }
  }