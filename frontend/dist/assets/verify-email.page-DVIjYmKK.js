import{i as u,A as f,a as g,b as p,s as h,ɵ as _,c as x,d as a,e as s,f as n,v as y,g as w,w as v,k as r,l as o,C as b,x as C,y as S,n as k,q as M,u as P}from"./index-CoAdiQa4.js";function E(t,i){t&1&&(a(0,"p"),s(1," We could not find a verification token in the link you followed. Double-check the email or request a new verification email from your profile settings. "),n())}function T(t,i){t&1&&(a(0,"p"),s(1,"Verifying your email address…"),n())}function V(t,i){t&1&&(a(0,"div",5)(1,"p"),s(2,"Your email address is verified. You can return to the dashboard."),n(),a(3,"a",6),s(4,"Go to Dashboard"),n()())}function A(t,i){t&1&&(a(0,"div",5)(1,"p"),s(2,"This verification link was already used. Your email address is confirmed, so you're all set."),n(),a(3,"a",6),s(4,"Go to Dashboard"),n()())}function O(t,i){if(t&1&&(a(0,"div",7)(1,"p"),s(2),n(),a(3,"a",6),s(4,"Return to Dashboard"),n()()),t&2){const e=M();r(2),P(e.errorMessage())}}const c=class c{constructor(){this.route=u(f),this.authApi=u(g),this.authStore=u(p),this.status=h("idle"),this.errorMessage=h("Something went wrong while verifying your email. Try requesting a new link.")}ngOnInit(){const i=this.route.snapshot.queryParamMap.get("token");if(!i){this.status.set("missing");return}this.status.set("loading"),this.authApi.verifyEmail(i).subscribe({next:({verified:e,reused:l})=>{if(l){this.authStore.markEmailVerified(),this.status.set("reused");return}if(e){this.authStore.markEmailVerified(),this.status.set("success");return}this.status.set("error")},error:e=>{var d;const l=((d=e==null?void 0:e.error)==null?void 0:d.message)??"This verification link is no longer valid. Request a new email from your account settings.";this.errorMessage.set(l),this.status.set("error")}})}};c.ɵfac=function(e){return new(e||c)},c.ɵcmp=_({type:c,selectors:[["app-verify-email"]],standalone:!0,features:[x],decls:9,vars:6,consts:[[1,"auth-card"],[3,"ngSwitch"],[4,"ngSwitchCase"],["class","success",4,"ngSwitchCase"],["class","error",4,"ngSwitchCase"],[1,"success"],["routerLink","/dashboard",1,"btn"],[1,"error"]],template:function(e,l){e&1&&(a(0,"section",0)(1,"h1"),s(2,"Email Verification"),n(),y(3,1),w(4,E,2,0,"p",2)(5,T,2,0,"p",2)(6,V,5,0,"div",3)(7,A,5,0,"div",3)(8,O,5,1,"div",4),v(),n()),e&2&&(r(3),o("ngSwitch",l.status()),r(),o("ngSwitchCase","missing"),r(),o("ngSwitchCase","loading"),r(),o("ngSwitchCase","success"),r(),o("ngSwitchCase","reused"),r(),o("ngSwitchCase","error"))},dependencies:[b,C,S,k],styles:[`.auth-card[_ngcontent-%COMP%] {
      max-width: 480px;
      margin: 4rem auto;
      padding: 2.5rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      text-align: center;
    }
    h1[_ngcontent-%COMP%] {
      margin: 0;
      font-size: 1.75rem;
    }
    .btn[_ngcontent-%COMP%] {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
    }
    .btn[_ngcontent-%COMP%]:hover {
      background: #1d4ed8;
    }
    .success[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #065f46;
    }
    .error[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #b91c1c;
    }`]});let m=c;export{m as VerifyEmailPage};
