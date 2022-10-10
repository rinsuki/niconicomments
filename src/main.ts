import convert2formattedComment from "./inputParser";
import typeGuard from "@/typeGuard";
import {
  defaultConfig,
  defaultOptions,
  config,
  options,
  setConfig,
  setOptions,
} from "@/definition/config";
import {
  arrayPush,
  changeCALayer,
  getConfig,
  getPosX,
  getPosY,
  groupBy,
  hex2rgb,
  isFlashComment,
  parseFont,
  replaceAll,
} from "@/util";

let isDebug = false;

class NiconiComments {
  public enableLegacyPiP: boolean;
  public showCollision: boolean;
  public showFPS: boolean;
  public showCommentCount: boolean;
  public video: HTMLVideoElement | undefined;
  private data: parsedComment[];
  private fps: number;
  private fpsCount: number;
  private lastVpos: number;
  private readonly cacheIndex: { [key: string]: number };
  private readonly canvas: HTMLCanvasElement;
  private readonly collision: collision;
  private readonly context: CanvasRenderingContext2D;
  private readonly nicoScripts: nicoScript;
  private readonly timeline: { [key: number]: number[] };

  /**
   * NiconiComments Constructor
   * @param {HTMLCanvasElement} canvas - 描画対象のキャンバス
   * @param {[]} data - 描画用のコメント
   * @param initOptions
   */
  constructor(
    canvas: HTMLCanvasElement,
    data: (rawApiResponse | formattedComment)[],
    initOptions: InitOptions = {}
  ) {
    const constructorStart = performance.now();
    if (!typeGuard.config.initOptions(initOptions))
      throw new Error(
        "Please see document: https://xpadev-net.github.io/niconicomments/#p_options"
      );
    setOptions(Object.assign(defaultOptions, initOptions));
    if (!typeGuard.config.config(options.config)) {
      console.warn(options.config);
      throw new Error(
        "Please see document: https://xpadev-net.github.io/niconicomments/#p_config"
      );
    }
    setConfig(Object.assign(defaultConfig, options.config));
    isDebug = options.debug;

    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
    this.context = context;
    this.context.strokeStyle = `rgba(${hex2rgb(config.contextStrokeColor).join(
      ","
    )},${config.contextStrokeOpacity})`;
    this.context.textAlign = "start";
    this.context.textBaseline = "alphabetic";
    this.context.lineWidth = config.contextLineWidth;
    let formatType = options.format,
      mode = options.mode;

    //Deprecated Warning
    if (options.formatted) {
      console.warn(
        "Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format"
      );
    }
    if (formatType === "default") {
      formatType = options.formatted ? "formatted" : "legacy";
    }

    if (options.useLegacy) {
      console.warn(
        "Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode"
      );
    }
    if (mode === "default" && options.useLegacy) {
      mode = "html5";
    }

    const parsedData = convert2formattedComment(data, formatType);
    this.video = options.video || undefined;
    this.showCollision = options.showCollision;
    this.showFPS = options.showFPS;
    this.showCommentCount = options.showCommentCount;
    this.enableLegacyPiP = options.enableLegacyPiP;

    this.cacheIndex = {};
    this.timeline = {};
    this.nicoScripts = { reverse: [], default: [], replace: [], ban: [] };
    this.collision = (
      ["ue", "shita", "right", "left"] as collisionPos[]
    ).reduce((pv, value) => {
      pv[value] = [] as collisionItem;
      return pv;
    }, {} as collision);
    this.data = [];
    this.lastVpos = -1;
    this.preRendering(parsedData, options.drawAllImageOnLoad);
    this.fpsCount = 0;
    this.fps = 0;
    window.setInterval(() => {
      this.fps = this.fpsCount * (1000 / config.fpsInterval);
      this.fpsCount = 0;
    }, config.fpsInterval);
    logger(`constructor complete: ${performance.now() - constructorStart}ms`);
  }

  /**
   * 事前に当たり判定を考慮してコメントの描画場所を決定する
   * @param {any[]} rawData
   * @param {boolean} drawAll - 読み込み時にすべてのコメント画像を生成する
   * ※読み込み時めちゃくちゃ重くなるので途中で絶対にカクついてほしくないという場合以外は非推奨
   */
  preRendering(rawData: formattedComment[], drawAll: boolean) {
    const preRenderingStart = performance.now();
    if (options.keepCA) {
      rawData = changeCALayer(rawData);
    }
    const parsedData: parsedComment[] = this.getCommentPos(
      this.getCommentSize(this.getFont(rawData)) as parsedComment[]
    );
    this.data = this.sortComment(parsedData);
    if (drawAll) {
      parsedData.forEach((_, key) => this.getTextImage(Number(key), true));
    }
    logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
  }

  /**
   * コマンドをもとに各コメントに適用するフォントを決定する
   */
  getFont(parsedData: formattedComment[]): formattedCommentWithFont[] {
    const getFontStart = performance.now();
    const result: formattedCommentWithFont[] = [];
    for (const value of parsedData) {
      value.content = value.content.replace(/\t/g, "\u2003\u2003");
      result.push(this.parseCommandAndNicoscript(value));
    }
    logger(`getFont complete: ${performance.now() - getFontStart}ms`);
    return result;
  }

  /**
   * コメントの描画サイズを計算する
   */
  getCommentSize(
    parsedData: formattedCommentWithFont[]
  ): formattedCommentWithSize[] {
    const getCommentSizeStart = performance.now();
    const groupedData = groupBy(parsedData);
    const result: formattedCommentWithSize[] = [];

    for (const font of Object.keys(groupedData) as commentFont[]) {
      for (const fontSize of Object.keys(groupedData[font])) {
        const value = groupedData[font][fontSize];
        if (!value) continue;
        this.context.font = parseFont(font, fontSize);
        for (const comment of value) {
          if (comment.invisible) {
            continue;
          }
          const measure = this.measureText(comment);
          const size = parsedData[comment.index] as formattedCommentWithSize;
          if (options.scale !== 1 && size.layer === -1) {
            measure.height *= options.scale;
            measure.width *= options.scale;
            measure.width_max *= options.scale;
            measure.width_min *= options.scale;
            measure.fontSize *= options.scale;
          }
          size.height = measure.height;
          size.width = measure.width;
          size.width_max = measure.width_max;
          size.width_min = measure.width_min;
          size.lineHeight = measure.lineHeight;
          size.fontSize = measure.fontSize;
          size.content = measure.content;
          if (measure.resized) {
            this.context.font = parseFont(font, fontSize);
          }
          result[comment.index] = size;
        }
      }
    }
    logger(
      `getCommentSize complete: ${performance.now() - getCommentSizeStart}ms`
    );
    return result;
  }

  /**
   * 計算された描画サイズをもとに各コメントの配置位置を決定する
   */
  getCommentPos(data: parsedComment[]) {
    const getCommentPosStart = performance.now();
    data.forEach((comment, index) => {
      if (comment.invisible) return;
      if (comment.loc === "naka") {
        let posY = 0;
        const beforeVpos =
          Math.round(
            -288 / ((1632 + comment.width_max) / (comment.long + 125))
          ) - 100;
        if (config.canvasHeight < comment.height) {
          posY = (comment.height - config.canvasHeight) / -2;
        } else {
          let isBreak = false,
            isChanged = true,
            count = 0;
          while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (let j = beforeVpos; j < comment.long + 125; j++) {
              const vpos = comment.vpos + j;
              const left_pos = getPosX(
                comment.width_max,
                j,
                comment.long,
                comment.flash
              );
              if (
                left_pos + comment.width_max >= config.collisionRange.right &&
                left_pos <= config.collisionRange.right
              ) {
                const result = getPosY(
                  posY,
                  comment,
                  this.collision.right[vpos],
                  data
                );
                posY = result.currentPos;
                isChanged = result.isChanged;
                isBreak = result.isBreak;
                if (isBreak) break;
              }
              if (
                left_pos + comment.width_max >= config.collisionRange.left &&
                left_pos <= config.collisionRange.left
              ) {
                const result = getPosY(
                  posY,
                  comment,
                  this.collision.left[vpos],
                  data
                );
                posY = result.currentPos;
                isChanged = result.isChanged;
                isBreak = result.isBreak;
                if (isBreak) break;
              }
            }
            if (isBreak) {
              break;
            }
          }
        }
        for (let j = beforeVpos; j < comment.long + 125; j++) {
          const vpos = comment.vpos + j;
          const left_pos = getPosX(
            comment.width_max,
            j,
            comment.long,
            comment.flash
          );
          arrayPush(this.timeline, vpos, index);
          if (left_pos + comment.width_max >= config.collisionRange.right) {
            arrayPush(this.collision.right, vpos, index);
          }
          if (left_pos <= config.collisionRange.left) {
            arrayPush(this.collision.left, vpos, index);
          }
        }
        comment.posY = posY;
      } else {
        let posY = 0,
          isChanged = true,
          count = 0,
          collision: collisionItem;
        if (comment.loc === "ue") {
          collision = this.collision.ue;
        } else {
          collision = this.collision.shita;
        }
        while (isChanged && count < 10) {
          isChanged = false;
          count++;
          for (let j = 0; j < comment.long; j++) {
            const result = getPosY(
              posY,
              comment,
              collision[comment.vpos + j],
              data
            );
            posY = result.currentPos;
            isChanged = result.isChanged;
            if (result.isBreak) break;
          }
        }
        for (let j = 0; j < comment.long; j++) {
          const vpos = comment.vpos + j;
          arrayPush(this.timeline, vpos, index);
          if (j > comment.long - 20) continue;
          if (comment.loc === "ue") {
            arrayPush(this.collision.ue, vpos, index);
          } else {
            arrayPush(this.collision.shita, vpos, index);
          }
        }
        comment.posY = posY;
      }
    });
    logger(
      `getCommentPos complete: ${performance.now() - getCommentPosStart}ms`
    );
    return data;
  }

  /**
   * 投稿者コメントを前に移動
   */
  sortComment(parsedData: parsedComment[]) {
    const sortCommentStart = performance.now();
    for (const vpos of Object.keys(this.timeline)) {
      const item = this.timeline[Number(vpos)];
      if (!item) continue;
      const owner = [],
        user = [];
      for (const index of item) {
        if (parsedData[index]?.owner) {
          owner.push(index);
        } else {
          user.push(index);
        }
      }
      this.timeline[Number(vpos)] = owner.concat(user);
    }
    logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
    return parsedData;
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param comment - 独自フォーマットのコメントデータ
   * @returns {{resized: boolean, width: number, width_max: number, fontSize: number, width_min: number, height: number, lineHeight: number}} - 描画サイズとリサイズの情報
   */
  measureText(comment: measureTextInput): measureTextResult {
    const configLineHeight = getConfig(config.lineHeight, comment.flash),
      configFontSize = getConfig(config.fontSize, comment.flash),
      configDoubleResizeMaxWidth = getConfig(config.doubleResizeMaxWidth);
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
    const width = width_arr.reduce((p, c) => p + c, 0) / width_arr.length;
    let width_max = Math.max(...width_arr);
    const width_min = Math.min(...width_arr),
      height =
        comment.fontSize *
          comment.lineHeight *
          (1 + getConfig(config.commentYPaddingTop, comment.flash)) *
          lineCount +
        getConfig(config.commentYMarginBottom, comment.flash) *
          comment.fontSize;
    if (comment.loc !== "naka" && !comment.resizedY) {
      if (
        (comment.full && width_max > 1920) ||
        (!comment.full && width_max > 1440)
      ) {
        while (width_max > (comment.full ? 1920 : 1440)) {
          width_max /= 1.331;
          comment.fontSize -= 3;
          console.log(comment);
        }
        comment.resized = true;
        comment.resizedX = true;
        this.context.font = parseFont(comment.font, comment.fontSize);
        return this.measureText(comment);
      }
    } else if (
      comment.loc !== "naka" &&
      comment.resizedY &&
      ((comment.full && width_max > 2120) ||
        (!comment.full && width_max > 1440)) &&
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
    return {
      width: width,
      width_max: width_max,
      width_min: width_min,
      height: height,
      resized: !!comment.resized,
      fontSize: comment.fontSize,
      lineHeight: comment.lineHeight,
      content: comment.content as commentMeasuredContentItem[],
    };
  }

  /**
   * コマンドをもとに所定の位置に事前に生成したコメントを表示する
   * @param comment - 独自フォーマットのコメントデータ
   * @param {number} vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   */
  drawText(comment: parsedComment, vpos: number) {
    let reverse = false;
    for (const range of this.nicoScripts.reverse) {
      if (
        (range.target === "コメ" && comment.owner) ||
        (range.target === "投コメ" && !comment.owner)
      )
        break;
      if (range.start < vpos && vpos < range.end) {
        reverse = true;
      }
    }
    for (const range of this.nicoScripts.ban) {
      if (range.start < vpos && vpos < range.end) return;
    }
    let posX = (config.canvasWidth - comment.width_max) / 2,
      posY = comment.posY;
    if (comment.loc === "naka") {
      if (reverse) {
        posX =
          config.canvasWidth +
          comment.width_max -
          getPosX(
            comment.width_max,
            vpos - comment.vpos,
            comment.long,
            comment.flash
          );
      } else {
        posX = getPosX(
          comment.width_max,
          vpos - comment.vpos,
          comment.long,
          comment.flash
        );
      }
      if (posX > config.canvasWidth || posX + comment.width_max < 0) {
        return;
      }
    } else if (comment.loc === "shita") {
      posY = config.canvasHeight - comment.posY - comment.height;
    }
    if (comment.image && comment.image !== true) {
      this.context.drawImage(comment.image, posX, posY);
    }
    if (this.showCollision) {
      this.context.strokeStyle = "rgba(0,255,255,1)";
      this.context.strokeRect(posX, posY, comment.width_max, comment.height);
      for (let i = 0; i < comment.lineCount; i++) {
        const linePosY =
          (Number(i) + 1) *
          (comment.fontSize * comment.lineHeight) *
          (1 + getConfig(config.commentYPaddingTop));
        this.context.strokeStyle = "rgba(255,255,0,0.5)";
        this.context.strokeRect(
          posX,
          posY + linePosY,
          comment.width_max,
          comment.fontSize * comment.lineHeight * -1
        );
      }
    }
    if (isDebug) {
      const font = this.context.font;
      const fillStyle = this.context.fillStyle;
      this.context.font = parseFont("defont", 30);
      this.context.fillStyle = "#ff00ff";
      this.context.fillText(comment.mail.join(","), posX, posY + 30);
      this.context.font = font;
      this.context.fillStyle = fillStyle;
    }
  }

  /**
   * drawTextで毎回fill/strokeすると重いので画像化して再利用できるようにする
   * @param {number} i - コメントデータのインデックス
   * @param preRendering
   */
  getTextImage(i: number, preRendering = false) {
    const value = this.data[i];
    if (!value || value.invisible) return;
    const cacheKey =
        JSON.stringify(value.content) +
        "@@@" +
        [...value.mail].sort().join(","),
      cache = this.cacheIndex[cacheKey];
    if (cache) {
      const image = this.data[cache]?.image;
      if (image) {
        this.cacheIndex[cacheKey] = i;
        value.image = image;
        setTimeout(() => {
          if (value.image) {
            delete value.image;
          }
          if (this.cacheIndex[cacheKey] === i) {
            delete this.cacheIndex[cacheKey];
          }
        }, value.long * 10 + config.cacheAge);
        return;
      }
    }
    const image = document.createElement("canvas");
    image.width = value.width_max;
    image.height = value.height;
    const context = image.getContext("2d");
    if (!context) throw new Error("Fail to get CanvasRenderingContext2D");
    context.strokeStyle = `rgba(${hex2rgb(
      value.color === "#000000"
        ? config.contextStrokeInversionColor
        : config.contextStrokeColor
    ).join(",")},${config.contextStrokeOpacity})`;
    context.textAlign = "start";
    context.textBaseline = "alphabetic";
    context.lineWidth = 4;
    context.font = parseFont(value.font, value.fontSize);
    if (value._live) {
      context.fillStyle = `rgba(${hex2rgb(value.color).join(",")},${
        config.contextFillLiveOpacity
      })`;
    } else {
      context.fillStyle = value.color;
    }
    let lastFont = value.font,
      leftOffset = 0,
      lineOffset = value.lineOffset;
    for (let i = 0; i < value.content.length; i++) {
      const item = value.content[i];
      if (!item) continue;
      if (lastFont !== (item.font || value.font)) {
        lastFont = item.font || value.font;
        context.font = parseFont(lastFont, value.fontSize);
      }
      const lines = item.content.split("\n");
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line === undefined) continue;
        const posY =
          (lineOffset + 1) *
          (value.fontSize * value.lineHeight) *
          (1 + getConfig(config.commentYPaddingTop, value.flash));
        context.strokeText(line, leftOffset, posY);
        context.fillText(line, leftOffset, posY);
        if (j < lines.length - 1) {
          leftOffset = 0;
          lineOffset += 1;
        } else {
          leftOffset += item.width[j] || 0;
        }
      }
    }
    value.image = image;
    this.cacheIndex[cacheKey] = i;
    if (preRendering) return;
    setTimeout(() => {
      if (value.image) {
        delete value.image;
      }
      if (this.cacheIndex[cacheKey] === i) {
        delete this.cacheIndex[cacheKey];
      }
    }, value.long * 10 + config.cacheAge);
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
        result.fontSize = getConfig(config.fontSize)[command].default;
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
      ),
      isFlash = isFlashComment(comment);
    if (nicoscript && comment.owner) {
      const reverse = comment.content.match(/^@逆 ?(全|コメ|投コメ)?/);
      const content = comment.content.split(""),
        result = [];
      let quote = "",
        last_i = "",
        string = "";
      switch (nicoscript[1]) {
        case "デフォルト":
          this.nicoScripts.default.unshift({
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
          this.nicoScripts.reverse.unshift({
            start: comment.vpos,
            end: comment.vpos + data.long * 100,
            target: reverse[1],
          });
          break;
        case "コメント禁止":
          if (data.long === undefined) {
            data.long = 30;
          }
          this.nicoScripts.ban.unshift({
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
          this.nicoScripts.replace.unshift({
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
          this.nicoScripts.replace.sort((a, b) => {
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
    for (let i = 0; i < this.nicoScripts.default.length; i++) {
      const item = this.nicoScripts.default[i];
      if (!item) continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        this.nicoScripts.default = this.nicoScripts.default.splice(
          Number(i),
          1
        );
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
    for (let i = 0; i < this.nicoScripts.replace.length; i++) {
      const item = this.nicoScripts.replace[i];
      if (!item) continue;
      if (item.long !== undefined && item.start + item.long < comment.vpos) {
        this.nicoScripts.default = this.nicoScripts.default.splice(
          Number(i),
          1
        );
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
      data.fontSize = getConfig(config.fontSize)[data.size].default;
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
    if (isFlash) {
      const parts = Array.from(
        comment.content.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) || []
      );
      const regex = {
        simsunStrong: new RegExp(config.flashChar.simsunStrong),
        simsunWeak: new RegExp(config.flashChar.simsunWeak),
        gulim: new RegExp(config.flashChar.gulim),
        gothic: new RegExp(config.flashChar.gothic),
      };
      const getFontName = (font: string) =>
        font.match("^simsun.+")
          ? "simsun"
          : font === "gothic"
          ? "defont"
          : (font as commentFlashFont);
      for (const part of parts) {
        if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
          content.push({ content: part });
          continue;
        }
        const index: commentContentIndex[] = [];
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
        if (index.length === 0) {
          content.push({ content: part });
        } else if (index.length === 1 && index[0]) {
          content.push({ content: part, font: getFontName(index[0].font) });
        } else {
          index.sort((a, b) => {
            if (a.index > b.index) {
              return 1;
            } else if (a.index < b.index) {
              return -1;
            } else {
              return 0;
            }
          });
          if (config.flashMode === "xp") {
            let offset = 0;
            for (let i = 1; i < index.length; i++) {
              const currentVal = index[i],
                lastVal = index[i - 1];
              if (currentVal === undefined || lastVal === undefined) continue;
              content.push({
                content: part.slice(offset, currentVal.index),
                font: getFontName(lastVal.font),
              });
              offset = currentVal.index;
            }
            const val = index[index.length - 1];
            if (val)
              content.push({
                content: part.slice(offset),
                font: getFontName(val.font),
              });
          } else {
            const firstVal = index[0],
              secondVal = index[1];
            if (!firstVal || !secondVal) {
              content.push({ content: part });
              continue;
            }
            if (firstVal.font !== "gothic") {
              content.push({ content: part, font: getFontName(firstVal.font) });
            } else {
              content.push({
                content: part.slice(0, secondVal.index),
                font: getFontName(firstVal.font),
              });
              content.push({
                content: part.slice(secondVal.index),
                font: getFontName(secondVal.font),
              });
            }
          }
        }
      }
      const val = content[0];
      if (val && val.font) {
        data.font = val.font;
      }
    } else {
      content.push({ content: comment.content });
    }
    const lineCount = content.reduce((pv, val) => {
      return pv + (val.content.match(/\n/g)?.length || 0);
    }, 1);
    const lineOffset = isFlash
      ? (comment.content.match(new RegExp(config.flashScriptChar.super, "g"))
          ?.length || 0) *
          -0.1 +
        (comment.content.match(new RegExp(config.flashScriptChar.sub, "g"))
          ?.length || 0) *
          0.1
      : 0;
    return {
      ...comment,
      content,
      lineCount,
      lineOffset,
      ...data,
      flash: isFlash,
    } as formattedCommentWithFont;
  }

  /**
   * キャンバスを描画する
   * @param vpos - 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
   * @param forceRendering
   */
  drawCanvas(vpos: number, forceRendering = false) {
    const drawCanvasStart = performance.now();
    if (this.lastVpos === vpos && !forceRendering) return;
    this.lastVpos = vpos;
    this.fpsCount++;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.video) {
      let scale;
      const height = this.canvas.height / this.video.videoHeight,
        width = this.canvas.width / this.video.videoWidth;
      if (this.enableLegacyPiP ? height > width : height < width) {
        scale = width;
      } else {
        scale = height;
      }
      const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5,
        offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
      this.context.drawImage(
        this.video,
        offsetX,
        offsetY,
        this.video.videoWidth * scale,
        this.video.videoHeight * scale
      );
    }
    const timelineRange = this.timeline[vpos];
    if (timelineRange) {
      for (const index of timelineRange) {
        const comment = this.data[index];
        if (!comment || comment.invisible) {
          continue;
        }
        if (comment.image === undefined) {
          this.getTextImage(index);
        }
        try {
          this.drawText(comment, vpos);
        } catch (e) {
          comment.image = false;
        }
      }
    }
    if (this.showFPS) {
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor
      ).join(",")},${config.contextStrokeOpacity})`;
      this.context.strokeText(`FPS:${this.fps}`, 100, 100);
      this.context.fillText(`FPS:${this.fps}`, 100, 100);
    }
    if (this.showCommentCount) {
      this.context.font = parseFont("defont", 60);
      this.context.fillStyle = "#00FF00";
      this.context.strokeStyle = `rgba(${hex2rgb(
        config.contextStrokeColor
      ).join(",")},${config.contextStrokeOpacity})`;
      if (timelineRange) {
        this.context.strokeText(`Count:${timelineRange.length}`, 100, 200);
        this.context.fillText(`Count:${timelineRange.length}`, 100, 200);
      } else {
        this.context.strokeText("Count:0", 100, 200);
        this.context.fillText("Count:0", 100, 200);
      }
    }
    logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
  }

  /**
   * キャンバスを消去する
   */
  public clear() {
    this.context.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
  }
}

const logger = (msg: string) => {
  if (isDebug) console.debug(msg);
};

export default NiconiComments;
