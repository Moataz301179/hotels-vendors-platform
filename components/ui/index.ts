// components/ui/index.ts — single gateway for all UI primitives
// Arena primitives from ./ui-primitives.ts. shadcn sub-components from individual files.

// ─── Arena primitives (from ./ui-primitives.ts) ───
export {
  btnCls,
  Btn,
  StatePill,
  Card,
  Stat,
  PageHead,
  Banner,
  Field,
  TextInput,
  TextArea,
  Toggle,
  Select,
  Modal,
  EmptyState,
  ErrorState,
  Skeleton,
  Spinner,
  T,
  Th,
  Td,
  KV,
  Tabs,
  Pager,
  Img,
} from "./ui-primitives.tsx";

// ─── shadcn components (stable APIs — backward compat) ───
export { Button, buttonVariants } from "./button";
export { Badge, badgeVariants } from "./badge";
export { Input } from "./input";
export { Label } from "./label";
export { Textarea } from "./textarea";
export { Skeleton as SkeletonShadcn } from "./skeleton";
export { Avatar } from "./avatar";
export { Separator } from "./separator";

// ─── Card sub-components (not in arena ui.tsx) ───
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

// ─── Other shadcn ───
export { Progress } from "./progress";
export { Checkbox } from "./checkbox";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
