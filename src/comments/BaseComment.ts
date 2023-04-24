import type {
  formattedComment,
  formattedCommentWithSize,
  IComment,
} from "@/@types/";
import {
  formattedCommentWithFont,
  measureTextInput,
  measureTextResult,
} from "@/@types/";
import { imageCache } from "@/contexts";
import { config } from "@/definition/config";
import { CanvasRenderingContext2DError, NotImplementedError } from "@/errors/";
import { getPosX, isBanActive, isReverseActive, parseFont } from "@/utils";

/**
 * コメントの描画を行うクラスの基底クラス
 */
class BaseComment implements IComment {
  protected readonly context: CanvasRenderingContext2D;
  protected readonly cacheKey: string;
  public comment: formattedCommentWithSize;
  public posY: number;
  public readonly pluginName: string = "BaseComment";
  public image?: HTMLCanvasElement | null;

  /**
   * コンストラクタ
   * @param {formattedComment} comment 処理対象のコメント
   * @param {CanvasRenderingContext2D} context 描画対象のcanvasのcontext
   */
  constructor(comment: formattedComment, context: CanvasRenderingContext2D) {
    this.context = context;
    this.posY = 0;
    comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
    this.comment = this.convertComment(comment);
    this.cacheKey =
      JSON.stringify(this.comment.content) +
      `@@${this.pluginName}@@` +
      [...this.comment.mail].sort().join(",");
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

  /**
   * コメントの描画サイズを計算する
   * @param {formattedCommentWithFont} parsedData コメント
   * @returns {formattedCommentWithSize} 描画サイズを含むコメント
   * @protected
   */
  protected getCommentSize(
    parsedData: formattedCommentWithFont
  ): formattedCommentWithSize {
    console.error("getCommentSize method is not implemented", parsedData);
    throw new NotImplementedError(this.pluginName, "getCommentSize");
  }

  /**
   * context.measureTextの複数行対応版
   * 画面外にはみ出すコメントの縮小も行う
   * @param {measureTextInput} comment - 独自フォーマットのコメントデータ
   * @returns {measureTextResult} - 描画サイズとリサイズの情報
   * @protected
   */
  protected measureText(comment: measureTextInput): measureTextResult {
    console.error("measureText method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "measureText");
  }

  /**
   * サイズ計測などを行うためのラッパー関数
   * @param {formattedComment} comment コンストラクタで受け取ったコメント
   * @returns {formattedCommentWithSize} 描画サイズを含むコメント
   * @protected
   */
  protected convertComment(
    comment: formattedComment
  ): formattedCommentWithSize {
    console.error("convertComment method is not implemented", comment);
    throw new NotImplementedError(this.pluginName, "convertComment");
  }

  /**
   * コメントを描画する
   * @param {number} vpos
   * @param {boolean} showCollision
   * @param {boolean} debug
   * @public
   */
  public draw(vpos: number, showCollision: boolean, debug: boolean) {
    if (isBanActive(vpos)) return;
    const reverse = isReverseActive(vpos, this.comment.owner);
    const posX = getPosX(this.comment, vpos, reverse);
    const posY =
      this.comment.loc === "shita"
        ? config.canvasHeight - this.posY - this.comment.height
        : this.posY;
    this._draw(posX, posY);
    this._drawRectColor(posX, posY);
    this._drawCollision(posX, posY, showCollision);
    this._drawDebugInfo(posX, posY, debug);
  }

  /**
   * コメント本体を描画する
   * @param {number} posX 描画位置
   * @param {number} posY 描画位置
   * @protected
   */
  protected _draw(posX: number, posY: number) {
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
  }

  /**
   * 枠コマンドで指定されている場合に枠を描画する
   * @param {number} posX 描画位置
   * @param {number} posY 描画位置
   * @protected
   */
  protected _drawRectColor(posX: number, posY: number) {
    if (this.comment.wakuColor) {
      this.context.strokeStyle = this.comment.wakuColor;
      this.context.strokeRect(
        posX,
        posY,
        this.comment.width,
        this.comment.height
      );
    }
  }

  /**
   * コメントのメタデータを描画する
   * @param {number} posX 描画位置
   * @param {number} posY 描画位置
   * @param {boolean} debug デバッグモードかどうか
   * @protected
   */
  protected _drawDebugInfo(posX: number, posY: number, debug: boolean) {
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
   * コメントの当たり判定を描画する
   * @param {number} posX 描画位置
   * @param {number} posY 描画位置
   * @param {boolean} showCollision 当たり判定を表示するかどうか
   * @protected
   */
  protected _drawCollision(posX: number, posY: number, showCollision: boolean) {
    console.error(
      "_drawCollision method is not implemented",
      posX,
      posY,
      showCollision
    );
    throw new NotImplementedError(this.pluginName, "_drawCollision");
  }

  /**
   * コメントの画像を生成する
   * @protected
   */
  protected getTextImage(): HTMLCanvasElement | null {
    if (
      this.comment.invisible ||
      (this.comment.lineCount === 1 && this.comment.width === 0) ||
      this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
        0
    )
      return null;
    const cache = imageCache[this.cacheKey];
    if (cache) {
      this.image = cache.image;
      window.setTimeout(() => {
        delete this.image;
      }, this.comment.long * 10 + config.cacheAge);
      clearTimeout(cache.timeout);
      cache.timeout = window.setTimeout(() => {
        delete imageCache[this.cacheKey];
      }, this.comment.long * 10 + config.cacheAge);
      return cache.image;
    }
    if (this.image) return this.image;
    const image = this._generateTextImage();
    this._cacheImage(image);
    return image;
  }

  /**
   * コメントの画像を実際に生成する
   * @protected
   */
  protected _generateTextImage(): HTMLCanvasElement {
    console.error("_generateTextImage method is not implemented");
    throw new NotImplementedError(this.pluginName, "_generateTextImage");
  }

  /**
   * 画像をキャッシュする
   * @param {HTMLCanvasElement} image
   * @protected
   */
  protected _cacheImage(image: HTMLCanvasElement) {
    this.image = image;
    window.setTimeout(() => {
      delete this.image;
    }, this.comment.long * 10 + config.cacheAge);
    imageCache[this.cacheKey] = {
      timeout: window.setTimeout(() => {
        delete imageCache[this.cacheKey];
      }, this.comment.long * 10 + config.cacheAge),
      image,
    };
  }

  /**
   * Canvasを生成する
   */
  protected createCanvas(): {
    image: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
  } {
    const image = document.createElement("canvas");
    const context = image.getContext("2d");
    if (!context) throw new CanvasRenderingContext2DError();
    return {
      image,
      context,
    };
  }
}

export { BaseComment };
