import {getActor} from '@/lib/v2-auth';
import {WorkspaceNavigation} from '@/components/v2/workspace-navigation';
export async function Side(){const u=await getActor();return <WorkspaceNavigation role={u?.platformRole??''}/>;}
