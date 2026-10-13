import { z } from "zod";
import { OrderStatus } from "@prisma/client";
const pagination = {
  search: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).max(10000).default(1),
};
export const adminUserQuery = z.object({ ...pagination,
  role: z.enum(["HOTEL", "SUPPLIER", "FACTORING", "SHIPPING", "ADMIN", "MARKETING"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).optional(),
}).strict();
export const adminTenantQuery = z.object({ ...pagination,
  status: z.enum(["ACTIVE", "ACTIVE_DEMO", "INACTIVE", "SUSPENDED"]).optional(),
}).strict();
export const adminOrderQuery = z.object({
  limit: pagination.limit, page: pagination.page, status: z.enum(OrderStatus).optional(),
}).strict();
