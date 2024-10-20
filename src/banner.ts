import { WEB_APP_IMAGE_URL, WEB_APP_WRITE_URL } from "./main";

export enum BannerType {
  Letter = "Letter",
  Noun = "Noun",
  Verb = "Verb",
  Adjective = "Adjective",
  Pronoun = "Pronoun",
  Particle = "Particle",
  Conjunction = "Conjunction",
  Number = "Number",
  Name = "Name",
  Other = "Other",
  Punctuation = "Punctuation",
  Misc = "Misc",
  None = "None",
}

export interface IBanner {
  name: string;
  code: string;
  type: BannerType;
}

/* export class BannerTextParser {
  static parse(code: string): BannerText {
    const segments = code.split('.');
    if (segments.length === 2) {
      return new Banner({
        name: 'untitled',
        base: segments[0],
        layers: segments[1],
      })
    }
    return new BannerGroup('untitled', )
  }
}  */

export class Banner implements IBanner {
  public name: string;

  get base() {
    return this.code.split(".").first();
  }

  get layers() {
    return this.code.split(".").slice(1).join(".");
  }

  get imageUrl() {
    return `${WEB_APP_IMAGE_URL}/${this.code}.png`;
  }
  set imageUrl(url: string) {
    const newCode = url.split("/").last()?.slice(0, -4);
    if (newCode) {
      this.code = newCode;
    }
  }

  get writeUrl() {
    return WEB_APP_WRITE_URL + this.code;
  }
  set writeUrl(url: string) {
    const newCode = url.match(/.+\?writing=(.+)$/)?.groups?.[0];
    if (newCode) {
      this.code = newCode;
    }
  }

  constructor(name: string, code: string, type: BannerType);
  constructor(banner: IBanner);
  constructor(
    name_banner: string | IBanner,
    public code: string = "L.A",
    public type: BannerType = BannerType.None
  ) {
    if (typeof name_banner === "string") {
      this.name = name_banner;
    } else {
      if (name_banner instanceof Banner)
        console.warn("provided banner is not IBanner");
      this.name = name_banner.name;
      this.code = name_banner.code;
      this.type = name_banner.type;
    }
  }

  toImg(): HTMLImageElement {
    return createEl("img", { attr: { src: this.imageUrl } });
  }

  static join(...banners: Banner[]): string {
    const segments: string[] = [];
    let currentBase: string | undefined;
    banners.forEach((banner) => {
      if (!currentBase || currentBase !== banner.base) {
        currentBase = banner.base;
        if (currentBase) segments.push(currentBase);
      }
      segments.push(banner.layers);
    });
    console.log(
      banners.map((b) => b.code),
      "->",
      segments
    );
    return segments.join("0.");
  }

  export(): IBanner {
    return {
      name: this.name,
      code: this.code,
      type: this.type,
    };
  }
}
