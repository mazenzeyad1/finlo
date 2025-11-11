import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/core/http/api.interceptor';
import { authTokenInterceptor } from './app/core/http/auth-token.interceptor';

import './styles.css';
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([apiInterceptor, authTokenInterceptor])),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
