;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="992a959e-1af9-8afe-7fad-cf7612edd55f")}catch(e){}}();
module.exports=[688947,(e,t,o)=>{t.exports=e.x("stream",()=>require("stream"))},406461,(e,t,o)=>{t.exports=e.x("zlib",()=>require("zlib"))},504446,(e,t,o)=>{t.exports=e.x("net",()=>require("net"))},921517,(e,t,o)=>{t.exports=e.x("http",()=>require("http"))},524836,(e,t,o)=>{t.exports=e.x("https",()=>require("https"))},755004,(e,t,o)=>{t.exports=e.x("tls",()=>require("tls"))},317137,e=>{"use strict";var t=e.i(129508);let o=process.env.RESEND_API_KEY,r=process.env.FROM_EMAIL||"noreply@hotelsvendors.com";function s(){return process.env.SMTP_HOST?t.default.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT)||465,secure:!0,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}):null}async function i(e){let t=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({from:r,to:e.to,subject:e.subject,html:e.html,text:e.text})});if(!t.ok){let e=await t.text();throw Error(`Resend failed: ${e}`)}return t.json()}async function a(e){let t=s();if(!t)throw Error("No email transport configured");return{id:(await t.sendMail({from:r,to:e.to.join(", "),subject:e.subject,html:e.html,text:e.text})).messageId}}async function n(e){return o?i(e):s()?a(e):(console.warn("[Email] No transport configured (set RESEND_API_KEY or SMTP_HOST). Email not sent:",e.subject),{id:"no-transport"})}e.s(["approvalRequiredTemplate",0,function(e){return{subject:`Approval Required: Order ${e.orderId} — ${e.total.toLocaleString()} ${e.currency}`,html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #c41e3a;">Hotels Vendors — Approval Request</h2>
      <p>Hello ${e.approverName},</p>
      <p>A new purchase order requires your approval:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Order ID</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.orderId}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Hotel</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.hotelName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Supplier</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${e.supplierName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #c41e3a; font-weight: bold;">${e.total.toLocaleString()} ${e.currency}</td></tr>
      </table>
      <a href="${e.orderUrl}" style="display: inline-block; padding: 12px 24px; background: #c41e3a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Review & Approve</a>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">This is an automated message from Hotels Vendors Authority Matrix.</p>
    </div>
  `}},"emailVerificationTemplate",0,function(e){return{subject:"Verify your email — Hotels Vendors",html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Verify your email address</h2>
      <p>Hello ${e.name},</p>
      <p>Please confirm your email address to activate your Hotels Vendors account.</p>
      <a href="${e.verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Verify Email Address</a>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">If the button does not work, copy and paste this link:<br/>${e.verificationUrl}</p>
    </div>
  `}},"factoringDisbursedTemplate",0,function(e){return{subject:`💰 Factoring Funds Disbursed — ${e.invoiceId}`,html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #c41e3a;">Factoring Disbursement Complete</h2>
      <p>Hello ${e.supplierName},</p>
      <p>Your invoice has been funded through ${e.partnerName}:</p>
      <p style="font-size: 24px; color: #c41e3a; font-weight: bold;">${e.amount.toLocaleString()} ${e.currency}</p>
      <p>Funds will reach your account within 24 hours.</p>
    </div>
  `}},"orderApprovedTemplate",0,function(e){return{subject:`Order ${e.orderId} Approved`,html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #22c55e;">✓ Order Approved</h2>
      <p>Hello ${e.requesterName},</p>
      <p>Your order <strong>${e.orderId}</strong> has been approved by ${e.approverName}.</p>
      <p style="font-size: 18px; color: #22c55e; font-weight: bold;">${e.total.toLocaleString()} ${e.currency}</p>
      <p>The supplier will be notified to begin fulfillment.</p>
    </div>
  `}},"passwordResetConfirmationTemplate",0,function(e){return{subject:"Your password has been reset",html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Password updated successfully</h2>
      <p>Hello ${e.name},</p>
      <p>Your Hotels Vendors password has been changed. You can now log in with your new password.</p>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">If you did not make this change, please contact us immediately at hello@hotelsvendors.com.</p>
    </div>
  `}},"passwordResetTemplate",0,function(e){return{subject:"Reset your Hotels Vendors password",html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Password reset requested</h2>
      <p>Hello ${e.name},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link expires in 24 hours.</p>
      <a href="${e.resetUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
      <p style="margin-top: 16px; font-size: 13px; color: #666;">If you did not request this reset, your account is secure — no changes have been made.</p>
      <p style="margin-top: 8px; font-size: 12px; color: #666;">If the button does not work, copy and paste this link:<br/>${e.resetUrl}</p>
    </div>
  `}},"sendEmail",0,n,"smartFixTemplate",0,function(e){return{subject:`🔒 Smart Fix Applied: ${e.fixType} — Order ${e.orderId}`,html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #f59e0b;">Risk Mitigation Alert</h2>
      <p>Hello ${e.hotelName},</p>
      <p>Our AI has detected a risk pattern on your order and applied an automatic safeguard:</p>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
        <strong>${e.fixType}</strong><br/>
        ${e.description}
      </div>
      <a href="${e.actionUrl}" style="display: inline-block; padding: 12px 24px; background: #c41e3a; color: white; text-decoration: none; border-radius: 6px;">Resolve Now</a>
    </div>
  `}},"welcomeTemplate",0,function(e){return{subject:"Welcome to Hotels Vendors — Your Procurement Advantage Starts Now",html:`
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
      <h2 style="color: #8B0000;">Welcome aboard, ${e.name}</h2>
      <p>You have successfully joined Hotels Vendors — Egypt's smartest procurement platform for hospitality.</p>
      <div style="background: #fef2f2; border-left: 4px solid #8B0000; padding: 16px; margin: 16px 0;">
        <strong>What is next?</strong><br/>
        1. Verify your email address<br/>
        2. Complete your profile<br/>
        3. Start browsing 1,200+ verified suppliers
      </div>
      <a href="${e.loginUrl}" style="display: inline-block; padding: 12px 24px; background: #8B0000; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Log In to Your Account</a>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">Need help? Reply to this email or contact us at hello@hotelsvendors.com</p>
    </div>
  `}}])}];

//# debugId=992a959e-1af9-8afe-7fad-cf7612edd55f
//# sourceMappingURL=%5Broot-of-the-server%5D__04~0o37._.js.map