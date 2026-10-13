// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({props:{} as Record<string,unknown>}));
vi.mock("@clerk/nextjs",()=>({SignUp:(props:Record<string,unknown>)=>{state.props=props;return React.createElement("div",null,"Create account");}}));
import { ClerkRegistration } from "../../components/auth/clerk-registration";
it("continues OAuth signup using hash routing without forcing redirects or assigning permissions",()=>{
 vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);
 const container=document.createElement("div");
 const root=createRoot(container);
 try{
  act(()=>root.render(React.createElement(ClerkRegistration)));
  expect(state.props.routing).toBe("hash");
  expect(state.props.signInUrl).toBe("/login");
  expect(state.props.fallbackRedirectUrl).toBe("/dashboard");
  expect(state.props).not.toHaveProperty("forceRedirectUrl");
  expect(state.props).not.toHaveProperty("unsafeMetadata");
 }finally{act(()=>root.unmount());vi.unstubAllGlobals();}
});
