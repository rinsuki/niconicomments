import { getConfig, getPosX, hex2rgb, parseFont, replaceAll } from "@/util";
import typeGuard from "@/typeGuard";
import { config, options } from "@/definition/config";
import { nicoScripts } from "@/contexts/nicoscript";
import { imageCache } from "@/contexts/cache";

class FlashComment implements IComment {
  private readonly context: CanvasRenderingContext2D;
  public readonly comment: formattedCommentWithSize;
  public posY: number;
  public image?: HTMLCanvasElement | null;
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    this.context = context;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.getCommentSize(this.parseCommandAndNicoscript(comment));
    this.posY = 0;
  }

  get invisible() {
    return this.comment.invisible;
  }
  get loc() {
    return this.comment.loc;
  }
  get long() {
    return this.comment.long;
  }
  get vpos() {
    return this.comment.vpos;
  }
  get width() {
    return this.comment.width;
  }
  get height() {
    return this.comment.height;
  }
  get flash() {
    return false;
  }
  get layer() {
    return this.comment.layer;
  }
  get owner() {
    return this.comment.owner;
  }
  get mail() {
    return this.comment.mail;
  }
  get lineCount() {
    return this.comment.lineCount;
  }

  /**
   * コメントに含まれるコマンドを解釈する
   * @param comment- 独自フォーマットのコメントデータ
   * @returns {{loc: string|undefined, size: string|undefined, color: string|undefined, fontSize: number|undefined, ender: boolean, font: string|undefined, full: boolean, _live: boolean, invisible: boolean, long:number|undefined}}
   */
  parseCommand(comment: formattedComment): parsedCommand {
    const metadata = comment.mail;
    const result: parsedCommand = {
      loc: undefined,
      size: undefined,
      fontSize: undefined,
      color: undefined,
      font: undefined,
      full: false,
      ender: false,
      _live: false,
      invisible: false,
      long: undefined,
    };
    for (let command of metadata) {
      command = command.toLowerCase();
      const match = command.match(/^@([0-9.]+)/);
      if (match && match[1]) {
        result.long = Number(match[1]);
      } else if (result.loc === undefined && typeGuard.comment.loc(command)) {
        result.loc = command;
      } else if (result.size === undefined && typeGuard.comment.size(command)) {
        result.size = command;
        result.fontSize = getConfig(config.fontSize, true)[command].default;
      } else {
        if (result.color === undefined) {
          const color = config.colors[command];
          if (color) {
            result.color = color;
            continue;
          } else {
            const match = command.match(/#[0-9a-z]{3,6}/);
            if (match && match[0] && comment.premium) {
              result.color = match[0].toUpperCase();
              continue;
            }
          }
        }
        if (result.font === undefined && typeGuard.comment.font(command)) {
          result.font = command;
        } else if (typeGuard.comment.command.key(command)) {
          result[command] = true;
        }
      }
    }
    return result;
  }

  /**
   * コメントに含まれるニコスクリプトを処理する
   * @param comment
   */
  parseCommandAndNicoscript(
    comment: formattedComment
  ): formattedCommentWithFont {
    const data = this.parseCommand(comment),
      string = comment.content,
      nicoscript = string.match(
        /^(?:@|＠)(デフォルト|置換|逆|コメント禁止|シーク禁止|ジャンプ)/
      );
    if (nicoscript && comment.owner) {
      const reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
      const content = comment.content.split(""),
        result = [];
      let quote = "",
        last_i = "",
        string = "";
      switch (nicoscript[1]) {
        case "デフォルト":
          nicoScripts.default.unshift({
            start: comment.vpos,
            long:
              data.long === undefined ? undefined : Math.floor(data.long * 100),
            color: data.color,
            size: data.size,
            font: data.font,
            loc: data.loc,
          });
          break;
        case "逆":
          if (
            !reverse ||
            !reverse[1] ||
            !typeGuard.nicoScript.range.target(reverse[1])
          )
            break;
          if (data.long === undefined) {
            data.long = 30;
          }
          nicoScripts.reverse.unshift({
            start: comment.vpos,
            end: comment.vpos + data.long * 100,
            target: reverse[1],
          });
          break;
        case "コメント禁止":
          if (data.long === undefined) {
            data.long = 30;
          }
          nicoScripts.ban.unshift({
            start: comment.vpos,
            end: comment.vpos + data.long * 100,
          });
          break;
        case "置換":
          for (const i of content.slice(4)) {
            if (i.match(/["'「]/) && quote === "") {
              quote = i;
            } else if (i.match(/["']/) && quote === i && last_i !== "\\") {
              result.push(replaceAll(string, "\\n", "\n"));
              quote = "";
              string = "";
            } else if (i.match(/」/) && quote === "「") {
              result.push(string);
              quote = "";
              string = "";
            } else if (quote === "" && i.match(/\s+/)) {
              if (string) {
                result.push(string);
                string = "";
              }
            } else {
              string += i;
            }

            last_i = i;
          }
          result.push(string);
          if (
            result[0] === undefined ||
            result[1] === undefined ||
            (result[2] !== undefined &&
              !typeGuard.nicoScript.replace.range(result[2])) ||
            (result[3] !== undefined &&
              !typeGuard.nicoScript.replace.target(result[3])) ||
            (result[4] !== undefined &&
              !typeGuard.nicoScript.replace.condition(result[4]))
          )
            break;
          nicoScripts.replace.unshift({
            start: comment.vpos,
            long:
              data.long === undefined ? undefined : Math.floor(data.long * 100),
            keyword: result[0],
            replace: result[1] || "",
            range: result[2] || "単",
            target: result[3] || "コメ",
            condition: result[4] || "部分一致",
            color: data.color,
            size: data.size,
            font: data.font,
            loc: data.loc,
            no: comment.id,
          });
          nicoScripts.replace.sort((a, b) => {
            if (a.start < b.start) return -1;
            if (a.start > b.start) return 1;
            if (a.no < b.no) return -1;
            if (a.no > b.no) return 1;
            return 0;
          });
          break;
      }
      data.invisible = true;
    }
    let color = undefined,
      size = undefined,
      font = undefined,
      loc = undefined;
    for (let i = 0; i < nicoScripts.default.length; i++) {
      const item = nicoScripts.default[i];
      if (!item) continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
        continue;
      }
      if (item.loc) {
        loc = item.loc;
      }
      if (item.color) {
        color = item.color;
      }
      if (item.size) {
        size = item.size;
      }
      if (item.font) {
        font = item.font;
      }
      if (loc && color && size && font) break;
    }
    for (let i = 0; i < nicoScripts.replace.length; i++) {
      const item = nicoScripts.replace[i];
      if (!item) continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        nicoScripts.default = nicoScripts.default.splice(Number(i), 1);
        continue;
      }
      if (
        (item.target === "コメ" && comment.owner) ||
        (item.target === "投コメ" && !comment.owner) ||
        (item.target === "含まない" && comment.owner)
      )
        continue;
      if (
        (item.condition === "完全一致" && comment.content === item.keyword) ||
        (item.condition === "部分一致" &&
          comment.content.indexOf(item.keyword) !== -1)
      ) {
        if (item.range === "単") {
          comment.content = replaceAll(
            comment.content,
            item.keyword,
            item.replace
          );
        } else {
          comment.content = item.replace;
        }
        if (item.loc) {
          data.loc = item.loc;
        }
        if (item.color) {
          data.color = item.color;
        }
        if (item.size) {
          data.size = item.size;
        }
        if (item.font) {
          data.font = item.font;
        }
      }
    }
    if (!data.loc) {
      data.loc = loc || "naka";
    }
    if (!data.color) {
      data.color = color || "#FFFFFF";
    }
    if (!data.size) {
      data.size = size || "medium";
      data.fontSize = getConfig(config.fontSize, true)[data.size].default;
    }
    if (!data.font) {
      data.font = font || "defont";
    }
    if (!data.long) {
      data.long = 300;
    } else {
      data.long = Math.floor(Number(data.long) * 100);
    }
    const content: commentContentItem[] = [];
    content.push({ content: comment.content });
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length || 0);
    }, 1);
    const lineOffset = 0;
    return {
      ...comment,
      content,
      lineCount,
      lineOffset,
      ...data,
      flash: false,
    } as formattedCommentWithFont;
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns {{resized: boolean, width: number, width: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
   */
  measureText(comment: measureTextInput): measureTextResult {
    const configLineHeight = getConfig(config.lineHeight, true),
      configFontSize = getConfig(config.fontSize, true),
      configDoubleResizeMaxWidth = getConfig(config.doubleResizeMaxWidth, true);
    const width_arr = [],
      lineCount = comment.lineCount;
    if (!comment.lineHeight)
      comment.lineHeight = configLineHeight[comment.size].default;
    if (!comment.resized && !comment.ender) {
      if (comment.size === "big" && lineCount > 2) {
        comment.fontSize = configFontSize.big.resized;
        comment.lineHeight = configLineHeight.big.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
      } else if (comment.size === "medium" && lineCount > 4) {
        comment.fontSize = configFontSize.medium.resized;
        comment.lineHeight = configLineHeight.medium.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
      } else if (comment.size === "small" && lineCount > 6) {
        comment.fontSize = configFontSize.small.resized;
        comment.lineHeight = configLineHeight.small.resized;
        comment.resized = true;
        comment.resizedY = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
      }
    }
    let currentWidth = 0;
    for (let i = 0; i < comment.content.length; i++) {
      const item = comment.content[i];
      if (item === undefined) continue;
      const lines = item.content.split("\n");
      const widths = [];

      this.context.font = parseFont(
        item.font || comment.font,
        comment.fontSize
      );
      for (let i = 0; i < lines.length; i++) {
        const measure = this.context.measureText(lines[i] as string);
        currentWidth += measure.width;
        widths.push(measure.width);
        if (i < lines.length - 1) {
          width_arr.push(currentWidth);
          currentWidth = 0;
        }
      }
      width_arr.push(currentWidth);
      item.width = widths;
    }
    let width_max = Math.max(...width_arr);
    const height =
      comment.fontSize *
        comment.lineHeight *
        (1 + getConfig(config.commentYPaddingTop, true)[comment.size]) *
        (lineCount - 1) +
      comment.fontSize * comment.lineHeight +
      getConfig(config.commentYMarginBottom, true)[comment.size] *
        comment.lineHeight *
        comment.fontSize;
    const widthLimit = getConfig(config.commentStageSize, true)[
      comment.full ? "fullWidth" : "width"
    ];
    if (comment.loc !== "naka" && !comment.resizedY) {
      if (width_max > widthLimit) {
        while (width_max > widthLimit) {
          width_max /= 1.331;
          comment.fontSize -= 3;
        }
        comment.resized = true;
        comment.resizedX = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
        return this.measureText(comment);
      }
    } else if (
      comment.loc !== "naka" &&
      comment.resizedY &&
      width_max > widthLimit &&
      !comment.resizedX
    ) {
      comment.fontSize = configFontSize[comment.size].default;
      comment.lineHeight = configLineHeight[comment.size].default * 1.05;
      comment.resized = true;
      comment.resizedX = true;
      this.context.font = parseFont(comment.font, comment.fontSize);
      return this.measureText(comment);
    } else if (comment.loc !== "naka" && comment.resizedY && comment.resizedX) {
      if (comment.full && width_max > configDoubleResizeMaxWidth.full) {
        while (width_max > configDoubleResizeMaxWidth.full) {
          width_max /= 1.331;
          comment.fontSize -= 3;
        }
        this.context.font = parseFont(comment.font, comment.fontSize);
        return this.measureText(comment);
      } else if (
        !comment.full &&
        width_max > configDoubleResizeMaxWidth.normal
      ) {
        while (width_max > configDoubleResizeMaxWidth.normal) {
          width_max /= 1.331;
          comment.fontSize -= 3;
        }
        this.context.font = parseFont(comment.font, comment.fontSize);
        return this.measureText(comment);
      }
    }
    console.log({
      width: width_max,
      charSize: 0,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
      content: comment.content as commentMeasuredContentItem[],
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
    });
    return {
      width: width_max,
      charSize: 0,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
      content: comment.content as commentMeasuredContentItem[],
      resizedX: !!comment.resizedX,
      resizedY: !!comment.resizedY,
    };
  }

  /**
   * コメントの描画サイズを計算する
   */
  getCommentSize(
    parsedData: formattedCommentWithFont
  ): formattedCommentWithSize {
    this.context.font = parseFont(parsedData.font, parsedData.fontSize);
    const size = parsedData as formattedCommentWithSize;
    if (parsedData.invisible) {
      size.height = 0;
      size.width = 0;
      size.lineHeight = 0;
      size.fontSize = 0;
      size.content = [];
      size.resized = false;
      size.resizedX = false;
      size.resizedY = false;
      size.charSize = 0;
      return size;
    }
    const measure = this.measureText(parsedData);
    if (options.scale !== 1 && size.layer === -1) {
      measure.height *= options.scale;
      measure.width *= options.scale;
      measure.fontSize *= options.scale;
    }
    size.height = measure.height;
    size.width = measure.width;
    size.lineHeight = measure.lineHeight;
    size.fontSize = measure.fontSize;
    size.content = measure.content;
    size.resized = measure.resized;
    size.resizedX = measure.resizedX;
    size.resizedY = measure.resizedY;
    size.charSize = measure.charSize;
    return size;
  }

  draw(vpos: number, showCollision: boolean, debug: boolean) {
    let reverse = false;
    for (const range of nicoScripts.reverse) {
      if (
        (range.target === "コメ" && this.comment.owner) ||
        (range.target === "投コメ" && !this.comment.owner)
      )
        break;
      if (range.start < vpos && vpos < range.end) {
        reverse = true;
      }
    }
    for (const range of nicoScripts.ban) {
      if (range.start < vpos && vpos < range.end) return;
    }
    let posX = (config.canvasWidth - this.comment.width) / 2,
      posY = this.posY;
    if (this.comment.loc === "naka") {
      if (reverse) {
        posX =
          config.canvasWidth +
          this.comment.width -
          getPosX(
            this.comment.width,
            vpos - this.comment.vpos,
            this.comment.long,
            true
          );
      } else {
        posX = getPosX(
          this.comment.width,
          vpos - this.comment.vpos,
          this.comment.long,
          true
        );
      }
      if (posX > config.canvasWidth || posX + this.comment.width < 0) {
        return;
      }
    } else if (this.comment.loc === "shita") {
      posY = config.canvasHeight - this.posY - this.comment.height;
    }
    if (this.image === undefined) {
      this.image = this.getTextImage();
    }
    if (this.image) {
      if (this.comment._live) {
        this.context.globalAlpha = config.contextFillLiveOpacity;
      } else {
        this.context.globalAlpha = 1;
      }
      this.context.drawImage(this.image, posX, posY);
    }
    if (showCollision) {
      this.context.strokeStyle = "rgba(0,255,255,1)";
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
      for (let i = 0; i < this.comment.lineCount; i++) {
        const linePosY =
          this.comment.fontSize * this.comment.lineHeight +
          Number(i) *
            (this.comment.fontSize * this.comment.lineHeight) *
            (1 + getConfig(config.commentYPaddingTop, true)[this.comment.size]);
        this.context.strokeStyle = "rgba(255,255,0,0.5)";
        this.context.strokeRect(
          posX,
          posY + linePosY,
          this.comment.width,
          this.comment.fontSize * this.comment.lineHeight * -1
        );
      }
    }
    if (debug) {
      const font = this.context.font;
      const fillStyle = this.context.fillStyle;
      this.context.font = parseFont("defont", 30);
      this.context.fillStyle = "#ff00ff";
      this.context.fillText(this.comment.mail.join(","), posX, posY + 30);
      this.context.font = font;
      this.context.fillStyle = fillStyle;
    }
  }

  /**
   * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
   */
  getTextImage(): HTMLCanvasElement | null {
    if (
      this.comment.invisible ||
      (this.comment.lineCount === 1 && this.comment.width === 0)
    )
      return null;
    const cacheKey =
        JSON.stringify(this.comment.content) +
        "@@FLASH@@" +
        [...this.comment.mail].sort().join(","),
      cache = imageCache[cacheKey];
    if (cache) {
      clearTimeout(cache.timeout);
      cache.timeout = window.setTimeout(() => {
        if (this.image) {
          delete this.image;
        }
        if (cache) {
          delete imageCache[cacheKey];
        }
      }, this.comment.long * 10 + config.cacheAge);
      return cache.image;
    }
    const image = document.createElement("canvas");
    image.width = this.comment.width;
    image.height = this.comment.height;
    const context = image.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
    context.strokeStyle = `rgba(${hex2rgb(
      this.comment.color === "#000000"
        ? config.contextStrokeInversionColor
        : config.contextStrokeColor
    ).join(",")},${config.contextStrokeOpacity})`;
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = 4;
    context.font = parseFont(this.comment.font, this.comment.fontSize);
    if (this.comment._live) {
      context.fillStyle = `rgba(${hex2rgb(this.comment.color).join(",")},${
        config.contextFillLiveOpacity
      })`;
    } else {
      context.fillStyle = this.comment.color;
    }
    const lineOffset = this.comment.lineOffset;
    let lastFont = this.comment.font,
      leftOffset = 0,
      lineCount = 0;
    for (let i = 0; i < this.comment.content.length; i++) {
      const item = this.comment.content[i];
      if (!item) continue;
      if (lastFont !== (item.font || this.comment.font)) {
        lastFont = item.font || this.comment.font;
        context.font = parseFont(lastFont, this.comment.fontSize);
      }
      const lines = item.content.split("\n");
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          this.comment.fontSize * this.comment.lineHeight +
          (lineOffset + lineCount) *
            (this.comment.fontSize * this.comment.lineHeight) *
            (1 +
              getConfig(config.commentYPaddingTop, true)[this.comment.size]) +
          this.comment.fontSize *
            this.comment.lineHeight *
            getConfig(config.commentYOffset, true)[this.comment.size][
              this.comment.resizedY ? "resized" : "default"
            ];
        context.strokeText(line, leftOffset, posY);
        context.fillText(line, leftOffset, posY);
        if (j < lines.length - 1) {
          leftOffset = 0;
          lineCount += 1;
        } else {
          leftOffset += item.width[j] || 0;
        }
      }
    }
    return image;
  }
}

export { FlashComment };
