import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getActor} from "@/lib/v2-auth";
import {projectFactoringStatus} from "@/lib/procurement/transaction-status";

export async function GET(){
 const u=await getActor();
 if(!u)return NextResponse.json({error:"UNAUTHENTICATED"},{status:401});
 if(!["HOTEL","SUPPLIER","FACTORING","ADMIN"].includes(u.platformRole))return NextResponse.json({error:"FUNDING_ROLE_REQUIRED"},{status:403});
 const [rows,companies]=await Promise.all([
  prisma.factoringRequest.findMany({where:{tenantId:u.tenantId,deletedAt:null},select:{id:true,status:true,requestedAmount:true,requestedAt:true,factoringCompanyId:true},orderBy:{requestedAt:"desc"},take:50}),
  prisma.factoringCompany.findMany({where:{tenantId:u.tenantId,status:"ACTIVE"},select:{id:true,name:true,contactEmail:true},take:50})
 ]);
 const requests=rows.map(row=>{
  const projected=projectFactoringStatus(row.status);
  return {...row,displayStatus:projected.status,frozen:projected.frozen};
 });
 return NextResponse.json({requests,companies,decisionBoundary:"External funders approve or reject financing. HOTELSVENDORS does not lend, set a limit, or disburse."});
}
