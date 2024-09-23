import { MediaType, SystemRole } from "./enums";

export interface IAuthorize {
  roles: SystemRole[] | string;
  handlerName: string | symbol;
}

export interface Media {
  url: string;
  type: MediaType;
}
