import type {
  ButtonPartLeft,
  ButtonPartMiddle,
  CommentContentIndex,
  CommentContentItem,
  CommentFlashFont,
  CommentFlashFontParsed,
  FormattedComment,
  FormattedCommentWithSize,
} from "@/@types";
import { config } from "@/definition/config";
import { getConfig } from "@/utils/config";
import { nativeSort } from "@/utils/sort";

/**
 * コメントの内容からフォント情報を取得する
 * @param part コメントの内容
 * @returns フォント情報
 */
const getFlashFontIndex = (part: string): CommentContentIndex[] => {
  const regex = {
    simsunStrong: new RegExp(config.flashChar.simsunStrong),
    simsunWeak: new RegExp(config.flashChar.simsunWeak),
    gulim: new RegExp(config.flashChar.gulim),
    gothic: new RegExp(config.flashChar.gothic),
  };
  const index: CommentContentIndex[] = [];
  let match;
  if ((match = regex.simsunStrong.exec(part)) !== null) {
    index.push({ font: "simsunStrong", index: match.index });
  }
  if ((match = regex.simsunWeak.exec(part)) !== null) {
    index.push({ font: "simsunWeak", index: match.index });
  }
  if ((match = regex.gulim.exec(part)) !== null) {
    index.push({ font: "gulim", index: match.index });
  }
  if ((match = regex.gothic.exec(part)) !== null) {
    index.push({ font: "gothic", index: match.index });
  }
  return index;
};

/**
 * フォント名を取得する
 * @param font フォント
 * @returns フォント名
 */
const getFlashFontName = (font: CommentFlashFontParsed): CommentFlashFont => {
  if (font === "simsunStrong" || font === "simsunWeak") return "simsun";
  if (font === "gothic") return "defont";
  return font;
};

/**
 * コメントの内容をパースする
 * @param content コメントの内容
 * @returns パースしたコメントの内容
 */
const parseContent = (content: string) => {
  const results: CommentContentItem[] = [];
  const lines = Array.from(content.match(/\n|[^\n]+/g) ?? []);
  for (const line of lines) {
    const lineContent = parseLine(line);
    const firstContent = lineContent[0];
    if (firstContent?.font) {
      results.push(
        ...lineContent.map((val) => {
          if (!val.font) {
            val.font = firstContent.font;
          }
          return val;
        }),
      );
    } else {
      results.push(...lineContent);
    }
  }
  return results;
};

/**
 * 1行分のコメントの内容をパースする
 * @param line 1行分のコメントの内容
 * @returns パースしたコメントの内容
 */
const parseLine = (line: string) => {
  const parts = Array.from(line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) ?? []);
  const lineContent: CommentContentItem[] = [];
  for (const part of parts) {
    if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
      lineContent.push({ content: part, slicedContent: part.split("\n") });
      continue;
    }
    parseFullWidthPart(part, lineContent);
  }
  return lineContent;
};

/**
 * 全角文字の部分をパースする
 * @param part 全角文字の部分
 * @param lineContent 1行分のコメントの内容
 */
const parseFullWidthPart = (
  part: string,
  lineContent: CommentContentItem[],
) => {
  const index = getFlashFontIndex(part);
  if (index.length === 0) {
    lineContent.push({ content: part, slicedContent: part.split("\n") });
  } else if (index.length === 1 && index[0]) {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
      font: getFlashFontName(index[0].font),
    });
  } else {
    parseMultiFontFullWidthPart(part, index, lineContent);
  }
};

/**
 * 複数のフォントが含まれる全角文字の部分をパースする
 * @param part 全角文字の部分
 * @param index フォントのインデックス
 * @param lineContent 1行分のコメントの内容
 */
const parseMultiFontFullWidthPart = (
  part: string,
  index: CommentContentIndex[],
  lineContent: CommentContentItem[],
) => {
  index.sort(nativeSort((val) => val.index));
  if (config.FlashMode === "xp") {
    let offset = 0;
    for (let i = 1, n = index.length; i < n; i++) {
      const currentVal = index[i],
        lastVal = index[i - 1];
      if (currentVal === undefined || lastVal === undefined) continue;
      const content = part.slice(offset, currentVal.index);
      lineContent.push({
        content: content,
        slicedContent: content.split("\n"),
        font: getFlashFontName(lastVal.font),
      });
      offset = currentVal.index;
    }
    const val = index[index.length - 1];
    if (val) {
      const content = part.slice(offset);
      lineContent.push({
        content: content,
        slicedContent: content.split("\n"),
        font: getFlashFontName(val.font),
      });
    }
    return;
  }
  const firstVal = index[0],
    secondVal = index[1];
  if (!firstVal || !secondVal) {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
    });
    return;
  }
  if (firstVal.font !== "gothic") {
    lineContent.push({
      content: part,
      slicedContent: part.split("\n"),
      font: getFlashFontName(firstVal.font),
    });
    return;
  }
  const firstContent = part.slice(0, secondVal.index);
  const secondContent = part.slice(secondVal.index);
  lineContent.push({
    content: firstContent,
    slicedContent: firstContent.split("\n"),
    font: getFlashFontName(firstVal.font),
  });
  lineContent.push({
    content: secondContent,
    slicedContent: secondContent.split("\n"),
    font: getFlashFontName(secondVal.font),
  });
};

const getButtonParts = (
  comment: FormattedCommentWithSize,
): FormattedCommentWithSize => {
  let leftParts: ButtonPartLeft | undefined = undefined;
  const parts: ButtonPartMiddle[] = [];
  const atButtonPadding = getConfig(config.atButtonPadding, true);
  const lineOffset = comment.lineOffset;
  const lineHeight = comment.fontSize * comment.lineHeight;
  const offsetKey = comment.resizedY ? "resized" : "default";
  const offsetY =
    config.commentYPaddingTop[offsetKey] +
    comment.fontSize *
      comment.lineHeight *
      config.commentYOffset[comment.size][offsetKey];
  let leftOffset = 0,
    lineCount = 0,
    isLastButton = false;
  for (const item of comment.content) {
    const lines = item.slicedContent;
    for (let j = 0, n = lines.length; j < n; j++) {
      const line = lines[j];
      if (line === undefined) continue;
      const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
      const partWidth = item.width[j] ?? 0;
      if (comment.button && !comment.button.hidden) {
        if (!isLastButton && item.isButton) {
          leftParts = {
            type: "left",
            left: leftOffset + atButtonPadding,
            top: posY - lineHeight + atButtonPadding,
            width: partWidth + atButtonPadding,
            height: lineHeight,
          };
          leftOffset += atButtonPadding * 2;
        } else if (isLastButton && item.isButton) {
          parts.push({
            type: "middle",
            left: leftOffset,
            top: posY - lineHeight + atButtonPadding,
            width: partWidth,
            height: lineHeight,
          });
        } else if (isLastButton && !item.isButton) {
          if (leftParts) {
            comment.buttonObjects = {
              left: leftParts,
              middle: parts,
              right: {
                type: "right",
                right: leftOffset + atButtonPadding,
                top: posY - lineHeight + atButtonPadding,
                height: lineHeight,
              },
            };
          }
          return comment;
        }
      }
      if (j < n - 1) {
        leftOffset = 0;
        lineCount += 1;
        continue;
      }
      leftOffset += partWidth;
    }
    isLastButton = !!item.isButton;
  }
  if (comment.button && !comment.button.hidden && isLastButton && leftParts) {
    const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
    comment.buttonObjects = {
      left: leftParts,
      middle: parts,
      right: {
        type: "right",
        right: leftOffset + atButtonPadding,
        top: posY - lineHeight + atButtonPadding,
        height: lineHeight,
      },
    };
  }
  return comment;
};

const buildAtButtonComment = (
  comment: FormattedCommentWithSize,
  vpos: number,
): FormattedComment | undefined => {
  if (!comment.button || comment.button.limit <= 0) return;
  comment.button.limit -= 1;
  const mail = [...comment.button.commentMail, "from_button"];
  if (!comment.button.commentVisible) {
    mail.push("invisible");
  }
  return {
    id: -1,
    vpos,
    content: comment.button.commentMessage,
    date: -1,
    date_usec: -1,
    owner: false,
    premium: true,
    mail,
    user_id: -10,
    layer: -1,
    is_my_post: true,
  };
};

export {
  buildAtButtonComment,
  getButtonParts,
  getFlashFontIndex,
  getFlashFontName,
  parseContent,
};
