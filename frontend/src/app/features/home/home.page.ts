import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css']
})
export class HomePage {
  auth = inject(AuthStore);
  private router = inject(Router);

  goToDashboard(){
    this.router.navigateByUrl('/dashboard');
  }
}
