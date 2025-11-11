import{i as m,a as x,b as w,S as k,s as g,t as C,ɵ as M,c as y,d as n,e as t,f as s,g as p,k as r,l as i,C as P,N as v,n as O,q as d,m as h,o as S,h as F,p as T,r as I,j as R,u as b}from"./index-CoAdiQa4.js";import{F as N,V as f,R as A,ɵ as V,D,N as G,a as j,b as z,c as $}from"./forms-BBCdHGSS.js";function q(o,a){if(o&1&&(n(0,"p",10),t(1),s()),o&2){const e=d(2);r(),b(e.errorMessage())}}function L(o,a){if(o&1){const e=S();n(0,"form",4),F("ngSubmit",function(){T(e);const u=d();return I(u.submit())}),n(1,"label"),t(2," Work email "),R(3,"input",5),s(),p(4,q,2,1,"p",6),n(5,"button",7),t(6),s(),n(7,"p",8),t(8," Remembered your password? "),n(9,"a",9),t(10,"Back to sign in"),s()()()}if(o&2){const e=d();i("formGroup",e.form),r(3),i("disabled",e.status()==="submitting"),r(),i("ngIf",e.errorMessage()),r(),i("disabled",e.status()==="submitting"),r(),h(" ",e.status()==="submitting"?"Sending link…":"Send reset link"," ")}}function B(o,a){if(o&1&&(n(0,"p",14),t(1," Dev preview token: "),n(2,"code"),t(3),s()()),o&2){const e=d(2);r(3),b(e.devResetToken())}}function E(o,a){if(o&1&&(n(0,"div",11)(1,"h2"),t(2,"Check your inbox"),s(),n(3,"p"),t(4),s(),p(5,B,4,1,"p",12),n(6,"a",13),t(7,"Already have a link?"),s()()),o&2){const e=d();r(4),h("If we found ",e.form.controls.email.value,", a reset link is on the way."),r(),i("ngIf",e.devResetToken())}}const l=class l{constructor(){this.fb=m(N),this.authApi=m(x),this.authStore=m(w),this.destroy$=new k,this.status=g("idle"),this.errorMessage=g(null),this.devResetToken=g(null),this.form=this.fb.nonNullable.group({email:["",[f.required,f.email]]})}submit(){if(this.status()==="submitting")return;if(this.form.invalid){this.form.markAllAsTouched(),this.errorMessage.set("Enter a valid email address.");return}this.status.set("submitting"),this.errorMessage.set(null),this.devResetToken.set(null);const{email:a}=this.form.getRawValue();this.authApi.forgotPassword(a).pipe(C(this.destroy$)).subscribe({next:e=>{this.status.set("sent"),this.devResetToken.set(e.token??null),this.authStore.setPostResetNotice("If the account exists, a reset email is on the way.")},error:e=>{var u;const c=((u=e==null?void 0:e.error)==null?void 0:u.message)??"We could not process the request. Try again later.";this.errorMessage.set(c),this.status.set("error")}})}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete()}};l.ɵfac=function(e){return new(e||l)},l.ɵcmp=M({type:l,selectors:[["app-forgot-password"]],standalone:!0,features:[y],decls:8,vars:2,consts:[[1,"auth-card"],[1,"muted"],["novalidate","",3,"formGroup","ngSubmit",4,"ngIf"],["class","success-state",4,"ngIf"],["novalidate","",3,"ngSubmit","formGroup"],["type","email","formControlName","email","placeholder","you@company.com",3,"disabled"],["class","error",4,"ngIf"],["type","submit",3,"disabled"],[1,"helper"],["routerLink","/auth/signin"],[1,"error"],[1,"success-state"],["class","dev-token",4,"ngIf"],["routerLink","/auth/reset-password",1,"btn"],[1,"dev-token"]],template:function(e,c){e&1&&(n(0,"section",0)(1,"header")(2,"h1"),t(3,"Forgot password"),s(),n(4,"p",1),t(5,"Tell us your email and we'll send a secure link to reset your password."),s()(),p(6,L,11,5,"form",2)(7,E,8,2,"div",3),s()),e&2&&(r(6),i("ngIf",c.status()!=="sent"),r(),i("ngIf",c.status()==="sent"))},dependencies:[P,v,A,V,D,G,j,z,$,O],styles:[`.auth-card[_ngcontent-%COMP%] {
      max-width: 460px;
      margin: 4rem auto;
      padding: 2.6rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {
      font-size: 1.9rem;
    }
    form[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
    }
    .error[_ngcontent-%COMP%] {
      color: #b91c1c;
      text-align: center;
      font-weight: 500;
    }
    .success-state[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      text-align: center;
      color: #1e3a8a;
    }
    .dev-token[_ngcontent-%COMP%] {
      font-size: 0.85rem;
      color: #0f172a;
      background: rgba(37, 99, 235, 0.09);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      word-break: break-all;
    }
    .btn[_ngcontent-%COMP%] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.85rem 1.5rem;
      background: #2563eb;
      color: #fff;
      border-radius: 999px;
      font-weight: 600;
      text-decoration: none;
    }
    code[_ngcontent-%COMP%] {
      font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }`]});let _=l;export{_ as ForgotPasswordPage};
