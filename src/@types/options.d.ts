import {
  formattedComment,
  formattedLegacyComment,
} from "@/@types/format.formatted";
import { rawApiResponse } from "@/@types/format.legacy";
import { ownerComment } from "@/@types/format.owner";
import { v1Thread } from "@/@types/format.v1";
import { Config } from "@/@types/config";

export type inputFormatType =
  | "niconicome"
  | "formatted"
  | "legacy"
  | "legacyOwner"
  | "owner"
  | "v1"
  | "empty"
  | "default";
export type inputFormat =
  | XMLDocument
  | formattedComment[]
  | formattedLegacyComment[]
  | rawApiResponse[]
  | ownerComment[]
  | v1Thread[]
  | string
  | undefined;
type modeType = "default" | "html5" | "flash";
type BaseOptions = {
  config: Config;
  debug: boolean;
  enableLegacyPiP: boolean;
  format: inputFormatType;
  formatted: boolean;
  keepCA: boolean;
  mode: modeType;
  scale: number;
  showCollision: boolean;
  showCommentCount: boolean;
  showFPS: boolean;
  useLegacy: boolean;
  video: HTMLVideoElement | undefined;
};
export type Options = Partial<BaseOptions>;
