import{i as s,b as _,R as f,ɵ as p,c as m,d as t,e as a,f as e,g as b,k as u,l as h,n as x,o as C,h as y,p as k,q as d,r as M,m as P}from"./index-CoAdiQa4.js";function O(i,c){if(i&1){const n=C();t(0,"footer",7)(1,"span"),a(2),e(),t(3,"button",8),y("click",function(){k(n);const g=d();return M(g.goToDashboard())}),a(4,"Go to dashboard"),e()()}if(i&2){let n;const r=d();u(2),P("You are already signed in as ",(n=r.auth.user())==null?null:n.email,".")}}const o=class o{constructor(){this.auth=s(_),this.router=s(f)}goToDashboard(){this.router.navigateByUrl("/dashboard")}};o.ɵfac=function(n){return new(n||o)},o.ɵcmp=p({type:o,selectors:[["app-home"]],standalone:!0,features:[m],decls:14,vars:1,consts:[[1,"landing"],[1,"eyebrow"],[1,"tagline"],[1,"cta-grid"],["routerLink","/auth/signin",1,"cta","primary"],["routerLink","/auth/signup",1,"cta","outline"],["class","authed-banner",4,"ngIf"],[1,"authed-banner"],["type","button",3,"click"]],template:function(n,r){n&1&&(t(0,"section",0)(1,"header")(2,"p",1),a(3,"Multi-bank finance dashboard"),e(),t(4,"h1"),a(5,"Sign in to continue"),e(),t(6,"p",2),a(7,"Connect all of your financial institutions, monitor balances, and stay ahead of cash flow."),e()(),t(8,"div",3)(9,"a",4),a(10,"Sign in"),e(),t(11,"a",5),a(12,"Create an account"),e()(),b(13,O,5,1,"footer",6),e()),n&2&&(u(13),h("ngIf",r.auth.isAuthenticated()))},dependencies:[x],styles:[`.landing[_ngcontent-%COMP%] {
      max-width: 640px;
      margin: 5rem auto;
      padding: 3.5rem;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14);
      display: flex;
      flex-direction: column;
      gap: 2.25rem;
      text-align: center;
    }
    .eyebrow[_ngcontent-%COMP%] {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #60a5fa;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    h1[_ngcontent-%COMP%] {
      font-size: 2.4rem;
      margin: 0 0 0.75rem;
    }
    .tagline[_ngcontent-%COMP%] {
      color: #64748b;
      font-size: 1.05rem;
      line-height: 1.6;
    }
    .cta-grid[_ngcontent-%COMP%] {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .cta[_ngcontent-%COMP%] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 3.2rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .primary[_ngcontent-%COMP%] {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
    }
    .primary[_ngcontent-%COMP%]:hover {
      background: #1d4ed8;
    }
    .outline[_ngcontent-%COMP%] {
      border: 1px solid #cbd5f5;
      color: #1d4ed8;
      background: #f8fbff;
    }
    .outline[_ngcontent-%COMP%]:hover {
      background: #e0edff;
    }
    .authed-banner[_ngcontent-%COMP%] {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      color: #1e3a8a;
    }
    .authed-banner[_ngcontent-%COMP%]   button[_ngcontent-%COMP%] {
      align-self: center;
      padding: 0.6rem 1.4rem;
      border-radius: 999px;
      border: none;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .authed-banner[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover {
      background: #1d4ed8;
    }`]});let l=o;export{l as HomePage};
