import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuardLogin implements CanActivate {
  constructor( public authService: AuthService, private router: Router) {
    this.authService.retrieveUserData()
  }

  canActivate(): boolean {
        if (this.authService.isLoggedIn) {
      this.router.navigate([""]);
      return false; // Prevent access to the login page
    } else {
      return true; // Allow access to the login page if not logged in
    }
  }
}
