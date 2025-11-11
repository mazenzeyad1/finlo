import{i as f,R as P,a as S,b as O,S as T,s as m,t as C,ɵ as w,c as A,d as n,e as t,f as s,g as x,k as r,l as o,C as F,N as I,n as N,o as y,h,q as l,m as M,u as k,p as b,r as _,j as p}from"./index-CoAdiQa4.js";import{F as R,V as u,R as V,ɵ as U,D as j,N as q,a as z,b as G,c as D}from"./forms-BBCdHGSS.js";function L(i,a){if(i&1&&(n(0,"p",13),t(1),s()),i&2){const e=l(2);r(),k(e.errorMessage())}}function $(i,a){if(i&1){const e=y();n(0,"form",5),h("ngSubmit",function(){b(e);const d=l();return _(d.submit())}),n(1,"label"),t(2," Full name "),p(3,"input",6),s(),n(4,"label"),t(5," Work email "),p(6,"input",7),s(),n(7,"label"),t(8," Password "),p(9,"input",8),s(),x(10,L,2,1,"p",9),n(11,"button",10),t(12),s(),n(13,"p",11),t(14," Already have access? "),n(15,"a",12),t(16,"Sign in"),s()()()}if(i&2){const e=l();o("formGroup",e.form),r(3),o("disabled",e.status()==="submitting"),r(3),o("disabled",e.status()==="submitting"),r(3),o("disabled",e.status()==="submitting"),r(),o("ngIf",e.errorMessage()),r(),o("disabled",e.status()==="submitting"),r(),M(" ",e.status()==="submitting"?"Creating account…":"Create account"," ")}}function W(i,a){if(i&1&&(n(0,"p",23),t(1," Dev preview token: "),n(2,"code"),t(3),s()()),i&2){const e=l(2);r(3),k(e.verificationToken())}}function B(i,a){if(i&1&&(n(0,"div",24),t(1),s()),i&2){const e=l(2);r(),M(" ",e.resendMessage()," ")}}function E(i,a){if(i&1){const e=y();n(0,"div",14)(1,"h2"),t(2,"Account created"),s(),n(3,"p"),t(4),s(),x(5,W,4,1,"p",15)(6,B,2,1,"div",16),n(7,"div",17)(8,"a",18),t(9,"Go to dashboard"),s(),n(10,"button",19),h("click",function(){b(e);const d=l();return _(d.resetForm())}),t(11,"Create another"),s(),n(12,"button",20),h("click",function(){b(e);const d=l();return _(d.resendVerification())}),t(13),s(),n(14,"a",21),t(15,"Open local inbox"),s()(),n(16,"p",22),t(17,"The link contains a one-time token that marks your email as verified when opened."),s()()}if(i&2){const e=l();r(4),M("We sent a verification email so you can confirm ",e.form.controls.email.value,"."),r(),o("ngIf",e.verificationToken()),r(),o("ngIf",e.resendMessage()),r(6),o("disabled",e.resendState()==="loading"),r(),k(e.resendState()==="loading"?"Sending…":"Resend verification email")}}const g=class g{constructor(){this.fb=f(R),this.router=f(P),this.authApi=f(S),this.authStore=f(O),this.destroy$=new T,this.status=m("idle"),this.errorMessage=m(null),this.verificationToken=m(null),this.resendState=m("idle"),this.resendMessage=m(null),this.form=this.fb.nonNullable.group({name:["",[u.required,u.minLength(2)]],email:["",[u.required,u.email]],password:["",[u.required,u.minLength(8)]]})}submit(){if(this.status()==="submitting")return;if(this.form.invalid){this.form.markAllAsTouched(),this.errorMessage.set("Fill every field and ensure the password is at least 8 characters.");return}this.status.set("submitting"),this.errorMessage.set(null);const a=this.form.getRawValue();this.authApi.signUp(a).pipe(C(this.destroy$)).subscribe({next:e=>{this.authStore.setSession(e.user,e.tokens),this.authStore.setPostResetNotice("Account created. Check your inbox to verify your email."),this.verificationToken.set(e.emailVerificationToken??null),this.status.set("success")},error:e=>{var d;const c=((d=e==null?void 0:e.error)==null?void 0:d.message)??"Could not create the account. Try again in a moment.";this.errorMessage.set(c),this.status.set("error")}})}resetForm(){this.form.reset({name:"",email:"",password:""}),this.verificationToken.set(null),this.errorMessage.set(null),this.status.set("idle"),this.resendState.set("idle"),this.resendMessage.set(null),this.resendMessageTimer&&(clearTimeout(this.resendMessageTimer),this.resendMessageTimer=void 0)}resendVerification(){this.resendState()!=="loading"&&(this.resendState.set("loading"),this.resendMessage.set(null),this.authApi.resendVerification().pipe(C(this.destroy$)).subscribe({next:a=>{this.resendState.set("success"),a.token&&this.verificationToken.set(a.token),this.resendMessage.set("Verification email sent. Check your inbox."),this.queueResendMessageClear()},error:a=>{var c;const e=((c=a==null?void 0:a.error)==null?void 0:c.message)??"Unable to send a new verification email right now.";this.resendMessage.set(e),this.resendState.set("error"),this.queueResendMessageClear()}}))}queueResendMessageClear(){this.resendMessageTimer&&clearTimeout(this.resendMessageTimer),this.resendMessageTimer=setTimeout(()=>{this.resendMessage.set(null),this.resendState.set("idle")},6e3)}ngOnDestroy(){this.destroy$.next(),this.destroy$.complete(),this.resendMessageTimer&&clearTimeout(this.resendMessageTimer)}};g.ɵfac=function(e){return new(e||g)},g.ɵcmp=w({type:g,selectors:[["app-signup"]],standalone:!0,features:[A],decls:9,vars:2,consts:[[1,"auth-page"],[1,"auth-card"],[1,"muted"],["novalidate","",3,"formGroup","ngSubmit",4,"ngIf"],["class","success-state",4,"ngIf"],["novalidate","",3,"ngSubmit","formGroup"],["type","text","formControlName","name","placeholder","Alex Rivera",3,"disabled"],["type","email","formControlName","email","placeholder","you@company.com",3,"disabled"],["type","password","formControlName","password","placeholder","Minimum 8 characters",3,"disabled"],["class","error",4,"ngIf"],["type","submit",3,"disabled"],[1,"helper"],["routerLink","/auth/signin"],[1,"error"],[1,"success-state"],["class","dev-token",4,"ngIf"],["class","resend-feedback",4,"ngIf"],[1,"actions"],["routerLink","/dashboard",1,"btn"],["type","button",1,"ghost",3,"click"],["type","button",1,"ghost",3,"click","disabled"],["href","http://localhost:8025","target","_blank","rel","noopener noreferrer",1,"ghost-link"],[1,"resend-hint"],[1,"dev-token"],[1,"resend-feedback"]],template:function(e,c){e&1&&(n(0,"div",0)(1,"section",1)(2,"header")(3,"h1"),t(4,"Create your account"),s(),n(5,"p",2),t(6,"Start syncing bank data and track every balance in one place."),s()(),x(7,$,17,7,"form",3)(8,E,18,5,"div",4),s()()),e&2&&(r(7),o("ngIf",c.status()!=="success"),r(),o("ngIf",c.status()==="success"))},dependencies:[F,I,V,U,j,q,z,G,D,N],styles:[`.auth-page[_ngcontent-%COMP%] {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background: radial-gradient(circle at 15% 15%, rgba(14,165,233,0.12), transparent 50%),
                  radial-gradient(circle at 80% 10%, rgba(59,130,246,0.1), transparent 45%),
                  radial-gradient(circle at 50% 100%, rgba(110,231,183,0.12), transparent 55%),
                  linear-gradient(180deg, #f9fbff 0%, #edf2fb 100%);
    }
    .auth-card[_ngcontent-%COMP%] {
      max-width: 520px;
      width: min(100%, 520px);
      padding: 2.75rem;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {
      font-size: 2rem;
      margin-bottom: 0.35rem;
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
      transition: border 0.2s ease;
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
      transition: background 0.2s ease;
    }
    button[disabled][_ngcontent-%COMP%] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    button[_ngcontent-%COMP%]:not([disabled]):hover {
      background: #1d4ed8;
    }
    .helper[_ngcontent-%COMP%] {
      font-size: 0.95rem;
      color: #64748b;
      text-align: center;
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
      font-weight: 500;
      text-align: center;
    }
    .success-state[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      color: #065f46;
    }
    .success-state[_ngcontent-%COMP%]   .actions[_ngcontent-%COMP%] {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
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
    .btn[_ngcontent-%COMP%]:hover {
      background: #1d4ed8;
    }
    .ghost[_ngcontent-%COMP%] {
      background: transparent;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 999px;
      padding: 0.85rem 1.5rem;
    }
    .ghost[_ngcontent-%COMP%]:hover {
      background: rgba(37, 99, 235, 0.08);
    }
    .ghost-link[_ngcontent-%COMP%] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #2563eb;
      color: #2563eb;
      border-radius: 999px;
      padding: 0.85rem 1.5rem;
      font-weight: 600;
      text-decoration: none;
    }
    .ghost-link[_ngcontent-%COMP%]:hover {
      background: rgba(37, 99, 235, 0.08);
    }
    .dev-token[_ngcontent-%COMP%] {
      font-size: 0.85rem;
      color: #0f172a;
      background: rgba(37, 99, 235, 0.09);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      word-break: break-all;
    }
    .resend-feedback[_ngcontent-%COMP%] {
      font-size: 0.9rem;
      color: #0369a1;
      background: rgba(14, 165, 233, 0.12);
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
    }
    .resend-hint[_ngcontent-%COMP%] {
      font-size: 0.85rem;
      color: #0f172a;
      margin: 0;
    }
    code[_ngcontent-%COMP%] {
      font-family: 'Fira Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    }`]});let v=g;export{v as SignUpPage};
