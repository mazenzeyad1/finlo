import{i as m,A as v,a as C,b as M,s as h,ɵ as R,c as S,d as r,e as a,f as o,g as w,k as n,l as u,C as T,N,n as O,o as x,h as P,j as _,q as l,u as g,p as y,r as k}from"./index-CoAdiQa4.js";import{F as A,V as f,R as I,ɵ as V,D as q,N as F,a as E,b as G,c as D}from"./forms-BBCdHGSS.js";function L(e,i){e&1&&(r(0,"div",4)(1,"p"),a(2,"The reset link is missing a token. Start the reset process again to receive a valid email."),o()())}function Y(e,i){if(e&1&&(r(0,"p",4),a(1),o()),e&2){const t=l(2);n(),g(t.formErrors())}}function j(e,i){if(e&1){const t=x();r(0,"form",5),P("ngSubmit",function(){y(t);const c=l();return k(c.submit())}),r(1,"label"),a(2," New password "),_(3,"input",6),o(),r(4,"label"),a(5," Confirm password "),_(6,"input",7),o(),w(7,Y,2,1,"p",1),r(8,"button",8),a(9),o()()}if(e&2){const t=l();u("formGroup",t.form),n(3),u("disabled",t.status()==="submitting"),n(3),u("disabled",t.status()==="submitting"),n(),u("ngIf",t.formErrors()),n(),u("disabled",t.status()==="submitting"),n(),g(t.status()==="submitting"?"Resetting…":"Reset Password")}}function z(e,i){e&1&&(r(0,"div",9)(1,"p"),a(2,"Your password was updated. You can sign in with your new credentials."),o(),r(3,"a",10),a(4,"Return to Dashboard"),o()())}function W(e,i){if(e&1){const t=x();r(0,"div",4)(1,"p"),a(2),o(),r(3,"button",11),P("click",function(){y(t);const c=l();return k(c.retry())}),a(4,"Try Again"),o()()}if(e&2){const t=l();n(2),g(t.errorMessage())}}const d=class d{constructor(){this.fb=m(A),this.route=m(v),this.authApi=m(C),this.authStore=m(M),this.status=h("idle"),this.errorMessage=h("We could not reset your password. Please request a new link and try again."),this.token=null,this.form=this.fb.nonNullable.group({password:["",[f.required,f.minLength(8)]],confirm:["",[f.required,f.minLength(8)]]})}ngOnInit(){if(this.token=this.route.snapshot.queryParamMap.get("token"),!this.token){this.status.set("missing");return}this.status.set("ready")}formErrors(){return this.status()==="error"&&this.errorMessage()?this.errorMessage():this.form.controls.password.invalid&&this.form.controls.password.touched?"Your password must be at least 8 characters long.":this.form.controls.confirm.invalid&&this.form.controls.confirm.touched?"Confirm the password using at least 8 characters.":this.form.value.password!==this.form.value.confirm&&this.form.controls.confirm.touched?"The passwords do not match.":""}submit(){if(this.status()!=="ready"&&this.status()!=="submitting")return;if(!this.token){this.status.set("missing");return}if(this.form.invalid){this.form.markAllAsTouched();return}const{password:i,confirm:t}=this.form.getRawValue();if(i!==t){this.errorMessage.set("The passwords do not match."),this.status.set("error");return}this.status.set("submitting"),this.authApi.resetPassword(this.token,i).subscribe({next:()=>{this.authStore.clearSession(),this.authStore.setPostResetNotice("Password updated. Sign in again to continue."),this.form.reset({password:"",confirm:""}),this.status.set("success")},error:s=>{var p;const c=((p=s==null?void 0:s.error)==null?void 0:p.message)??"The reset link is no longer valid. Request a new email to continue.";this.errorMessage.set(c),this.status.set("error")}})}retry(){this.status()==="error"&&(this.errorMessage.set("We could not reset your password. Please request a new link and try again."),this.status.set(this.token?"ready":"missing"))}};d.ɵfac=function(t){return new(t||d)},d.ɵcmp=R({type:d,selectors:[["app-reset-password"]],standalone:!0,features:[S],decls:7,vars:4,consts:[[1,"auth-card"],["class","error",4,"ngIf"],[3,"formGroup","ngSubmit",4,"ngIf"],["class","success",4,"ngIf"],[1,"error"],[3,"ngSubmit","formGroup"],["type","password","formControlName","password","placeholder","Enter a new password",3,"disabled"],["type","password","formControlName","confirm","placeholder","Re-enter the password",3,"disabled"],["type","submit",3,"disabled"],[1,"success"],["routerLink","/dashboard",1,"btn"],["type","button",3,"click"]],template:function(t,s){t&1&&(r(0,"section",0)(1,"h1"),a(2,"Reset Password"),o(),w(3,L,3,0,"div",1)(4,j,10,6,"form",2)(5,z,5,0,"div",3)(6,W,5,1,"div",1),o()),t&2&&(n(3),u("ngIf",s.status()==="missing"),n(),u("ngIf",s.status()==="ready"||s.status()==="submitting"),n(),u("ngIf",s.status()==="success"),n(),u("ngIf",s.status()==="error"))},dependencies:[T,N,I,V,q,F,E,G,D,O],styles:[`.auth-card[_ngcontent-%COMP%] {
      max-width: 480px;
      margin: 4rem auto;
      padding: 2.5rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    h1[_ngcontent-%COMP%] {
      margin: 0;
      text-align: center;
      font-size: 1.75rem;
    }
    form[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    label[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
    }
    input[_ngcontent-%COMP%] {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #cbd5f5;
      font-size: 1rem;
    }
    button[_ngcontent-%COMP%] {
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button[disabled][_ngcontent-%COMP%] {
      background: #93c5fd;
      cursor: not-allowed;
    }
    .btn[_ngcontent-%COMP%] {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
    }
    .btn[_ngcontent-%COMP%]:hover {
      background: #1d4ed8;
    }
    .success[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      color: #065f46;
    }
    .error[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #b91c1c;
      text-align: center;
    }`]});let b=d;export{b as ResetPasswordPage};
