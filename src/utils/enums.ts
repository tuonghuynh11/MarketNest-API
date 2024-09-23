export enum MetadataKeys {
  BASE_PATH = "base_path",
  ROUTERS = "routers",
  AUTHORIZE = "authorize",
  AUTHENTICATE = "authenticate",
}

export enum HttpMethods {
  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete",
}
export enum MediaType {
  Image = "image",
  Video = "video",
}

export enum ShippingType {
  International = "International",
  Local = "Local",
}

export enum OrderStatus {
  WAITING_VERIFY = "Waiting_Verify",
  WAITING_GET = "Waiting_Get",
  WAITING_DELIVERY = "Waiting_Delivery",
  IN_DELIVERY = "In_Delivery",
  DELIVERY_FAILED = "Delivery_Failed",
  COMPLETED = "Completed",
  CANCELLED = "cancelled",
}

export enum RefundStatus {
  PENDING = "Pending",
  ACCEPTED = "Accepted",
  REJECTED = "Rejected",
  PROCESSING = "Processing",
  COMPLETED = "Completed",
  FAILED = "Failed",
}

export enum ShopStatus {
  PENDING = "Pending",
  ACTIVE = "Active",
  DEACTIVATED = "Deactivated",
  REJECTED = "Rejected",
}

export enum SystemRole {
  Admin = "Admin",
  User = "User",
  Shopkeeper = "Shopkeeper",
  SuperAdmin = "SuperAdmin",
}
