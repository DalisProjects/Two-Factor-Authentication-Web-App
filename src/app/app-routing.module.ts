import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { LandingComponent } from './landing/landing.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthGuardLogin } from './auth.logged';
import { RegenerateQrComponent } from './regenerate-qr/regenerate-qr.component';




const routes: Routes = [
  {path:"",component:LandingComponent},
  {path:"login", component: LoginComponent, canActivate: [AuthGuardLogin]},
  {path:"register", component: RegisterComponent, canActivate: [AuthGuardLogin]},
  {path:"forgotpassword",component:ForgotpasswordComponent}, 
  {path:"regenerate", component: RegenerateQrComponent},
  
  




];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
