import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'crypto';
export const funderScopes=['purchases:read','fulfillment:read','invoices:read','ledger:read'] as const;
export type FunderScope=typeof funderScopes[number];
export type SharingGrant={id:string;tenantId:string;connectionId:string;clientId:string;resourceIds:string[];scopes:FunderScope[];expiresAt:Date;revokedAt:Date|null};
export type ExternalFunderResponse={externalReference:string;status:'UNDER_REVIEW'|'OFFERED'|'DECLINED'|'WITHDRAWN';terms?:{currency:string;amount:string;expiresAt:string};decidedBy:'EXTERNAL_FUNDER'};
export interface FunderAdapter {
 readonly id:string;
 readonly clientId:string;
 readonly available:boolean;
 sendReview(input:{signalId:string;grantId:string;snapshotId:string;idempotencyKey:string}):Promise<{externalReference:string}>;
 verifyEvent(rawBody:string,signature:string):Promise<ExternalFunderResponse|null>;
}
/** Registry contains only explicitly provisioned live adapters. No automatic mock fallback. */
export class FunderRegistry {
 private readonly adapters=new Map<string,FunderAdapter>();
 constructor(adapters:FunderAdapter[]=[]){for(const adapter of adapters){if(this.adapters.has(adapter.id))throw Error('Duplicate funder connection');this.adapters.set(adapter.id,adapter)}}
 connected(){return [...this.adapters.values()].filter(x=>x.available).map(x=>({id:x.id,clientId:x.clientId,status:'CONNECTED' as const}))}
 get(id:string){const adapter=this.adapters.get(id);if(!adapter?.available)throw Error('FUNDER_UNAVAILABLE');return adapter}
}
export function issueGrantCredential(){const credential=randomBytes(32).toString('base64url');return {id:randomUUID(),credential,credentialHash:hashCredential(credential)}}
export function hashCredential(value:string){return createHash('sha256').update(value).digest('hex')}
export function credentialMatches(value:string,expectedHash:string){if(!/^[a-f0-9]{64}$/.test(expectedHash))return false;return timingSafeEqual(Buffer.from(hashCredential(value),'hex'),Buffer.from(expectedHash,'hex'))}
export function authorizeFunderRead(grant:SharingGrant,input:{clientId:string;connectionId:string;tenantId:string;scope:FunderScope;resourceId:string;now:Date}){
 if(grant.revokedAt||grant.expiresAt<=input.now||grant.clientId!==input.clientId||grant.connectionId!==input.connectionId||grant.tenantId!==input.tenantId||!grant.scopes.includes(input.scope)||!grant.resourceIds.includes(input.resourceId))throw Error('GRANT_ACCESS_DENIED');
}
export function canonicalEvidence(value:unknown):string {
 if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
 if(Array.isArray(value))return '['+value.map(canonicalEvidence).join(',')+']';
 const record=value as Record<string,unknown>;return '{'+Object.keys(record).sort().filter(k=>record[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonicalEvidence(record[k])).join(',')+'}';
}
export function hashSnapshot(snapshot:{tenantId:string;grantId:string;schemaVersion:number;cutoff:string;events:unknown[]}){return createHash('sha256').update(canonicalEvidence(snapshot)).digest('hex')}
