import{i as u,R as x,A as M,a as y,b as P,S as w,s as m,t as O,ɵ as S,c as v,d as t,e as r,f as o,g as f,h as _,j as h,k as a,l as i,m as N,C as k,N as R,n as I,o as A,p as F,q as p,r as V,u as C}from"./index-CoAdiQa4.js";import{F as T,V as g,R as j,ɵ as D,D as q,N as G,a as L,b as $,c as z}from"./forms-BBCdHGSS.js";function E(c,l){if(c&1){const n=A();t(0,"div",13)(1,"span"),r(2),o(),t(3,"button",14),_("click",function(){F(n);const s=p();return V(s.dismissNotice())}),r(4,"Dismiss"),o()()}if(c&2){const n=p();a(2),C(n.authStore.postResetNotice())}}function U(c,l){if(c&1&&(t(0,"p",15),r(1),o()),c&2){const n=p();a(),C(n.errorMessage())}}const d=class d{constructor(){this.fb=u(T),this.router=u(x),this.route=u(M),this.authApi=u(y),this.authStore=u(P),this.destroy$=new w,this.status=m("idle"),this.errorMessage=m(null),this.form=this.fb.nonNullable.group({email:["",[g.required,g.email]],password:["",[g.required,g.minLength(8)]]})}submit(){if(this.status()==="submitting")return;if(this.form.invalid){this.form.markAllAsTouched(),this.errorMessage.set("Enter your email and password to continue.");return}this.status.set("submitting"),this.errorMessage.set(null);const l=this.form.getRawValue();this.authApi.signIn(l).pipe(O(this.destroy$)).subscribe({next:n=>{this.authStore.setSession(n.user,n.tokens),this.authStore.clearPostResetNotice(),this.status.set("idle");const e=this.route.snapshot.queryParamMap.get("redirectTo"),s=e&&e.startsWith("/")&&!e.startsWith("/auth/")?e:"/dashboard";this.router.navigateByUrl(s,{replaceUrl:!0})},error:n=>{var s;const e=((s=n==null?void 0:n.error)==null?void 0:s.message)??"Sign-in failed. Check your credentials and try again.";this.errorMessage.set(e),this.status.set("error")}})}dismissNotice(){this.authStore.clearPostResetNotice()}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}};d.ɵfac=function(n){return new(n||d)},d.ɵcmp=S({type:d,selectors:[["app-signin"]],standalone:!0,features:[v],decls:25,vars:7,consts:[[1,"auth-page"],[1,"auth-card"],[1,"muted"],["class","info-banner",4,"ngIf"],["novalidate","",3,"ngSubmit","formGroup"],["type","email","formControlName","email","placeholder","you@company.com",3,"disabled"],["type","password","formControlName","password","placeholder","••••••••",3,"disabled"],[1,"form-footer"],["routerLink","/auth/forgot-password"],["class","error",4,"ngIf"],["type","submit",3,"disabled"],[1,"helper"],["routerLink","/auth/signup"],[1,"info-banner"],["type","button",3,"click"],[1,"error"]],template:function(n,e){n&1&&(t(0,"div",0)(1,"section",1)(2,"header")(3,"h1"),r(4,"Sign in"),o(),t(5,"p",2),r(6,"Continue where you left off by entering your credentials."),o()(),f(7,E,5,1,"div",3),t(8,"form",4),_("ngSubmit",function(){return e.submit()}),t(9,"label"),r(10," Email address "),h(11,"input",5),o(),t(12,"label"),r(13," Password "),h(14,"input",6),o(),t(15,"div",7)(16,"a",8),r(17,"Forgot password?"),o()(),f(18,U,2,1,"p",9),t(19,"button",10),r(20),o()(),t(21,"p",11),r(22," Need an account? "),t(23,"a",12),r(24,"Create one"),o()()()()),n&2&&(a(7),i("ngIf",e.authStore.postResetNotice()),a(),i("formGroup",e.form),a(3),i("disabled",e.status()==="submitting"),a(3),i("disabled",e.status()==="submitting"),a(4),i("ngIf",e.errorMessage()),a(),i("disabled",e.status()==="submitting"),a(),N(" ",e.status()==="submitting"?"Signing in…":"Sign in"," "))},dependencies:[k,R,j,D,q,G,L,$,z,I],styles:[`.auth-page[_ngcontent-%COMP%] {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at 20% 20%, rgba(37,99,235,0.12), transparent 50%),
                  radial-gradient(circle at 80% 0%, rgba(59,130,246,0.08), transparent 45%),
                  radial-gradient(circle at 50% 100%, rgba(148,163,255,0.12), transparent 55%),
                  linear-gradient(180deg, #f9fbff 0%, #edf2fb 100%);
    }
    .auth-card[_ngcontent-%COMP%] {
      max-width: 440px;
      width: min(100%, 440px);
      padding: 2.5rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {
      font-size: 1.9rem;
      margin-bottom: 0.4rem;
    }
    form[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .info-banner[_ngcontent-%COMP%] {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      color: #1d4ed8;
      font-weight: 500;
    }
    .info-banner[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {
      border: none;
      background: rgba(37, 99, 235, 0.15);
      color: #1d4ed8;
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
    }
    .info-banner[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {
      background: rgba(37, 99, 235, 0.25);
    }
    label[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
    }
    input[_ngcontent-%COMP%] {
      padding: 0.8rem 1rem;
      border-radius: 10px;
      border: 1px solid #d0d7e6;
      font-size: 1rem;
    }
    input[_ngcontent-%COMP%]:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .form-footer[_ngcontent-%COMP%] {
      display: flex;
      justify-content: flex-end;
    }
    .form-footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {
      font-weight: 600;
      color: #2563eb;
      text-decoration: none;
    }
    .form-footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {
      text-decoration: underline;
    }
    button[_ngcontent-%COMP%] {
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button[disabled][_ngcontent-%COMP%] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .error[_ngcontent-%COMP%] {
      color: #b91c1c;
      text-align: center;
      font-weight: 500;
    }
    .helper[_ngcontent-%COMP%] {
      text-align: center;
      color: #64748b;
      font-size: 0.95rem;
    }
    .helper[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {
      color: #2563eb;
      font-weight: 600;
      text-decoration: none;
    }
    .helper[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {
      text-decoration: underline;
    }`]});let b=d;export{b as SignInPage};
